import { storeImage } from '../_shared/image-storage.ts';
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"https://ovybstpiomphrouvqxmf.supabase.co";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";

async function sha256(value:string){
  const b=new TextEncoder().encode(value);
  const h=await crypto.subtle.digest("SHA-256",b);
  return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function rest(path:string,init:RequestInit={}){
  if(!SERVICE_KEY)throw new Error("SERVICE_ROLE_NOT_CONFIGURED");
  const headers={apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,...(init.headers||{})};
  return await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers});
}
const clean=(v:unknown,max=1000)=>String(v??"").trim().slice(0,max);
const allowedSquads=new Set(["Tank","Aircraft","Missile"]);
const allowedProfessions=new Set(["Warlord","Engineer"]);

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{status:200,headers:cors});
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const body=await req.json();
    const name=clean(body?.name,80);
    const token=clean(body?.verificationToken,300);
    const p=body?.profile||{};
    if(!name)return json({error:"Player name required.",code:"PLAYER_NOT_FOUND"},400);

    let session:any=null;
    if(token){
      const tokenHash=await sha256(token);
      const sr=await rest(`survey_edit_sessions?token_hash=eq.${encodeURIComponent(tokenHash)}&player_name=eq.${encodeURIComponent(name)}&select=week,expires_at&limit=1`);
      if(!sr.ok)throw new Error(`SESSION_LOOKUP_${sr.status}`);
      const sessions=await sr.json().catch(()=>[]);
      if(!Array.isArray(sessions)||!sessions.length)return json({error:"Verification session not found.",code:"VERIFICATION_INVALID"},401);
      session=sessions[0];
      if(!session.expires_at||new Date(session.expires_at).getTime()<=Date.now())return json({error:"Verification session expired.",code:"VERIFICATION_EXPIRED"},401);
    }

    const pr=await rest(`players?name=eq.${encodeURIComponent(name)}&select=name,ai_detection_week,avatar,uploaded_avatar,hola_avatar,default_avatar&limit=1`);
    if(!pr.ok)throw new Error(`PLAYER_LOOKUP_${pr.status}`);
    const players=await pr.json().catch(()=>[]);
    if(!Array.isArray(players)||!players.length)return json({error:"PLAYER_NOT_FOUND",code:"PLAYER_NOT_FOUND"},404);
    const existing=players[0];
    // Squad-only scans issue a save receipt without modifying the player row.
    // An active receipt is required, but no profile/name verification is requested.

    const flag=clean(p.flag,80);
    let avatar=clean(p.avatar,2_000_000);
    const hq=Number(p.hq_level);
    const s1p=clean(p.squad1_power,40),s2p=clean(p.squad2_power,40),s3p=clean(p.squad3_power,40);
    const s1t=clean(p.squad1_type,20),s2t=clean(p.squad2_type,20),s3t=clean(p.squad3_type,20);
    const profession=clean(p.profession,30);
    const t10=p.t10;
    const supreme=p.supreme_lord_unlocked;
    const country=p.country==null?null:clean(p.country,120);
    const city=p.city==null?null:clean(p.city,120);
    const community=p.community==null?null:clean(p.community,120);
    const about=clean(p.about_me,500);
    const quote=clean(p.epic_quote,120);

    const missing=[];
    if(!flag)missing.push("flag");
    if(!avatar)missing.push("avatar");
    if(!Number.isInteger(hq)||hq<1||hq>100)missing.push("hq_level");
    if(!s1p||!s2p||!s3p)missing.push("squad_power");
    if(!allowedSquads.has(s1t)||!allowedSquads.has(s2t)||!allowedSquads.has(s3t))missing.push("squad_type");
    if(!allowedProfessions.has(profession))missing.push("profession");
    if(typeof t10!=="boolean")missing.push("t10");
    if(typeof supreme!=="boolean")missing.push("supreme_lord_unlocked");
    if(missing.length)return json({error:"Required survey information is missing.",code:"PROFILE_INCOMPLETE",fields:missing},422);

    avatar = await storeImage(avatar, SUPABASE_URL, SERVICE_KEY);
    const update:any={
      flag,uploaded_avatar:avatar,hq_level:hq,profession,
      squad1_power:s1p,squad1_type:s1t,
      squad2_power:s2p,squad2_type:s2t,
      squad3_power:s3p,squad3_type:s3t,
      t10, supreme_lord_unlocked:supreme,
      country,city,community,
      about_me:about,epic_quote:quote,
      survey_completed:true,
      survey_completed_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    };
    if(session?.week)update.ai_detection_week=session.week;
    const currentDefault=String(existing.default_avatar||"uploaded");
    const holaAvatar=String(existing.hola_avatar||"");
    if(currentDefault==="hola"&&holaAvatar){update.avatar=holaAvatar;}else{update.avatar=avatar;update.default_avatar="uploaded";}
    const ur=await rest(`players?name=eq.${encodeURIComponent(name)}`,{method:"PATCH",headers:{"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(update)});
    if(!ur.ok){const t=await ur.text().catch(()=>"");throw new Error(`PROFILE_SAVE_${ur.status}:${t.slice(0,300)}`);}
    return json({ok:true,name,week:session?.week??null});
  }catch(e:any){
    console.error("survey-save-profile",e);
    return json({error:String(e?.message||e)},500);
  }
});
