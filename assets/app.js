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
function formatTime12Compact(d){return formatTime12(d).replace(':00','')}
function formatLongDayDate(d){return d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}
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

function calendarOptionRow(data={}){
  const d = data.start ? new Date(data.start) : nextHalfHour();
  const mins = data.duration_minutes || Math.max(15, Math.round(((data.end?new Date(data.end):new Date(d.getTime()+60*60000))-d)/60000)) || 60;
  const row=document.createElement('div'); row.className='calendar-option-row calendar-option-card';
  row.innerHTML=`<input class="calDate" type="date" value="${dateISO(d)}" hidden><input class="calStart" type="text" value="${formatTime12(d)}" hidden><select class="calDuration" hidden><option value="30">30 mins</option><option value="45">45 mins</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option><option value="180">3 hours</option><option value="240">4 hours</option><option value="480">Full day</option></select><button type="button" class="cal-pill cal-date-pill calOpen" aria-label="Choose date"></button><button type="button" class="cal-pill cal-start-pill calOpen" aria-label="Choose start time"></button><span class="cal-dash">–</span><button type="button" class="cal-pill cal-end-pill calOpen" aria-label="Choose end time"></button><button type="button" class="btn secondary calRemove" aria-label="Remove option">×</button>`;
  row.querySelector('.calDuration').value=String([30,45,60,90,120,180,240,480].includes(mins)?mins:60);
  const refresh=()=>{const opt=calendarOptionFromRow(row); if(opt){const sdt=new Date(opt.start_at), edt=new Date(opt.end_at); row.querySelector('.cal-date-pill').textContent=formatLongDayDate(sdt); row.querySelector('.cal-start-pill').textContent=formatTime12Compact(sdt); row.querySelector('.cal-end-pill').textContent=formatTime12Compact(edt);} renderPreview()};
  row.querySelector('.calRemove').onclick=()=>{row.remove();renderPreview()};
  row.querySelectorAll('.calOpen').forEach(b=>b.onclick=()=>openCalendarPicker(row));
  row.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',refresh));
  refresh();
  return row;
}
function calendarOptionFromRow(row){
  const dd=parseFriendlyDate(row.querySelector('.calDate')?.value||''); if(!dd) return null;
  const st=parseTime12(row.querySelector('.calStart')?.value||'','08:00');
  const dur=Number(row.querySelector('.calDuration')?.value||60);
  const start=new Date(dateISO(dd)+'T'+st), end=new Date(start.getTime()+dur*60000);
  return {label:formatFriendlyDate(start)+' '+formatTime12(start)+' - '+formatTime12(end), start_at:toOffsetDateTime(start), end_at:toOffsetDateTime(end), duration_minutes:dur};
}
function openCalendarPicker(row){
  let modal=$('calPickerModal');
  if(!modal){
    modal=document.createElement('div'); modal.id='calPickerModal'; modal.className='cal-modal';
    modal.innerHTML=`<div class="cal-dialog"><div class="cal-dialog-head"><strong>Choose calendar option</strong><button type="button" class="btn secondary" id="calClose">×</button></div><div class="cal-tabs"><button type="button" class="mini-chip active" data-view="month">Month</button><button type="button" class="mini-chip" data-view="week">Week</button><button type="button" class="mini-chip" data-view="day">Day</button></div><div id="calPickerBody"></div><div class="row"><div><label>Start time</label><input id="calPickTime" type="text" placeholder="8:00 am"></div><div><label>Duration</label><select id="calPickDuration"><option value="30">30 mins</option><option value="45">45 mins</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option><option value="180">3 hours</option><option value="240">4 hours</option><option value="480">Full day</option></select></div></div><div class="actions"><button type="button" class="btn" id="calApply">Use this date/time</button></div></div>`;
    document.body.appendChild(modal);
  }
  let current=parseFriendlyDate(row.querySelector('.calDate').value)||new Date();
  $('calPickTime').value=row.querySelector('.calStart').value||'8:00 am';
  $('calPickDuration').value=row.querySelector('.calDuration').value||'60';
  let view='month';
  const draw=()=>{
    modal.querySelectorAll('.cal-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    const body=$('calPickerBody');
    if(view==='month'){
      const first=new Date(current.getFullYear(),current.getMonth(),1), start=new Date(first); start.setDate(start.getDate()-((start.getDay()+6)%7));
      let cells=''; for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);cells+=`<button type="button" class="cal-day ${d.getMonth()!==current.getMonth()?'muted':''} ${dateISO(d)===dateISO(current)?'active':''}" data-date="${dateISO(d)}"><b>${d.getDate()}</b><small>${MONTHS[d.getMonth()]}</small></button>`}
      body.innerHTML=`<div class="cal-nav"><button type="button" class="btn secondary" id="calPrev">‹</button><strong>${MONTHS[current.getMonth()]} ${current.getFullYear()}</strong><button type="button" class="btn secondary" id="calNext">›</button></div><div class="cal-grid">${cells}</div>`;
      $('calPrev').onclick=()=>{current.setMonth(current.getMonth()-1);draw()}; $('calNext').onclick=()=>{current.setMonth(current.getMonth()+1);draw()};
      body.querySelectorAll('.cal-day').forEach(b=>b.onclick=()=>{current=parseFriendlyDate(b.dataset.date); view='day'; draw()});
    } else if(view==='week'){
      const start=new Date(current); start.setDate(start.getDate()-((start.getDay()+6)%7));
      let cells=''; for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);cells+=`<button type="button" class="cal-day ${dateISO(d)===dateISO(current)?'active':''}" data-date="${dateISO(d)}"><b>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</b><small>${d.getDate()} ${MONTHS[d.getMonth()]}</small></button>`}
      body.innerHTML=`<div class="cal-nav"><button type="button" class="btn secondary" id="calPrev">‹ week</button><strong>Week of ${formatFriendlyDate(start)}</strong><button type="button" class="btn secondary" id="calNext">week ›</button></div><div class="cal-grid week">${cells}</div>`;
      $('calPrev').onclick=()=>{current.setDate(current.getDate()-7);draw()}; $('calNext').onclick=()=>{current.setDate(current.getDate()+7);draw()};
      body.querySelectorAll('.cal-day').forEach(b=>b.onclick=()=>{current=parseFriendlyDate(b.dataset.date); view='day'; draw()});
    } else {
      const slots=[]; for(let h=6;h<=22;h++){const d=new Date(current);d.setHours(h,0,0,0);slots.push(`<button type="button" class="mini-chip cal-slot" data-time="${formatTime12(d)}">${formatTime12(d)}</button>`)}
      body.innerHTML=`<div class="cal-nav"><button type="button" class="btn secondary" id="calPrev">‹ day</button><strong>${formatFriendlyDate(current)}</strong><button type="button" class="btn secondary" id="calNext">day ›</button></div><div class="cal-slots">${slots.join('')}</div>`;
      $('calPrev').onclick=()=>{current.setDate(current.getDate()-1);draw()}; $('calNext').onclick=()=>{current.setDate(current.getDate()+1);draw()};
      body.querySelectorAll('.cal-slot').forEach(b=>b.onclick=()=>{$('calPickTime').value=b.dataset.time});
    }
  };
  modal.querySelectorAll('.cal-tabs button').forEach(b=>b.onclick=()=>{view=b.dataset.view;draw()});
  $('calClose').onclick=()=>modal.classList.remove('open');
  $('calApply').onclick=()=>{row.querySelector('.calDate').value=dateISO(current);row.querySelector('.calStart').value=$('calPickTime').value;row.querySelector('.calDuration').value=$('calPickDuration').value;row.querySelectorAll('input,select')[0].dispatchEvent(new Event('input'));modal.classList.remove('open')};
  draw(); modal.classList.add('open');
}
function isCalendarPoll(){return $('pollType')?.value==='calendar'}
function getCalendarOptions(){
  return [...document.querySelectorAll('.calendar-option-row')].map(calendarOptionFromRow).filter(Boolean);
}
function resetOptionsForMode(){
  if(!$('options')) return; $('options').innerHTML='';
  const dateCard=document.querySelector('.datetime-card');
  if(dateCard) dateCard.hidden=isCalendarPoll();
  if(isCalendarPoll()){
    if($('optionsLabel')) $('optionsLabel').textContent='Calendar date/time options';
    if($('optionsHint')) $('optionsHint').textContent='Each option has its own date, start time and duration. Use Open calendar for month, week or day style selection. Voters can tick Yes for every date they can do.';
    [0,1,2].forEach(i=>{const d=nextHalfHour(); d.setDate(d.getDate()+i); $('options').appendChild(calendarOptionRow({start:d,end:new Date(d.getTime()+60*60000)}));});
  } else {
    if($('optionsLabel')) $('optionsLabel').textContent='Options';
    if($('optionsHint')) $('optionsHint').textContent='Add the choices. miPlanr automatically adds flags/icons, foods, drinks, sports teams and travel icons.';
    ['Option 1','Option 2','Option 3'].forEach(v=>$('options').appendChild(optionRow(v)));
  }
  renderPreview();
}

