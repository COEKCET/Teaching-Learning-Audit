const GS_URL="https://script.google.com/macros/s/AKfycbwQlRV3lGWytETp4m9fvuHdqYnHxWOC8_Dkcm_IPOlMii3FDzKZhVnyOfMgTo02_kis/exec";
const $$=(s,e=document)=>[...e.querySelectorAll(s)],jp=s=>{try{return JSON.parse(s)||[]}catch{return[]}};
const $=(s,e=document)=>e.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
document.documentElement.dataset.theme=localStorage.th||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
document.body.insertAdjacentHTML('beforeend','<div id=ld><i></i></div>');
const store={get u(){return JSON.parse(sessionStorage.u||'null')}};
async function api(action,data={},quiet){
 if(!quiet)$('#ld').style.display='grid';
 try{const r=await fetch(GS_URL,{method:'POST',body:JSON.stringify({action,token:sessionStorage.t,...data})});const j=await r.json();
  if(j.error){if(j.error==='AUTH'){sessionStorage.clear();location='index.html';}throw new Error(j.error);}return j;}
 catch(e){toast(e.message);throw e;}finally{$('#ld').style.display='none';}}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3000);}
function toggleTheme(){const d=document.documentElement;d.dataset.theme=localStorage.th=d.dataset.theme==='dark'?'light':'dark';}
function boot(role,title){
 const u=store.u;if(!u||u.role!==role){location='index.html';return null;}document.body.classList.add('app');
 $('header.top').innerHTML=`<h1>${title}</h1><span>${esc(u.name)} (${esc(u.dept)})</span><button class=btn onclick=toggleTheme()>🌓</button><button class=btn onclick=chPass()>🔑</button><button class=btn onclick="sessionStorage.clear();location='index.html'">Logout</button>`;return u;}
