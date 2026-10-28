<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../http.php';

stark_require_post();
$input = stark_read_json();

$name = trim((string)($input['fullName'] ?? ''));
$phone = stark_normalize_phone((string)($input['whatsapp'] ?? ''));
$identifier = stark_identifier((string)($input['identifier'] ?? ''));
$password = (string)($input['password'] ?? '');
$confirmPassword = (string)($input['confirmPassword'] ?? '');
$termsAccepted = ($input['termsAccepted'] ?? false) === true;

if (mb_strlen($name) < 2 || mb_strlen($name) > 120) {
    stark_json(['ok' => false, 'message' => 'Nama lengkap harus berisi 2–120 karakter.'], 422);
}
if (!preg_match('/^62[0-9]{8,13}$/', $phone)) {
    stark_json(['ok' => false, 'message' => 'Nomor WhatsApp belum valid. Gunakan nomor Indonesia yang aktif.'], 422);
}
$validUsername = preg_match('/^[A-Za-z0-9_.-]{3,40}$/', $identifier) === 1;
$validEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL) !== false;
if (!$validUsername && !$validEmail) {
    stark_json(['ok' => false, 'message' => 'Masukkan email yang valid atau username 3–40 karakter.'], 422);
}
if (strlen($password) < 6 || strlen($password) > 200) {
    stark_json(['ok' => false, 'message' => 'Kata sandi harus terdiri dari minimal 6 karakter.'], 422);
}
if (!hash_equals($password, $confirmPassword)) {
    stark_json(['ok' => false, 'message' => 'Konfirmasi kata sandi belum sama.'], 422);
}
if (!$termsAccepted) {
    stark_json(['ok' => false, 'message' => 'Setujui syarat dan kebijakan sebelum membuat akun.'], 422);
}

try {
    $statement = stark_db()->prepare(
        'INSERT INTO users (role, username, full_name, phone, password_hash, is_active)
         VALUES (\'customer\', :username, :full_name, :phone, :password_hash, TRUE)'
    );
    $statement->execute([
        'username' => $identifier,
        'full_name' => $name,
        'phone' => $phone,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);

    stark_json(['ok' => true, 'message' => 'Akun Customer berhasil dibuat.'], 201);
} catch (PDOException $error) {
    if ((string)$error->getCode() === '23000') {
        stark_json(['ok' => false, 'message' => 'Email/username atau nomor WhatsApp sudah terdaftar.'], 409);
    }
    error_log('Stark register error: ' . $error->getMessage());
    stark_json(['ok' => false, 'message' => 'Akun belum dapat dibuat. Periksa koneksi database.'], 500);
}
