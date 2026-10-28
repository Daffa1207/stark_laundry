<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../api/db.php';

function ask_password(string $prompt): string
{
    fwrite(STDOUT, $prompt);
    return trim((string)fgets(STDIN));
}

try {
    $pdo = stark_db();
    foreach (['adm_01', 'adm_02'] as $username) {
        $password = ask_password("Buat kata sandi untuk {$username} (min. 8 karakter): ");
        if (strlen($password) < 8) {
            fwrite(STDERR, "Kata sandi minimal 8 karakter. Tidak ada akun yang diaktifkan.\n");
            exit(1);
        }

        $statement = $pdo->prepare(
            'UPDATE users SET password_hash = :password_hash, must_change_password = FALSE, is_active = TRUE
             WHERE username = :username AND role = \'admin\''
        );
        $statement->execute([
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'username' => $username,
        ]);

        if ($statement->rowCount() < 1) {
            fwrite(STDERR, "Akun {$username} belum ada. Jalankan seed-admins.sql terlebih dahulu.\n");
            exit(1);
        }
        unset($password);
        fwrite(STDOUT, "{$username} sudah disiapkan.\n");
    }
} catch (Throwable $error) {
    fwrite(STDERR, "Gagal menyiapkan akun Admin: {$error->getMessage()}\n");
    exit(1);
}
