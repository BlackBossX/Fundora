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
    $stmt = $pdo->prepare("SELECT category, amount FROM budgets WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return as { category: amount } map
    $budgets = [];
    foreach ($rows as $row) {
        $budgets[$row['category']] = (float)$row['amount'];
    }
    echo json_encode(["success" => true, "budgets" => $budgets]);
    exit;
}

// ── POST: save (upsert) all budgets ─────────────────────────────
if ($_SERVER["REQUEST_METHOD"] === "POST" && $action === "save") {
    // Expect JSON body: { "budgets": { "Food": 5000, "Rent": 10000, ... } }
    $body = json_decode(file_get_contents("php://input"), true);
    $budgets = $body['budgets'] ?? [];

    $valid_categories = ['Food','Transport','Rent','Entertainment','Health','Education','Other'];

    $stmt = $pdo->prepare(
        "INSERT INTO budgets (user_id, category, amount)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE amount = VALUES(amount), updated_at = CURRENT_TIMESTAMP"
    );

    $pdo->beginTransaction();
    try {
        foreach ($budgets as $category => $amount) {
            if (!in_array($category, $valid_categories)) continue;
            $amount = max(0, (float)$amount);
            $stmt->execute([$user_id, $category, $amount]);
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
