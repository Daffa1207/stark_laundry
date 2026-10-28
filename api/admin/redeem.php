<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../http.php';
stark_require_post();$admin=stark_current_user('admin');$data=stark_read_json();$code=strtoupper(trim((string)($data['code']??'')));
if($code==='')stark_json(['ok'=>false,'message'=>'Masukkan kode tiket reward.'],422);
$db=stark_db();$stmt=$db->prepare("SELECT id,status FROM reward_redemptions WHERE code=? FOR UPDATE");$db->beginTransaction();
try{$stmt->execute([$code]);$row=$stmt->fetch();if(!$row)throw new RuntimeException('Kode reward tidak ditemukan.');if($row['status']!=='active')throw new RuntimeException('Tiket ini sudah diproses atau dibatalkan.');$update=$db->prepare("UPDATE reward_redemptions SET status='redeemed',redeemed_at=NOW(),processed_by=? WHERE id=?");$update->execute([(int)$admin['id'],(int)$row['id']]);$db->commit();stark_json(['ok'=>true,'message'=>'Tiket reward berhasil dikonfirmasi.']);}catch(RuntimeException $e){if($db->inTransaction())$db->rollBack();stark_json(['ok'=>false,'message'=>$e->getMessage()],422);}catch(Throwable $e){if($db->inTransaction())$db->rollBack();stark_json(['ok'=>false,'message'=>'Tiket belum dapat diproses.'],500);}