async function chPass(){const p=prompt('New password (min 6 chars)');if(p){await api('changePassword',{newPass:p});toast('Password updated');}}
const csvParse=t=>{const R=[];let r=[],c='',q=0;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch=='"'&&t[i+1]=='"'){c+='"';i++}else if(ch=='"')q=0;else c+=ch}else if(ch=='"')q=1;else if(ch==','){r.push(c);c=''}else if(ch=='\n'||ch=='\r'){if(c||r.length){r.push(c);R.push(r);r=[];c=''}if(ch=='\r'&&t[i+1]=='\n')i++}else c+=ch}
 if(c||r.length){r.push(c);R.push(r)}const H=R.shift().map(x=>x.trim());return R.map(r=>Object.fromEntries(H.map((k,i)=>[k,(r[i]||'').trim()])));};
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();}
const tbl=(cols,rows,del)=>{const k=del===1?cols[0]:del;return`<div class=tw><table><tr>${cols.map(c=>`<th>${c}</th>`).join('')}${del?'<th></th>':''}</tr>${rows.map(r=>`<tr>${cols.map(c=>`<td data-l="${c}" class="${c==='Avg'&&r.Avg&&+r.Avg<3?'low':''}">${esc(r[c])}</td>`).join('')}${del?`<td style="white-space:nowrap"><button class="btn sm" data-ed="${esc(r[k])}">✎</button> <button class="btn red sm" data-del="${esc(r[k])}">✕</button></td>`:''}</tr>`).join('')||'<tr><td>No data</td></tr>'}</table></div>`};
const D={};async function ld(s){return D[s]=(await api('list',{sheet:s})).rows;}
// Generic CRUD module: fields [{k,label,type:text|date|time|select|multi,opts:()=>[]}]
async function crud(el,c){
 const S={};
 const inp=f=>{const o=f.opts?f.opts().map(x=>Array.isArray(x)?x:[x,x]):[],op=o.map(x=>`<option value="${esc(x[0])}">${esc(x[1])}</option>`).join('');
  if(f.type==='multi')return`<select name=${f.k}><option value="">-- Select &amp; add one by one --</option>${op}</select><div class=pl data-pl=${f.k}></div>`;
  if(f.type==='select')return`<select name=${f.k}><option value="">--</option>${op}</select>`;
  return`<input name=${f.k} type=${f.type||'text'}>`;};
 el.innerHTML=`<div class=card><h3>${c.title}</h3><div class=grid>${c.fields.map(f=>`<div><label>${f.label}</label>${inp(f)}</div>`).join('')}</div>
 <div class=row><button class=btn id=ad>＋ Add</button><button class="btn alt" id=tp>⬇ Template</button><label class="btn alt">⬆ Upload CSV<input type=file accept=.csv hidden></label></div></div><div class=card><input id=sr placeholder="🔍 Search" style="margin-bottom:10px"><div id=lst></div></div>`;
 const pl=k=>{const b=$(`[data-pl=${k}]`,el);b.innerHTML=S[k].map((x,i)=>`<span class=pi>${esc(x[1])}<button type=button data-rm=${i}>✕</button></span>`).join('')||'<small>Nothing added yet</small>';
  b.querySelectorAll('[data-rm]').forEach(x=>x.onclick=()=>{S[k].splice(+x.dataset.rm,1);pl(k);});};
 const clr=()=>c.fields.forEach(f=>{if(f.type==='multi'){S[f.k]=[];pl(f.k);}});
 c.fields.filter(f=>f.type==='multi').forEach(f=>{const e=$(`[name=${f.k}]`,el);S[f.k]=[];pl(f.k);
  e.onchange=()=>{if(!e.value)return;if(!S[f.k].some(x=>x[0]===e.value))S[f.k].push([e.value,e.options[e.selectedIndex].text]);e.value='';pl(f.k);};});
 const KEY={Users:'FacultyID',Halls:'HallNo',Duties:'DutyID',Questions:'QID'}[c.sheet];const cols=c.cols||c.fields.map(f=>f.k),dep=$('[name=Dept]',el),fac=$('[name=FacultyID]',el);
 if(dep&&fac&&dep.tagName==='SELECT')dep.onchange=()=>{fac.innerHTML='<option value="">-- Select &amp; add one by one --</option>'+D.Users.filter(u=>!dep.value||u.Dept===dep.value).map(u=>`<option value="${esc(u.FacultyID)}">${esc(u.FacultyName)} (${esc(u.FacultyID)})</option>`).join('');};
 let cur=[];const show=()=>{const q=$('#sr',el).value.toLowerCase(),L=$('#lst',el);L.innerHTML=tbl(cols,cur.filter(r=>JSON.stringify(r).toLowerCase().includes(q)),KEY);
  L.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(confirm('Delete?')){await api('del',{sheet:c.sheet,val:b.dataset.del});draw();}});
  L.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>{const r=cur.find(x=>x[KEY]===b.dataset.ed);c.fields.forEach(f=>{const e=$(`[name=${f.k}]`,el);if(f.type==='multi'){const t=[...e.options].find(o=>o.value===r[f.k]);S[f.k]=r[f.k]?[[r[f.k],t?t.text:r[f.k]]]:[];pl(f.k);}else e.value=r[f.k]||'';});el.dataset.id=r[KEY];$('#ad',el).textContent='✔ Update';scrollTo(0,0);});};
 const draw=async()=>{cur=await ld(c.sheet);show();};
 $('#sr',el).oninput=show;
 const save=async rows=>{const r=await api('add',{sheet:c.sheet,rows});toast(r.skipped?'Saved – '+r.skipped+' skipped (unknown Faculty ID)':'Saved ✔');delete el.dataset.id;$('#ad',el).textContent='＋ Add';clr();draw();};
 $('#ad',el).onclick=()=>{const o={},ms=[];c.fields.forEach(f=>{const e=$(`[name=${f.k}]`,el);if(f.type==='multi')ms.push([f.k,S[f.k].map(x=>x[0])]);else o[f.k]=e.value;});
  if(el.dataset.id&&!(KEY in o))o[KEY]=el.dataset.id;
  let rows=[o];ms.forEach(([k,vs])=>{rows=rows.flatMap(r=>vs.map(v=>({...r,[k]:v})));});
  if(!rows.length||!c.fields.filter(f=>f.req&&f.type!=='multi').every(f=>o[f.k]))return toast('Fill required fields');
  if(el.dataset.id&&rows.length>1)return toast('Select only one value while editing');save(rows);};
 $('#tp',el).onclick=()=>dl(c.sheet+'_template.csv',(c.tpl||c.fields.map(f=>f.k)).join(',')+'\n','text/csv');
 $('input[type=file]',el).onchange=async e=>{const t=await e.target.files[0].text();save(csvParse(t));e.target.value='';};
 draw();}
