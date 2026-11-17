/* เตือนกล้องความเร็ว ทล.1 ลำปาง–กรุงเทพฯ
 * สร้างและแก้ไขโดย Alongkorn Inta
 * ข้อมูลทั้งหมดบันทึกในเครื่อง (localStorage) อัตโนมัติ
 */
'use strict';
const CREDIT = 'สร้างและแก้ไขโดย Alongkorn Inta';
const LS_KEY = 'h1cam.v1';
const TRIP_PREFIX = 'h1cam.trip.';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const now = () => Date.now();
const fmtTime = t => new Date(t).toLocaleString('th-TH', {dateStyle:'short', timeStyle:'medium'});
const fmtClock = t => new Date(t).toLocaleTimeString('th-TH');

/* ---------- ประเภทจุด ---------- */
const TYPES = {
  fixed:     {icon:'📷', label:'กล้องประจำจุด', color:'#ef4444', say:'กล้องตรวจจับความเร็ว'},
  overpass:  {icon:'🌉', label:'กล้องบนสะพานลอย', color:'#ef4444', say:'กล้องบนสะพานลอย'},
  led:       {icon:'🔆', label:'ป้ายไฟ LED วัดความเร็ว', color:'#f59e0b', say:'ป้ายไฟวัดความเร็ว'},
  police:    {icon:'👮', label:'ตำรวจตั้งกล้อง / จุดชะลอ', color:'#3b82f6', say:'ตำรวจตั้งกล้อง'},
  fine:      {icon:'🧾', label:'ป้อมจ่ายค่าปรับ', color:'#8b5cf6', say:'ป้อมจ่ายค่าปรับ'},
  checkpoint:{icon:'🚧', label:'ด่านตรวจ', color:'#8b5cf6', say:'ด่านตรวจ'},
  weigh:     {icon:'⚖️', label:'จับความเร็ว + ชั่งน้ำหนักรถบรรทุก', color:'#f97316', say:'จุดจับความเร็วและชั่งน้ำหนัก'},
  newpt:     {icon:'⚠️', label:'จุดติดตั้งใหม่ (ยังไม่มีกล้อง)', color:'#64748b', say:'จุดติดตั้งกล้องใหม่'},
  other:     {icon:'📍', label:'อื่นๆ', color:'#10b981', say:'จุดเฝ้าระวัง'}
};
const DIRS = {down:'ขาล่อง (ลำปาง→กทม.)', up:'ขาขึ้น (กทม.→ลำปาง)', both:'ทั้งสองทาง'};

/* ---------- หลัก กม. อ้างอิง (km, lat, lon, ที่มา) ----------
 * กม. ที่มีชื่อสถานที่ = ยืนยันจากข่าว/ประกาศกรมทางหลวง, พิกัดเป็นค่าประมาณ
 * กดปุ่ม 📍กม. ขณะขับผ่านหลัก กม. จริง เพื่อปรับให้แม่นยำ */
const DEFAULT_ANCHORS = [
  [700,18.245,99.445,'ช่วงเกาะคา–ลำปาง'],
  [690,18.190,99.405,'แยกเกาะคา (กม.689–691)'],
  [681,18.120,99.390,''],
  [672,18.048,99.372,'ดอยตัด ต.นาแส่ง อ.เกาะคา (กม.671–672)'],
  [662,17.965,99.350,''],
  [651,17.885,99.335,'สบปราบ (ประมาณ)'],
  [640,17.795,99.300,''],
  [630,17.715,99.262,''],
  [617,17.613,99.218,'เถิน ต.ล้อมแรด (กม.616–617)'],
  [606,17.540,99.172,''],
  [595,17.462,99.128,'แม่พริก (ประมาณ)'],
  [585,17.385,99.095,''],
  [575,17.300,99.070,'บ้านดวงลาน ต.วังจันทร์ อ.สามเงา (กม.575)'],
  [560,17.170,99.072,''],
  [543,17.045,99.082,'บ้านตาก (ประมาณ)'],
  [533,16.965,99.105,''],
  [524,16.8896,99.1282,'ต.ไม้งาม อ.เมืองตาก (ประมาณ)'],
  [522,16.873,99.134,'แยก ทล.12 ตาก (ประมาณ)'],
  [506.4,16.782,99.226,'ต.ประดาง อ.วังเจ้า (กม.506+442)'],
  [493,16.690,99.265,''],
  [480,16.600,99.300,'ช่วงโกสัมพีนคร (ประมาณ)'],
  [466,16.545,99.395,''],
  [452.5,16.488,99.497,'ต.นครชุม อ.เมืองกำแพงเพชร (กม.452–453)'],
  [438,16.390,99.585,''],
  [423,16.290,99.660,'บ้านท่าพุทรา อ.คลองขลุง (กม.423)'],
  [410,16.205,99.715,'บ้านคลองน้ำเย็นเหนือ อ.คลองขลุง (กม.410)'],
  [394.5,16.100,99.800,'ต.ดอนแตง อ.ขาณุฯ (กม.394–395)'],
  [386,16.045,99.855,'ต.สลกบาตร อ.ขาณุฯ (กม.386)'],
  [370,15.928,99.943,''],
  [356,15.837,100.012,''],
  [345,15.765,100.066,'']
];

const DEFAULT_CAMS = [
  [676,'fixed','เลนส์กลาง ตั้งเสาใหม่','p676'],
  [623,'fixed','ตั้งกล้องบนเสาเกาะกลาง','p623'],
  [573,'police','จุดชะลอ – ตำรวจนั่งในศาลา ตั้งกล้องส่องช่วง กม.572–571',''],
  [571,'fine','ป้อมจ่ายค่าปรับ',''],
  [568,'overpass','กล้องบนสะพานลอย','p568'],
  [562,'fixed','ริมถนนฝั่งซ้าย (ตั้งใหม่)',''],
  [550,'fixed','เกาะกลางฝั่งขวา ก่อนจุดกลับรถ (U-Turn)','p550'],
  [546,'fixed','แขวนเกาะกลางถนน',''],
  [528,'fixed','บนเสาฝั่งซ้ายถนน',''],
  [507,'fixed','เกาะกลางถนน (ติดตั้งใหม่)',''],
  [499,'newpt','จุดตั้งกล้องใหม่ (ยังไม่มีกล้อง)',''],
  [487,'overpass','กล้องบนสะพานลอย','p487'],
  [486,'led','ป้ายไฟ LED จับความเร็ว (จำกัด 90)','p486'],
  [483,'fixed','บนเสาฝั่งซ้ายถนน หน้าปากซอย','p483'],
  [467,'police','ตำรวจนั่งตั้งกล้องเกาะกลางถนน',''],
  [465,'fine','ป้อมจ่ายค่าปรับ',''],
  [464,'fixed','บนเสาฝั่งซ้ายถนน',''],
  [385,'overpass','กล้องบนสะพานลอย','p385'],
  [380,'weigh','จับความเร็ว + รถบรรทุกเข้าชั่ง',''],
  [358,'police','ตำรวจตั้งกล้องเกาะกลางถนน',''],
  [356,'checkpoint','ด่านตรวจ จ่ายค่าปรับ','']
];

const DEFAULT_SETTINGS = {
  stages:[2000,1000,300], defaultLimit:90, tol:0, tts:true, beep:true, vibrate:true, notify:true,
  wake:true, dirMode:'down', gkey:'', useGoogleBase:true, generalOverspeed:true, mapMode:'map',
  followZoom:15, showRoute:true, simSpeed:95, simMult:1, simStart:680
};

function freshState(){
  return {
    ver:1,
    settings:{...DEFAULT_SETTINGS},
    anchors: DEFAULT_ANCHORS.map(a=>({id:uid(), km:a[0], lat:a[1], lon:a[2], label:a[3], src:'est'})),
    cameras: DEFAULT_CAMS.map(c=>({id:uid(), km:c[0], type:c[1], title:c[2], note:'', photo:c[3]?('img/'+c[3]+'.jpg'):'',
      dir:'down', limit:null, alertDist:null, pinned:false, lat:null, lon:null, enabled:true, verifiedAt:null, updatedAt:now(), src:'user-list'})),
    vehicles:[], drivers:[], activeVehicle:null, activeDriver:null,
    trips:[], savedAt:null
  };
}

/* ---------- บันทึก/โหลด ---------- */
let S;
function load(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw){ S = JSON.parse(raw); S.settings = {...DEFAULT_SETTINGS, ...(S.settings||{})}; return; }
  }catch(e){ console.warn(e); }
  S = freshState();
}
let saveTimer=null;
function save(immediate){
  clearTimeout(saveTimer);
  const doit=()=>{ try{ S.savedAt=now(); localStorage.setItem(LS_KEY, JSON.stringify(S)); updSaved(); }
    catch(e){ toast('⚠️ บันทึกไม่สำเร็จ (พื้นที่เต็ม?) – ลองลบรูป/ทริปเก่า'); } };
  immediate ? doit() : (saveTimer=setTimeout(doit,300));
}
function updSaved(){ const el=$('#savedAt'); if(el && S.savedAt) el.textContent='บันทึกอัตโนมัติ ✓ '+fmtClock(S.savedAt); }

