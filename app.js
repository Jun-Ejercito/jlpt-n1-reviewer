(function(){
'use strict';
const APP_VERSION='v106';
const SECTIONS=['文字・語彙','文法','読解'];
const SEC_INFO={'文字・語彙':{en:'Kanji & Vocabulary',glyph:'字'},'文法':{en:'Grammar',glyph:'文'},'読解':{en:'Reading',glyph:'読'}};
const IC=(d,extra='')=>`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${extra}>${d}</svg>`;
const ICONS={
 home:IC('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>'),
 quiz:IC('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
 vocab:IC('<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/>'),
 kanji:IC('<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M12 3.5v17M3.5 12h17"/>'),
 progress:IC('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
 back:IC('<path d="M15 18 9 12l6-6"/>'),
 moon:IC('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
 sun:IC('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
 bolt:IC('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
 redo:IC('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/>'),
 bulb:IC('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'),
 flame:IC('<path d="M12 22c4 0 7-2.7 7-6.5 0-3.5-2.5-5.5-3.5-8.5-1 2-2 3-3.5 3.5C12 7 11 4.5 8.5 2 8.5 6 5 8.5 5 13.5 5 18.8 8 22 12 22z"/>'),
 chev:IC('<path d="m9 6 6 6-6 6"/>'),
 play:IC('<path d="M7 4.5v15l12-7.5z"/>')};

const secOf=q=>q.section||(/内容理解|統合理解|情報検索/.test(q.category)?'読解':/文法|並べ替え/.test(q.category)?'文法':'文字・語彙');
const SIM=(window.SIMILAR||[]).slice().sort((a,b)=>(a.shared_strokes||99)-(b.shared_strokes||99)||String(a.shared_reading||'').localeCompare(b.shared_reading||'','ja')||a.id-b.id);
const Q=window.QUESTIONS||[],V=window.VOCAB||[],K=window.KANJI||[];
const $=s=>document.querySelector(s),app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=JSON.parse(localStorage.getItem('n1_'+k));return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem('n1_'+k,JSON.stringify(v))}catch(e){}}};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const reduced=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const pct=(c,a)=>a?Math.round(c*100/a):0;
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/* ---- storage migration (v1 keys kept: missed, stats, vocabStatus, quizOpts, furigana, kanjiMode) ---- */
(function migrate(){
  if(store.get('schema',1)>=2)return;
  if(!store.get('catStats',null))store.set('catStats',{});      // per-category stats start fresh; totals kept in 'stats'
  if(!store.get('daily',null)){const st=store.get('stats',{answered:0});const d={};if(st.answered)d[dayKey()]=0;store.set('daily',d)}
  store.set('schema',2);
})();

let furiOn=store.get('furigana',true);const furi=true;// ruby always rendered; visibility toggled by html.nofuri (v39)
const applyFuri=()=>document.documentElement.classList.toggle('nofuri',!furiOn);applyFuri();
const F=(o,f)=>furi&&o[f+'_ruby']?o[f+'_ruby']:esc(o[f]);
// reading shown beside a word only when furigana is off (ruby already carries it) and it adds info
const RD=(o,cls='mut')=>o.reading===o.word?'':(o.word_ruby&&/<ruby>/.test(o.word_ruby))?`<span class="${cls} offuri">${esc(o.reading)}</span>`:`<span class="${cls}">${esc(o.reading)}</span>`;
let audio=null;function play(src){if(!src)return;if(audio)audio.pause();audio=new Audio(src);audio.play().catch(()=>{})}

/* ---- theme ---- */
function applyTheme(){const t=store.get('theme','auto');const dark=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light'}
applyTheme();matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',applyTheme);

/* ---- activity tracking ---- */
function logActivity(n=1){const d=store.get('daily',{});d[dayKey()]=(d[dayKey()]||0)+n;store.set('daily',d)}
function streak(){const d=store.get('daily',{});let s=0;const t=new Date();
  if(!(d[dayKey(t)]>0))t.setDate(t.getDate()-1);
  while(d[dayKey(t)]>0){s++;t.setDate(t.getDate()-1)}return s}
function ring(p,label,sub,size=96,color='var(--accent)'){const r=40,C=2*Math.PI*r,v=Math.max(0,Math.min(100,p));
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="${r}" class="ring-bg"/><circle cx="50" cy="50" r="${r}" class="ring-fg" style="stroke:${color};stroke-dasharray:${C};stroke-dashoffset:${C*(1-v/100)}"/></svg><div class="ring-t"><b>${label}</b>${sub?`<small>${sub}</small>`:''}</div></div>`}

/* ---------- Home dashboard ---------- */
function secStats(sec){const cs=store.get('catStats',{});let a=0,k=0;for(const cat of new Set(Q.filter(q=>secOf(q)===sec).map(q=>q.category))){a+=(cs[cat]||{}).a||0;k+=(cs[cat]||{}).c||0}return{a,k}}
function home(){
  const missed=store.get('missed',[]),st=store.get('stats',{answered:0,correct:0}),vs=store.get('vocabStatus',{});
  const unknown=V.filter(v=>vs[v.id]!=='know').length,goal=store.get('goal',20),today=store.get('daily',{})[dayKey()]||0,last=store.get('last','');
  const h=new Date().getHours(),greet=h<5?'こんばんは':h<11?'おはようございます':h<18?'こんにちは':'こんばんは';
  const d=new Date(),dateJa=`${d.getMonth()+1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`;
  const lastName={quiz:'Quiz',vocab:'Words',kanji:'Kanji',kanjicards:'Kanji cards',similar:'Look-alike kanji',tips:'読解 Tips',progress:'Progress'}[(last||'').split('/')[0]];
  const sk=streak(),acc=pct(st.correct,st.answered);
  app.innerHTML=`<p class="hgreet mut">${dateJa} · ${greet}</p>
  ${todayBtn()}
  <nav class="hsc">${[['#mistakes','✕','Mistakes',Object.keys(mistDB()).filter(id=>QBY[id]).length||''],['#gpairs','文','Grammar pairs',''],['#mock','模','Mock exam',''],['#search','<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>','Search','']].map(([h,i,l,n])=>`<a href="${h}" class="hsl"><span class="hsi ja">${i}</span><span>${l}</span>${n?`<small class="mut">${n}</small>`:''}</a>`).join('')}</nav>
  <details class="hsec"><summary>Study details 学習</summary>${todayCard(buildQueue('mixed'))}</details>
  <div class="hq"><button class="btn ghost" id="qqs">${ICONS.bolt} Quick quiz <small class="mut">10 questions</small></button>${missed.length?`<button class="btn ghost" id="qms">${ICONS.redo} Review missed <small class="mut">${missed.length}</small></button>`:''}</div>
  <details class="hsec"><summary>Today's goal & stats</summary><section class="hero2">
   <div class="hero-txt"><h1 class="htitle">今日も一歩ずつ。</h1><p class="mut sm">One step at a time toward N1 · ${Q.length} questions · ${V.length} words · ${K.length} kanji</p>
    ${last&&lastName?`<a class="btn ghost pill-btn" href="#${esc(last)}">${ICONS.play} Continue · ${lastName}</a>`:`<a class="btn ghost pill-btn" href="#quiz">${ICONS.play} Start studying</a>`}</div>
   <div class="hero-ring">${ring(pct(today,goal),`${today}<span>/${goal}</span>`,'today',112)}
    <div class="goalctl"><button class="btn sm ghost" id="gm" aria-label="Lower daily goal">−</button><span class="mut sm">goal</span><button class="btn sm ghost" id="gp" aria-label="Raise daily goal">＋</button></div></div>
  </section>
  <div class="statrow">
   <div class="mini"><span class="mi">${ICONS.flame}</span><div><b>${sk}</b><small>day${sk===1?'':'s'} streak</small></div></div>
   <div class="mini"><span class="mi ind">${ICONS.progress}</span><div><b>${acc}%</b><small>accuracy · ${st.correct}/${st.answered}</small></div></div>
  </div></details>
  <details class="hsec"><summary>Sections 分野</summary>
  <div class="secgrid">${SECTIONS.map((sec,i)=>{const n=Q.filter(q=>secOf(q)===sec).length,x=secStats(sec),p=x.a?pct(x.k,x.a):null;
    return `<button class="seccard s${i}" data-sec="${esc(sec)}"><span class="sg">${SEC_INFO[sec].glyph}</span><span class="stx"><b>${sec}</b><small>${SEC_INFO[sec].en}</small></span>
     <span class="smeta"><span>${n} questions</span><span>${p===null?'not tried':p+'% · '+x.k+'/'+x.a}</span></span><span class="sbar"><i style="width:${p||0}%"></i></span></button>`}).join('')}</div></details>
  <details class="hsec"><summary>Shortcuts</summary>
  <div class="quick">
   <button class="qcard" id="qq"><span class="qi">${ICONS.bolt}</span><b>Quick quiz</b><small>10 random questions</small></button>
   <button class="qcard" id="qm" ${missed.length?'':'disabled'}><span class="qi">${ICONS.redo}</span><b>Review missed</b><small>${missed.length} question${missed.length===1?'':'s'}</small></button>
   <a class="qcard" href="#vocab"><span class="qi">語</span><b>Words</b><small>${unknown} to learn</small></a>
   <a class="qcard" href="#kanji"><span class="qi">漢</span><b>Kanji</b><small>${K.length} kanji · look-alikes</small></a>
   <a class="qcard" href="#similar"><span class="qi">似</span><b>Look-alikes</b><small>${SIM.length} groups</small></a>
  </div></details>
  <a class="hrow" href="#tips"><span>${ICONS.bulb}</span><b>読解 Tips</b><small class="mut">Workflow, question types, signal words, traps</small><span class="chev">${ICONS.chev}</span></a>
  <p class="ver">JLPT N1 Reviewer · ${APP_VERSION}</p>`;
  $('#gm').onclick=()=>{store.set('goal',Math.max(5,goal-5));home()};$('#gp').onclick=()=>{store.set('goal',Math.min(200,goal+5));home()};
  const o=store.get('quizOpts',{cat:'',shuffle:true,n:10,autoplay:false});
  $('#qq').onclick=()=>{nav('quiz/play',()=>{start(smartPick(Q,10,'all'),{...o,shuffle:true},false,10);S.rkey='all'})};
  $('#qm').onclick=()=>{nav('quiz/play',()=>start(shuffle(Q.filter(q=>missed.includes(q.id))),o,true))};$('#qqs').onclick=()=>$('#qq').click();if($('#qms'))$('#qms').onclick=()=>$('#qm').click();
  app.querySelectorAll('.seccard').forEach(b=>b.onclick=()=>{const sec=b.dataset.sec;store.set('quizOpts',{...o,cat:sec});nav('quiz/play',()=>{start(smartPick(Q.filter(q=>secOf(q)===sec),o.n||10,sec),{...o,cat:sec,shuffle:true},false,o.n||10);S.rkey=sec})});
  if(store.get('wordsFilter',null)===null)store.set('wordsFilter',false);
}
let pending=null;function nav(h,fn){pending=fn;if(location.hash==='#'+h)route();else location.hash=h}

/* ---------- Progress ---------- */
function progress(){
  const st=store.get('stats',{answered:0,correct:0}),cs=store.get('catStats',{}),vs=store.get('vocabStatus',{}),kv=store.get('kanjiViewed',[]),d=store.get('daily',{});
  const known=V.filter(v=>vs[v.id]==='know').length,cats=SECTIONS.filter(x=>Q.some(q=>secOf(q)===x));
  const agg=c=>{let a=0,k=0;for(const cat of new Set(Q.filter(q=>secOf(q)===c).map(q=>q.category))){a+=(cs[cat]||{}).a||0;k+=(cs[cat]||{}).c||0}return{a,k}};
  const rows=cats.map(c=>({c,...agg(c)})),tried=rows.filter(r=>r.a>0);
  const weak=tried.length?tried.reduce((m,r)=>r.k/r.a<m.k/m.a?r:m):null;
  const days=[...Array(7)].map((_,i)=>{const t=new Date();t.setDate(t.getDate()-6+i);return{k:dayKey(t),l:'日月火水木金土'[t.getDay()],n:d[dayKey(t)]||0}});
  const mx=Math.max(5,...days.map(x=>x.n));
  app.innerHTML=`<h1 class="pt">Progress 進捗</h1>
  <div class="totals">${[['Answered',st.answered],['Correct',st.correct],['Accuracy',pct(st.correct,st.answered)+'%'],['Words known',`${known}/${V.length}`],['Kanji viewed',`${kv.length}/${K.length}`],['Streak',streak()+'🔥']].map(([l,v])=>`<div class="card tot"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${weak&&weak.k/weak.a<1?`<div class="card callout">🎯 Weakest section: <b>${esc(weak.c)}</b> — ${pct(weak.k,weak.a)}% (${weak.k}/${weak.a}). <button class="btn sm primary" id="pw">Practice it</button></div>`:''}
  <div class="card"><h3>Last 7 days</h3><div class="chart">${days.map(x=>`<div class="bar-c"><span class="bv">${x.n||''}</span><div class="bar" style="height:${x.n?Math.max(6,x.n*100/mx):2}%"></div><span class="bl">${x.l}</span></div>`).join('')}</div></div>
  <details class="card dsc"><summary><h3>Accuracy by section</h3></summary>${rows.map(r=>`<div class="cat"><div class="cat-h"><span>${esc(r.c)}</span><span class="mut">${r.a?`${pct(r.k,r.a)}% · ${r.k}/${r.a}`:'not tried'}</span></div><div class="hbar"><div style="width:${r.a?pct(r.k,r.a):0}%;background:${r.a&&r.k/r.a<.6?'var(--accent)':'var(--indigo)'}"></div></div></div>`).join('')}
   <p class="mut sm">Section stats are counted from this version onward; overall totals include earlier answers.</p></details>
  ${srsStatsHTML()}
  <button class="btn danger" id="reset">Reset all progress</button><p class="ver">App version ${APP_VERSION} · ${Q.length} questions · ${V.length} words · ${K.length} kanji</p>`;
  $('#reset').onclick=()=>{if(confirm('Reset ALL quiz, word, kanji and streak progress? This cannot be undone.')){['missed','stats','qAtt','vocabStatus','catStats','daily','kanjiViewed','last','srs','srsNew','srsLog','srsPri','srsNote','mnemo'].forEach(k=>localStorage.removeItem('n1_'+k));progress()}};
  wireBackup();
  if($('#pw'))$('#pw').onclick=()=>{const o=store.get('quizOpts',{});nav('quiz/play',()=>start(shuffle(Q.filter(q=>secOf(q)===weak.c)),{...o,cat:weak.c},false))};
}

/* ---------- Quiz ---------- */
let S=null;
function quizSetup(){
  const cats=SECTIONS.filter(x=>Q.some(q=>secOf(q)===x)),missed=store.get('missed',[]),o=store.get('quizOpts',{cat:'',shuffle:true,n:10,autoplay:false});if(o.cat&&!SECTIONS.includes(o.cat))o.cat='';
  app.innerHTML=`<h1 class="pt">Quiz 問題</h1>${S&&!S.done?`<a class="card resq" href="#quiz/play">▶ <b>Resume your quiz</b> <span class="mut sm">· question ${S.si+1}/${S.steps.length}</span></a>`:''}<div class="card form">
  <label><span class="lbl">Section</span><select id="cat"><option value="">All (${Q.length})</option>${cats.map(c=>`<option ${c===o.cat?'selected':''} value="${esc(c)}">${esc(c)} (${Q.filter(q=>secOf(q)===c).length})</option>`).join('')}</select></label>
  <label><span class="lbl">Number of questions</span><input id="n" type="number" min="1" max="${Q.length}" value="${o.n}"></label>
  <label class="sw"><input type="checkbox" id="shuf" ${o.shuffle?'checked':''}><span></span> Shuffle questions <small class="mut">· unseen first</small></label>
  <label class="sw"><input type="checkbox" id="auto" ${o.autoplay?'checked':''}><span></span> Autoplay audio after answering</label>
  <label class="sw"><input type="checkbox" id="shc" ${o.sc!==false?'checked':''}><span></span> Shuffle choices</label>
  <p class="rhint mut sm" id="rhint">${roundHint(o.cat||'all')}</p>
  <div class="row"><button class="btn primary big" id="go">Start quiz</button><button class="btn ghost big" id="rm" ${missed.length?'':'disabled'}>↺ Review missed only (${missed.length})</button></div></div>`;
  const opts=()=>{const x={cat:$('#cat').value,shuffle:$('#shuf').checked,n:Math.max(1,+$('#n').value||10),autoplay:$('#auto').checked,sc:$('#shc').checked};store.set('quizOpts',x);return x};
  $('#cat').addEventListener('change',()=>{$('#rhint').textContent=roundHint($('#cat').value||'all')});
  $('#go').onclick=()=>{const x=opts();let p=Q.filter(q=>!x.cat||secOf(q)===x.cat);p=roundPick(p,x.n,x.cat||'all',!x.shuffle);if(!p.length){toast('Everything here is scheduled for review later');return}nav('quiz/play',()=>{start(p,x,false,x.n);S.rkey=x.cat||'all'})};
  $('#rm').onclick=()=>{const x=opts();let p=Q.filter(q=>missed.includes(q.id));if(x.shuffle)p=shuffle(p);nav('quiz/play',()=>start(p,x,true))};
}
// v39: ~60% of a random quiz comes from the least-attempted questions (passage groups = one unit, min member count)
// v81: unseen-first rounds per filter ('all' or a section). A question counts as seen when shown; passages stay whole;
// when a round is exhausted a new one starts (topped up with least-answered). Scheduled mistakes are excluded until due.
const RIV=[1,3,7];
function rounds(){let r=store.get('rounds',null);if(!r){const att=store.get('qAtt',{}),seenIds=Object.keys(att).map(Number).filter(i=>QBY[i]);r={all:{n:1,s:seenIds}};
  SECTIONS.forEach(sec=>{r[sec]={n:1,s:seenIds.filter(i=>secOf(QBY[i])===sec)}});
  for(const k in r){const pool=k==='all'?Q:Q.filter(q=>secOf(q)===k);if(pool.every(q=>r[k].s.includes(q.id)))r[k]={n:2,s:[]}}store.set('rounds',r)}return r}
const rkeyOf=list=>{if(list.length>=Q.length)return'all';const s0=secOf(list[0]);return list.every(q=>secOf(q)===s0)&&list.length===Q.filter(q=>secOf(q)===s0).length?s0:'all'};
function notDueSet(){const m=mistDB(),t=dn();return new Set(Object.keys(m).filter(id=>m[id].d>t).map(Number))}
function roundInfo(key){const r=rounds()[key]||{n:1,s:[]},pool=key==='all'?Q:Q.filter(q=>secOf(q)===key),S_=new Set(r.s);return {n:r.n,seen:pool.filter(q=>S_.has(q.id)).length,tot:pool.length}}
const roundHint=key=>{const i=roundInfo(key);return `Round ${i.n} · ${i.seen}/${i.tot} seen`};
function markSeen(qs){const r=rounds();let ch=false;for(const q of qs)for(const k of ['all',secOf(q)]){if(!r[k])r[k]={n:1,s:[]};if(!r[k].s.includes(q.id)){r[k].s.push(q.id);ch=true}}if(ch)store.set('rounds',r)}
function roundPick(list,limit,key,ordered){const att=store.get('qAtt',{}),ex=notDueSet(),r=rounds();if(!r[key])r[key]={n:1,s:[]};const R_=r[key];
  const units=[],gs=new Set();for(const q of list){const g=q.passage_group;let u;if(!g)u=[q];else{if(gs.has(g))continue;gs.add(g);u=Q.filter(x=>x.passage_group===g).sort((a,b)=>a.id-b.id)}if(!u.some(x=>ex.has(x.id)))units.push(u)}
  if(!units.length)return [];const order=a=>ordered?a.slice().sort((x,y)=>x[0].id-y[0].id):shuffle(a);
  if(!(limit>0))limit=1e9;let seen=new Set(R_.s);const pick=[];let c=0;
  const pend=new Set(R_.p||[]),fr=order(units.filter(u=>u.some(x=>!seen.has(x.id))));for(const u of [...fr.filter(u=>u.some(x=>pend.has(x.id))),...fr.filter(u=>!u.some(x=>pend.has(x.id)))]){if(c>=limit)break;pick.push(u);c+=u.length}
  const nU=pick.length;if(c<limit){R_.n++;R_.s=[];R_.p=pick.flat().map(q=>q.id);store.set('rounds',r);const rest=units.filter(u=>!pick.includes(u)).map(u=>({u,a:Math.min(...u.map(q=>att[q.id]||0)),x:Math.random()})).sort((p,q)=>p.a-q.a||p.x-q.x);
    for(const o of rest){if(c>=limit)break;pick.push(o.u);c+=o.u.length}}
  return (ordered?pick:[...shuffle(pick.slice(0,nU)),...shuffle(pick.slice(nU))]).flat()}
function smartPick(list,limit,key){return roundPick(list,limit,key||rkeyOf(list))}
function start(list,opts,missedMode,limit){if(!list.length){alert('No questions match.');return false}
  // passage groups: a group is always taken whole (members from the full bank, id order) and counts as one unit;
  // with a size limit we add whole units until the limit is reached (may slightly exceed it, never splits a group)
  const units=[],seen=new Set();
  for(const q of list){const g=q.passage_group;if(!g){units.push([q]);continue}if(seen.has(g))continue;seen.add(g);units.push(Q.filter(x=>x.passage_group===g).sort((a,b)=>a.id-b.id))}
  let take=units;if(limit>0){take=[];let c=0;for(const u of units){if(c>=limit)break;take.push(u);c+=u.length}}
  const flat=[],steps=[];take.forEach(u=>{steps.push([flat.length,u.length]);flat.push(...u)});
  const sc=store.get('quizOpts',{}).sc!==false,perm={};if(sc)flat.forEach(q=>{if(!isOrderQ(q))perm[q.id]=shuffle(Object.keys(q.choices))});
  S={sid:Date.now()+''+Math.random(),list:flat,steps,si:0,opts,missedMode,i:0,score:0,wrong:[],ans:{},perm};showQ()}
// v42: shuffled choice order lives in S.perm[qid] (original keys in display order); labels follow position
const corder=q=>(S&&S.perm&&S.perm[q.id])||Object.keys(q.choices);
function dk(q,k){const p=S&&S.perm&&S.perm[q.id];if(!p)return String(k);const i=p.indexOf(String(k));return i<0?String(k):Object.keys(q.choices)[i]}
// rewrite "choice 2", "choices 1 and 3", "option B" in note text to the displayed labels
function rmap(q,t){if(!t||!(S&&S.perm&&S.perm[q.id]))return t;return String(t).replace(/(\b(?:[Cc]hoices?|[Oo]ptions?)\s*)((?:[1-4A-D]\b(?:\s*(?:,|and|or|&|\/)\s*)?)+)/g,(m,a,b)=>a+b.replace(/[1-4A-D]\b/g,d=>q.choices[d]!=null?dk(q,d):d))}
const isKanjiQ=q=>/表記/.test(q.category),isReadingQ=q=>/読み/.test(q.category),isUsageQ=q=>/用法/.test(q.category),isParaQ=q=>/言い換え/.test(q.category);
const hlHTML=(p,r)=>{const t=furi&&r?r:p.map(esc);return `${t[0]}<mark class="hl">${t[1]}</mark>${t[2]}`};
const BLANK=/_{2,}|（[\s　]*）/g;
const isOrderQ=q=>/並べ替え/.test(q.category)&&Array.isArray(q.correct_order),isLongQ=q=>isUsageQ(q)||/内容理解|統合理解|情報検索/.test(q.category)||Object.values(q.choices).some(c=>c.length>14);
// v61: a paragraph that is only （中略） renders as a faded divider (data unchanged, no tap-a-word)
const CHU_RE=/^[\s\u3000]*[（(][\s\u3000]*中略[\s\u3000]*[）)][\s\u3000]*$/;
function chuuryaku(h){const L=h.split('\n'),out=[];for(let i=0;i<L.length;i++){const txt=L[i].replace(/<rt>.*?<\/rt>|<rp>.*?<\/rp>/g,'').replace(/<[^>]+>/g,'');
  if(CHU_RE.test(txt)){while(out.length&&!out[out.length-1].replace(/<[^>]+>/g,'').trim())out.pop();out.push('<span class="chu" role="separator" aria-label="中略 (omitted)"><span>中略</span></span>');while(i+1<L.length&&!L[i+1].replace(/<[^>]+>/g,'').trim())i++;continue}
  out.push(L[i])}return out.join('\n').replace(/\n?(<span class="chu"[^]*?<\/span><\/span>)\n?/g,'$1')}
function passageHTML(q,open){if(!q.passage&&!q.passage_title)return'';const t=q.passage_title?(furi&&q.passage_title_ruby?q.passage_title_ruby:esc(q.passage_title)):'';
  if(!q.passage)return `<p class="ptitle">📄 ${t}</p>`;
  const P=q.passage_w?q:q.pref?Q.find(x=>x.id===q.pref):null;
  return `<details class="passage"${open||(S&&S.passOpen)?' open':''}><summary>📄 ${t||'Passage 本文'}</summary>${P&&P.wl?`<details class="wlist" data-p="${P.id}"><summary>📖 Word list <span class="mut">· ${P.wl.length} words</span></summary><div class="wlb"></div></details>`:''}<div class="ptext ja">${chuuryaku((P?(furi?P.passage_w_ruby:P.passage_w):furi&&q.passage_ruby?q.passage_ruby:esc(q.passage)).replace(/\[(\d+)\]/g,'<b class="blank num">［$1］</b>'))}</div></details>`}
function orderQHTML(q){let i=0;const body=F(q,'question').replace(/_{3,}|★/g,m=>m==='★'?'<b class="slot star">★</b>':'<b class="slot"></b>'.repeat(Math.max(1,Math.round(m.length/5))));
  return `<p class="q">${body}</p><p class="qhint">Arrange the four parts in order — choose the one that goes in ★</p>`}
function orderAnsHTML(q){let si;const sl=q.question.match(/_{3,}|★/g)||[];si=sl.indexOf('★');if(si<0||String(q.correct_order[si])!==String(q.answer))si=q.correct_order.map(String).indexOf(String(q.answer));
  return `<div class="order"><span class="lbl">Correct order 正しい順番</span><div class="osegs">${q.correct_order.map((k,j)=>`<span class="oseg${j===si?' star':''}">${j===si?'<i>★</i>':''}<span class="badge">${esc(k)}</span> ${furi&&q.choices_ruby&&q.choices_ruby[k]?q.choices_ruby[k]:esc(q.choices[k])}</span>${j<q.correct_order.length-1?'<span class="arr">→</span>':''}`).join('')}</div></div>`}
function questionHTML(q){
  if(isOrderQ(q))return orderQHTML(q);
  if(isUsageQ(q))return `<div class="uword">${esc(q.question)}</div><p class="qhint">Choose the sentence that uses this word correctly</p>`;
  if(isParaQ(q)&&q.question_hl)return `<p class="q">${hlHTML(q.question_hl,q.question_hl_ruby)}</p><p class="qhint">Choose the closest meaning to the highlighted word</p>`;
  if(isKanjiQ(q)&&q.question_tested){const t=furi&&q.question_tested_ruby?q.question_tested_ruby:q.question_tested.map(esc);
    return `<p class="q">${(t[0]+'<span class="tested">'+t[1]+'</span>'+t[2]).replace(BLANK,'<b class="blank">（＿＿）</b>')}</p><p class="qhint">Choose the correct kanji for the underlined word</p>`}
  if(isReadingQ(q)&&!furi&&q.complete_sentence_hl&&q.question.includes(q.answer_word)){const i=q.question.indexOf(q.answer_word);
    return `<p class="q">${esc(q.question.slice(0,i))}<span class="tested">${esc(q.answer_word)}</span>${esc(q.question.slice(i+q.answer_word.length))}</p><p class="qhint">Choose the correct reading of the underlined word</p>`}
  const body=(q.question_w?(furi?q.question_w_ruby:q.question_w):furi&&isReadingQ(q)&&q.question_ruby_hide?q.question_ruby_hide:F(q,'question')).replace(BLANK,'<b class="blank">（＿＿）</b>').replace(/\[(\d+)\]/g,'<b class="blank num">［$1］</b>');
  return `<p class="q">${body}</p>${isReadingQ(q)?'<p class="qhint">Choose the correct reading of the underlined word</p>':''}`}
function choiceHTML(q,k,answered){if(answered&&isUsageQ(q)&&q.choices_hl_w&&q.choices_hl_w[k])return hlHTML(q.choices_hl[k],q.choices_hl_w[k]);if(answered&&q.choices_w&&q.choices_w[k])return q.choices_w[k];if(isUsageQ(q)&&q.choices_hl&&q.choices_hl[k])return hlHTML(q.choices_hl[k],q.choices_hl_ruby&&q.choices_hl_ruby[k]);const r=q.choices_ruby&&q.choices_ruby[k];return furi&&r&&(answered||!isKanjiQ(q))?r:esc(q.choices[k])}
function stepLabel(){const[st,n]=S.steps[S.si];return n>1?`Q${st+1}–${st+n}`:`Q${st+1}`}
function showQ(){S.ans={};const[st,n]=S.steps[S.si];S.i=st;const qs=S.list.slice(st,st+n),q0=qs[0];markSeen(qs);
  app.innerHTML=`<div class="qtop">${fmBtns()}<div class="qprog"><div style="width:${S.si*100/S.steps.length}%"></div></div><span class="mut sm">${S.si+1}/${S.steps.length}${n>1?` · ${stepLabel()}`:''}</span><button class="aa qend" id="qend" aria-label="End quiz" title="End quiz">✕</button>${aaBtn()}</div>
  ${n>1?`<div class="card qcardq gpass"><p class="qmeta">${esc(secOf(q0))} · ${esc(q0.category)} · ${n} questions${S.missedMode?' · review':''}</p>${passageHTML(q0,true)}${q0.reading_guide?'':techHTML(q0)}</div>`:''}
  ${qs.map((q,j)=>`<div class="gq" id="gq${j}"><div class="card qcardq">${n>1?`<p class="qmeta">Question ${j+1}/${n}</p>`:`<p class="qmeta">${esc(secOf(q))} · ${esc(q.category)}${S.missedMode?' · review':''}</p>${passageHTML(q)}${q.reading_guide?'':techHTML(q)}`}
  ${questionHTML(q)}${q.reading_guide&&SHOW_GUIDE?`<div class="gw">${guideHTML(q,false)}</div>`:''}</div>
  <div class="choices${isLongQ(q)?' usage long':''}">${corder(q).map(k=>`<button class="choice" data-k="${esc(k)}" data-j="${j}"><span class="ck">${esc(dk(q,k))}</span><span class="cv">${choiceHTML(q,k,false)}</span></button>`).join('')}</div><div class="fbw"></div></div>`).join('')}
  <div id="nxw"></div>`;
  app.querySelectorAll('.choice').forEach(b=>b.onclick=()=>answer(b.dataset.k,+b.dataset.j));
}
function answer(k,j=0){
  if(S.ans[j]!=null)return;
  const q=S.list[S.i+j],ok=k===String(q.answer);S.ans[j]=k;S.past=S.past||{};S.past[S.si]={...S.ans};
  let missed=store.get('missed',[]),st=store.get('stats',{answered:0,correct:0}),cs=store.get('catStats',{});
  st.answered++;{const qa=store.get('qAtt',{});qa[q.id]=(qa[q.id]||0)+1;store.set('qAtt',qa)}cs[q.category]=cs[q.category]||{a:0,c:0};cs[q.category].a++;
  if(ok){S.score++;st.correct++;cs[q.category].c++;if(S.missedMode)missed=missed.filter(x=>x!==q.id)}else{S.wrong.push({q,k});if(!missed.includes(q.id))missed.push(q.id)}
  if(!ok){srsMiss(q);rcAdd(q,k)}mistRec(q,ok);store.set('missed',missed);store.set('stats',st);store.set('catStats',cs);logActivity();
  renderAnswered(j,true);
  if(q.audio&&S.opts.autoplay)play(q.audio);
}
function renderAnswered(j,anim){
  const q=S.list[S.i+j],k=S.ans[j],ok=k===String(q.answer),box=$('#gq'+j),[st,n]=S.steps[S.si];
  box.querySelectorAll('.choice').forEach(b=>{b.classList.add('dis');b.setAttribute('aria-disabled','true');b.querySelector('.cv').innerHTML=choiceHTML(q,b.dataset.k,true);
    if(b.dataset.k===String(q.answer)){b.classList.add('ok');if(anim&&ok)b.classList.add('pulse')}else if(b.dataset.k===k){b.classList.add('bad');if(anim)b.classList.add('shake')}});
  const hl=q.complete_sentence_hl?(furi&&q.complete_sentence_hl_ruby?q.complete_sentence_hl_ruby:q.complete_sentence_hl.map(esc)):null;
  const sent=hl?`${hl[0]}<mark class="hl">${hl[1]}</mark>${hl[2]}`:F(q,'complete_sentence');
  const ex=q.explain;
  const gw=box.querySelector('.gw');if(gw){const d=gw.querySelector('details');gw.innerHTML=guideHTML(q,true,d&&d.open)}
  app.querySelectorAll(`mark.ks[data-qs~="${q.id}"]`).forEach(m=>m.classList.add('on'));
  box.querySelector('.fbw').innerHTML=`<div class="card fb ${ok?'is-ok':'is-bad'}">
  <div class="fbh"><div class="verdict">${ok?'<span class="vi">✓</span> Correct':'<span class="vi">✕</span> Incorrect'}${ok?'':`<span class="ya">Your answer: <b>${esc(dk(q,k))}</b> ${choiceHTML(q,k,true)}</span>`}</div>
   ${q.audio?`<button class="abtn" aria-label="Play audio" title="Play audio">🔊</button>`:''}</div>
  ${isOrderQ(q)?orderAnsHTML(q):''}
  <div class="achip"><span class="badge ok">正解 ${esc(dk(q,q.answer))}</span><span class="aw">${F(q,'answer_word')}</span><span class="mut sm">${esc(q.answer_romaji)}</span></div>
  ${q.teacher?teacherHTML(q,ok?null:k):''}
  <details class="more"><summary><span class="lbl">More</span><small class="mut">sentence · note · other choices · example</small></summary>
  <p class="ja sent">${sent}</p><p class="mut sm en">${esc(q.complete_sentence_en)}</p>
  ${ex?`<p class="anote">${esc(rmap(q,stripW(ex.answer_note,q.answer_word)))}</p>
   <details class="others dsc${isLongQ(q)?' usage':''}"><summary><span class="lbl">Other choices (${ex.others.length})</span></summary>${ex.others.slice().sort((a,b)=>corder(q).indexOf(String(a.key))-corder(q).indexOf(String(b.key))).map(o=>{const cn=(q.choice_notes||{})[o.key]||null;
     const fake=cn?/not a real word|wrong reading|does not connect|not natural|not a (common|natural|correct)/.test(cn.note)&&!cn.example_ja:o.fake;
     const mean=stripW(cn?(cn.meaning_en&&cn.meaning_en.trim()!==String(q.choices[o.key]).trim()?cn.meaning_en:''):(o.form?o.form+' ':'')+o.note,q.choices[o.key],cn&&cn.reading), form=cn&&cn.form?`<span class="of">${esc(cn.form)}</span> `:'';
     return `<div class="orow${fake?' fake':''}"><span class="badge">${esc(dk(q,o.key))}</span><div class="obody"><div class="oline"><span class="ow">${choiceHTML(q,o.key,true)}</span>${mean?`<span class="on2">${form}${esc(rmap(q,mean))}</span>`:''}${cn&&cn.note&&!/^\s*wrong\s*$/i.test(cn.note)?`<span class="onote">${esc(rmap(q,cn.note))}</span>`:''}</div>
      ${cn&&cn.example_ja?`<div class="oex"><span class="rei">例</span><div><div class="ja">${furi&&cn.example_ja_ruby?cn.example_ja_ruby:esc(cn.example_ja)}</div><div class="oen">${esc(cn.example_en)}</div></div></div>`:''}</div></div>`}).join('')}</details>
   ${ex.tip?`<p class="tip">💡 <b>Tip</b> ${esc(rmap(q,ex.tip))}</p>`:''}`:`<p class="anote">${esc(rmap(q,q.explanation_en))}</p>`}
  <div class="ex tight"><span class="lbl">Example 例文</span><div class="ja">${F(q,'example_ja')}</div><div class="mut sm">${esc(q.example_en)}</div></div></details></div>`;
  if(q.audio)box.querySelector('.abtn').onclick=()=>play(q.audio);
  if(q.teacher)bindTeacher(box.querySelector('.tch'),q,ok?null:k);
  const done=Object.keys(S.ans).length>=n;
  if(done){$('.qprog div').style.width=`${(S.si+1)*100/S.steps.length}%`;
    $('#nxw').innerHTML=`<div class="nextbar"><button class="btn primary big full" id="nx">${S.si+1<S.steps.length?'Next →':'See results'}</button></div>`;
    $('#nx').onclick=()=>{if(audio)audio.pause();S.si++;S.si<S.steps.length?(showQ(),window.scrollTo(0,0)):results()}}
  else if(n>1)$('#nxw').innerHTML=`<p class="mut sm gleft">${n-Object.keys(S.ans).length} more question(s) in this passage ↑↓</p>`;
  if(anim){const nxt=done?$('#nxw'):box.querySelector('.fbw');nxt.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'nearest'})}
}
function results(celebrate=true){S.done=true;
  const n=S.list.length,p=pct(S.score,n);
  app.innerHTML=`<div class="card res"><h2>Results 結果</h2>${ring(p,p+'%',`${S.score}/${n}`,140,p>=80?'var(--ok)':p>=50?'var(--indigo)':'var(--accent)')}
  <p class="mut">${p>=80?'すばらしい！ Excellent work.':p>=50?'いい調子！ Keep going.':'がんばろう！ Review and try again.'}</p>
  <div class="row center"><button class="btn primary" id="again">New quiz</button>${S.wrong.length?`<button class="btn ghost" id="rw">↺ Retry missed</button>`:''}<a class="btn ghost" href="#home">Home</a></div><p class="rhint mut sm">${roundHint(S.rkey||'all')}</p>${tdAfterQuiz()}</div>
  ${S.wrong.length?`<h2 class="sec-t">Review missed questions</h2>`+S.wrong.map(({q,k})=>`<div class="card"><p class="ja">${F(q,'complete_sentence')}</p><p class="mut">${esc(q.complete_sentence_en)}</p>
  <p>Your answer: <span class="t-bad">${esc(dk(q,k))}. ${choiceHTML(q,k,true)}</span><br>正解：<span class="t-ok">${esc(dk(q,q.answer))}. ${F(q,'answer_word')}</span> <span class="mut">(${esc(q.answer_romaji)})</span></p>
  <p class="mut sm">${esc(q.explanation_en)}</p>${q.audio?`<button class="btn sm ghost" data-a="${esc(q.audio)}">🔊 Play</button>`:''}</div>`).join(''):'<div class="card t-ok center">Perfect score! 満点！</div>'}`;
  $('#again').onclick=()=>{S=null;saveSess();location.hash='quiz'};app.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>play(b.dataset.a));
  if($('#rw'))$('#rw').onclick=()=>start(S.wrong.map(w=>w.q),S.opts,true);
  if(celebrate&&p>=80)confetti();
}
function confetti(){if(reduced())return;const c=document.createElement('div');c.className='confetti';
  const cols=['#d9412b','#3f51a5','#f2b134','#2e8b57','#e86aa6'];
  for(let i=0;i<70;i++){const s=document.createElement('i');s.style.left=Math.random()*100+'%';s.style.background=cols[i%5];s.style.animationDelay=Math.random()*.6+'s';s.style.animationDuration=1.8+Math.random()*1.4+'s';s.style.setProperty('--dx',(Math.random()*160-80)+'px');s.style.setProperty('--r',(Math.random()*720)+'deg');c.appendChild(s)}
  document.body.appendChild(c);setTimeout(()=>c.remove(),3800)}

/* ---------- Kanji ---------- */
function kunHTML(list,lab){const seen=new Set(),out=[];
  for(const r of list||[]){const plain=r.replace(/\./g,'');if(seen.has(plain))continue;seen.add(plain);
    const [stem,oku]=r.split('.');out.push(`${esc(stem)}${oku?`<span class="oku">${esc(oku)}</span>`:''}`)}
  return out.length?`<span class="rds kun">${lab?'<i class="rl">訓</i>':''}${out.join('<span class="rdot">·</span>')}</span>`:'<span class="mut">—</span>'}
function onHTML(list,lab){return (list||[]).length?`<span class="rds on">${lab?'<i class="rl">音</i>':''}${list.map(esc).join('<span class="rdot">·</span>')}</span>`:'<span class="mut">—</span>'}
function rdHTML(m){return [m.onyomi.length?onHTML(m.onyomi,1):'',m.kunyomi.length?kunHTML(m.kunyomi,1):''].filter(Boolean).join(' ')}
function diffMark(g,D){let t=esc(g.difference||'');const parts=new Set();g.members.forEach(m=>{const d=D[m.kanji];if(!d)return;(d.by.match(/[\u2E80-\u2FDF\u31C0-\u31EF\u3400-\u9FFF\uF900-\uFAFF\u{20000}-\u{2FFFF}]/gu)||[]).forEach(c=>{if(c!==m.kanji&&!(g.shared_part||'').includes(c))parts.add(c)})});
  if(!parts.size)return t;const re=new RegExp('(['+[...parts].join('')+'])','gu');return t.replace(re,'<b class="dp">$1</b>')}
function kBadges(x){return `<div class="kbadges">${lvBadge(x)}<span class="gb">${gradeTxt(x.grade)}</span></div>`}
function kStats(x){return `<div class="kstats k3"><div class="st"><span class="lbl rlon">音 On</span><div>${onHTML(x.onyomi)}</div></div>
   <div class="st"><span class="lbl rlkun">訓 Kun</span><div>${kunHTML(x.kunyomi)}</div></div>
   <div class="st sx"><span class="sv">${x.stroke_count}<small>画</small></span><span class="sv">${esc(x.radical)} <small class="mut">#${x.radical_number}</small></span></div></div>`}
function markKanji(c){const kv=store.get('kanjiViewed',[]);if(!kv.includes(c)){kv.push(c);store.set('kanjiViewed',kv)}}
const VS={},ORDER={vocab:null,kanji:null};
// v52: deck order/index/hint saved per history entry so Back restores exactly that screen (shared state let a later Words visit overwrite it)
const DECKS=(()=>{try{return JSON.parse(sessionStorage.getItem('n1_decks'))||{}}catch(e){return{}}})();
const seg=(g)=>`<div class="seg"><button class="${g===true?'on':''}" id="tg">Grid</button><button class="${g===false?'on':''}" id="tc">Cards</button><button class="${g==='sim'?'on':''}" id="ts">Look-alike</button></div>`;
const wireSeg=()=>{const t=$('#ts');if(t)t.onclick=()=>{location.hash='similar'}};
const simOf=c=>SIM.filter(g=>g.kanji.includes(c));
function simCard(g,open,focus){const tile=g.part_display||g.shared_part||g.kanji[0];
  return `<div class="card simg${open?' open':''}" data-g="${g.id}">
  <button class="simrow" aria-expanded="${open}"><span class="spk">${esc(tile)}</span>
   <span class="srm"><span class="srt"><b>${esc(g.shared_label||tile)}</b>${g.part_meaning?`<span class="srmean">${esc(g.part_meaning)}</span>`:''}</span>
    ${g.part_expect?`<span class="srx">${esc(g.part_expect)}</span>`:''}
    <span class="srk">${g.members.map(m=>`<i${m.kanji===focus?' class="focus"':''}>${esc(m.kanji)}</i>`).join('')}</span></span>
   <span class="chev" aria-hidden="true">▾</span></button>
  <div class="simx"><div class="simxi">
  <div class="simk">${g.members.map(m=>`<span class="sk${m.kanji===focus?' focus':''}"><b>${esc(m.kanji)}</b><small>${esc(m.meaning_en.split(';')[0])}</small></span>`).join('')}</div>
  <p class="simd">${diffMark(g,Object.fromEntries(g.members.filter(m=>m.diff_by).map(m=>[m.kanji,{by:m.diff_by}])))}</p>
  <div class="simb">${g.members.map(m=>`<div class="simm"><div class="simmk">${K.some(x=>x.kanji===m.kanji)?`<a href="#kanji/${encodeURIComponent(m.kanji)}">${esc(m.kanji)}</a>`:esc(m.kanji)}</div><div class="simmi">
   <div class="simmean">${esc(m.meaning_en)}</div>
   <div class="simr">${rdHTML(m)}</div>
   <div class="simw"><span class="ja">${furi&&m.sample.word_ruby?m.sample.word_ruby:esc(m.sample.word)}</span> <span class="exr sm">${esc(m.sample.reading)}</span> <span class="mut sm">${esc(m.sample.meaning_en)}</span></div></div></div>`).join('')}</div>
  </div></div></div>`}
function setSimOpen(c,o){c.classList.toggle('open',o);c.querySelector('.simrow').setAttribute('aria-expanded',o)}
function wireSim(root,single){root.querySelectorAll('.simrow').forEach(b=>b.onclick=()=>{const c=b.closest('.simg'),o=!c.classList.contains('open');
  if(single&&o)root.querySelectorAll('.simg.open').forEach(x=>{if(x!==c)setSimOpen(x,false)});setSimOpen(c,o)})}
const TIPS=window.TIPS||{sections:[],hints:{}};
function tipKey(q){return Object.keys(TIPS.hints).find(k=>q.category.includes(k))}
document.documentElement.dataset.ts=store.get('ts','m');
// v43 text size: one delegated handler (v41's ✕ End button also has class .aa and was stealing the old querySelector('.aa') hookup)
const fuBtn=()=>`<button class="aa fubtn" type="button" aria-pressed="${furiOn}" aria-label="Furigana ${furiOn?'on':'off'} (tap to toggle)" title="Furigana"><span class="fk">あ</span><span class="fK">亜</span></button>`;
let TCH=null;
function fmtT(t){t=Math.max(0,Math.round(t||0));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}
function teacherHTML(q,wk){const t=q.teacher,W=wk&&t.w&&t.w[wk],D0=W?W[1]:0,DT=D0+t.duration;return `<div class="tch" data-q="${q.id}"><div class="tpill"><button class="tpb" aria-label="Play teacher explanation">▶</button><span class="tlb">${W?'For your answer, then the explanation':'Teacher explains'}</span><span class="tbar"><i></i>${(W?[{start:0}]:[]).concat((t.chapters||[]).slice(1)).map(c=>`<b style="left:${(100*(c.start+D0)/DT).toFixed(2)}%"></b>`).join('')}</span><span class="ttm">${fmtT(DT)}</span></div>
  <details class="ttr"><summary>Transcript${t.credit?` <span class="tcr">· ${esc(t.credit)}</span>`:''}</summary>${trHTML(q,wk)}</details></div>`}
// v73: transcripts live in teacher.js (lazy); chapter blocks are filled on first open
// v82: topic label = the choice itself (kanji + reading) with a subtle ✓ / ✗
function tkLabel(q,ci,title){const ks=Object.keys(q.choices),wr=ks.filter(k=>k!==String(q.answer)),ch=q.teacher.chapters||[];
  if(isOrderQ(q)||ch.length!==wr.length+1)return esc(title);const k=ci?wr[ci-1]:String(q.answer),txt=String(q.choices[k]);if(txt.length>12)return `<i class="tkm ${ci?'x':'o'}">${ci?'✗':'✓'}</i>${esc(title)}`;
  const cn=(q.choice_notes||{})[k]||{},form=ci?cn.form:(q.answer_word!==txt?q.answer_word:''),isK=s=>/[\u4e00-\u9fff]/.test(s);
  let rd=cn.reading||'';if(!rd&&isK(txt)){const v=V.find(v=>v.word===txt);if(v)rd=v.reading}
  const lab=form&&!isK(txt)&&isK(form)?`${esc(form)}<small>（${esc(txt)}）</small>`:rd&&rd!==txt?`${esc(txt)}<small>（${esc(rd)}）</small>`:esc(txt);
  return `<i class="tkm ${ci?'x':'o'}">${ci?'✗':'✓'}</i>${lab}`}
function trHTML(q,wk){const t=q.teacher,T=window.TEACHER&&window.TEACHER[q.id],Wa=wk&&t.w&&t.w[wk],Ws=Wa&&T&&T.w&&T.w[wk],D0=Wa?Wa[1]:0;
  if(T&&T.sg){const ch=t.chapters||[{title:'',start:0}];return `<div class="ttx tkar${store.get('enAll',false)?' enall':''}"><button class="tken" type="button">${store.get('enAll',false)?'Hide English':'Show all English'}</button>${Ws?`<div class="tkc tkw"><div class="tkh"><i class="tkm x">✗</i>${esc(String(q.choices[wk]).length>12?'Your choice':q.choices[wk])} <small>· for you</small></div>${Ws.map(g=>`<span class="tsg" data-s="${g[0]}"><span class="tja">${g[1]}</span>${g[2]?`<span class="ten">${esc(g[2])}</span>`:''}</span>`).join('')}</div>`:''}${ch.map((c,ci)=>`<div class="tkc">${c.title?`<div class="tkh">${tkLabel(q,ci,c.title)}</div>`:''}${T.sg.filter(g=>g[1]===ci).map(g=>`<span class="tsg" data-s="${+(g[0]+D0).toFixed(2)}"><span class="tja">${g[2]}</span>${g[3]?`<span class="ten">${esc(g[3])}</span>`:''}</span>`).join('')}</div>`).join('')}</div>`}
  const ph=T?'':' data-ph="1"';
  if(t.chapters)return `<div class="ttx"${ph}>${t.chapters.map((c,i)=>`<div class="tchap" data-s="${c.start}"><span class="tct">${esc(c.title)}</span><span class="tcx">${T?esc(T.ch[i]||'').replace(/\n/g,'<br>'):'…'}</span></div>`).join('')}</div>`;
  return `<div class="ttx"${ph}>${T?esc(T.script).replace(/\n/g,'<br>'):'…'}</div>`}
let teacherP=null;function loadTeacher(){return teacherP||(teacherP=new Promise((ok,no)=>{if(window.TEACHER)return ok(window.TEACHER);const sc=document.createElement('script');sc.src='teacher.js?v='+APP_VERSION.slice(1);sc.onload=()=>ok(window.TEACHER);sc.onerror=()=>{teacherP=null;no()};document.head.appendChild(sc)}))}
function fillTr(el,q,wk){if(!el.querySelector('.ttx[data-ph]'))return;loadTeacher().then(()=>{const x=el.querySelector('.ttx');if(x){const d=document.createElement('div');d.innerHTML=trHTML(q,wk);x.replaceWith(d.firstElementChild);if(el._wire)el._wire();if(el._sync)el._sync()}}).catch(()=>{})}
// v83: when the answer was wrong and a tailored clip exists, the player plays that clip first (it ends with a chime), then the
// main explanation, on one combined timeline. Nothing auto-plays.
function bindTeacher(el,q,wk){if(!el)return;if(TCH){TCH.pause();TCH=null}
  const W=wk&&q.teacher.w&&q.teacher.w[wk],D0=W?W[1]:0,DM=q.teacher.duration,DT=D0+DM;
  const a=new Audio(W?W[0]:q.teacher.audio),b=el.querySelector('.tpb'),bar=el.querySelector('.tbar'),fill=bar.querySelector('i'),tm=el.querySelector('.ttm');a.preload='none';
  let ph=W?0:1,want=null;const T=()=>ph===0?a.currentTime:D0+a.currentTime;
  const load=(p,t)=>{ph=p;want=t;a.src=p===0?W[0]:q.teacher.audio;a.load()};
  a.addEventListener('loadedmetadata',()=>{if(want!=null){try{a.currentTime=want}catch(e){}want=null}});
  const seek=t=>{t=Math.max(0,Math.min(DT-.05,t));const p=W&&t<D0?0:1,lt=p===0?t:t-D0;if(p!==ph)load(p,lt);else a.currentTime=lt;TCH=a;if(a.paused)a.play().catch(()=>{})};
  const st=()=>{const p=!a.paused;b.textContent=p?'❚❚':'▶';b.setAttribute('aria-label',p?'Pause':'Play teacher explanation');el.classList.toggle('on',p||T()>0)};
  b.onclick=e=>{e.stopPropagation();if(a.paused){if(TCH&&TCH!==a)TCH.pause();TCH=a;a.play().catch(()=>{})}else a.pause()};
  a.onplay=a.onpause=st;
  a.onended=()=>{if(ph===0){load(1,0);a.play().catch(()=>{});return}if(W)load(0,0);else a.currentTime=0;st();last=-2;sync()};
  a.ontimeupdate=()=>{fill.style.width=(100*T()/DT)+'%';tm.textContent=fmtT(T())+' / '+fmtT(DT)};
  bar.onclick=e=>{e.stopPropagation();const r=bar.getBoundingClientRect();seek(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*DT)};
  el._wire=()=>el.querySelectorAll('.tchap').forEach(c=>c.onclick=e=>{e.stopPropagation();seek(D0+ +c.dataset.s)});el._wire();
  const tr=el.querySelector('.ttr');if(tr){tr.addEventListener('toggle',()=>{if(tr.open)fillTr(el,q,wk)});if(tr.open)fillTr(el,q,wk)}
  a.addEventListener('timeupdate',()=>{let cur=-1;el.querySelectorAll('.tchap').forEach((c,i)=>{if(T()>=D0+ +c.dataset.s)cur=i});el.querySelectorAll('.tchap').forEach((c,i)=>c.classList.toggle('cur',i===cur&&T()>0))});
  let raf=0,last=-2,uScroll=0;const segs=()=>el.querySelectorAll('.tsg');
  const sync=()=>{const S_=segs();if(S_.length){const t=T();let c=-1;S_.forEach((s,i)=>{if(t+0.08>=+s.dataset.s)c=i});if(t===0&&a.paused&&ph===(W?0:1))c=-1;
     if(c!==last){last=c;S_.forEach((s,i)=>{s.classList.toggle('cur',i===c);s.classList.toggle('past',i<c)});
       const tr=el.querySelector('.ttr');if(c>=0&&tr&&tr.open&&Date.now()-uScroll>2500){const r=S_[c].getBoundingClientRect(),H=innerHeight;if(r.top<H*.2||r.bottom>H*.75)S_[c].scrollIntoView({block:'center',behavior:reduced()?'auto':'smooth'})}}}
    if(!a.paused)raf=requestAnimationFrame(sync)};
  a.addEventListener('play',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(sync)});a.addEventListener('pause',()=>{cancelAnimationFrame(raf);sync()});a.addEventListener('seeked',sync);
  ['touchmove','wheel'].forEach(ev=>window.addEventListener(ev,()=>{uScroll=Date.now()},{passive:true}));
  el.addEventListener('click',e=>{const tb=e.target.closest('.tken');if(tb){e.stopPropagation();const on=!store.get('enAll',false);store.set('enAll',on);el.querySelectorAll('.tkar').forEach(x=>x.classList.toggle('enall',on));el.querySelectorAll('.tken').forEach(b=>b.textContent=on?'Hide English':'Show all English');return}
    const sg=e.target.closest('.tsg');if(!sg||sg.classList.contains('cur'))return;e.stopPropagation();if(TCH&&TCH!==a)TCH.pause();seek(+sg.dataset.s);last=-2;sync()});
  el._sync=()=>{last=-2;sync()};
  window.addEventListener('hashchange',()=>a.pause(),{once:true})}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.fubtn');if(!b)return;e.preventDefault();furiOn=!furiOn;store.set('furigana',furiOn);applyFuri();
  document.querySelectorAll('.fubtn').forEach(x=>{x.setAttribute('aria-pressed',furiOn);x.setAttribute('aria-label','Furigana '+(furiOn?'on':'off')+' (tap to toggle)')});const hf=document.getElementById('hf');if(hf)hf.checked=furiOn});
const TS=['s','m','l','xl'],aaBtn=()=>{const t=store.get('ts','m');return fuBtn()+`<button class="aa aats" type="button" aria-label="Text size: ${t.toUpperCase()} (tap to change)" title="Text size">A<small>a</small><i>${t.toUpperCase()}</i></button>`};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.aats');if(!b)return;e.preventDefault();
  const t=TS[(TS.indexOf(store.get('ts','m'))+1)%TS.length];store.set('ts',t);document.documentElement.dataset.ts=t;
  document.querySelectorAll('.aats').forEach(x=>{x.querySelector('i').textContent=t.toUpperCase();x.setAttribute('aria-label','Text size: '+t.toUpperCase()+' (tap to change)')})});
