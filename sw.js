// JLPT N1 Reviewer service worker: app shell cached; audio cached on demand (Range-aware)
const V='n1-shell-v87',AUD='n1-audio-v82';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>c.addAll(['./','index.html','style.css','app.js','data.js','tips.js']).catch(()=>{})))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('n1-shell-')&&k!==V)||(k.startsWith('n1-audio')&&k!==AUD)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const strip=u=>{const x=new URL(u);x.search='';return x.href};
async function audio(req){const c=await caches.open(AUD),key=strip(req.url);let r=await c.match(key);
  if(!r){const net=fetch(key).then(async res=>{if(res.ok&&res.status===200)await c.put(key,res.clone());return res});
    const range=req.headers.get('range');if(!range)return net;
    // ranged request on a miss: stream the network's ranged reply now, cache the full file in the background
    net.catch(()=>{});return fetch(req)}
  const range=req.headers.get('range');if(!range)return r;
  const buf=await r.arrayBuffer(),m=/bytes=(\d*)-(\d*)/.exec(range)||[],n=buf.byteLength;let s=m[1]?+m[1]:0,e=m[2]?+m[2]:n-1;if(!m[1]&&m[2]){s=n-+m[2];e=n-1}
  e=Math.min(e,n-1);return new Response(buf.slice(s,e+1),{status:206,headers:{'Content-Type':'audio/mpeg','Content-Range':`bytes ${s}-${e}/${n}`,'Content-Length':String(e-s+1),'Accept-Ranges':'bytes'}})}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
  if(/\.mp3$/.test(u.pathname)){e.respondWith(audio(r));return}
  if(/manifest\.json$/.test(u.pathname))return;
  if(r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html')){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put('index.html',cp));return res}).catch(()=>caches.match('index.html',{ignoreSearch:true})));return}
  e.respondWith(caches.open(V).then(c=>c.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}))))});