/* ---------- เรขาคณิต ---------- */
const R=6371000, rad=d=>d*Math.PI/180, deg=r=>r*180/Math.PI;
function hav(a1,o1,a2,o2){const dA=rad(a2-a1),dO=rad(o2-o1);const x=Math.sin(dA/2)**2+Math.cos(rad(a1))*Math.cos(rad(a2))*Math.sin(dO/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
function brg(a1,o1,a2,o2){const y=Math.sin(rad(o2-o1))*Math.cos(rad(a2));const x=Math.cos(rad(a1))*Math.sin(rad(a2))-Math.sin(rad(a1))*Math.cos(rad(a2))*Math.cos(rad(o2-o1));return (deg(Math.atan2(y,x))+360)%360;}
const angDiff=(a,b)=>{let d=Math.abs(a-b)%360;return d>180?360-d:d;};

let ROUTE=[]; // เรียงตาม กม. น้อย→มาก
function buildRoute(){
  const all=S.anchors.filter(a=>isFinite(a.km)&&isFinite(a.lat)&&isFinite(a.lon));
  const gps=all.filter(a=>a.src==='gps');
  ROUTE=all.filter(a=>a.src==='gps'||!gps.some(g=>Math.abs(g.km-a.km)<2.5)).sort((a,b)=>a.km-b.km);
}
function kmToLL(km){
  const r=ROUTE; if(r.length<2) return null;
  let i=0;
  if(km<=r[0].km) i=0; else if(km>=r[r.length-1].km) i=r.length-2;
  else { while(i<r.length-2 && km>r[i+1].km) i++; }
  const A=r[i],B=r[i+1],t=(km-A.km)/(B.km-A.km||1);
  return [A.lat+t*(B.lat-A.lat), A.lon+t*(B.lon-A.lon)];
}
function project(lat,lon){
  let best={d:Infinity,km:null};
  const kx=Math.cos(rad(lat))*111320, ky=110540;
  for(let i=0;i<ROUTE.length-1;i++){
    const A=ROUTE[i],B=ROUTE[i+1];
    const ax=(A.lon-lon)*kx, ay=(A.lat-lat)*ky, bx=(B.lon-lon)*kx, by=(B.lat-lat)*ky;
    const vx=bx-ax, vy=by-ay, L2=vx*vx+vy*vy;
    let t=L2?-(ax*vx+ay*vy)/L2:0; t=Math.max(0,Math.min(1,t));
    const d=Math.hypot(ax+t*vx, ay+t*vy);
    if(d<best.d) best={d, km:A.km+t*(B.km-A.km)};
  }
  return best;
}
function camLL(c){ return (c.pinned&&isFinite(c.lat)&&isFinite(c.lon)) ? [c.lat,c.lon] : kmToLL(c.km); }
function camEffKm(c){ return (c.pinned&&isFinite(c.lat)) ? project(c.lat,c.lon).km : c.km; }

/* ---------- แผนที่ ---------- */
let map, baseLayers={}, curBase=null, trafficLayer=null, routeLine=null, kmLabels=null, camLayer=null, meMarker=null, accCircle=null;
let follow=true, editDrag=false;
function initMap(){
  map=L.map('map',{zoomControl:false, attributionControl:true, tap:true}).setView([17.3,99.3],8);
  map.attributionControl.setPrefix('<b>'+CREDIT+'</b>');
  baseLayers.osm=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'});
  baseLayers.sat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Imagery © Esri'});
  baseLayers.hyb=L.layerGroup([
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Imagery © Esri'}),
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}),
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19})
  ]);
  camLayer=L.layerGroup().addTo(map);
  kmLabels=L.layerGroup();
  map.on('dragstart',()=>setFollow(false));
  map.on('contextmenu',e=>{ openCamForm(null,{lat:e.latlng.lat,lon:e.latlng.lng}); });
  map.on('zoomend',()=>{ if(map.getZoom()>=11) kmLabels.addTo(map); else map.removeLayer(kmLabels); });
  setMapMode(S.settings.mapMode||'map', true);
  drawRoute(); drawCams();
}
function setFollow(v){ follow=v; $('#fFollow').classList.toggle('active',v); if(v&&lastFix) map.setView([lastFix.lat,lastFix.lon], Math.max(map.getZoom(),S.settings.followZoom)); }

/* Google Maps (ทางเลือก ต้องมี API key) */
let gmState='none'; // none|loading|ready|error
function loadGoogle(){
  return new Promise((res,rej)=>{
    if(gmState==='ready') return res();
    if(!S.settings.gkey) return rej(new Error('nokey'));
    window.__gmReady=()=>{ const s=document.createElement('script'); s.src='vendor/Leaflet.GoogleMutant.js'; s.onload=()=>{gmState='ready';res();}; s.onerror=()=>{gmState='error';rej(new Error('mutant'));}; document.head.appendChild(s); };
    window.gm_authFailure=()=>{ gmState='error'; toast('Google Maps API key ใช้ไม่ได้ – ตรวจสอบใน Google Cloud'); };
    gmState='loading';
    const s=document.createElement('script');
    s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(S.settings.gkey)+'&callback=__gmReady&language=th&region=TH';
    s.onerror=()=>{gmState='error';rej(new Error('load'));};
    document.head.appendChild(s);
  });
}
async function setMapMode(mode, silent){
  S.settings.mapMode=mode; save();
  if(curBase){ map.removeLayer(curBase); curBase=null; }
  if(trafficLayer){ map.removeLayer(trafficLayer); trafficLayer=null; }
  const useG = S.settings.gkey && S.settings.useGoogleBase;
  if(useG){
    try{
      await loadGoogle();
      const type={map:'roadmap',sat:'satellite',hyb:'hybrid',traffic:'roadmap'}[mode]||'roadmap';
      curBase=L.gridLayer.googleMutant({type, maxZoom:20}).addTo(map);
      if(mode==='traffic'){ curBase.addGoogleLayer('TrafficLayer'); }
      curBase.bringToBack(); return;
    }catch(e){ if(!silent) toast('โหลด Google Maps ไม่ได้ ใช้แผนที่สำรองแทน'); }
  }
  if(mode==='traffic'){
    curBase=baseLayers.osm.addTo(map);
    if(!silent) openTrafficInfo();
    return;
  }
  curBase=({map:baseLayers.osm, sat:baseLayers.sat, hyb:baseLayers.hyb}[mode]||baseLayers.osm).addTo(map);
  if(curBase.bringToBack) curBase.bringToBack();
}
function openTrafficInfo(){
  const ll=lastFix?[lastFix.lat,lastFix.lon]:map.getCenter&&[map.getCenter().lat,map.getCenter().lng];
  modal(`<h3>🚦 สภาพจราจรปัจจุบัน</h3>
  <p class="muted">ดูจราจรสดจาก Google Maps ได้ 2 แบบ</p>
  <div class="card"><b>1) เปิดในแอป Google Maps</b><p class="muted">ไม่ต้องตั้งค่า – เปิดแผนที่ชั้นจราจร ณ ตำแหน่งปัจจุบัน แล้วสลับกลับมาแอปนี้</p>
  <div class="btns"><a class="btn p" target="_blank" rel="noopener" href="${gmapTrafficUrl(ll)}">เปิด Google Maps (จราจร)</a>
  <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('กรุงเทพมหานคร')}&travelmode=driving">นำทางไป กทม.</a></div></div>
  <div class="card"><b>2) แสดงจราจรในแอปนี้</b><p class="muted">ใส่ Google Maps API key ในหน้า ⚙️ ตั้งค่า (Maps JavaScript API) แล้วเลือกชั้น “จราจร” จะเห็นเส้นสีเขียว/ส้ม/แดงบนแผนที่นี้พร้อมจุดกล้อง</p></div>
  <button class="btn" onclick="closeModal()">ปิด</button>`);
}
function gmapTrafficUrl(ll){ ll=ll||[17.3,99.3]; return `https://www.google.com/maps/@?api=1&map_action=map&center=${ll[0].toFixed(5)},${ll[1].toFixed(5)}&zoom=13&layer=traffic`; }
function gmapPointUrl(ll){ return `https://www.google.com/maps/search/?api=1&query=${ll[0].toFixed(6)},${ll[1].toFixed(6)}`; }
function gmapNavUrl(ll){ return `https://www.google.com/maps/dir/?api=1&destination=${ll[0].toFixed(6)},${ll[1].toFixed(6)}&travelmode=driving`; }

function drawRoute(){
  if(routeLine) map.removeLayer(routeLine);
  kmLabels.clearLayers();
  if(!S.settings.showRoute || ROUTE.length<2) return;
  routeLine=L.polyline(ROUTE.map(a=>[a.lat,a.lon]),{color:'#38bdf8',weight:5,opacity:.45,dashArray:'8 6'}).addTo(map);
  for(let k=Math.ceil(ROUTE[0].km/10)*10;k<=ROUTE[ROUTE.length-1].km;k+=10){
    const ll=kmToLL(k); L.marker(ll,{interactive:false,icon:L.divIcon({className:'kmlab',html:'กม.'+k,iconSize:[44,12],iconAnchor:[-4,6]})}).addTo(kmLabels);
  }
  ROUTE.filter(a=>a.src==='gps').forEach(a=>L.circleMarker([a.lat,a.lon],{radius:5,color:'#22c55e',weight:2,fillOpacity:.9}).bindTooltip('หลัก กม.'+a.km+' (GPS)').addTo(kmLabels));
}
function camIcon(c){
  const t=TYPES[c.type]||TYPES.other;
  const cls='cm'+(c.pinned?'':' est')+(c.enabled?'':' dis');
  return L.divIcon({className:'',html:`<div class="${cls}" style="--c:${t.color}"><span>${t.icon}</span>${fmtKm(c.km)}</div>`,iconSize:null,iconAnchor:[18,14]});
}
const fmtKm=k=>(Math.round(k*10)/10).toString();
function drawCams(){
  camLayer.clearLayers();
  S.cameras.forEach(c=>{
    const ll=camLL(c); if(!ll) return;
    const m=L.marker(ll,{icon:camIcon(c),draggable:editDrag,zIndexOffset:c.enabled?500:0});
    m.bindPopup(()=>camPopup(c),{maxWidth:280});
    m.on('dragend',e=>{ const p=e.target.getLatLng(); c.lat=p.lat; c.lon=p.lng; c.pinned=true; c.updatedAt=now(); save(); drawCams(); renderCamList(); toast('ย้ายตำแหน่ง กม.'+fmtKm(c.km)+' แล้ว (ปักหมุด)'); });
    m.addTo(camLayer);
  });
}
function camPopup(c){
  const t=TYPES[c.type]||TYPES.other, ll=camLL(c);
  const lim=c.limit||activeLimit();
  return `<div class="pop"><b style="font-size:16px">${t.icon} กม. ${fmtKm(c.km)}</b> <span class="chip ${c.pinned?'ok':'est'}">${c.pinned?'พิกัดยืนยันแล้ว':'พิกัดประมาณ'}</span>
  <div>${esc(t.label)}</div><div>${esc(c.title)}</div>${c.note?`<div class="muted">${esc(c.note)}</div>`:''}
  ${c.photo?`<img src="${c.photo}" alt="">`:''}
  <div class="muted">ทิศทาง: ${DIRS[c.dir]} · จำกัด ${lim} กม./ชม.<br>${ll[0].toFixed(5)}, ${ll[1].toFixed(5)}</div>
  <div class="btns" style="margin-top:8px"><button class="btn s p" onclick="openCamForm('${c.id}')">✏️ แก้ไข</button>
  <button class="btn s" onclick="pinHere('${c.id}')">📍 ปักตรงที่ฉันอยู่</button>
  <a class="btn s" target="_blank" rel="noopener" href="${gmapPointUrl(ll)}">Google Maps</a></div></div>`;
}

