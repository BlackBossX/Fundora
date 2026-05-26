<?php
// php/db.php
$host = "localhost";
$dbname = "fundora_db";
$user = "fundora";
$pass = "fundora123";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    session_start();
} catch (PDOException $e) {
    die(json_encode(["error" => "Database Connection Failed: " . $e->getMessage()]));
}
?>