const $ = id => document.getElementById(id);

function esc(s){return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function iconHTMLFromResult(r){
  if(!r) return '✨';
  if(r.type === 'country' && r.label){
    const code = String(r.label).toLowerCase();
    return `<img class="flag-icon" src="https://flagcdn.com/w40/${code}.png" srcset="https://flagcdn.com/w80/${code}.png 2x" alt="${esc(r.label)} flag">`;
  }
  return esc(r.icon || '✨');
}
function iconHTML(text, context=''){ return iconHTMLFromResult(miPlanrVisual.iconFor(text, context)); }
const api = path => '/.netlify/functions/' + path;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function pad(n){return String(n).padStart(2,'0')}
function nextHalfHour(){const d=new Date();d.setSeconds(0,0);d.setMinutes(d.getMinutes()<30?30:60);return d}
function dateISO(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function formatFriendlyDate(d){return pad(d.getDate())+'-'+MONTHS[d.getMonth()]+'-'+String(d.getFullYear()).slice(-2)}
function parseFriendlyDate(v){
  if(!v) return null; v=String(v).trim();
  let m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if(m) return new Date(+m[1],+m[2]-1,+m[3]);
  m=v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/); if(m){let y=+m[3]; if(y<100)y+=2000; return new Date(y,+m[2]-1,+m[1]);}
  m=v.match(/^(\d{1,2})\s*[- ]\s*([a-zA-Z]{3,9})\s*[- ]\s*(\d{2,4})$/); if(m){let y=+m[3]; if(y<100)y+=2000; const mo=MONTHS.findIndex(x=>x.toLowerCase()===m[2].slice(0,3).toLowerCase()); if(mo>=0)return new Date(y,mo,+m[1]);}
  const d=new Date(v); return isNaN(d)?null:d;
}
function formatTime12(d){let h=d.getHours(), m=pad(d.getMinutes()), ap=h>=12?'pm':'am';h=h%12||12;return h+':'+m+' '+ap}
function parseTime12(v, fallback='08:00'){
  if(!v) v=fallback; v=String(v).trim().toLowerCase().replace(/\s+/g,'');
  let m=v.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm)?$/); if(!m) return fallback;
  let h=+m[1], mi=+(m[2]||0), ap=m[3];
  if(ap==='pm' && h<12) h+=12; if(ap==='am' && h===12) h=0;
  if(!ap && h<8 && v.length<=2) h+=12; // 6 becomes 6pm as friendlier default
  return pad(Math.min(23,Math.max(0,h)))+':'+pad(Math.min(59,Math.max(0,mi)));
}
function toLocalInput(d){return dateISO(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes())}
function toOffsetDateTime(d){const off=-d.getTimezoneOffset();const sign=off>=0?'+':'-';const ah=Math.floor(Math.abs(off)/60),am=Math.abs(off)%60;return dateISO(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes())+':00'+sign+pad(ah)+':'+pad(am)}
function calendarLocalStamp(d){return dateISO(d).replace(/-/g,'')+'T'+pad(d.getHours())+pad(d.getMinutes())+'00'}
function localIsoNoZone(d){return dateISO(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes())+':00'}
function setDateTimeParts(prefix,d){if($(prefix+'Date')){$(prefix+'Date').value=$(prefix+'Date').type==='date'?dateISO(d):formatFriendlyDate(d)}if($(prefix+'Time'))$(prefix+'Time').value=formatTime12(d)}
function fromDateTimeParts(dateId,timeId,defaultTime='08:00'){
  const dd=parseFriendlyDate($(dateId)?.value||''); if(!dd) return null;
  const t=parseTime12($(timeId)?.value||'', defaultTime); return new Date(dateISO(dd)+'T'+t);
}
function parseEmails(s){return [...new Set((s||'').split(/[\s,;]+/).map(x=>x.trim().toLowerCase()).filter(x=>x.includes('@')))]}
function durationMinutes(){const unit=$('durationUnit')?.value||'hours'; const val=Number($('durationSlider')?.value||1); if(unit==='minutes')return val; if(unit==='days')return val*24*60; return val*60}
function updateDurationControls(){
  const unit=$('durationUnit')?.value||'hours'; const slider=$('durationSlider'); if(!slider)return;
  if(unit==='minutes'){slider.min=5;slider.max=180;slider.step=5;if(+slider.value>180||+slider.value<5)slider.value=30; $('durationLabel').textContent=slider.value+' minutes'}
  if(unit==='hours'){slider.min=1;slider.max=12;slider.step=1;if(+slider.value>12||+slider.value<1)slider.value=1; $('durationLabel').textContent=slider.value+' hour'+(+slider.value===1?'':'s')}
  if(unit==='days'){slider.min=1;slider.max=14;slider.step=1;if(+slider.value>14||+slider.value<1)slider.value=1; $('durationLabel').textContent=slider.value+' day'+(+slider.value===1?'':'s')}
}
function syncHiddenDateTimes(){
  if(!$('start')) return;
  const now=new Date();
  let s=fromDateTimeParts('startDate','startTime','08:00');
  if(!s){s=nextHalfHour(); setDateTimeParts('start',s)}
  let e=fromDateTimeParts('endDate','endTime',formatTime12(new Date(s.getTime()+durationMinutes()*60000)));
  if(!e || e<=s){e=new Date(s.getTime()+durationMinutes()*60000); setDateTimeParts('end',e)}
  let d=fromDateTimeParts('deadlineDate','deadlineTime','17:00');
  if(!d){d=new Date(s.getTime()-24*3600000); if(d<now)d=new Date(now.getTime()+2*3600000); setDateTimeParts('deadline',d)}
  $('start').value=toOffsetDateTime(s); $('end').value=toOffsetDateTime(e); $('deadline').value=toOffsetDateTime(d); updateDateSummary();
}
function smartTimes(){
  if(!$('start'))return; if(!$('startDate').value){const s=nextHalfHour(); setDateTimeParts('start',s); const e=new Date(s.getTime()+durationMinutes()*60000); setDateTimeParts('end',e); const d=new Date(Date.now()+2*3600000); setDateTimeParts('deadline',d)} syncHiddenDateTimes();
}
function updateDateSummary(){
  if(!$('dateSummary')) return;
  const s=$('start').value?new Date($('start').value):null, e=$('end').value?new Date($('end').value):null, d=$('deadline').value?new Date($('deadline').value):null;
  $('dateSummary').textContent=s?('📅 '+formatFriendlyDate(s)+' • '+formatTime12(s)+(e?' – '+formatTime12(e):'')+(d?' • vote by '+formatFriendlyDate(d)+' '+formatTime12(d):'')):'Date/time will appear here';
}
function applyQuickDate(kind){
  const now=new Date(); let s=nextHalfHour();
  if(kind==='today'){s=new Date();s.setHours(8,0,0,0); if(s<now)s=nextHalfHour()}
  if(kind==='tomorrow'){s=new Date();s.setDate(s.getDate()+1);s.setHours(8,0,0,0)}
  if(kind==='next30'){s=nextHalfHour()}
  if(kind==='custom'){s=fromDateTimeParts('startDate','startTime','08:00')||nextHalfHour()}
  if($('startDateWrap')) $('startDateWrap').hidden = kind !== 'custom';
  setDateTimeParts('start',s); const e=new Date(s.getTime()+durationMinutes()*60000); setDateTimeParts('end',e); const d=new Date(s.getTime()-24*3600000); if(d<now)d.setTime(now.getTime()+2*3600000); setDateTimeParts('deadline',d); syncHiddenDateTimes(); renderPreview();
}
function optionRow(v=''){
  const row=document.createElement('div');row.className='option-row';row.innerHTML=`<span class="icon-badge">✨</span><input class="opt" placeholder="e.g. New Zealand, NZ, UK, Greece, Tomato, Mango, Football" value="${String(v).replace(/"/g,'&quot;')}"><button type="button" class="btn secondary">×</button>`;
  const refresh=()=>{const r=miPlanrVisual.iconFor(row.querySelector('input').value,$('question')?.value);row.querySelector('.icon-badge').innerHTML=iconHTMLFromResult(r);};
  row.querySelector('button').onclick=()=>{row.remove();renderPreview()}; row.querySelector('input').oninput=()=>{refresh();renderPreview()}; refresh(); return row;
}
function renderPreview(){
  if(!$('pTitle'))return; syncHiddenDateTimes();
  const title=$('title').value||'Your event title';const q=$('question').value||'Your question will appear here';const loc=$('location').value||'Location';const st=$('start').value?new Date($('start').value):null;
  $('pTitle').textContent=title;$('pQuestion').textContent=q;$('pMeta').textContent=`${loc} • ${st?formatFriendlyDate(st)+' '+formatTime12(st):'Date/time'}`;$('pIcon').innerHTML=iconHTML(title+' '+q);
  const opts=[...document.querySelectorAll('.opt')].map(i=>i.value).filter(Boolean);$('pOptions').innerHTML=(opts.length?miPlanrVisual.enrichOptions(opts,q):[{icon:'✨',label:'Option preview'}]).map(o=>`<div class="choice"><span class="icon-badge">${iconHTML(o.label, q)}</span><div><b>${esc(o.label)}</b><div class="bar" style="width:0%"></div><small>0%</small></div></div>`).join('')
}
async function suggestPlaces(q){if(!q||q.length<3)return [];try{const r=await fetch(api('place-suggest')+'?q='+encodeURIComponent(q));return await r.json()}catch(e){return[]}}