/* ---------- GPS / การขับ ---------- */
let watchId=null, running=false, lastFix=null, prevFix=null, kmHist=[], dirNow='down', wakeLock=null;
let fired={}, passed={}, lastOverspeedSay=0, overStart=0, trip=null, tripPts=[], lastPtT=0, lastFlush=0;
let sim=null;

function activeVehicle(){ return S.vehicles.find(v=>v.id===S.activeVehicle)||null; }
function activeDriver(){ return S.drivers.find(v=>v.id===S.activeDriver)||null; }
function activeLimit(){ const v=activeVehicle(); return (v&&+v.limit)||+S.settings.defaultLimit||90; }

async function start(){
  unlockAudio();
  if(S.settings.notify && 'Notification' in window && Notification.permission==='default'){ try{ await Notification.requestPermission(); }catch(e){} }
  if(S.settings.wake) requestWake();
  running=true; fired={}; passed={}; kmHist=[];
  trip={id:uid(), start:now(), end:null, vehicle:activeVehicle(), driver:activeDriver(), dist:0, maxSpd:0, movSec:0, alerts:0, overs:0, events:[], sim:!!sim};
  tripPts=[]; lastPtT=0;
  S.trips.unshift({id:trip.id, start:trip.start, end:null, vehicle:trip.vehicle, driver:trip.driver, dist:0, maxSpd:0, avg:0, alerts:0, overs:0, sim:trip.sim});
  save(true);
  $('#startBtn').textContent='■ หยุดเดินทาง'; $('#startBtn').classList.add('stop');
  if(!sim){
    if(!('geolocation' in navigator)){ gpsStatus('err','เครื่องไม่รองรับ GPS'); return; }
    gpsStatus('wait','กำลังหา GPS…');
    watchId=navigator.geolocation.watchPosition(onPos,onPosErr,{enableHighAccuracy:true,maximumAge:1000,timeout:20000});
  }
  setFollow(true);
  say('เริ่มเดินทาง ระบบเตือนกล้องพร้อมทำงาน');
}
function stop(){
  running=false;
  if(watchId!=null){ navigator.geolocation.clearWatch(watchId); watchId=null; }
  if(sim){ clearInterval(sim.timer); sim=null; $('#simBadge').classList.remove('show'); }
  releaseWake();
  if(trip){ trip.end=now(); flushTrip(true); trip=null; }
  $('#startBtn').textContent='▶ เริ่มเดินทาง'; $('#startBtn').classList.remove('stop');
  gpsStatus('', 'GPS ปิด');
  renderLog();
}
function gpsStatus(cls,txt){ const d=$('#gpsDot'); d.className='dot'+(cls?' '+cls:''); $('#gpsTxt').textContent=txt; }
function onPosErr(e){
  const m={1:'ไม่ได้รับอนุญาตใช้ตำแหน่ง',2:'หาตำแหน่งไม่ได้',3:'GPS หมดเวลา'}[e.code]||'GPS ผิดพลาด';
  gpsStatus('err',m);
  if(e.code===1) modal(`<h3>⚠️ ต้องอนุญาตตำแหน่ง</h3><p>เปิดสิทธิ์ “ตำแหน่ง” ให้เว็บนี้ในเบราว์เซอร์ (และเปิด GPS ของมือถือ) แล้วกดเริ่มเดินทางอีกครั้ง</p><p class="muted">ต้องเปิดผ่านลิงก์ https:// เท่านั้น GPS จึงทำงาน</p><button class="btn p" onclick="closeModal()">ตกลง</button>`);
}
function onPos(p){
  const c=p.coords;
  feed({lat:c.latitude, lon:c.longitude, acc:c.accuracy, spd:(c.speed!=null&&c.speed>=0)?c.speed*3.6:null, hdg:(c.heading!=null&&!isNaN(c.heading))?c.heading:null, t:p.timestamp||now()});
}
function feed(f){
  // คำนวณความเร็ว/ทิศ ถ้าเครื่องไม่ส่งมา
  if(prevFix){
    const dt=(f.t-prevFix.t)/1000, dd=hav(prevFix.lat,prevFix.lon,f.lat,f.lon);
    if(f.spd==null && dt>0.5) f.spd=Math.min(250,(dd/dt)*3.6);
    if(f.hdg==null && dd>4) f.hdg=brg(prevFix.lat,prevFix.lon,f.lat,f.lon);
    if(trip && dt>0 && dd<2000 && (f.acc==null||f.acc<80)){ trip.dist+=dd; if((f.spd||0)>5) trip.movSec+=dt; }
  }
  if(f.hdg==null && lastFix) f.hdg=lastFix.hdg;
  f.spd=f.spd||0;
  prevFix=f; lastFix=f;
  gpsStatus('on', 'GPS ±'+Math.round(f.acc||5)+' ม.');
  // ตำแหน่งบนเส้นทาง
  const pr=project(f.lat,f.lon); f.km=pr.km; f.off=pr.d;
  const onRoute=pr.d<1500;
  kmHist.push({t:f.t,km:pr.km}); while(kmHist.length&&f.t-kmHist[0].t>40000) kmHist.shift();
  if(S.settings.dirMode==='auto'){ const d=pr.km-kmHist[0].km; if(d<-0.08) dirNow='down'; else if(d>0.08) dirNow='up'; }
  else dirNow=S.settings.dirMode;
  $('#kmTxt').textContent=onRoute?('กม. '+pr.km.toFixed(1)+(dirNow==='down'?' ↓':' ↑')):('นอกเส้นทาง '+(pr.d/1000).toFixed(1)+' กม.');
  // แผนที่
  const ll=[f.lat,f.lon];
  if(!meMarker){ meMarker=L.marker(ll,{icon:meIcon(f.hdg),zIndexOffset:2000,interactive:false}).addTo(map); accCircle=L.circle(ll,{radius:f.acc||10,weight:1,color:'#3b82f6',fillOpacity:.08}).addTo(map); }
  else { meMarker.setLatLng(ll); meMarker.setIcon(meIcon(f.hdg)); accCircle.setLatLng(ll).setRadius(f.acc||10); }
  if(follow) map.setView(ll, map.getZoom()<11?S.settings.followZoom:map.getZoom(), {animate:true});
  // ทริป
  if(trip){
    trip.maxSpd=Math.max(trip.maxSpd,f.spd);
    if(f.t-lastPtT>=3000){ tripPts.push([Math.round((f.t-trip.start)/1000), +f.lat.toFixed(5), +f.lon.toFixed(5), Math.round(f.spd), +(pr.km||0).toFixed(2)]); lastPtT=f.t; }
    if(f.t-lastFlush>15000){ flushTrip(); lastFlush=f.t; }
  }
  evaluate(f,onRoute);
}
function meIcon(h){
  const r=h==null?0:h;
  return L.divIcon({className:'',iconSize:[34,34],iconAnchor:[17,17],html:`<div class="me"><svg width="34" height="34" viewBox="0 0 34 34" style="transform:rotate(${r}deg)"><circle cx="17" cy="17" r="15" fill="#1d4ed8" stroke="#fff" stroke-width="3"/><path d="M17 6 L24 24 L17 20 L10 24 Z" fill="#fff"/></svg></div>`});
}

