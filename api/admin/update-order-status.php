<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../http.php';
stark_require_post();
$user=stark_current_user('admin');
$data=stark_read_json();
$orderId=filter_var($data['order_id']??null,FILTER_VALIDATE_INT);
$next=(string)($data['status']??'');
$valid=['new','processing','ready_for_pickup','completed','cancelled'];
if(!$orderId || !in_array($next,$valid,true)) stark_json(['ok'=>false,'message'=>'Data status pesanan tidak valid.'],400);
$db=stark_db();
$db->beginTransaction();
try {
  $stmt=$db->prepare('SELECT id,customer_id,status,total FROM orders WHERE id=? FOR UPDATE');$stmt->execute([$orderId]);$order=$stmt->fetch();
  if(!$order) throw new RuntimeException('Pesanan tidak ditemukan.');
  $old=$order['status'];
  if(in_array($old,['completed','cancelled'],true) && $old!==$next) throw new RuntimeException('Pesanan yang sudah selesai atau dibatalkan tidak dapat diubah lagi.');
  $update=$db->prepare("UPDATE orders SET status=?,ready_at=IF(?='ready_for_pickup' AND ready_at IS NULL,NOW(),ready_at),completed_at=IF(?='completed',NOW(),completed_at) WHERE id=?");
  $update->execute([$next,$next,$next,$orderId]);
  $history=$db->prepare('INSERT INTO order_status_history(order_id,changed_by,previous_status,new_status,note) VALUES(?,?,?,?,?)');
  $history->execute([$orderId,(int)$user['id'],$old,$next,trim((string)($data['note']??'')) ?: null]);
  if($next==='completed' && $old!=='completed' && !empty($order['customer_id'])) {
    $points=(int)floor((float)$order['total']/1000);
    if($points>0) {
      $earn=$db->prepare("INSERT IGNORE INTO point_ledger(user_id,order_id,event_type,points_delta,note) VALUES(?,?,'earned',?,'Poin dari pesanan selesai')");
      $earn->execute([(int)$order['customer_id'],$orderId,$points]);
    }
  }
  $db->commit();
  stark_json(['ok'=>true,'message'=>'Status pesanan diperbarui.','status'=>$next]);
} catch(RuntimeException $e){if($db->inTransaction())$db->rollBack();stark_json(['ok'=>false,'message'=>$e->getMessage()],404);}
catch(Throwable $e){if($db->inTransaction())$db->rollBack();stark_json(['ok'=>false,'message'=>'Status pesanan belum dapat disimpan.'],500);}