// ---------- Report documents ----------
// Logo (Logo.jpg in the same folder) at top center: 10 cm wide x 2 cm high
const COLLEGE='<div style="text-align:center;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:10px"><img src="'+new URL('Logo.jpg',location.href).href+'" style="width:10cm;height:2cm;display:block;margin:0 auto"><div style="font-size:14pt;font-weight:bold;margin-top:8px;text-decoration:underline">Teaching Learning Process Audit Visit Report</div></div>';
function auditDoc(reps,qs,members,title){
 const nm=m=>m.FacultyName||m.name,dp=m=>m.Dept||m.dept||'',low=s=>String(s??'').trim().toLowerCase();
 const sigOf=ms=>{const rows=[];for(let i=0;i<ms.length;i+=3)rows.push(ms.slice(i,i+3));
  return rows.map(r=>{const al=r.length===1?['center']:r.length===2?['left','right']:['left','center','right'];
   return`<tr style="page-break-inside:avoid">${r.map((m,i)=>`<td style="width:${Math.floor(100/r.length)}%;text-align:${al[i]};border:0;padding:14px 12px 0">__________________<br><b>${esc(nm(m))}</b><br>Audit Member</td>`).join('')}</tr>`;}).join('');};
 // one page per Date + Hall; every auditor of that hall gets his/her own response column
 const G=[],gm={};reps.forEach(r=>{const k=r.Date+'|'+r.HallNo;if(!gm[k]){gm[k]={Date:r.Date,HallNo:r.HallNo,Type:r.Type,R:[]};G.push(gm[k]);}gm[k].R.push(r);});
 const sec=g=>{const n=g.R.length,pr=g.R.map(r=>({r,a:JSON.parse(r.Answers||'{}'),p:JSON.parse(r.Photos||'{}')})),w=Math.floor(60/n);
  // Class hall -> only "Class" category questions, Lab -> only "Lab" category questions
  const qf=qs.filter(q=>low(q.Category)===low(g.Type)),ql=qf.length?qf:qs;
  const cell=(q,x)=>q.Type==='Photo'?(x.p[q.QID]?`<img src="https://drive.google.com/thumbnail?id=${(x.p[q.QID].match(/[-\w]{25,}/)||[''])[0]}&sz=w500" width=${n>1?120:180}><br><a href="${x.p[q.QID]}">Open photo</a>`:'-'):esc(x.a[q.QID]||'-');
  return`<div style="margin-top:14px"><div style="font-size:13pt;font-weight:bold;border-bottom:1px solid #000;margin-bottom:5px;page-break-after:avoid">Hall ${esc(g.HallNo)} (${esc(g.Type)}) &ndash; ${esc(g.Date)}</div>
  <table border=1 cellpadding=4 style="border-collapse:collapse;width:100%;margin-bottom:8px;page-break-inside:avoid"><tr><th style="width:50%">Handled By</th><th>Handling Dept</th></tr>
  ${[...new Map(g.R.map(r=>[r.HandlerName+'|'+r.HandlerDept,r])).values()].map(r=>`<tr><td>${esc(r.HandlerName)}</td><td>${esc(r.HandlerDept)}</td></tr>`).join('')}</table>
  <table border=1 cellpadding=4 style="border-collapse:collapse;width:100%"><thead><tr><th style="width:6%">S.No</th><th>Question</th>${pr.map(x=>`<th style="width:${n>1?w:30}%">Response<br><span style="font-weight:normal;font-size:9.5pt">${esc(x.r.AuditorName)}</span></th>`).join('')}</tr></thead>
  ${ql.map((q,i)=>`<tr style="page-break-inside:avoid${i===ql.length-1?';page-break-after:avoid':''}"><td style="text-align:center">${i+1}</td><td>${esc(q.Text)}</td>${pr.map(x=>`<td>${cell(q,x)}</td>`).join('')}</tr>`).join('')}</table></div>`;};
 // every Class / Lab starts on a new page with the full header, audit members and signatures
 const page=(g,i)=>{const ms=members.filter(m=>g.R.some(r=>r.AuditorID===m.FacultyID)),mm=ms.length?ms:members;
  return`<div style="font-family:'Times New Roman',Times,serif${i?';page-break-before:always':''}">${COLLEGE}${title?`<p style="text-align:center;font-size:12pt;margin:0 0 6px"><b>${esc(title)}</b></p>`:''}
 <p style="font-size:12pt;font-weight:bold;margin:8px 0 4px;page-break-after:avoid">Audit Members</p>
 <table border=1 cellpadding=4 style="border-collapse:collapse;width:100%"><thead><tr><th style="width:8%">S.No</th><th>Name</th><th>Department</th></tr></thead>${mm.map((m,j)=>`<tr><td style="text-align:center">${j+1}</td><td>${esc(nm(m))}</td><td>${esc(dp(m))}</td></tr>`).join('')}</table>
 ${sec(g)}
 <div style="page-break-inside:avoid;margin-top:10px"><table style="width:100%;border-collapse:collapse;border:0">${sigOf(mm)}</table></div></div>`;};
 return G.length?G.map(page).join(''):`<div style="font-family:'Times New Roman',Times,serif">${COLLEGE}<p style="text-align:center">No reports found for the selected period.</p></div>`;}