/* ---------- เครื่องยนต์เตือน ---------- */
function stagesFor(c){
  let st=(S.settings.stages||[]).map(Number).filter(x=>x>0);
  if(c.alertDist>0){ st=st.filter(x=>x<c.alertDist); st.push(+c.alertDist); }
  return [...new Set(st)].sort((a,b)=>b-a);
}
function camDistance(c,f,onRoute){
  if(onRoute){ const ek=camEffKm(c); return (dirNow==='down'?(f.km-ek):(ek-f.km))*1000; }
  const ll=camLL(c); if(!ll) return -1e9;
  const d=hav(f.lat,f.lon,ll[0],ll[1]);
  if(f.hdg==null) return d;
  return angDiff(f.hdg, brg(f.lat,f.lon,ll[0],ll[1]))<75 ? d : -d;
}
function evaluate(f,onRoute){
  const spd=f.spd; let next=null, nextD=Infinity;
  for(const c of S.cameras){
    if(!c.enabled) continue;
    if(c.dir!=='both' && c.dir!==dirNow) continue;
    const d=camDistance(c,f,onRoute);
    if(d>0 && d<nextD){ nextD=d; next=c; }
    const st=stagesFor(c); if(!st.length) continue;
    const fs=fired[c.id]||(fired[c.id]=new Set());
    if(d>-40){
      let hit=null; for(const s of st){ if(d<=s && !fs.has(s)) hit=s; }
      if(hit!=null){ st.forEach(s=>{ if(s>=hit) fs.add(s); }); fireAlert(c,Math.max(0,d),st.indexOf(hit),st.length,spd); }
    }
    if(d<-3000 && fs.size){ fs.clear(); }
  }
  // HUD
  const lim=next?(next.limit||activeLimit()):activeLimit();
  $('#spd').textContent=Math.round(spd);
  $('#limit').textContent=lim;
  const over=spd>lim+(+S.settings.tol||0);
  const near=next && nextD<=(stagesFor(next)[0]||1000);
  $('#speedo').className=over?'over':(near?'near':'');
  if(next){
    const t=TYPES[next.type]||TYPES.other;
    $('#nIc').textContent=t.icon; $('#nKm').innerHTML='กม. '+fmtKm(next.km)+(next.pinned?'':' <span class="est">≈ประมาณ</span>');
    $('#nT').textContent=next.title; $('#nD').textContent=distTxt(nextD);
    const first=stagesFor(next)[0]||2000; const pct=Math.max(0,Math.min(100,(1-nextD/first)*100));
    const bar=$('#nBar'); bar.style.width=pct+'%'; bar.style.background=nextD<=300?'var(--bad)':nextD<=1000?'var(--warn)':'var(--ok)';
  } else { $('#nIc').textContent='✅'; $('#nKm').textContent='ไม่มีจุดข้างหน้า'; $('#nT').textContent=onRoute?'ตามทิศทางที่เลือก':'อยู่นอกเส้นทาง ทล.1'; $('#nD').textContent='–'; $('#nBar').style.width='0'; }
  // เร็วเกินทั่วไป
  if(over){ if(!overStart) overStart=f.t;
    if(f.t-overStart>3000 && f.t-lastOverspeedSay>(near?8000:30000) && (near||S.settings.generalOverspeed)){
      lastOverspeedSay=f.t; beep(3,1100); vib([200,80,200,80,200]);
      say('ความเร็ว '+Math.round(spd)+' เกินกำหนด '+lim+' ลดความเร็วด้วย');
      if(trip){ trip.overs++; trip.events.push({t:f.t,type:'overspeed',km:+(f.km||0).toFixed(1),spd:Math.round(spd),limit:lim,near:!!near}); }
    }
  } else overStart=0;
}
function distTxt(d){ if(d>=1000) return (d/1000).toFixed(d>=10000?0:1)+' กม.'; return Math.max(0,Math.round(d/10)*10)+' ม.'; }
function distSay(d){ if(d>=1000){ const k=Math.round(d/100)/10; return (k%1===0?k.toFixed(0):k.toFixed(1))+' กิโลเมตร'; } return Math.max(50,Math.round(d/50)*50)+' เมตร'; }

let alertTimer=null, alertCam=null;
function fireAlert(c,d,idx,n,spd){
  const t=TYPES[c.type]||TYPES.other, lim=c.limit||activeLimit();
  const level=n<=1?2:(idx===0?0:(idx===n-1?2:1));
  alertCam=c;
  const el=$('#alert'); el.className='show l'+level;
  $('#aIc').textContent=t.icon; $('#aD').textContent=d<60?'ถึงแล้ว!':('อีก '+distTxt(d));
  $('#aT').textContent=t.label+' · กม. '+fmtKm(c.km);
  $('#aS').textContent=c.title+' · จำกัด '+lim+' · ตอนนี้ '+Math.round(spd)+' กม./ชม.'+(c.pinned?'':' (ตำแหน่งประมาณ)');
  const img=$('#aImg'); if(c.photo){ img.src=c.photo; img.style.display=''; } else img.style.display='none';
  clearTimeout(alertTimer); alertTimer=setTimeout(()=>el.className='', level===2?14000:9000);
  beep(level+1, level===2?1200:880); vib(level===2?[400,120,400,120,400]:[250,100,250]);
  let msg='อีก '+distSay(d)+' '+t.say+' กิโลเมตรที่ '+fmtKm(c.km).replace('.',' จุด ');
  if(spd>lim) msg+=' ความเร็วตอนนี้ '+Math.round(spd)+' เกิน '+lim+' ลดความเร็ว';
  else msg+=' จำกัด '+lim;
  say(msg);
  sysNotify(t.icon+' อีก '+distTxt(d)+' · กม. '+fmtKm(c.km), t.label+' – '+c.title+' (จำกัด '+lim+')', 'cam-'+c.id);
  if(trip){ trip.alerts++; trip.events.push({t:now(),type:'alert',cam:c.id,km:c.km,camType:c.type,d:Math.round(d),spd:Math.round(spd),limit:lim}); }
}

/* เสียง / สั่น / พูด / แจ้งเตือน */
let actx=null, thVoice=null;
function unlockAudio(){
  try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); actx.resume(); }catch(e){}
  try{ const u=new SpeechSynthesisUtterance(' '); u.volume=0; speechSynthesis.speak(u); }catch(e){}
}
function pickVoice(){ try{ const v=speechSynthesis.getVoices(); thVoice=v.find(x=>/^th/i.test(x.lang))||null; }catch(e){} }
if('speechSynthesis' in window){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; }
function beep(n,freq){
  if(!S.settings.beep||!actx) return;
  for(let i=0;i<n;i++){ const o=actx.createOscillator(), g=actx.createGain(); o.type='square'; o.frequency.value=freq||900;
    const t0=actx.currentTime+i*0.28; g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(0.35,t0+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.2);
    o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0+0.22); }
}
function vib(p){ if(S.settings.vibrate && navigator.vibrate) try{ navigator.vibrate(p); }catch(e){} }
function say(txt){
  if(!S.settings.tts||!('speechSynthesis' in window)) return;
  try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(txt); u.lang='th-TH'; if(thVoice) u.voice=thVoice; u.rate=1.05; speechSynthesis.speak(u); }catch(e){}
}
async function sysNotify(title,body,tag){
  if(!S.settings.notify||!('Notification' in window)||Notification.permission!=='granted') return;
  const opt={body,tag,renotify:true,icon:'icon-192.png',badge:'icon-192.png',vibrate:[300,100,300]};
  try{ const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration(); if(reg){ await reg.showNotification(title,opt); return; } }catch(e){}
  try{ new Notification(title,opt); }catch(e){}
}
async function requestWake(){ try{ if('wakeLock' in navigator){ wakeLock=await navigator.wakeLock.request('screen'); } }catch(e){} }
function releaseWake(){ try{ wakeLock&&wakeLock.release(); }catch(e){} wakeLock=null; }
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&running&&S.settings.wake) requestWake(); if(document.hidden&&trip) flushTrip(); });

/* ---------- ทริป ---------- */
function flushTrip(final){
  if(!trip) return;
  const meta=S.trips.find(t=>t.id===trip.id);
  if(meta){ Object.assign(meta,{end:trip.end, dist:Math.round(trip.dist), maxSpd:Math.round(trip.maxSpd), avg:trip.movSec>0?Math.round(trip.dist/trip.movSec*3.6):0, alerts:trip.alerts, overs:trip.overs, lastSave:now()}); }
  try{ localStorage.setItem(TRIP_PREFIX+trip.id, JSON.stringify({pts:tripPts, events:trip.events})); }catch(e){ toast('⚠️ พื้นที่เก็บบันทึกเต็ม ลบทริปเก่าในหน้า “บันทึก”'); }
  save(!!final);
  if(final||$('#sh-log').classList.contains('show')) renderLog();
}

/* ---------- จำลองการขับ ---------- */
function startSim(){
  if(running) stop();
  const st=S.settings; let km=+st.simStart||680; const spd=+st.simSpeed||95, mult=+st.simMult||1;
  sim={km}; $('#simBadge').classList.add('show');
  start();
  gpsStatus('on','GPS จำลอง');
  let t=now();
  sim.timer=setInterval(()=>{
    t+=1000*mult;
    const v=spd+(Math.random()*6-3);
    sim.km+= (st.dirMode==='up'?1:-1)*v/3600*mult;
    const ll=kmToLL(sim.km); if(!ll){ stop(); return; }
    feed({lat:ll[0], lon:ll[1], acc:6, spd:v, hdg:null, t});
    if(sim && (sim.km<ROUTE[0].km||sim.km>ROUTE[ROUTE.length-1].km)) stop();
  },1000);
  setTab('map');
}

/* ---------- ปุ่มบนแผนที่ ---------- */
function pinHere(id){
  const c=S.cameras.find(x=>x.id===id); if(!c) return;
  if(!lastFix){ toast('ยังไม่มีตำแหน่ง GPS – กดเริ่มเดินทางก่อน'); return; }
  c.lat=lastFix.lat; c.lon=lastFix.lon; c.pinned=true; c.verifiedAt=now(); c.updatedAt=now();
  save(); drawCams(); renderCamList(); map.closePopup();
  if(trip) trip.events.push({t:now(),type:'pin',cam:c.id,km:c.km,lat:c.lat,lon:c.lon});
  toast('✓ ยืนยันพิกัด กม.'+fmtKm(c.km)+' แล้ว');
}
function kmHere(){
  if(!lastFix){ toast('ยังไม่มีตำแหน่ง GPS – กดเริ่มเดินทางก่อน'); return; }
  const est=lastFix.km!=null?Math.round(lastFix.km):'';
  modal(`<h3>📍 บันทึกหลัก กม. ตรงนี้</h3>
   <p class="muted">เมื่อขับผ่านหลักกิโลเมตร ให้ใส่เลขบนหลัก แอปจะใช้พิกัด GPS จริงตรงนี้ปรับแผนที่ กม. ให้แม่นยำขึ้น (กล้องที่ยังเป็น “ประมาณ” จะขยับตามอัตโนมัติ)</p>
   <label class="f">เลข กม. บนหลัก</label><input class="in" id="kmIn" type="number" inputmode="decimal" step="0.1" value="${est}" style="font-size:28px;text-align:center">
   <div class="muted" style="margin:6px 0">พิกัด: ${lastFix.lat.toFixed(5)}, ${lastFix.lon.toFixed(5)} (±${Math.round(lastFix.acc||5)} ม.)</div>
   <div class="btns"><button class="btn g" id="kmOk">บันทึก</button><button class="btn" onclick="closeModal()">ยกเลิก</button></div>`);
  const fix={...lastFix};
  $('#kmOk').onclick=()=>{ const k=parseFloat($('#kmIn').value); if(!isFinite(k)){ toast('ใส่เลข กม.'); return; }
    S.anchors=S.anchors.filter(a=>!(a.src==='gps'&&Math.abs(a.km-k)<0.05));
    S.anchors.push({id:uid(),km:k,lat:fix.lat,lon:fix.lon,label:'บันทึกจาก GPS '+fmtTime(now()),src:'gps'});
    buildRoute(); drawRoute(); drawCams(); save(); closeModal(); renderCamList();
    if(trip) trip.events.push({t:now(),type:'calib',km:k,lat:fix.lat,lon:fix.lon});
    toast('✓ บันทึกหลัก กม.'+k+' แล้ว'); };
}

