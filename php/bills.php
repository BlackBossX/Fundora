<?php
require 'db.php';
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$userId = (int)$_SESSION['user_id'];
$action = $_GET['action'] ?? '';
$categories = ['Utilities','Housing','Internet','Loan','Insurance','Education','Subscription','Other'];
$recurrences = ['One-time','Weekly','Monthly','Quarterly','Yearly','Custom'];

function billInput() {
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    return stripos($type, 'application/json') !== false
        ? (json_decode(file_get_contents('php://input'), true) ?: [])
        : $_POST;
}

function nextBillDueDate($date, $recurrence, $customDays) {
    $next = new DateTime($date);
    if ($recurrence === 'Weekly') $next->modify('+7 days');
    elseif ($recurrence === 'Monthly') $next->modify('+1 month');
    elseif ($recurrence === 'Quarterly') $next->modify('+3 months');
    elseif ($recurrence === 'Yearly') $next->modify('+1 year');
    elseif ($recurrence === 'Custom') $next->modify('+' . max(1, (int)$customDays) . ' days');
    return $next->format('Y-m-d');
}

function billOwned($pdo, $billId, $userId) {
    $stmt = $pdo->prepare("SELECT * FROM bills WHERE id=? AND user_id=?");
    $stmt->execute([$billId, $userId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function billAlerts($bills) {
    $today = new DateTime('today');
    $alerts = [];
    foreach ($bills as $bill) {
        if ($bill['status'] !== 'Active') continue;
        $due = new DateTime($bill['due_date']);
        $days = (int)$today->diff($due)->format('%r%a');
        $offsets = array_values(array_filter(array_map('intval', explode(',', $bill['reminder_offsets'])), fn($v) => $v >= 0));
        $customDates = json_decode($bill['custom_reminder_dates'] ?: '[]', true) ?: [];
        $shouldAlert = $days < 0 || in_array($days, $offsets, true) || in_array($today->format('Y-m-d'), $customDates, true);
        if (!$shouldAlert) continue;
        $type = $days < 0 ? 'overdue' : ($days === 0 ? 'today' : 'upcoming');
        $alerts[] = [
            "bill_id" => (int)$bill['id'], "name" => $bill['name'], "amount" => (float)$bill['amount_due'],
            "due_date" => $bill['due_date'], "days" => $days, "type" => $type
        ];
    }
    return $alerts;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'fetch_all') {
        $stmt = $pdo->prepare("SELECT * FROM bills WHERE user_id=? ORDER BY FIELD(status,'Active','Paid','Cancelled'), due_date ASC");
        $stmt->execute([$userId]);
        $bills = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $payStmt = $pdo->prepare(
            "SELECT p.*, b.name AS bill_name, b.provider
             FROM bill_payments p INNER JOIN bills b ON b.id=p.bill_id
             WHERE p.user_id=? ORDER BY p.payment_date DESC, p.id DESC"
        );
        $payStmt->execute([$userId]);
        $payments = $payStmt->fetchAll(PDO::FETCH_ASSOC);

        $month = date('Y-m');
        $active = array_values(array_filter($bills, fn($b) => $b['status'] === 'Active'));
        $thisMonth = array_values(array_filter($active, fn($b) => substr($b['due_date'], 0, 7) === $month));
        $overdue = array_values(array_filter($active, fn($b) => $b['due_date'] < date('Y-m-d')));
        $nextBill = $active[0] ?? null;
        echo json_encode([
            "success" => true, "bills" => $bills, "payments" => $payments, "alerts" => billAlerts($bills),
            "summary" => [
                "bills_due_this_month" => count($thisMonth),
                "amount_due_this_month" => array_sum(array_map(fn($b) => (float)$b['amount_due'], $thisMonth)),
                "overdue_count" => count($overdue),
                "next_bill" => $nextBill,
                "recently_paid" => array_slice($payments, 0, 5)
            ]
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new Exception('Invalid method');
    $input = billInput();

    if ($action === 'create' || $action === 'update') {
        $id = (int)($input['id'] ?? 0);
        $name = trim($input['name'] ?? '');
        $category = in_array($input['category'] ?? '', $categories, true) ? $input['category'] : 'Other';
        $amount = (float)($input['amount_due'] ?? 0);
        $dueDate = $input['due_date'] ?? '';
        $provider = trim($input['provider'] ?? '');
        $notes = trim($input['notes'] ?? '');
        $recurrence = in_array($input['recurrence'] ?? '', $recurrences, true) ? $input['recurrence'] : 'One-time';
        $customDays = $recurrence === 'Custom' ? max(1, (int)($input['custom_interval_days'] ?? 1)) : null;
        $offsets = array_values(array_unique(array_filter(array_map('intval', $input['reminder_offsets'] ?? [0]), fn($v) => in_array($v, [0,1,3,7], true))));
        $customDates = array_values(array_filter($input['custom_reminder_dates'] ?? [], fn($v) => preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)));
        $status = in_array($input['status'] ?? '', ['Active','Paid','Cancelled'], true) ? $input['status'] : 'Active';
        if ($name === '' || $amount <= 0 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dueDate)) throw new Exception('Bill name, amount, and due date are required');

        if ($action === 'create') {
            $stmt = $pdo->prepare(
                "INSERT INTO bills (user_id,name,category,amount_due,due_date,provider,notes,recurrence,custom_interval_days,reminder_offsets,custom_reminder_dates,status)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
            );
            $stmt->execute([$userId,$name,$category,$amount,$dueDate,$provider,$notes,$recurrence,$customDays,implode(',',$offsets),json_encode($customDates),$status]);
            echo json_encode(["success"=>true,"id"=>$pdo->lastInsertId()]);
            exit;
        }
        if (!billOwned($pdo, $id, $userId)) throw new Exception('Bill not found');
        $stmt = $pdo->prepare(
            "UPDATE bills SET name=?,category=?,amount_due=?,due_date=?,provider=?,notes=?,recurrence=?,custom_interval_days=?,reminder_offsets=?,custom_reminder_dates=?,status=?
             WHERE id=? AND user_id=?"
        );
        $stmt->execute([$name,$category,$amount,$dueDate,$provider,$notes,$recurrence,$customDays,implode(',',$offsets),json_encode($customDates),$status,$id,$userId]);
        echo json_encode(["success"=>true]);
        exit;
    }

    if ($action === 'mark_paid') {
        $bill = billOwned($pdo, (int)($input['id'] ?? 0), $userId);
        if (!$bill) throw new Exception('Bill not found');
        $paymentDate = $input['payment_date'] ?? date('Y-m-d');
        $amount = (float)($input['amount_paid'] ?? $bill['amount_due']);
        $notes = trim($input['notes'] ?? '');
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO bill_payments (bill_id,user_id,amount_paid,payment_date,due_date_paid,notes) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$bill['id'],$userId,$amount,$paymentDate,$bill['due_date'],$notes]);
        if ($bill['recurrence'] === 'One-time') {
            $update = $pdo->prepare("UPDATE bills SET status='Paid' WHERE id=? AND user_id=?");
            $update->execute([$bill['id'],$userId]);
        } else {
            $nextDate = nextBillDueDate($bill['due_date'], $bill['recurrence'], $bill['custom_interval_days']);
            $update = $pdo->prepare("UPDATE bills SET due_date=?, status='Active' WHERE id=? AND user_id=?");
            $update->execute([$nextDate,$bill['id'],$userId]);
        }
        $pdo->commit();
        echo json_encode(["success"=>true,"message"=>"Payment recorded successfully"]);
        exit;
    }

    if ($action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM bills WHERE id=? AND user_id=?");
        $stmt->execute([(int)($input['id'] ?? 0),$userId]);
        echo json_encode(["success"=>true]);
        exit;
    }

    throw new Exception('Invalid action');
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(["success"=>false,"message"=>$e->getMessage()]);
}
?>
