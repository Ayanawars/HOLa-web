import { expireMaps } from './retention.js';
const baseUrl=Deno.env.get('SUPABASE_URL');
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
const TOKEN_HASH='9a5b4a30051e32e4c886c40bbf595baaeef8589b23158352cc3faed6b308dab4';

async function rest(path,init={}) {
  const response=await fetch(baseUrl+'/rest/v1/'+path,{...init,headers:{...headers,...init.headers}});
  if(!response.ok)throw Error('Database request failed: '+response.status+' '+(await response.text()).slice(0,500));
  const text=await response.text();
  return text?JSON.parse(text):null;
}
async function removeFile(path) {
  const response=await fetch(baseUrl+'/storage/v1/object/profile-media',{method:'DELETE',headers,body:JSON.stringify({prefixes:[path]})});
  if(!response.ok&&response.status!==404)throw Error('Map deletion failed: '+response.status);
  await response.arrayBuffer();
}
Deno.serve(async request=>{
  if(request.method!=='POST')return new Response('Method not allowed',{status:405});
  const token=request.headers.get('x-retention-token')||'';
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(digest!==TOKEN_HASH)return new Response('Forbidden',{status:403});
  try {return Response.json({ok:true,...await expireMaps({baseUrl,rest,removeFile})});}
  catch(error){console.error('DS map retention',String(error));return Response.json({error:'Map cleanup failed; pending files will retry.'},{status:500});}
});