/* ---------- ฟอร์มจุดกล้อง ---------- */
function parseCoords(txt){
  if(!txt) return null; txt=decodeURIComponent(txt);
  const pats=[/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|query|ll|destination|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /(-?\d{1,2}\.\d{3,})\s*[, ]\s*(-?\d{2,3}\.\d{3,})/];
  for(const p of pats){ const m=txt.match(p); if(m){ const a=+m[1], b=+m[2]; if(Math.abs(a)<=90&&Math.abs(b)<=180) return [a,b]; } }
  return null;
}
let formPhoto=null;
function openCamForm(id,pre){
  const c=id?S.cameras.find(x=>x.id===id):null;
  map.closePopup();
  const d=c||{km:pre&&pre.lat!=null?+project(pre.lat,pre.lon).km.toFixed(1):(lastFix&&lastFix.km?+lastFix.km.toFixed(1):''), type:'fixed', title:'', note:'', dir:'down', limit:null, alertDist:null, pinned:!!pre, lat:pre?pre.lat:null, lon:pre?pre.lon:null, enabled:true, photo:''};
  formPhoto=d.photo||'';
  const ll=c?camLL(c):(pre?[pre.lat,pre.lon]:null);
  modal(`<h3>${c?'✏️ แก้ไขจุด':'➕ เพิ่มจุดใหม่'}</h3>
  <div class="grid2"><div><label class="f">หลัก กม.</label><input class="in" id="fKm" type="number" step="0.1" inputmode="decimal" value="${d.km??''}"></div>
  <div><label class="f">ประเภท</label><select class="in" id="fType">${Object.entries(TYPES).map(([k,t])=>`<option value="${k}" ${k===d.type?'selected':''}>${t.icon} ${t.label}</option>`).join('')}</select></div></div>
  <label class="f">รายละเอียด (ตำแหน่ง/ลักษณะ)</label><input class="in" id="fTitle" value="${esc(d.title)}" placeholder="เช่น บนเสาเกาะกลาง, บนสะพานลอย">
  <label class="f">หมายเหตุ</label><input class="in" id="fNote" value="${esc(d.note)}">
  <div class="grid3"><div><label class="f">ทิศทาง</label><select class="in" id="fDir">${Object.entries(DIRS).map(([k,v])=>`<option value="${k}" ${k===d.dir?'selected':''}>${v.split(' ')[0]}</option>`).join('')}</select></div>
  <div><label class="f">จำกัดความเร็ว</label><input class="in" id="fLim" type="number" inputmode="numeric" placeholder="${activeLimit()}" value="${d.limit??''}"></div>
  <div><label class="f">เตือนแรก (ม.)</label><input class="in" id="fAd" type="number" inputmode="numeric" placeholder="${S.settings.stages[0]||''}" value="${d.alertDist??''}"></div></div>
  <div class="card" style="margin-top:10px"><h3>ตำแหน่ง</h3>
   <div class="sw"><span>ใช้พิกัดจริง (ปักหมุด)<br><span class="muted">ปิด = คำนวณจากเลข กม. (ประมาณ)</span></span><input type="checkbox" id="fPin" ${d.pinned?'checked':''}></div>
   <div class="grid2"><input class="in" id="fLat" placeholder="ละติจูด" inputmode="decimal" value="${d.lat??(ll?ll[0].toFixed(6):'')}"><input class="in" id="fLon" placeholder="ลองจิจูด" inputmode="decimal" value="${d.lon??(ll?ll[1].toFixed(6):'')}"></div>
   <label class="f">วางลิงก์ Google Maps หรือพิกัด “16.88, 99.12”</label>
   <div style="display:flex;gap:6px"><input class="in" id="fPaste" placeholder="https://www.google.com/maps/…@16.88,99.12…"><button class="btn s" id="fParse">ใช้</button></div>
   <div class="btns" style="margin-top:8px"><button class="btn s" id="fGps">📍 ใช้ตำแหน่ง GPS ตอนนี้</button>${ll?`<a class="btn s" target="_blank" rel="noopener" href="${gmapPointUrl(ll)}">ดูใน Google Maps</a>`:''}</div>
   <div class="muted" style="margin-top:6px">ลิงก์ย่อ maps.app.goo.gl อ่านพิกัดไม่ได้ – ใน Google Maps กดค้างที่จุดแล้วคัดลอกตัวเลขพิกัดมาวางแทน · หรือกดค้างบนแผนที่ในแอปนี้เพื่อเพิ่มจุด · เปิดโหมด ✋ลากหมุดในตั้งค่าเพื่อลากย้าย</div></div>
  <div class="card"><h3>รูปภาพ</h3><img id="fImg" style="max-width:100%;border-radius:8px;${formPhoto?'':'display:none'}" src="${formPhoto}">
   <div class="btns"><label class="btn s">📷 เลือกรูป<input type="file" accept="image/*" id="fFile" hidden></label><button class="btn s" id="fNoImg">ลบรูป</button></div></div>
  <div class="sw"><span>เปิดใช้งานการเตือนจุดนี้</span><input type="checkbox" id="fEn" ${d.enabled?'checked':''}></div>
  <div class="btns" style="margin-top:10px"><button class="btn g" id="fSave">บันทึก</button><button class="btn" onclick="closeModal()">ยกเลิก</button>${c?'<button class="btn r" id="fDel" style="margin-left:auto">ลบจุดนี้</button>':''}</div>`);
  $('#fParse').onclick=()=>{ const p=parseCoords($('#fPaste').value); if(!p){ toast('อ่านพิกัดไม่ได้'); return; } $('#fLat').value=p[0].toFixed(6); $('#fLon').value=p[1].toFixed(6); $('#fPin').checked=true; if(!$('#fKm').value) $('#fKm').value=project(p[0],p[1]).km.toFixed(1); toast('✓ ได้พิกัดแล้ว'); };
  $('#fGps').onclick=()=>{ if(!lastFix){ toast('ยังไม่มี GPS'); return; } $('#fLat').value=lastFix.lat.toFixed(6); $('#fLon').value=lastFix.lon.toFixed(6); $('#fPin').checked=true; if(!$('#fKm').value&&lastFix.km) $('#fKm').value=lastFix.km.toFixed(1); };
  $('#fFile').onchange=e=>{ const f=e.target.files[0]; if(!f) return; resizeImg(f,520,0.62).then(u=>{ formPhoto=u; const im=$('#fImg'); im.src=u; im.style.display=''; }); };
  $('#fNoImg').onclick=()=>{ formPhoto=''; $('#fImg').style.display='none'; };
  if(c) $('#fDel').onclick=()=>{ modal(`<h3>ลบจุด กม.${fmtKm(c.km)}?</h3><p>${esc(c.title)}</p><div class="btns"><button class="btn r" id="dYes">ลบ</button><button class="btn" onclick="openCamForm('${c.id}')">ยกเลิก</button></div>`); $('#dYes').onclick=()=>{ S.cameras=S.cameras.filter(x=>x.id!==c.id); save(); drawCams(); renderCamList(); closeModal(); toast('ลบแล้ว'); }; };
  $('#fSave').onclick=()=>{
    const km=parseFloat($('#fKm').value); if(!isFinite(km)){ toast('ใส่เลข กม.'); return; }
    const pin=$('#fPin').checked, lat=parseFloat($('#fLat').value), lon=parseFloat($('#fLon').value);
    if(pin&&!(isFinite(lat)&&isFinite(lon))){ toast('ใส่พิกัด หรือปิด “ใช้พิกัดจริง”'); return; }
    const o=c||{id:uid(), verifiedAt:null, src:'user'};
    Object.assign(o,{km, type:$('#fType').value, title:$('#fTitle').value.trim()||TYPES[$('#fType').value].label, note:$('#fNote').value.trim(), dir:$('#fDir').value,
      limit:parseInt($('#fLim').value)||null, alertDist:parseInt($('#fAd').value)||null, pinned:pin, lat:pin?lat:null, lon:pin?lon:null, enabled:$('#fEn').checked, photo:formPhoto, updatedAt:now()});
    if(!c) S.cameras.push(o);
    S.cameras.sort((a,b)=>b.km-a.km);
    save(); drawCams(); renderCamList(); closeModal(); toast('✓ บันทึกจุด กม.'+fmtKm(km)+' แล้ว');
    if(fired[o.id]) fired[o.id].clear();
  };
}
function resizeImg(file,max,q){
  return new Promise(res=>{ const r=new FileReader(); r.onload=()=>{ const im=new Image(); im.onload=()=>{ const s=Math.min(1,max/Math.max(im.width,im.height)); const cv=document.createElement('canvas'); cv.width=im.width*s; cv.height=im.height*s; cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height); res(cv.toDataURL('image/jpeg',q)); }; im.src=r.result; }; r.readAsDataURL(file); });
}