// v6.9 free-first poll translation.
// In-page translation uses the free MyMemory endpoint where available, and the button also
// provides a Google Translate website fallback for whole-page browser translation.
const MI_TRANSLATE_LANGS = {
  en:{label:'English', mm:'en'},
  fr:{label:'French', mm:'fr'},
  es:{label:'Spanish', mm:'es'},
  it:{label:'Italian', mm:'it'},
  pt:{label:'Portuguese', mm:'pt'},
  de:{label:'German', mm:'de'},
  'zh-CN':{label:'Mandarin Chinese', mm:'zh-CN'},
  yue:{label:'Cantonese', mm:'zh-CN', note:'Cantonese browser translation support is limited, so Mandarin Chinese is used as the safest free in-page fallback.'},
  nan:{label:'Hokkien', mm:'zh-TW', note:'Hokkien is not reliably supported by free whole-page translators, so Traditional Chinese is used as the closest free in-page fallback.'}
};
function googleTranslateUrl(lang){
  return 'https://translate.google.com/translate?sl=auto&tl='+encodeURIComponent(lang)+'&u='+encodeURIComponent(location.href);
}
function ensureTranslatePanel(hostId){
  let panel=$('translatePanel');
  if(panel) return panel;
  panel=document.createElement('div');
  panel.id='translatePanel';
  panel.className='translate-panel notice';
  panel.innerHTML=`<b>Translate poll</b><div class="translate-row"><select id="translateLang">${Object.entries(MI_TRANSLATE_LANGS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select><button type="button" class="btn" id="applyTranslate">Translate this poll</button><button type="button" class="btn secondary" id="googleTranslate">Open Google Translate</button></div><small id="translateStatus">Translates the page, poll question, options, descriptions, placeholders and typed inputs. Free translation can be approximate.</small>`;
  const host=$(hostId)||document.querySelector('.card')||document.body;
  host.prepend(panel);
  $('googleTranslate').onclick=()=>window.open(googleTranslateUrl($('translateLang').value),'_blank');
  $('applyTranslate').onclick=()=>translateCurrentPage($('translateLang').value);
  return panel;
}
async function mmTranslate(text, target){
  text=String(text||'').trim(); if(!text) return text;
  const lang=MI_TRANSLATE_LANGS[target]||MI_TRANSLATE_LANGS.en;
  if(target==='en') return text;
  const url='https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair=en|'+encodeURIComponent(lang.mm);
  const r=await fetch(url); if(!r.ok) throw new Error('translation failed');
  const j=await r.json(); return j?.responseData?.translatedText || text;
}
function getOriginal(el, attr){
  const key='original'+attr.charAt(0).toUpperCase()+attr.slice(1);
  if(!el.dataset[key]) el.dataset[key]=attr==='text'?el.nodeValue:(el.getAttribute(attr)||el.value||'');
  return el.dataset[key];
}
function textNodesUnder(root){
  const out=[]; const skip=new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME']);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
    if(!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
    const p=n.parentElement; if(!p||skip.has(p.tagName)||p.closest('#translatePanel')) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;
  }});
  while(walker.nextNode()) out.push(walker.currentNode);
  return out;
}
async function translateCurrentPage(lang){
  ensureTranslatePanel(document.body.dataset.page==='poll'?'pollMount':null);
  const status=$('translateStatus'); const button=$('applyTranslate');
  button.disabled=true; button.textContent='Translating…'; status.textContent='Translating visible poll text and form fields…';
  try{
    const root=document.querySelector('main')||document.body;
    const jobs=[];
    for(const n of textNodesUnder(root)){
      const original=getOriginal(n,'text');
      jobs.push(mmTranslate(original,lang).then(t=>{n.nodeValue=t;}));
    }
    for(const el of root.querySelectorAll('input, textarea')){
      if(el.type==='hidden' || el.type==='date' || el.type==='range' || el.type==='number') continue;
      const val=el.value && el.value.trim();
      const ph=el.getAttribute('placeholder');
      if(val){const original=getOriginal(el,'value'); jobs.push(mmTranslate(original,lang).then(t=>{el.value=t;}));}
      if(ph){const key='originalPlaceholder'; if(!el.dataset[key]) el.dataset[key]=ph; jobs.push(mmTranslate(el.dataset[key],lang).then(t=>el.setAttribute('placeholder',t)));}
    }
    await Promise.all(jobs);
    const note=MI_TRANSLATE_LANGS[lang]?.note;
    status.textContent= note || 'Translation applied. Use English to reset before translating to another language.';
    if(typeof renderPreview==='function' && document.body.dataset.page==='create') renderPreview();
  }catch(e){
    status.textContent='In-page translation could not complete. Opening Google Translate fallback…';
    window.open(googleTranslateUrl(lang),'_blank');
  }finally{button.disabled=false; button.textContent='Translate this poll';}
}

