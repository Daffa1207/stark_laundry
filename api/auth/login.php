<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../http.php';

stark_require_post();
$input = stark_read_json();
$identifier = stark_identifier((string)($input['identifier'] ?? ''));
$password = (string)($input['password'] ?? '');
$requestedRole = (string)($input['role'] ?? 'customer');

if (!in_array($requestedRole, ['customer', 'admin'], true) || $identifier === '' || $password === '') {
    stark_json(['ok' => false, 'message' => 'Periksa kembali peran, identitas, dan kata sandi.'], 422);
}

try {
    $pdo = stark_db();
    if ($requestedRole === 'admin') {
        $statement = $pdo->prepare(
            'SELECT id, role, username, full_name, phone, password_hash, is_active
             FROM users WHERE role = \'admin\' AND username = :identifier LIMIT 1'
        );
        $statement->execute(['identifier' => $identifier]);
    } else {
        $phone = stark_normalize_phone($identifier);
        $statement = $pdo->prepare(
            'SELECT id, role, username, full_name, phone, password_hash, is_active
             FROM users WHERE role = \'customer\' AND (username = :identifier OR phone = :phone) LIMIT 1'
        );
        $statement->execute(['identifier' => $identifier, 'phone' => $phone]);
    }

    $user = $statement->fetch();
    if (!$user || !(bool)$user['is_active'] || empty($user['password_hash']) || !password_verify($password, $user['password_hash'])) {
        stark_json(['ok' => false, 'message' => 'Identitas atau kata sandi tidak cocok, atau akun belum aktif.'], 401);
    }

    stark_start_session();
    session_regenerate_id(true);
    $_SESSION['user'] = [
        'id' => (int)$user['id'],
        'role' => $user['role'],
        'name' => $user['full_name'],
        'username' => $user['username'],
        'phone' => $user['phone'],
    ];

    stark_json(['ok' => true, 'user' => $_SESSION['user']]);
} catch (PDOException $error) {
    error_log('Stark login error: ' . $error->getMessage());
    stark_json(['ok' => false, 'message' => 'Belum dapat terhubung ke database. Jalankan MySQL dan siapkan database Stark Laundry.'], 500);
}