// ---- tap-a-word (v30): glossary is lazy-loaded on first use
let glossP=null;function loadGloss(){return glossP||(glossP=new Promise((ok,no)=>{if(window.GLOSS)return ok(window.GLOSS);const sc=document.createElement('script');sc.src='glossary.js?v='+APP_VERSION.slice(1);sc.onload=()=>ok(window.GLOSS);sc.onerror=()=>{glossP=null;no()};document.head.appendChild(sc)}))}
const surfOf=el=>{const c=el.cloneNode(true);c.querySelectorAll('rt,rp').forEach(r=>r.remove());return c.textContent.trim()};
let wsheet=null,wcur=null;
function closeWord(){closeWordRaw();ovDrop()}
function closeWordRaw(){if(wsheet)wsheet.classList.remove('show');if(wcur)wcur.classList.remove('on');wcur=null}
function showWord(el){loadGloss().then(G=>{const g=G[+el.dataset.g];if(!g)return;
  if(wcur)wcur.classList.remove('on');wcur=el;el.classList.add('on');
  if(!wsheet){wsheet=document.createElement('div');wsheet.className='wsheet';wsheet.setAttribute('role','dialog');document.body.appendChild(wsheet)}
  const [lem,lr,pos,gl,vw,rare]=g,surf=el.dataset.s||surfOf(el),sr=el.dataset.r||lr,isG=pos==='grammar';
  wsheet.innerHTML=`<button class="wx" aria-label="Close">×</button>
   <div class="wh"><span class="ws ja">${esc(surf)}</span>${sr&&sr!==surf?`<span class="wr">${esc(sr)}</span>`:''}</div>
   ${lem!==surf||lr!==sr?`<div class="wl ja"><span class="mut">${isG?'pattern':'dictionary form'}</span> <b>${esc(lem)}</b>${lr&&lr!==lem?` 【${esc(lr)}】`:''}</div>`:''}
   <div class="wp"><span class="pill sub">${esc(pos)}</span>${vw?'<span class="pill n1">★ N1 bank</span>':''}${rare?'<span class="pill rare">less common</span>':''}</div>
   <p class="wg">${esc(gl)}</p>${vw?`<a class="btn sm wcard" href="#vocab/${encodeURIComponent(vw)}">Open card →</a>`:''}`;
  wsheet.querySelector('.wx').onclick=closeWord;const a=wsheet.querySelector('.wcard');if(a)a.onclick=()=>closeWord();
  ovOpen(closeWordRaw);requestAnimationFrame(()=>wsheet.classList.add('show'))}).catch(()=>{})}
