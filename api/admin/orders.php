<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_guard.php';
$user = stark_current_user('admin');
$db = stark_db();
$orders = $db->query("SELECT o.id,o.receipt_code,o.customer_id,o.customer_name,o.customer_phone,o.status,o.payment_method,o.payment_status,o.subtotal,o.total,o.notes,o.created_at,o.ready_at,o.completed_at,
  (SELECT GROUP_CONCAT(CONCAT(oi.service_name_snapshot,' × ',oi.quantity) ORDER BY oi.id SEPARATOR ', ') FROM order_items oi WHERE oi.order_id=o.id) AS items
  FROM orders o ORDER BY o.created_at DESC")->fetchAll();
$counts = ['new'=>0,'processing'=>0,'ready_for_pickup'=>0,'completed'=>0,'cancelled'=>0];
foreach ($orders as $o) if (isset($counts[$o['status']])) $counts[$o['status']]++;
stark_json(['ok'=>true,'orders'=>$orders,'counts'=>$counts,'admin_name'=>$user['name'] ?? $user['full_name'] ?? 'Admin']);