/* ---------- รายการจุด ---------- */
function renderCamList(){
  const q=($('#camSearch').value||'').trim().toLowerCase();
  const nPin=S.cameras.filter(c=>c.pinned).length, nGps=S.anchors.filter(a=>a.src==='gps').length;
  $('#calibNote').innerHTML=`ตำแหน่งยืนยันแล้ว <b>${nPin}/${S.cameras.length}</b> จุด · หลัก กม. จาก GPS <b>${nGps}</b> หลัก<br>จุดที่ขึ้น “ประมาณ” คำนวณจากเลข กม. (คลาดได้ ~1–3 กม.) – ขณะขับผ่านให้กด <b>📍 กล้องอยู่ตรงนี้</b> ตอนเตือน หรือ <b>📍กม.</b> ตอนผ่านหลักกิโลเมตร เพื่อให้แม่นยำ`;
  const f=lastFix;
  const list=S.cameras.slice().sort((a,b)=>b.km-a.km).filter(c=>!q||String(c.km).includes(q)||(c.title+c.note+(TYPES[c.type]||{}).label).toLowerCase().includes(q));
  $('#camList').innerHTML=list.map(c=>{ const t=TYPES[c.type]||TYPES.other; let dd='';
    if(f&&f.km!=null){ const d=(dirNow==='down'?f.km-camEffKm(c):camEffKm(c)-f.km); dd=d>0?` · อีก ${d.toFixed(1)} กม.`:' · ผ่านแล้ว'; }
    return `<div class="camrow ${c.enabled?'':'dis'}"><div class="ic">${t.icon}</div><div class="mid"><b>กม. ${fmtKm(c.km)}</b> <span class="chip ${c.pinned?'ok':'est'}">${c.pinned?'ยืนยัน ✓':'ประมาณ'}</span>${c.enabled?'':' <span class="chip off">ปิด</span>'}
    <div>${esc(c.title)}</div><div>${esc(t.label)} · ${DIRS[c.dir].split(' ')[0]}${c.limit?' · '+c.limit+' กม./ชม.':''}${dd}</div></div>
    <div style="display:flex;flex-direction:column;gap:4px"><button class="btn s" onclick="openCamForm('${c.id}')">แก้ไข</button><button class="btn s" onclick="flyCam('${c.id}')">แผนที่</button></div></div>`; }).join('')||'<p class="muted">ไม่พบ</p>';
}
function flyCam(id){ const c=S.cameras.find(x=>x.id===id); const ll=camLL(c); setTab('map'); setFollow(false); map.setView(ll,16);
  camLayer.eachLayer(m=>{ const p=m.getLatLng(); if(Math.abs(p.lat-ll[0])<1e-7&&Math.abs(p.lng-ll[1])<1e-7) m.openPopup(); }); }

/* ---------- รถ & คนขับ ---------- */
const VFIELDS=[['plate','ทะเบียนรถ','กข 1234'],['province','จังหวัด','ลำปาง'],['brand','ยี่ห้อ','BMW'],['model','รุ่น',''],['color','สี',''],['vtype','ประเภทรถ','รถยนต์นั่งส่วนบุคคล'],['limit','ความเร็วจำกัดของรถคันนี้ (กม./ชม.)','90'],['insurance','ประกันภัย / เลขกรมธรรม์',''],['taxExp','วันครบกำหนดภาษี/พ.ร.บ.','date']];
const DFIELDS=[['name','ชื่อ-นามสกุล',''],['phone','เบอร์โทร',''],['license','เลขใบขับขี่',''],['ltype','ประเภทใบขับขี่','ส่วนบุคคล'],['lexp','วันหมดอายุใบขับขี่','date'],['blood','กรุ๊ปเลือด',''],['emName','ผู้ติดต่อฉุกเฉิน',''],['emPhone','เบอร์ผู้ติดต่อฉุกเฉิน','']];
function daysTo(d){ if(!d) return null; return Math.ceil((new Date(d)-new Date())/86400000); }
function expChip(d){ const n=daysTo(d); if(n==null) return ''; if(n<0) return '<span class="chip" style="background:#7f1d1d;color:#fecaca">หมดอายุแล้ว</span>'; if(n<=30) return `<span class="chip est">อีก ${n} วันหมดอายุ</span>`; return ''; }
function renderVeh(){
  const vrow=v=>`<div class="camrow"><div class="ic">🚗</div><div class="mid"><b>${esc(v.plate||'(ไม่มีทะเบียน)')} ${esc(v.province||'')}</b> ${S.activeVehicle===v.id?'<span class="chip ok">ใช้งานอยู่</span>':''} ${expChip(v.taxExp)}<div>${esc([v.brand,v.model,v.color].filter(Boolean).join(' · '))}</div><div>${esc(v.vtype||'')} · จำกัด ${v.limit||S.settings.defaultLimit} กม./ชม.</div></div>
   <div style="display:flex;flex-direction:column;gap:4px">${S.activeVehicle===v.id?'':`<button class="btn s g" onclick="useVeh('${v.id}')">ใช้คันนี้</button>`}<button class="btn s" onclick="editPerson('v','${v.id}')">แก้ไข</button></div></div>`;
  const drow=d=>`<div class="camrow"><div class="ic">🧑‍✈️</div><div class="mid"><b>${esc(d.name||'(ไม่มีชื่อ)')}</b> ${S.activeDriver===d.id?'<span class="chip ok">ขับอยู่</span>':''} ${expChip(d.lexp)}<div>☎ ${esc(d.phone||'-')} · ใบขับขี่ ${esc(d.license||'-')}</div><div>ฉุกเฉิน: ${esc(d.emName||'-')} ${esc(d.emPhone||'')}${d.blood?' · กรุ๊ปเลือด '+esc(d.blood):''}</div></div>
   <div style="display:flex;flex-direction:column;gap:4px">${S.activeDriver===d.id?'':`<button class="btn s g" onclick="useDrv('${d.id}')">เลือก</button>`}<button class="btn s" onclick="editPerson('d','${d.id}')">แก้ไข</button></div></div>`;
  $('#vehBody').innerHTML=`<div class="card"><h3>🚗 รถ</h3>${S.vehicles.map(vrow).join('')||'<p class="muted">ยังไม่มีข้อมูลรถ</p>'}<button class="btn p" onclick="editPerson('v')">＋ เพิ่มรถ</button></div>
  <div class="card"><h3>🧑‍✈️ คนขับ</h3>${S.drivers.map(drow).join('')||'<p class="muted">ยังไม่มีข้อมูลคนขับ</p>'}<button class="btn p" onclick="editPerson('d')">＋ เพิ่มคนขับ</button></div>
  <p class="muted">รถ/คนขับที่เลือกจะถูกบันทึกไว้กับทุกทริป และความเร็วจำกัดของรถจะใช้เป็นค่าเริ่มต้นในการเตือน</p>`;
  updVehPill();
}
function updVehPill(){ const v=activeVehicle(), d=activeDriver(); $('#vehTxt').textContent=v?((v.plate||v.brand||'รถ')+(d&&d.name?' · '+d.name.split(' ')[0]:'')):(d&&d.name?d.name:'ยังไม่ระบุรถ'); $('#limit').textContent=activeLimit(); }
function useVeh(id){ S.activeVehicle=id; save(); renderVeh(); }
function useDrv(id){ S.activeDriver=id; save(); renderVeh(); }
function editPerson(kind,id){
  const arr=kind==='v'?S.vehicles:S.drivers, F=kind==='v'?VFIELDS:DFIELDS, o=id?arr.find(x=>x.id===id):{};
  modal(`<h3>${kind==='v'?'🚗 ข้อมูลรถ':'🧑‍✈️ ข้อมูลคนขับ'}</h3>${F.map(([k,l,ph])=>`<label class="f">${l}</label><input class="in" data-k="${k}" ${ph==='date'?'type="date"':k==='limit'?'type="number" inputmode="numeric"':k.toLowerCase().includes('phone')?'type="tel"':''} placeholder="${ph==='date'?'':esc(ph)}" value="${esc(o[k]||'')}">`).join('')}
  <div class="btns" style="margin-top:12px"><button class="btn g" id="pSave">บันทึก</button><button class="btn" onclick="closeModal()">ยกเลิก</button>${id?'<button class="btn r" id="pDel" style="margin-left:auto">ลบ</button>':''}</div>`);
  $('#pSave').onclick=()=>{ const n=id?o:{id:uid()}; document.querySelectorAll('#mbox [data-k]').forEach(i=>n[i.dataset.k]=i.value.trim()); n.updatedAt=now();
    if(!id){ arr.push(n); if(kind==='v'&&!S.activeVehicle) S.activeVehicle=n.id; if(kind==='d'&&!S.activeDriver) S.activeDriver=n.id; }
    save(); closeModal(); renderVeh(); };
  if(id) $('#pDel').onclick=()=>{ const i=arr.indexOf(o); arr.splice(i,1); if(S.activeVehicle===id) S.activeVehicle=null; if(S.activeDriver===id) S.activeDriver=null; save(); closeModal(); renderVeh(); };
}

