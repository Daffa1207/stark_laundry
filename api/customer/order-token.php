<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../http.php';
stark_require_post();$user=stark_current_user('customer');$data=stark_read_json();$code=trim((string)($data['receipt_code']??''));
if($code==='')stark_json(['ok'=>false,'message'=>'Nomor pesanan tidak valid.'],422);
$db=stark_db();$stmt=$db->prepare("SELECT o.id FROM orders o WHERE o.receipt_code=? AND o.customer_id=? AND o.status NOT IN ('completed','cancelled') LIMIT 1");$stmt->execute([$code,(int)$user['id']]);$orderId=$stmt->fetchColumn();
if(!$orderId)stark_json(['ok'=>false,'message'=>'Pesanan tidak ditemukan di akun ini atau sudah selesai.'],404);
$token=bin2hex(random_bytes(24));$save=$db->prepare('INSERT INTO order_qr_tokens(order_id,token_hash,expires_at,pickup_used_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 30 DAY),NULL) ON DUPLICATE KEY UPDATE token_hash=VALUES(token_hash),expires_at=VALUES(expires_at),pickup_used_at=NULL');$save->execute([(int)$orderId,hash('sha256',$token)]);
stark_json(['ok'=>true,'receipt_code'=>$code,'qr_token'=>$token]);
