const { createClient } = require('@supabase/supabase-js');
function json(status, body){return {statusCode:status,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:JSON.stringify(body)}}
function sb(){return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)}
function slug(){return Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4)}
function token(){return Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)}
module.exports={json,sb,slug,token};
