const { client } = require('./_supabase');
exports.handler=async(event)=>{
  try{
    const b=JSON.parse(event.body||'{}'); const sb=client();
    const {data:p,error:e}=await sb.from('polls').select('*').eq('slug',b.slug).single(); if(e)throw e;
    if(!b.admin_token || b.admin_token!==p.admin_token) throw new Error('Admin access required');
    const webhook=(b.roster_webhook_url||p.roster_webhook_url||'').trim(); if(!webhook) throw new Error('Add a roster webhook/API adapter URL first.');
    const {data:opts}=await sb.from('poll_options').select('*').eq('poll_id',p.id).order('sort_order');
    const table=p.poll_type==='calendar'?'calendar_poll_votes':'votes';
    const {data:rows}=await sb.from(table).select('*').eq('poll_id',p.id);
    const optionById=Object.fromEntries((opts||[]).map(o=>[o.id,o]));
    const payload={source:'miplanr-poll',poll:{slug:p.slug,title:p.title,question:p.question,poll_type:p.poll_type,location:p.location},responses:(rows||[]).map(r=>({name:r.voter_name,email:r.voter_email,option:optionById[r.option_id]?.option_text||'',start_at:optionById[r.option_id]?.start_at||p.start_at,end_at:optionById[r.option_id]?.end_at||p.end_at,updated_at:r.updated_at}))};
    const res=await fetch(webhook,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    if(!res.ok) throw new Error('Roster adapter rejected sync: HTTP '+res.status);
    return {statusCode:200,body:JSON.stringify({ok:true,synced:payload.responses.length})}
  }catch(err){return {statusCode:400,body:JSON.stringify({error:err.message})}}
}