function renderWL(box){const pid=+box.dataset.p,P=Q.find(x=>x.id===pid);if(!P)return;
  loadGloss().then(G=>{const ko=store.get('wlKanji',false),hf=store.get('wlHard',true);
   let ids=P.wl.slice();if(ko)ids=ids.filter(i=>/[\u3400-\u9fff々]/.test(G[i][0]));
   if(hf){const rk=i=>G[i][5]?0:G[i][4]?1:2;ids=ids.map((i,n)=>[i,n]).sort((a,b)=>rk(a[0])-rk(b[0])||a[1]-b[1]).map(a=>a[0])}
   box.querySelector('.wlb').innerHTML=`<div class="wlc"><label><input type="checkbox" class="wk"${ko?' checked':''}> Kanji words only</label><label><input type="checkbox" class="wh2"${hf?' checked':''}> Hard words first</label></div>
   <ul class="wll">${ids.map(i=>{const [w,r,p,g,vw,rare]=G[i];return `<li class="wli${vw?' n1':rare?' rare':''}" data-g="${i}" data-s="${esc(w)}" data-r="${esc(r)}"><span class="wlw ja">${esc(w)}</span><span class="wlr">${r&&r!==w?esc(r):''}</span><span class="wlg">${esc(g)}</span>${vw?'<i class="mk">★</i>':rare?'<i class="mk">◆</i>':''}</li>`}).join('')}</ul>
   <p class="mut sm wlk">★ in your N1 word bank · ◆ less common word · tap a row for details</p>`;
   box.querySelector('.wk').onchange=e=>{store.set('wlKanji',e.target.checked);renderWL(box)};box.querySelector('.wh2').onchange=e=>{store.set('wlHard',e.target.checked);renderWL(box)}})}
document.addEventListener('click',e=>{let w=e.target.closest&&e.target.closest('#app .w[data-g],.wli');if(w&&w.closest('.tsg:not(.cur)'))w=null;
  if(w){e.preventDefault();showWord(w);return}
  if(wsheet&&wsheet.classList.contains('show')&&!e.target.closest('.wsheet,#hbk'))closeWord()},true);
document.addEventListener('toggle',e=>{const d=e.target;if(d.classList&&d.classList.contains('wlist')&&d.open)renderWL(d)},true);
window.addEventListener('hashchange',()=>{if(wsheet&&wsheet.classList.contains('show')){closeWordRaw()}});
// strip a leading "WORD: " / "WORD (reading) — " that repeats the headword
function stripW(t,...ws){if(!t)return t;const E=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  for(const w of ws.filter(Boolean).sort((a,b)=>b.length-a.length))for(const c of [w,w.replace(/な$/,'')]){const m=t.match(new RegExp('^'+E(c)+'な?\\s*(?:[（(][^)）]{0,30}[)）])?\\s*[:：—–=\\-]\\s*'));if(m&&t.length>m[0].length)return t.slice(m[0].length)}
  return t}
const SHOW_GUIDE=false;  // v59: '💡 How to solve' box hidden on request; data kept in questions.json
function guideHTML(q,answered,open){const g=q.reading_guide;if(!g||!SHOW_GUIDE)return'';
  const ks=g.key_sentences.map(k=>`<li><p class="ja">${furi&&k.ja_ruby?k.ja_ruby:esc(k.ja)}</p><p class="en">${esc(k.en)}</p><p class="why">→ ${esc(k.why)}</p></li>`).join('');
  const tr=Object.entries(g.choice_traps).sort((a,b)=>corder(q).indexOf(a[0])-corder(q).indexOf(b[0])).map(([c,t])=>`<li><span class="ck">${esc(dk(q,c))}</span><div><b class="trap">${esc(t.trap)}</b> <span class="cj">${esc(q.choices[c]||'')}</span><p>${esc(rmap(q,t.evidence))}</p></div></li>`).join('');
  return `<details class="guide"${open?' open':''}><summary>💡 How to solve this question<span class="gtype">${esc(g.type)}</span></summary>
  <div class="gsec"><span class="glbl">📍 Where to look</span><p>${esc(rmap(q,g.where_to_look))}</p></div>
  <div class="gsec"><span class="glbl">🧭 Steps</span><ol class="gsteps">${g.steps.map(t=>`<li>${esc(rmap(q,t))}</li>`).join('')}</ol></div>
  ${answered?`<div class="gsec"><span class="glbl">🔑 Key sentences</span><ul class="gks">${ks}</ul></div>
  <div class="gsec gans"><span class="glbl">✓ Why ${esc(dk(q,q.answer))} is correct</span><p>${esc(rmap(q,g.answer_reason))}</p></div>
  <div class="gsec"><span class="glbl">⚠ Choice traps</span><ul class="gtraps">${tr}</ul></div>
  <div class="gsec gtake"><span class="glbl">★ Takeaway</span><p>${esc(rmap(q,g.takeaway))}</p></div>`
  :`<p class="glock">🔒 Answer the question to see the key sentences, why the answer is right, and the traps in the other choices.</p>`}
  <a href="#tips" class="sm">General 読解 tips →</a></details>`}
function techHTML(q){const k=tipKey(q);if(!k)return'';return `<details class="tech"><summary>💡 Technique · ${esc(k)}</summary><p>${esc(TIPS.hints[k])}</p><a href="#tips" class="sm">Full 読解 guide →</a></details>`}
function tipsView(){app.innerHTML=`<div class="ph"><h1 class="pt">読解 Tips 解き方</h1></div><div class="card tintro"><p>${TIPS.intro||''}</p></div>
  ${TIPS.sections.map((s,i)=>`<details class="card tsec"${i===0?' open':''}><summary>${esc(s.title)}</summary><div class="tbody">${s.html}</div></details>`).join('')}
  <a class="btn primary full" href="#quiz">Practice 読解 →</a>`}
// v46: look-alike groups as a grid; order reshuffles on each fresh entry, kept per history entry (Back restores it)
const SIMO=(()=>{try{return JSON.parse(sessionStorage.getItem('n1_simo'))||{}}catch(e){return{}}})();
const saveSimo=()=>{try{const ks=Object.keys(SIMO);if(ks.length>50)delete SIMO[ks[0]];sessionStorage.setItem('n1_simo',JSON.stringify(SIMO))}catch(e){}};
function similarView(){const st=VS[cur]||{};if(!SIMO[NAV.k]){SIMO[NAV.k]=shuffle(SIM.map(g=>g.id));saveSimo()}
  app.innerHTML=`<div class="ph"><h1 class="pt">Look-alike 似た漢字</h1>${seg('sim')}</div>
  <div class="search"><input type="search" id="s" placeholder="Search kanji or meaning…" value="${esc(st.q||'')}"><span class="mut sm" id="cnt"></span></div><div class="sgbar"><span class="mut sm">Order shuffles each visit</span><button class="btn sm ghost" id="ssh" aria-label="Shuffle order">↻ Shuffle</button></div><div id="sl" class="sgrid"></div>`;
  $('#tg').onclick=()=>{store.set('kanjiMode','grid');location.hash='kanji'};$('#tc').onclick=()=>{store.set('kanjiMode','cards');location.hash='kanjicards'};
  const draw=()=>{const t=$('#s').value.trim().toLowerCase(),ord=SIMO[NAV.k],by=Object.fromEntries(SIM.map(g=>[g.id,g]));
    const f=ord.map(i=>by[i]).filter(Boolean).filter(g=>!t||[g.shared_part||'',g.shared_label||'',g.part_meaning||'',g.part_expect||'',g.difference,...g.members.flatMap(m=>[m.kanji,m.meaning_en,m.sample.word,m.sample.reading,...m.onyomi,...m.kunyomi])].join(' ').toLowerCase().includes(t));
    $('#cnt').textContent=`${f.length} groups`;
    $('#sl').innerHTML=f.map(g=>{const tile=g.part_display||g.shared_part||g.kanji[0];return `<a class="stile" href="#similar/${g.id}"><span class="stp ja">${esc(tile)}</span><span class="stm">${esc(g.part_meaning||g.shared_label||'')}</span><span class="stk ja">${g.members.map(m=>esc(m.kanji)).join('')}</span></a>`}).join('')};
  $('#ssh').onclick=()=>{SIMO[NAV.k]=shuffle(SIM.map(g=>g.id));saveSimo();draw()};
  $('#s').oninput=draw;draw()}
function simDiff(g){const t=g.difference||'',out={};
  for(const m of g.members){const k=m.kanji.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const r=t.match(new RegExp('([^,;:.()（）→]{1,24}?)\\s*(?:\\+\\s*[^,;.→]{0,12})?→\\s*'+k+'\\s*([^,;.]*)'));
    if(r)out[m.kanji]={by:r[1].replace(/^(and|or|but|with)\s+/i,'').trim(),gloss:r[2].trim()}}
  return out}
function simDetail(id){const g=SIM.find(x=>String(x.id)===String(id));if(!g){app.innerHTML='<div class="card">Group not found.</div>';return}
  const tile=g.part_display||g.shared_part||g.kanji[0],D0=simDiff(g),D={};g.members.forEach(m=>{D[m.kanji]=m.diff_by?{by:m.diff_by,gloss:m.diff_gloss}:D0[m.kanji]});const all=g.members.every(m=>D[m.kanji]);
  const rd=rdHTML;
  app.innerHTML=`<div class="sgd">
   <div class="sgh"><span class="sgp ja">${esc(tile)}</span><div class="sgt"><b>${esc(g.shared_label||tile)}</b>${g.part_meaning?` <span class="mut">· ${esc(g.part_meaning)}</span>`:''}</div></div>
   ${g.part_expect?`<p class="sgx">${esc(g.part_expect)}</p>`:''}
   ${all?`<details class="sgnote"><summary>Full note</summary><p class="sgdiff">${diffMark(g,D)}</p></details>`:`<p class="sgdiff">${diffMark(g,D)}</p>`}
   <div class="sgl">${g.members.map(m=>{const inK=KBY[m.kanji],d=D[m.kanji];return `<section class="sgk">
     <div class="sgkh"><span class="sgkc ja">${inK?`<a href="#kanji/${encodeURIComponent(m.kanji)}">${esc(m.kanji)}</a>`:esc(m.kanji)}</span>
      <div class="sgkm">${d?`<div class="sgby"><b class="ja dp">${esc(d.by)}</b> → ${esc(d.gloss||m.meaning_en.split(';')[0])}</div>`:''}<div class="sgmean">${esc(m.meaning_en)}</div><div class="sgrd">${rd(m)}</div></div></div>
     <div class="sgw"><span class="ja sgww">${m.sample.word_ruby&&/<ruby>/.test(m.sample.word_ruby)?m.sample.word_ruby:esc(m.sample.word)}</span>${m.sample.word_ruby&&/<ruby>/.test(m.sample.word_ruby)?`<span class="offuri exr">${esc(m.sample.reading)}</span>`:(m.sample.reading&&m.sample.reading!==m.sample.word?`<span class="exr">${esc(m.sample.reading)}</span>`:'')} <span class="mut">${esc(m.sample.meaning_en)}</span></div>
     ${inK&&inK.mnemonic?storyHTML(m.kanji):''}</section>`}).join('')}</div></div>`;
  app.querySelectorAll('.sgk').forEach((sec,i)=>{const m=g.members[i],d=m&&D[m.kanji];if(!d)return;const cs=new Set((d.by.match(/[\u2E80-\u2FDF\u31C0-\u31EF\u3400-\u9FFF\uF900-\uFAFF]/gu)||[]).filter(c=>c!==m.kanji&&!(g.shared_part||'').includes(c)));sec.querySelectorAll('.mpc:not(.res)').forEach(t=>{const b=t.querySelector('b');if(b&&cs.has(b.textContent.trim()))t.classList.add('dpt')})});  // v56: accent the distinguishing part tile
}
const LEVELS=['all','N5','N4','N3','N2','N1','other'];
const lvl=x=>x.jlpt?'N'+x.jlpt:'other';
const gradeTxt=g=>g==null?'Non-jōyō':g<=6?'Grade '+g:g===8?'Jōyō (secondary)':'Jinmeiyō';
const lvBadge=x=>`<span class="lv lv-${lvl(x)}">${x.jlpt?'N'+x.jlpt:'—'}</span>`;
function levelBar(list){const cur=store.get('kanjiLevel','all');return `<div class="lvbar" id="lvb">${LEVELS.map(l=>{const n=l==='all'?list.length:list.filter(x=>lvl(x)===l).length;return `<button class="lvf${cur===l?' on':''}" data-l="${l}">${l==='all'?'All':l==='other'?'Other':l} <small>${n}</small></button>`}).join('')}</div>`}
const lvOk=x=>{const l=store.get('kanjiLevel','all');return l==='all'||lvl(x)===l};
function kanjiGrid(){
  store.set('kanjiMode','grid');const st=VS[cur]||{};
  app.innerHTML=`<div class="ph"><h1 class="pt">Kanji 漢字</h1>${seg(true)}<a class="btn sm primary stbtn" href="#study/kanji">▶ Study</a></div>
  <div class="search"><input type="search" id="s" placeholder="Search kanji, reading, meaning, word…" value="${esc(st.q||'')}"><span class="mut sm" id="cnt"></span></div>${levelBar(K)}<div class="kgrid" id="kg"></div>`;
  const kv=new Set(store.get('kanjiViewed',[]));
  const draw=()=>{const t=$('#s').value.trim().toLowerCase();const f=K.filter(x=>lvOk(x)).filter(x=>!t||[x.kanji,...x.onyomi,...x.kunyomi.map(r=>r.replace('.','')),x.meaning_en,...(x.common_words||[])].join(' ').toLowerCase().includes(t));
    $('#cnt').textContent=`${f.length} kanji`;
    $('#kg').innerHTML=f.map(x=>`<a class="ktile${kv.has(x.kanji)?' seen':''}" href="#kanji/${encodeURIComponent(x.kanji)}">${lvBadge(x)}<span class="kc">${esc(x.kanji)}</span><span class="km">${esc(x.meaning_en.split(';')[0])}</span></a>`).join('')};
  $('#lvb').querySelectorAll('.lvf').forEach(b=>b.onclick=()=>{store.set('kanjiLevel',b.dataset.l);$('#lvb').querySelectorAll('.lvf').forEach(x=>x.classList.toggle('on',x===b));draw()});
  $('#s').oninput=draw;$('#tc').onclick=()=>{store.set('kanjiMode','cards');location.hash='kanjicards'};wireSeg();draw();
}
function sampleWords(c,limit){const ws=V.filter(v=>(v.kanji||[]).includes(c));
  if(!ws.length)return '<p class="mut sm">No sample words</p>';
  const item=(v,i)=>`<div class="sw-item${limit&&i>=limit?' more':''}"><a class="sw-head" href="#vocab/${encodeURIComponent(v.word)}"><b class="sw-w">${F(v,'word')}</b>${RD(v,"sw-r")}<span class="sw-m">${esc(v.meaning_en)}</span><span class="wa">›</span></a>
    ${v.example_ja?`<div class="sw-ex"><div class="ja">${F(v,'example_ja')}</div><div class="mut sm">${esc(v.example_en)}</div></div>`:''}</div>`;
  return `<div class="swlist${limit&&ws.length>limit?' collapsed':''}"><span class="lbl">Sample words (${ws.length})</span>${ws.map(item).join('')}${limit&&ws.length>limit?`<button class="btn sm ghost showall" type="button">Show all (${ws.length})</button>`:''}</div>`}