function initCreate(){
  updateDurationControls(); smartTimes();
  $('quickDate')?.addEventListener('change', e=>applyQuickDate(e.target.value));
  applyQuickDate($('quickDate')?.value||'next30');
  $('durationUnit')?.addEventListener('change',()=>{updateDurationControls(); const s=fromDateTimeParts('startDate','startTime','08:00')||nextHalfHour(); const e=new Date(s.getTime()+durationMinutes()*60000); setDateTimeParts('end',e); syncHiddenDateTimes(); renderPreview()});
  $('durationSlider')?.addEventListener('input',()=>{updateDurationControls(); const s=fromDateTimeParts('startDate','startTime','08:00')||nextHalfHour(); const e=new Date(s.getTime()+durationMinutes()*60000); setDateTimeParts('end',e); syncHiddenDateTimes(); renderPreview()});
  ['startDate','startTime','endDate','endTime','deadlineDate','deadlineTime'].forEach(id=>$(id)&&$(id).addEventListener('input',()=>{if(id==='startDate' && $('quickDate')) $('quickDate').value='custom'; if($('startDateWrap')) $('startDateWrap').hidden = $('quickDate')?.value !== 'custom'; syncHiddenDateTimes();renderPreview()}));
  ['New Zealand','United Kingdom','Greece'].forEach(v=>$('options').appendChild(optionRow(v)));
  document.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input',renderPreview));
  $('addOption').onclick=()=>{$('options').appendChild(optionRow());renderPreview()}; $('previewBtn').onclick=renderPreview;
  $('translateBtn').onclick=()=>ensureTranslatePanel(null);
  $('location').addEventListener('input',async e=>{const box=$('placeSuggestions');const items=await suggestPlaces(e.target.value);box.innerHTML=items.slice(0,5).map(p=>`<button type="button" data-lat="${p.lat||''}" data-lon="${p.lon||''}">${p.label||p.display_name}</button>`).join('');box.style.display=items.length?'block':'none';box.querySelectorAll('button').forEach(b=>b.onclick=()=>{$('location').value=b.textContent;$('location').dataset.lat=b.dataset.lat||'';$('location').dataset.lon=b.dataset.lon||'';box.style.display='none';renderPreview()})});
  renderPreview();
  $('pollForm').onsubmit=async ev=>{
    ev.preventDefault(); syncHiddenDateTimes(); const btn=ev.submitter||document.querySelector('button[type=submit]'); btn.disabled=true;
    try{const options=[...document.querySelectorAll('.opt')].map(i=>i.value.trim()).filter(Boolean);if(options.length<2){alert('Please add at least two options.');return}
      const enrichedOpts=miPlanrVisual.enrichOptions(options,$('question').value);const payload={title:$('title').value,question:$('question').value,description:$('description').value,location:$('location').value,place_label:$('location').value,place_lat:$('location').dataset.lat||null,place_lon:$('location').dataset.lon||null,maps_url:($('location').dataset.lat&&$('location').dataset.lon)?('https://www.openstreetmap.org/?mlat='+$('location').dataset.lat+'&mlon='+$('location').dataset.lon+'#map=16/'+$('location').dataset.lat+'/'+$('location').dataset.lon):'',creator:$('creator').value||'miPlanr creator',start_at:$('start').value,end_at:$('end').value,deadline_at:$('deadline').value,threshold:Number($('threshold').value||3),options,option_icons:enrichedOpts.map(x=>x.icon),emails:parseEmails($('emails').value)};
      $('createMsg').innerHTML='<div class="notice">Creating your smart poll…</div>';const res=await fetch(api('create-poll'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});let data={}; try{data=await res.json()}catch(e){} if(!res.ok){$('createMsg').innerHTML='<div class="notice">Error: '+(data.error||'Could not create poll')+'</div>';return}
      const link=location.origin+'/poll.html?slug='+encodeURIComponent(data.slug);$('shareLink').value=link;$('sharePanel').classList.add('visible');$('copyBtn').onclick=()=>navigator.clipboard.writeText(link);$('waBtn').onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent('Please vote on my miPlanr poll: '+link),'_blank');$('openBtn').onclick=()=>window.open(link,'_blank');
      let inviteHtml='';
      if(data.invite_status){
        const st=data.invite_status;
        if(st.sent>0) inviteHtml+=`<div class="notice">✅ ${st.sent} invite email${st.sent===1?'':'s'} sent.</div>`;
        if(st.skipped||st.sent<(st.requested||0)) inviteHtml+=`<div class="notice">⚠️ Invite email not fully sent: ${esc(st.reason||((st.requested||0)-st.sent)+' failed')}</div>`;
      }
      if(data.invite_links&&data.invite_links.length){
        inviteHtml+=`<div class="notice"><b>Invite links:</b><br>${data.invite_links.map(x=>`${esc(x.email)}: <a href="${x.link}" target="_blank">open poll</a> · <a href="mailto:${encodeURIComponent(x.email)}?subject=${encodeURIComponent('Please vote on my miPlanr poll')}&body=${encodeURIComponent('Please vote here: '+x.link)}">send via your email</a>`).join('<br>')}</div>`;
      }
      $('createMsg').innerHTML='<div class="notice">🎉 Poll created. Share options are now ready.</div>'+inviteHtml;
    }catch(e){$('createMsg').innerHTML='<div class="notice">Error: '+e.message+'</div>'}finally{btn.disabled=false;}
  }
}
async function initPoll(){
  const params=new URLSearchParams(location.search);const slug=params.get('slug')||location.pathname.split('/').pop();const invite=params.get('invite')||'';const res=await fetch(api('get-poll')+'?slug='+encodeURIComponent(slug)+'&invite='+encodeURIComponent(invite));const data=await res.json();if(!res.ok){$('pollMount').innerHTML='<p>Could not load poll.</p>';return}const p=data.poll;const total=data.votes.reduce((a,v)=>a+Number(v.count),0);const voteMap=Object.fromEntries(data.votes.map(v=>[v.option_id,Number(v.count)]));const opts=p.options||[];const enriched=opts.map(o=>({ ...o, visual: miPlanrVisual.iconFor(o.option_text,p.question)}));let selected=data.my_vote?.option_id||'';
  $('pollMount').innerHTML=`<div class="poll-card"><div class="poll-head"><div style="font-size:42px">${iconHTML(p.title+' '+p.question)}</div><h2>${p.title}</h2><p>${p.question}</p><small>${p.location||''} ${p.start_at?' • '+formatFriendlyDate(new Date(p.start_at))+' '+formatTime12(new Date(p.start_at)):''}</small></div><div class="poll-body"><p>${p.description||''}</p><div id="voteChoices"></div><input id="voterName" placeholder="Your name"><input id="voterEmail" placeholder="Your email"><div class="actions"><button class="btn" id="voteNow">${data.my_vote?'Update my vote':'Cast my vote'}</button><button class="btn secondary" id="gcal">Google Calendar</button><button class="btn secondary" id="ocal">Outlook</button><button class="btn pink" id="pollTranslateBtn">Translate</button></div><div id="voteMsg"></div></div></div>`;
  function draw(){document.getElementById('voteChoices').innerHTML=enriched.map(o=>{const c=voteMap[o.id]||0;const pct=total?Math.round(c/total*100):0;return `<label class="choice vote-option"><input type="radio" name="opt" value="${o.id}" ${selected===o.id?'checked':''}><span class="icon-badge">${iconHTMLFromResult(o.visual)}</span><div class="choice-content"><b>${esc(o.option_text || o.label || '')}</b><div class="bar" style="width:${pct}%"></div><small>${c} vote${c===1?'':'s'} • ${pct}%</small></div></label>`}).join('')+`<div class="notice">${total} of ${p.threshold||3} votes received ${total>=(p.threshold||3)?'🎉 quorum reached':''}</div>`}draw();document.querySelectorAll('input[name=opt]').forEach(r=>r.onchange=e=>selected=e.target.value); $('pollTranslateBtn').onclick=()=>ensureTranslatePanel('pollMount');
  $('voteNow').onclick=async()=>{
    if(!selected){alert('Choose an option first');return}
    const btn=$('voteNow'); btn.disabled=true; btn.textContent='Saving vote…';
    try{
      const rr=await fetch(api('cast-vote'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,invite_token:invite,option_id:selected,voter_name:$('voterName').value,voter_email:$('voterEmail').value})});
      let jd={}; try{jd=await rr.json()}catch(e){}
      if(!rr.ok){$('voteMsg').innerHTML='<div class="notice">Error: '+(jd.error||'Vote could not be saved')+'</div>'; return;}
      // Force the public results to refresh after Supabase saves the vote.
      // This avoids the old issue where the database saved correctly but the screen still showed 0 votes.
      $('voteMsg').innerHTML='<div class="notice">✅ Vote saved. Updating results…</div>';
      const fresh=await fetch(api('get-poll')+'?slug='+encodeURIComponent(slug)+'&invite='+encodeURIComponent(invite)+'&t='+Date.now());
      if(fresh.ok){
        const latest=await fresh.json();
        const latestTotal=latest.votes.reduce((a,v)=>a+Number(v.count),0);
        const latestMap=Object.fromEntries(latest.votes.map(v=>[v.option_id,Number(v.count)]));
        document.getElementById('voteChoices').innerHTML=enriched.map(o=>{const c=latestMap[o.id]||0;const pct=latestTotal?Math.round(c/latestTotal*100):0;return `<label class="choice vote-option"><input type="radio" name="opt" value="${o.id}" ${selected===o.id?'checked':''}><span class="icon-badge">${iconHTMLFromResult(o.visual)}</span><div class="choice-content"><b>${esc(o.option_text || o.label || '')}</b><div class="bar" style="width:${pct}%"></div><small>${c} vote${c===1?'':'s'} • ${pct}%</small></div></label>`}).join('')+`<div class="notice">${latestTotal} of ${p.threshold||3} votes received ${latestTotal>=(p.threshold||3)?'🎉 quorum reached':''}</div>`;
        document.querySelectorAll('input[name=opt]').forEach(r=>r.onchange=e=>selected=e.target.value);
        $('voteMsg').innerHTML='<div class="notice">✅ Vote saved and results updated.</div>';
      } else {
        location.reload();
      }
    }catch(e){
      $('voteMsg').innerHTML='<div class="notice">Error: '+e.message+'</div>';
    }finally{
      btn.disabled=false; btn.textContent='Update my vote';
    }
  };
  function calUrl(provider){const text=encodeURIComponent(p.title);const details=encodeURIComponent((p.description||'')+'\nPoll: '+location.href);const loc=encodeURIComponent(p.location||p.place_label||'');const s=p.start_at?new Date(p.start_at):new Date();const e=p.end_at?new Date(p.end_at):new Date(s.getTime()+3600000);if(provider==='google')return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${loc}&dates=${calendarLocalStamp(s)}/${calendarLocalStamp(e)}`;return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${text}&body=${details}&location=${loc}&startdt=${encodeURIComponent(localIsoNoZone(s))}&enddt=${encodeURIComponent(localIsoNoZone(e))}`}$('gcal').onclick=()=>window.open(calUrl('google'),'_blank');$('ocal').onclick=()=>window.open(calUrl('outlook'),'_blank')
}
document.addEventListener('DOMContentLoaded',()=>{const page=document.body.dataset.page;if(page==='create')initCreate();if(page==='poll')initPoll()});