function renderPreview(){
  if(!$('pTitle'))return; syncHiddenDateTimes();
  const title=$('title').value||'Your event title';const q=$('question').value||'Your question will appear here';const loc=$('location').value||'Location';const st=$('start').value?new Date($('start').value):null;
  $('pTitle').textContent=title;$('pQuestion').textContent=q;$('pMeta').textContent=`${loc} • ${st?formatFriendlyDate(st)+' '+formatTime12(st):'Date/time'}`;$('pIcon').innerHTML=iconHTML(title+' '+q);
  const opts=isCalendarPoll()?getCalendarOptions().map(o=>o.label):[...document.querySelectorAll('.opt')].map(i=>i.value).filter(Boolean);$('pOptions').innerHTML=(opts.length?miPlanrVisual.enrichOptions(opts,q):[{icon:'✨',label:'Option preview'}]).map(o=>`<div class="choice"><span class="icon-badge">${isCalendarPoll()?'📅':iconHTML(o.label, q)}</span><div><b>${esc(o.label)}</b><div class="bar" style="width:0%"></div><small>${isCalendarPoll()?'Yes / available':'0%'}</small></div></div>`).join('')
}
async function suggestPlaces(q){if(!q||q.length<3)return [];try{const r=await fetch(api('place-suggest')+'?q='+encodeURIComponent(q));return await r.json()}catch(e){return[]}}


