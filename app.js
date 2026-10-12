(function(){
'use strict';
const APP_VERSION='v43';
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
  app.innerHTML=`<section class="hero2">
   <div class="hero-txt"><div class="hdate">${dateJa}</div><div class="greet">${greet}</div><h1 class="htitle">今日も一歩ずつ。</h1><p class="mut sm">One step at a time toward N1 · ${Q.length} questions · ${V.length} words · ${K.length} kanji</p>
    ${last&&lastName?`<a class="btn primary pill-btn" href="#${esc(last)}">${ICONS.play} Continue · ${lastName}</a>`:`<a class="btn primary pill-btn" href="#quiz">${ICONS.play} Start studying</a>`}</div>
   <div class="hero-ring">${ring(pct(today,goal),`${today}<span>/${goal}</span>`,'today',128)}
    <div class="goalctl"><button class="btn sm ghost" id="gm" aria-label="Lower daily goal">−</button><span class="mut sm">goal</span><button class="btn sm ghost" id="gp" aria-label="Raise daily goal">＋</button></div></div>
  </section>
  ${todayCard(buildQueue('mixed'))}
  <div class="statrow">
   <div class="mini"><span class="mi">${ICONS.flame}</span><div><b>${sk}</b><small>day${sk===1?'':'s'} streak</small></div></div>
   <div class="mini"><span class="mi ind">${ICONS.progress}</span><div><b>${acc}%</b><small>accuracy · ${st.correct}/${st.answered}</small></div></div>
  </div>
  <h2 class="sec-t"><span>Sections</span><small>分野</small></h2>
  <div class="secgrid">${SECTIONS.map((sec,i)=>{const n=Q.filter(q=>secOf(q)===sec).length,x=secStats(sec),p=x.a?pct(x.k,x.a):null;
    return `<button class="seccard s${i}" data-sec="${esc(sec)}"><span class="sg">${SEC_INFO[sec].glyph}</span><span class="stx"><b>${sec}</b><small>${SEC_INFO[sec].en}</small></span>
     <span class="smeta"><span>${n} questions</span><span>${p===null?'not tried':p+'% · '+x.k+'/'+x.a}</span></span><span class="sbar"><i style="width:${p||0}%"></i></span></button>`}).join('')}</div>
  <h2 class="sec-t"><span>Quick start</span><small>すぐに始める</small></h2>
  <div class="quick">
   <button class="qcard" id="qq"><span class="qi">${ICONS.bolt}</span><b>Quick quiz</b><small>10 random questions</small></button>
   <button class="qcard" id="qm" ${missed.length?'':'disabled'}><span class="qi">${ICONS.redo}</span><b>Review missed</b><small>${missed.length} question${missed.length===1?'':'s'}</small></button>
   <a class="qcard" href="#vocab"><span class="qi">語</span><b>Words</b><small>${unknown} to learn</small></a>
   <a class="qcard" href="#kanji"><span class="qi">漢</span><b>Kanji</b><small>${K.length} kanji · look-alikes</small></a>
  </div>
  <a class="card tipscard" href="#tips"><span class="qi">${ICONS.bulb}</span><div><b>読解 Tips</b><small class="mut">Workflow, question types, signal words, traps</small></div><span class="chev">${ICONS.chev}</span></a>
  <p class="ver">JLPT N1 Reviewer · ${APP_VERSION}</p>`;
  $('#gm').onclick=()=>{store.set('goal',Math.max(5,goal-5));home()};$('#gp').onclick=()=>{store.set('goal',Math.min(200,goal+5));home()};
  const o=store.get('quizOpts',{cat:'',shuffle:true,n:10,autoplay:false});
  $('#qq').onclick=()=>{nav('quiz/play',()=>start(smartPick(Q,10),{...o,shuffle:true},false,10))};
  $('#qm').onclick=()=>{nav('quiz/play',()=>start(shuffle(Q.filter(q=>missed.includes(q.id))),o,true))};
  app.querySelectorAll('.seccard').forEach(b=>b.onclick=()=>{const sec=b.dataset.sec;store.set('quizOpts',{...o,cat:sec});nav('quiz/play',()=>start(smartPick(Q.filter(q=>secOf(q)===sec),o.n||10),{...o,cat:sec,shuffle:true},false,o.n||10))});
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
  <div class="card"><h3>Accuracy by section</h3>${rows.map(r=>`<div class="cat"><div class="cat-h"><span>${esc(r.c)}</span><span class="mut">${r.a?`${pct(r.k,r.a)}% · ${r.k}/${r.a}`:'not tried'}</span></div><div class="hbar"><div style="width:${r.a?pct(r.k,r.a):0}%;background:${r.a&&r.k/r.a<.6?'var(--accent)':'var(--indigo)'}"></div></div></div>`).join('')}
   <p class="mut sm">Section stats are counted from this version onward; overall totals include earlier answers.</p></div>
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
  <label class="sw"><input type="checkbox" id="shuf" ${o.shuffle?'checked':''}><span></span> Shuffle questions <small class="mut">· Mix: 60% least-tried</small></label>
  <label class="sw"><input type="checkbox" id="auto" ${o.autoplay?'checked':''}><span></span> Autoplay audio after answering</label>
  <label class="sw"><input type="checkbox" id="shc" ${o.sc!==false?'checked':''}><span></span> Shuffle choices</label>
  <div class="row"><button class="btn primary big" id="go">Start quiz</button><button class="btn ghost big" id="rm" ${missed.length?'':'disabled'}>↺ Review missed only (${missed.length})</button></div></div>`;
  const opts=()=>{const x={cat:$('#cat').value,shuffle:$('#shuf').checked,n:Math.max(1,+$('#n').value||10),autoplay:$('#auto').checked,sc:$('#shc').checked};store.set('quizOpts',x);return x};
  $('#go').onclick=()=>{const x=opts();let p=Q.filter(q=>!x.cat||secOf(q)===x.cat);if(x.shuffle)p=smartPick(p,x.n);nav('quiz/play',()=>start(p,x,false,x.n))};
  $('#rm').onclick=()=>{const x=opts();let p=Q.filter(q=>missed.includes(q.id));if(x.shuffle)p=shuffle(p);nav('quiz/play',()=>start(p,x,true))};
}
// v39: ~60% of a random quiz comes from the least-attempted questions (passage groups = one unit, min member count)
function smartPick(list,limit){const att=store.get('qAtt',{}),units=[],seen=new Set();
  for(const q of list){const g=q.passage_group;if(!g){units.push([q]);continue}if(seen.has(g))continue;seen.add(g);units.push(Q.filter(x=>x.passage_group===g).sort((a,b)=>a.id-b.id))}
  const tot=units.reduce((a,u)=>a+u.length,0);if(!(limit>0)||tot<=limit)return shuffle(units).flat();
  const quota=Math.round(limit*.6),sc=units.map(u=>({u,a:Math.min(...u.map(q=>att[q.id]||0)),r:Math.random()})).sort((x,y)=>x.a-y.a||x.r-y.r);
  const pick=[];let c=0;while(sc.length&&c<quota){const x=sc.shift();pick.push(x.u);c+=x.u.length}
  for(const x of shuffle(sc)){if(c>=limit)break;pick.push(x.u);c+=x.u.length}
  return shuffle(pick).flat()}
function start(list,opts,missedMode,limit){if(!list.length){alert('No questions match.');return false}
  // passage groups: a group is always taken whole (members from the full bank, id order) and counts as one unit;
  // with a size limit we add whole units until the limit is reached (may slightly exceed it, never splits a group)
  const units=[],seen=new Set();
  for(const q of list){const g=q.passage_group;if(!g){units.push([q]);continue}if(seen.has(g))continue;seen.add(g);units.push(Q.filter(x=>x.passage_group===g).sort((a,b)=>a.id-b.id))}
  let take=units;if(limit>0){take=[];let c=0;for(const u of units){if(c>=limit)break;take.push(u);c+=u.length}}
  const flat=[],steps=[];take.forEach(u=>{steps.push([flat.length,u.length]);flat.push(...u)});
  const sc=store.get('quizOpts',{}).sc!==false,perm={};if(sc)flat.forEach(q=>{if(!isOrderQ(q))perm[q.id]=shuffle(Object.keys(q.choices))});
  S={list:flat,steps,si:0,opts,missedMode,i:0,score:0,wrong:[],ans:{},perm};showQ()}
// v42: shuffled choice order lives in S.perm[qid] (original keys in display order); labels follow position
const corder=q=>(S&&S.perm&&S.perm[q.id])||Object.keys(q.choices);
function dk(q,k){const p=S&&S.perm&&S.perm[q.id];if(!p)return String(k);const i=p.indexOf(String(k));return i<0?String(k):Object.keys(q.choices)[i]}
// rewrite "choice 2", "choices 1 and 3", "option B" in note text to the displayed labels
function rmap(q,t){if(!t||!(S&&S.perm&&S.perm[q.id]))return t;return String(t).replace(/(\b(?:[Cc]hoices?|[Oo]ptions?)\s*)((?:[1-4A-D]\b(?:\s*(?:,|and|or|&|\/)\s*)?)+)/g,(m,a,b)=>a+b.replace(/[1-4A-D]\b/g,d=>q.choices[d]!=null?dk(q,d):d))}
const isKanjiQ=q=>/表記/.test(q.category),isReadingQ=q=>/読み/.test(q.category),isUsageQ=q=>/用法/.test(q.category),isParaQ=q=>/言い換え/.test(q.category);
const hlHTML=(p,r)=>{const t=furi&&r?r:p.map(esc);return `${t[0]}<mark class="hl">${t[1]}</mark>${t[2]}`};
const BLANK=/_{2,}|（[\s　]*）/g;
const isOrderQ=q=>/並べ替え/.test(q.category)&&Array.isArray(q.correct_order),isLongQ=q=>isUsageQ(q)||/内容理解|統合理解|情報検索/.test(q.category)||Object.values(q.choices).some(c=>c.length>14);
function passageHTML(q,open){if(!q.passage&&!q.passage_title)return'';const t=q.passage_title?(furi&&q.passage_title_ruby?q.passage_title_ruby:esc(q.passage_title)):'';
  if(!q.passage)return `<p class="ptitle">📄 ${t}</p>`;
  const P=q.passage_w?q:q.pref?Q.find(x=>x.id===q.pref):null;
  return `<details class="passage"${open||(S&&S.passOpen)?' open':''}><summary>📄 ${t||'Passage 本文'}</summary>${P&&P.wl?`<details class="wlist" data-p="${P.id}"><summary>📖 Word list <span class="mut">· ${P.wl.length} words</span></summary><div class="wlb"></div></details>`:''}<div class="ptext ja">${(P?(furi?P.passage_w_ruby:P.passage_w):furi&&q.passage_ruby?q.passage_ruby:esc(q.passage)).replace(/\[(\d+)\]/g,'<b class="blank num">［$1］</b>')}</div></details>`}
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
function choiceHTML(q,k,answered){if(isUsageQ(q)&&q.choices_hl&&q.choices_hl[k])return hlHTML(q.choices_hl[k],q.choices_hl_ruby&&q.choices_hl_ruby[k]);const r=q.choices_ruby&&q.choices_ruby[k];return furi&&r&&(answered||!isKanjiQ(q))?r:esc(q.choices[k])}
function stepLabel(){const[st,n]=S.steps[S.si];return n>1?`Q${st+1}–${st+n}`:`Q${st+1}`}
function showQ(){S.ans={};const[st,n]=S.steps[S.si];S.i=st;const qs=S.list.slice(st,st+n),q0=qs[0];
  app.innerHTML=`<div class="qtop"><div class="qprog"><div style="width:${S.si*100/S.steps.length}%"></div></div><span class="mut sm">${S.si+1}/${S.steps.length}${n>1?` · ${stepLabel()}`:''}</span><button class="aa qend" id="qend" aria-label="End quiz" title="End quiz">✕</button>${aaBtn()}</div>
  ${n>1?`<div class="card qcardq gpass"><div class="chips"><span class="pill">${esc(secOf(q0))}</span><span class="pill sub">${esc(q0.category)}</span><span class="pill">${n} questions</span>${S.missedMode?'<span class="pill red">review</span>':''}</div>${passageHTML(q0,true)}${q0.reading_guide?'':techHTML(q0)}</div>`:''}
  ${qs.map((q,j)=>`<div class="gq" id="gq${j}"><div class="card qcardq">${n>1?`<div class="chips"><span class="pill gnum">${j+1}/${n}</span></div>`:`<div class="chips"><span class="pill">${esc(secOf(q))}</span><span class="pill sub">${esc(q.category)}</span>${S.missedMode?'<span class="pill red">review</span>':''}</div>${passageHTML(q)}${q.reading_guide?'':techHTML(q)}`}
  ${questionHTML(q)}${q.reading_guide?`<div class="gw">${guideHTML(q,false)}</div>`:''}</div>
  <div class="choices${isLongQ(q)?' usage long':''}">${corder(q).map(k=>`<button class="choice" data-k="${esc(k)}" data-j="${j}"><span class="ck">${esc(dk(q,k))}</span><span class="cv">${choiceHTML(q,k,false)}</span></button>`).join('')}</div><div class="fbw"></div></div>`).join('')}
  <div id="nxw"></div>`;
  app.querySelectorAll('.choice').forEach(b=>b.onclick=()=>answer(b.dataset.k,+b.dataset.j));
}
function answer(k,j=0){
  if(S.ans[j]!=null)return;
  const q=S.list[S.i+j],ok=k===String(q.answer);S.ans[j]=k;
  let missed=store.get('missed',[]),st=store.get('stats',{answered:0,correct:0}),cs=store.get('catStats',{});
  st.answered++;{const qa=store.get('qAtt',{});qa[q.id]=(qa[q.id]||0)+1;store.set('qAtt',qa)}cs[q.category]=cs[q.category]||{a:0,c:0};cs[q.category].a++;
  if(ok){S.score++;st.correct++;cs[q.category].c++;if(S.missedMode)missed=missed.filter(x=>x!==q.id)}else{S.wrong.push({q,k});if(!missed.includes(q.id))missed.push(q.id)}
  if(!ok)srsMiss(q);store.set('missed',missed);store.set('stats',st);store.set('catStats',cs);logActivity();
  renderAnswered(j,true);
  if(q.audio&&S.opts.autoplay)play(q.audio);
}
function renderAnswered(j,anim){
  const q=S.list[S.i+j],k=S.ans[j],ok=k===String(q.answer),box=$('#gq'+j),[st,n]=S.steps[S.si];
  box.querySelectorAll('.choice').forEach(b=>{b.disabled=true;b.querySelector('.cv').innerHTML=choiceHTML(q,b.dataset.k,true);
    if(b.dataset.k===String(q.answer)){b.classList.add('ok');if(anim&&ok)b.classList.add('pulse')}else if(b.dataset.k===k){b.classList.add('bad');if(anim)b.classList.add('shake')}});
  const hl=q.complete_sentence_hl?(furi&&q.complete_sentence_hl_ruby?q.complete_sentence_hl_ruby:q.complete_sentence_hl.map(esc)):null;
  const sent=hl?`${hl[0]}<mark class="hl">${hl[1]}</mark>${hl[2]}`:F(q,'complete_sentence');
  const ex=q.explain;
  const gw=box.querySelector('.gw');if(gw){const d=gw.querySelector('details');gw.innerHTML=guideHTML(q,true,d&&d.open)}
  app.querySelectorAll(`mark.ks[data-qs~="${q.id}"]`).forEach(m=>m.classList.add('on'));
  box.querySelector('.fbw').innerHTML=`<div class="card fb ${ok?'is-ok':'is-bad'}">
  <div class="fbh"><div class="verdict">${ok?'<span class="vi">✓</span> Correct':'<span class="vi">✕</span> Incorrect'}${ok?'':`<span class="ya">Your answer: <b>${esc(dk(q,k))}</b> ${choiceHTML(q,k,true)}</span>`}</div>
   ${q.audio?`<button class="abtn" aria-label="Play audio" title="Play audio">🔊</button>`:''}</div>
  ${isOrderQ(q)?orderAnsHTML(q):''}<p class="ja sent">${sent}</p><p class="mut sm en">${esc(q.complete_sentence_en)}</p>
  <div class="achip"><span class="badge ok">正解 ${esc(dk(q,q.answer))}</span><span class="aw">${F(q,'answer_word')}</span><span class="mut sm">${esc(q.answer_romaji)}</span></div>
  ${ex?`<p class="anote">${esc(rmap(q,stripW(ex.answer_note,q.answer_word)))}</p>
   <div class="others${isLongQ(q)?' usage':''}"><span class="lbl">Other choices</span>${ex.others.slice().sort((a,b)=>corder(q).indexOf(String(a.key))-corder(q).indexOf(String(b.key))).map(o=>{const cn=(q.choice_notes||{})[o.key]||null;
     const fake=cn?/not a real word|wrong reading|does not connect|not natural|not a (common|natural|correct)/.test(cn.note)&&!cn.example_ja:o.fake;
     const mean=stripW(cn?(cn.meaning_en&&cn.meaning_en.trim()!==String(q.choices[o.key]).trim()?cn.meaning_en:''):(o.form?o.form+' ':'')+o.note,q.choices[o.key],cn&&cn.reading), form=cn&&cn.form?`<span class="of">${esc(cn.form)}</span> `:'';
     return `<div class="orow${fake?' fake':''}"><span class="badge">${esc(dk(q,o.key))}</span><div class="obody"><div class="oline"><span class="ow">${choiceHTML(q,o.key,true)}</span>${mean?`<span class="on2">${form}${esc(rmap(q,mean))}</span>`:''}${cn&&cn.note&&!/^\s*wrong\s*$/i.test(cn.note)?`<span class="onote">${esc(rmap(q,cn.note))}</span>`:''}</div>
      ${cn&&cn.example_ja?`<div class="oex"><span class="rei">例</span><div><div class="ja">${furi&&cn.example_ja_ruby?cn.example_ja_ruby:esc(cn.example_ja)}</div><div class="oen">${esc(cn.example_en)}</div></div></div>`:''}</div></div>`}).join('')}</div>
   ${ex.tip?`<p class="tip">💡 <b>Tip</b> ${esc(rmap(q,ex.tip))}</p>`:''}`:`<p class="anote">${esc(rmap(q,q.explanation_en))}</p>`}
  <div class="ex tight"><span class="lbl">Example 例文</span><div class="ja">${F(q,'example_ja')}</div><div class="mut sm">${esc(q.example_en)}</div></div></div>`;
  if(q.audio)box.querySelector('.abtn').onclick=()=>play(q.audio);
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
  <div class="row center"><button class="btn primary" id="again">New quiz</button>${S.wrong.length?`<button class="btn ghost" id="rw">↺ Retry missed</button>`:''}<a class="btn ghost" href="#home">Home</a></div></div>
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
function kunHTML(list){const seen=new Set(),out=[];
  for(const r of list||[]){const plain=r.replace(/\./g,'');if(seen.has(plain))continue;seen.add(plain);
    const [stem,oku]=r.split('.');out.push(`<span class="pill kun">${esc(stem)}${oku?`<span class="oku">${esc(oku)}</span>`:''}</span>`)}
  return out.length?out.join(''):'<span class="mut">—</span>'}
function kBadges(x){return `<div class="kbadges">${lvBadge(x)}<span class="gb">${gradeTxt(x.grade)}</span></div>`}
function kStats(x){return `<div class="kstats"><div class="st"><span class="lbl">音 On</span><div>${x.onyomi.length?x.onyomi.map(r=>`<span class="pill on">${esc(r)}</span>`).join(''):'<span class="mut">—</span>'}</div></div>
   <div class="st"><span class="lbl">訓 Kun</span><div>${kunHTML(x.kunyomi)}</div></div>
   <div class="st"><span class="lbl">画数 Strokes</span><div class="sv">${x.stroke_count}</div></div>
   <div class="st"><span class="lbl">部首 Radical</span><div class="sv">${esc(x.radical)} <small class="mut">#${x.radical_number}</small></div></div></div>`}
function markKanji(c){const kv=store.get('kanjiViewed',[]);if(!kv.includes(c)){kv.push(c);store.set('kanjiViewed',kv)}}
const VS={},ORDER={vocab:null,kanji:null};
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
  <p class="simd">${esc(g.difference)}</p>
  <div class="simb">${g.members.map(m=>`<div class="simm"><div class="simmk">${K.some(x=>x.kanji===m.kanji)?`<a href="#kanji/${encodeURIComponent(m.kanji)}">${esc(m.kanji)}</a>`:esc(m.kanji)}</div><div class="simmi">
   <div class="simmean">${esc(m.meaning_en)}</div>
   <div class="simr">${m.onyomi.length?`<span class="pill on">${m.onyomi.map(esc).join('・')}</span>`:''}${m.kunyomi.length?`<span class="pill kun">${m.kunyomi.map(esc).join('・')}</span>`:''}</div>
   <div class="simw"><span class="ja">${furi&&m.sample.word_ruby?m.sample.word_ruby:esc(m.sample.word)}</span> <span class="mut sm">${esc(m.sample.reading)} · ${esc(m.sample.meaning_en)}</span></div></div></div>`).join('')}</div>
  </div></div></div>`}
function setSimOpen(c,o){c.classList.toggle('open',o);c.querySelector('.simrow').setAttribute('aria-expanded',o)}
function wireSim(root,single){root.querySelectorAll('.simrow').forEach(b=>b.onclick=()=>{const c=b.closest('.simg'),o=!c.classList.contains('open');
  if(single&&o)root.querySelectorAll('.simg.open').forEach(x=>{if(x!==c)setSimOpen(x,false)});setSimOpen(c,o)})}
const TIPS=window.TIPS||{sections:[],hints:{}};
function tipKey(q){return Object.keys(TIPS.hints).find(k=>q.category.includes(k))}
document.documentElement.dataset.ts=store.get('ts','m');
// v43 text size: one delegated handler (v41's ✕ End button also has class .aa and was stealing the old querySelector('.aa') hookup)
const TS=['s','m','l','xl'],aaBtn=()=>{const t=store.get('ts','m');return `<button class="aa aats" type="button" aria-label="Text size: ${t.toUpperCase()} (tap to change)" title="Text size">A<small>a</small><i>${t.toUpperCase()}</i></button>`};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.aats');if(!b)return;e.preventDefault();
  const t=TS[(TS.indexOf(store.get('ts','m'))+1)%TS.length];store.set('ts',t);document.documentElement.dataset.ts=t;
  document.querySelectorAll('.aats').forEach(x=>{x.querySelector('i').textContent=t.toUpperCase();x.setAttribute('aria-label','Text size: '+t.toUpperCase()+' (tap to change)')})});
// ---- tap-a-word (v30): glossary is lazy-loaded on first use
let glossP=null;function loadGloss(){return glossP||(glossP=new Promise((ok,no)=>{if(window.GLOSS)return ok(window.GLOSS);const sc=document.createElement('script');sc.src='glossary.js?v=30';sc.onload=()=>ok(window.GLOSS);sc.onerror=()=>{glossP=null;no()};document.head.appendChild(sc)}))}
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
document.addEventListener('click',e=>{const w=e.target.closest&&e.target.closest('.ptext .w,.q .w,.wli');
  if(w){e.preventDefault();showWord(w);return}
  if(wsheet&&wsheet.classList.contains('show')&&!e.target.closest('.wsheet,#hbk'))closeWord()},true);
document.addEventListener('toggle',e=>{const d=e.target;if(d.classList&&d.classList.contains('wlist')&&d.open)renderWL(d)},true);
window.addEventListener('hashchange',()=>{if(wsheet&&wsheet.classList.contains('show')){closeWordRaw()}});
// strip a leading "WORD: " / "WORD (reading) — " that repeats the headword
function stripW(t,...ws){if(!t)return t;const E=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  for(const w of ws.filter(Boolean).sort((a,b)=>b.length-a.length))for(const c of [w,w.replace(/な$/,'')]){const m=t.match(new RegExp('^'+E(c)+'な?\\s*(?:[（(][^)）]{0,30}[)）])?\\s*[:：—–=\\-]\\s*'));if(m&&t.length>m[0].length)return t.slice(m[0].length)}
  return t}
function guideHTML(q,answered,open){const g=q.reading_guide;if(!g)return'';
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
function similarView(){const st=VS[cur]||{};
  app.innerHTML=`<div class="ph"><h1 class="pt">Look-alike 似た漢字</h1>${seg('sim')}</div>
  <div class="search"><input type="search" id="s" placeholder="Search kanji or meaning…" value="${esc(st.q||'')}"><span class="mut sm" id="cnt"></span></div><div class="spidx" id="spi"></div><div id="sl" class="siml"></div>`;
  $('#tg').onclick=()=>{store.set('kanjiMode','grid');location.hash='kanji'};$('#tc').onclick=()=>{store.set('kanjiMode','cards');location.hash='kanjicards'};
  const draw=()=>{const t=$('#s').value.trim().toLowerCase();const f=SIM.filter(g=>!t||[g.shared_part||'',g.shared_label||'',g.part_meaning||'',g.part_expect||'',g.difference,...g.members.flatMap(m=>[m.kanji,m.meaning_en,m.sample.word,m.sample.reading,...m.onyomi,...m.kunyomi])].join(' ').toLowerCase().includes(t));
    $('#cnt').textContent=`${f.length} groups`;
    const parts=[];f.forEach(g=>{if(g.shared_part&&!parts.some(p=>p.p===g.shared_part))parts.push({p:g.shared_part,id:g.id})});
    $('#spi').innerHTML=parts.map(x=>`<button class="spc" data-g="${x.id}">${esc(x.p)}</button>`).join('');
    $('#sl').innerHTML=f.map(g=>simCard(g,false)).join('');wireSim($('#sl'),true);
    $('#spi').querySelectorAll('.spc').forEach(b=>b.onclick=()=>{const L=$('#sl'),el=L.querySelector(`.simg[data-g="${b.dataset.g}"]`);if(!el)return;
      $('#spi').querySelectorAll('.spc').forEach(x=>x.classList.toggle('on',x===b));b.scrollIntoView({block:'nearest',inline:'center'});
      L.classList.add('noanim');L.querySelectorAll('.simg.open').forEach(x=>{if(x!==el)setSimOpen(x,false)});setSimOpen(el,true);void L.offsetHeight;
      const hh=($('header')?$('header').offsetHeight:0)+$('#spi').offsetHeight+10;
      window.scrollTo(0,Math.max(0,el.getBoundingClientRect().top+window.scrollY-hh));
      requestAnimationFrame(()=>L.classList.remove('noanim'));el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),900)})};
  $('#s').oninput=draw;draw()}
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
  app.innerHTML=`<div class="card kb"><div class="khead"><div class="kbig">${esc(x.kanji)}</div><div><div class="kmean">${esc(x.meaning_en)}</div>${kBadges(x)}</div></div>${kStats(x)}</div>
   ${x.mnemonic?`<div class="card mnc">${storyHTML(c)}</div>`:''}<div class="card">${sampleWords(c,0)}</div>${simOf(c).length?`<h2 class="sec-t">Look-alike kanji 似ている漢字</h2>${simOf(c).map(g=>simCard(g,true,c)).join('')}`:''}`;
  wireSim(app);
}

/* ---------- Flashcard deck (words & kanji) ---------- */
function deck(kind,focus){
  const isV=kind==='vocab';if(!ORDER[kind])ORDER[kind]=shuffle(isV?V:K);let data=ORDER[kind];const savedIdx=VS[cur]&&VS[cur].idx;let filt=data,idx=0,flipped=false,onlyUnknown=isV&&store.get('wordsFilter',false);
  const ICON={filter:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    shuffle:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>'};
  const showHint=!store.get('hintSeen_'+kind,false);
  app.innerHTML=`<div class="ph deck-ph"><h1 class="pt">${isV?'Words 語彙':'Kanji 漢字'}</h1>${isV?'':seg(false)}<a class="btn sm primary stbtn" href="#study/${isV?'words':'kanji'}">▶ Study</a></div>
  <div class="toolbar"><div class="search"><input type="search" id="s" placeholder="Search ${isV?'words':'kanji'}…" aria-label="Search ${isV?'word, reading, romaji, meaning':'kanji, reading, meaning'}"><span class="mut sm" id="cnt"></span></div>
   ${isV?`<button class="ibtn${onlyUnknown?' active':''}" id="ou" aria-pressed="${onlyUnknown}" aria-label="Show only words not marked Know" title="Only not-known words">${ICON.filter}<i class="dot"></i></button>`:''}
   <button class="ibtn" id="sh" aria-label="Shuffle" title="Shuffle">${ICON.shuffle}</button></div>
  ${isV?'':levelBar(K)}
  <div class="stage" id="stage"><div class="hint hint-l">✕ Don't know</div><div class="hint hint-r">✓ Know</div>
   <div class="flip" id="fc"><div class="face front" id="ff"></div><div class="face backf" id="fbk"></div></div></div>
  <p class="taphint${showHint?'':' faded'}">${isV?'Tap to flip · swipe → know · ← don\'t know':'Tap to flip · swipe to move'}</p>
  <div class="ctrls"><button class="rbtn" id="pv" aria-label="Previous">←</button>${isV?`<button class="rbtn no" id="dk" aria-label="Don't know">✕</button><button class="rbtn yes" id="kn" aria-label="Know">✓</button>`:''}<button class="rbtn" id="nx" aria-label="Next">→</button></div>
  <details class="card listbox" id="lb"><summary>All ${isV?'words':'kanji'} <span class="mut" id="lbn"></span></summary><div class="list" id="ls"></div></details>`;
  if(showHint)store.set('hintSeen_'+kind,true);
  const match=(x,t)=>!t||(isV?[x.word,x.reading,x.romaji,x.meaning_en]:[x.kanji,...x.onyomi,...x.kunyomi,x.meaning_en,...(x.common_words||[])]).join(' ').toLowerCase().includes(t);
  const vs=()=>store.get('vocabStatus',{});
  function apply(){const t=$('#s').value.trim().toLowerCase(),st=vs();filt=data.filter(x=>(isV||lvOk(x))&&match(x,t)&&(!onlyUnknown||st[x.id]!=='know'));idx=Math.min(idx,Math.max(0,filt.length-1));render()}
  const vsKey=cur;
  function tag(x){if(!isV)return'';const s=vs()[x.id];return s==='know'?'<span class="tag k">Know</span>':s==='dont'?'<span class="tag u">Don\'t know</span>':''}
  function render(){
    VS[vsKey]=Object.assign(VS[vsKey]||{},{idx});
    $('#cnt').textContent=filt.length?`${idx+1}/${filt.length}`:'0';if($('#lbn'))$('#lbn').textContent=`(${filt.length})`;
    const x=filt[idx],fc=$('#fc');fc.classList.toggle('flipped',flipped);
    if(!x){$('#ff').innerHTML='<span class="mut">No cards</span>';$('#fbk').innerHTML='';$('#ls').innerHTML='';return}
    if(!isV&&flipped)markKanji(x.kanji);
    $('#ff').innerHTML=isV?`<div class="fw">${F(x,'word')}</div>${tag(x)}`:`<div class="kfront">${esc(x.kanji)}</div>${lvBadge(x)}`;
    $('#fbk').innerHTML=isV?`<div class="vhead"><div class="vword">${F(x,'word')}</div><div><div class="ja">${RD(x,"")} <span class="mut">${esc(x.romaji)}</span></div><span class="pill">${esc(x.part_of_speech)}</span> ${tag(x)}</div></div>
      <div class="vmean">${esc(x.meaning_en)}</div>
      <div class="ex"><div class="ja">${F(x,'example_ja')}</div><div class="mut">${esc(x.example_en)}</div></div>
      <div class="foot">${x.kanji&&x.kanji.length?`<span class="lbl">漢字</span>${x.kanji.map(c=>`<a class="chip" href="#kanji/${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}`:''}
      <span class="lbl">From</span><span class="mut">${(x.source_question_ids||[]).map(i=>'Q'+i).join(', ')}</span></div>`
    :`<div class="khead"><div class="kbig">${esc(x.kanji)}</div><div><div class="kmean">${esc(x.meaning_en)}</div>${kBadges(x)}</div></div>${kStats(x)}
      ${storyHTML(x.kanji)}${sampleWords(x.kanji,4)}`;
    if(!isV)wireSamples($('#fbk'));
    fc.querySelectorAll('a').forEach(a=>{a.onclick=e=>e.stopPropagation();a.onpointerdown=e=>e.stopPropagation()});
    $('#ls').innerHTML=filt.slice(0,300).map((y,i)=>`<div class="li${i===idx?' cur':''}" data-i="${i}">${isV?`<b>${F(y,'word')}</b> ${RD(y)} — ${esc(y.meaning_en)} ${tag(y)}`:`<b>${esc(y.kanji)}</b> ${esc(y.meaning_en)}`}</div>`).join('');
    $('#ls').querySelectorAll('[data-i]').forEach(d=>d.onclick=()=>{idx=+d.dataset.i;flipped=false;render();window.scrollTo({top:0,behavior:reduced()?'auto':'smooth'})});
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
  $('#sh').onclick=()=>{data=ORDER[kind]=shuffle(isV?V:K);idx=0;flipped=false;apply()};$('#s').oninput=()=>{idx=0;flipped=false;apply()};
  if(isV){$('#kn').onclick=()=>mark('know');$('#dk').onclick=()=>mark('dont');$('#ou').onclick=e=>{onlyUnknown=!onlyUnknown;const b=$('#ou');b.classList.toggle('active',onlyUnknown);b.setAttribute('aria-pressed',onlyUnknown);store.set('wordsFilter',onlyUnknown);idx=0;apply()}}
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
function replaceTo(h){delete SCR[NAV.k];history.replaceState({k:NAV.k,d:NAV.d},'','#'+h);cur='';route()}
// overlays (word popover, story editor) get one history entry so Back closes them first
let OV=null,ignorePop=false;
function ovOpen(close){if(OV){OV=close;return}OV=close;history.pushState({k:NAV.k,d:NAV.d,ov:1},'',location.href)}
function ovDrop(){if(!OV)return;OV=null;ignorePop=true;history.back()}
window.addEventListener('popstate',e=>{if(ignorePop){ignorePop=false;return}if(OV){const f=OV;OV=null;f();return}
  if(e.state&&e.state.ov&&location.hash===('#'+cur)){ignorePop=true;history.back()}});
document.addEventListener('click',e=>{if(!OV)return;const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;e.preventDefault();e.stopPropagation();
  const f=OV;OV=null;f();history.replaceState(null,'',a.getAttribute('href'));route()},true);
const QBY=Object.fromEntries(Q.map(q=>[q.id,q]));
function saveSess(){try{sessionStorage.setItem('n1_S',S?JSON.stringify({...S,list:S.list.map(q=>q.id),wrong:S.wrong.map(w=>({q:w.q.id,k:w.k}))}):'');sessionStorage.setItem('n1_SS',SS?JSON.stringify(SS):'');sessionStorage.setItem('n1_scr',JSON.stringify(SCR))}catch(e){}}
function loadSess(){try{const a=sessionStorage.getItem('n1_S');if(a){const o=JSON.parse(a);o.list=o.list.map(i=>QBY[i]).filter(Boolean);o.wrong=o.wrong.map(w=>({q:QBY[w.q],k:w.k})).filter(w=>w.q);S=o}
  const b=sessionStorage.getItem('n1_SS');if(b)SS=JSON.parse(b)}catch(e){}}
function snap(){if(!cur)return;const si=document.querySelector('#s');VS[cur]=Object.assign(VS[cur]||{},{q:si?si.value:'',y:window.scrollY});
  SCR[NAV.k]={y:window.scrollY,open:[...app.querySelectorAll('details')].map((d,i)=>d.open?i:-1).filter(i=>i>=0)};const ks=Object.keys(SCR);if(ks.length>200)delete SCR[ks[0]];saveSess()}
window.addEventListener('pagehide',snap);document.addEventListener('visibilitychange',()=>{if(document.hidden)snap()});
function resumeQuiz(){if(S.done)return results(false);const a=S.ans||{};showQ();for(const j in a){S.ans[j]=a[j];renderAnswered(+j,false)}}
function resumeStudy(){if(SS.graded){SS.i++;SS.graded=false;SS.shown=false}const sh=SS.shown;SS.shown=false;studyCard();if(sh&&SS.items[SS.i])reveal(SS.items[SS.i])}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#qend')&&confirm('End this quiz? Answers so far are saved.')){S=null;saveSess();replaceTo('quiz')}});
const TABS=[['home',ICONS.home,'Home'],['quiz',ICONS.quiz,'Quiz'],['vocab',ICONS.vocab,'Words'],['kanji',ICONS.kanji,'Kanji'],['progress',ICONS.progress,'Progress']];
function header(){const h=$('header'),root=(cur||'home').split('/')[0],showBack=NAV.d>0||root!=='home';
  const dark=document.documentElement.dataset.theme==='dark';
  h.innerHTML=`${showBack?`<button class="hb icon" id="hbk" aria-label="Back">${ICONS.back}</button>`:''}<a href="#home" class="brand"><span class="hanko">N1</span><span class="bt">JLPT N1 Reviewer</span></a>
   <div class="hbtns"><button class="hb ${furiOn?'on':''}" id="hf" aria-pressed="${furiOn}" aria-label="Furigana ${furiOn?'on':'off'}" title="Furigana"><span class="lg">ふりがな</span><span class="ic">あ</span></button><button class="hb icon" id="hd" aria-label="Toggle dark mode">${dark?ICONS.sun:ICONS.moon}</button></div>`;
  if($('#hbk'))$('#hbk').onclick=goBack;
  $('#hf').onclick=()=>{furiOn=!furiOn;store.set('furigana',furiOn);applyFuri();const b=$('#hf');b.classList.toggle('on',furiOn);b.setAttribute('aria-pressed',furiOn);b.setAttribute('aria-label','Furigana '+(furiOn?'on':'off'))};
  $('#hd').onclick=()=>{store.set('theme',document.documentElement.dataset.theme==='dark'?'light':'dark');applyTheme();header()};
  const tabRoot=(root==='kanjicards'||root==='similar')?'kanji':(root==='tips'||root==='study'||root==='studyguide')?'home':root;
  $('#tabs').innerHTML=TABS.map(([k,i,l])=>`<a href="#${k==='kanji'&&store.get('kanjiMode','grid')==='cards'?'kanjicards':k}" data-tab="${k}" class="tab${tabRoot===k?' on':''}" ${tabRoot===k?'aria-current="page"':''}><span class="ti">${i}</span><span>${l}</span></a>`).join('');
  $('#tabs').querySelectorAll('[data-tab]').forEach(a=>a.onclick=()=>{const t=a.dataset.tab;   // entering a tab fresh → new random order
    if(t==='vocab'){ORDER.vocab=null;delete VS.vocab}if(t==='kanji'){ORDER.kanji=null;delete VS.kanjicards;delete VS.kanji}
    if(location.hash===a.getAttribute('href')&&(t==='vocab'||t==='kanji'))setTimeout(rerender,0)});
}
const inQuiz=()=>S&&!S.done&&(cur||'').startsWith('quiz')&&document.querySelector('.choice');
let skip=false;
function route(){const h=location.hash.slice(1)||'home';
  snap();const prev=NAV,st=history.state;
  if(st&&st.k!=null)NAV={k:st.k,d:st.d||0};else{NAV={k:++navCtr,d:cur?prev.d+1:0};history.replaceState(NAV,'');sessionStorage.setItem('n1_navk',navCtr)}
  const fresh=!!pending||!SCR[NAV.k];
  cur=h;if(h!=='home')store.set('last',h);header();if(audio)audio.pause();
  const [p,arg]=h.split('/');const a=arg&&decodeURIComponent(arg);
  if(p==='quiz'){if(a==='play'){if(pending){const f=pending;pending=null;if(f()===false)return history.back()}else if(S)resumeQuiz();else{pending=null;return replaceTo('quiz')}}else{pending=null;quizSetup()}}else render(p,a);
  const sv=fresh?null:SCR[NAV.k];if(sv&&sv.open){const ds=app.querySelectorAll('details');sv.open.forEach(i=>{if(ds[i])ds[i].open=true})}
  const y=sv?sv.y:(p==='quiz'||p==='study'?0:(VS[h]||{}).y||0);window.scrollTo(0,y);requestAnimationFrame(()=>window.scrollTo(0,y));saveSess();
}
function render(p,a){if(p==='vocab')deck('vocab',a);else if(p==='kanji'){if(a)kanjiDetail(a);else kanjiGrid()}else if(p==='kanjicards')deck('kanji',a);else if(p==='similar')similarView();else if(p==='tips')tipsView();else if(p==='study'){if(a){if(SS&&SS.mode===a&&SS.items&&SS.i<SS.items.length)resumeStudy();else studyStart(a)}else studyHome()}else if(p==='studyguide')studyGuide();else if(p==='progress')progress();else home()}
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
const say=t=>{try{if(!window.speechSynthesis||!t)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=.9;speechSynthesis.speak(u)}catch(e){}};
const srsDB=()=>store.get('srs',{}),srsCfg=()=>{const c=store.get('srsCfg',{});return {ss:[10,20,30,50].includes(c.ss)?c.ss:20}};
const simGroup=c=>SIM.find(g=>g.kanji.includes(c)&&g.kanji.length>=2);
const sampleV=c=>V.find(v=>(v.kanji||[]).includes(c)&&v.word.length>1)||V.find(v=>(v.kanji||[]).includes(c));
function sched(st,g){st=Object.assign({ef:2.5,iv:0,reps:0,lap:0,seen:0},st||{});const t=dn();let iv;
  if(g===1){if(st.reps)st.lap++;st.ef=Math.max(1.3,st.ef-.2);iv=0}
  else if(st.iv<1)iv={2:1,3:1,4:3}[g];
  else{const b=st.iv;iv=g===2?Math.max(b+1,Math.round(b*1.2)):g===3?Math.max(b+2,Math.round(b*st.ef)):Math.max(b+3,Math.round(b*st.ef*1.3))}
  if(g===2)st.ef=Math.max(1.3,st.ef-.15);if(g===4)st.ef=Math.min(2.8,st.ef+.15);
  if(g>1)st.reps++;st.seen++;st.iv=Math.min(3650,iv);st.d=t+st.iv;st.last=t;return st}
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
function wordTypes(v){const t=['wr','mw','ty'];if(v.example_ja&&v.example_ja.includes(v.word))t.splice(2,0,'cz');return t}
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
function studyStart(mode){const q=buildQueue(mode);SS={mode,items:q.items.slice(),i:0,done:0,again:{},res:{1:0,2:0,3:0,4:0}};if(!SS.items.length)return studyDone();studyCard()}
function studyDone(){const r=SS?SS.res:{1:0,2:0,3:0,4:0},n=r[1]+r[2]+r[3]+r[4];
  app.innerHTML=`<div class="card sdone"><div class="dseal" aria-hidden="true">${n?'済':'<span class="dck">✓</span>'}</div><div class="dpill">${n?'お疲れさま':'今日は完了'}</div><h2>${n?`Session complete · ${n} cards`:'Nothing due right now'}</h2>
   ${n?`<p class="mut">Again ${r[1]} · Hard ${r[2]} · Good ${r[3]} · Easy ${r[4]}</p>`:'<p class="mut">Every card has been seen and no reviews are due. Come back later for reviews.</p>'}
   ${(()=>{const nq=buildQueue(SS?SS.mode:'mixed');return nq.items.length?`<p class="sm">${nq.due?nq.due+' due · ':''}${nq.avail} new cards still available</p><div class="td-a"><button class="btn primary" id="kgo">Keep going → next ${Math.min(nq.items.length,nq.due+srsCfg().ss)}</button></div>`:''})()}
   <div class="td-a"><a class="btn${n?'':' primary'}" href="#home">Home</a><a class="btn" href="#study">Study options</a></div></div>`;
  const kg=$('#kgo');if(kg)kg.onclick=()=>studyStart(SS?SS.mode:'mixed')}
function frontHTML(it){const k=it.key,isW=k[0]==='w',t=it.type;
  if(isW){const v=VBY[+k.slice(1)];
    if(t==='wr')return `<p class="sp">Read it — recall the <b>reading</b> and <b>meaning</b></p><div class="sbig ja">${esc(v.word)}</div>`;
    if(t==='mw')return `<p class="sp">Recall the <b>Japanese word</b></p><div class="smean">${esc(v.meaning_en)}</div><p class="mut sm">${esc(v.part_of_speech||'')}</p>`;
    if(t==='cz')return `<p class="sp">Fill the blank — recall the <b>word</b></p><div class="scloze ja">${esc(v.example_ja).replace(esc(v.word),'<b class="blank">＿＿＿</b>')}</div><p class="mut sm">${esc(v.example_en)}</p>`;
    return `<p class="sp">Type the <b>reading</b> in kana</p><div class="sbig ja">${esc(v.word)}</div><div class="tyw"><input id="ty" lang="ja" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ひらがなで…"><button class="btn primary" id="tyc">Check</button></div>`}
  const c=k.slice(1),x=KBY[c],sv=sampleV(c);
  if(t==='km')return `<p class="sp">Recall the <b>meaning</b> and <b>on/kun</b> readings</p><div class="sbig kj">${esc(c)}</div>`;
  if(t==='kw')return `<p class="sp">Read this word — focus on <b>${esc(c)}</b></p><div class="sbig ja">${esc(sv.word).replace(esc(c),`<span class="kh">${esc(c)}</span>`)}</div>`;
  const g=simGroup(c);return `<p class="sp">Which kanji completes the word?</p><div class="sbig ja">${esc(sv.word).replace(esc(c),'<span class="kq">◯</span>')}</div><p class="mut">${esc(sv.reading)} · ${esc(sv.meaning_en)}</p>
   <div class="kopts">${shuffle(g.kanji).map(o=>`<button class="kopt" data-c="${esc(o)}">${esc(o)}</button>`).join('')}</div>`}
function mnemo(cs){return cs.map(c=>{const x=KBY[c];if(!x)return'';return `<li><b class="ja">${esc(c)}</b> ${esc((x.meaning_en||'').split(';')[0])} — radical <b class="ja">${esc(x.radical||'?')}</b>${x.stroke_count?` · ${x.stroke_count} strokes`:''}${x.onyomi&&x.onyomi.length?` · 音 ${esc(x.onyomi.join('、'))}`:''}</li>`}).join('')}
function backHTML(it){const k=it.key,isW=k[0]==='w',st=srsDB()[k]||{},leech=(st.lap||0)>=4,note=store.get('srsNote',{})[k]||'';
  const lb=leech?`<div class="leech"><b>🩹 Leech</b> — missed ${st.lap} times. ${(()=>{const cs=isW?kOfW(VBY[+k.slice(1)]):[k.slice(1)],withS=cs.filter(c=>KBY[c]&&KBY[c].mnemonic),rest=cs.filter(c=>!withS.includes(c));
   return (withS.length?'<p class="sm">Re-read the memory story above and picture it vividly.</p>':'')+(rest.length?`Break it down:<ul>${mnemo(rest)}</ul>`:'')})()}<textarea id="mn" rows="2" placeholder="Write your own mnemonic…">${esc(note)}</textarea></div>`:'';
  if(isW){const v=VBY[+k.slice(1)];
    return `<div class="sans"><div class="sbig ja">${furi&&v.word_ruby?v.word_ruby:esc(v.word)}</div><div class="srd">${esc(v.reading)} <button class="say" data-t="${esc(v.word)}" aria-label="Say word">🔊</button></div>
     <div class="smean">${esc(v.meaning_en)}</div><p class="mut sm">${esc(v.part_of_speech||'')}</p>
     ${v.example_ja?`<div class="sex"><div class="ja">${furi&&v.example_ja_ruby?v.example_ja_ruby:esc(v.example_ja)} <button class="say" data-t="${esc(v.example_ja)}" aria-label="Say example">🔊</button></div><div class="mut sm">${esc(v.example_en)}</div></div>`:''}
     <div class="slinks">${kOfW(v).map(c=>`<a class="chip ja" href="#kanji/${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}<a class="sm" href="#vocab/${encodeURIComponent(v.word)}">Open card →</a></div>${kOfW(v).filter(c=>KBY[c].mnemonic).map(c=>storyHTML(c)).join('')}${lb}</div>`}
  const c=k.slice(1),x=KBY[c],g=simGroup(c),sw=V.filter(v=>(v.kanji||[]).includes(c)).slice(0,3);
  return `<div class="sans"><div class="sbig kj">${esc(c)}</div><div class="smean">${esc(x.meaning_en)}</div>
   <div class="kread"><span class="lbl">音</span> ${esc((x.onyomi||[]).join('、')||'—')}</div><div class="kread"><span class="lbl">訓</span> ${kunHTML(x.kunyomi)}</div>
   ${sw.length?`<ul class="ksw">${sw.map(v=>`<li><span class="ja">${furi&&v.word_ruby?v.word_ruby:esc(v.word)}</span> <span class="mut sm">${esc(v.reading)} · ${esc(v.meaning_en)}</span> <button class="say" data-t="${esc(v.word)}" aria-label="Say">🔊</button></li>`).join('')}</ul>`:''}
   ${x.mnemonic?storyHTML(c):g&&g.difference?`<p class="sdiff sm">👀 ${esc(g.difference)}</p>`:''}
   <div class="slinks"><a class="sm" href="#kanji/${encodeURIComponent(c)}">Open card →</a></div>${lb}</div>`}
function studyCard(){const it0=SS.items[SS.i];if(!it0)return studyDone();
  const it=typeof it0==='string'?{key:it0}:it0;SS.items[SS.i]=it;const db=srsDB();if(!it.type)it.type=pickType(it.key,db[it.key]);
  const st=db[it.key],isNew=!st,tot=SS.items.length;
  app.innerHTML=`<div class="qtop"><div class="qprog"><div style="width:${SS.i*100/tot}%"></div></div><span class="mut sm">${SS.i+1}/${tot}</span>${aaBtn()}</div>
  <div class="scard" id="sc"><div class="stag"><span class="pill${it.key[0]==='w'?'':' sub'}">${it.key[0]==='w'?'語 word':'漢 kanji'}</span>${isNew?'<span class="pill n">new</span>':''}${st&&st.lap>=4?'<span class="pill red">leech</span>':''}${it.re?'<span class="pill sub">again</span>':''}</div>
   <div class="sfront">${frontHTML(it)}</div><div class="sback"></div></div>
  <div class="stbar" id="sbar"><button class="btn primary full" id="rv">Show answer <small class="mut">space</small></button></div>`;
  $('#rv').onclick=()=>reveal(it);
  const ty=$('#ty');if(ty){const v=VBY[+it.key.slice(1)],ok=()=>hira(ty.value)===hira(v.reading);let comp=false;ty.focus();
    ty.addEventListener('compositionstart',()=>comp=true);ty.addEventListener('compositionend',()=>{comp=false;if(ok())reveal(it,true)});
    ty.oninput=e=>{if(!comp&&!e.isComposing&&ok())reveal(it,true)};$('#tyc').onclick=()=>reveal(it,ok());
    ty.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();reveal(it,ok())}}}
  app.querySelectorAll('.kopt').forEach(b=>b.onclick=()=>{const right=b.dataset.c===it.key.slice(1);app.querySelectorAll('.kopt').forEach(o=>{o.disabled=true;if(o.dataset.c===it.key.slice(1))o.classList.add('ok');else if(o===b)o.classList.add('bad')});setTimeout(()=>reveal(it,right),reduced()?0:450)})}
function reveal(it,auto){if(SS.shown)return;SS.shown=true;const db=srsDB(),st=db[it.key];
  const sc=$('#sc');sc.classList.add('revealed');sc.querySelector('.sback').innerHTML=(auto===true?'<p class="verd ok">✓ Correct</p>':auto===false?'<p class="verd bad">✕ Not quite</p>':'')+backHTML(it);
  const sug=auto===true?3:auto===false?1:0;
  $('#sbar').innerHTML=`<div class="grades">${[[1,'Again'],[2,'Hard'],[3,'Good'],[4,'Easy']].map(([g,l])=>`<button class="gbtn g${g}${sug===g?' sug':''}" data-g="${g}"><b>${l}</b><small>${ivLabel(sched(st,g).iv)}</small></button>`).join('')}</div><p class="swh mut sm">swipe → Good · ← Again · keys 1–4</p>`;
  app.querySelectorAll('.gbtn').forEach(b=>b.onclick=()=>grade(it,+b.dataset.g));
  app.querySelectorAll('.say').forEach(b=>b.onclick=e=>{e.stopPropagation();say(b.dataset.t)});
  const mn=$('#mn');if(mn)mn.onchange=()=>{const n=store.get('srsNote',{});n[it.key]=mn.value;store.set('srsNote',n)};
  if(it.key[0]==='w'&&store.get('srsSpeak',false))say(VBY[+it.key.slice(1)].word);
  let x0=null,y0=0;sc.ontouchstart=e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY};
  sc.ontouchmove=e=>{if(x0==null)return;const dx=e.touches[0].clientX-x0;if(Math.abs(dx)>Math.abs(e.touches[0].clientY-y0)&&!reduced())sc.style.transform=`translateX(${dx*.5}px) rotate(${dx/40}deg)`};
  sc.ontouchend=e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;sc.style.transform='';if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*1.5)grade(it,dx>0?3:1)}}