function wireSamples(root){root.querySelectorAll('.showall').forEach(b=>{b.onclick=e=>{e.stopPropagation();b.closest('.swlist').classList.remove('collapsed');b.remove()};b.onpointerdown=e=>e.stopPropagation()})}
function kanjiDetail(c){
  const x=K.find(k=>k.kanji===c);if(!x){app.innerHTML='<div class="card">Kanji not found.</div>';return}
  markKanji(c);const words=V.filter(v=>(v.kanji||[]).includes(c));
  app.innerHTML=`<div class="card kb">${kHead(x)}${kStats(x)}${kExtra(x)}</div>
   ${x.mnemonic?`<div class="card mnc">${storyHTML(c)}</div>`:''}<div class="card">${sampleWords(c,0)}</div>${simOf(c).length?`<h2 class="sec-t">Look-alike kanji 似ている漢字</h2>${simOf(c).map(g=>simCard(g,true,c)).join('')}`:''}`;
  wireSim(app);
}

/* ---------- Flashcard deck (words & kanji) ---------- */
function deck(kind,focus){
  const isV=kind==='vocab',src=isV?V:K,dkk=NAV.k,ent=DECKS[dkk]&&DECKS[dkk].kind===kind?DECKS[dkk]:null;
  if(ent){const o=ent.o.map(i=>src[i]).filter(Boolean);if(o.length===src.length)ORDER[kind]=o}
  if(!ORDER[kind])ORDER[kind]=shuffle(src);let data=ORDER[kind];const savedIdx=ent?ent.idx:VS[cur]&&VS[cur].idx;
  const pos=new Map(src.map((x,i)=>[x,i])),saveOrd=()=>{DECKS[dkk]={kind,o:data.map(x=>pos.get(x)),idx:(DECKS[dkk]||{}).idx||0,hint:(DECKS[dkk]||{}).hint};const ks=Object.keys(DECKS);if(ks.length>30)delete DECKS[ks[0]]};let filt=data,idx=0,flipped=false,onlyUnknown=isV&&store.get('wordsFilter',false);
  const ICON={filter:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    shuffle:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>'};
  const showHint=ent&&ent.hint!=null?ent.hint:!store.get('hintSeen_'+kind,false);if(!ent||ent.o.length!==src.length)saveOrd();DECKS[dkk].hint=showHint;
  app.innerHTML=`<div class="ph deck-ph"><h1 class="pt">${isV?'Words 語彙':'Kanji 漢字'}</h1>${isV?'':seg(false)+'<a class="btn sm primary stbtn" href="#study/kanji">▶ Study</a>'}</div>
  <div class="toolbar"><div class="search"><input type="search" id="s" placeholder="Search ${isV?'words':'kanji'}…" aria-label="Search ${isV?'word, reading, romaji, meaning':'kanji, reading, meaning'}"></div>
   ${isV?`<a class="btn sm primary stbtn" href="#study/words">▶ Study</a><button class="ibtn${onlyUnknown?' active':''}" id="ou" aria-pressed="${onlyUnknown}" aria-label="Show only words not marked Know" title="Only not-known words">${ICON.filter}<i class="dot"></i></button>`:''}
</div>
  ${isV?'':levelBar(K)}
  <div class="stage" id="stage"><div class="hint hint-l">✕ Don't know</div><div class="hint hint-r">✓ Know</div>
   <div class="flip" id="fc"><div class="face front" id="ff"></div><div class="face backf" id="fbk"></div></div></div>
  <div class="cgrade" role="group" aria-label="Grade this card"><button class="gb ag" data-g="1">Again</button><button class="gb un" data-g="2">Unsure</button><button class="gb kn" data-g="3">Know</button></div>
  <div class="cnav"><button class="nb" id="pv" aria-label="Previous">←</button><span class="pos" id="cnt" aria-live="polite"></span><button class="nb" id="nx" aria-label="Next">→</button><button class="nb shb" id="sh" aria-label="Shuffle" title="Shuffle">${ICON.shuffle}</button></div>
  <p class="cprog" id="cpg"></p>${showHint?`<p class="taphint">${isV?'Tap to flip · swipe → know · ← don\'t know':'Tap to flip · swipe to move'}</p>`:''}`;
  fitCard();if(showHint)store.set('hintSeen_'+kind,true);
  const match=(x,t)=>!t||(isV?[x.word,x.reading,x.romaji,x.meaning_en]:[x.kanji,...x.onyomi,...x.kunyomi,x.meaning_en,...(x.common_words||[])]).join(' ').toLowerCase().includes(t);
  const vs=()=>store.get('vocabStatus',{});
  function apply(){const t=$('#s').value.trim().toLowerCase(),st=vs();filt=data.filter(x=>(isV||lvOk(x))&&match(x,t)&&(!onlyUnknown||st[x.id]!=='know'));idx=Math.min(idx,Math.max(0,filt.length-1));render()}
  const vsKey=cur;
  function tag(x){if(!isV)return'';const s=vs()[x.id];return s==='know'?'<span class="tag k">Know</span>':s==='dont'?'<span class="tag u">Don\'t know</span>':''}
  function render(){
    if(OV){const f=OV;ovDrop();f()}  // v52: card re-render removes an open story editor/popover, so drop its history step too
    VS[vsKey]=Object.assign(VS[vsKey]||{},{idx});if(DECKS[dkk])DECKS[dkk].idx=idx;
    $('#cnt').textContent=filt.length?`${idx+1} / ${filt.length}`:'0';$('#cpg').innerHTML=cardProg(filt,isV,!isV&&store.get('kanjiLevel','all'));
    const x=filt[idx],fc=$('#fc');fc.classList.toggle('flipped',flipped);
    if(!x){$('#ff').innerHTML='<span class="mut">No cards</span>';$('#fbk').innerHTML='';return}
    if(!isV&&flipped)markKanji(x.kanji);
    $('#ff').innerHTML=isV?`<div class="fw">${F(x,'word')}</div>${tag(x)}`:`<div class="kfront">${esc(x.kanji)}</div>${lvBadge(x)}`;
    $('#fbk').innerHTML=isV?`<div class="vhead"><div class="vword">${F(x,'word')}</div><div><div class="ja">${RD(x,"")} <span class="mut">${esc(x.romaji)}</span></div><span class="pill">${esc(x.part_of_speech)}</span> ${tag(x)}</div></div>
      <div class="vmean">${esc(x.meaning_en)}</div>
      <div class="ex"><div class="ja">${F(x,'example_ja')}</div><div class="mut">${esc(x.example_en)}</div></div>
      <div class="foot">${x.kanji&&x.kanji.length?`<span class="lbl">漢字</span>${x.kanji.map(c=>`<a class="chip" href="#kanji/${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}`:''}
      <span class="lbl">From</span><span class="mut">${(x.source_question_ids||[]).map(i=>'Q'+i).join(', ')}</span></div>`
    :`${kHead(x)}${kStats(x)}${kExtra(x)}
      ${storyHTML(x.kanji)}${sampleWords(x.kanji,4)}`;
    if(!isV)wireSamples($('#fbk'));
    fc.querySelectorAll('a').forEach(a=>{a.onclick=e=>e.stopPropagation();a.onpointerdown=e=>e.stopPropagation()});
    if(0)$('#ls').innerHTML=filt.slice(0,300).map((y,i)=>`<div class="li${i===idx?' cur':''}" data-i="${i}">${isV?`<b>${F(y,'word')}</b> ${RD(y)} — ${esc(y.meaning_en)} ${tag(y)}`:`<b>${esc(y.kanji)}</b> ${esc(y.meaning_en)}`}</div>`).join('');
    if(0)$('#ls').querySelectorAll('[data-i]').forEach(d=>d.onclick=()=>{idx=+d.dataset.i;flipped=false;render();window.scrollTo({top:0,behavior:reduced()?'auto':'smooth'})});
  }
  const go=d=>{if(!filt.length)return;idx=(idx+d+filt.length)%filt.length;flipped=false;render()};
  const mark=v=>{const x=filt[idx];if(!x)return;const s=vs();s[x.id]=v;store.set('vocabStatus',s);logActivity();if(onlyUnknown&&v==='know')apply();else go(1)};
  /* swipe / drag — touch events for touch (with axis lock + preventDefault), pointer events for mouse/pen; tap = flip via click */
  const stage=$('#stage'),fc=$('#fc');let g=null,suppressClick=false;
  const TH=50;
  const dragStart=(x,y)=>{g={x,y,t:performance.now(),dx:0,axis:null}};
  const dragMove=(x,y,ev)=>{if(!g)return;const dx=x-g.x,dy=y-g.y;
    if(!g.axis){if(Math.abs(dx)<8&&Math.abs(dy)<8)return;g.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';if(g.axis==='x')fc.style.transition='none'}
    if(g.axis!=='x')return;if(ev&&ev.cancelable)ev.preventDefault();g.dx=dx;
    fc.style.transform=`translateX(${dx}px) rotate(${dx/25}deg)${flipped?' rotateY(180deg)':''}`;stage.classList.toggle('show-r',dx>TH);stage.classList.toggle('show-l',dx<-TH)};
  const reset=()=>{fc.style.transition='';fc.style.transform='';stage.classList.remove('show-r','show-l')};
  const dragEnd=()=>{if(!g)return;const s=g;g=null;reset();if(s.axis!=='x')return;suppressClick=true;setTimeout(()=>suppressClick=false,350);
    const v=s.dx/Math.max(1,performance.now()-s.t),right=s.dx>TH||(s.dx>25&&v>0.5),left=s.dx<-TH||(s.dx<-25&&v<-0.5);
    if(right){isV?mark('know'):go(-1)}else if(left){isV?mark('dont'):go(1)}};
  stage.addEventListener('touchstart',e=>{if(e.touches.length!==1){g=null;return}if(e.target.closest('a,button'))return;dragStart(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});
  stage.addEventListener('touchmove',e=>{if(g)dragMove(e.touches[0].clientX,e.touches[0].clientY,e)},{passive:false});
  stage.addEventListener('touchend',dragEnd);stage.addEventListener('touchcancel',()=>{g=null;reset()});
  stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0||e.target.closest('a,button,.mnemo'))return;dragStart(e.clientX,e.clientY);try{stage.setPointerCapture(e.pointerId)}catch(_){}});
  stage.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'&&g)dragMove(e.clientX,e.clientY,null)});
  stage.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')dragEnd()});
  stage.addEventListener('pointercancel',e=>{if(e.pointerType!=='touch'){g=null;reset()}});
  stage.addEventListener('click',e=>{if(suppressClick||e.target.closest('a,button,.mnemo'))return;flipped=!flipped;render()});
  $('#pv').onclick=()=>go(-1);$('#nx').onclick=()=>go(1);
  $('#sh').onclick=()=>{data=ORDER[kind]=shuffle(isV?V:K);saveOrd();idx=0;flipped=false;apply()};$('#s').oninput=()=>{idx=0;flipped=false;apply()};
  document.querySelectorAll('.cgrade .gb').forEach(b=>b.onclick=()=>{const x=filt[idx];if(!x)return;const g=+b.dataset.g;cardGrade(isV?'w'+x.id:'k'+x.kanji,g);
    b.classList.add('hit');setTimeout(()=>b.classList.remove('hit'),350);
    if(isV){const st=vs();if(g===3)st[x.id]='know';else if(g===1)st[x.id]='dont';store.set('vocabStatus',st)}
    if(isV&&onlyUnknown&&g===3)apply();else go(1)});
  if(isV){$('#ou').onclick=e=>{onlyUnknown=!onlyUnknown;const b=$('#ou');b.classList.toggle('active',onlyUnknown);b.setAttribute('aria-pressed',onlyUnknown);store.set('wordsFilter',onlyUnknown);idx=0;apply()}}
  else{$('#lvb').querySelectorAll('.lvf').forEach(b=>b.onclick=()=>{store.set('kanjiLevel',b.dataset.l);$('#lvb').querySelectorAll('.lvf').forEach(x=>x.classList.toggle('on',x===b));idx=0;flipped=false;apply()})}
  if(!isV){$('#tg').onclick=()=>{store.set('kanjiMode','grid');location.hash='kanji'};wireSeg()}
  if(VS[cur]&&VS[cur].q)$('#s').value=VS[cur].q;
  apply();
  if(!focus&&savedIdx!=null){idx=Math.min(savedIdx,Math.max(0,filt.length-1));render()}
  if(focus){const i=filt.findIndex(x=>(isV?x.word:x.kanji)===focus);const j=i>=0?i:data.findIndex(x=>(isV?x.word:x.kanji)===focus);if(i<0&&j>=0){filt=data;$('#s').value=''}if(j>=0||i>=0){idx=i>=0?i:j;flipped=true;render()}}
}

/* ---------- Shell: header, tabs, routing ---------- */
let cur='',NAV={k:0,d:0},navCtr=+sessionStorage.getItem('n1_navk')||0;const SCR=(()=>{try{return JSON.parse(sessionStorage.getItem('n1_scr'))||{}}catch(e){return{}}})();
function goBack(){if(OV||NAV.d>0)history.back();else if(cur!=='home')replaceTo('home')}
function replaceTo(h){delete SCR[NAV.k];delete QSESS[NAV.k];history.replaceState({k:NAV.k,d:NAV.d},'','#'+h);cur='';route()}
// v48 settings sheet (one history step; Back closes it)
let sheet=null;
function closeSheetRaw(){if(sheet){sheet.classList.remove('show');const x=sheet;sheet=null;setTimeout(()=>x.remove(),200)}}
function closeSheet(){closeSheetRaw();ovDrop()}
function seg3(id,opts,curv){return `<div class="sseg" id="${id}">${opts.map(([v,l])=>`<button type="button" data-v="${v}" class="${String(v)===String(curv)?'on':''}">${l}</button>`).join('')}</div>`}
function openSettings(){if(sheet)return;const qo=store.get('quizOpts',{}),cfg=srsCfg();
  sheet=document.createElement('div');sheet.className='ssheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','Settings');
  sheet.innerHTML=`<div class="ssbg"></div><div class="sspanel"><div class="ssh"><b>Settings 設定</b><button class="hb icon" id="ssx" aria-label="Close">✕</button></div>
   <label class="srow"><span>Furigana ふりがな</span><input type="checkbox" id="hf" ${furiOn?'checked':''}></label>
   <div class="srow"><span>Theme</span>${seg3('sth',[['light','Light'],['dark','Dark'],['auto','Auto']],store.get('theme','auto'))}</div>
   <div class="srow"><span>Text size</span>${seg3('sts',[['s','S'],['m','M'],['l','L'],['xl','XL']],store.get('ts','m'))}</div>
   <label class="srow"><span>Shuffle answer choices</span><input type="checkbox" id="ssc" ${qo.sc!==false?'checked':''}></label>
   <label class="srow"><span>Focus mode <small class="mut">hide bars in quiz &amp; study</small></span><input type="checkbox" id="sfm" ${store.get('focus',false)?'checked':''}></label>
   <div class="srow"><span>Study session size</span>${seg3('sss',[[10,'10'],[20,'20'],[30,'30'],[50,'50']],cfg.ss)}</div>
   <div class="srow sraud"><span>Offline audio <small class="mut">teacher &amp; question audio</small></span><div id="aud"><span class="mut sm">…</span></div></div>
   <p class="mut sm scred">Stroke order data: <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a> © Ulrich Apel, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA 3.0</a></p><div class="slinks2"><a href="#studyguide">How to study →</a><a href="#progress">Backup &amp; restore →</a></div></div>`;
  document.body.appendChild(sheet);requestAnimationFrame(()=>sheet&&sheet.classList.add('show'));ovOpen(closeSheetRaw);
  const q=s=>sheet.querySelector(s);q('#ssx').onclick=closeSheet;q('.ssbg').onclick=closeSheet;
  q('#hf').onchange=e=>{furiOn=e.target.checked;store.set('furigana',furiOn);applyFuri()};
  const segw=(id,fn)=>q('#'+id).querySelectorAll('button').forEach(b=>b.onclick=()=>{q('#'+id).querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v)});
  segw('sth',v=>{store.set('theme',v);applyTheme()});
  segw('sts',v=>{store.set('ts',v);document.documentElement.dataset.ts=v;document.querySelectorAll('.aats i').forEach(i=>i.textContent=v.toUpperCase())});
  segw('sss',v=>{store.set('srsCfg',{ss:+v})});
  q('#ssc').onchange=e=>store.set('quizOpts',{...store.get('quizOpts',{}),sc:e.target.checked});
  q('#sfm').onchange=e=>{store.set('focus',e.target.checked);applyFocus()};offlineRow(sheet)}
function applyFocus(){const on=store.get('focus',false)&&/^(quiz\/play|study\/)/.test(cur||'');document.documentElement.classList.toggle('focusm',on);document.querySelectorAll('.fmt').forEach(b=>b.setAttribute('aria-pressed',store.get('focus',false)))}
const fmBtns=()=>`<button class="aa fonly fbk" type="button" aria-label="Back">←</button><button class="aa fmt" type="button" aria-pressed="${store.get('focus',false)}" aria-label="Focus mode" title="Focus mode">⛶</button>`;
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.fbk')){goBack();return}const b=e.target.closest&&e.target.closest('.fmt');if(!b)return;store.set('focus',!store.get('focus',false));applyFocus()});
// overlays (word popover, story editor) get one history entry so Back closes them first
let OV=null,ignorePop=false;
function ovOpen(close){if(OV){OV=close;return}OV=close;history.pushState({k:NAV.k,d:NAV.d,ov:1},'',location.href)}
function ovDrop(){if(!OV)return;OV=null;ignorePop=true;history.back()}
let navAfterPop=null;
window.addEventListener('popstate',e=>{if(ignorePop){ignorePop=false;if(navAfterPop){const h=navAfterPop;navAfterPop=null;location.hash=h}return}if(OV){const f=OV;OV=null;f();return}
  if(e.state&&e.state.ov&&location.hash===('#'+cur)){ignorePop=true;history.back()}});
document.addEventListener('click',e=>{if(!OV)return;const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;e.preventDefault();e.stopPropagation();
  const f=OV;OV=null;f();const h=a.getAttribute('href');if(h===location.hash){ignorePop=true;history.back();return}navAfterPop=h;ignorePop=true;history.back()},true);  // v52: drop the overlay step, then push the link as its own step (replacing it lost a Back step)
const QBY=Object.fromEntries(Q.map(q=>[q.id,q]));
// v52: each quiz/play history entry remembers its own quiz session, so Back to an older quiz shows that quiz (not a newer one)
const QSESS=(()=>{try{return JSON.parse(sessionStorage.getItem('n1_qs'))||{}}catch(e){return{}}})();
function serS(){return S?JSON.stringify({...S,...(S.view!=null?{si:S.view,ans:(S.past||{})[S.view]||{},view:null}:{}),list:S.list.map(q=>q.id),wrong:S.wrong.map(w=>({q:w.q.id,k:w.k}))}):''}
function deserS(a){const o=JSON.parse(a);o.list=o.list.map(i=>QBY[i]).filter(Boolean);o.wrong=o.wrong.map(w=>({q:QBY[w.q],k:w.k})).filter(w=>w.q);return o}
function saveSess(){try{sessionStorage.setItem('n1_S',serS());sessionStorage.setItem('n1_qs',JSON.stringify(QSESS));sessionStorage.setItem('n1_SS',SS?JSON.stringify({...SS,view:null}):'');sessionStorage.setItem('n1_scr',JSON.stringify(SCR));sessionStorage.setItem('n1_decks',JSON.stringify(DECKS))}catch(e){}}
function loadSess(){try{const a=sessionStorage.getItem('n1_S');if(a)S=deserS(a)
  const b=sessionStorage.getItem('n1_SS');if(b)SS=JSON.parse(b)}catch(e){}}
function snap(){if(!cur)return;if(cur==='quiz/play'&&S&&S.sid){QSESS[NAV.k]=serS();const qk=Object.keys(QSESS);if(qk.length>20)delete QSESS[qk[0]]}const si=document.querySelector('#s');VS[cur]=Object.assign(VS[cur]||{},{q:si?si.value:'',y:window.scrollY});
  SCR[NAV.k]={y:window.scrollY,open:[...app.querySelectorAll('details')].map((d,i)=>d.open?i:-1).filter(i=>i>=0)};const ks=Object.keys(SCR);if(ks.length>200)delete SCR[ks[0]];saveSess()}
window.addEventListener('pagehide',snap);document.addEventListener('visibilitychange',()=>{if(document.hidden)snap()});
function resumeQuiz(){if(S.done)return results(false);const a=S.ans||{};showQ();for(const j in a){S.ans[j]=a[j];renderAnswered(+j,false)}}
function resumeStudy(){if(SS.graded){SS.i++;SS.graded=false;SS.shown=false}const sh=SS.shown;SS.shown=false;studyCard();if(sh&&SS.items[SS.i])reveal(SS.items[SS.i])}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#qend')&&confirm('End this quiz? Answers so far are saved.')){S=null;saveSess();replaceTo('quiz')}});
const TABS=[['home',ICONS.home,'Home'],['quiz',ICONS.quiz,'Quiz'],['vocab',ICONS.vocab,'Words'],['kanji',ICONS.kanji,'Kanji'],['progress',ICONS.progress,'Progress']];
const TITLES={home:'JLPT N1',quiz:'Quiz',vocab:'Words',kanji:'Kanji',kanjicards:'Kanji cards',similar:'Look-alike',progress:'Progress',tips:'読解 Tips',study:'Study',studyguide:'How to study',today:'Today',mistakes:'Mistakes',recall:'Recall',mock:'Mock exam',rq:'Review',search:'Search',gpairs:'Grammar pairs'};
function header(){const h=$('header'),root=(cur||'home').split('/')[0],showBack=NAV.d>0||root!=='home';
  h.innerHTML=`${showBack?`<button class="hb icon" id="hbk" aria-label="Back">${ICONS.back}</button>`:'<span class="hbsp"></span>'}<a href="#home" class="htl">${esc(TITLES[root]||'JLPT N1')}</a>
   <span class="hbr"><a class="hb icon" id="hsr" href="#search" aria-label="Search" title="Search"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></a><button class="hb icon" id="hs" aria-label="Settings" title="Settings">⚙</button></span>`;
  if($('#hbk'))$('#hbk').onclick=goBack;$('#hs').onclick=openSettings;
  const tabRoot=(root==='kanjicards'||root==='similar')?'kanji':(root==='tips'||root==='study'||root==='studyguide'||['today','mistakes','rq','search','gpairs'].includes(root))?'home':root;
  $('#tabs').innerHTML=TABS.map(([k,i,l])=>`<a href="#${k==='kanji'&&store.get('kanjiMode','grid')==='cards'?'kanjicards':k}" data-tab="${k}" class="tab${tabRoot===k?' on':''}" ${tabRoot===k?'aria-current="page"':''}><span class="ti">${i}</span><span>${l}</span></a>`).join('');
  $('#tabs').querySelectorAll('[data-tab]').forEach(a=>a.onclick=()=>{const t=a.dataset.tab;   // entering a tab fresh → new random order
    if(t==='vocab'){ORDER.vocab=null;delete VS.vocab}if(t==='kanji'){ORDER.kanji=null;delete VS.kanjicards;delete VS.kanji}
    if(location.hash===a.getAttribute('href')&&(t==='vocab'||t==='kanji'))setTimeout(rerender,0)});
}
const inQuiz=()=>S&&!S.done&&(cur||'').startsWith('quiz')&&document.querySelector('.choice');
let skip=false;
function route(){if(S&&S.view!=null){S.si=S.view;S.ans={...((S.past||{})[S.view]||{})};S.view=null}if(SS&&SS.view!=null)SS.view=null;const h=location.hash.slice(1)||'home';
  snap();const prev=NAV,st=history.state;
  if(st&&st.k!=null)NAV={k:st.k,d:st.d||0};else{NAV={k:++navCtr,d:cur?prev.d+1:0};history.replaceState(NAV,'');sessionStorage.setItem('n1_navk',navCtr)}
  const fresh=!!pending||!SCR[NAV.k];
  cur=h;if(h!=='home')store.set('last',h);header();applyFocus();document.documentElement.dataset.r=h.split('/')[0];if(audio)audio.pause();
  const [p,arg]=h.split('/');const a=arg&&decodeURIComponent(arg);
  if(p==='quiz'){if(a==='play'){if(pending){const f=pending;pending=null;if(f()===false)return history.back()}else if(S||QSESS[NAV.k]){const e=QSESS[NAV.k];if(e){try{const o=deserS(e);if(!S||o.sid!==S.sid)S=o}catch(_){}}resumeQuiz()}else{pending=null;return replaceTo('quiz')}}else{pending=null;quizSetup()}}else render(p,a);
  const sv=fresh?null:SCR[NAV.k];if(sv&&sv.open){const ds=app.querySelectorAll('details');sv.open.forEach(i=>{if(ds[i])ds[i].open=true})}
  const y=sv?sv.y:(p==='quiz'||p==='study'?0:(VS[h]||{}).y||0);window.scrollTo(0,y);requestAnimationFrame(()=>window.scrollTo(0,y));saveSess();
}
function render(p,a){if(p==='vocab')deck('vocab',a);else if(p==='kanji'){if(a)kanjiDetail(a);else kanjiGrid()}else if(p==='kanjicards')deck('kanji',a);else if(p==='similar'){if(a)simDetail(a);else similarView()}else if(p==='tips')tipsView();else if(p==='study'){if(a){if(SS&&SS.mode===a&&SS.items&&SS.i<SS.items.length)resumeStudy();else studyStart(a)}else studyHome()}else if(p==='studyguide')studyGuide();else if(p==='progress')progress();else if(p==='mistakes')mistakesView();else if(p==='recall')recallView();else if(p==='mock'){if(a==='play')mockPlay();else if(a==='res')mockRes();else mockView()}else if(p==='rq')reviewQ(a);else if(p==='search')searchView();else if(p==='listen'){try{localStorage.removeItem('n1_listen')}catch(e){}replaceTo('home');return}else if(p==='gpairs')gpairsView(a);else if(p==='today')todayView();else home()}
function rerender(){const y=window.scrollY;
  if(S&&!S.done&&document.querySelector('.choice')){const a=S.ans||{};showQ();for(const j in a){S.ans[j]=a[j];renderAnswered(+j,false)}}
  else if(S&&S.done)results(false);
  else if((cur||'').startsWith('study/')&&SS&&SS.items[SS.i]){const sh=SS.shown,gr=SS.graded;SS.shown=false;studyCard();if(sh&&!gr)reveal(SS.items[SS.i])}
  else{const si=document.querySelector('#s');VS[cur]=Object.assign(VS[cur]||{},{q:si?si.value:'',y});const [p,arg]=(cur||'home').split('/');if(p==='quiz')quizSetup();else render(p,arg&&decodeURIComponent(arg))}
  window.scrollTo(0,y)}
/* ---------- Study (v33): spaced repetition + active recall ---------- */
const DAYMS=864e5,dn=()=>{const t=new Date();return Math.floor((t.getTime()-t.getTimezoneOffset()*6e4)/DAYMS)};
const KSET=new Set(K.map(x=>x.kanji)),KBY=Object.fromEntries(K.map(x=>[x.kanji,x])),VBY=Object.fromEntries(V.map(x=>[x.id,x])),VW={};V.forEach(v=>{if(!VW[v.word])VW[v.word]=v});
const kOfW=v=>(v.kanji||[]).filter(c=>KSET.has(c));
const hira=s=>String(s||'').replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-96)).replace(/[\s　・.]/g,'');
const say=window.__say=t=>{try{if(!window.speechSynthesis||!t)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=.9;speechSynthesis.speak(u)}catch(e){}};
// v94: kanji back enhancements — key word, stroke order (KanjiVG), tappable parts, look-alike strip, progress, listen
function kHead(x){const v=sampleV(x.kanji);
  return `<div class="khead"><button type="button" class="kbig kstroke ja" data-k="${esc(x.kanji)}" aria-label="Play stroke order for ${esc(x.kanji)}" title="Tap to see stroke order">${esc(x.kanji)}</button><div><div class="kmean">${esc(x.meaning_en)}</div>
   ${v?`<div class="kkw"><a href="#vocab/${encodeURIComponent(v.word)}" class="ja">${esc(v.word)}</a> <span class="ja mut">${esc(v.reading)}</span> <span class="mut">${esc(v.meaning_en.split(';')[0])}</span></div>`:''}
   <div class="kbrow">${kBadges(x)}<button type="button" class="klisten" data-k="${esc(x.kanji)}" aria-label="Listen to readings">🔈</button></div></div></div>`}
function kProg(c){const e=srsDB()['k'+c],t=dn(),out=[];
  if(e){out.push(`Seen ${e.seen||0}×`);const d=(e.d||t)-t;out.push(d<=0?'review due now':`next review in ${ivLabel(d)}`)}
  const ms=store.get('missed',[]).filter(id=>{const q=QBY&&QBY[id];return q&&((q.answer_word||'')+(q.complete_sentence||'')).includes(c)}).slice(0,3);
  if(ms.length)out.push('missed in '+ms.map(id=>`<a href="#rq/${id}">Q${id}</a>`).join(', '));
  return out.length?out.join(' · '):'Not studied yet'}
function kExtra(x){const c=x.kanji,gs=simOf(c);
  const strip=gs.length?`<div class="klk"><span class="lbl">Look-alike</span><div class="klkr">${gs.flatMap(g=>g.members).filter((m,i,a)=>a.findIndex(y=>y.kanji===m.kanji)===i).map(m=>{const inK=KBY[m.kanji],cur=m.kanji===c;const dif=(m.diff_by||'').split(' ')[0];
    const body=`<b class="ja">${esc(m.kanji)}</b><small class="ja dp">${esc(dif)}</small>`;return cur?`<span class="klm cur">${body}</span>`:inK?`<a class="klm" href="#kanji/${encodeURIComponent(m.kanji)}">${body}</a>`:`<span class="klm">${body}</span>`}).join('')}</div></div>`:'';
  return `<p class="kprog">${kProg(c)}</p>${strip}`}
const KVG={};
function kvgLoad(c){const h=c.codePointAt(0).toString(16).padStart(5,'0');if(!KVG[c])KVG[c]=fetch('kvg/'+h+'.txt').then(r=>{if(!r.ok)throw 0;return r.text()}).then(t=>t.split('\n').filter(Boolean)).catch(()=>{delete KVG[c];return null});return KVG[c]}
let KCOMP=null;const kcompLoad=()=>KCOMP||(KCOMP=fetch('kvg/comp.json').then(r=>r.json()).catch(()=>{KCOMP=null;return {}}));
async function playStroke(b){const c=b.dataset.k,ds=await kvgLoad(c);if(!ds){b.classList.add('nokvg');setTimeout(()=>b.classList.remove('nokvg'),600);return}
  const red=matchMedia('(prefers-reduced-motion: reduce)').matches;
  b.innerHTML=`<svg viewBox="0 0 109 109" class="kvgsvg" aria-hidden="true">${ds.map(d=>`<path d="${d}" class="ghost"/>`).join('')}${ds.map((d,i)=>`<path d="${d}" class="ink" data-i="${i}"/>`).join('')}</svg>`;b.classList.add('drawing');
  const ps=[...b.querySelectorAll('path.ink')];let t=0;
  ps.forEach(p=>{const L=p.getTotalLength();p.style.strokeDasharray=L;p.style.strokeDashoffset=0;const dur=red?0:Math.max(250,L/90*1000);
    if(!red&&p.animate){p.animate([{strokeDashoffset:L},{strokeDashoffset:0}],{duration:dur,delay:t,fill:'backwards',easing:'linear'});t+=dur+80}});t/=1000;
  clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('drawing'),t*1000+50)}
function partsSheet(p){kcompLoad().then(cm=>{const hits=K.filter(k=>k.kanji!==p&&(cm[k.kanji]||[]).includes(p)).slice(0,60);
  const el=document.createElement('div');el.className='psheet';el.setAttribute('role','dialog');el.setAttribute('aria-label','Kanji containing '+p);
  el.innerHTML=`<div class="psbg"></div><div class="pspanel"><div class="psh"><b><span class="ja">${esc(p)}</span> appears in</b><button class="hb icon psx" aria-label="Close">✕</button></div>${hits.length?`<div class="psl">${hits.map(k=>`<a href="#kanji/${encodeURIComponent(k.kanji)}" class="psk"><b class="ja">${esc(k.kanji)}</b><small>${esc(k.meaning_en.split(';')[0])}</small></a>`).join('')}</div>`:'<p class="mut sm">No bank kanji use this part.</p>'}</div>`;
  document.body.appendChild(el);const raw=()=>el.remove();ovOpen(raw);const close=()=>{raw();ovDrop()};el.querySelector('.psbg').onclick=close;el.querySelector('.psx').onclick=close;
  el.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setTimeout(raw,0)))})}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('.kstroke,.klisten,.mpc[data-p]');if(!t)return;e.preventDefault();e.stopPropagation();
  if(t.classList.contains('kstroke'))return playStroke(t);
  if(t.classList.contains('klisten')){const x=KBY[t.dataset.k];if(!x)return;const v=sampleV(x.kanji);const kun=(x.kunyomi||[]).map(r=>r.replace(/[.\-]/g,''));
    window.__say([x.kanji,x.onyomi.length?'音読み、'+x.onyomi.join('、'):'',kun.length?'訓読み、'+kun.join('、'):'',v?v.word:''].filter(Boolean).join('。'));return}
  const p=t.dataset.p,mn=t.closest('.mnemo'),own=mn&&mn.dataset.c;if(KBY[p]&&p!==own){location.hash='kanji/'+encodeURIComponent(p);return}partsSheet(p)},true);
document.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('.kstroke,.klisten,.mpc[data-p]'))e.stopPropagation()},true);
const srsDB=()=>store.get('srs',{}),srsCfg=()=>{const c=store.get('srsCfg',{});return {ss:[10,20,30,50].includes(c.ss)?c.ss:20}};
const simGroup=c=>SIM.find(g=>g.kanji.includes(c)&&g.kanji.length>=2);
const sampleV=c=>V.find(v=>(v.kanji||[]).includes(c)&&v.word.length>1)||V.find(v=>(v.kanji||[]).includes(c));
function sched(st,g){st=Object.assign({ef:2.5,iv:0,reps:0,lap:0,seen:0},st||{});const t=dn();let iv;
  if(g===1){if(st.reps)st.lap++;st.ef=Math.max(1.3,st.ef-.2);iv=0}
  else if(st.iv<1)iv={2:1,3:1,4:3}[g];
  else{const b=st.iv;iv=g===2?Math.max(b+1,Math.round(b*1.2)):g===3?Math.max(b+2,Math.round(b*st.ef)):Math.max(b+3,Math.round(b*st.ef*1.3))}
  if(g===2)st.ef=Math.max(1.3,st.ef-.15);if(g===4)st.ef=Math.min(2.8,st.ef+.15);
  if(g>1)st.reps++;st.seen++;st.iv=Math.min(3650,iv);st.d=t+st.iv;st.last=t;return st}
// v90: grade from Cards view into the same SRS store Study uses (Again=1, Unsure=2, Know=3)
function cardGrade(key,g){const db=srsDB(),was=db[key];db[key]=sched(was,g);store.set('srs',db);const d=dn();
  if(!was){const n=store.get('srsNew',{});n[d]=n[d]||{w:0,k:0};n[d][key[0]]++;for(const k in n)if(+k<d-30)delete n[k];store.set('srsNew',n);if(key[0]==='w')store.set('srsPri',store.get('srsPri',[]).filter(k=>k!==key))}
  const lg=store.get('srsLog',{});lg[d]=lg[d]||{r:0,ok:0,n:0};if(was&&was.iv>=1){lg[d].r++;if(g>1)lg[d].ok++}else lg[d].n++;store.set('srsLog',lg);logActivity()}
// known = SRS interval >= 7 days (or Words marked Know with no SRS entry); learning = in SRS below that, or marked Don't know; new = never graded
function cardProg(list,isV,lv){const db=srsDB(),st=isV?store.get('vocabStatus',{}):{};let kn=0,le=0,nw=0;
  for(const x of list){const e=db[isV?'w'+x.id:'k'+x.kanji];if(e){if(e.iv>=7)kn++;else le++}else if(isV&&st[x.id]==='know')kn++;else if(isV&&st[x.id]==='dont')le++;else nw++}
  const lab=isV?'Words':(lv&&lv!=='all'?String(lv).toUpperCase():'All');
  return `<span class="cpl">${esc(lab)}:</span> <b>${kn}</b> known · <b>${le}</b> learning · <b>${nw}</b> new`}
const ivLabel=d=>d<1?'<10m':d<31?d+'d':d<365?(d/30).toFixed(d<60?1:0)+'mo':(d/365).toFixed(1)+'y';
function newToday(){const n=store.get('srsNew',{})[dn()]||{w:0,k:0};return n}
function buildQueue(mode){const db=srsDB(),t=dn(),cfg=srsCfg(),nt=newToday(),wantW=mode!=='kanji',wantK=mode!=='words';
  const due=Object.keys(db).filter(k=>db[k].d<=t&&(k[0]==='w'?wantW:wantK)&&(k[0]==='w'?VBY[+k.slice(1)]:KBY[k.slice(1)])).sort((a,b)=>db[a].d-db[b].d);
  const pri=store.get('srsPri',[]).filter(k=>!db[k]&&VBY[+k.slice(1)]),priSet=new Set(pri);
  const nw=wantW?[...pri.slice(0,15),...V.map(v=>'w'+v.id).filter(k=>!db[k]&&!priSet.has(k))]:[];
  const kWanted=[];if(wantK){const seen=new Set();for(const k of [...due,...nw])if(k[0]==='w')for(const c of kOfW(VBY[+k.slice(1)]))if(!db['k'+c]&&!seen.has(c)){seen.add(c);kWanted.push('k'+c)}
    for(const v of V)for(const c of kOfW(v))if(!db['k'+c]&&!seen.has(c)){seen.add(c);kWanted.push('k'+c)}}
  const nk=kWanted;
  // interleave: each word followed by its (queued) kanji
  const weave=(words,kan)=>{const pool=new Set(kan),out=[];let n=0;for(const w of words){out.push(w);for(const c of kOfW(VBY[+w.slice(1)]))if(pool.has('k'+c)){pool.delete('k'+c);out.push('k'+c)}
     if(++n%3===0&&pool.size&&mode==='mixed'){const f=[...pool][0];pool.delete(f);out.push(f)}}return out.concat([...pool])};
  const dueW=due.filter(k=>k[0]==='w'),dueK=due.filter(k=>k[0]==='k');
  const batch=weave(nw,nk).slice(0,cfg.ss),bw=batch.filter(k=>k[0]==='w').length;
  return {items:[...weave(dueW,dueK),...batch],due:due.length,nw:bw,nk:batch.length-bw,avail:nw.length+nk.length,pri:Math.min(15,pri.length)}}
// v100: no 'type the reading' card when the headword has no kanji (e.g. あせる)
const hasKanji=w=>/[\u3400-\u9fff\uf900-\ufaff々]/.test(w||'');
function wordTypes(v){const t=hasKanji(v.word)?['wr','mw','ty']:['wr','mw'];if(v.example_ja&&v.example_ja.includes(v.word))t.splice(2,0,'cz');return t}
window.__n1test={hasKanji,wordTypes:v=>wordTypes(v),words:()=>V,force:(w,t)=>{const v=V.find(x=>x.word===w);if(!SS||!v)return false;SS.items[SS.i]={key:'w'+v.id,type:t};SS.shown=false;SS.known=null;SS.graded=false;studyCard();return true}};
function kanjiTypes(c){const t=['km'];if(sampleV(c))t.push('kw');if(simGroup(c)&&sampleV(c))t.push('ks');return t}
function pickType(key,st){const ts=key[0]==='w'?wordTypes(VBY[+key.slice(1)]):kanjiTypes(key.slice(1));if(!st||!st.seen)return ts[0];return ts[(st.seen+key.length)%ts.length]}
let SS=null;
function studyHome(){const q=buildQueue('mixed'),qw=buildQueue('words'),qk=buildQueue('kanji'),cfg=srsCfg();
  app.innerHTML=`<div class="ph"><h1 class="pt">Study 学習</h1><a class="btn sm ghost" href="#studyguide">How to study</a></div>
  ${todayCard(q,false)}
  <div class="card stmodes"><button class="btn primary full" id="sm">▶ Mixed session <small>${q.items.length} cards</small></button>
   <div class="two"><button class="btn" id="sw">語 Words only <small>${qw.items.length}</small></button><button class="btn" id="sk">漢 Kanji only <small>${qk.items.length}</small></button></div></div>
  <div class="card"><h3>Session size</h3><p class="mut sm">New cards per session — no daily limit. When a session ends, tap “Keep going” for the next batch.</p><div class="lim ssz">${[10,20,30,50].map(n=>`<button class="btn sm${cfg.ss===n?' primary':' ghost'}" data-n="${n}">${n}</button>`).join('')}</div>
   <p class="mut sm">Reviews always come first and are never capped. Words you miss in the quiz are added as priority cards.</p></div>`;
  $('#sm').onclick=()=>location.hash='study/mixed';$('#sw').onclick=()=>location.hash='study/words';$('#sk').onclick=()=>location.hash='study/kanji';
  app.querySelectorAll('.ssz button').forEach(b=>b.onclick=()=>{store.set('srsCfg',{ss:+b.dataset.n});studyHome()})}
function todayCard(q,cta=true){const mins=Math.max(1,Math.ceil((q.due*10+(q.nw+q.nk)*25)/60)),sk=streak();
  return `<div class="card today"><div class="td-h"><span class="td-k">今日</span><div><b>Today's study</b><small class="mut">spaced repetition · active recall</small></div></div>
   <div class="td-n"><div><b>${q.due}</b><small>due</small></div><div><b>${q.avail}</b><small>new avail.</small></div><div><b>${sk}🔥</b><small>streak</small></div><div><b>~${q.items.length?mins:0}</b><small>min</small></div></div>
   ${q.pri?`<p class="sm td-p">🎯 ${q.pri} word${q.pri>1?'s':''} from quiz mistakes queued</p>`:''}
   ${cta?`<div class="td-a"><a class="btn primary" id="tdgo" href="#study/mixed">${q.items.length?'▶ Start':'✓ All done — study more'}</a><a class="btn ghost" href="#study">Options</a></div>`:''}</div>`}
function studyStart(mode){const q=buildQueue(mode);const tn=store.get('swTips',0);if(tn<3)store.set('swTips',tn+1);SS={tip:tn<3,mode,items:mode==='due'?q.items.slice(0,q.due):mode==='new'?q.items.slice(q.due):q.items.slice(),i:0,done:0,again:{},res:{1:0,2:0,3:0,4:0}};if(!SS.items.length)return studyDone();studyCard()}
function studyDone(){const r=SS?SS.res:{1:0,2:0,3:0,4:0},n=r[1]+r[2]+r[3]+r[4];
  app.innerHTML=`<div class="card sdone"><div class="dseal" aria-hidden="true">${n?'済':'<span class="dck">✓</span>'}</div><div class="dpill">${n?'お疲れさま':'今日は完了'}</div><h2>${n?`Session complete · ${n} cards`:'Nothing due right now'}</h2>
   ${n?`<p class="mut">Again ${r[1]} · Hard ${r[2]} · Good ${r[3]} · Easy ${r[4]}</p>`:'<p class="mut">Every card has been seen and no reviews are due. Come back later for reviews.</p>'}
   ${(()=>{const nq=buildQueue(SS?SS.mode:'mixed');return nq.items.length?`<p class="sm">${nq.due?nq.due+' due · ':''}${nq.avail} new cards still available</p><div class="td-a"><button class="btn primary" id="kgo">Keep going → next ${Math.min(nq.items.length,nq.due+srsCfg().ss)}</button></div>`:''})()}
   ${tdAfterStudy(SS&&SS.mode,n)}<div class="td-a"><a class="btn${n?'':' primary'}" href="#home">Home</a><a class="btn" href="#study">Study options</a></div></div>`;
  const kg=$('#kgo');if(kg)kg.onclick=()=>studyStart(SS?SS.mode:'mixed')}
function pkHint(){return store.get('peekSeen',0)?'':'<p class="pkh mut sm">Tap card to peek</p>'}
function pkWord(v,mean){const hk=hasKanji(v.word),r=hk?`<span class="ja">${esc(v.reading)}</span>`:'',m=mean?`<span class="pkm">${hk?' · ':''}${esc(v.meaning_en)}</span>`:'';return `${pkHint()}<div class="speek" id="pk" hidden aria-live="polite"><div class="pkw ja">${hk&&v.word_ruby?v.word_ruby:esc(v.word)}</div>${r||m?`<p class="pkr">${r}${m}</p>`:''}</div>`}
function frontHTML(it){const k=it.key,isW=k[0]==='w',t=it.type;
  if(isW){const v=VBY[+k.slice(1)];
    if(t==='wr')return `<p class="sp">${hasKanji(v.word)?'Read it — recall the <b>reading</b> and <b>meaning</b>':'Recall the <b>meaning</b>'}</p><div class="sbig ja">${esc(v.word)}</div>${pkHint()}<div class="speek" id="pk" hidden aria-live="polite"><p class="pkr"><span class="ja">${esc(v.reading)}</span><span class="pkm"> · ${esc(v.meaning_en)}</span></p>${v.example_ja?`<p class="pkx ja">${furi&&v.example_ja_ruby?v.example_ja_ruby:esc(v.example_ja)}</p><p class="pke mut sm">${esc(v.example_en||'')}</p>`:''}</div>`;
    if(t==='mw')return `<p class="sp">Recall the <b>Japanese word</b></p><div class="smean">${esc(v.meaning_en)}</div><p class="mut sm">${esc(v.part_of_speech||'')}</p>${pkWord(v,0)}`;
    if(t==='cz')return `<p class="sp">Fill the blank — recall the <b>word</b></p><div class="scloze ja">${esc(v.example_ja).replace(esc(v.word),'<b class="blank">＿＿＿</b>')}</div><p class="mut sm">${esc(v.example_en)}</p>${pkWord(v,1)}`;
    return `<p class="sp">Type the <b>reading</b> in kana</p><div class="sbig ja">${esc(v.word)}</div><div class="tyw"><input id="ty" lang="ja" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ひらがなで…"><button class="btn primary" id="tyc">Check</button></div>`}
  const c=k.slice(1),x=KBY[c],sv=sampleV(c);
  if(t==='km')return `<p class="sp">Recall the <b>meaning</b> and <b>on/kun</b> readings</p><div class="sbig kj">${esc(c)}</div>${pkHint()}<div class="speek kpeek" id="pk" hidden aria-live="polite"><p class="pkr"><span class="pkm">${esc(x.meaning_en)}</span></p><p class="pkk">${x.onyomi.length?onHTML(x.onyomi,1):''} ${x.kunyomi.length?kunHTML(x.kunyomi,1):''}</p></div>`;
  if(t==='kw'){const v=V.find(w=>w.word===sv.word)||sv;  // v57: kanji-card peek
    return `<p class="sp">Read this word — focus on <b>${esc(c)}</b></p><div class="sbig ja">${esc(sv.word).replace(esc(c),`<span class="kh">${esc(c)}</span>`)}</div>${pkHint()}<div class="speek kpeek" id="pk" hidden aria-live="polite"><p class="pkr"><span class="ja">${esc(v.reading||sv.reading||'')}</span><span class="pkm"> · ${esc(v.meaning_en||sv.meaning_en||'')}</span></p><p class="pkk"><b class="ja">${esc(c)}</b> ${x.onyomi.length?onHTML(x.onyomi,1):''} ${x.kunyomi.length?kunHTML(x.kunyomi,1):''}</p>${v.example_ja?`<p class="pkx ja">${furi&&v.example_ja_ruby?v.example_ja_ruby:esc(v.example_ja)}</p><p class="pke mut sm">${esc(v.example_en||'')}</p>`:''}</div>`}
  const g=simGroup(c);return `<p class="sp">Which kanji completes the word?</p><div class="sbig ja">${esc(sv.word).replace(esc(c),'<span class="kq">◯</span>')}</div><p class="mut">${esc(sv.reading)} · ${esc(sv.meaning_en)}</p>
   <div class="kopts">${shuffle(g.kanji).map(o=>`<button class="kopt" data-c="${esc(o)}">${esc(o)}</button>`).join('')}</div>`}
function mnemo(cs){return cs.map(c=>{const x=KBY[c];if(!x)return'';return `<li><b class="ja">${esc(c)}</b> ${esc((x.meaning_en||'').split(';')[0])} — radical <b class="ja">${esc(x.radical||'?')}</b>${x.stroke_count?` · ${x.stroke_count} strokes`:''}${x.onyomi&&x.onyomi.length?` · 音 ${esc(x.onyomi.join('、'))}`:''}</li>`}).join('')}
function backHTML(it){const k=it.key,isW=k[0]==='w',st=srsDB()[k]||{},leech=(st.lap||0)>=4,note=store.get('srsNote',{})[k]||'';
  const lb=leech?`<div class="leech"><b>🩹 Leech</b> — missed ${st.lap} times. ${(()=>{const cs=isW?kOfW(VBY[+k.slice(1)]):[k.slice(1)],withS=cs.filter(c=>KBY[c]&&KBY[c].mnemonic),rest=cs.filter(c=>!withS.includes(c));
   return (withS.length?'<p class="sm">Re-read the memory story above and picture it vividly.</p>':'')+(rest.length?`Break it down:<ul>${mnemo(rest)}</ul>`:'')})()}<textarea id="mn" rows="2" placeholder="Write your own mnemonic…">${esc(note)}</textarea></div>`:'';
  if(isW){const v=VBY[+k.slice(1)];
    const hk=hasKanji(v.word),sayW=`<button class="say" data-t="${esc(v.word)}" aria-label="Say word">🔊</button>`;
    return `<div class="sans"><div class="sbig ja">${hk&&v.word_ruby?(furi?v.word_ruby:esc(v.word)):esc(v.word)}${hk?'':' '+sayW}</div>${hk?`<div class="srd">${esc(v.reading)} ${sayW}</div>`:''}
     <div class="smean">${esc(v.meaning_en)}${v.part_of_speech?` <span class="spos">${esc(v.part_of_speech)}</span>`:''}</div>
     ${v.example_ja?`<div class="sex"><div class="ja">${furi&&v.example_ja_ruby?v.example_ja_ruby:esc(v.example_ja)} <button class="say" data-t="${esc(v.example_ja)}" aria-label="Say example">🔊</button></div><div class="mut sm">${esc(v.example_en)}</div></div>`:''}
     <div class="slinks">${kOfW(v).map(c=>`<a class="chip ja" href="#kanji/${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}<a class="sm" href="#vocab/${encodeURIComponent(v.word)}">Open card →</a></div>${kOfW(v).filter(c=>KBY[c].mnemonic).map(c=>storyHTML(c)).join('')}${lb}</div>`}
  const c=k.slice(1),x=KBY[c],g=simGroup(c),sw=V.filter(v=>(v.kanji||[]).includes(c)).slice(0,3);
  return `<div class="sans"><div class="sbig kj">${esc(c)}</div><div class="smean">${esc(x.meaning_en)}</div>
   <div class="kread"><span class="lbl rlon">音</span> ${onHTML(x.onyomi)}</div><div class="kread"><span class="lbl rlkun">訓</span> ${kunHTML(x.kunyomi)}</div>
   ${sw.length?`<ul class="ksw exl">${sw.map(v=>`<li><span class="ja">${furi&&v.word_ruby?v.word_ruby:esc(v.word)}</span> <span class="exr sm">${esc(v.reading)}</span> <span class="mut sm">${esc(v.meaning_en)}</span> <button class="say" data-t="${esc(v.word)}" aria-label="Say">🔊</button></li>`).join('')}</ul>`:''}
   ${x.mnemonic?storyHTML(c):g&&g.difference?`<p class="sdiff sm">👀 ${esc(g.difference)}</p>`:''}
   <div class="slinks"><a class="sm" href="#kanji/${encodeURIComponent(c)}">Open card →</a></div>${lb}</div>`}
function studyCard(){const it0=SS.items[SS.i];if(!it0)return studyDone();
  const it=typeof it0==='string'?{key:it0}:it0;SS.items[SS.i]=it;const db=srsDB();if(!it.type)it.type=pickType(it.key,db[it.key]);
  if(it.type==='ty'&&it.key[0]==='w'&&!hasKanji((VBY[+it.key.slice(1)]||{}).word))it.type=pickType(it.key,db[it.key]);
  const st=db[it.key],isNew=!st,tot=SS.items.length;
  app.innerHTML=`<div class="qtop">${fmBtns()}<div class="qprog"><div style="width:${SS.i*100/tot}%"></div></div><span class="mut sm">${SS.i+1}/${tot}</span>${aaBtn()}</div>
  <div class="scard" id="sc"><div class="stag"><span class="pill${it.key[0]==='w'?'':' sub'}">${it.key[0]==='w'?'語 word':'漢 kanji'}</span>${isNew?'<span class="pill n">new</span>':''}${st&&st.lap>=4?'<span class="pill red">leech</span>':''}${it.re?'<span class="pill sub">again</span>':''}</div>
   <div class="sfront">${frontHTML(it)}</div><div class="sback"></div></div>
  <div class="stbar" id="sbar"><div class="frow"><button class="btn knw" id="knw" type="button">I know this ✓</button><button class="btn primary" id="rv">Show answer</button></div></div>`;
  $('#knw').onclick=()=>knowIt(SS.items[SS.i]);
  if($('#pk'))$('#sc').addEventListener('click',e=>{if(SS.shown||e.target.closest('a,button,input,.say,rt'))return;togglePeek()});
  $('#rv').onclick=()=>reveal(it);
  const ty=$('#ty');if(ty){const v=VBY[+it.key.slice(1)],ok=()=>hira(ty.value)===hira(v.reading);let comp=false;ty.focus({preventScroll:true});
    ty.addEventListener('compositionstart',()=>comp=true);ty.addEventListener('compositionend',()=>{comp=false;if(ok())reveal(it,true)});
    ty.oninput=e=>{if(!comp&&!e.isComposing&&ok())reveal(it,true)};$('#tyc').onclick=()=>reveal(it,ok());
    ty.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();reveal(it,ok())}}}
  app.querySelectorAll('.kopt').forEach(b=>b.onclick=()=>{const right=b.dataset.c===it.key.slice(1);app.querySelectorAll('.kopt').forEach(o=>{o.disabled=true;if(o.dataset.c===it.key.slice(1))o.classList.add('ok');else if(o===b)o.classList.add('bad')});setTimeout(()=>reveal(it,right),reduced()?0:450)})}
// v50 peek (word→reading/meaning front): tap blank card area toggles reading + example; one history step; never grades
function peekRaw(){const p=document.getElementById('pk');if(p){p.hidden=true;const sc=document.getElementById('sc');if(sc)sc.classList.remove('peeking')}}
function closePeek(){const p=document.getElementById('pk');if(p&&!p.hidden){peekRaw();ovDrop()}}
function togglePeek(){const p=document.getElementById('pk');if(!p)return;if(p.hidden){p.hidden=false;store.set('peekSeen',1);$('#sc').classList.add('peeking');ovOpen(peekRaw)}else closePeek()}
function reveal(it,auto){if(SS.shown)return;closePeek();SS.shown=true;{const t=document.activeElement;if(t&&t.id==='ty')t.blur()}requestAnimationFrame(()=>{if(window.scrollY>0&&$('#sc'))window.scrollTo(0,0)});const db=srsDB(),st=db[it.key];
  const sc=$('#sc');sc.classList.add('revealed');sc.querySelector('.sback').innerHTML=(auto===true?'<p class="verd ok">✓ Correct</p>':auto===false?'<p class="verd bad">✕ Not quite</p>':'')+backHTML(it);
  const sug=auto===true?3:auto===false?1:0;
  $('#sbar').innerHTML=`<div class="grades">${[[1,'Again'],[2,'Hard'],[3,'Good'],[4,'Easy']].map(([g,l])=>`<button class="gbtn g${g}${sug===g?' sug':''}" data-g="${g}"><b>${l}</b><small>${ivLabel(sched(st,g).iv)}</small></button>`).join('')}</div>${SS.tip?'<p class="swtip" aria-hidden="true">Tip: swipe ← next (skip) · → previous card</p>':''}`;
  if(SS.tip){SS.tip=false;setTimeout(()=>{const t=document.querySelector('.swtip');if(t)t.classList.add('gone')},3500)}
  app.querySelectorAll('.gbtn').forEach(b=>b.onclick=()=>grade(it,+b.dataset.g));
  app.querySelectorAll('.say').forEach(b=>b.onclick=e=>{e.stopPropagation();say(b.dataset.t)});
  const mn=$('#mn');if(mn)mn.onchange=()=>{const n=store.get('srsNote',{});n[it.key]=mn.value;store.set('srsNote',n)};
  if(it.key[0]==='w'&&store.get('srsSpeak',false))say(VBY[+it.key.slice(1)].word);
}
function grade(it,g,stay){if(!SS||SS.graded)return;SS.graded=true;const db=srsDB(),was=db[it.key];db[it.key]=sched(was,g);store.set('srs',db);
  if(!was){const n=store.get('srsNew',{}),d=dn();n[d]=n[d]||{w:0,k:0};n[d][it.key[0]]++;for(const k in n)if(+k<d-30)delete n[k];store.set('srsNew',n);
    if(it.key[0]==='w')store.set('srsPri',store.get('srsPri',[]).filter(k=>k!==it.key))}
  const lg=store.get('srsLog',{}),d=dn();lg[d]=lg[d]||{r:0,ok:0,n:0};if(was&&was.iv>=1){lg[d].r++;if(g>1)lg[d].ok++}else lg[d].n++;store.set('srsLog',lg);
  logActivity();SS.res[g]++;it.g=g;
  if(g===1&&(SS.again[it.key]||0)<3){SS.again[it.key]=(SS.again[it.key]||0)+1;SS.items.splice(Math.min(SS.items.length,SS.i+5),0,{key:it.key,re:true})}
  if(stay)return;
  const sc=$('#sc');const next=()=>{SS.i++;SS.shown=false;SS.graded=false;SS.known=null;studyCard();window.scrollTo(0,0)};
  if(sc&&!reduced()){sc.classList.add(g===1?'out-l':'out-r');setTimeout(next,180)}else next()}
document.addEventListener('keydown',e=>{if(!SS||SS.view!=null||!(cur||'').startsWith('study/')||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(SS.known){if(e.key===' '||e.key==='Enter'||e.key==='ArrowRight'){e.preventDefault();knownNext()}else if(/^[1-3]$/.test(e.key)){const b=document.querySelector('.kg.g'+e.key);if(b)b.click()}return}
  if(!SS.shown&&(e.key===' '||e.key==='Enter')){e.preventDefault();const it=SS.items[SS.i];if(it&&!$('#ty')&&!$('.kopt'))reveal(it)}else if(SS.shown&&/^[1-4]$/.test(e.key))grade(SS.items[SS.i],+e.key);else if(!SS.shown&&/^[kK]$/.test(e.key)&&SS.items[SS.i])knowIt(SS.items[SS.i]);else if(!SS.shown&&/^[pP]$/.test(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&$('#pk')){e.preventDefault();togglePeek()}});
// v45: "I know this" — new card → first interval 21d (high ease) as a one-time check; review card → Easy. Undo restores everything.
function knowIt(it_){closePeek();return knowIt0(it_)}
// v100: "I know this" records the know grade, then shows the back (like Show answer) with Next →; Undo or change the grade from there.
function knowIt0(it){if(!SS||SS.graded||!it)return;const keys=['srs','srsNew','srsLog','srsPri'],snap={};keys.forEach(k=>snap[k]=localStorage.getItem('n1_'+k));
  const ss={i:SS.i,res:{...SS.res},again:{...SS.again},items:SS.items.slice()},was=srsDB()[it.key],isNew=!was||!(was.iv>=1);
  grade(it,4,true);if(isNew){const db=srsDB(),t=dn(),st=db[it.key];Object.assign(st,{ef:2.8,iv:21,d:t+21,known:1});db[it.key]=st;store.set('srs',db)}
  const restore=()=>{keys.forEach(k=>snap[k]==null?localStorage.removeItem('n1_'+k):localStorage.setItem('n1_'+k,snap[k]));delete it.g;Object.assign(SS,ss,{graded:false})};
  SS.known={it,restore,was};reveal(it);knownBar(it,isNew)}
function knownBar(it,isNew){const K=SS.known;if(!K)return;
  $('#sbar').innerHTML=`<div class="kbar"><p class="kmsg"><span>✓ Marked as known · ${isNew?'back in 21 days':'Easy'}</span><button type="button" class="klink" id="kundo">Undo</button></p>
  <div class="kchg" role="group" aria-label="Change grade"><span class="mut sm">Change:</span>${[[1,'Again'],[2,'Hard'],[3,'Good']].map(([g,l])=>`<button type="button" class="kg g${g}" data-g="${g}">${l} <small>${ivLabel(sched(K.was,g).iv)}</small></button>`).join('')}</div>
  <button type="button" class="btn primary knext" id="knext">Next →</button></div>`;
  $('#knext').onclick=knownNext;
  $('#kundo').onclick=()=>{K.restore();SS.known=null;SS.shown=false;studyCard()};
  app.querySelectorAll('.kg').forEach(b=>b.onclick=()=>{K.restore();SS.known=null;grade(it,+b.dataset.g)})}
function knownNext(){if(!SS||!SS.known)return;SS.known=null;const sc=$('#sc'),next=()=>{SS.i++;SS.shown=false;SS.graded=false;studyCard();window.scrollTo(0,0)};
  if(sc&&!reduced()){sc.classList.add('out-r');setTimeout(next,180)}else next()}
function toast(msg,act,fn){let t=document.querySelector('.toast');if(t)t.remove();t=document.createElement('div');t.className='toast';t.setAttribute('role','status');
  t.innerHTML=`<span>${esc(msg)}</span>${act?`<button type="button">${esc(act)}</button>`:''}`;document.body.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));
  const kill=()=>{t.classList.remove('show');setTimeout(()=>t.remove(),250)};const tm=setTimeout(kill,4000);if(act)t.querySelector('button').onclick=()=>{clearTimeout(tm);kill();fn()}}
function storyHTML(c){const x=KBY[c],m=x&&x.mnemonic;if(!m)return'';const own=store.get('mnemo',{})[c];
  return `<div class="mnemo" data-c="${esc(c)}"><div class="mh"><b>🧠 Memory story</b><button class="mned" aria-label="Write my own story" title="Write my own">✏️</button></div>
   <div class="mparts">${m.parts.map(p=>`<button type="button" class="mpc" data-p="${esc(p.part.split('@')[0])}" aria-label="Part ${esc(p.part)}: ${esc(p.meaning)}"><b class="ja">${esc(p.part)}</b><small>${esc(p.meaning)}</small></button>`).join('<i>+</i>')}${m.parts.length===1&&m.parts[0].part===c?'':`<i>→</i><span class="mpc res"><b class="ja">${esc(c)}</b><small>${esc((x.meaning_en||'').split(';')[0])}</small></span>`}</div>
   <p class="mstory">${own?`<span class="mown">your story</span> ${esc(own)}`:esc(m.story)}</p>
   ${m.reading_hook?`<p class="mhook">🔉 ${esc(m.reading_hook)}</p>`:''}${m.distinguish?`<p class="mdist">👀 ${esc(m.distinguish)}</p>`:''}
   <div class="medit" hidden><textarea rows="3" placeholder="Write a story that links the parts to the meaning…">${esc(own||'')}</textarea><div class="mbtns"><button class="btn sm primary msave">Save</button><button class="btn sm ghost mcancel">Cancel</button>${own?'<button class="btn sm ghost mreset">Reset to default</button>':''}</div></div></div>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.mned,.msave,.mcancel,.mreset');if(!b)return;const box=b.closest('.mnemo'),c=box.dataset.c,ed=box.querySelector('.medit');e.stopPropagation();
  if(b.classList.contains('mned')||b.classList.contains('mcancel')){if(ed.hidden){ed.hidden=false;ed.querySelector('textarea').focus();ovOpen(()=>{ed.hidden=true})}else{ed.hidden=true;ovDrop()}return}
  ovDrop();
  const o=store.get('mnemo',{});if(b.classList.contains('msave')){const t=ed.querySelector('textarea').value.trim();if(t)o[c]=t;else delete o[c]}else delete o[c];store.set('mnemo',o);
  const tmp=document.createElement('div');tmp.innerHTML=storyHTML(c);box.replaceWith(tmp.firstElementChild)});
function srsMiss(q){const add=[q.answer_word,...Object.values(q.choices||{})].map(w=>VW[w]).filter(Boolean).map(v=>'w'+v.id);if(!add.length)return;
  const p=store.get('srsPri',[]),db=srsDB();for(const k of add){if(db[k]){if(db[k].d>dn()+1){db[k].d=dn()+1}}else if(!p.includes(k))p.push(k)}store.set('srsPri',p.slice(-60));store.set('srs',db)}
function srsStatsHTML(){const db=srsDB(),t=dn(),ks=Object.keys(db),lg=store.get('srsLog',{});let r=0,ok=0;for(const d in lg)if(+d>t-30){r+=lg[d].r;ok+=lg[d].ok}
  const fc=[...Array(7)].map((_,i)=>ks.filter(k=>i===0?db[k].d<=t:db[k].d===t+i).length),mx=Math.max(5,...fc);
  const m=p=>ks.filter(k=>k[0]===p&&db[k].iv>=21).length,l=p=>ks.filter(k=>k[0]===p).length,leech=ks.filter(k=>(db[k].lap||0)>=4).length;
  return `<div class="card"><h3>Study (spaced repetition)</h3><div class="totals">${[['Retention 30d',r?pct(ok,r)+'%':'—'],['Words learning',`${l('w')}/${V.length}`],['Words mastered',m('w')],['Kanji learning',`${l('k')}/${K.length}`],['Kanji mastered',m('k')],['Leeches',leech]].map(([a,b])=>`<div class="tot"><b>${b}</b><span>${a}</span></div>`).join('')}</div>
   <h3 class="sm">Reviews due · next 7 days</h3><div class="chart">${fc.map((n,i)=>{const dd=new Date(Date.now()+i*DAYMS);return `<div class="bar-c"><span class="bv">${n||''}</span><div class="bar" style="height:${n?Math.max(6,n*100/mx):2}%"></div><span class="bl">${i?'日月火水木金土'[dd.getDay()]:'今'}</span></div>`}).join('')}</div>
   <p class="mut sm">Mastered = interval ≥ 21 days. Retention = reviews answered Hard/Good/Easy.</p>
   <div class="two"><button class="btn sm" id="bkx">⬇ Export backup</button><label class="btn sm">⬆ Import backup<input type="file" id="bki" accept="application/json,.json" hidden></label></div></div>`}
function wireBackup(){const x=$('#bkx');if(!x)return;x.onclick=()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('n1_'))o[k]=localStorage.getItem(k)}
   const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({app:'jlpt-n1-reviewer',v:APP_VERSION,at:new Date().toISOString(),data:o},null,1)],{type:'application/json'}));a.download=`n1-backup-${dayKey()}.json`;a.click()};
  $('#bki').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{const j=JSON.parse(t);if(!j.data)throw 0;if(!confirm('Replace your current progress with this backup?'))return;
   Object.keys(localStorage).filter(k=>k.startsWith('n1_')).forEach(k=>localStorage.removeItem(k));for(const k in j.data)if(k.startsWith('n1_'))localStorage.setItem(k,j.data[k]);location.reload()}).catch(()=>alert('That file is not a valid backup.'))}}
function studyGuide(){app.innerHTML=`<div class="ph"><h1 class="pt">How to study 学習法</h1></div>
 <div class="card guidec"><h3>Why this works</h3><p><b>Active recall</b> — trying to pull the answer out of memory <i>before</i> you see it strengthens memory far more than re-reading. Every card asks you to produce something: a reading, a meaning, a word, the right kanji.</p>
 <p><b>Spaced repetition</b> — each card comes back just as you're about to forget it. Good answers push it further out (1d → 3d → 8d → 3 weeks…); Again brings it back today. A few minutes a day beats hours of cramming.</p>
 <p><b>Variety</b> — the same word is tested in different ways (read it, write it from English, fill a blank, type the kana), and kanji are shown right after the words that use them, so knowledge connects instead of staying isolated.</p></div>
 <div class="card guidec"><h3>Daily routine · ~15 min</h3><ol><li><b>Reviews first</b> — clear everything due. Don't skip days; reviews pile up.</li><li><b>New cards</b> — no daily limit. They come in batches (session size, default 20); tap “Keep going” for more. Remember: every new card means reviews in the coming days, so add more only if your reviews stay under ~15 min.</li><li><b>Quiz mistakes</b> — words from questions you miss are queued automatically as priority cards.</li><li>Finish with a short quiz or one 読解 passage to see words in context.</li><li><b>Shortcuts</b> — swipe left = next (an unanswered card is skipped and comes back later, no grade), swipe right = look at the previous card (read-only); tap the empty part of the card front to peek at the hidden word, reading or meaning (tap again to hide; peeking never grades); on a keyboard, P peeks, Space shows the answer and 1–4 grade.</li></ol></div>
 <div class="card guidec"><h3>Grading honestly</h3><ul><li><b>Again</b> — you didn't recall it (or only after seeing it).</li><li><b>Hard</b> — recalled with real effort or partly wrong.</li><li><b>Good</b> — recalled after a moment's thought. Most answers.</li><li><b>Easy</b> — instant, effortless.</li></ul><p class="mut sm">Swipe right = Good, left = Again. Say the word out loud — 🔊 plays it.</p></div>
 <div class="card guidec"><h3>Tips</h3><ul><li>Say readings aloud and picture the kanji before revealing.</li><li>Cards missed 4+ times become <b>leeches</b>: read the kanji breakdown and write your own mnemonic in the box.</li><li>Look-alike kanji cards train you to spot the difference — study the 👀 note.</li><li>Back up your progress from Progress → Export backup now and then.</li></ul></div>
 <a class="btn primary full" href="#study/mixed">▶ Start today's session</a>`}

/* ===================== v73 features ===================== */
const loadJS=(src,key)=>new Promise((ok,no)=>{if(window[key])return ok(window[key]);const sc=document.createElement('script');sc.src=src;sc.onload=()=>ok(window[key]);sc.onerror=no;document.head.appendChild(sc)});
let gpP=null;const loadGP=()=>gpP||(gpP=loadJS('gpairs.js?v='+APP_VERSION.slice(1),'GPAIRS').catch(e=>{gpP=null;throw e}));
const secGlyph=q=>SEC_INFO[secOf(q)].glyph;
const qSnip=(q,n=46)=>{const t=secOf(q)==='読解'?q.question:(q.complete_sentence||q.question||'');return t.length>n?t.slice(0,n)+'…':t};

/* ---- Mistake notebook: n1_mist = {id:{n:misses,l:lastOk(0/1),s:okStreak,t:time}} ---- */
function mistDB(){let m=store.get('mist',null);if(!m){m={};store.get('missed',[]).forEach(id=>{if(QBY[id])m[id]={n:1,l:0,s:0,t:Date.now()}})}
  let ch=!store.get('mist',null);for(const id in m){const e=m[id];if(e.d==null){e.s=Math.min(e.s||0,2);e.d=dn();ch=true}}if(ch)store.set('mist',m);return m}
const mistDue=()=>{const m=mistDB(),t=dn();return Object.keys(m).filter(id=>QBY[id]&&m[id].d<=t).map(id=>QBY[id])};
function mistRec(q,ok){const m=mistDB(),e=m[q.id];
  if(ok){if(!e)return;e.l=1;e.t=Date.now();if(e.d<=dn()){e.s=(e.s||0)+1;if(e.s>=RIV.length){delete m[q.id];store.set('mist',m);store.set('missed',store.get('missed',[]).filter(x=>x!==q.id));toast('Mastered · removed from Mistakes');return}e.d=dn()+RIV[e.s]}}
  else m[q.id]={n:(e?e.n:0)+1,l:0,s:0,t:Date.now(),d:dn()+RIV[0]};store.set('mist',m)}
function mistRemove(id){const m=mistDB();delete m[id];store.set('mist',m);store.set('missed',store.get('missed',[]).filter(x=>x!==+id))}
function mistakesView(){const m=mistDB(),f=store.get('mistF','');
  const rows=Object.keys(m).map(id=>QBY[id]).filter(q=>q&&(!f||secOf(q)===f)).sort((a,b)=>m[b.id].t-m[a.id].t);
  const all=Object.keys(m).filter(id=>QBY[id]).length;
  app.innerHTML=`<div class="ph"><h1 class="pt">Mistakes 間違いノート</h1></div>
  <div class="mfil">${seg3('mf',[['','All'],...SECTIONS.map(s=>[s,SEC_INFO[s].glyph+' '+s])],f)}</div>
  ${(()=>{const t=dn(),due=rows.filter(q=>m[q.id].d<=t).length;return (due?`<button class="btn primary full" id="mdv">↺ Review due <small>${due}</small></button>`:'')+(rows.length?`<button class="btn ${due?'ghost':'primary'} full" id="mrv">Review all <small>${rows.length}</small></button>`:'')})()}
  ${(()=>{const a=rcAll().length,d=rcDue().length;return a?`<a class="hrow rcrow" href="#recall"><span>思</span><b>Recall cards</b><small class="mut">${d?d+' due · ':''}${a} scheduled</small><span class="chev">${ICONS.chev}</span></a>`:''})()}
  <p class="mut sm mhint">${all?`${all} question${all>1?'s':''} · reviewed after 1 · 3 · 7 days, then removed`:'No mistakes yet. Questions you answer wrong appear here.'}</p>
  <div class="mlist">${rows.map(q=>{const e=m[q.id];return `<div class="mrow"><a class="mra" href="#rq/${q.id}"><span class="mg ja">${secGlyph(q)}</span><span class="mtx"><span class="ja">${esc(qSnip(q))}</span><small class="mut">${esc(q.category)} · 正解 ${esc(q.answer_word)}</small></span>
    <span class="mst"><span class="${e.l?'t-ok':'t-bad'}">${e.l?'✓':'✕'}</span><small class="mut">${e.d<=dn()?'<b class="mdue">due</b>':'in '+(e.d-dn())+'d'} · ×${e.n}</small></span></a><button class="mrm" data-id="${q.id}" aria-label="Remove from notebook" title="Remove">✕</button></div>`}).join('')}</div>`;
  $('#mf').querySelectorAll('button').forEach(b=>b.onclick=()=>{store.set('mistF',b.dataset.v);mistakesView()});
  if($('#mdv'))$('#mdv').onclick=()=>{const o=store.get('quizOpts',{}),t=dn();nav('quiz/play',()=>start(shuffle(rows.filter(q=>m[q.id].d<=t)),{...o,autoplay:false},true))};
  if($('#mrv'))$('#mrv').onclick=()=>{const o=store.get('quizOpts',{});nav('quiz/play',()=>start(shuffle(rows),{...o,autoplay:false},true))};
  app.querySelectorAll('.mrm').forEach(b=>b.onclick=e=>{e.preventDefault();const id=b.dataset.id;mistRemove(id);mistakesView();toast('Removed from Mistakes','Undo',()=>{const m=mistDB();m[id]={n:1,l:0,s:0,t:Date.now(),d:dn()+1};store.set('mist',m);if(cur==='mistakes')mistakesView()})})}
// ---- v84 recall cards: a wrong choice schedules a mini meaning card for that distractor on the 1/3/7-day schedule
const rcDB=()=>store.get('rc',{});
const rcCard=id=>{const[qi,k]=String(id).split('_'),q=QBY[qi];return q&&q.rc&&q.rc[k]?{q,k,c:q.rc[k]}:null};
function rcAdd(q,k){if(!q.rc||!q.rc[k])return;const r=rcDB(),id=q.id+'_'+k,e=r[id];r[id]={s:0,d:dn()+RIV[0],n:(e?e.n:0)+1};store.set('rc',r)}
function rcDue(){const r=rcDB(),t=dn();return Object.keys(r).filter(id=>rcCard(id)&&r[id].d<=t)}
const rcAll=()=>Object.keys(rcDB()).filter(id=>rcCard(id));
function rcRec(id,ok){const r=rcDB(),e=r[id];if(!e)return;if(!ok){e.s=0;e.d=dn()+RIV[0];e.n=(e.n||0)+1}else if(e.d<=dn()){e.s=(e.s||0)+1;if(e.s>=RIV.length)delete r[id];else e.d=dn()+RIV[e.s]}store.set('rc',r)}
const RCS={};
function recallView(){let R_=RCS[NAV.k];if(!R_)R_=RCS[NAV.k]={q:shuffle(rcDue()),i:0,ok:0,a:null,o:null};
  const tot=R_.q.length,hd=`<div class="ph"><h1 class="pt">Recall 思い出す</h1>${tot&&R_.i<tot?`<span class="mut sm rcn">${R_.i+1} / ${tot}</span>`:''}</div>`;
  if(!tot){app.innerHTML=hd+`<div class="card center rce"><p>No recall cards due.</p><p class="mut sm">When you pick a wrong choice, a mini card for that word comes back after 1 · 3 · 7 days.</p>${rcAll().length?`<p class="mut sm">${rcAll().length} scheduled</p>`:''}</div>`;return}
  if(R_.i>=tot){app.innerHTML=hd+`<div class="card center rce"><p class="rcd">${R_.ok} / ${tot}</p><p class="mut sm">Correct cards move to the next step (1 → 3 → 7 days); missed ones start again tomorrow.</p><div class="row center"><a class="btn ghost" href="#mistakes">Mistakes</a><a class="btn primary" href="#home">Home</a></div></div>`;return}
  const id=R_.q[R_.i],x=rcCard(id);if(!x){R_.i++;return recallView()}const c=x.c,A=R_.a;
  if(!R_.o||R_.o.id!==id)R_.o={id,o:shuffle([c.m,...c.o])};
  app.innerHTML=hd+`<div class="card rcc"><p class="mut sm">What does this mean?</p><p class="rcw ja">${esc(c.w)}</p><p class="rcr">${A!=null&&c.r?esc(c.r):'&nbsp;'}</p>
  <div class="choices">${R_.o.o.map((m,i)=>`<button class="choice${A!=null?' dis'+(m===c.m?' ok':i===A?' bad':''):''}" data-i="${i}"><span class="cv">${esc(m)}</span></button>`).join('')}</div>
  ${A!=null?`<div class="rcx">${c.ex?`<div class="ja">${esc(c.ex)}</div><div class="mut sm">${esc(c.en)}</div>`:''}<a class="mut sm" href="#rq/${x.q.id}">From Q${x.q.id} ›</a></div><button class="btn primary big full" id="rcnx">${R_.i+1<tot?'Next →':'Finish'}</button>`:''}</div>`;
  if(A==null)app.querySelectorAll('.rcc .choice').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,ok=R_.o.o[i]===c.m;R_.a=i;if(ok)R_.ok++;rcRec(id,ok);recallView()});
  else $('#rcnx').onclick=()=>{R_.i++;R_.a=null;R_.o=null;recallView();window.scrollTo(0,0)}}
// ---- v85 mock exam: N1 言語知識・読解 proportions, time scaled from 110 min / 70 items, no feedback until the end
const MOCK_T=[['漢字読み',6,q=>q.category.startsWith('kanji reading')],['文脈規定',7,q=>/^(vocabulary|kanji \(|idioms|set phrases)/.test(q.category)],['言い換え',6,q=>q.category.startsWith('paraphrase')],['用法',6,q=>q.category.startsWith('usage')],
  ['文法形式',10,q=>q.category.startsWith('grammar')],['組み立て',5,q=>q.category.startsWith('sentence order')],['文章の文法',5,q=>q.category.startsWith('text grammar')],['内容理解',21,q=>q.category.startsWith('reading comprehension')],['統合理解',2,q=>q.category.startsWith('integrated')],['情報検索',2,q=>q.category.startsWith('information')]];
const MOCK_N=70,MSECS=['文字・語彙','文法','読解'];
let M=(()=>{try{return JSON.parse(sessionStorage.getItem('n1_mock'))}catch(e){return null}})(),MT=0;
const mSave=()=>sessionStorage.setItem('n1_mock',JSON.stringify(M));
function mockPick(full){const att=store.get('qAtt',{}),out=[],used=new Set();
  for(const[,n,f] of MOCK_T){const need=full?n:Math.max(1,Math.round(n/2)),gs=new Set(),units=[];
    for(const q of Q.filter(f)){if(used.has(q.id))continue;const g=q.passage_group;if(g){if(gs.has(g))continue;gs.add(g);units.push(Q.filter(x=>x.passage_group===g).sort((a,b)=>a.id-b.id))}else units.push([q])}
    let c=0;for(const u of units.map(u=>({u,a:Math.min(...u.map(q=>att[q.id]||0)),r:Math.random()})).sort((a,b)=>a.a-b.a||a.r-b.r)){if(c>=need)break;u.u.forEach(q=>used.add(q.id));out.push(...u.u);c+=u.u.length}}
  return out}
function mSteps(L){const st=[];for(let i=0;i<L.length;){const g=L[i].passage_group;let j=i+1;if(g)while(j<L.length&&L[j].passage_group===g)j++;st.push([i,j-i]);i=j}return st}
const mFmt=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function mockView(){clearInterval(MT);const H=store.get('mocks',[]);
  app.innerHTML=`<div class="ph"><h1 class="pt">Mock exam 模試</h1></div>
  ${M&&!M.done?`<a class="btn primary big full" href="#mock/play">▶ Resume mock · ${mFmt((M.end-Date.now())/1000)} left</a>`:''}
  <div class="card mkc"><p class="mut sm">言語知識（文字・語彙・文法）・読解 · N1 question-type proportions · no feedback until the end. 聴解 is not included.</p>
  <button class="mko" data-f="1"><b>Full mock</b><small>~${MOCK_N} questions · ${Math.round(110*MOCK_N/MOCK_N)} min</small></button>
  <button class="mko" data-f="0"><b>Mini mock</b><small>~${MOCK_T.reduce((a,[,n])=>a+Math.max(1,Math.round(n/2)),0)} questions · ~${Math.round(110*MOCK_T.reduce((a,[,n])=>a+Math.max(1,Math.round(n/2)),0)/MOCK_N)} min</small></button>
  <p class="mut sm">Time is scaled from the real 110 min for ~70 items, so passages may make it slightly longer.</p></div>
  ${H.length?`<h2 class="sec-t">History</h2><div class="card">${mockChart(H)}<div class="mkh">${H.slice(-6).reverse().map(h=>`<div class="mkhr"><span>${esc(h.d)}</span><span class="mut sm">${h.full?'Full':'Mini'}</span><b>${h.tot}<small>/120</small></b></div>`).join('')}</div></div>`:''}`;
  app.querySelectorAll('.mko').forEach(b=>b.onclick=()=>{if(M&&!M.done&&!confirm('Discard the unfinished mock?'))return;const full=b.dataset.f==='1',L=mockPick(full);
    M={full,ids:L.map(q=>q.id),ans:{},si:0,secs:Math.round(110*60*L.length/MOCK_N),done:false};M.end=Date.now()+M.secs*1000;mSave();location.hash='mock/play'})}
function mockChart(H){const h=H.slice(-12),W=300,Hh=120,bw=W/Math.max(h.length,6),pass=Math.round(120*100/180);
  return `<svg class="mkch" viewBox="0 0 ${W} ${Hh+18}" role="img" aria-label="Mock score history"><line x1="0" x2="${W}" y1="${Hh-Hh*pass/120}" y2="${Hh-Hh*pass/120}" class="mkpl"/><text x="${W-2}" y="${Hh-Hh*pass/120-3}" text-anchor="end" class="mkpt">pass pace ${pass}/120</text>
  ${h.map((x,i)=>`<rect x="${i*bw+bw*.2}" y="${Hh-Hh*x.tot/120}" width="${bw*.6}" height="${Hh*x.tot/120}" rx="3" class="mkb${x.tot>=pass?' ok':''}"/><text x="${i*bw+bw/2}" y="${Hh+13}" text-anchor="middle" class="mkpt">${x.tot}</text>`).join('')}</svg>`}
function mockPlay(){clearInterval(MT);if(!M)return replaceTo('mock');if(M.done)return replaceTo('mock/res');
  const L=M.ids.map(i=>QBY[i]),ST=mSteps(L),[st,n]=ST[M.si],qs=L.slice(st,st+n),q0=qs[0],na=Object.keys(M.ans).length;
  app.innerHTML=`<div class="qtop mkt"><span class="mktm" id="mtm">${mFmt((M.end-Date.now())/1000)}</span><div class="qprog"><div style="width:${na*100/L.length}%"></div></div><span class="mut sm">${M.si+1}/${ST.length}</span>${aaBtn()}</div>
  ${n>1?`<div class="card qcardq gpass"><p class="qmeta">${esc(secOf(q0))} · ${n} questions</p>${passageHTML(q0,true)}</div>`:''}
  ${qs.map((q,j)=>`<div class="gq"><div class="card qcardq"><p class="qmeta">Q${st+j+1} · ${esc(secOf(q))}</p>${n>1?'':passageHTML(q)}${questionHTML(q)}</div>
  <div class="choices${isLongQ(q)?' usage long':''}">${corder(q).map(k=>`<button class="choice${M.ans[q.id]===String(k)?' sel':''}" data-q="${q.id}" data-k="${esc(k)}" aria-pressed="${M.ans[q.id]===String(k)}"><span class="ck">${esc(dk(q,k))}</span><span class="cv">${choiceHTML(q,k,false)}</span></button>`).join('')}</div></div>`).join('')}
  <div class="nextbar mknav"><button class="btn ghost" id="mpv" ${M.si?'':'disabled'}>← Prev</button><button class="btn ghost" id="mfin">Finish</button><button class="btn primary" id="mnx">${M.si+1<ST.length?'Next →':'Review end'}</button></div>`;
  app.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const id=b.dataset.q;M.ans[id]=M.ans[id]===b.dataset.k?undefined:b.dataset.k;if(M.ans[id]===undefined)delete M.ans[id];mSave();
    app.querySelectorAll(`.choice[data-q="${id}"]`).forEach(c=>{const on=M.ans[id]===c.dataset.k;c.classList.toggle('sel',on);c.setAttribute('aria-pressed',on)});$('.qprog div').style.width=Object.keys(M.ans).length*100/L.length+'%'});
  $('#mpv').onclick=()=>{M.si--;mSave();mockPlay();window.scrollTo(0,0)};
  $('#mnx').onclick=()=>{if(M.si+1<ST.length){M.si++;mSave();mockPlay();window.scrollTo(0,0)}else $('#mfin').click()};
  $('#mfin').onclick=()=>{const left=L.length-Object.keys(M.ans).length;if(confirm(left?`${left} unanswered. Finish and score now?`:'Finish and score now?'))mockFinish()};
  const tick=()=>{const r=(M.end-Date.now())/1000,e=$('#mtm');if(!e||cur!=='mock/play'){clearInterval(MT);return}e.textContent=mFmt(r);e.classList.toggle('low',r<300);if(r<=0){clearInterval(MT);toast('Time is up');mockFinish()}};MT=setInterval(tick,1000)}
