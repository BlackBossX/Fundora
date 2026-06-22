<?php
require 'db.php';
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$user_id = (int)$_SESSION['user_id'];
$action = $_GET['action'] ?? '';
$validCategories = ['Emergency','Education','Travel','Technology','Vehicle','Home','Investment','Other'];
$validPriorities = ['High','Medium','Low'];
$validStatuses = ['Active','Completed','Paused','Cancelled'];
$validContributionTypes = ['Deposit','NetTransfer','Withdrawal'];

function bodyInput() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        return json_decode(file_get_contents('php://input'), true) ?: [];
    }
    return $_POST;
}

function goalBelongsToUser($pdo, $goalId, $userId) {
    $stmt = $pdo->prepare("SELECT id FROM savings_goals WHERE id = ? AND user_id = ?");
    $stmt->execute([$goalId, $userId]);
    return (bool)$stmt->fetchColumn();
}

function availableNetAmount($pdo, $userId, $excludeContributionId = 0) {
    $incomeStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = ?");
    $incomeStmt->execute([$userId]);
    $income = (float)$incomeStmt->fetchColumn();

    $expenseStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ?");
    $expenseStmt->execute([$userId]);
    $expenses = (float)$expenseStmt->fetchColumn();

    $sql = "SELECT COALESCE(SUM(
                CASE WHEN type = 'NetTransfer' THEN amount
                     WHEN type = 'Withdrawal' THEN -amount
                     ELSE 0 END
            ), 0) FROM goal_contributions
            WHERE user_id = ? AND type IN ('NetTransfer','Withdrawal')";
    $params = [$userId];
    if ($excludeContributionId > 0) {
        $sql .= " AND id <> ?";
        $params[] = $excludeContributionId;
    }
    $transferStmt = $pdo->prepare($sql);
    $transferStmt->execute($params);
    $transfers = (float)$transferStmt->fetchColumn();

    return max(0, $income - $expenses - $transfers);
}

function currentMonthGoalCashMovement($pdo, $userId) {
    $stmt = $pdo->prepare(
        "SELECT COALESCE(SUM(
            CASE WHEN type = 'NetTransfer' THEN amount
                 WHEN type = 'Withdrawal' THEN -amount
                 ELSE 0 END
         ), 0) FROM goal_contributions
         WHERE user_id = ? AND type IN ('NetTransfer','Withdrawal')
           AND YEAR(contribution_date) = YEAR(CURDATE())
           AND MONTH(contribution_date) = MONTH(CURDATE())"
    );
    $stmt->execute([$userId]);
    return (float)$stmt->fetchColumn();
}

function nextMonthlyDate($date, $day) {
    $next = new DateTime($date);
    $next->modify('first day of next month');
    $lastDay = (int)$next->format('t');
    $next->setDate((int)$next->format('Y'), (int)$next->format('m'), min($day, $lastDay));
    return $next->format('Y-m-d');
}

function initialAutoDate($day) {
    $today = new DateTime('today');
    $lastDay = (int)$today->format('t');
    $candidate = new DateTime($today->format('Y-m-') . str_pad((string)min($day, $lastDay), 2, '0', STR_PAD_LEFT));
    if ($candidate < $today) {
        return nextMonthlyDate($candidate->format('Y-m-d'), $day);
    }
    return $candidate->format('Y-m-d');
}

