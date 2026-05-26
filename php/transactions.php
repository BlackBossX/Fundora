<?php
// php/transactions.php
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    // Fetch all income & expenses
    $incomeStmt = $pdo->prepare("SELECT * FROM income WHERE user_id = ?");
    $incomeStmt->execute([$user_id]);
    $income = $incomeStmt->fetchAll(PDO::FETCH_ASSOC);

    $expenseStmt = $pdo->prepare("SELECT * FROM expenses WHERE user_id = ?");
    $expenseStmt->execute([$user_id]);
    $expenses = $expenseStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["income" => $income, "expenses" => $expenses]);
} elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Add logic to map $_POST params and INSERT into income/expenses tables based on $_GET['type']
    echo json_encode(["success" => true, "message" => "Added successfully"]);
}
?>