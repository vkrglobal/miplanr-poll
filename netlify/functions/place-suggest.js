const {json}=require('./_utils');
exports.handler=async(event)=>{
  try{
    const q=(event.queryStringParameters&&event.queryStringParameters.q||'').trim();
    if(!q || q.length<3) return json(200,{ok:true,suggestions:[]});
    const key=process.env.GOOGLE_MAPS_API_KEY;
    if(!key) return json(200,{ok:false,message:'GOOGLE_MAPS_API_KEY not set',suggestions:[]});
    const res=await fetch('https://places.googleapis.com/v1/places:autocomplete',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-Goog-Api-Key':key,
        'X-Goog-FieldMask':'suggestions.placePrediction.placeId,suggestions.placePrediction.text'
      },
      body:JSON.stringify({input:q,languageCode:'en',regionCode:'GB'})
    });
    const data=await res.json();
    if(!res.ok) return json(200,{ok:false,error:data.error&&data.error.message||'Places autocomplete failed',suggestions:[]});
    const suggestions=(data.suggestions||[]).map(s=>s.placePrediction).filter(Boolean).map(p=>({placeId:p.placeId,description:p.text&&p.text.text||''})).filter(x=>x.description);
    return json(200,{ok:true,suggestions});
  }catch(e){return json(200,{ok:false,error:e.message,suggestions:[]});}
};