// v7.1 poll-first translation bar.
// Uses the free Google Translate website widget for whole-page translation and keeps a clear fallback link.
const MI_TRANSLATE_LANGS = {
  en:{label:'English', gt:'en'},
  fr:{label:'French', gt:'fr'},
  es:{label:'Spanish', gt:'es'},
  it:{label:'Italian', gt:'it'},
  pt:{label:'Portuguese', gt:'pt'},
  de:{label:'German', gt:'de'},
  'zh-CN':{label:'Mandarin Chinese', gt:'zh-CN'},
  yue:{label:'Cantonese', gt:'zh-TW', note:'Cantonese support is limited in free browser translation, so Traditional Chinese is used as the closest fallback.'},
  nan:{label:'Hokkien', gt:'zh-TW', note:'Hokkien support is limited in free browser translation, so Traditional Chinese is used as the closest fallback.'}
};
function googleTranslateUrl(lang){
  const gt=(MI_TRANSLATE_LANGS[lang]||MI_TRANSLATE_LANGS.en).gt;
  return 'https://translate.google.com/translate?sl=auto&tl='+encodeURIComponent(gt)+'&u='+encodeURIComponent(location.href);
}
function setTranslateCookie(lang){
  const gt=(MI_TRANSLATE_LANGS[lang]||MI_TRANSLATE_LANGS.en).gt;
  const val=lang==='en'?'/en/en':'/auto/'+gt;
  const host=location.hostname;
  document.cookie='googtrans='+val+';path=/;max-age=31536000';
  if(host.includes('.')) document.cookie='googtrans='+val+';path=/;domain=.'+host.split('.').slice(-2).join('.')+';max-age=31536000';
}
window.googleTranslateElementInit=function(){
  try{
    new google.translate.TranslateElement({pageLanguage:'en', includedLanguages:'en,fr,es,it,pt,de,zh-CN,zh-TW', autoDisplay:false}, 'google_translate_element');
  }catch(e){}
};
function loadGoogleTranslate(){
  return new Promise(resolve=>{
    if(window.google && google.translate && google.translate.TranslateElement) return resolve();
    if(document.getElementById('googleTranslateScript')) return setTimeout(resolve,1200);
    const s=document.createElement('script');
    s.id='googleTranslateScript';
    s.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.onload=()=>setTimeout(resolve,1200);
    s.onerror=()=>resolve();
    document.head.appendChild(s);
  });
}
function tryGoogleCombo(lang){
  const gt=(MI_TRANSLATE_LANGS[lang]||MI_TRANSLATE_LANGS.en).gt;
  const combo=document.querySelector('.goog-te-combo');
  if(combo){ combo.value=gt; combo.dispatchEvent(new Event('change')); return true; }
  return false;
}
async function applyWholePageTranslation(lang){
  const status=$('translateStatus');
  if(status) status.textContent='Translating the whole poll…';
  setTranslateCookie(lang);
  await loadGoogleTranslate();
  let ok=tryGoogleCombo(lang);
  if(!ok){ setTimeout(()=>tryGoogleCombo(lang),1000); }
  const note=MI_TRANSLATE_LANGS[lang]?.note;
  if(status) status.textContent=(note?note+' ':'')+'If the page has not changed after a few seconds, use Google Translate fallback.';
}
function mountTranslateBar(hostId){
  let bar=$('miTranslateBar');
  const host=$(hostId)||document.querySelector('main')||document.body;
  if(!bar){
    bar=document.createElement('div');
    bar.id='miTranslateBar';
    bar.className='translate-bar';
    bar.innerHTML=`<div class="translate-main"><strong>🌍 Translate poll</strong><select id="translateLang" aria-label="Translate language">${Object.entries(MI_TRANSLATE_LANGS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select><button type="button" class="btn pink" id="applyTranslate">Translate</button><button type="button" class="btn secondary" id="googleTranslate">Open in Google Translate</button></div><div id="google_translate_element" class="google-translate-box"></div><small id="translateStatus">Translate first, then all poll headers, questions, answers and buttons should appear in the selected language.</small>`;
    host.insertBefore(bar, host.firstChild);
    $('applyTranslate').onclick=()=>applyWholePageTranslation($('translateLang').value);
    $('googleTranslate').onclick=()=>window.open(googleTranslateUrl($('translateLang').value),'_blank');
    loadGoogleTranslate();
  } else if(bar.parentElement!==host){
    host.insertBefore(bar, host.firstChild);
  }
  return bar;
}
function openTranslatePanel(hostId){ mountTranslateBar(hostId); applyWholePageTranslation($('translateLang')?.value||'es'); }