/* ---------- บันทึกการเดินทาง ---------- */
function renderLog(){
  const cur=trip?S.trips.find(t=>t.id===trip.id):null;
  const kpi=t=>`<div class="kpi"><div><b>${((t.dist||0)/1000).toFixed(1)}</b><span>กม.</span></div><div><b>${t.maxSpd||0}</b><span>สูงสุด กม./ชม.</span></div><div><b>${t.avg||0}</b><span>เฉลี่ย กม./ชม.</span></div><div><b>${t.alerts||0}</b><span>ครั้งที่เตือน</span></div><div><b style="color:${t.overs?'var(--bad)':'inherit'}">${t.overs||0}</b><span>เร็วเกิน</span></div><div><b>${dur(t)}</b><span>เวลา</span></div></div>`;
  $('#logBody').innerHTML=`${cur?`<div class="card"><h3>🟢 ทริปปัจจุบัน ${cur.sim?'(จำลอง)':''}</h3>${kpi(cur)}<p class="muted">บันทึกอัตโนมัติทุก 15 วินาที · ล่าสุด ${cur.lastSave?fmtClock(cur.lastSave):'-'}</p></div>`:''}
  <div class="card"><h3>ทริปที่ผ่านมา</h3>${S.trips.filter(t=>!cur||t.id!==cur.id).map(t=>`<div class="camrow" style="display:block"><b>${fmtTime(t.start)}</b> ${t.sim?'<span class="chip">จำลอง</span>':''}
   <div class="muted">${esc(t.vehicle?((t.vehicle.plate||'')+' '+(t.vehicle.brand||'')):'ไม่ระบุรถ')} · ${esc(t.driver?t.driver.name:'ไม่ระบุคนขับ')}</div>${kpi(t)}
   <div class="btns" style="margin-top:8px"><button class="btn s" onclick="showTrip('${t.id}')">ดูเหตุการณ์</button><button class="btn s" onclick="exportTrip('${t.id}','csv')">CSV</button><button class="btn s" onclick="exportTrip('${t.id}','gpx')">GPX</button><button class="btn s r" onclick="delTrip('${t.id}')">ลบ</button></div></div>`).join('')||'<p class="muted">ยังไม่มีทริป</p>'}</div>`;
}
function dur(t){ const s=((t.end||now())-t.start)/1000; const h=Math.floor(s/3600), m=Math.floor(s%3600/60); return h?`${h}:${String(m).padStart(2,'0')}`:`${m} น.`; }
function tripData(id){ try{ return JSON.parse(localStorage.getItem(TRIP_PREFIX+id))||{pts:[],events:[]}; }catch(e){ return {pts:[],events:[]}; } }
function showTrip(id){
  const t=S.trips.find(x=>x.id===id), d=tripData(id);
  const camName=cid=>{ const c=S.cameras.find(x=>x.id===cid); return c?(TYPES[c.type]||TYPES.other).icon+' '+c.title:''; };
  modal(`<h3>เหตุการณ์ – ${fmtTime(t.start)}</h3><table class="t"><tr><th>เวลา</th><th>เหตุการณ์</th><th>กม.</th><th>ความเร็ว</th></tr>
  ${d.events.map(e=>`<tr><td>${fmtClock(e.t)}</td><td>${e.type==='alert'?'เตือน อีก '+distTxt(e.d)+' '+esc(camName(e.cam)):e.type==='overspeed'?'<span style="color:var(--bad)">เร็วเกิน (จำกัด '+e.limit+')</span>':e.type==='calib'?'บันทึกหลัก กม.':e.type==='pin'?'ยืนยันพิกัดกล้อง':e.type}</td><td>${e.km??''}</td><td>${e.spd??''}</td></tr>`).join('')||'<tr><td colspan=4 class="muted">ไม่มีเหตุการณ์</td></tr>'}</table>
  <p class="muted">จุดพิกัดที่บันทึก ${d.pts.length} จุด</p><button class="btn" onclick="closeModal()">ปิด</button>`);
}
function delTrip(id){ S.trips=S.trips.filter(t=>t.id!==id); try{ localStorage.removeItem(TRIP_PREFIX+id); }catch(e){} save(); renderLog(); }
function download(name,text,type){
  try{ const b=new Blob([text],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000); toast('ดาวน์โหลด '+name); }
  catch(e){ copyText(text); }
}
async function copyText(t){ try{ await navigator.clipboard.writeText(t); toast('คัดลอกแล้ว'); }catch(e){ modal(`<h3>คัดลอกข้อมูล</h3><textarea class="in" style="height:50vh">${esc(t)}</textarea><button class="btn" onclick="closeModal()">ปิด</button>`); } }
function exportTrip(id,fmt){
  const t=S.trips.find(x=>x.id===id), d=tripData(id), base='trip-'+new Date(t.start).toISOString().slice(0,16).replace(/[:T]/g,'-');
  if(fmt==='csv'){ download(base+'.csv','﻿เวลา,lat,lon,ความเร็ว(กม./ชม.),กม.\n'+d.pts.map(p=>[new Date(t.start+p[0]*1000).toLocaleString('th-TH'),p[1],p[2],p[3],p[4]].join(',')).join('\n'),'text/csv'); }
  else { download(base+'.gpx',`<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="H1 Camera Alert - ${CREDIT}" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${base}</name><trkseg>\n`+d.pts.map(p=>`<trkpt lat="${p[1]}" lon="${p[2]}"><time>${new Date(t.start+p[0]*1000).toISOString()}</time></trkpt>`).join('\n')+'\n</trkseg></trk></gpx>','application/gpx+xml'); }
}

