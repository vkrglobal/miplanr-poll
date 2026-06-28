const { client } = require('./_supabase');
exports.handler=async(event)=>{
  try{
    const qs=event.queryStringParameters||{};const slug=qs.slug;const invite=qs.invite||'';const admin=qs.admin||'';
    const sb=client();
    const {data:p,error:e}=await sb.from('polls').select('*').eq('slug',slug).single();if(e)throw e;
    const isAdmin=!!(admin && p.admin_token && admin===p.admin_token);
    const {data:options}=await sb.from('poll_options').select('*').eq('poll_id',p.id).order('sort_order');
    let voteRows=[];let my_vote=null;let resultRows=[];
    if(p.poll_type==='calendar'){
      const {data:cv}=await sb.from('calendar_poll_votes').select('option_id, invite_token, voter_name, voter_email, updated_at, created_at').eq('poll_id',p.id);
      voteRows=cv||[];
      if(invite){my_vote={option_ids:voteRows.filter(v=>v.invite_token===invite).map(v=>v.option_id)}}
      if(isAdmin || p.results_visible) resultRows=voteRows;
    }else{
      const {data:votes}=await sb.from('votes').select('option_id, invite_token, voter_name, voter_email, updated_at, created_at').eq('poll_id',p.id);
      voteRows=votes||[];
      if(invite){const {data:mv}=await sb.from('votes').select('*').eq('poll_id',p.id).eq('invite_token',invite).maybeSingle();my_vote=mv||null;}
      if(isAdmin || p.results_visible) resultRows=voteRows;
    }
    const counts={};(voteRows||[]).forEach(v=>counts[v.option_id]=(counts[v.option_id]||0)+1);
    const safePoll={...p,options:options||[]};
    if(!isAdmin){delete safePoll.admin_token; delete safePoll.roster_webhook_url;}
    return {statusCode:200,body:JSON.stringify({poll:safePoll,is_admin:isAdmin,can_see_results:isAdmin||!!p.results_visible,votes:Object.entries(counts).map(([option_id,count])=>({option_id,count})),result_rows:resultRows,my_vote})}
  }catch(err){return {statusCode:404,body:JSON.stringify({error:err.message})}}
}