function grade(it,g){if(!SS||SS.graded)return;SS.graded=true;const db=srsDB(),was=db[it.key];db[it.key]=sched(was,g);store.set('srs',db);
  if(!was){const n=store.get('srsNew',{}),d=dn();n[d]=n[d]||{w:0,k:0};n[d][it.key[0]]++;for(const k in n)if(+k<d-30)delete n[k];store.set('srsNew',n);
    if(it.key[0]==='w')store.set('srsPri',store.get('srsPri',[]).filter(k=>k!==it.key))}
  const lg=store.get('srsLog',{}),d=dn();lg[d]=lg[d]||{r:0,ok:0,n:0};if(was&&was.iv>=1){lg[d].r++;if(g>1)lg[d].ok++}else lg[d].n++;store.set('srsLog',lg);
  logActivity();SS.res[g]++;
  if(g===1&&(SS.again[it.key]||0)<3){SS.again[it.key]=(SS.again[it.key]||0)+1;SS.items.splice(Math.min(SS.items.length,SS.i+5),0,{key:it.key,re:true})}
  const sc=$('#sc');const next=()=>{SS.i++;SS.shown=false;SS.graded=false;studyCard();window.scrollTo(0,0)};
  if(sc&&!reduced()){sc.classList.add(g===1?'out-l':'out-r');setTimeout(next,180)}else next()}
