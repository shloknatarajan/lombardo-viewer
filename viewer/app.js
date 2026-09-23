'use strict';
const $ = id => document.getElementById(id);
const dataset = window.LOMBARDO;
if (!dataset) throw new Error('Dataset failed to load. Keep data/dataset.js in the data/ folder alongside viewer/.');
const all = dataset.rows;
const endpoints = ['cl','vdss','halfLife','fu','mrt'];
const fields = {
  name:['Compound',''], cl:['CL','mL/min/kg'], vdss:['VDss','L/kg'], halfLife:['Half-life','h'],
  fu:['fu','fraction'], mrt:['MRT','h'], mw:['MW','g/mol'], year:['Disclosure','year'],
  logP:['MoKa LogP',''],logD:['MoKa LogD₇.₄',''],tpsa:['TPSA_NO','Å²']
};
const columns = ['name', ...endpoints, 'mw'];
let filtered = [], page = 0, sortKey = 'name', direction = 1, points = [];
const pageSize = 25;
const format = value => value == null || value === '' ? '—' : typeof value === 'number' ? String(Number(value.toPrecision(6))) : value;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite = value => typeof value === 'number' && Number.isFinite(value);
const searchable = new Map(all.map(r => [r.sourceRow, [r.name,r.cas,r.smiles,r.reference,r.comments,r.notes].join(' ').toLocaleLowerCase()]));

for (const state of [...new Set(all.map(r=>r.ionState).filter(Boolean))].sort()) {
  $('ion').add(new Option(state, state));
}
for (const axis of ['x-axis','y-axis']) {
  for (const key of [...endpoints,'mw','logP','logD','tpsa']) {
    $(axis).add(new Option(fields[key].join(' · '),key));
  }
}
$('x-axis').value='vdss'; $('y-axis').value='cl';
$('columns').innerHTML = columns.map(key => `<th scope="col" data-key="${key}"><button data-sort="${key}">${fields[key][0]} <span class="sort-mark"></span><span class="unit">${fields[key][1] || 'name / identifier'}</span></button></th>`).join('');

