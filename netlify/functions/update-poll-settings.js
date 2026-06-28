const { client } = require('./_supabase');
exports.handler=async(event)=>{
  try{
    const b=JSON.parse(event.body||'{}'); const sb=client();
    const {data:p,error:e}=await sb.from('polls').select('*').eq('slug',b.slug).single(); if(e)throw e;
    if(!b.admin_token || b.admin_token!==p.admin_token) throw new Error('Admin access required');
    const patch={updated_at:new Date().toISOString()};
    if(typeof b.results_visible==='boolean') patch.results_visible=b.results_visible;
    if(typeof b.roster_webhook_url==='string') patch.roster_webhook_url=b.roster_webhook_url;
    const {data:updated,error:ue}=await sb.from('polls').update(patch).eq('id',p.id).select('*').single(); if(ue)throw ue;
    return {statusCode:200,body:JSON.stringify({ok:true,poll:updated})}
  }catch(err){return {statusCode:400,body:JSON.stringify({error:err.message})}}
}