document.addEventListener('keydown',e=>{if(!SS||!(cur||'').startsWith('study/')||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(!SS.shown&&(e.key===' '||e.key==='Enter')){e.preventDefault();const it=SS.items[SS.i];if(it&&!$('#ty')&&!$('.kopt'))reveal(it)}else if(SS.shown&&/^[1-4]$/.test(e.key))grade(SS.items[SS.i],+e.key)});
function storyHTML(c){const x=KBY[c],m=x&&x.mnemonic;if(!m)return'';const own=store.get('mnemo',{})[c];
  return `<div class="mnemo" data-c="${esc(c)}"><div class="mh"><b>🧠 Memory story</b><button class="mned" aria-label="Write my own story" title="Write my own">✏️</button></div>
   <div class="mparts">${m.parts.map(p=>`<span class="mpc"><b class="ja">${esc(p.part)}</b><small>${esc(p.meaning)}</small></span>`).join('<i>+</i>')}${m.parts.length===1&&m.parts[0].part===c?'':`<i>→</i><span class="mpc res"><b class="ja">${esc(c)}</b><small>${esc((x.meaning_en||'').split(';')[0])}</small></span>`}</div>
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
 <div class="card guidec"><h3>Daily routine · ~15 min</h3><ol><li><b>Reviews first</b> — clear everything due. Don't skip days; reviews pile up.</li><li><b>New cards</b> — no daily limit. They come in batches (session size, default 20); tap “Keep going” for more. Remember: every new card means reviews in the coming days, so add more only if your reviews stay under ~15 min.</li><li><b>Quiz mistakes</b> — words from questions you miss are queued automatically as priority cards.</li><li>Finish with a short quiz or one 読解 passage to see words in context.</li></ol></div>
 <div class="card guidec"><h3>Grading honestly</h3><ul><li><b>Again</b> — you didn't recall it (or only after seeing it).</li><li><b>Hard</b> — recalled with real effort or partly wrong.</li><li><b>Good</b> — recalled after a moment's thought. Most answers.</li><li><b>Easy</b> — instant, effortless.</li></ul><p class="mut sm">Swipe right = Good, left = Again. Say the word out loud — 🔊 plays it.</p></div>
 <div class="card guidec"><h3>Tips</h3><ul><li>Say readings aloud and picture the kanji before revealing.</li><li>Cards missed 4+ times become <b>leeches</b>: read the kanji breakdown and write your own mnemonic in the box.</li><li>Look-alike kanji cards train you to spot the difference — study the 👀 note.</li><li>Back up your progress from Progress → Export backup now and then.</li></ul></div>
 <a class="btn primary full" href="#study/mixed">▶ Start today's session</a>`}

window.addEventListener('hashchange',route);
window.__n1q=Q;window.__n1={pick:smartPick,nav:()=>NAV,ss:()=>SS,state:()=>S,start:(ids)=>nav('quiz/play',()=>start(Q.filter(q=>ids.includes(q.id)),store.get("quizOpts",{}),false))};
loadSess();route();
})();
