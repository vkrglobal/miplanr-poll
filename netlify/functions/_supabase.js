const { createClient } = require('@supabase/supabase-js');
let WebSocketImpl;
try { WebSocketImpl = require('ws'); } catch (_) { WebSocketImpl = undefined; }
function json(status, body){
  return {statusCode:status,headers:{'content-type':'application/json','access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'GET,POST,OPTIONS'},body:JSON.stringify(body)}
}
function sb(){
  const opts = WebSocketImpl ? { realtime: { transport: WebSocketImpl } } : undefined;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, opts);
}
function slug(){return Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4)}
function token(){return Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)}
module.exports={json,sb,slug,token};
