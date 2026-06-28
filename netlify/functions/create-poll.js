const { client } = require('./_supabase');
const crypto = require('crypto');
const slug=()=>crypto.randomBytes(5).toString('hex');
const token=()=>crypto.randomBytes(12).toString('hex');
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

exports.handler=async(event)=>{
  try{
    const body=JSON.parse(event.body||'{}');
    const sb=client();
    const poll={
      slug:slug(),title:body.title,question:body.question,description:body.description||'',creator:body.creator||'',creator_name:body.creator||'',
      location:body.location||'',address_line1:body.address_line1||'',city:body.city||'',postcode:body.postcode||'',place_label:body.place_label||body.location||'',
      place_lat:body.place_lat||null,place_lon:body.place_lon||null,maps_url:body.maps_url||'',
      start_at:body.start_at||null,end_at:body.end_at||null,deadline_at:body.deadline_at||null,
      threshold:body.threshold||3,poll_type:body.poll_type||'standard',allow_vote_edit:true,notify_on_quorum:true,
      admin_token: token(), results_visible: body.results_visible !== false, roster_sync_type: body.roster_sync_type || 'none', roster_webhook_url: body.roster_webhook_url || ''
    };
    const {data:p,error:e}=await sb.from('polls').insert(poll).select('*').single();
    if(e)throw e;

    const options=(body.options||[]).map((o,i)=>{const co=(body.calendar_options&&body.calendar_options[i])||{};return {poll_id:p.id,option_text:o,label:o,icon:(body.option_icons&&body.option_icons[i])||'✨',sort_order:i,start_at:co.start_at||null,end_at:co.end_at||null}});
    if(options.length){const {error:oe}=await sb.from('poll_options').insert(options);if(oe)throw oe;}

    const emails=[...new Set((body.emails||[]).filter(Boolean).map(x=>String(x).trim().toLowerCase()))];
    const participants=emails.map(email=>({poll_id:p.id,email,invite_token:token()}));
    let inviteRows=[];
    if(participants.length){
      const {data:ps,error:pe}=await sb.from('participants').insert(participants).select('*');
      if(pe)throw pe;
      inviteRows=ps||[];
    }
    const invite_status=await sendInvites(p,inviteRows);
    const origin=(process.env.URL||process.env.SITE_URL||'https://miplanr.com').replace(/\/$/,'');
    const invite_links=inviteRows.map(part=>({email:part.email,link:`${origin}/poll.html?slug=${encodeURIComponent(p.slug)}&invite=${encodeURIComponent(part.invite_token)}`}));
    return {statusCode:200,body:JSON.stringify({slug:p.slug,id:p.id,admin_token:p.admin_token,invite_status,invite_links})}
  }catch(err){return {statusCode:500,body:JSON.stringify({error:err.message})}}
}

async function sendInvites(p,participants){
  const origin=(process.env.URL||process.env.SITE_URL||'https://miplanr.com').replace(/\/$/,'');
  if(!participants.length)return {requested:0,sent:0,skipped:true,reason:'No invite emails entered.'};
  if(!process.env.RESEND_API_KEY)return {requested:participants.length,sent:0,skipped:true,reason:'RESEND_API_KEY is not set in Netlify environment variables.'};
  const from=process.env.RESEND_FROM_EMAIL||'miPlanr <poll@mail.miplanr.com>';
  const results=[];
  for(const part of participants){
    const link=`${origin}/poll.html?slug=${encodeURIComponent(p.slug)}&invite=${encodeURIComponent(part.invite_token)}`;
    const html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h1>🗳️ ${esc(p.title)}</h1><p>${esc(p.question)}</p><p><b>Location:</b> ${esc(p.location||p.place_label||'TBC')}</p><p><b>When:</b> ${esc(p.start_at||'TBC')}</p><p><a style="background:#0072FF;color:white;padding:12px 18px;border-radius:10px;text-decoration:none" href="${link}">Vote now</a></p><p style="color:#667">Powered by miPlanr — Dream • Plan • Soar</p></div>`;
    const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${process.env.RESEND_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({from,to:part.email,subject:`🗳️ ${p.creator||'Someone'} invited you to vote: ${p.title}`,html})});
    let data={}; try{data=await r.json()}catch(e){}
    results.push({email:part.email,ok:r.ok,status:r.status,error:r.ok?null:(data.message||data.error||'Email provider rejected the invite')});
  }
  return {requested:participants.length,sent:results.filter(x=>x.ok).length,skipped:false,results};
}
