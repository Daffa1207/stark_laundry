<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../http.php';
stark_require_post();
$admin=stark_current_user('admin');
$data=stark_read_json();
$name=trim((string)($data['customer_name']??''));
$phone=stark_normalize_phone((string)($data['customer_phone']??''));
$items=$data['items']??null;
if($name===''||$phone===''||!is_array($items)||count($items)<1) stark_json(['ok'=>false,'message'=>'Nama, nomor WhatsApp, dan layanan pesanan wajib diisi.'],422);
$db=stark_db();
$db->beginTransaction();
try {
 $customerStmt=$db->prepare("SELECT id,full_name,phone FROM users WHERE role='customer' AND phone=? LIMIT 1 FOR UPDATE");$customerStmt->execute([$phone]);$customer=$customerStmt->fetch();
 $customerId=$customer?(int)$customer['id']:null;
 $clean=[];$total=0.0;
 $serviceStmt=$db->prepare('SELECT id,name,unit,price_per_unit,minimum_quantity FROM services WHERE id=? AND is_active=1');
 foreach($items as $item){$sid=filter_var($item['service_id']??null,FILTER_VALIDATE_INT);$qty=filter_var($item['quantity']??null,FILTER_VALIDATE_FLOAT);if(!$sid||!$qty||$qty<=0)throw new RuntimeException('Ada layanan atau jumlah yang tidak valid.');$serviceStmt->execute([$sid]);$service=$serviceStmt->fetch();if(!$service)throw new RuntimeException('Salah satu layanan sudah tidak tersedia.');if($qty<(float)$service['minimum_quantity'])throw new RuntimeException('Jumlah '.$service['name'].' belum memenuhi minimum layanan.');$line=round((float)$service['price_per_unit']*$qty,2);$total+=$line;$clean[]=[$service,$qty,$line];}
 $receipt='LD-'.date('ymd').'-'.strtoupper(bin2hex(random_bytes(3)));
 $order=$db->prepare("INSERT INTO orders(receipt_code,customer_id,created_by,customer_name,customer_phone,status,payment_method,payment_status,subtotal,total,notes) VALUES(?,?,?,?,?,'new',?, ?,?,?,?)");
 $payment=in_array(($data['payment_method']??''),['cash','qris','transfer','other'],true)?$data['payment_method']:null;
 $payStatus=($data['payment_status']??'unpaid')==='paid'?'paid':'unpaid';
 $order->execute([$receipt,$customerId,(int)$admin['id'],$customer['full_name']??$name,$customer['phone']??$phone,$payment,$payStatus,$total,$total,trim((string)($data['notes']??''))?:null]);
 $orderId=(int)$db->lastInsertId();$insertItem=$db->prepare('INSERT INTO order_items(order_id,service_id,service_name_snapshot,unit_snapshot,quantity,unit_price,line_total) VALUES(?,?,?,?,?,?,?)');
 foreach($clean as [$service,$qty,$line])$insertItem->execute([$orderId,$service['id'],$service['name'],$service['unit'],$qty,$service['price_per_unit'],$line]);
 $history=$db->prepare("INSERT INTO order_status_history(order_id,changed_by,previous_status,new_status,note) VALUES(?,?,NULL,'new','Pesanan dibuat oleh kasir')");$history->execute([$orderId,(int)$admin['id']]);
 $qrToken=bin2hex(random_bytes(24));$qr=$db->prepare('INSERT INTO order_qr_tokens(order_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 30 DAY))');$qr->execute([$orderId,hash('sha256',$qrToken)]);
 $db->commit();stark_json(['ok'=>true,'message'=>'Pesanan berhasil disimpan.','order'=>['id'=>$orderId,'receipt_code'=>$receipt,'qr_token'=>$qrToken,'customer_id'=>$customerId,'customer_name'=>$customer['full_name']??$name,'customer_phone'=>$customer['phone']??$phone,'status'=>'new','total'=>$total]]);
}catch(RuntimeException $e){if($db->inTransaction())$db->rollBack();stark_json(['ok'=>false,'message'=>$e->getMessage()],422);}catch(Throwable $e){if($db->inTransaction())$db->rollBack();stark_json(['ok'=>false,'message'=>'Pesanan belum dapat disimpan. Periksa tabel layanan dan database.'],500);}