function mockFinish(){if(!M||M.done)return;clearInterval(MT);const L=M.ids.map(i=>QBY[i]),sc={};MSECS.forEach(s=>sc[s]={c:0,t:0});
  for(const q of L){const k=M.ans[q.id],ok=k===String(q.answer),s=sc[secOf(q)];s.t++;if(ok)s.c++;
    if(k!=null){const qa=store.get('qAtt',{});qa[q.id]=(qa[q.id]||0)+1;store.set('qAtt',qa);mistRec(q,ok);if(!ok){srsMiss(q);rcAdd(q,k)}}}
  const s60=s=>s.t?Math.round(60*s.c/s.t):0,lk=(sc['文字・語彙'].t+sc['文法'].t)?Math.round(60*(sc['文字・語彙'].c+sc['文法'].c)/(sc['文字・語彙'].t+sc['文法'].t)):0,rd=s60(sc['読解']);
  M.done=true;M.res={sc,lk,rd,tot:lk+rd,used:Math.round((M.secs*1000-(M.end-Date.now()))/60000)};mSave();
  const H=store.get('mocks',[]);H.push({d:dayKey(),full:M.full,v:s60(sc['文字・語彙']),g:s60(sc['文法']),r:rd,lk,rd,tot:lk+rd});store.set('mocks',H.slice(-50));logActivity();replaceTo('mock/res')}
