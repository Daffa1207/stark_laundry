<?php
declare(strict_types=1);

function stark_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function stark_require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        stark_json(['ok' => false, 'message' => 'Metode permintaan tidak didukung.'], 405);
    }
}

function stark_read_json(): array
{
    $data = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($data)) {
        stark_json(['ok' => false, 'message' => 'Data permintaan tidak valid.'], 400);
    }
    return $data;
}

function stark_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_set_cookie_params([
        'httponly' => true,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Lax',
        'path' => '/',
    ]);
    session_start();
}

function stark_normalize_phone(string $phone): string
{
    $digits = preg_replace('/\D+/', '', $phone) ?? '';
    if (str_starts_with($digits, '0')) {
        $digits = '62' . substr($digits, 1);
    } elseif (str_starts_with($digits, '8')) {
        $digits = '62' . $digits;
    }
    return $digits;
}

function stark_identifier(string $identifier): string
{
    $identifier = trim($identifier);
    return filter_var($identifier, FILTER_VALIDATE_EMAIL)
        ? strtolower($identifier)
        : $identifier;
}
