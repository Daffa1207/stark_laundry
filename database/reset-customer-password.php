<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../api/db.php';
require_once __DIR__ . '/../api/http.php';

function prompt(string $label, bool $trim = true): string
{
    fwrite(STDOUT, $label);
    $value = (string)fgets(STDIN);
    return $trim ? trim($value) : rtrim($value, "\r\n");
}

try {
    $identifier = stark_identifier(prompt("Username, email, atau nomor WhatsApp Customer: "));
    $newPassword = prompt("Password baru (minimal 6 karakter): ", false);
    $confirmation = prompt("Ulangi password baru: ", false);

    if (strlen($newPassword) < 6 || strlen($newPassword) > 200) {
        throw new RuntimeException('Password harus terdiri dari 6–200 karakter.');
    }
    if (!hash_equals($newPassword, $confirmation)) {
        throw new RuntimeException('Ulangi password belum sama. Password tidak diubah.');
    }

    $pdo = stark_db();
    $phone = stark_normalize_phone($identifier);
    $lookup = $pdo->prepare(
        'SELECT id FROM users
         WHERE role = \'customer\' AND (username = :identifier OR phone = :phone)
         LIMIT 1'
    );
    $lookup->execute(['identifier' => $identifier, 'phone' => $phone]);
    $customer = $lookup->fetch();

    if (!$customer) {
        throw new RuntimeException('Akun Customer tidak ditemukan. Periksa username, email, atau nomor WhatsApp.');
    }

    $update = $pdo->prepare(
        'UPDATE users SET password_hash = :password_hash WHERE id = :id AND role = \'customer\''
    );
    $update->execute([
        'password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        'id' => $customer['id'],
    ]);

    fwrite(STDOUT, "Password Customer berhasil diatur ulang. Silakan login dengan password baru.\n");
} catch (Throwable $error) {
    fwrite(STDERR, "Gagal mengatur ulang password: {$error->getMessage()}\n");
    exit(1);
}
