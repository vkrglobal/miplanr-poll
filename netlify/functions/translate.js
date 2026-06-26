const {json}=require('./_supabase');
exports.handler=async(event)=>{try{const b=JSON.parse(event.body||'{}'); if(!process.env.OPENAI_API_KEY) return json(200,{ok:false,message:'OPENAI_API_KEY not set yet'}); return json(200,{ok:false,message:'Translation endpoint ready; connect OpenAI call next.'});}catch(e){return json(500,{error:e.message})}}
