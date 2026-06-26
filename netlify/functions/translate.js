const {json}=require('./_supabase');
exports.handler=async(event)=>{
  if(event.httpMethod==='OPTIONS') return json(200,{});
  try{
    const b=JSON.parse(event.body||'{}');
    if(!process.env.OPENAI_API_KEY) return json(200,{ok:false,message:'OPENAI_API_KEY not set yet'});
    const lang=b.language||'English';
    const payload={title:b.title||'',question:b.question||'',description:b.description||'',options:b.options||[]};
    const prompt=`Translate this poll content into ${lang}. Preserve meaning and return ONLY valid JSON with keys title, question, description, options. Input JSON: ${JSON.stringify(payload)}`;
    const r=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',headers:{'authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'content-type':'application/json'},
      body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',messages:[{role:'system',content:'You translate UI poll content. Return strict JSON only.'},{role:'user',content:prompt}],temperature:0.2})
    });
    const data=await r.json();
    if(!r.ok) return json(500,{error:data.error?.message||'OpenAI translation failed'});
    const text=data.choices?.[0]?.message?.content||'{}';
    const clean=text.replace(/^```json\s*/,'').replace(/^```\s*/,'').replace(/```$/,'').trim();
    return json(200,{ok:true,translation:JSON.parse(clean)});
  }catch(e){return json(500,{error:e.message})}
}
