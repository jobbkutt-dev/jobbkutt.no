const $=s=>document.querySelector(s), fmt=n=>n==null?'–':n.toLocaleString('nb-NO'), host=u=>new URL(u).hostname.replace('www.','');
const tabs=()=>{const t=(location.hash||'#oversikt').slice(1);document.querySelectorAll('.tab').forEach(s=>s.classList.toggle('on',s.id===t));document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.tab===t))};
addEventListener('hashchange',tabs);tabs();
function sortable(tbl,rows,render){let k='dato',dir=-1;tbl.querySelectorAll('th[data-k]').forEach(th=>th.onclick=()=>{dir=k===th.dataset.k?-dir:1;k=th.dataset.k;go()});
 const go=()=>render(rows().sort((a,b)=>{const x=a[k]??'',y=b[k]??'';return (typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),'nb'))*dir}));return go}
Promise.all([fetch('data/cases.json').then(r=>r.json()),fetch('data/brreg.json').then(r=>r.json())]).then(([C,B])=>{
 const S=C.saker, E=B.enheter, sum=f=>S.filter(f).reduce((a,c)=>a+(c.antall||0),0);
 $('#cards').innerHTML=[[S.length,'registrerte saker (siste ~3 mnd)'],[fmt(sum(c=>c.status!=='permittering')),'berørte i varslede/vedtatte kutt*'],[fmt(sum(c=>c.status==='permittering')),'permitterte (i sakene)'],[E.filter(e=>e.type==='konkurs').length,'konkurser ≥10 ansatte (Brreg)'],[fmt(E.reduce((a,e)=>a+(e.antallAnsatte||0),0)),'reg. ansatte i konkurs/avvikling']].map(([n,l])=>`<div class="card"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');
 $('#latest').innerHTML=S.slice(0,6).map(c=>`<li><b>${c.selskap}</b> – ${fmt(c.antall)} ${c.enhet} <span class="st ${c.status}">${c.status}</span><br><small>${c.dato} · ${c.sektor}</small></li>`).join('');
 const sec={};S.forEach(c=>sec[c.sektor]=(sec[c.sektor]||0)+(c.antall||0));const mx=Math.max(...Object.values(sec));
 $('#sectors').innerHTML=Object.entries(sec).sort((a,b)=>b[1]-a[1]).map(([s,n])=>`<div class="bar"><span>${s}</span><i style="width:${n/mx*55}%"></i>${fmt(n)}</div>`).join('');
 [...new Set(S.map(c=>c.sektor))].sort().forEach(s=>$('#fsektor').add(new Option(s)));
 const go=sortable($('#tbl'),()=>S.filter(c=>(!$('#fstatus').value||c.status===$('#fstatus').value)&&(!$('#fsektor').value||c.sektor===$('#fsektor').value)&&JSON.stringify(c).toLowerCase().includes($('#q').value.toLowerCase())),
  rs=>$('#tbl tbody').innerHTML=rs.map(c=>`<tr><td>${c.dato}</td><td><b>${c.selskap}</b>${c.orgnr?`<br><small>org.nr <a href="https://virksomhet.brreg.no/nb/oppslag/enheter/${c.orgnr}">${c.orgnr}</a></small>`:''}<div class="sum">${c.oppsummering}</div></td><td>${fmt(c.antall)}<br><small>${c.enhet}<br>${c.omfang}</small></td><td><span class="st ${c.status}">${c.status}</span></td><td>${c.sektor}</td><td class="src">${c.kilder.map(u=>`<a href="${u}" target="_blank">${host(u)}</a>`).join('')}</td></tr>`).join(''));
 ['#q','#fstatus','#fsektor'].forEach(s=>$(s).oninput=go);go();
 $('#brreginfo').textContent=`Automatisk hentet fra Enhetsregisteret ${B.oppdatert.replace('T',' kl. ')} · filter: ${B.filter} · ${E.length} enheter`;
 const bgo=sortable($('#btbl'),()=>E.filter(e=>(!$('#btype').value||e.type===$('#btype').value)&&JSON.stringify(e).toLowerCase().includes($('#bq').value.toLowerCase())),
  rs=>$('#btbl tbody').innerHTML=rs.map(e=>`<tr><td>${e.dato||'–'}</td><td><a href="${e.kilde}" target="_blank">${e.navn}</a><br><small>${e.orgnr}</small></td><td>${fmt(e.antallAnsatte)}</td><td><span class="st ${e.type}">${e.type}</span></td><td>${e.bransje||''}</td><td>${e.kommune||''}</td></tr>`).join(''));
 ['#bq','#btype'].forEach(s=>$(s).oninput=bgo);bgo();
 $('#navlinks').innerHTML=S.map(c=>`<li>${c.selskap}: <a href="${c.nav_stillinger}" target="_blank">ledige stillinger på arbeidsplassen.nav.no</a></li>`).join('');
 $('#foot').textContent=`Saker oppdatert ${C.oppdatert.replace('T',' ')} · *Tall i kildene er stillinger, årsverk eller ansatte og er summert som indikasjon. Aker BP er ikke tallfestet og telles ikke.`;
});
$('#tipsform').onsubmit=e=>{e.preventDefault();$('#tipsmsg').textContent='Takk! (Utkast: tips lagres ikke ennå – ingen backend er satt opp.)'};
