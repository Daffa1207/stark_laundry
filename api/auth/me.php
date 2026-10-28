<?php
declare(strict_types=1);

require_once __DIR__ . '/../http.php';

stark_start_session();
$user = $_SESSION['user'] ?? null;

if (!is_array($user)) {
    stark_json(['ok' => false, 'message' => 'Sesi login tidak ditemukan.'], 401);
}

stark_json(['ok' => true, 'user' => $user]);
