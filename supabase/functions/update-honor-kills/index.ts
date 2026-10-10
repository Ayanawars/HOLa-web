const SOURCE='https://lastintel.io/alliances/VP7xiGc6fADBcd173QLUEQ';
const ID='VP7xiGc6fADBcd173QLUEQ';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
const normal=v=>String(v||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f\u0640ᓚᘏᗢ]/g,'').replace(/[^\p{L}\p{N}]+/gu,'');
function rankRoster(roster,members){
 const exact=new Map(members.map(p=>[p.name,p.name])),names=new Map();
 for(const p of members){const k=normal(p.name);names.set(k,[...(names.get(k)||[]),p.name]);}
 const unique=new Map(),unmatched=[];
 for(const p of roster){
  if(typeof p.name!=='string'||typeof p.kills!=='number'||!Number.isSafeInteger(p.kills)||p.kills<0)continue;
  const candidates=names.get(normal(p.name))||[];
  const name=exact.get(p.name)||(candidates.length===1?candidates[0]:null);
  if(!name){unmatched.push(p.name);continue;}
  if(!unique.has(name)||p.kills>unique.get(name).kills)unique.set(name,{name,kills:p.kills});
 }
 return {players:[...unique.values()].filter(p=>p.kills>0).sort((a,b)=>b.kills-a.kills||a.name.localeCompare(b.name)).slice(0,10),matched:unique.size,unmatched};
}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply({error:'Método no permitido'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');
  if(!url||!key)throw Error('Configuración del actualizador incompleta');
  const authorization=req.headers.get('authorization')||'';
  if(!/^Bearer\s+\S+$/i.test(authorization))return reply({error:'Inicia sesión como R4/R5'},401);
  const headers={apikey:key,Authorization:authorization,'Content-Type':'application/json'};
  async function db(path,options={}){
   const response=await fetch(url+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(15000)});
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw Error(data?.message||'No se pudieron consultar los datos de HOLa');
   return data;
  }
  const userResponse=await fetch(url+'/auth/v1/user',{headers,signal:AbortSignal.timeout(15000)});
  if(!userResponse.ok)return reply({error:'Sesión caducada. Vuelve a iniciar sesión'},401);
  const allowed=await db('/rest/v1/rpc/is_hola_r4_r5_admin',{method:'POST',body:'{}'});
  if(allowed!==true)return reply({error:'Solo administradores R4/R5 pueden actualizar las kills'},403);
  const [old]=await db('/rest/v1/honor_kills?select=revision,updated_at&id=eq.1');
  if(!old)throw Error('No existe la clasificación de kills');
  if(Date.now()-Date.parse(old.updated_at)<60000)return reply({error:'Las kills se actualizaron hace menos de un minuto. Espera antes de repetir la consulta'},429);
  const members=await db('/rest/v1/players?select=name&limit=1000');
  const upstream=await fetch('https://mcp.lastintel.io',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream','MCP-Protocol-Version':'2025-06-18','User-Agent':'HOLa-Honor-Kills/1.0'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'get_alliance',arguments:{allianceId:ID}}}),signal:AbortSignal.timeout(30000)});
  if(!upstream.ok)throw Error('LastIntel no responde (HTTP '+upstream.status+')');
  const payload=await upstream.json();
  if(payload.error||payload.result?.isError)throw Error('LastIntel no pudo devolver la alianza. Inténtalo más tarde');
  const alliance=payload.result?.structuredContent;
  if(alliance?.id!==ID||alliance.serverId!==1834||String(alliance.tag).toLowerCase()!=='hola'||!Array.isArray(alliance.roster))throw Error('LastIntel devolvió datos de alianza no válidos');
  const ranked=rankRoster(alliance.roster,members);
  // Reject incomplete responses before replacing the current ranking.
  if(alliance.roster.length<Math.min(10,alliance.curMember||10)||ranked.players.length<10)throw Error('LastIntel devolvió datos incompletos o insuficientes para el Top 10');
  const now=new Date(),parts=new Intl.DateTimeFormat('en',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Madrid'}).formatToParts(now),d=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  const snapshot={players:ranked.players,updated_on:d.year+'-'+d.month+'-'+d.day,source:SOURCE,revision:old.revision+1,updated_at:now.toISOString()};
  const saved=await db('/rest/v1/honor_kills?id=eq.1&revision=eq.'+old.revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(snapshot)});
  if(!Array.isArray(saved)||saved.length!==1)throw Error('La clasificación cambió durante la consulta. Vuelve a actualizar');
  return reply({snapshot:saved[0],matched:ranked.matched,unmatched:ranked.unmatched});
 }catch(e){console.error('Honor kills update failed:',e.message);return reply({error:e.message||'No se pudieron actualizar las kills'},502);}
});
