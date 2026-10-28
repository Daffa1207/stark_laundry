<?php
declare(strict_types=1);

function stark_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('STARK_DB_HOST') ?: '127.0.0.1';
    $database = getenv('STARK_DB_NAME') ?: 'stark_laundry';
    $username = getenv('STARK_DB_USER') ?: 'root';
    $password = getenv('STARK_DB_PASSWORD') ?: '';

    $pdo = new PDO(
        "mysql:host={$host};dbname={$database};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    return $pdo;
}
