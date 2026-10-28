<?php
declare(strict_types=1);

require_once __DIR__ . '/http.php';

function stark_current_user(?string $requiredRole = null): array
{
    stark_start_session();
    $user = $_SESSION['user'] ?? null;
    if (!is_array($user) || empty($user['id'])) {
        stark_json(['ok' => false, 'message' => 'Silakan masuk kembali untuk melanjutkan.'], 401);
    }
    if ($requiredRole !== null && ($user['role'] ?? '') !== $requiredRole) {
        stark_json(['ok' => false, 'message' => 'Akun ini tidak memiliki akses ke halaman tersebut.'], 403);
    }
    return $user;
}
