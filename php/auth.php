<?php
// php/auth.php
require 'db.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if ($action === 'register') {
        $name = $_POST['name'];
        $email = $_POST['email'];
        $password = password_hash($_POST['password'], PASSWORD_BCRYPT);
        
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
        if ($stmt->execute([$name, $email, $password])) {
            echo json_encode(["success" => true, "message" => "Account created successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Registration failed"]);
        }
    } 
    elseif ($action === 'login') {
        $email = $_POST['email'];
        $password = $_POST['password'];
        
        $stmt = $pdo->prepare("SELECT id, name, password FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            echo json_encode(["success" => true, "user" => ["id" => $user['id'], "name" => $user['name']]]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid credentials"]);
        }
    }
} elseif ($_SERVER["REQUEST_METHOD"] == "GET" && $action === 'logout') {
    session_destroy();
    echo json_encode(["success" => true]);
}
?>