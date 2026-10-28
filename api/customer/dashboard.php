<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_guard.php';

$user = stark_current_user('customer');
$db = stark_db();
$id = (int)$user['id'];

$ordersQuery = $db->prepare("SELECT o.id, o.receipt_code, o.customer_name, o.customer_phone, o.status, o.payment_status, o.total, o.created_at, o.ready_at, o.completed_at,
  (SELECT GROUP_CONCAT(CONCAT(oi.service_name_snapshot, ' × ', oi.quantity) ORDER BY oi.id SEPARATOR ', ') FROM order_items oi WHERE oi.order_id=o.id) AS items
  FROM orders o WHERE o.customer_id=? ORDER BY o.created_at DESC");
$ordersQuery->execute([$id]);
$orders = $ordersQuery->fetchAll();
$pointsQuery = $db->prepare('SELECT COALESCE(SUM(points_delta),0) FROM point_ledger WHERE user_id=?');
$pointsQuery->execute([$id]);
$points = (int)$pointsQuery->fetchColumn();
$ledgerQuery = $db->prepare('SELECT event_type, points_delta, note, created_at FROM point_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 20');
$ledgerQuery->execute([$id]);
$rewards = $db->query('SELECT id, name, description, category, point_cost FROM rewards WHERE is_active=1 ORDER BY point_cost, id')->fetchAll();
$redemptionsQuery = $db->prepare("SELECT id, code, reward_name_snapshot AS reward_name, points_spent, status, created_at, redeemed_at FROM reward_redemptions WHERE user_id=? ORDER BY created_at DESC");
$redemptionsQuery->execute([$id]);
$redemptions = $redemptionsQuery->fetchAll();

stark_json(['ok'=>true, 'user'=>['id'=>$id,'name'=>$user['name'] ?? $user['full_name'] ?? 'Pelanggan','email'=>$user['username'] ?? null,'phone'=>$user['phone'] ?? null], 'orders'=>$orders, 'points'=>$points, 'point_history'=>$ledgerQuery->fetchAll(), 'rewards'=>$rewards, 'redemptions'=>$redemptions]);
