<?php
// php/auth.php
require __DIR__ . '/db.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

// ── Helpers ────────────────────────────────────────────────────
function jsonOut(bool $success, string $message = '', array $extra = []): void {
    echo json_encode(array_merge(['success' => $success, 'message' => $message], $extra));
    exit;
}

function sanitizeEmail(string $email): string {
    return strtolower(trim(filter_var($email, FILTER_SANITIZE_EMAIL)));
}

// ── REGISTER ───────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'register') {
    $name     = trim($_POST['name']     ?? '');
    $email    = sanitizeEmail($_POST['email']    ?? '');
    $password = $_POST['password'] ?? '';

    // ── Server-side validation ─────────────────────────────────
    if ($name === '') {
        jsonOut(false, 'Full name is required.');
    }
    if (strlen($name) < 2 || strlen($name) > 80) {
        jsonOut(false, 'Full name must be between 2 and 80 characters.');
    }
    if (!preg_match("/^[A-Za-z\s'\-\.]+$/", $name)) {
        jsonOut(false, 'Full name may only contain letters, spaces, hyphens or apostrophes.');
    }
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonOut(false, 'A valid email address is required.');
    }
    if (strlen($password) < 8) {
        jsonOut(false, 'Password must be at least 8 characters.');
    }

    // ── Duplicate email check ──────────────────────────────────
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $check->execute([$email]);
    if ($check->fetchColumn()) {
        jsonOut(false, 'This email is already registered.');
    }

    // ── Insert ─────────────────────────────────────────────────
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    if ($stmt->execute([$name, $email, $hash])) {
        jsonOut(true, 'Account created successfully.');
    } else {
        jsonOut(false, 'Registration failed. Please try again.');
    }
}

// ── LOGIN ──────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $email    = sanitizeEmail($_POST['email']    ?? '');
    $password = $_POST['password'] ?? '';

    // ── Server-side validation ─────────────────────────────────
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonOut(false, 'A valid email address is required.');
    }
    if ($password === '') {
        jsonOut(false, 'Password is required.');
    }

    // ── Lookup & verify ────────────────────────────────────────
    $stmt = $pdo->prepare("SELECT id, name, password FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        jsonOut(true, '', ['user' => ['id' => $user['id'], 'name' => $user['name']]]);
    } else {
        // Generic message to prevent user enumeration
        jsonOut(false, 'Invalid email or password.');
    }
}

// ── LOGOUT ─────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'logout') {
    session_destroy();
    jsonOut(true, 'Logged out.');
}

// ── Fallback ───────────────────────────────────────────────────
jsonOut(false, 'Invalid request.');
?>