function processAutomaticContributions($pdo, $userId) {
    $stmt = $pdo->prepare(
        "SELECT id, auto_contribution_amount, auto_contribution_day, next_auto_contribution_date
         FROM savings_goals
         WHERE user_id = ? AND status = 'Active'
           AND auto_contribution_amount > 0
           AND next_auto_contribution_date IS NOT NULL
           AND next_auto_contribution_date <= CURDATE()"
    );
    $stmt->execute([$userId]);
    $goals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $insert = $pdo->prepare(
        "INSERT INTO goal_contributions (goal_id, user_id, type, amount, contribution_date, notes)
         VALUES (?, ?, 'Automatic', ?, ?, 'Scheduled monthly contribution')"
    );
    $update = $pdo->prepare(
        "UPDATE savings_goals SET next_auto_contribution_date = ? WHERE id = ? AND user_id = ?"
    );

    foreach ($goals as $goal) {
        $dueDate = $goal['next_auto_contribution_date'];
        while ($dueDate <= date('Y-m-d')) {
            $insert->execute([$goal['id'], $userId, $goal['auto_contribution_amount'], $dueDate]);
            $dueDate = nextMonthlyDate($dueDate, (int)$goal['auto_contribution_day']);
        }
        $update->execute([$dueDate, $goal['id'], $userId]);
    }
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'fetch_all') {
        $pdo->beginTransaction();
        processAutomaticContributions($pdo, $user_id);
        $pdo->commit();

        $goalStmt = $pdo->prepare(
            "SELECT g.*,
                COALESCE(SUM(CASE WHEN c.type = 'Withdrawal' THEN -c.amount ELSE c.amount END), 0) AS saved_amount
             FROM savings_goals g
             LEFT JOIN goal_contributions c ON c.goal_id = g.id
             WHERE g.user_id = ?
             GROUP BY g.id
             ORDER BY FIELD(g.status, 'Active','Paused','Completed','Cancelled'),
                      FIELD(g.priority, 'High','Medium','Low'), g.target_date ASC"
        );
        $goalStmt->execute([$user_id]);
        $goals = $goalStmt->fetchAll(PDO::FETCH_ASSOC);

        $contributionStmt = $pdo->prepare(
            "SELECT c.* FROM goal_contributions c
             INNER JOIN savings_goals g ON g.id = c.goal_id
             WHERE c.user_id = ? AND g.user_id = ?
             ORDER BY c.contribution_date DESC, c.id DESC"
        );
        $contributionStmt->execute([$user_id, $user_id]);
        $contributions = $contributionStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "goals" => $goals,
            "contributions" => $contributions,
            "available_net_amount" => availableNetAmount($pdo, $user_id),
            "current_month_goal_cash_movement" => currentMonthGoalCashMovement($pdo, $user_id)
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Invalid method"]);
        exit;
    }

    $input = bodyInput();

    if ($action === 'create_goal' || $action === 'update_goal') {
        $goalId = (int)($input['id'] ?? 0);
        $name = trim($input['name'] ?? '');
        $category = in_array($input['category'] ?? '', $validCategories, true) ? $input['category'] : 'Other';
        $targetAmount = (float)($input['target_amount'] ?? 0);
        $targetDate = $input['target_date'] ?? '';
        $priority = in_array($input['priority'] ?? '', $validPriorities, true) ? $input['priority'] : 'Medium';
        $description = trim($input['description'] ?? '');
        $status = in_array($input['status'] ?? '', $validStatuses, true) ? $input['status'] : 'Active';
        $autoAmount = max(0, (float)($input['auto_contribution_amount'] ?? 0));
        $autoDay = min(28, max(1, (int)($input['auto_contribution_day'] ?? 1)));

        if ($name === '' || $targetAmount <= 0 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $targetDate)) {
            echo json_encode(["success" => false, "message" => "Name, target amount, and target date are required"]);
            exit;
        }

        $nextAutoDate = $autoAmount > 0 ? initialAutoDate($autoDay) : null;

        if ($action === 'create_goal') {
            $stmt = $pdo->prepare(
                "INSERT INTO savings_goals
                 (user_id, name, category, target_amount, target_date, priority, description, status,
                  auto_contribution_amount, auto_contribution_day, next_auto_contribution_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $user_id, $name, $category, $targetAmount, $targetDate, $priority, $description,
                $status, $autoAmount, $autoDay, $nextAutoDate
            ]);
            echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
            exit;
        }

        if (!goalBelongsToUser($pdo, $goalId, $user_id)) {
            echo json_encode(["success" => false, "message" => "Goal not found"]);
            exit;
        }

        $existing = $pdo->prepare("SELECT auto_contribution_amount, auto_contribution_day, next_auto_contribution_date FROM savings_goals WHERE id = ?");
        $existing->execute([$goalId]);
        $old = $existing->fetch(PDO::FETCH_ASSOC);
        if ($autoAmount > 0 && (float)$old['auto_contribution_amount'] === $autoAmount && (int)$old['auto_contribution_day'] === $autoDay) {
            $nextAutoDate = $old['next_auto_contribution_date'];
        }

        $stmt = $pdo->prepare(
            "UPDATE savings_goals SET name=?, category=?, target_amount=?, target_date=?, priority=?,
             description=?, status=?, auto_contribution_amount=?, auto_contribution_day=?,
             next_auto_contribution_date=? WHERE id=? AND user_id=?"
        );
        $stmt->execute([
            $name, $category, $targetAmount, $targetDate, $priority, $description, $status,
            $autoAmount, $autoDay, $nextAutoDate, $goalId, $user_id
        ]);
        echo json_encode(["success" => true]);
        exit;
    }

    if ($action === 'delete_goal') {
        $stmt = $pdo->prepare("DELETE FROM savings_goals WHERE id = ? AND user_id = ?");
        $stmt->execute([(int)($input['id'] ?? 0), $user_id]);
        echo json_encode(["success" => true]);
        exit;
    }

    if ($action === 'add_contribution') {
        $goalId = (int)($input['goal_id'] ?? 0);
        $type = in_array($input['type'] ?? '', $validContributionTypes, true) ? $input['type'] : 'Deposit';
        $amount = (float)($input['amount'] ?? 0);
        $date = $input['contribution_date'] ?? date('Y-m-d');
        $notes = trim($input['notes'] ?? '');

        if (!goalBelongsToUser($pdo, $goalId, $user_id) || $amount <= 0) {
            echo json_encode(["success" => false, "message" => "Valid goal and amount are required"]);
            exit;
        }

        if ($type === 'Withdrawal') {
            $balanceStmt = $pdo->prepare(
                "SELECT COALESCE(SUM(CASE WHEN type='Withdrawal' THEN -amount ELSE amount END), 0)
                 FROM goal_contributions WHERE goal_id=? AND user_id=?"
            );
            $balanceStmt->execute([$goalId, $user_id]);
            if ($amount > (float)$balanceStmt->fetchColumn()) {
                echo json_encode(["success" => false, "message" => "Withdrawal exceeds the saved amount"]);
                exit;
            }
        }

        if ($type === 'NetTransfer' && $amount > availableNetAmount($pdo, $user_id)) {
            echo json_encode(["success" => false, "message" => "Amount exceeds your available net amount"]);
            exit;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO goal_contributions (goal_id, user_id, type, amount, contribution_date, notes)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$goalId, $user_id, $type, $amount, $date, $notes]);
        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
        exit;
    }

    if ($action === 'update_contribution') {
        $id = (int)($input['id'] ?? 0);
        $type = in_array($input['type'] ?? '', $validContributionTypes, true) ? $input['type'] : 'Deposit';
        $amount = (float)($input['amount'] ?? 0);
        $date = $input['contribution_date'] ?? date('Y-m-d');
        $notes = trim($input['notes'] ?? '');
        if ($amount <= 0) {
            echo json_encode(["success" => false, "message" => "Amount must be greater than zero"]);
            exit;
        }

        $currentStmt = $pdo->prepare(
            "SELECT c.goal_id FROM goal_contributions c
             INNER JOIN savings_goals g ON g.id = c.goal_id
             WHERE c.id=? AND c.user_id=? AND g.user_id=? AND c.type <> 'Automatic'"
        );
        $currentStmt->execute([$id, $user_id, $user_id]);
        $current = $currentStmt->fetch(PDO::FETCH_ASSOC);
        if (!$current) {
            echo json_encode(["success" => false, "message" => "Contribution not found"]);
            exit;
        }

        if ($type === 'Withdrawal') {
            $balanceStmt = $pdo->prepare(
                "SELECT COALESCE(SUM(CASE WHEN type='Withdrawal' THEN -amount ELSE amount END), 0)
                 FROM goal_contributions WHERE goal_id=? AND user_id=? AND id<>?"
            );
            $balanceStmt->execute([$current['goal_id'], $user_id, $id]);
            if ($amount > (float)$balanceStmt->fetchColumn()) {
                echo json_encode(["success" => false, "message" => "Withdrawal exceeds the saved amount"]);
                exit;
            }
        }

        if ($type === 'NetTransfer' && $amount > availableNetAmount($pdo, $user_id, $id)) {
            echo json_encode(["success" => false, "message" => "Amount exceeds your available net amount"]);
            exit;
        }

        $stmt = $pdo->prepare(
            "UPDATE goal_contributions c
             INNER JOIN savings_goals g ON g.id = c.goal_id
             SET c.type=?, c.amount=?, c.contribution_date=?, c.notes=?
             WHERE c.id=? AND c.user_id=? AND g.user_id=? AND c.type <> 'Automatic'"
        );
        $stmt->execute([$type, $amount, $date, $notes, $id, $user_id, $user_id]);
        echo json_encode(["success" => true]);
        exit;
    }

    if ($action === 'delete_contribution') {
        $stmt = $pdo->prepare(
            "DELETE c FROM goal_contributions c
             INNER JOIN savings_goals g ON g.id = c.goal_id
             WHERE c.id=? AND c.user_id=? AND g.user_id=? AND c.type <> 'Automatic'"
        );
        $stmt->execute([(int)($input['id'] ?? 0), $user_id, $user_id]);
        echo json_encode(["success" => true]);
        exit;
    }

    echo json_encode(["success" => false, "message" => "Invalid action"]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
