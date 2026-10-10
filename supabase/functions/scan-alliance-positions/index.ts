const ALLIANCE='12d2b4dd137b48fb91b32b344b4d2a6c';
const SOURCE='https://lwatlas.com/es/';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply({error:'Método no permitido'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');
  if(!url||!key)throw Error('Configuración incompleta');
  const authorization=req.headers.get('authorization')||'';
  if(!/^Bearer\s+\S+$/i.test(authorization))return reply({error:'Inicia sesión como R4/R5'},401);
  const headers={apikey:key,Authorization:authorization,'Content-Type':'application/json'};
  async function db(path,options={}){
   const response=await fetch(url+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(15000)});
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw Error(data?.message||'No se pudo consultar HOLa');
   return data;
  }
  const user=await fetch(url+'/auth/v1/user',{headers,signal:AbortSignal.timeout(15000)});
  if(!user.ok)return reply({error:'Sesión caducada. Inicia sesión otra vez'},401);
  if(await db('/rest/v1/rpc/is_hola_r4_r5_admin',{method:'POST',body:'{}'})!==true)return reply({error:'Acceso reservado a R4/R5'},403);
  const [old]=await db('/rest/v1/alliance_map_position_scan?select=revision,queried_at&id=eq.1');
  if(!old)throw Error('No existe el registro de posiciones');
  if(old.queried_at&&Date.now()-Date.parse(old.queried_at)<60000)return reply({error:'Espera un minuto antes de repetir la consulta'},429);
  // Same public, read-only alliance lookup used by the LWAtlas website.
  // No paid refresh, account action, or live game scan is requested.
  const response=await fetch('https://api.lwatlas.com/v1/alliances/'+ALLIANCE+'/members?warzoneId=1834',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('LWAtlas no está disponible (HTTP '+response.status+')');
  const data=await response.json();
  if(data.allianceId!==ALLIANCE||String(data.allianceAbbr).toLowerCase()!=='hola'||data.warzoneId!==1834||!Array.isArray(data.members)||data.members.length<10)throw Error('LWAtlas devolvió datos de alianza incompletos o no válidos');
  const positions=data.members.filter(p=>typeof p.playerName==='string').map(p=>({
   name:p.playerName,x:Number.isInteger(p.x)?p.x:null,y:Number.isInteger(p.y)?p.y:null,
   server:p.warzoneId??data.warzoneId,hidden:p.hidden===true,observedAt:p.observedAt||null
  }));
  if(!positions.some(p=>!p.hidden&&p.server===1834&&Number.isInteger(p.x)&&Number.isInteger(p.y)))throw Error('No se recibieron coordenadas válidas');
  const scan={positions,source:SOURCE,observed_at:data.lastUpdatedAt||null,queried_at:new Date().toISOString(),revision:old.revision+1};
  const saved=await db('/rest/v1/alliance_map_position_scan?id=eq.1&revision=eq.'+old.revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(scan)});
  if(!Array.isArray(saved)||saved.length!==1)throw Error('Otra consulta se guardó mientras comprobabas. Recarga el mapa');
  return reply({scan:saved[0]});
 }catch(e){console.error('Map positions lookup:',e.message);return reply({error:e.message||'No se pudieron consultar las posiciones'},502);}
});
