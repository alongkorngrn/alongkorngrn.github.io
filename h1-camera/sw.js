// Service worker: ใช้งานออฟไลน์ + แจ้งเตือน (สร้างและแก้ไขโดย Alongkorn Inta)
const V='h1cam-v1';
const SHELL=['./','index.html','app.js','manifest.webmanifest','vendor/leaflet.js','vendor/leaflet.css','vendor/Leaflet.GoogleMutant.js','icon-192.png','icon-512.png',
 'img/p676.jpg','img/p623.jpg','img/p568.jpg','img/p550.jpg','img/p487.jpg','img/p486.jpg','img/p483.jpg','img/p385.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='tiles').map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
async function trim(){const c=await caches.open('tiles');const k=await c.keys();if(k.length>1500)for(const r of k.slice(0,k.length-1500))await c.delete(r);}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET') return;
  if(/tile\.openstreetmap\.org|arcgisonline\.com/.test(u.host)){
    e.respondWith(caches.open('tiles').then(async c=>{const hit=await c.match(e.request);
      const net=fetch(e.request).then(r=>{if(r.ok||r.type==='opaque'){c.put(e.request,r.clone());trim();}return r;}).catch(()=>hit);
      return hit||net;}));
    return;
  }
  if(u.origin!==location.origin) return;
  const isCode=/\/(index\.html|app\.js)?$/.test(u.pathname)||u.pathname.endsWith('app.js');
  if(isCode){ e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true}))); return; }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(h=>h||fetch(e.request)));
});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window'}).then(cs=>{for(const c of cs){if('focus' in c)return c.focus();}return self.clients.openWindow('./');}));});