function applyFilters() {
  const q = $('search').value.trim().toLocaleLowerCase();
  const state = $('ion').value, metric = $('metric').value;
  const min = $('min').value === '' ? null : Number($('min').value);
  const max = $('max').value === '' ? null : Number($('max').value);
  const invalid = min !== null && max !== null && min > max;
  $('filter-error').textContent = invalid ? 'Minimum must be less than or equal to maximum.' : '';
  filtered = invalid ? [] : all.filter(r => (!q || searchable.get(r.sourceRow).includes(q)) &&
    (!state || r.ionState === state) && (!$('complete').checked || endpoints.every(k=>finite(r[k]))) &&
    (min === null || (finite(r[metric]) && r[metric] >= min)) &&
    (max === null || (finite(r[metric]) && r[metric] <= max)));
  page = 0;
  sortRows(); renderTable(); drawPlot();
}
function sortRows() {
  filtered.sort((a,b) => {
    if (a[sortKey] == null) return b[sortKey] == null ? 0 : 1;
    if (b[sortKey] == null) return -1;
    return direction * (typeof a[sortKey] === 'number' ? a[sortKey]-b[sortKey] : String(a[sortKey]).localeCompare(String(b[sortKey])));
  });
}
function renderTable() {
  $('result-count').textContent=`${filtered.length.toLocaleString()} of 1,352 compounds`;
  const start=page*pageSize, slice=filtered.slice(start,start+pageSize);
  $('rows').innerHTML=slice.map(r=>`<tr>${columns.map(key=>key==='name' ? `<td><button class="name-button" data-record="${r.sourceRow}">${escapeHtml(r.name)}</button></td>` : `<td>${format(r[key])}</td>`).join('')}</tr>`).join('');
  $('empty').hidden=filtered.length>0;
  $('page-info').textContent=filtered.length ? `${start+1}–${Math.min(start+pageSize,filtered.length)} · Page ${page+1} of ${Math.ceil(filtered.length/pageSize)}` : '0 records';
  $('prev').disabled=page===0; $('next').disabled=start+pageSize>=filtered.length;
  $('export').disabled=!filtered.length;
  document.querySelectorAll('th[data-key]').forEach(th=> {
    const active = th.dataset.key===sortKey;
    th.setAttribute('aria-sort',active ? (direction===1 ? 'ascending':'descending'):'none');
    th.querySelector('.sort-mark').textContent=active ? (direction===1?'↑':'↓'):'';
  });
}
function openRecord(id) {
  const r=all.find(r=>r.sourceRow===Number(id)); if(!r)return;
  $('detail-title').textContent=r.name;
  const cards=endpoints.map(key=>`<div class="stat-card"><div class="num">${format(r[key])}</div><div class="label">${fields[key][0]} · ${fields[key][1]}</div></div>`).join('');
  const keys=['cas','ionState','year','mw','hba','hbd','tpsa','rotBonds','logP','logD','smiles','reference','comments','notes'];
  $('detail-body').innerHTML=`<p class="small-note">Human · Intravenous · Source workbook row ${r.sourceRow}</p><div class="stat-row">${cards}</div><dl>${keys.map(k=>`<dt>${escapeHtml(dataset.meta.columns[k])}</dt><dd class="${k==='smiles'?'smiles':''}">${escapeHtml(format(r[k]))}</dd>`).join('')}</dl><p class="small-note" style="margin-top:1rem"><a href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(r.name+' pharmacokinetics')}" target="_blank" rel="noreferrer">Search PubMed for this compound ↗</a></p>`;
  $('detail').showModal(); $('detail').scrollTop=0;
}
function drawPlot() {
  const canvas=$('plot'), width=canvas.clientWidth, height=350, ratio=window.devicePixelRatio||1;
  if(!width)return;
  canvas.width=width*ratio;canvas.height=height*ratio;
  const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
  const styles=getComputedStyle(document.documentElement), color=k=>styles.getPropertyValue(k).trim();
  const xKey=$('x-axis').value,yKey=$('y-axis').value,log=$('log-scale').checked;
  const valid=filtered.filter(r=>finite(r[xKey])&&finite(r[yKey])&&(!log||(r[xKey]>0&&r[yKey]>0)));
  $('plot-status').textContent=`${valid.length.toLocaleString()} plotted · ${filtered.length-valid.length} excluded (${log?'missing or non-positive axis values':'missing axis values'}). ${log?'Both axes use a log₁₀ scale.':'Both axes use a linear scale.'}`;
  canvas.setAttribute('aria-label',`${fields[yKey][0]} versus ${fields[xKey][0]}, ${valid.length} compounds, ${log?'logarithmic':'linear'} axes. Values are available in the compound table.`);
  points=[];
  $('point-info').textContent='Select a point to view its record, or use the accessible compound table above.';
  if(!valid.length){ctx.fillStyle=color('--muted');ctx.font='13px sans-serif';ctx.fillText('No plottable values for this selection.',20,50);return;}
  const transform=v=>log?Math.log10(v):v;
  const xs=valid.map(r=>transform(r[xKey])),ys=valid.map(r=>transform(r[yKey]));
  let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  if(xmin===xmax){xmin-=.5;xmax+=.5;} if(ymin===ymax){ymin-=.5;ymax+=.5;}
  const left=65,right=18,top=15,bottom=55,w=width-left-right,h=height-top-bottom;
  const px=v=>left+(v-xmin)/(xmax-xmin)*w,py=v=>top+h-(v-ymin)/(ymax-ymin)*h;
  ctx.font='10px sans-serif';
  const tick=v=>Number((log?10**v:v).toPrecision(2)).toLocaleString('en-US',{maximumSignificantDigits:2});
  for(let i=0;i<=4;i++){
    const x=xmin+(xmax-xmin)*i/4,y=ymin+(ymax-ymin)*i/4;
    ctx.strokeStyle=color('--border');ctx.beginPath();ctx.moveTo(px(x),top);ctx.lineTo(px(x),top+h);ctx.moveTo(left,py(y));ctx.lineTo(left+w,py(y));ctx.stroke();
    ctx.fillStyle=color('--muted');ctx.textAlign='center';ctx.fillText(tick(x),px(x),top+h+18);ctx.textAlign='right';ctx.fillText(tick(y),left-8,py(y)+3);
  }
  ctx.fillStyle=color('--accent');ctx.globalAlpha=.5;
  valid.forEach(r=>{const x=px(transform(r[xKey])),y=py(transform(r[yKey]));ctx.beginPath();ctx.arc(x,y,3,0,2*Math.PI);ctx.fill();points.push({x,y,r});});ctx.globalAlpha=1;
  ctx.fillStyle=color('--fg-secondary');ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(fields[xKey].join(' · '),left+w/2,height-8);
  ctx.save();ctx.translate(12,top+h/2);ctx.rotate(-Math.PI/2);ctx.fillText(fields[yKey].join(' · '),0,0);ctx.restore();
}
function nearest(event){
  const rect=$('plot').getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
  let closest=null,distance=100;
  for(const p of points){const d=(p.x-x)**2+(p.y-y)**2;if(d<distance){closest=p;distance=d;}}
  return closest;
}
$('plot').addEventListener('mousemove',e=>{
  const p=nearest(e);$('plot').style.cursor=p?'pointer':'default';
  $('point-info').textContent=p ? `${p.r.name} · ${fields[$('x-axis').value][0]}: ${format(p.r[$('x-axis').value])} · ${fields[$('y-axis').value][0]}: ${format(p.r[$('y-axis').value])}` : 'Select a point to view its record, or use the accessible compound table above.';
});
$('plot').addEventListener('click',e=>{const p=nearest(e);if(p)openRecord(p.r.sourceRow);});
$('filters').addEventListener('submit',e=>e.preventDefault());
$('filters').addEventListener('input',applyFilters);
$('filters').addEventListener('reset',()=>setTimeout(applyFilters,0));
$('columns').addEventListener('click',e=>{const b=e.target.closest('[data-sort]');if(!b)return;direction=sortKey===b.dataset.sort?-direction:1;sortKey=b.dataset.sort;page=0;sortRows();renderTable();});
$('rows').addEventListener('click',e=>{const b=e.target.closest('[data-record]');if(b)openRecord(b.dataset.record);});
$('prev').addEventListener('click',()=>{page--;renderTable();});$('next').addEventListener('click',()=>{page++;renderTable();});
$('close-detail').addEventListener('click',()=>$('detail').close());
$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
for(const id of ['x-axis','y-axis','log-scale']) $(id).addEventListener('change',drawPlot);
new ResizeObserver(drawPlot).observe($('plot'));
$('export').addEventListener('click',()=>{
  const keys=Object.keys(dataset.meta.columns);
  const cell=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
  const csv=[keys.map(k=>cell(dataset.meta.columns[k])).join(','),...filtered.map(r=>keys.map(k=>cell(r[k])).join(','))].join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='lombardo-filtered.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
(function(){const links=document.querySelectorAll('.blog-toc a[href^="#"]');const ids=[...links].map(a=>a.hash.slice(1));function update(){let current=ids[0];for(let i=ids.length-1;i>=0;i--){const el=$(ids[i]);if(el&&el.getBoundingClientRect().top<=80){current=ids[i];break;}}links.forEach(a=>a.classList.toggle('active',a.hash==='#'+current));}window.addEventListener('scroll',update,{passive:true});update();})();
applyFilters();
