const $=s=>document.querySelector(s), fmt=n=>n==null?'–':n.toLocaleString('nb-NO');
// JSON text is escaped before innerHTML. hrefs must be https:; javascript:, data:, and http: are not linked.
const ESC={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>ESC[c]);
function httpsUrl(v){const raw=String(v??'').trim();if(!raw||/[\u0000-\u001f\u007f]/.test(raw))return '';try{const url=new URL(raw);if(url.protocol!=='https:'||!url.hostname)return '';return url.href}catch{return ''}}
const host=u=>{try{return new URL(u).hostname.replace('www.','')}catch{return ''}};
const cls=v=>/^[A-Za-z0-9_æøåÆØÅ-]+$/.test(String(v??''))?String(v):'';
function link(url,text,blank){const href=httpsUrl(url),label=esc(text);if(!href)return label;return `<a href="${esc(href)}"${blank?' target="_blank" rel="noopener noreferrer"':''}>${label}</a>`}
const srcLinks=list=>(Array.isArray(list)?list:[]).map(u=>{const href=httpsUrl(u);return href?link(href,host(href),true):''}).join('');
function orgnrHtml(orgnr){if(orgnr==null||orgnr==='')return '';const id=String(orgnr);const body=/^\d{9}$/.test(id)?link('https://virksomhet.brreg.no/nb/oppslag/enheter/'+id,id,false):esc(id);return `<br><small>org.nr ${body}</small>`}
const badge=status=>{const token=cls(status);return `<span class="st${token?' '+token:''}">${esc(status)}</span>`};
const kind=(type,label)=>{const token=cls(type);return `<span class="kind${token?' '+token:''}">${esc(label)}</span>`};
const barWidth=(n,mx)=>{const w=n/mx*55;return Number.isFinite(w)?w:0};
const tabs=()=>{const t=(location.hash||'#oversikt').slice(1);document.querySelectorAll('.tab').forEach(s=>s.classList.toggle('on',s.id===t));document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.tab===t))};
addEventListener('hashchange',tabs);tabs();
function sortable(tbl,rows,render){let k='dato',dir=-1;tbl.querySelectorAll('th[data-k]').forEach(th=>th.onclick=()=>{dir=k===th.dataset.k?-dir:1;k=th.dataset.k;go()});
 const go=()=>render(rows().sort((a,b)=>{const x=a[k]??'',y=b[k]??'';return k==='dato'&&x===y?String(a.selskap||a.navn||'').localeCompare(String(b.selskap||b.navn||''),'nb'):(typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),'nb'))*dir}));return go}