function mockRes(){clearInterval(MT);if(!M||!M.done)return replaceTo('mock');const L=M.ids.map(i=>QBY[i]),R_=M.res,s60=s=>s.t?Math.round(60*s.c/s.t):0;
  const bar=(lab,v,sub)=>`<div class="mkr"><div class="mkrl"><b>${lab}</b><span class="mut sm">${sub}</span></div><div class="mkrb"><i style="width:${100*v/60}%" class="${v>=19?'ok':'bad'}"></i><s style="left:${100*19/60}%"></s></div><b class="mkrv">${v}<small>/60</small></b></div>`;
  const wrong=L.filter(q=>M.ans[q.id]!==String(q.answer));
  app.innerHTML=`<div class="ph"><h1 class="pt">Mock result 結果</h1><span class="mut sm">${M.full?'Full':'Mini'} · ${R_.used} min</span></div>
  <div class="card mkres"><p class="mkest">Estimated · scaled 0–60 from % correct</p>
  ${MSECS.map(s=>bar(s,s60(R_.sc[s]),`${R_.sc[s].c}/${R_.sc[s].t}`)).join('')}
  <hr class="mkhr0"><p class="mut sm">JLPT-style sections (estimated)</p>
  ${bar('言語知識',R_.lk,'文字・語彙・文法')}${bar('読解',R_.rd,'')}
  <div class="mktot"><b>${R_.tot}</b><span>/120 estimated</span></div>
  <p class="mut sm">Pass mark: each section ≥ 19 and total ≥ 100 / 180. 聴解 (0–60) isn't included here, so you'd need ${Math.max(19,100-R_.tot)}+ in listening${R_.tot+60<100?' (out of reach on this estimate)':''}. ${R_.lk>=19&&R_.rd>=19?'Both sections clear the 19 minimum.':'A section is below the 19 minimum.'}</p></div>
  <div class="row center"><a class="btn primary" href="#mock">Mock home</a><a class="btn ghost" href="#home">Home</a></div>
  ${wrong.length?`<h2 class="sec-t">Review (${wrong.length})</h2><div class="mlist">${wrong.map(q=>`<a class="mrow mra" href="#rq/${q.id}"><span class="mg ja">${secGlyph(q)}</span><span class="mtx"><span class="ja">${esc(qSnip(q))}</span><small class="mut">${M.ans[q.id]!=null?'Your answer '+esc(String(q.choices[M.ans[q.id]]).slice(0,20)):'Unanswered'} · 正解 ${esc(String(q.answer_word).slice(0,20))}</small></span></a>`).join('')}</div>`:''}`}
