const { createClient } = require('@supabase/supabase-js');
function client(){
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url,key,{auth:{persistSession:false}});
}
module.exports={client};