function initCreate(){
  mountTranslateBar('pollForm');
  updateDurationControls(); smartTimes();
  $('quickDate')?.addEventListener('change', e=>applyQuickDate(e.target.value));
  applyQuickDate($('quickDate')?.value||'next30');
  $('durationUnit')?.addEventListener('change',()=>{updateDurationControls(); const s=fromDateTimeParts('startDate','startTime','08:00')||nextHalfHour(); const e=new Date(s.getTime()+durationMinutes()*60000); setDateTimeParts('end',e); syncHiddenDateTimes(); renderPreview()});
  $('durationSlider')?.addEventListener('input',()=>{updateDurationControls(); const s=fromDateTimeParts('startDate','startTime','08:00')||nextHalfHour(); const e=new Date(s.getTime()+durationMinutes()*60000); setDateTimeParts('end',e); syncHiddenDateTimes(); renderPreview()});
  ['startDate','startTime','endDate','endTime','deadlineDate','deadlineTime'].forEach(id=>$(id)&&$(id).addEventListener('input',()=>{if(id==='startDate' && $('quickDate')) $('quickDate').value='custom'; if($('startDateWrap')) $('startDateWrap').hidden = $('quickDate')?.value !== 'custom'; syncHiddenDateTimes();renderPreview()}));
  resetOptionsForMode(); $('pollType')?.addEventListener('change', resetOptionsForMode);
  document.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input',renderPreview));
  $('addOption').onclick=()=>{$('options').appendChild(isCalendarPoll()?calendarOptionRow():optionRow());renderPreview()}; $('previewBtn').onclick=renderPreview;
  $('translateBtn').onclick=()=>openTranslatePanel('pollForm');
  $('pollForm')?.addEventListener('keydown',e=>{if(e.key==='Enter' && e.target && e.target.tagName==='INPUT'){e.preventDefault();}});
  $('location').addEventListener('input',async e=>{const box=$('placeSuggestions');const typed=e.target.value;const items=await suggestPlaces(typed); if(e.target.value!==typed)return; box.innerHTML=items.slice(0,5).map(p=>`<button type="button" data-lat="${p.lat||''}" data-lon="${p.lon||''}">${p.label||p.display_name}</button>`).join('');box.style.display=items.length?'block':'none';box.querySelectorAll('button').forEach(b=>b.onclick=()=>{$('location').value=b.textContent;$('location').dataset.lat=b.dataset.lat||'';$('location').dataset.lon=b.dataset.lon||'';box.style.display='none';renderPreview()})});
  renderPreview();
  $('pollForm').onsubmit=async ev=>{
    ev.preventDefault(); syncHiddenDateTimes(); const btn=ev.submitter||document.querySelector('button[type=submit]'); btn.disabled=true;
    try{const calendarOptions=isCalendarPoll()?getCalendarOptions():[]; const options=isCalendarPoll()?calendarOptions.map(o=>o.label):[...document.querySelectorAll('.opt')].map(i=>i.value.trim()).filter(Boolean);if(options.length<2){alert('Please add at least two options.');return}
      const enrichedOpts=miPlanrVisual.enrichOptions(options,$('question').value);const payload={poll_type:isCalendarPoll()?'calendar':'standard',title:$('title').value,question:$('question').value,description:$('description').value,location:$('location').value,place_label:$('location').value,place_lat:$('location').dataset.lat||null,place_lon:$('location').dataset.lon||null,maps_url:($('location').dataset.lat&&$('location').dataset.lon)?('https://www.openstreetmap.org/?mlat='+$('location').dataset.lat+'&mlon='+$('location').dataset.lon+'#map=16/'+$('location').dataset.lat+'/'+$('location').dataset.lon):'',creator:$('creator').value||'miPlanr creator',start_at:$('start').value,end_at:$('end').value,deadline_at:$('deadline').value,threshold:Number($('threshold').value||3),results_visible:$('resultsVisible')?$('resultsVisible').checked:true,roster_webhook_url:$('rosterWebhook')?.value||'',options,calendar_options:calendarOptions,option_icons:isCalendarPoll()?options.map(x=>'📅'):enrichedOpts.map(x=>x.icon),emails:parseEmails($('emails').value)};
      $('createMsg').innerHTML='<div class="notice">Creating your smart poll…</div>';const res=await fetch(api('create-poll'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});let data={}; try{data=await res.json()}catch(e){} if(!res.ok){$('createMsg').innerHTML='<div class="notice">Error: '+(data.error||'Could not create poll')+'</div>';return}
      const link=location.origin+'/poll.html?slug='+encodeURIComponent(data.slug);const adminLink=link+'&admin='+encodeURIComponent(data.admin_token||'');$('shareLink').value=link;$('sharePanel').classList.add('visible');$('copyBtn').onclick=()=>navigator.clipboard.writeText(link);$('waBtn').onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent('Please vote on my miPlanr poll: '+link),'_blank');$('openBtn').onclick=()=>window.open(link,'_blank');
      let inviteHtml='';
      if(data.invite_status){
        const st=data.invite_status;
        if(st.sent>0) inviteHtml+=`<div class="notice">✅ ${st.sent} invite email${st.sent===1?'':'s'} sent.</div>`;
        if(st.skipped||st.sent<(st.requested||0)) inviteHtml+=`<div class="notice">⚠️ Invite email not fully sent: ${esc(st.reason||((st.requested||0)-st.sent)+' failed')}</div>`;
      }
      if(data.invite_links&&data.invite_links.length){
        inviteHtml+=`<div class="notice"><b>Invite links:</b><br>${data.invite_links.map(x=>`${esc(x.email)}: <a href="${x.link}" target="_blank">open poll</a> · <a href="mailto:${encodeURIComponent(x.email)}?subject=${encodeURIComponent('Please vote on my miPlanr poll')}&body=${encodeURIComponent('Please vote here: '+x.link)}">send via your email</a>`).join('<br>')}</div>`;
      }
      $('createMsg').innerHTML='<div class="notice">🎉 Poll created. Share options are now ready.</div><div class="notice"><b>Admin results link:</b><br><input readonly value="'+esc(adminLink)+'" onclick="this.select()"><small>Keep this link for administrators. It can show results, export to Excel/Google Sheets and sync to roster planning.</small></div>'+inviteHtml;
    }catch(e){$('createMsg').innerHTML='<div class="notice">Error: '+e.message+'</div>'}finally{btn.disabled=false;}
  }
}
async function initPoll(){
  const params=new URLSearchParams(location.search);const slug=params.get('slug')||location.pathname.split('/').pop();const invite=params.get('invite')||'';const admin=params.get('admin')||'';
  const adminParam=admin?'&admin='+encodeURIComponent(admin):'';
  const res=await fetch(api('get-poll')+'?slug='+encodeURIComponent(slug)+'&invite='+encodeURIComponent(invite)+adminParam);const data=await res.json();if(!res.ok){$('pollMount').innerHTML='<p>Could not load poll.</p>';return}
  let p=data.poll;const isCal=p.poll_type==='calendar';let resultRows=data.result_rows||[];const total=data.votes.reduce((a,v)=>a+Number(v.count),0);let voteMap=Object.fromEntries(data.votes.map(v=>[v.option_id,Number(v.count)]));const opts=p.options||[];const enriched=opts.map(o=>({ ...o, visual: miPlanrVisual.iconFor(o.option_text,p.question)}));let selected=isCal?new Set(data.my_vote?.option_ids||[]):new Set(data.my_vote?.option_id?[data.my_vote.option_id]:[]);
  $('pollMount').innerHTML=`<div class="poll-card"><div class="poll-head"><div style="font-size:42px">${isCal?'📅':iconHTML(p.title+' '+p.question)}</div><h2>${esc(p.title)}</h2><p>${esc(p.question)}</p><small>${esc(p.location||'')} ${p.start_at?' • '+formatFriendlyDate(new Date(p.start_at))+' '+formatTime12(new Date(p.start_at)):''}</small></div><div class="poll-body"><p>${esc(p.description||'')}</p><div id="voteChoices"></div><input id="voterName" placeholder="Your name"><input id="voterEmail" placeholder="Your email"><div class="actions"><button class="btn" id="voteNow">${data.my_vote?'Update my vote':'Cast my vote'}</button><button class="btn secondary" id="gcal">Google Calendar</button><button class="btn secondary" id="ocal">Outlook</button></div><div id="voteMsg"></div><div id="calendarAddList" class="calendar-add-list"></div><div id="resultsMount"></div><div id="adminMount"></div></div></div>`;
  mountTranslateBar('pollMount');
  function draw(currentTotal=total,currentMap=voteMap){
    document.getElementById('voteChoices').innerHTML=enriched.map(o=>{const c=currentMap[o.id]||0;const pct=currentTotal?Math.round(c/currentTotal*100):0;const checked=selected.has(o.id)?'checked':'';const inputType=isCal?'checkbox':'radio';return `<label class="choice vote-option"><input type="${inputType}" name="opt" value="${o.id}" ${checked}><span class="icon-badge">${isCal?'📅':iconHTMLFromResult(o.visual)}</span><div class="choice-content"><b>${esc(o.option_text || o.label || '')}</b><div class="bar" style="width:${pct}%"></div><small>${c} yes${c===1?'':'es'} • ${pct}%</small></div></label>`}).join('')+`<div class="notice">${isCal?'Calendar poll: tick every date you can do.':'One option only.'} ${currentTotal} yes response${currentTotal===1?'':'s'} received ${currentTotal>=(p.threshold||3)?'🎉 quorum reached':''}</div>`;
    document.querySelectorAll('input[name=opt]').forEach(r=>r.onchange=e=>{if(isCal){e.target.checked?selected.add(e.target.value):selected.delete(e.target.value)}else{selected=new Set([e.target.value])};renderCalendarLinks()});
  }
  draw();
  function optionDates(o){const s=o.start_at?new Date(o.start_at):(p.start_at?new Date(p.start_at):new Date());const e=o.end_at?new Date(o.end_at):(p.end_at?new Date(p.end_at):new Date(s.getTime()+3600000));return {s,e}}
  function calUrlForOption(o,provider){const text=encodeURIComponent(p.title+' - '+(o.option_text||o.label||''));const details=encodeURIComponent((p.description||'')+'\nPoll: '+location.href);const loc=encodeURIComponent(p.location||p.place_label||'');const {s,e}=optionDates(o);if(provider==='google')return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${loc}&dates=${calendarLocalStamp(s)}/${calendarLocalStamp(e)}`;return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${text}&body=${details}&location=${loc}&startdt=${encodeURIComponent(localIsoNoZone(s))}&enddt=${encodeURIComponent(localIsoNoZone(e))}`}
  function renderCalendarLinks(){const chosen=enriched.filter(o=>selected.has(o.id));if(!isCal||!chosen.length){$('calendarAddList').innerHTML='';return}$('calendarAddList').innerHTML='<div class="notice"><b>Add your Yes dates to calendar:</b></div>'+chosen.map(o=>`<div class="choice"><span class="icon-badge">📅</span><div><b>${esc(o.option_text||o.label||'')}</b><br><a href="${calUrlForOption(o,'google')}" target="_blank">Google Calendar</a> · <a href="${calUrlForOption(o,'outlook')}" target="_blank">Outlook</a></div></div>`).join('')}
  function csvText(){const optionById=Object.fromEntries(enriched.map(o=>[o.id,o]));const rows=[['Poll','Question','Name','Email','Date/time option','Start','End','Updated']];(resultRows||[]).forEach(r=>{const o=optionById[r.option_id]||{};rows.push([p.title,p.question,r.voter_name||'',r.voter_email||'',o.option_text||o.label||'',o.start_at||p.start_at||'',o.end_at||p.end_at||'',r.updated_at||r.created_at||''])});return rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n')}
  function downloadCsv(){const blob=new Blob([csvText()],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(p.slug||'miplanr-poll')+'-results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
  function renderResults(){
    if(!data.can_see_results){$('resultsMount').innerHTML='<div class="notice">Results are hidden by the administrator.</div>';return}
    const optionById=Object.fromEntries(enriched.map(o=>[o.id,o]));
    const rows=(resultRows||[]).map(r=>{const o=optionById[r.option_id]||{};return `<tr><td>${esc(r.voter_name||'')}</td><td>${esc(r.voter_email||'')}</td><td>${esc(o.option_text||o.label||'')}</td><td>${esc(o.start_at?formatFriendlyDate(new Date(o.start_at))+' '+formatTime12(new Date(o.start_at)):'')}</td><td>${esc(o.end_at?formatFriendlyDate(new Date(o.end_at))+' '+formatTime12(new Date(o.end_at)):'')}</td></tr>`}).join('');
    $('resultsMount').innerHTML=`<section class="results-panel"><h3>Poll results <span class="status-pill">${resultRows.length} yes row${resultRows.length===1?'':'s'}</span></h3><p class="hint">Results by date/time and person. CSV opens in Excel and can be imported or pasted into Google Sheets.</p><div class="actions"><button class="btn secondary" id="downloadCsv">Download Excel/CSV</button><button class="btn secondary" id="copySheets">Copy for Google Sheets</button></div><div class="results-table-wrap"><table class="results-table"><thead><tr><th>Name</th><th>Email</th><th>Option</th><th>Start</th><th>End</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No results yet.</td></tr>'}</tbody></table></div></section>`;
    $('downloadCsv').onclick=downloadCsv;$('copySheets').onclick=async()=>{await navigator.clipboard.writeText(csvText());$('voteMsg').innerHTML='<div class="notice">✅ Results copied. Paste into Google Sheets.</div>'}
  }
  function renderAdmin(){
    if(!data.is_admin)return;
    $('adminMount').innerHTML=`<section class="admin-panel"><h3>Administrator controls</h3><label class="toggle-line"><input id="adminResultsVisible" type="checkbox" ${p.results_visible?'checked':''}> Team can see poll results</label><p class="hint">Turn this off to hide names/results from everyone except administrators using this admin link.</p><label>Roster / rota sync webhook</label><input id="adminWebhook" value="${esc(p.roster_webhook_url||'')}" placeholder="ChurchSuite / Teamo / Google Sheets / Zapier / Make adapter URL"><div class="actions"><button class="btn secondary" id="saveAdminSettings">Save access settings</button><button class="btn" id="syncRoster">Sync to roster planner</button></div><p class="hint">The sync sends name, email, option/date, start and end time. A ChurchSuite, Teamo or Sheets adapter can then overwrite/update rota planning and push confirmed rota data back into miPlanr Poll calendar in a later integration step.</p></section>`;
    $('saveAdminSettings').onclick=async()=>{const rr=await fetch(api('update-poll-settings'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,admin_token:admin,results_visible:$('adminResultsVisible').checked,roster_webhook_url:$('adminWebhook').value})});let jd={};try{jd=await rr.json()}catch(e){};if(!rr.ok){$('voteMsg').innerHTML='<div class="notice">Error: '+esc(jd.error||'Could not save settings')+'</div>';return}p=jd.poll;data.can_see_results=data.is_admin||p.results_visible;$('voteMsg').innerHTML='<div class="notice">✅ Admin settings saved.</div>';renderResults();renderAdmin();}
    $('syncRoster').onclick=async()=>{const rr=await fetch(api('sync-roster'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,admin_token:admin,roster_webhook_url:$('adminWebhook').value})});let jd={};try{jd=await rr.json()}catch(e){};$('voteMsg').innerHTML=rr.ok?'<div class="notice">✅ Synced '+jd.synced+' rows to roster adapter.</div>':'<div class="notice">Error: '+esc(jd.error||'Sync failed')+'</div>'}
  }
  renderResults();renderAdmin();
  $('voteNow').onclick=async()=>{const chosen=[...selected]; if(!chosen.length){alert(isCal?'Tick at least one date you can do.':'Choose an option first');return}const btn=$('voteNow'); btn.disabled=true; btn.textContent='Saving vote…';try{const rr=await fetch(api('cast-vote'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,invite_token:invite,option_id:chosen[0],option_ids:chosen,voter_name:$('voterName').value,voter_email:$('voterEmail').value})});let jd={}; try{jd=await rr.json()}catch(e){}if(!rr.ok){$('voteMsg').innerHTML='<div class="notice">Error: '+(jd.error||'Vote could not be saved')+'</div>'; return;}$('voteMsg').innerHTML='<div class="notice">✅ Vote saved. Updating results…</div>';const fresh=await fetch(api('get-poll')+'?slug='+encodeURIComponent(slug)+'&invite='+encodeURIComponent(invite)+adminParam+'&t='+Date.now());if(fresh.ok){const latest=await fresh.json(); const latestTotal=latest.votes.reduce((a,v)=>a+Number(v.count),0); voteMap=Object.fromEntries(latest.votes.map(v=>[v.option_id,Number(v.count)])); resultRows=latest.result_rows||[];data.can_see_results=latest.can_see_results;draw(latestTotal,voteMap); renderCalendarLinks(); renderResults(); $('voteMsg').innerHTML='<div class="notice">✅ Vote saved. Add only your Yes dates to your calendar below.</div>';} else location.reload();}catch(e){$('voteMsg').innerHTML='<div class="notice">Error: '+e.message+'</div>'}finally{btn.disabled=false; btn.textContent='Update my vote';}}
  function calUrl(provider){const text=encodeURIComponent(p.title);const details=encodeURIComponent((p.description||'')+'\nPoll: '+location.href);const loc=encodeURIComponent(p.location||p.place_label||'');const s=p.start_at?new Date(p.start_at):new Date();const e=p.end_at?new Date(p.end_at):new Date(s.getTime()+3600000);if(provider==='google')return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${loc}&dates=${calendarLocalStamp(s)}/${calendarLocalStamp(e)}`;return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${text}&body=${details}&location=${loc}&startdt=${encodeURIComponent(localIsoNoZone(s))}&enddt=${encodeURIComponent(localIsoNoZone(e))}`}
  $('gcal').onclick=()=> isCal&&selected.size?renderCalendarLinks():window.open(calUrl('google'),'_blank');$('ocal').onclick=()=> isCal&&selected.size?renderCalendarLinks():window.open(calUrl('outlook'),'_blank'); renderCalendarLinks();
}
document.addEventListener('DOMContentLoaded',()=>{const page=document.body.dataset.page;if(page==='create')initCreate();if(page==='poll')initPoll()});
