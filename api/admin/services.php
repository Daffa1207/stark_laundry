<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../http.php';
$admin=stark_current_user('admin');
$db=stark_db();
if(($_SERVER['REQUEST_METHOD']??'GET')==='GET'){
 $rows=$db->query('SELECT id,name,category,unit,price_per_unit,minimum_quantity,estimated_hours,is_active FROM services ORDER BY is_active DESC,category,name')->fetchAll();
 stark_json(['ok'=>true,'services'=>$rows]);
}
stark_require_post();$data=stark_read_json();$action=(string)($data['action']??'save');
if($action==='toggle'){
 $id=filter_var($data['id']??null,FILTER_VALIDATE_INT);if(!$id)stark_json(['ok'=>false,'message'=>'Layanan tidak ditemukan.'],400);
 $stmt=$db->prepare('UPDATE services SET is_active=NOT is_active WHERE id=?');$stmt->execute([$id]);
 stark_json(['ok'=>true,'message'=>'Status layanan diperbarui.']);
}
$id=filter_var($data['id']??null,FILTER_VALIDATE_INT)?:null;$name=trim((string)($data['name']??''));$rawCategory=strtolower(trim((string)($data['category']??'')));$category=str_contains($rawCategory,'dry')?'dry_clean':(str_contains($rawCategory,'satuan')?'satuan':'kiloan');$unit=trim((string)($data['unit']??''));$price=filter_var($data['price_per_unit']??null,FILTER_VALIDATE_FLOAT);$min=filter_var($data['minimum_quantity']??1,FILTER_VALIDATE_FLOAT);$hours=filter_var($data['estimated_hours']??null,FILTER_VALIDATE_INT);
if($name===''||!in_array($category,['kiloan','satuan','dry_clean'],true)||$unit===''||$price===false||$price<0||$min===false||$min<=0)stark_json(['ok'=>false,'message'=>'Lengkapi nama, kategori, satuan, harga, dan jumlah minimum layanan.'],422);
if($id){$stmt=$db->prepare('UPDATE services SET name=?,category=?,unit=?,price_per_unit=?,minimum_quantity=?,estimated_hours=? WHERE id=?');$stmt->execute([$name,$category,$unit,$price,$min,$hours?:null,$id]);}
else{$stmt=$db->prepare('INSERT INTO services(name,category,unit,price_per_unit,minimum_quantity,estimated_hours) VALUES(?,?,?,?,?,?)');$stmt->execute([$name,$category,$unit,$price,$min,$hours?:null]);$id=(int)$db->lastInsertId();}
stark_json(['ok'=>true,'message'=>'Layanan berhasil disimpan.','id'=>$id]);