// review one question (answerable; teacher audio after answering). Uses a throw-away quiz state so a running quiz is untouched.
function reviewQ(id){const q=QBY[+id];if(!q){app.innerHTML='<div class="card">Question not found.</div>';return}
  const e=mistDB()[q.id];
  app.innerHTML=`<div class="qprog" hidden><div></div></div><div class="gq" id="gq0"><div class="card qcardq"><p class="qmeta">${esc(secOf(q))} · ${esc(q.category)} · review${e?` · missed ×${e.n}`:''}</p>${passageHTML(q,true)}${questionHTML(q)}</div>
  <div class="choices${isLongQ(q)?' usage long':''}">${Object.keys(q.choices).map(k=>`<button class="choice" data-k="${esc(k)}"><span class="ck">${esc(k)}</span><span class="cv">${choiceHTML(q,k,false)}</span></button>`).join('')}</div><div class="fbw"></div></div><div id="nxw"></div>
  <div class="rqbar">${e?`<button class="btn ghost" id="rqrm">Remove from Mistakes</button>`:''}<a class="btn ghost" href="#mistakes">Mistakes</a></div>`;
  const run=k=>{const keep=S;S={list:[q],steps:[[0,1]],si:0,i:0,ans:{0:k},perm:{},opts:{},wrong:[],score:0,past:{}};
    try{renderAnswered(0,true)}finally{S=keep}$('#nxw').innerHTML='';
    const ok=k===String(q.answer),st=store.get('stats',{answered:0,correct:0});st.answered++;if(ok)st.correct++;store.set('stats',st);logActivity();mistRec(q,ok);
    const rr=store.get('rqAns',{});rr[NAV.k]=k;const ks=Object.keys(rr);if(ks.length>30)delete rr[ks[0]];store.set('rqAns',rr)};
  app.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{if(!b.classList.contains('dis'))run(b.dataset.k)});
  const prev=store.get('rqAns',{})[NAV.k];if(prev!=null){const keep=S;S={list:[q],steps:[[0,1]],si:0,i:0,ans:{0:prev},perm:{},opts:{},wrong:[],score:0};try{renderAnswered(0,false)}finally{S=keep}$('#nxw').innerHTML=''}
  if($('#rqrm'))$('#rqrm').onclick=()=>{mistRemove(q.id);$('#rqrm').remove();toast('Removed from Mistakes')}}

/* ---- Today: reviews → quiz (10, 60% least-tried) → new cards ---- */
function tdState(){let t=store.get('today',null);if(!t||t.d!==dayKey())t={d:dayKey(),step:0,r:{rev:0,quiz:null,nw:0}};return t}
const tdSave=t=>store.set('today',t);
const TD_STEPS=[['Reviews','復習'],['Quiz','問題'],['New cards','新しい']];
function tdDots(step){return `<span class="tdots" aria-label="Step ${Math.min(step+1,3)} of 3">${[0,1,2].map(i=>`<i class="${i<step?'done':i===step?'on':''}"></i>`).join('')}</span>`}
function todayBtn(){const t=tdState(),q=buildQueue('mixed'),nw=q.items.length-q.due;
  const lbl=t.step>=3?'Today complete ✓':t.step===0?'Start today':'Continue today';
  return `<a class="btn primary todayb" href="#today"><span class="tdl"><b>▶ ${lbl}</b><small>${q.due} review${q.due===1?'':'s'} · 10 quiz · ${nw} new</small></span>${tdDots(t.step)}</a>`}