const wrapDoc=h=>`<html><head><meta charset=utf-8><style>@page{size:A4;margin:14mm 15mm}body,div,p,td,th,h1,h2,h3,h4,span,b,a,small{font-family:"Times New Roman",Times,serif}body{font-size:12pt;color:#000;margin:0}p{margin:4px 0}table{border-collapse:collapse;width:100%}thead{display:table-header-group}tr{page-break-inside:avoid}td,th{border:1px solid #000;padding:3px 5px;vertical-align:top;font-size:10.5pt}th{background:#d9d9d9}h4{font-size:13pt;margin:8px 0 4px;page-break-after:avoid}img{max-width:100%}</style></head><body>${h}</body></html>`;
const toWord=(n,h)=>dl(n+'.doc',wrapDoc(h),'application/msword');
const toPDF=h=>{const w=open('','_blank');w.document.write(wrapDoc(h));w.document.close();setTimeout(()=>w.print(),400);};
function docButtons(el,getHtml,name){el.insertAdjacentHTML('beforeend',`<div class=row style="margin:10px 0"><button class=btn id=dw>📄 Word</button><button class=btn id=dp>📕 PDF</button></div>`);
 $('#dw',el).onclick=()=>toWord(name,getHtml());$('#dp',el).onclick=()=>toPDF(getHtml());}
