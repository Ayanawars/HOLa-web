import {comparePositions,applyPositionReviews} from './position-compare.js';
const PUBLIC_KEY='sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey,authorization,content-type','Access-Control-Allow-Methods':'GET,OPTIONS'};
Deno.serve(async req=>{
 const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='GET')return respond({error:'Method not allowed'},405);
 // This read-only public endpoint accepts the website's publishable API key.
 if(req.headers.get('apikey')!==PUBLIC_KEY)return respond({error:'Invalid API key'},401);
 const margin=Number(new URL(req.url).searchParams.get('margin')||10);
 if(!Number.isFinite(margin)||margin<0||margin>50)return respond({error:'Invalid margin'},400);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key)return respond({error:'Status unavailable'},503);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{
 async function read(table,query){const r=await fetch(url+'/rest/v1/'+table+'?'+query,{headers:{apikey:key,Authorization:'Bearer '+key},signal:controller.signal});if(!r.ok)throw Error('Read failed');return r.json();}
 const [configs,scans,reviews]=await Promise.all([
 read('alliance_map_config','id=eq.1&select=slots,revision'),
 read('alliance_map_position_scan','id=eq.1&select=positions,observed_at,queried_at'),
 read('alliance_map_position_reviews','select=player_name,assigned_x,assigned_y,source_queried_at,verified_at,status&limit=1000')]);
 const config=configs[0],scan=scans[0];if(!config)throw Error('Map unavailable');
 const results=applyPositionReviews(comparePositions(config.slots,scan?.positions||[],margin).results,reviews,scan?.queried_at||null);
 return respond({revision:config.revision,queried_at:scan?.queried_at||null,statuses:[...results.values()].map(r=>({slot_id:r.slot.id,status:r.status}))});
 }catch{return respond({error:'Status unavailable'},503)}finally{clearTimeout(timer)}
});