/* ---------- ตั้งค่า ---------- */
function renderSet(){
  const s=S.settings, chk=(k,l,sub)=>`<div class="sw"><span>${l}${sub?`<br><span class="muted">${sub}</span>`:''}</span><input type="checkbox" data-s="${k}" ${s[k]?'checked':''}></div>`;
  const perm=('Notification' in window)?Notification.permission:'unsupported';
  $('#setBody').innerHTML=`
  <div class="card"><h3>🔔 ระยะเตือนก่อนถึงจุด (เมตร)</h3>
   <div class="grid3"><div><label class="f">ครั้งที่ 1</label><input class="in" type="number" inputmode="numeric" data-st="0" value="${s.stages[0]??''}"></div><div><label class="f">ครั้งที่ 2</label><input class="in" type="number" inputmode="numeric" data-st="1" value="${s.stages[1]??''}"></div><div><label class="f">ครั้งสุดท้าย</label><input class="in" type="number" inputmode="numeric" data-st="2" value="${s.stages[2]??''}"></div></div>
   <p class="muted">ใส่ 0 หรือเว้นว่าง = ไม่เตือนครั้งนั้น · ตั้งระยะเฉพาะจุดได้ในหน้าแก้ไขจุด (“เตือนแรก”) · ก่อนยืนยันพิกัด แนะนำครั้งแรก ≥ 2000 ม.</p>
   <div class="grid2"><div><label class="f">ความเร็วจำกัดเริ่มต้น</label><input class="in" type="number" data-n="defaultLimit" value="${s.defaultLimit}"></div><div><label class="f">เผื่อก่อนเตือนเร็วเกิน (+กม./ชม.)</label><input class="in" type="number" data-n="tol" value="${s.tol}"></div></div>
   <label class="f">ทิศทางการเดินทาง</label><select class="in" data-sel="dirMode"><option value="down" ${s.dirMode==='down'?'selected':''}>ขาล่อง ลำปาง → กทม.</option><option value="up" ${s.dirMode==='up'?'selected':''}>ขาขึ้น กทม. → ลำปาง</option><option value="auto" ${s.dirMode==='auto'?'selected':''}>อัตโนมัติ (จากการเคลื่อนที่)</option></select>
   <div class="btns" style="margin-top:10px"><button class="btn p" id="testAlert">🔊 ทดสอบเสียงเตือน</button></div></div>
  <div class="card"><h3>📣 รูปแบบการแจ้งเตือน</h3>
   ${chk('tts','พูดเตือนภาษาไทย')}${chk('beep','เสียงบี๊บ')}${chk('vibrate','สั่น (Android)')}${chk('notify','แจ้งเตือนบนมือถือ (Notification)','สถานะสิทธิ์: '+({granted:'อนุญาตแล้ว ✓',denied:'ถูกปฏิเสธ – เปิดในตั้งค่าเบราว์เซอร์',default:'ยังไม่ได้ขอ',unsupported:'เบราว์เซอร์นี้ไม่รองรับ (iPhone: ต้อง “เพิ่มไปยังหน้าจอโฮม” ก่อน)'}[perm]))}
   ${perm==='default'?'<button class="btn s p" id="askNotif">ขอสิทธิ์แจ้งเตือน</button>':''}
   ${chk('generalOverspeed','เตือนเมื่อขับเร็วเกิน แม้ไม่ใกล้กล้อง')}${chk('wake','เปิดหน้าจอค้างขณะเดินทาง')}</div>
  <div class="card"><h3>🗺️ แผนที่ & Google Maps</h3>
   <label class="f">Google Maps API key (ไม่บังคับ – สำหรับชั้นจราจรสดและแผนที่ Google ในแอป)</label><input class="in" data-txt="gkey" value="${esc(s.gkey)}" placeholder="AIza…">
   ${chk('useGoogleBase','ใช้แผนที่ Google เมื่อมี API key','แผนที่/ดาวเทียม/ผสม/จราจร จาก Google')}${chk('showRoute','แสดงเส้นทาง ทล.1 และเลข กม.')}
   <div class="sw"><span>✋ ลากหมุดย้ายตำแหน่งได้</span><input type="checkbox" id="dragTgl" ${editDrag?'checked':''}></div>
   <p class="muted">ไม่มี key ก็ใช้ได้: แผนที่ OpenStreetMap + ภาพดาวเทียม Esri และปุ่ม 🚦 เปิด Google Maps ชั้นจราจร</p></div>
  <div class="card"><h3>📐 หลักกิโลเมตรอ้างอิง (${ROUTE.length} จุด)</h3>
   <p class="muted">เส้นทาง ทล.1 สร้างจากหลัก กม. เหล่านี้ (เขียว = บันทึกจาก GPS จริง) กด 📍กม. บนแผนที่ขณะผ่านหลัก กม. เพื่อเพิ่ม</p>
   <table class="t">${ROUTE.slice().reverse().map(a=>`<tr><td><b>${a.km}</b></td><td>${a.src==='gps'?'<span class="chip ok">GPS</span>':'<span class="chip est">ประมาณ</span>'} ${esc(a.label||'')}</td><td>${a.src==='gps'?`<button class="btn s r" onclick="delAnchor('${a.id}')">ลบ</button>`:''}</td></tr>`).join('')}</table></div>
  <div class="card"><h3>🧪 โหมดจำลองการขับ (ทดสอบระบบโดยไม่ต้องขับจริง)</h3>
   <div class="grid3"><div><label class="f">เริ่มที่ กม.</label><input class="in" type="number" data-n="simStart" value="${s.simStart}"></div><div><label class="f">ความเร็ว</label><input class="in" type="number" data-n="simSpeed" value="${s.simSpeed}"></div><div><label class="f">เร่งเวลา ×</label><input class="in" type="number" data-n="simMult" value="${s.simMult}"></div></div>
   <div class="btns" style="margin-top:8px"><button class="btn p" id="simGo">▶ เริ่มจำลอง</button></div></div>
  <div class="card"><h3>💾 สำรอง / กู้คืนข้อมูล</h3>
   <p class="muted">ทุกอย่างบันทึกในเครื่องนี้อัตโนมัติ · สำรองไว้เพื่อย้ายเครื่องหรือแชร์จุดกล้องให้เพื่อน</p>
   <div class="btns"><button class="btn" id="bkDl">⬇️ ดาวน์โหลดไฟล์สำรอง</button><button class="btn" id="bkCp">📋 คัดลอก</button><label class="btn">⬆️ นำเข้าไฟล์<input type="file" accept=".json,application/json" id="bkIn" hidden></label></div>
   <div class="btns" style="margin-top:8px"><button class="btn r" id="rst">รีเซ็ตจุดกล้องเป็นค่าเริ่มต้น</button></div></div>
  <div class="card" style="text-align:center"><b>เตือนกล้องความเร็ว ทล.1 ลำปาง–กทม.</b><div class="muted" style="margin-top:4px">${CREDIT}</div>
   <div class="muted" style="margin-top:6px;font-size:12px">ใช้เพื่อช่วยขับขี่ปลอดภัยและเคารพกฎจราจร · ตำแหน่งจุดเป็นข้อมูลจากผู้ใช้ อาจเปลี่ยนแปลงได้</div></div>`;
  document.querySelectorAll('[data-s]').forEach(i=>i.onchange=()=>{ s[i.dataset.s]=i.checked; save(); if(i.dataset.s==='useGoogleBase') setMapMode(s.mapMode); if(i.dataset.s==='showRoute') drawRoute(); });
  document.querySelectorAll('[data-n]').forEach(i=>i.onchange=()=>{ s[i.dataset.n]=parseFloat(i.value)||0; save(); updVehPill(); });
  document.querySelectorAll('[data-st]').forEach(i=>i.onchange=()=>{ const v=[...document.querySelectorAll('[data-st]')].map(x=>parseInt(x.value)||0).filter(x=>x>0).sort((a,b)=>b-a); s.stages=v; save(); fired={}; toast('ระยะเตือน: '+(v.join(', ')||'ปิด')+' ม.'); });
  document.querySelectorAll('[data-sel]').forEach(i=>i.onchange=()=>{ s[i.dataset.sel]=i.value; save(); if(i.dataset.sel==='dirMode'){ fired={}; dirNow=i.value==='auto'?dirNow:i.value; } });
  document.querySelectorAll('[data-txt]').forEach(i=>i.onchange=()=>{ s[i.dataset.txt]=i.value.trim(); save(); gmState='none'; if(s.gkey) setMapMode(s.mapMode); });
  $('#dragTgl').onchange=e=>{ editDrag=e.target.checked; drawCams(); toast(editDrag?'ลากหมุดบนแผนที่เพื่อย้ายได้แล้ว':'ปิดการลากหมุด'); };
  $('#testAlert').onclick=()=>{ unlockAudio(); const c=S.cameras.find(x=>x.enabled)||S.cameras[0]; fireAlert(c,500,1,3,lastFix?lastFix.spd:95); };
  const an=$('#askNotif'); if(an) an.onclick=async()=>{ await Notification.requestPermission(); renderSet(); };
  $('#simGo').onclick=startSim;
  $('#bkDl').onclick=()=>download('h1-camera-backup-'+new Date().toISOString().slice(0,10)+'.json',backupJson(),'application/json');
  $('#bkCp').onclick=()=>copyText(backupJson());
  $('#bkIn').onchange=e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>importJson(r.result); r.readAsText(f); };
  $('#rst').onclick=()=>modal(`<h3>รีเซ็ตจุดกล้อง?</h3><p>จุดกล้องและหลัก กม. จะกลับเป็นค่าเริ่มต้น (รถ/คนขับ/ทริปยังอยู่)</p><div class="btns"><button class="btn r" id="rY">รีเซ็ต</button><button class="btn" onclick="closeModal()">ยกเลิก</button></div>`)||($('#rY').onclick=()=>{ const f=freshState(); S.cameras=f.cameras; S.anchors=f.anchors; buildRoute(); drawRoute(); drawCams(); save(); closeModal(); renderSet(); toast('รีเซ็ตแล้ว'); });
  updSaved();
}
function delAnchor(id){ S.anchors=S.anchors.filter(a=>a.id!==id); buildRoute(); drawRoute(); drawCams(); save(); renderSet(); }
function backupJson(){ return JSON.stringify({app:'h1cam', credit:CREDIT, exportedAt:new Date().toISOString(), data:{...S, trips:S.trips}},null,1); }
function importJson(txt){
  try{ const o=JSON.parse(txt); const d=o.data||o; if(!Array.isArray(d.cameras)) throw 0;
    modal(`<h3>นำเข้าข้อมูล</h3><p>พบจุดกล้อง ${d.cameras.length} จุด, รถ ${(d.vehicles||[]).length}, คนขับ ${(d.drivers||[]).length}</p>
    <div class="btns"><button class="btn p" id="iRep">แทนที่ทั้งหมด</button><button class="btn" id="iMer">รวมเฉพาะจุดกล้องใหม่</button><button class="btn" onclick="closeModal()">ยกเลิก</button></div>`);
    $('#iRep').onclick=()=>{ S={...freshState(),...d, settings:{...DEFAULT_SETTINGS,...(d.settings||{})}}; finishImport(); };
    $('#iMer').onclick=()=>{ const ids=new Set(S.cameras.map(c=>c.id)); d.cameras.forEach(c=>{ if(!ids.has(c.id)&&!S.cameras.some(x=>Math.abs(x.km-c.km)<0.05&&x.type===c.type)) S.cameras.push(c); });
      (d.anchors||[]).filter(a=>a.src==='gps').forEach(a=>{ if(!S.anchors.some(x=>x.id===a.id)) S.anchors.push(a); }); finishImport(); };
  }catch(e){ toast('ไฟล์ไม่ถูกต้อง'); }
}
function finishImport(){ S.cameras.sort((a,b)=>b.km-a.km); buildRoute(); drawRoute(); drawCams(); save(true); closeModal(); renderAll(); toast('✓ นำเข้าแล้ว'); }

/* ---------- UI ทั่วไป ---------- */
function modal(html){ $('#mbox').innerHTML=html; $('#modal').classList.add('show'); }
function closeModal(){ $('#modal').classList.remove('show'); }
$('#modal').addEventListener('click',e=>{ if(e.target.id==='modal') closeModal(); });
let toastT; function toast(t){ const el=$('#toast'); el.textContent=t; el.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'),2600); }
function setTab(tab){
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('show'));
  if(tab!=='map'){ $('#sh-'+tab).classList.add('show'); ({cams:renderCamList,veh:renderVeh,log:renderLog,set:renderSet})[tab](); }
  else setTimeout(()=>map.invalidateSize(),50);
}
function renderAll(){ renderCamList(); renderVeh(); renderLog(); updVehPill(); }
function layerMenu(){
  const m=S.settings.mapMode, b=(k,l)=>`<button class="btn ${m===k?'p':''}" style="flex:1" onclick="setMapMode('${k}');closeModal()">${l}</button>`;
  modal(`<h3>ชั้นแผนที่</h3><div class="btns">${b('map','🗺️ แผนที่')}${b('sat','🛰️ ดาวเทียม')}${b('hyb','🛰️+ถนน ผสม')}${b('traffic','🚦 จราจร')}</div>
  <p class="muted" style="margin-top:10px">${S.settings.gkey?'ใช้ Google Maps (มี API key)':'ยังไม่มี Google API key: แผนที่ = OpenStreetMap, ดาวเทียม = Esri, จราจร = เปิดใน Google Maps'}</p>`);
}

/* ---------- เริ่มต้น ---------- */
load(); buildRoute(); initMap(); renderAll();
const b=L.latLngBounds(ROUTE.map(a=>[a.lat,a.lon])); map.fitBounds(b,{padding:[20,20]});
$('#startBtn').onclick=()=>running?stop():start();
$('#aClose').onclick=()=>$('#alert').className='';
$('#aPin').onclick=()=>{ if(alertCam) pinHere(alertCam.id); $('#alert').className=''; };
$('#fFollow').onclick=()=>setFollow(!follow);
$('#fLayer').onclick=layerMenu;
$('#fKm').onclick=kmHere;
$('#fAdd').onclick=()=>openCamForm(null,lastFix?{lat:lastFix.lat,lon:lastFix.lon}:null);
$('#fGmap').onclick=openTrafficInfo;
$('#camAdd').onclick=()=>openCamForm(null,lastFix?{lat:lastFix.lat,lon:lastFix.lon}:null);
$('#camSearch').oninput=renderCamList;
$('#vehPill').onclick=()=>setTab('veh');
document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
$('#limit').textContent=activeLimit();
window.addEventListener('pagehide',()=>{ if(trip) flushTrip(true); else save(true); });
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
if(location.protocol!=='https:' && !/^(localhost|127\.)/.test(location.hostname)) setTimeout(()=>toast('⚠️ เปิดผ่าน https:// เพื่อให้ GPS และการแจ้งเตือนทำงาน'),1200);
// expose for inline handlers
Object.assign(window,{openCamForm,pinHere,flyCam,useVeh,useDrv,editPerson,showTrip,exportTrip,delTrip,delAnchor,setMapMode,closeModal,__S:()=>S,__feed:feed});