function todayView(){const t=tdState(),q=buildQueue('mixed'),nw=q.items.length-q.due;
  if(t.step===0&&q.due===0){t.step=1;tdSave(t)}
  const cnt=[`${q.due} due`,(()=>{const k=mistDue().length;return k?`10 questions · ${Math.min(k,10)} mistake${k>1?'s':''} due`:'10 questions'})(),`${nw} cards`],res=[t.r.rev?`${t.r.rev} reviewed`:'',t.r.quiz?`${t.r.quiz.s}/${t.r.quiz.n} correct`:'',t.r.nw?`${t.r.nw} learned`:''];
  const sum=t.step>=3;
  app.innerHTML=`<div class="ph"><h1 class="pt">Today 今日</h1>${tdDots(t.step)}</div>
  <div class="card tdsteps">${TD_STEPS.map(([en,ja],i)=>`<div class="tds${i<t.step?' done':i===t.step?' on':''}"><span class="tdn">${i<t.step?'✓':i+1}</span><span class="tdt"><b>${en}</b> <span class="mut ja">${ja}</span><small class="mut">${i<t.step?(res[i]||(i===0&&q.due===0?'none due':'skipped')):cnt[i]}</small></span></div>`).join('')}</div>
  ${sum?`<div class="card res tdsum"><h2>お疲れさま · Today's summary</h2><div class="totals">${[['Reviewed',t.r.rev],['Quiz',t.r.quiz?`${t.r.quiz.s}/${t.r.quiz.n}`:'—'],['New learned',t.r.nw],['Streak',streak()+'🔥']].map(([l,v])=>`<div class="tot"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    <div class="row center">${nw?`<button class="btn primary" id="tdk">Keep going · ${Math.min(nw,srsCfg().ss)} new</button>`:''}<a class="btn ghost" href="#home">Home</a></div></div>`
   :`<button class="btn primary big full" id="tdgo">${['▶ Start reviews','▶ Start quiz','▶ Start new cards'][t.step]}</button><button class="btn ghost full" id="tdskip">Skip this step</button>`}`;
  {const rn=rcDue().length;if(rn)app.insertAdjacentHTML('beforeend',`<a class="hrow rcrow" href="#recall"><span>思</span><b>Recall cards</b><small class="mut">${rn} due · 1 · 3 · 7 days</small><span class="chev">${ICONS.chev}</span></a>`)}
  const go=()=>{const t2=tdState();if(t2.step===0)location.hash='study/due';else if(t2.step===1){const o=store.get('quizOpts',{});nav('quiz/play',()=>{const md=shuffle(mistDue()).slice(0,10),ids=new Set(md.map(q=>q.id)),fill=md.length<10?roundPick(Q.filter(q=>!ids.has(q.id)),10-md.length,'all'):[];start([...md,...fill],{...o,shuffle:false,autoplay:false},false);S.today=1})}else location.hash='study/new'};
  if($('#tdgo'))$('#tdgo').onclick=go;
  if($('#tdskip'))$('#tdskip').onclick=()=>{const t2=tdState();t2.step++;tdSave(t2);todayView()};
  if($('#tdk'))$('#tdk').onclick=()=>{location.hash='study/new'}}
function tdAfterStudy(mode,n){if(mode!=='due'&&mode!=='new')return'';const t=tdState();
  if(SS&&!SS.tdRec){SS.tdRec=1;if(mode==='due'){t.r.rev+=n;if(t.step===0)t.step=1}else{t.r.nw+=n;if(t.step===2)t.step=3}tdSave(t)}
  return mode==='due'?`<div class="td-a"><a class="btn primary" href="#today">Next: Quiz →</a></div>`:`<div class="td-a"><a class="btn${t.step>=3?' primary':''}" href="#today">Today's summary →</a></div>`}
function tdAfterQuiz(){if(!S||!S.today)return'';const t=tdState();if(!S.tdRec){S.tdRec=1;t.r.quiz={s:S.score,n:S.list.length};if(t.step<=1)t.step=2;tdSave(t)}
  return `<div class="row center"><a class="btn primary" href="#today">Next: New cards →</a></div>`}

/* ---- Search ---- */
const KJ=/[\u3400-\u9fff々]/;
const stemQ=s=>{const t=s.replace(/[ぁ-ゖ]+$/,'');return KJ.test(t)?t:s};
let SIDX=null;
function sIdx(){if(SIDX)return SIDX;const n=x=>hira(String(x||'')).toLowerCase();
  SIDX={q:Q.map(q=>({q,t:n([q.complete_sentence,q.question,q.answer_word,q.target_word,...Object.values(q.choices)].join(' ')),r:n(q.answer_romaji),e:n(q.complete_sentence_en)})),
   v:V.map(v=>({v,t:n(v.word),r:n(v.reading),e:n(v.meaning_en)})),
   k:K.map(k=>({k,r:[...(k.onyomi||[]),...(k.kunyomi||[])].map(x=>n(x).replace(/[.\-]/g,'')),e:String(k.meaning_en||'').toLowerCase()}))};return SIDX}
function doSearch(raw){const q0=raw.trim();if(!q0)return null;const x=sIdx(),nq=hira(q0).toLowerCase(),st=stemQ(nq),lat=/^[a-z0-9 '\-]+$/i.test(q0),kana=/^[ぁ-ゖー]+$/.test(nq);
  const has=t=>t.includes(st);const out={};
  out.g=(window.GPAIRS||[]).flatMap(g=>g.patterns.filter(p=>{const pp=hira(p.p).replace(/[〜～]/g,'');return pp.includes(nq.replace(/[〜～]/g,''))||(nq.length>=2&&nq.includes(pp))||(lat&&p.en.toLowerCase().includes(nq))}).map(p=>({g,p})));
  out.v=x.v.filter(o=>has(o.t)||(kana&&o.r.includes(nq))||(lat&&o.e.includes(nq))).map(o=>o.v);
  out.k=[...new Set([...q0].filter(c=>KBY[c]))].map(c=>KBY[c]).concat(x.k.filter(o=>!q0.includes(o.k.kanji)&&((kana&&nq.length>=2&&o.r.some(r=>r===nq||(nq.length>=3&&r.startsWith(nq))))||(lat&&nq.length>=3&&o.e.includes(nq)))).map(o=>o.k));
  const ks=new Set([...q0].filter(c=>KJ.test(c)));out.s=SIM.filter(g=>g.kanji.some(c=>ks.has(c)));
  out.q=x.q.filter(o=>has(o.t)||(lat&&nq.length>=3&&(o.e.includes(nq)||o.r.includes(nq)))).map(o=>o.q);
  return out}
function searchView(){const st=VS[cur]||{};const EXP=new Set(st.exp||[]);
  app.innerHTML=`<div class="search sbx"><input type="search" id="s" placeholder="Kanji, word, reading or grammar (e.g. がてら)" value="${esc(st.q||'')}" autocomplete="off" lang="ja" enterkeyhint="search"></div><div id="sr"></div>`;
  const G=[['g','Grammar 文法',r=>`<a class="sres" href="#gpairs/${r.g.id}"><b class="ja">${esc(r.p.p)}</b><span class="mut sm">${esc(r.p.ja)} · ${esc(r.p.en)}</span></a>`],
   ['q','Questions 問題',q=>`<a class="sres" href="#rq/${q.id}"><span class="mg ja">${secGlyph(q)}</span><span><span class="ja">${esc(qSnip(q,40))}</span><small class="mut"> · ${esc(q.answer_word)}</small></span></a>`],
   ['v','Words 語',v=>`<a class="sres" href="#vocab/${encodeURIComponent(v.word)}"><b class="ja">${esc(v.word)}</b><span class="mut sm">${esc(v.reading)} · ${esc(v.meaning_en)}</span></a>`],
   ['k','Kanji 漢字',k=>`<a class="sres" href="#kanji/${encodeURIComponent(k.kanji)}"><b class="ja kbig">${esc(k.kanji)}</b><span class="mut sm">${esc((k.onyomi||[]).concat(k.kunyomi||[]).slice(0,4).join('・'))} · ${esc((k.meaning_en||'').split(';')[0])}</span></a>`],
   ['s','Look-alikes 似た漢字',g=>`<a class="sres" href="#similar/${g.id}"><b class="ja">${g.members.map(m=>esc(m.kanji)).join(' ')}</b><span class="mut sm">${esc(g.part_meaning||g.shared_label||'')}</span></a>`]];
  const draw=()=>{const v=$('#s').value,r=doSearch(v),el=$('#sr');if(!r){el.innerHTML='<p class="mut sm shint">Search kanji (控), words (控える / 控え), kana readings (ひかえる), English, or grammar patterns (がてら). Works offline.</p>';return}
    const tot=G.reduce((a,[k])=>a+r[k].length,0);
    el.innerHTML=tot?G.filter(([k])=>r[k].length).map(([k,t,f])=>{const L=r[k],sh=EXP.has(k)?L:L.slice(0,6);return `<section class="sgrp"><h3 class="sgh2">${t} <small class="mut">${L.length}</small></h3>${sh.map(f).join('')}${L.length>sh.length?`<button class="btn sm ghost smore" data-k="${k}">Show all ${L.length}</button>`:''}</section>`}).join(''):'<p class="mut">No results.</p>';
    el.querySelectorAll('.smore').forEach(b=>b.onclick=()=>{EXP.add(b.dataset.k);VS[cur]=Object.assign(VS[cur]||{},{exp:[...EXP]});draw()})};
  let tm;$('#s').oninput=()=>{clearTimeout(tm);tm=setTimeout(draw,90)};draw();
  loadGP().then(()=>{if(cur==='search')draw()}).catch(()=>{});
  if(!st.q)setTimeout(()=>{const i=$('#s');if(i)i.focus()},50)}

/* ---- Grammar look-alike pairs ---- */
const TW=(o,f)=>{const w=o[f+'_w'];return w?w[1]:esc(o[f])};
let GPJ=null;const gpSec=p=>document.getElementById('gp'+(cur||'').split('/')[1]+'-'+p);
function gpJump(p){const t=gpSec(p);if(t)t.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'})}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('#app a.gpa');if(!a)return;const g=a.getAttribute('href').split('/')[1];
  if((cur||'')==='gpairs/'+g){e.preventDefault();gpJump(a.dataset.gp)}else GPJ=a.dataset.gp});
function gpairsView(id){app.innerHTML='<p class="mut">Loading…</p>';loadGP().then(GP=>{if(!(cur||'').startsWith('gpairs'))return;
  if(id){const g=GP.find(x=>String(x.id)===String(id));if(!g){app.innerHTML='<div class="card">Group not found.</div>';return}
    app.innerHTML=`<div class="gpd"><div class="gph0"><h1 class="gpt ja">${TW(g,'title')}</h1><p class="gpsub">${esc(g.en)}</p>
     <nav class="gpk ja" aria-label="Patterns">${g.patterns.map(p=>`<a href="#gp${g.id}-${esc(p.p)}">${esc(p.p)}</a>`).join('<span class="gpdot" aria-hidden="true">·</span>')}</nav></div>
     ${g.patterns.map(p=>`<section class="gpp" id="gp${g.id}-${esc(p.p)}"><h2 class="gpn ja">${esc(p.p)}</h2><p class="gpf ja">${esc(p.form)}</p>
      <p class="gpm"><span class="ja">${TW(p,'ja')}</span><span class="gpe">${esc(p.en)}</span></p>
      <p class="gpu"><span class="gpl">Point</span><span class="ja">${TW(p,'nu')}</span></p>
      <div class="gpx"><div class="ja">${TW(p,'ex')}</div><div class="gpxe">${esc(p.exen)}</div></div>
      ${p.q.length?`<p class="gpq">Related: ${p.q.map(i=>`<a href="#rq/${i}">Q${i} ›</a>`).join(' ')}</p>`:''}</section>`).join('')}</div>`;
    if(GPJ){const p=GPJ;GPJ=null;setTimeout(()=>{const t=gpSec(p);if(t)t.scrollIntoView({block:'start'})},80)}
    app.querySelectorAll('.gpk a').forEach(a=>a.onclick=e=>{e.preventDefault();const t=document.getElementById(a.getAttribute('href').slice(1));if(t)t.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'})});
    return}
  const st=VS[cur]||{};
  app.innerHTML=`<div class="ph"><h1 class="pt">Grammar pairs 似た文法</h1></div><div class="search"><input type="search" id="s" placeholder="Search patterns…" value="${esc(st.q||'')}"><span class="mut sm" id="cnt"></span></div><div id="sl" class="sgrid"></div>`;
  const draw=()=>{const t=hira($('#s').value.trim()).toLowerCase();const f=GP.filter(g=>!t||hira([g.title,g.en,...g.patterns.flatMap(p=>[p.p,p.ja,p.en])].join(' ')).toLowerCase().includes(t));$('#cnt').textContent=`${f.length} groups`;
    $('#sl').innerHTML=f.map(g=>`<a class="stile gtile" href="#gpairs/${g.id}"><span class="stp ja gtp">${esc(g.patterns[0].p)}</span><span class="stm">${esc(g.title)}</span><span class="stk ja">${g.patterns.slice(1).map(p=>esc(p.p)).join('・')}</span></a>`).join('')};
  $('#s').oninput=draw;draw();const y=(SCR[NAV.k]||{}).y;if(y)window.scrollTo(0,y)}).catch(()=>{app.innerHTML='<div class="card">Could not load grammar pairs (offline?).</div>'})}

/* ---- Offline audio (service worker + Cache API) ---- */
const AUDIO_CACHE='n1-audio';
let SWOK=false;
if('serviceWorker' in navigator&&(location.hostname!=='127.0.0.1'||/[?&]sw\b/.test(location.search))&&!/[?&]nosw\b/.test(location.search)){navigator.serviceWorker.register('sw.js').then(()=>{SWOK=true}).catch(()=>{})}
let AMAN=null;const audioManifest=()=>AMAN||(AMAN=fetch('audio/manifest.json?v='+APP_VERSION.slice(1)).then(r=>r.json()).catch(e=>{AMAN=null;throw e}));
const mb=b=>(b/1e6).toFixed(b<1e7?1:0)+' MB';
async function audioStatus(){if(!window.caches)return null;const m=await audioManifest(),c=await caches.open(AUDIO_CACHE),ks=new Set((await c.keys()).map(r=>new URL(r.url).pathname.replace(/^.*?\/audio\//,'audio/')));
  let have=0,hb=0,tot=0;for(const [p,b] of m.files){tot+=b;if(ks.has(p)){have++;hb+=b}}return {have,hb,tot,n:m.files.length,m}}
let ADL=null;
async function audioDownload(upd){if(ADL)return;ADL={stop:false};const st=await audioStatus(),c=await caches.open(AUDIO_CACHE),base=new URL('.',location.href);
  const ks=new Set((await c.keys()).map(r=>new URL(r.url).pathname));let done=st.have,i=0;const todo=st.m.files.filter(([p])=>!ks.has(new URL(p,base).pathname));
  const worker=async()=>{while(i<todo.length&&!ADL.stop){const [p]=todo[i++];try{const r=await fetch(new URL(p,base));if(r.ok){await c.put(new URL(p,base).href,r);done++;upd(done,st.n)}}catch(e){ADL.stop=true;upd(done,st.n,'Stopped — network error')}}};
  await Promise.all([worker(),worker(),worker(),worker()]);ADL=null;upd(done,st.n,null,true)}
async function audioClear(){if(window.caches)await caches.delete(AUDIO_CACHE)}
function offlineRow(root){const box=root.querySelector('#aud');if(!box)return;
  const paint=()=>audioStatus().then(s=>{if(!s){box.innerHTML='<span class="mut sm">Not supported in this browser</span>';return}
    box.innerHTML=`<div class="audst"><span class="sm">${s.have}/${s.n} files · ${mb(s.hb)} of ${mb(s.tot)}</span><div class="two"><button class="btn sm" id="adl"${s.have>=s.n?' disabled':''}>⬇ Download all (${mb(s.tot-s.hb)})</button><button class="btn sm ghost" id="acl"${s.have?'':' disabled'}>Clear</button></div></div>`;
    box.querySelector('#adl').onclick=()=>{box.querySelector('#adl').disabled=true;audioDownload((d,n,err,fin)=>{const t=box.querySelector('.audst span');if(t)t.textContent=fin?'Done':err||`Downloading ${d}/${n}…`;if(fin)paint()})};
    box.querySelector('#acl').onclick=()=>{if(confirm('Remove all downloaded audio from this device?'))audioClear().then(paint)}}).catch(()=>{box.innerHTML='<span class="mut sm">Audio list unavailable offline</span>'});
  paint()}

window.addEventListener('hashchange',route);
window.__n1q=Q;window.__sim=SIM;window.__simDiff=simDiff;window.__n1={kt:kanjiTypes,pick:smartPick,nav:()=>NAV,ss:()=>SS,state:()=>S,start:(ids)=>nav('quiz/play',()=>start(Q.filter(q=>ids.includes(q.id)),store.get("quizOpts",{}),false))};
// ---- v51 swipe: ← next, → previous on Study and Quiz (play) screens. Ignores left-edge (system back), vertical scrolls, h-scrollable areas, inputs.
const SWX=24,SWT=60;
function hScrollable(t){for(let n=t;n&&n!==app&&n.nodeType===1;n=n.parentElement){const o=getComputedStyle(n).overflowX;if((o==='auto'||o==='scroll')&&n.scrollWidth>n.clientWidth+2)return true}return false}
function swEl(){return (cur||'').startsWith('study/')?$('#sc'):(cur||'')==='quiz/play'?app:null}
let SW=null;
document.addEventListener('touchstart',e=>{SW=null;if(e.touches.length!==1||!swEl())return;const t=e.touches[0];
  if(t.clientX<SWX||!e.target.closest('#app')||e.target.closest('input,textarea,select,.kopts,.wsheet,.ssheet,.toast')||hScrollable(e.target))return;
  if(document.querySelector('.wsheet.show,.ssheet'))return;SW={x:t.clientX,y:t.clientY,lock:null,el:swEl()}},{passive:true});
document.addEventListener('touchmove',e=>{if(!SW)return;const t=e.touches[0],dx=t.clientX-SW.x,dy=t.clientY-SW.y;
  if(!SW.lock&&(Math.abs(dx)>10||Math.abs(dy)>10))SW.lock=Math.abs(dx)>Math.abs(dy)*1.6?'x':'y';
  if(SW.lock==='x'&&!reduced()&&SW.el){SW.el.style.transition='none';SW.el.style.transform=`translateX(${dx*.3}px)`}},{passive:true});
document.addEventListener('touchend',e=>{if(!SW)return;const s=SW;SW=null;const t=e.changedTouches[0],dx=t.clientX-s.x,dy=t.clientY-s.y;
  if(s.el){s.el.style.transition='';s.el.style.transform=''}
  if(s.lock!=='x'||Math.abs(dx)<SWT||Math.abs(dx)<Math.abs(dy)*1.6)return;swipeGo(dx<0?'next':'prev')},{passive:true});
document.addEventListener('touchcancel',()=>{if(SW&&SW.el){SW.el.style.transform=''}SW=null},{passive:true});
function slideIn(el,dir){if(!el||reduced())return;el.classList.remove('sin-l','sin-r');void el.offsetWidth;el.classList.add(dir==='next'?'sin-r':'sin-l')}
function swipeGo(dir){const r=cur||'';
  if(r.startsWith('study/')&&SS)return studySwipe(dir);
  if(r==='quiz/play'&&S)return quizSwipe(dir)}
window.__swipe=swipeGo;
// Study: next on current = defer (no grading) to the end of the queue; prev = read-only view of earlier graded cards
function studySwipe(dir){if(typeof closePeek==='function')closePeek();
  if(SS.view!=null){if(dir==='prev'){if(SS.view>0){SS.view--;studyView(dir)}else nudge()}else{SS.view++;if(SS.view>=SS.i){SS.view=null;studyCard();slideIn($('#sc'),dir)}else studyView(dir)}return}
  if(dir==='prev'){if(SS.i>0){SS.view=SS.i-1;studyView(dir)}else nudge();return}
  if(SS.graded)return;const rest=SS.items.length-SS.i;if(rest<=1){nudge();toast('Last card in this batch');return}
  const it=SS.items.splice(SS.i,1)[0];SS.items.push(typeof it==='string'?{key:it}:it);SS.shown=false;studyCard();slideIn($('#sc'),dir);toast('Skipped · it comes back later')}
function nudge(){const el=swEl();if(!el||reduced())return;el.classList.remove('nudge');void el.offsetWidth;el.classList.add('nudge')}
const GNAME={1:'Again',2:'Hard',3:'Good',4:'Easy'};
function studyView(dir){const it0=SS.items[SS.view],it=typeof it0==='string'?{key:it0}:it0,tot=SS.items.length;
  app.innerHTML=`<div class="qtop">${fmBtns()}<div class="qprog"><div style="width:${SS.i*100/tot}%"></div></div><span class="mut sm">${SS.view+1}/${tot}</span>${aaBtn()}</div>
  <div class="scard revealed ro" id="sc"><div class="stag"><span class="pill${it.key[0]==='w'?'':' sub'}">${it.key[0]==='w'?'語 word':'漢 kanji'}</span><span class="pill sub">earlier card</span></div>
   <div class="sback">${backHTML(it)}</div></div>
  <div class="stbar" id="sbar"><div class="frow rov"><span class="mut sm">${it.g?`Graded: <b>${GNAME[it.g]||'—'}</b>`:'Not graded'}</span><button class="btn primary" id="rtc" type="button">Back to current →</button></div></div>`;
  $('#rtc').onclick=()=>{SS.view=null;studyCard();slideIn($('#sc'),'next')};
  app.querySelectorAll('.say').forEach(b=>b.onclick=e=>{e.stopPropagation();say(b.dataset.t)});
  slideIn($('#sc'),dir);window.scrollTo(0,0)}
// Quiz: next = Next button once the step is answered; prev = read-only view of earlier steps
function quizSwipe(dir){
  if(dir==='next'){if(S.view!=null){const t=S.si+1;if(t>=S.view){const c=S.view;S.view=null;S.si=c;showQ();restoreStep(c);slideIn(app,dir);window.scrollTo(0,0)}else{S.si=t;viewStep();slideIn(app,dir)}return}
    const nx=$('#nx');if(nx){nx.click();slideIn(app,dir)}else nudge();return}
  const base=S.view!=null?S.si:S.si;if(base<=0){nudge();return}
  if(S.view==null)S.view=S.si;S.si=base-1;viewStep();slideIn(app,dir)}
function restoreStep(si){const p=(S.past||{})[si];if(!p)return;S.ans={...p};Object.keys(p).forEach(j=>renderAnswered(+j,false))}
function viewStep(){showQ();restoreStep(S.si);const w=$('#nxw');if(w)w.innerHTML=`<div class="nextbar rov"><span class="mut sm">Earlier question · read-only</span><button class="btn primary" id="rtq" type="button">Back to current →</button></div>`;
  app.querySelectorAll('.choice').forEach(b=>{b.classList.add('dis');b.setAttribute('aria-disabled','true');b.onclick=null});
  const r=$('#rtq');if(r)r.onclick=()=>{const c=S.view;S.view=null;S.si=c;showQ();restoreStep(c);slideIn(app,'next');window.scrollTo(0,0)};window.scrollTo(0,0)}
loadSess();route();
})();


// v89: size the flash card to the visible viewport (minus header, toolbar, controls, tab bar, safe areas) so it never hides behind the tab bar
function fitCard(){const st=document.getElementById('stage'),fc=document.getElementById('fc');if(!st||!fc)return;
  const vh=(window.visualViewport&&visualViewport.height)||innerHeight,top=st.getBoundingClientRect().top+scrollY-((window.visualViewport&&visualViewport.offsetTop)||0);
  const hdr=document.querySelector('header'),hh=hdr?hdr.getBoundingClientRect().height:0;
  const th=document.querySelector('.cgrade'),ct=document.querySelector('.cnav'),cp=document.querySelector('.cprog'),tb=document.getElementById('tabs');
  const mb=el=>{if(!el)return 0;const c=getComputedStyle(el);return el.getBoundingClientRect().height+parseFloat(c.marginTop)+parseFloat(c.marginBottom)};
  let tab=0;if(tb&&getComputedStyle(tb).display!=='none'){const r=tb.getBoundingClientRect();if(r.width<innerWidth*0.5&&innerWidth>=1000)tab=0;else tab=Math.max(0,innerHeight-r.top)}
  const sm=parseFloat(getComputedStyle(st).marginBottom)||0;
  // the page scrolls so the stage sits just below the sticky header; card fills the rest
  const avail=vh-top-mb(th)-mb(ct)-mb(cp)-tab-sm-8,h=Math.round(Math.max(100,Math.min(560,avail)));
  if(fc.style.getPropertyValue('--cardh')!==h+'px')fc.style.setProperty('--cardh',h+'px');
  window.__fitTop=top-hh-8}
(()=>{let r=0;const go=()=>{cancelAnimationFrame(r);r=requestAnimationFrame(fitCard)};addEventListener('resize',go);addEventListener('orientationchange',go);
  if(window.visualViewport)visualViewport.addEventListener('resize',go);if(window.ResizeObserver)new ResizeObserver(go).observe(document.documentElement);
  document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.aats,.seg3,#sts'))setTimeout(go,30)})})();
