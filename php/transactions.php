<?php
// php/transactions.php
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
$action = $_GET['action'] ?? '';

if ($_SERVER["REQUEST_METHOD"] == "GET" && $action == 'fetch_all') {
    $incomeStmt = $pdo->prepare("SELECT * FROM income WHERE user_id = ? ORDER BY date DESC");
    $incomeStmt->execute([$user_id]);
    $income = $incomeStmt->fetchAll(PDO::FETCH_ASSOC);

    $expenseStmt = $pdo->prepare("SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC");
    $expenseStmt->execute([$user_id]);
    $expenses = $expenseStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "income" => $income, "expenses" => $expenses]);
    exit;
} elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
    if ($action == 'add_income') {
        $source = $_POST['source'] ?? '';
        $amount = $_POST['amount'] ?? 0;
        $date = $_POST['date'] ?? '';
        $notes = $_POST['notes'] ?? '';

        $stmt = $pdo->prepare("INSERT INTO income (user_id, source, amount, date, notes) VALUES (?, ?, ?, ?, ?)");
        if ($stmt->execute([$user_id, $source, $amount, $date, $notes])) {
            $id = $pdo->lastInsertId();
            echo json_encode(["success" => true, "id" => $id]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to add income"]);
        }
    } elseif ($action == 'add_expense') {
        $category = $_POST['category'] ?? '';
        $amount = $_POST['amount'] ?? 0;
        $description = $_POST['description'] ?? '';
        $date = $_POST['date'] ?? '';

        $stmt = $pdo->prepare("INSERT INTO expenses (user_id, category, amount, description, date) VALUES (?, ?, ?, ?, ?)");
        if ($stmt->execute([$user_id, $category, $amount, $description, $date])) {
            $id = $pdo->lastInsertId();
            echo json_encode(["success" => true, "id" => $id]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to add expense"]);
        }
    } elseif ($action == 'delete_income') {
        $id = $_POST['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM income WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$id, $user_id])) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete income"]);
        }
    } elseif ($action == 'delete_expense') {
        $id = $_POST['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$id, $user_id])) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete expense"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Invalid action"]);
    }
    exit;
}
?>