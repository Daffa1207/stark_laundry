<?php
declare(strict_types=1);

require_once __DIR__ . '/../http.php';

stark_require_post();
stark_start_session();
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();
stark_json(['ok' => true]);
