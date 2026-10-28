<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../http.php';
stark_require_post();
$user = stark_current_user('customer');
$data = stark_read_json();
$rewardId = filter_var($data['reward_id'] ?? null, FILTER_VALIDATE_INT);
if (!$rewardId || $rewardId < 1) stark_json(['ok'=>false,'message'=>'Hadiah tidak valid.'],400);
$db = stark_db();
$db->beginTransaction();
try {
    $rewardStmt = $db->prepare('SELECT id,name,point_cost FROM rewards WHERE id=? AND is_active=1 FOR UPDATE');
    $rewardStmt->execute([$rewardId]);
    $reward = $rewardStmt->fetch();
    if (!$reward) throw new RuntimeException('Hadiah tidak tersedia.');
    $lockUser = $db->prepare('SELECT id FROM users WHERE id=? FOR UPDATE');
    $lockUser->execute([(int)$user['id']]);
    $balanceStmt = $db->prepare('SELECT COALESCE(SUM(points_delta),0) FROM point_ledger WHERE user_id=?');
    $balanceStmt->execute([(int)$user['id']]);
    $balance = (int)$balanceStmt->fetchColumn();
    $cost = (int)$reward['point_cost'];
    if ($balance < $cost) throw new RuntimeException('Poin kamu belum cukup untuk menukar hadiah ini.');
    $code = 'RW-' . strtoupper(bin2hex(random_bytes(4)));
    $insert = $db->prepare("INSERT INTO reward_redemptions(code,user_id,reward_id,reward_name_snapshot,points_spent) VALUES(?,?,?,?,?)");
    $insert->execute([$code,(int)$user['id'],$rewardId,$reward['name'],$cost]);
    $redemptionId = (int)$db->lastInsertId();
    $ledger = $db->prepare("INSERT INTO point_ledger(user_id,redemption_id,event_type,points_delta,note) VALUES(?,?,'spent',?,?)");
    $ledger->execute([(int)$user['id'],$redemptionId,-$cost,'Penukaran hadiah: '.$reward['name']]);
    $db->commit();
    stark_json(['ok'=>true,'message'=>'Hadiah berhasil ditukar.','redemption'=>['code'=>$code,'reward_name'=>$reward['name'],'points_spent'=>$cost,'balance'=>$balance-$cost,'status'=>'active']]);
} catch (RuntimeException $e) {
    if ($db->inTransaction()) $db->rollBack();
    stark_json(['ok'=>false,'message'=>$e->getMessage()],422);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    stark_json(['ok'=>false,'message'=>'Penukaran belum dapat diproses. Pastikan pembaruan database sudah diimpor.'],500);
}