Promise.all([fetch('data/cases.json',{cache:'no-cache'}).then(r=>r.json()),fetch('data/brreg.json',{cache:'no-cache'}).then(r=>r.json())]).then(([C,B])=>{
 const S=C.saker, E=B.enheter, sum=f=>S.filter(f).reduce((a,c)=>a+(c.antall||0),0), lbl={konkurs:'Konkurs',avvikling:'Avvikling',tvangsavvikling:'Tvangsavvikling'};
 $('#cards').innerHTML=[[S.length,'registrerte saker (siste ~3 mnd)'],[fmt(sum(c=>c.status!=='permittering')),'berørte i varslede/vedtatte kutt*'],[fmt(sum(c=>c.status==='permittering')),'permitterte (i sakene)'],[E.filter(e=>e.type==='konkurs').length,'konkurser ≥10 ansatte (Brreg)'],[fmt(E.reduce((a,e)=>a+(e.antallAnsatte||0),0)),'reg. ansatte i konkurs/avvikling']].map(([n,l])=>`<div class="card"><div class="n">${esc(n)}</div><div class="l">${esc(l)}</div></div>`).join('');
 $('#latest').innerHTML=[...S.map(c=>({d:c.dato||'',h:`<li>${kind('nb','Nedbemanning')} <b>${esc(c.selskap)}</b> – ${esc(fmt(c.antall))} ${esc(c.enhet)} ${badge(c.status)}<br><small>${esc(c.dato)} · ${esc(c.sektor)}</small></li>`})),...E.filter(e=>e.dato).map(e=>({d:e.dato,h:`<li>${kind(e.type,lbl[e.type]||e.type)} <b>${link(e.kilde,e.navn,true)}</b> – ${esc(fmt(e.antallAnsatte))} reg. ansatte<br><small>${esc(e.dato)} · ${esc(e.bransje||'')}${e.kommune?' · '+esc(e.kommune):''}</small></li>`}))].sort((a,b)=>b.d.localeCompare(a.d)).slice(0,10).map(x=>x.h).join('');
 const sec={};S.forEach(c=>sec[c.sektor]=(sec[c.sektor]||0)+(c.antall||0));const mx=Math.max(...Object.values(sec));
 $('#sectors').innerHTML=Object.entries(sec).sort((a,b)=>b[1]-a[1]).map(([s,n])=>`<div class="bar"><span>${esc(s)}</span><i style="width:${barWidth(n,mx)}%"></i>${esc(fmt(n))}</div>`).join('');
 [...new Set(S.map(c=>c.sektor))].sort().forEach(s=>$('#fsektor').add(new Option(s)));
 const go=sortable($('#tbl'),()=>S.filter(c=>(!$('#fstatus').value||c.status===$('#fstatus').value)&&(!$('#fsektor').value||c.sektor===$('#fsektor').value)&&JSON.stringify(c).toLowerCase().includes($('#q').value.toLowerCase())),
  rs=>$('#tbl tbody').innerHTML=rs.map(c=>`<tr><td>${esc(c.dato)}</td><td><b>${esc(c.selskap)}</b>${orgnrHtml(c.orgnr)}<div class="sum">${esc(c.oppsummering)}</div></td><td>${esc(fmt(c.antall))}<br><small>${esc(c.enhet)}<br>${esc(c.omfang)}</small></td><td>${badge(c.status)}</td><td>${esc(c.sektor)}</td><td class="src">${srcLinks(c.kilder||c.sources)}</td></tr>`).join(''));
 ['#q','#fstatus','#fsektor'].forEach(s=>$(s).oninput=go);go();
 $('#brreginfo').textContent=`Automatisk hentet fra Enhetsregisteret ${B.oppdatert.replace('T',' kl. ')} · filter: ${B.filter} · ${E.length} enheter`;
 const bgo=sortable($('#btbl'),()=>E.filter(e=>(!$('#btype').value||e.type===$('#btype').value)&&JSON.stringify(e).toLowerCase().includes($('#bq').value.toLowerCase())),
  rs=>$('#btbl tbody').innerHTML=rs.map(e=>`<tr><td>${esc(e.dato||'–')}</td><td>${link(e.kilde,e.navn,true)}<br><small>${esc(e.orgnr)}</small></td><td>${esc(fmt(e.antallAnsatte))}</td><td>${badge(e.type)}</td><td>${esc(e.bransje||'')}</td><td>${esc(e.kommune||'')}</td></tr>`).join(''));
 ['#bq','#btype'].forEach(s=>$(s).oninput=bgo);bgo();
 $('#foot').textContent=`Sist oppdatert ${C.oppdatert.replace('T',' ')} · *Tall i kildene er stillinger, årsverk eller ansatte og er summert som indikasjon. Aker BP er ikke tallfestet og telles ikke.`;
});
$('#tipsform').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),body=`Selskap: ${f.get('selskap')}\nKilde: ${f.get('url')}\nAntall berørte: ${f.get('antall')||'–'}\nKommentar: ${f.get('kommentar')||''}`;location.href=`mailto:kontakt@jobbkutt.no?subject=${encodeURIComponent('Tips: '+f.get('selskap'))}&body=${encodeURIComponent(body)}`;$('#tipsmsg').textContent='Takk! E-postprogrammet ditt åpnes med tipset ferdig utfylt – trykk send der. Du kan også skrive direkte til kontakt@jobbkutt.no.'};

function fmtSjekket(t){const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(t||'');return m?`Sist sjekket ${m[3]}.${m[2]}.${m[1]} kl. ${m[4]}:${m[5]}`:''}
fetch('data/status.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(S=>{const t=S&&fmtSjekket(S.sist_sjekket);if(!t)return;const f=document.getElementById('foot');if(!f)return;let e=document.getElementById('sjekket');if(!e){e=document.createElement('div');e.id='sjekket';e.className='note';f.parentNode.insertBefore(e,f)}e.textContent=t}).catch(()=>{});
