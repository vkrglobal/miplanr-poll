const API = '/api';
const $ = (id) => document.getElementById(id);
function toast(msg){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2800); }
function pollUrl(id){ return `${location.origin}/poll.html?id=${encodeURIComponent(id)}`; }
function waShare(url, text='Please vote in my miPlanr poll') { window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,'_blank'); }
function copyText(text){ navigator.clipboard.writeText(text).then(()=>toast('Copied')); }
async function api(path, options={}){
  const res = await fetch(API + path, { headers:{'Content-Type':'application/json'}, ...options });
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
