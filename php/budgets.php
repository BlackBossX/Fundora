<?php
// php/budgets.php
require 'db.php';
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$user_id = $_SESSION['user_id'];
$action  = $_GET['action'] ?? '';

// ── GET: fetch all budgets for this user ─────────────────────────
if ($_SERVER["REQUEST_METHOD"] === "GET" && $action === "fetch") {
    $stmt = $pdo->prepare("SELECT category, period, amount FROM budgets WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $budgets = [
        "daily" => [],
        "weekly" => [],
        "monthly" => []
    ];
    foreach ($rows as $row) {
        $period = $row['period'];
        if (isset($budgets[$period])) {
            $budgets[$period][$row['category']] = (float)$row['amount'];
        }
    }
    echo json_encode(["success" => true, "budgets" => $budgets]);
    exit;
}

// POST: replace all daily, weekly, and monthly budgets
if ($_SERVER["REQUEST_METHOD"] === "POST" && $action === "save") {
    // Expected: { "budgets": { "daily": {...}, "weekly": {...}, "monthly": {...} } }
    $body = json_decode(file_get_contents("php://input"), true);
    $budgets = $body['budgets'] ?? [];

    $valid_categories = ['Food','Transport','Rent','Entertainment','Health','Education','Other'];
    $valid_periods = ['daily','weekly','monthly'];

    $stmt = $pdo->prepare(
        "INSERT INTO budgets (user_id, category, period, amount)
         VALUES (?, ?, ?, ?)"
    );
    $deleteStmt = $pdo->prepare("DELETE FROM budgets WHERE user_id = ?");

    $pdo->beginTransaction();
    try {
        $deleteStmt->execute([$user_id]);

        foreach ($valid_periods as $period) {
            $periodBudgets = $budgets[$period] ?? [];
            if (!is_array($periodBudgets)) continue;

            foreach ($periodBudgets as $category => $amount) {
                if (!in_array($category, $valid_categories, true)) continue;
                $amount = max(0, (float)$amount);
                if ($amount <= 0) continue;
                $stmt->execute([$user_id, $category, $period, $amount]);
            }
        }
        $pdo->commit();
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid action or method"]);
?>
