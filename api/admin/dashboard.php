<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_guard.php';
$user=stark_current_user('admin');
$db=stark_db();
$orders=$db->query("SELECT o.id,o.receipt_code,o.customer_id,o.customer_name,o.customer_phone,o.status,o.payment_method,o.payment_status,o.subtotal,o.total,o.notes,o.created_at,o.ready_at,o.completed_at,
 (SELECT GROUP_CONCAT(CONCAT(oi.service_name_snapshot,' × ',oi.quantity) ORDER BY oi.id SEPARATOR ', ') FROM order_items oi WHERE oi.order_id=o.id) AS items
 FROM orders o ORDER BY o.created_at DESC")->fetchAll();
$services=$db->query('SELECT id,name,category,unit,price_per_unit,minimum_quantity,estimated_hours,is_active FROM services ORDER BY is_active DESC,category,name')->fetchAll();
$redemptions=$db->query("SELECT rr.id,rr.code,rr.reward_name_snapshot AS reward_name,rr.points_spent,rr.status,rr.created_at,rr.redeemed_at,u.full_name AS customer_name,u.username AS customer_email,u.phone AS customer_phone FROM reward_redemptions rr JOIN users u ON u.id=rr.user_id ORDER BY rr.created_at DESC")->fetchAll();
$rewards=$db->query('SELECT id,name,description,category,point_cost,is_active FROM rewards ORDER BY is_active DESC,point_cost')->fetchAll();
$summary=$db->query("SELECT COUNT(*) AS order_count,COALESCE(SUM(status IN ('new','processing','ready_for_pickup')),0) AS active_count,COALESCE(SUM(status='completed'),0) AS completed_count FROM orders")->fetch();
stark_json(['ok'=>true,'admin'=>['id'=>(int)$user['id'],'name'=>$user['name']??'Admin'],'orders'=>$orders,'services'=>$services,'rewards'=>$rewards,'redemptions'=>$redemptions,'summary'=>$summary]);
