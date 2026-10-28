<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../http.php';
stark_require_post();stark_current_user('admin');$input=stark_read_json();$code=trim((string)($input['code']??''));
if($code==='')stark_json(['ok'=>false,'message'=>'Masukkan kode nota atau QR pesanan.'],422);
$db=stark_db();$hash=hash('sha256',$code);
$stmt=$db->prepare("SELECT o.id,o.receipt_code,o.customer_name,o.customer_phone,o.status,o.payment_status,o.total,o.created_at, GROUP_CONCAT(CONCAT(oi.service_name_snapshot,' × ',oi.quantity) ORDER BY oi.id SEPARATOR ', ') AS items
 FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN order_qr_tokens q ON q.order_id=o.id
 WHERE o.receipt_code=? OR q.token_hash=? GROUP BY o.id LIMIT 1");
$stmt->execute([$code,$hash]);$order=$stmt->fetch();if(!$order)stark_json(['ok'=>false,'message'=>'Nota tidak ditemukan di database.'],404);
stark_json(['ok'=>true,'order'=>$order]);