// ---------- Analytics (admin + principal) ----------
async function analytics(el){
 const [R,Du,U,Q]=await Promise.all(['Reports','Duties','Users','Questions'].map(ld));
 const avg=r=>+r.Avg||0,lowR=R.filter(r=>r.Avg&&avg(r)<3),done=new Set(R.map(r=>r.DutyID)).size;
 const grp=k=>{const m={};R.forEach(r=>{if(r.Avg)(m[r[k]]=m[r[k]]||[]).push(avg(r));});return m;};
 const bars=(m,p)=>Object.entries(m).map(([h,a])=>{const v=a.reduce((x,y)=>x+y,0)/a.length;return`<div style="margin:6px 0"><small>${p}${esc(h)} – ${v.toFixed(2)} (${a.length})</small><div class="bar ${v<3?'low':''}" style="width:${v*20}%"></div></div>`}).join('')||'No reports yet';
 const tot=R.length?(R.reduce((x,r)=>x+avg(r),0)/R.length).toFixed(2):'-';
 el.innerHTML=`<div class=stats><div class=stat><b>${Du.length}</b>Duties</div><div class=stat><b>${done}</b>Reports done</div><div class=stat><b>${Du.length-done}</b>Pending</div><div class=stat><b>${tot}</b>Avg score /5</div><div class=stat><b style="color:var(--bad)">${lowR.length}</b>Low-rated</div></div>
 <div class=card><h3>Hall-wise average</h3>${bars(grp('HallNo'),'Hall ')}</div><div class=card><h3>Department-wise (handled)</h3>${bars(grp('HandlerDept'),'')}</div>
 <div class=card><h3>Reports</h3><div class=grid><div><label>From</label><input type=date id=f1></div><div><label>To</label><input type=date id=f2></div>
 <div><label>Faculty</label><select id=ff><option value="">All</option>${U.map(u=>`<option value="${esc(u.FacultyID)}">${esc(u.FacultyName)}</option>`).join('')}</select></div>
 <div><label>Report</label><select id=rt><option value=duty>Faculty duty list</option><option value=dh>Date &amp; hall wise</option><option value=low>Low rating (&lt;3)</option><option value=pend>Pending duties</option><option value=hf>Handling faculty-wise score</option><option value=cat>Category-wise average</option><option value=aud>Full audit report (hall-wise)</option></select></div></div>
 <button class=btn id=go>Generate</button><div id=out></div></div>`;
 $('#go',el).onclick=()=>{const f1=$('#f1',el).value,f2=$('#f2',el).value,ff=$('#ff',el).value,t=$('#rt',el).value,ok=d=>(!f1||d>=f1)&&(!f2||d<=f2);
  const du=Du.filter(d=>ok(d.Date)&&(!ff||d.FacultyID===ff)),rp=R.filter(r=>ok(r.Date)&&(!ff||r.AuditorID===ff));let h='';
  if(t==='duty'){const g={};du.forEach(d=>{const k=d.FacultyName+'|'+d.Date;(g[k]??={Faculty:d.FacultyName,Dept:d.Dept,Date:d.Date,H:[],T:[]}).H.push(d.HallNo);g[k].T.push(d.VisitTime);});
   h=COLLEGE+'<h4>Faculty Duty List '+esc(f1)+' to '+esc(f2)+'</h4>'+tbl(['Faculty','Dept','Date','Halls','No. of Halls','Start Time'],Object.values(g).sort((a,b)=>a.Faculty.localeCompare(b.Faculty)||a.Date.localeCompare(b.Date)).map(x=>({...x,Halls:x.H.join(', '),'No. of Halls':x.H.length,'Start Time':x.T.sort()[0]})));}
  else if(t==='dh')h=COLLEGE+'<h4>Date &amp; Hall wise Report</h4>'+tbl(['Date','HallNo','Type','AuditorName','HandlerName','HandlerDept','Avg'],[...rp].sort((a,b)=>a.Date.localeCompare(b.Date)||a.HallNo.localeCompare(b.HallNo)));
  else if(t==='low')h=COLLEGE+'<h4>Low Rating Report (avg &lt; 3)</h4>'+tbl(['Date','HallNo','Type','AuditorName','HandlerName','HandlerDept','Avg'],rp.filter(r=>r.Avg&&avg(r)<3));
  else if(t==='pend'){const dn=new Set(R.map(r=>r.DutyID));h=COLLEGE+'<h4>Pending Duties</h4>'+tbl(['Date','HallNo','Type','FacultyName','Dept','VisitTime'],du.filter(d=>!dn.has(d.DutyID)));}
  else if(t==='hf'){const g={};rp.forEach(r=>{if(r.Avg)(g[r.HandlerName]=g[r.HandlerName]||{Faculty:r.HandlerName,Dept:r.HandlerDept,v:[]}).v.push(avg(r));});h=COLLEGE+'<h4>Handling Faculty-wise Score</h4>'+tbl(['Faculty','Dept','Reports','Avg'],Object.values(g).map(x=>({...x,Reports:x.v.length,Avg:(x.v.reduce((a,b)=>a+b,0)/x.v.length).toFixed(2)})).sort((a,b)=>a.Avg-b.Avg));}
  else if(t==='cat'){const g={};rp.forEach(r=>{const a=JSON.parse(r.Answers||'{}');Q.forEach(q=>{const x=a[q.QID];if(!x)return;const s=q.Type==='YesNo'?(x==='Yes'?5:1):q.Type==='Rating'?+x:null;if(s!=null)(g[q.Category]=g[q.Category]||[]).push(s);});});h=COLLEGE+'<h4>Category-wise Average</h4>'+tbl(['Category','Responses','Avg'],Object.entries(g).map(([k,v])=>({Category:k,Responses:v.length,Avg:(v.reduce((a,b)=>a+b,0)/v.length).toFixed(2)})));}
  else h=auditDoc(rp,Q,[...new Map(du.map(d=>[d.FacultyID,d])).values()],'Period: '+f1+' to '+f2);
  $('#out',el).innerHTML=`<div id=pv>${h}</div>`;docButtons($('#out',el),()=>$('#pv',el).innerHTML,'TLV_'+t);
  $('#out .row',el).insertAdjacentHTML('beforeend','<button class=btn id=dc>📊 Excel/CSV</button>');
  $('#dc',el).onclick=()=>{const tb=$('#pv table',el);if(tb)dl('TLV_'+t+'.csv',[...tb.rows].map(r=>[...r.cells].map(c=>'"'+c.innerText.replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv');};};
}

// ---------- Questionnaire builder (with Multiple-Choice) ----------
const QT=[['YesNo','✅ Yes / No'],['Rating','⭐ Rating (1-5)'],['Comment','💬 Comment'],['Photo','📸 GeoTag Photo'],['Choice','🔘 Multiple Choice (pick one)'],['Multi','☑️ Multiple Choice (pick many)']];
async function qbuilder(el){
 el.innerHTML=`<div class=card><h3>Questionnaire <small style="color:var(--mut)">(visible only to faculty auditors)</small></h3><div class=grid><div><label>Category</label><input id=qc list=cl><datalist id=cl></datalist></div><div><label>Answer Type</label><select id=qy>${QT.map(t=>`<option value=${t[0]}>${t[1]}</option>`).join('')}</select></div><div id=qn hidden><label>How many options?</label><input id=qk type=number min=2 max=10 value=4></div></div><label>Question</label><textarea id=qt rows=2 placeholder="Type the question"></textarea><div id=qo class=opts></div><div class=row style="margin-top:10px"><button class=btn id=qs>＋ Add Question</button><button class="btn alt" id=qx hidden>Cancel</button></div></div><div class=card><input id=sr placeholder="🔍 Search" style="margin-bottom:10px"><div id=lst></div></div>`;
 let id=null,cur=[];const ch=()=>['Choice','Multi'].includes($('#qy',el).value);
 const rend=()=>{const v=$$('#qo input',el).map(i=>i.value),n=Math.max(2,Math.min(10,+$('#qk',el).value||2)),on=ch();$('#qn',el).hidden=!on;
  $('#qo',el).innerHTML=on?Array.from({length:n},(_,i)=>`<div class=opt><b>${String.fromCharCode(65+i)}</b><input placeholder="Option ${i+1}" value="${esc(v[i]||'')}"></div>`).join(''):'';};
 const reset=()=>{id=null;$('#qt',el).value='';$('#qk',el).value=4;$('#qs',el).textContent='＋ Add Question';$('#qx',el).hidden=true;rend();};
 const show=()=>{const q=$('#sr',el).value.toLowerCase();$('#lst',el).innerHTML=tbl(['Category','Text','Type','Options'],cur.filter(r=>JSON.stringify(r).toLowerCase().includes(q)).map(r=>({...r,Options:jp(r.Options).join(' | ')})),'QID');
  $$('[data-del]',el).forEach(b=>b.onclick=async()=>{if(confirm('Delete?')){await api('del',{sheet:'Questions',val:b.dataset.del});draw();}});
  $$('[data-ed]',el).forEach(b=>b.onclick=()=>{const r=cur.find(x=>x.QID===b.dataset.ed),o=jp(r.Options);id=r.QID;$('#qc',el).value=r.Category;$('#qt',el).value=r.Text;$('#qy',el).value=r.Type;$('#qk',el).value=o.length||4;rend();
   $$('#qo input',el).forEach((i,k)=>i.value=o[k]||'');$('#qs',el).textContent='✔ Update';$('#qx',el).hidden=false;scrollTo({top:0,behavior:'smooth'});});};
 const draw=async()=>{cur=await ld('Questions');$('#cl',el).innerHTML=[...new Set(cur.map(r=>r.Category))].map(c=>`<option value="${esc(c)}">`).join('');show();};
 $('#qy',el).onchange=rend;$('#qk',el).oninput=rend;$('#sr',el).oninput=show;$('#qx',el).onclick=reset;
 $('#qs',el).onclick=async()=>{const ty=$('#qy',el).value,o=$$('#qo input',el).map(i=>i.value.trim()).filter(Boolean),c=$('#qc',el).value.trim(),t=$('#qt',el).value.trim();
  if(!c||!t)return toast('Category & question are required');if(ch()&&o.length<2)return toast('Type at least 2 options');
  const row={Category:c,Text:t,Type:ty,Options:ch()?JSON.stringify(o):''};if(id)row.QID=id;
  await api('add',{sheet:'Questions',rows:[row]});toast('Saved ✔');reset();draw();};
 rend();draw();}
