import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const sb=createClient("https://ovybstpiomphrouvqxmf.supabase.co","sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV",{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const HOSP=["H1","H2","H3","H4"],P1=["H1","H2","H3","H4","HUB"],P2=["H1","H2","H3","H4","SILO","ARSENAL","MERC","HUB","INFO"];
const BUILDINGS={
H1:{label:"Field Hospital 1",icon:"🏥",x:22,y:65},H2:{label:"Field Hospital 2",icon:"🏥",x:82,y:34},
H3:{label:"Field Hospital 3",icon:"🏥",x:30,y:79},H4:{label:"Field Hospital 4",icon:"🏥",x:68,y:18},
HUB:{label:"Science Hub",icon:"🔬",x:71,y:80},INFO:{label:"Info Center",icon:"📡",x:35,y:19},
REF1:{label:"Oil Refinery 1",icon:"🛢️",x:22,y:36},REF2:{label:"Oil Refinery 2",icon:"🛢️",x:82,y:65},
SILO:{label:"Nuclear Silo",icon:"☢️",x:51,y:48},ARSENAL:{label:"Arsenal",icon:"⚔️",x:52,y:20},
MERC:{label:"Mercenary Factory",icon:"🏭",x:52,y:79}};
const SUB_P1=[...P1,"INFO","REF1","REF2"],SUB_P2=[...P2,"REF1","REF2"];
const TARGET1={H1:4,H2:4,H3:4,H4:4,HUB:4};
const TARGET2={H1:2,H2:2,H3:2,H4:2,SILO:4,ARSENAL:2,MERC:2,HUB:2,INFO:2};
let savedDrafts=[],members=[],memberByKey=new Map(),memberProfiles=new Map(),rosterOther=new Set(),state=null,phase="phase1",selectedBuilding="H1",proposals=[],rejectedOCR=new Map(),ocrWorker=null,currentTab="setup",busy=false,acceptBusy=false,ocrHasRead=false;
const normal=value=>String(value||"").normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f\u0640]/g,"").replace(/[ᓚᘏᗢ]/g,"").replace(/[^\p{L}\p{N}]+/gu,"");
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const number=value=>Number(value||0).toLocaleString("es-ES",{maximumFractionDigits:1});
let noticeTimer=null;
function notice(msg,type="info"){
 const item=$("message");if(!item)return;
 clearTimeout(noticeTimer);
 if(!msg){item.hidden=true;item.textContent="";return;}
 item.textContent=msg;item.className="notice app-toast "+type;item.hidden=false;
 noticeTimer=setTimeout(()=>{item.hidden=true;},type==="error"?11000:6500);
}
// Native mobile scrolling list: every option is a Friday.
function isoLocalDate(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function parseFridayDate(iso){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||"")))return null;
 const [y,m,day]=iso.split("-").map(Number),date=new Date(y,m-1,day,12);
 return isoLocalDate(date)===iso&&date.getDay()===5?date:null;
}
function nextFriday(){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+(5-d.getDay()+7)%7);return d;}
function populateFridayDates(selected){
 const picker=$("battleDate"),friday=nextFriday(),target=parseFridayDate(selected)?selected:isoLocalDate(friday);
 const dates=new Set();
 for(let offset=-52;offset<=52;offset++){const d=new Date(friday);d.setDate(friday.getDate()+offset*7);dates.add(isoLocalDate(d));}
 for(const row of savedDrafts)if(parseFridayDate(row.battle_date))dates.add(row.battle_date);
 dates.add(target);
 picker.innerHTML=[...dates].sort().map(date=>'<option value="'+date+'">Viernes · '+date.slice(8,10)+"/"+date.slice(5,7)+"/"+date.slice(0,4)+"</option>").join("");
 picker.value=target;return target;
}
function moveFriday(offset){
 const date=parseFridayDate($("battleDate").value)||nextFriday();date.setDate(date.getDate()+offset*7);
 populateFridayDates(isoLocalDate(date));loadDraft();
}
function fresh(){return {version:1,battle_date:$("battleDate").value,team:$("team").value,serverTime:$("team").value==="A"?"18:00":"09:00",templateName:"Operación Faraón",keyword:"ANUBIS",leader:$("team").value==="A"?"Ayana wars":"",alternate:"",language:(localStorage.getItem("hola-language")==="tr"?"tr":"en"),baseMapDataUrl:"",roster:[],phase1:{H1:[],H2:[],H3:[],H4:[],HUB:[]},phase2:{H1:[],H2:[],H3:[],H4:[],HUB:[],INFO:[],SILO:[],ARSENAL:[],MERC:[]},missions:{INFO:[],REF1:[],REF2:[]},subs:{H1:[],H2:[],H3:[],H4:[],HUB:[],INFO:[],REF1:[],REF2:[]},subsPhase2:{H1:[],H2:[],H3:[],H4:[],SILO:[],ARSENAL:[],MERC:[],HUB:[],INFO:[],REF1:[],REF2:[]}};}
function canonical(raw){
 const key=normal(raw);
 const aliases={"mirliva":"Mirrliva","lolo":"مثالـي25","taajb":"مثالـي25","memofex042":"Memofex042 ᓚᘏᗢ","lazziyaa":"Laz Ziyaaa ᓚᘏᗢ","lazziyaaa":"Laz Ziyaaa ᓚᘏᗢ","sinsiflex":"sinsifeX ᓚᘏᗢ","sinsifex":"sinsifeX ᓚᘏᗢ","siniflex":"sinsifeX ᓚᘏᗢ","sinifex":"sinsifeX ᓚᘏᗢ","judex":"Judéx ᓚᘏᗢ","ophicat":"Ophicat ᓚᘏᗢ","jebrawuu":"JEBRAWW","jebraw":"JEBRAWW"};
 const alias=aliases[key];if(alias&&memberByKey.has(normal(alias)))return memberByKey.get(normal(alias));
 return memberByKey.get(key)||"";
}
// For OCR, never update THP more than 5M above the official value.
const MAX_OCR_THP_INCREASE=5;
function parseOfficialTHP(raw){
 const t=String(raw??"").trim().replace(/\s+/g,"").replace(/(?:millones|million|m)$/i,"");
 if(!/^\d{1,4}(?:[.,]\d{1,3})?$/.test(t))return null;
 const n=Number(t.replace(",","."));
 return Number.isFinite(n)&&n>0&&n<=9999?n:null;
}
function rememberProfile(player){
 if(!player?.name)return;
 memberProfiles.set(normal(player.name),{raw:player.thp??null,value:parseOfficialTHP(player.thp)});
}
function memberTHP(name){return memberProfiles.get(normal(canonical(name)||name))?.value??null;}
function syncLocalMemberTHP(name){
 const k=normal(canonical(name)||name),power=memberProfiles.get(k)?.value??null;
 if(state)for(const player of state.roster)if(normal(player.name)===k)player.power=power;
 for(const p of proposals)if(normal(p.name)===k)p.power=power;
}
async function refreshOfficialTHP({render=true}={}){
 const {data,error}=await sb.from("players").select("name,thp").order("name");
 if(error)throw new Error("No se pudo cargar THP de Supabase: "+error.message);
 (data||[]).forEach(rememberProfile);
 if(state)for(const r of state.roster)r.power=memberTHP(r.name);
 if(render&&state){renderRoster();mutate();}
 return state?.roster.filter(r=>r.power!=null).length??0;
}
// Optimistic compare-and-swap prevents a stale screenshot from overwriting a newer value.
async function raiseOfficialTHP(name,ocrValue,{reviewed=false}={}){
 const official=canonical(name),next=Number(ocrValue);
 if(!official||!Number.isFinite(next)||next<=0||next>9999)return {status:"invalid"};
 const {data:latest,error:readError}=await sb.from("players").select("name,thp").eq("name",official).maybeSingle();
 if(readError)throw readError;
 if(!latest)throw new Error("No existe el miembro "+official+" en Supabase.");
 rememberProfile(latest);
 const previous=parseOfficialTHP(latest.thp);
 if(previous!=null&&next<=previous+0.00001){syncLocalMemberTHP(official);return {status:"unchanged",previous,current:previous};}
 if(!reviewed&&(previous==null||next-previous>MAX_OCR_THP_INCREASE+0.00001))return {status:"ignored",previous,current:previous};
 const stored=String(next)+"M";
 let query=sb.from("players").update({thp:stored}).eq("name",official);
 query=latest.thp==null?query.is("thp",null):query.eq("thp",latest.thp);
 const {data:updated,error:writeError}=await query.select("name,thp");
 if(writeError)throw writeError;
 if(!updated?.length){
  const {data:reloaded,error:reloadError}=await sb.from("players").select("name,thp").eq("name",official).maybeSingle();
  if(reloadError)throw reloadError;
  if(reloaded)rememberProfile(reloaded);
  syncLocalMemberTHP(official);
  return {status:"changed-elsewhere",previous,current:memberTHP(official)};
 }
 rememberProfile(updated[0]);syncLocalMemberTHP(official);
 return {status:"updated",previous,current:memberTHP(official)};
}
function matchMember(raw){
 const text=normal(String(raw||"").replace(/(?:\[\s*)?HOLa(?:\s*\])?/gi,"").replace(/^\s*(?:R[1-5]\s*)+/i,"").replace(/\s+\d{1,4}(?:[.,]\d+)?\s*[mM]\b.*$/,"").trim());
 if(!text||text.length<3)return {name:"",exact:false};
 const direct=canonical(text)||memberByKey.get(text);
 if(direct)return {name:direct,exact:true};
 // Bracketed tags and decorative glyphs should not create new player IDs.
 const undecorated=text.replace(/[ᓚᘏᗢ]/g,"");
 if(undecorated!==text&&memberByKey.has(undecorated))return {name:memberByKey.get(undecorated),exact:true};
 let best="",distance=99,runnerUp=99;
 for(const member of members){
  const keys=new Set([normal(member),normal(member.replace(/[ᓚᘏᗢ]/g,""))]);
  for(const key of keys){
   if(key.length<4)continue;
   const d=levenshtein(key,text);
   if(d<distance){runnerUp=distance;distance=d;best=member;}
   else if(d<runnerUp&&member!==best)runnerUp=d;
  }
 }
 return distance<=2&&distance<runnerUp&&distance/Math.max(text.length,5)<.24?{name:best,exact:false}:{name:"",exact:false};
}
function levenshtein(a,b){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){const next=[i+1];for(let j=0;j<b.length;j++)next.push(Math.min(next[j]+1,row[j+1]+1,row[j]+(a[i]===b[j]?0:1)));row=next;}return row[b.length];}
function playerOption(selected="",empty="Elegir miembro"){return '<option value="">'+esc(empty)+'</option>'+members.map(n=>'<option value="'+esc(n)+'"'+(n===selected?' selected':'')+'>'+esc(n)+'</option>').join("");}
function stateReady(input){const s=fresh();if(input&&typeof input==="object"){for(const key of ["battle_date","team","serverTime","templateName","keyword","leader","alternate","language"])if(typeof input[key]==="string")s[key]=input[key];if(typeof input.baseMapDataUrl==="string"&&input.baseMapDataUrl.length<600000&&/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(input.baseMapDataUrl))s.baseMapDataUrl=input.baseMapDataUrl;if(Array.isArray(input.roster))s.roster=input.roster.filter(r=>r&&typeof r.name==="string").map(r=>({name:canonical(r.name)||r.name,role:r.role==="sub"?"sub":"starter",power:memberTHP(r.name)}));for(const field of ["phase1","phase2","missions","subs","subsPhase2"]){for(const key of Object.keys(s[field]))if(Array.isArray(input[field]?.[key]))s[field][key]=input[field][key].filter(n=>typeof n==="string").map(n=>canonical(n)||n);}}if(!input?.subsPhase2)for(const k of HOSP)s.subsPhase2[k]=[...s.subs[k]];return s;}
function localKey(){return "hola-ds-builder-v1:"+$("battleDate").value+":"+$("team").value;}
function storeLocal(){if(state)try{localStorage.setItem(localKey(),JSON.stringify(state));}catch{}}
function mapSource(){return state?.baseMapDataUrl||"assets/ds-battlefield-real.webp";}
async function useOriginalMap(file){if(!file)return;try{const picture=await new Promise((res,rej)=>{const im=new Image(),url=URL.createObjectURL(file);im.onload=()=>{URL.revokeObjectURL(url);res(im);};im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("No se pudo abrir la imagen."));};im.src=url;});const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=850;canvas.getContext("2d").drawImage(picture,0,0,1200,850);let data=canvas.toDataURL("image/webp",.83);if(data.length>530000)data=canvas.toDataURL("image/webp",.62);if(data.length>530000)throw new Error("El mapa es demasiado grande. Prueba con un JPG o WebP más ligero.");state.baseMapDataUrl=data;mutate();notice("Mapa original incorporado a esta estrategia. Guarda el borrador para conservarlo y publícalo cuando esté listo.","success");}catch(e){notice("No se pudo usar el mapa: "+e.message,"error");}}
function mutate(){storeLocal();renderStats();if(ocrHasRead)renderProposals();renderMap();renderValidation();renderOutputs();}
function switchTab(next){currentTab=next;document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===next));for(const t of ["setup","roster","plan","publish"])$("tab-"+t).hidden=t!==next;window.scrollTo({top:0,behavior:"smooth"});if(next==="plan"){renderMap();}if(next==="publish"){renderValidation();renderOutputs();}}
function updateSetup(){
 for(const key of ["serverTime","templateName","keyword","leader","alternate","language"])$(key).value=state[key]||"";
 updateLeaders();
}
function updateLeaders(){
 const starters=state.roster.filter(r=>r.role==="starter").map(r=>r.name);
 const leader=$("leader"),alternate=$("alternate");
 for(const el of [leader,alternate]){const current=el.value||state[el.id];el.innerHTML='<option value="">'+(el===leader?"Elegir titular responsable":"Sin alternativo")+'</option>'+starters.map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join("");el.value=starters.includes(current)?current:"";}
 if($("team").value==="A"&&starters.includes("Ayana wars")&&!state.leader){state.leader="Ayana wars";leader.value=state.leader;}
}
async function verifyAccess(){
 const {data:{session},error}=await sb.auth.getSession();
 if(error||!session){location.replace("admin-login.html");return false;}
 const {data:admin,error:err}=await sb.from("admin_users").select("display_name").eq("user_id",session.user.id).maybeSingle();
 if(err||!admin){location.replace("admin-login.html");return false;}
 const {data:players,error:pe}=await sb.from("players").select("name,rank,thp").order("name");
 if(pe)throw pe;
 const officer=players.find(p=>["R4","R5"].includes(String(p.rank||"").toUpperCase())&&normal(p.name)===normal(admin.display_name));
 if(!officer){location.replace("admin-login.html");return false;}
 members=players.map(p=>p.name);
 players.forEach(rememberProfile);
 memberByKey=new Map(members.map(n=>[normal(n),n]));
 // The cat decoration is part of the official name, but OCR often omits it.
 for(const name of members){
  const clean=normal(name.replace(/[ᓚᘏᗢ]/g,""));
  if(clean&&!memberByKey.has(clean))memberByKey.set(clean,name);
 }
 $("gate").hidden=true;$("app").hidden=false;return true;
}
async function refreshOther(){
 rosterOther=new Set();const d=$("battleDate").value,t=$("team").value==="A"?"B":"A";
 if(!d)return;
 const [{data:plan,error:pErr},{data:legacy,error:lErr}]=await Promise.all([
  sb.from("desert_storm_plans").select("draft,published").eq("battle_date",d).eq("team",t).maybeSingle(),
  sb.from("desert_storm_participants").select("player_name").eq("battle_date",d).eq("team",t)
 ]);
 if(pErr||lErr)throw new Error("No se pudo verificar el otro equipo: "+(pErr?.message||lErr?.message));
 const otherRoster=[...(plan?.draft?.roster||[]),...(plan?.published?.roster||[])];
 for(const r of otherRoster)if(r?.name)rosterOther.add(normal(canonical(r.name)||r.name));
 for(const r of legacy||[])if(r?.player_name)rosterOther.add(normal(canonical(r.player_name)||r.player_name));
}
async function loadSavedDrafts(){
 const {data,error}=await sb.from("desert_storm_plans")
  .select("battle_date,team,updated_at").order("updated_at",{ascending:false}).limit(12);
 if(error)throw new Error("No se pudieron consultar tus borradores: "+error.message);
 savedDrafts=(data||[]).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.battle_date)&&["A","B"].includes(r.team));
 populateFridayDates($("battleDate").value);
}
async function loadDraft(show=true){
 const d=$("battleDate").value,t=$("team").value;
 if(!parseFridayDate(d)){notice("La fecha de Desert Storm debe ser un viernes.","error");return false;}
 try{
  // Read this saved team before validating the opponent; a roster clash cannot
  // make the user's own saved map inaccessible for editing.
  const {data,error}=await sb.from("desert_storm_plans")
   .select("draft,published,published_at").eq("battle_date",d).eq("team",t).maybeSingle();
  if(error)throw error;
  const fallback=localStorage.getItem(localKey());
  const src=data?.draft&&Object.keys(data.draft).length?data.draft:
   data?.published&&Object.keys(data.published).length?data.published:
   fallback?JSON.parse(fallback):null;
  let crossWarning="";
  try{await refreshOther();}catch(e){rosterOther=new Set();crossWarning=String(e?.message||e);}
  state=stateReady(src);state.battle_date=d;state.team=t;
  state.serverTime=src?.serverTime||(t==="A"?"18:00":"09:00");
  phase="phase1";selectedBuilding="H1";
  proposals=[];rejectedOCR=new Map();ocrHasRead=false;
  invalidateBulkRoster();syncSetup();renderRoster();renderProposals();mutate();
  localStorage.setItem("hola-ds-builder-current",JSON.stringify({battle_date:d,team:t}));
  // Removed the unused template panel from the setup screen.
  if(crossWarning)notice("Jornada recuperada, pero comprueba las inscripciones antes de publicar: "+crossWarning,"error");
  else if(show){const c=counts();notice(src?"✓ Recuperado Team "+t+" del "+d+" · "+c.starter+" titulares, "+c.sub+" suplentes y sus mapas. Ya puedes modificarlos.":"Jornada nueva · Team "+t,"success");}
  return true;
 }catch(e){notice("No se pudo recuperar la jornada: "+(e.message||e),"error");return false;}
}
function syncSetup(){for(const key of ["serverTime","templateName","keyword","language"])$(key).value=state[key];updateLeaders();}
function counts(){return {starter:state.roster.filter(x=>x.role==="starter").length,sub:state.roster.filter(x=>x.role==="sub").length};}
function removeAssignments(name){for(const field of ["phase1","phase2","missions","subs","subsPhase2"])for(const key of Object.keys(state[field]))state[field][key]=state[field][key].filter(n=>n!==name);}
function addRoster(name,role){
 name=canonical(name);if(!name)throw new Error("Selecciona un miembro actual de HOLa.");
 if(rosterOther.has(normal(name)))throw new Error(name+" ya está guardado en Team "+(state.team==="A"?"B":"A")+" para esta fecha. Abre «☁ Recuperar DS guardado» y selecciona el equipo correcto.");
 const existing=state.roster.find(r=>normal(r.name)===normal(name));
 if(existing){if(existing.role!==role)throw new Error(name+" ya figura como "+(existing.role==="starter"?"titular":"suplente")+". Revisa su B.");existing.power=memberTHP(name);return false;}
 const count=counts();
 if(role==="starter"&&count.starter>=20)throw new Error("Ya hay 20 titulares; no puedes añadir más.");
 if(role==="sub"&&count.sub>=10)throw new Error("Ya hay 10 suplentes; no puedes añadir más.");
 state.roster.push({name,role,power:memberTHP(name)});return true;
}
function addManualPlayer(){
 const status=$("manualPlayerStatus");
 try{
  const requested=$("manualRole").value;
  if(!["auto","starter","sub"].includes(requested))throw new Error("Selecciona Titular, Suplente o Plaza disponible.");
  const name=canonical($("manualPlayer").value),existing=state.roster.find(r=>normal(r.name)===normal(name));
  const count=counts(),role=requested==="auto"?(existing?.role||(count.starter<20?"starter":"sub")):requested;
  const added=addRoster(name,role);
  const message=added?"✓ Añadido: "+name+" · "+(role==="starter"?"Titular":"Suplente")+". THP cargado desde Supabase.":name+" ya está inscrito en este equipo.";
  renderRoster();mutate();
  if(added)$("manualPlayer").value="";
  status.textContent=message;status.className="notice success";
  notice(message,"success");return added;
 }catch(error){
  const message=String(error?.message||error);
  status.textContent=message;status.className="notice error";
  notice(message,"error");return false;
 }
}

let bulkRosterPreviewSignature="";
function bulkSignature(){
 return JSON.stringify({
  text:$("bulkRosterText").value,replace:$("bulkReplace").checked,
  date:state?.battle_date,team:state?.team,
  roster:state?.roster.map(r=>[r.name,r.role]).sort((a,b)=>a[0].localeCompare(b[0])),
  other:[...rosterOther].sort()
 });
}
function invalidateBulkRoster(){
 bulkRosterPreviewSignature="";
 $("bulkApply").disabled=true;
 $("bulkPreviewPanel").hidden=true;
 $("bulkStatus").textContent="";
 $("bulkStatus").className="muted";
}
function evaluateBulkRoster(){
 const errors=[],parsed=[],seen=new Set();
 const lines=$("bulkRosterText").value.split(/\r?\n/);
 for(let i=0;i<lines.length;i++){
  const original=lines[i].trim();
  if(!original)continue;
  if(/^(?:fuerza\s+especial\s*[ab]|(?:team|equipo)\s*[ab]|desert\s+storm|(?:titulares?|suplentes?|starters?|substitutes?)\s*(?:\(\s*\d+\s*\))?)\s*[:\-–—]?\s*$/i.test(original))continue;
  const cleaned=original.replace(/^(?:\d{1,3}[.)]\s*|[-*•]\s*)/,"").trim();
  const found=cleaned.match(/^(.+?)\s*[-–—:]\s*(titular|suplente|starter|substitute|reserve)\s*\.?$/i);
  if(!found){errors.push("Línea "+(i+1)+": usa Nombre - Titular o Nombre - Suplente ("+original+").");continue;}
  const rawName=found[1].trim();
  const name=canonical(rawName);
  if(!name){errors.push("Línea "+(i+1)+": «"+rawName+"» no coincide con un miembro actual de HOLa.");continue;}
  const key=normal(name),role=/^(titular|starter)$/i.test(found[2])?"starter":"sub";
  if(seen.has(key)){errors.push("Línea "+(i+1)+": «"+name+"» está repetido en el texto.");continue;}
  seen.add(key);
  if(rosterOther.has(key)){errors.push("Línea "+(i+1)+": «"+name+"» ya pertenece al otro equipo en esta jornada.");continue;}
  parsed.push({name,role,line:i+1});
 }
 if(!parsed.length)errors.push("No hay participantes válidos para importar.");
 const replace=$("bulkReplace").checked;
 const planned=replace?[]:state.roster.map(r=>({...r}));
 let additions=0,unchanged=0,roleChanges=0,removed=0;
 for(const person of parsed){
  const previous=state.roster.find(r=>normal(r.name)===normal(person.name));
  if(!replace&&previous){
   if(previous.role!==person.role)errors.push("Línea "+person.line+": «"+person.name+"» ya figura como "+(previous.role==="starter"?"Titular":"Suplente")+". Marca «Reemplazar convocatoria» para cambiarlo.");
   else unchanged++;
   continue;
  }
  if(replace){
   if(previous&&previous.role!==person.role)roleChanges++;
   else if(previous)unchanged++;
   else additions++;
   planned.push({name:person.name,role:person.role,power:memberTHP(person.name)});
  }else{
   additions++;
   planned.push({name:person.name,role:person.role,power:memberTHP(person.name)});
  }
 }
 if(replace)removed=state.roster.filter(old=>!planned.some(p=>normal(old.name)===normal(p.name))).length;
 const starter=planned.filter(r=>r.role==="starter").length,sub=planned.filter(r=>r.role==="sub").length;
 if(starter>20)errors.push("Demasiados titulares: "+starter+"/20.");
 if(sub>10)errors.push("Demasiados suplentes: "+sub+"/10.");
 return {errors,parsed,planned,starter,sub,additions,unchanged,roleChanges,removed,replace};
}
function previewBulkRoster(){
 if(!state)return;
 const result=evaluateBulkRoster();
 const box=$("bulkPreviewPanel");
 box.hidden=false;
 const summary="<strong>"+result.parsed.length+" reconocidos · "+result.starter+"/20 titulares · "+result.sub+"/10 suplentes</strong>"+
  "<p class=\"muted\">"+(result.replace?"Reemplazar lista: ":"Añadir a la lista: ")+result.additions+" nuevos, "+result.unchanged+" sin cambios"+
  (result.replace?", "+result.roleChanges+" cambios de tipo y "+result.removed+" bajas.":".")+"</p>";
 const problems=result.errors.length?
  "<div class=\"notice error\"><strong>Corrige estas incidencias antes de importar:</strong><ul>"+
  result.errors.map(e=>"<li>"+esc(e)+"</li>").join("")+"</ul></div>":
  "<div class=\"notice success\">✓ Lista válida. Puedes confirmar la importación. El THP se obtiene de Supabase.</div>";
 const details=result.parsed.length?"<details><summary>Ver los "+result.parsed.length+" jugadores reconocidos</summary><ol>"+
  result.parsed.map(p=>"<li>"+esc(p.name)+" — "+(p.role==="starter"?"Titular":"Suplente")+"</li>").join("")+
  "</ol></details>":"";
 box.innerHTML=summary+problems+details+
  (!result.errors.length&&(result.starter<20||result.sub<10)?"<p class=\"muted\">Convocatoria incompleta: puedes añadir más jugadores después.</p>":"");
 $("bulkApply").disabled=!!result.errors.length;
 bulkRosterPreviewSignature=result.errors.length?"":bulkSignature();
 $("bulkStatus").textContent=result.errors.length?"No se ha modificado la convocatoria.":"Revisión completa. Confirma para aplicar los cambios.";
 $("bulkStatus").className="notice "+(result.errors.length?"error":"info");
}
function applyBulkRoster(){
 if(!state||!bulkRosterPreviewSignature||bulkRosterPreviewSignature!==bulkSignature()){
  invalidateBulkRoster();
  notice("La convocatoria ha cambiado. Comprueba de nuevo el texto antes de importarlo.","error");return;
 }
 const result=evaluateBulkRoster();
 if(result.errors.length){previewBulkRoster();return;}
 if(result.replace&&state.roster.length&&!window.confirm(
  "¿Reemplazar los "+state.roster.length+" participantes actuales por "+result.planned.length+"? Se quitarán las asignaciones de los jugadores eliminados o que cambien de tipo."
 ))return;
 if(result.replace){
  for(const old of state.roster){
   const next=result.planned.find(p=>normal(p.name)===normal(old.name));
   if(!next||next.role!==old.role)removeAssignments(old.name);
  }
  const starterNames=new Set(result.planned.filter(p=>p.role==="starter").map(p=>normal(p.name)));
  if(!starterNames.has(normal(state.leader)))state.leader="";
  if(!starterNames.has(normal(state.alternate)))state.alternate="";
 }
 state.roster=result.planned;
 renderRoster();mutate();
 bulkRosterPreviewSignature="";
 $("bulkApply").disabled=true;
 $("bulkPreviewPanel").hidden=true;
 $("bulkStatus").textContent="✓ Texto importado: "+result.starter+" titulares, "+result.sub+" suplentes. Guarda el borrador para sincronizarlo con HOLa.";
 $("bulkStatus").className="notice success";
 notice("✓ Participantes importados en Team "+state.team+". Guarda el borrador para conservarlos en Supabase.","success");
}
function renderStats(){
 if(!state)return;
 const {starter,sub}=counts();
 $("starterCount").textContent="Titulares inscritos "+starter+"/20";
 $("subCount").textContent="Suplentes "+sub+"/10";
 $("starterCount").classList.toggle("warn",starter!==20);
 $("subCount").classList.toggle("warn",sub>10);
 $("totalPower").textContent="THP titulares "+number(state.roster.filter(r=>r.role==="starter").reduce((s,r)=>s+Number(r.power||0),0))+"M";
 const missing=state.roster.filter(r=>r.power==null).map(r=>r.name),thpStatus=$("thpSyncStatus");
 if(thpStatus){thpStatus.className="notice "+(missing.length?"info":"success");thpStatus.textContent=!state.roster.length?"El THP viene de Supabase. El OCR puede actualizarlo si encuentra un valor mayor.":missing.length?"Sin THP en Supabase ("+missing.length+"): "+missing.join(" · ")+". Prueba a leer las capturas o actualiza la ficha del miembro.":"✓ THP de "+state.roster.length+" participantes sincronizado con Supabase.";}
 const p1=assignedNames(state.phase1).filter(n=>state.roster.some(r=>r.name===n&&r.role==="starter")).length;
 const p2=assignedNames(state.phase2).filter(n=>state.roster.some(r=>r.name===n&&r.role==="starter")).length;
 const status=$("rosterAssignmentStatus");
 if(status){
  const registered=starter===20;
  status.className="notice "+(registered?"success":"info");
  status.textContent=(registered?"✓ Los 20 titulares ya están inscritos. ":"Convocatoria: "+starter+"/20 titulares inscritos. ")+
   "Mapa Fase 1: "+p1+"/20 asignados · Mapa Fase 2: "+p2+"/20 asignados."+
   (registered&&(p1<20||p2<20)?" Las plazas pendientes del mapa no son jugadores que falten en la convocatoria. Puedes usar «Rellenar plazas vacías» en cada fase.":"");
 }
 updateLeaders();
}

// Screenshot reference: verified from the nine Team A screenshots for 2026-09-25.
// This compares against the LOCAL roster; it never auto-enrolls anyone.
const GAME_A_20260925={"starters":["Judéx ᓚᘏᗢ","SilentBG","CaptainNeb","Laz Ziyaaa ᓚᘏᗢ","Ophicat ᓚᘏᗢ","Sabie tárás","Mirrliva","Alfonzo04","JEBRAWW","Aspackad","Fiexter","naVia","N3v3r89","Lil Niño","Moltó17","Cristina1106","Ayana wars","atEr","dAndrei20","Rey Excalibur"],"subs":["Fenix 04","IDK What Am I Doing","Loïc1791","Txipi","Bassline187","silviu maya","Bola7ad","jack daniels g","Xarnyx","N6C6R6"]};
function renderTeamAAudit(){
 const panel=$("teamAAudit"),out=$("teamAAuditResult");if(!panel||!out)return;
 panel.hidden=!state||state.team!=="A";
 if(panel.hidden){out.hidden=true;return;}
 if(out.hidden)return;
 const dateOK=state.battle_date==="2026-09-25";
 const actual=new Map(state.roster.map(r=>[normal(r.name),r]));
 const expected=new Map(),groups=[];
 for(const [role,label,names] of [["starter","Titulares",GAME_A_20260925.starters],["sub","Suplentes",GAME_A_20260925.subs]]){
  let found=0;const missing=[];
  for(const name of names){
   const key=normal(name),row=actual.get(key);expected.set(key,role);
   if(row?.role===role){found++;continue;}
   const note=row?"Ya inscrito como "+(row.role==="starter"?"titular":"suplente")+". Corrige su tipo en la tarjeta.":
    name==="JEBRAWW"?"En el juego aparece JEBRAW con un símbolo; en HOLa figura como JEBRAWW.":
    /[ᓚᘏᗢ]/.test(name)?"Nombre con símbolo del gato: el OCR puede leer solo parte de los caracteres.":
    "Sin coincidencia en este equipo. La causa concreta requiere conservar la lectura OCR.";
   const action=row?'<span class="audit-warning">REVISAR TIPO</span>':
    '<button type="button" class="btn outline audit-add" data-audit-name="'+esc(name)+'" data-audit-role="'+role+'"'+
    (dateOK?"":" disabled")+'>＋ Añadir '+(role==="starter"?"titular":"suplente")+'</button>';
   missing.push('<div class="audit-person"><div><strong>'+esc(name)+'</strong><small>'+esc(note)+'</small></div>'+action+'</div>');
  }
  groups.push('<div class="audit-group"><h3>'+esc(label)+' · '+found+'/'+names.length+'</h3>'+
   (missing.join("")||'<p class="muted">✓ Todos coinciden con las capturas.</p>')+'</div>');
 }
 const extras=state.roster.filter(r=>expected.get(normal(r.name))!==r.role);
 out.innerHTML=(dateOK?"":'<p class="audit-warning">Estas capturas son del 25/09/2026. Selecciona esa jornada para añadir jugadores.</p>')+
  groups.join("")+(extras.length?'<p class="audit-warning">Revisa también estos registros distintos a la captura: '+
   esc(extras.map(r=>r.name+" ("+(r.role==="starter"?"titular":"suplente")+")").join(" · "))+'</p>':"")+
  '<p class="muted">La comparación no modifica nada. Cada alta requiere pulsar su botón.</p>';
}
function renderRoster(){if(!state)return;const list=$("rosterList");const roster=[...state.roster].sort((a,b)=>a.role.localeCompare(b.role)||Number(b.power||0)-Number(a.power||0));list.innerHTML=roster.length?roster.map(r=>
 '<article class="roster-card" data-name="'+esc(r.name)+'"><div class="person-name"><strong>'+esc(r.name)+'</strong><small>'+esc(r.role==="starter"?"Titular":"Suplente")+' · '+(r.power==null?"THP pendiente en Supabase":number(r.power)+"M")+'</small></div>'+
 '<div class="field"><label>THP · Supabase (solo aumenta)</label><input class="roster-power" inputmode="decimal" type="number" min="0" max="9999" step=".1" value="'+(r.power??"")+'"></div>'+
 '<div class="field role-field"><label>Tipo</label><select class="roster-role"><option value="starter"'+(r.role==="starter"?" selected":"")+'>Titular</option><option value="sub"'+(r.role==="sub"?" selected":"")+'>Suplente</option></select></div>'+
 '<button type="button" class="remove" title="Quitar participante" aria-label="Quitar '+esc(r.name)+'">×</button></article>').join(""):'<p class="muted">Todavía no hay participantes. Sube capturas o añádelos manualmente.</p>';
 renderStats();renderTeamAAudit();
}
function exchangeRosterRoles(player,other){
 if(!other||player===other||player.role===other.role)return false;
 const first=player.name,second=other.name;
 // Exchange tactical places together with the roster roles.
 for(const field of ["phase1","phase2","missions","subs"])
  for(const key of Object.keys(state[field]))
   state[field][key]=state[field][key].map(name=>name===first?second:name===second?first:name);
 for(const key of ["leader","alternate"])
  if(state[key]===first)state[key]=second;else if(state[key]===second)state[key]=first;
 const previous=player.role;player.role=other.role;other.role=previous;
 return true;
}
function showRoleExchange(card,player,next){
 card.querySelector(".role-exchange")?.remove();
 const panel=document.createElement("div");
 panel.className="role-exchange field";panel.style.gridColumn="1 / -1";
 panel.innerHTML='<label>Grupo completo · Elige con quién intercambiar la plaza</label>'+
  '<select class="roster-exchange" aria-label="Jugador para intercambiar la plaza"><option value="">Elegir '+(next==="starter"?"titular":"suplente")+'</option>'+
  state.roster.filter(r=>r.role===next).map(r=>'<option value="'+esc(r.name)+'">'+esc(r.name)+'</option>').join("")+'</select>'+
  '<button type="button" class="btn outline small roster-exchange-cancel">Cancelar intercambio</button>';
 card.append(panel);
 notice("Ya hay "+(next==="starter"?"20 titulares":"10 suplentes")+". Elige en la tarjeta con quién intercambiar la plaza; se conservarán sus puestos en el mapa.","info");
}
async function rosterChange(e){
 const card=e.target.closest(".roster-card");if(!card)return;
 const r=state.roster.find(x=>x.name===card.dataset.name);if(!r)return;
 if(e.target.classList.contains("roster-exchange-cancel")){
  if(e.type!=="click")return;
  card.querySelector(".roster-role").value=r.role;card.querySelector(".role-exchange")?.remove();return;
 }
 if(e.target.classList.contains("roster-exchange")){
  if(e.type!=="change"||!e.target.value)return;
  const other=state.roster.find(x=>x.name===e.target.value);
  if(!exchangeRosterRoles(r,other)){renderRoster();return;}
  renderRoster();mutate();
  notice("✓ Plazas intercambiadas: "+r.name+" · "+(r.role==="starter"?"Titular":"Suplente")+"; "+other.name+" · "+(other.role==="starter"?"Titular":"Suplente")+". Puestos del mapa conservados. Guarda el borrador para conservar el cambio.","success");
  return;
 }
 if(e.target.classList.contains("remove")){
  if(e.type!=="click")return;
  removeAssignments(r.name);state.roster=state.roster.filter(x=>x!==r);renderRoster();mutate();return;
 }
 if(e.target.classList.contains("roster-role")){
  if(e.type!=="change")return;
  const next=e.target.value;
  if(next!==r.role){
   const count=counts();
   if(next==="starter"&&count.starter>=20||next==="sub"&&count.sub>=10){
    e.target.value=r.role;showRoleExchange(card,r,next);return;
   }
   removeAssignments(r.name);r.role=next;
   if(next==="sub"){if(state.leader===r.name)state.leader="";if(state.alternate===r.name)state.alternate="";}
   renderRoster();mutate();
   notice("✓ "+r.name+" ahora es "+(next==="starter"?"titular":"suplente")+". Revisa sus asignaciones y guarda el borrador.","success");
  }
  return;
 }
 if(e.target.classList.contains("roster-power")&&e.type==="change"){
  try{
   const entered=reviewedPower(e.target.value);
   const result=await ensureHigherTHP(r.name,entered);
   renderRoster();mutate();
   notice(result.status==="updated"?"✓ THP actualizado en Supabase: "+r.name+" · "+number(memberTHP(r.name))+"M.":"THP conservado en Supabase: "+r.name+" · "+(memberTHP(r.name)==null?"sin registrar":number(memberTHP(r.name))+"M")+".","success");
  }catch(error){
   renderRoster();mutate();
   notice("No se pudo actualizar THP en Supabase: "+String(error?.message||error),"error");
  }
 }
}
async function importLegacy(){
 try{const {data,error}=await sb.from("desert_storm_participants").select("player_name").eq("battle_date",state.battle_date).eq("team",state.team).order("player_name");if(error)throw error;let n=0;for(const r of data||[]){if(counts().starter>=20)break;try{n+=addRoster(r.player_name,"starter",null)?1:0;}catch{}}
 renderRoster();mutate();notice(n+" nombres importados. La tabla anterior NO distingue titulares y suplentes: comprueba su B y tipo antes de publicar.","info");
 }catch(e){notice("No se pudo importar la lista anterior: "+e.message,"error");}
}
function normalizeOCRLines(data,ox,oy,scale){
 const out=[];const blocks=data?.blocks||[];
 for(const block of blocks)for(const paragraph of block?.paragraphs||[])for(const l of paragraph?.lines||[]){const words=l.words||[];const b=l.bbox||words[0]?.bbox||{};out.push({text:String(l.text||words.map(w=>w.text).join(" ")).trim(),x:ox+Number(b.x0||0)/scale,y:oy+Number(b.y0||0)/scale});}
 if(!out.length)for(const l of data?.lines||[]){const b=l.bbox||{};out.push({text:String(l.text||"").trim(),x:ox+Number(b.x0||0)/scale,y:oy+Number(b.y0||0)/scale});}
 return out.sort((a,b)=>a.y-b.y);
}

async function prepareImage(file){
 const img=await new Promise((resolve,reject)=>{const image=new Image(),url=URL.createObjectURL(file);image.onload=()=>{URL.revokeObjectURL(url);resolve(image);};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("No se pudo abrir "+file.name));};image.src=url;});
 const w=img.naturalWidth,h=img.naturalHeight,original=document.createElement("canvas");original.width=w;original.height=h;
 original.getContext("2d").drawImage(img,0,0);
 // Expand the screenshot region: the previous crop stopped at 62.5% of its
 // width, which cut off part of the displayed THP.
 const x=Math.round(w*.19),y=Math.round(h*.34),cw=Math.round(w*.52),ch=Math.round(h*.495),scale=2.5;
 const cropped=document.createElement("canvas");cropped.width=Math.round(cw*scale);cropped.height=Math.round(ch*scale);
 cropped.getContext("2d").drawImage(img,x,y,cw,ch,0,0,cropped.width,cropped.height);
 return {original,cropped,ox:x,oy:y,scale,w,h,name:file.name};
}
function blueScore(canvas,cx,cy){
 const ctx=canvas.getContext("2d",{willReadFrequently:true}),w=canvas.width,h=canvas.height;
 const x=Math.max(0,Math.floor(w*(cx-.03))),y=Math.max(0,Math.floor(cy-h*.027));
 const cw=Math.min(w-x,Math.ceil(w*.06)),ch=Math.min(h-y,Math.ceil(h*.055));
 if(cw<=0||ch<=0)return 0;const px=ctx.getImageData(x,y,cw,ch).data;let n=0;
 for(let i=0;i<px.length;i+=4){const r=px[i],g=px[i+1],b=px[i+2];if(b>r+20&&b>g+6&&b>118)n++;}
 return n;
}

function readRole(prep,nameTop){
 // The B is on the same card as the name; the old code sampled too low.
 let best={left:0,right:0,score:0};
 for(const offset of [-.025,-.013,0,.012]){
  const cy=nameTop+prep.h*offset;
  const left=blueScore(prep.original,.649,cy),right=blueScore(prep.original,.794,cy);
  if(Math.max(left,right)>best.score)best={left,right,score:Math.max(left,right)};
 }
 const least=Math.min(best.left,best.right);
 if(best.score<45||best.score<least*1.8)return {role:"",note:"No se distingue con seguridad la B: elige titular o suplente."};
 return {role:best.left>best.right?"starter":"sub",note:""};
}
async function ensureHigherTHP(name,value,{reviewed=true}={}){
 if(value==null)return {status:"missing"};
 const saved=memberTHP(name);if(saved!=null&&value<=saved)return {status:"unchanged",current:saved};
 const result=await raiseOfficialTHP(name,value,{reviewed});
 if(result.status==="review")throw new Error("La lectura supera ampliamente el THP actual: revisa el valor antes de actualizar.");
 if(result.status==="changed-elsewhere"&&(result.current==null||result.current+0.00001<value))throw new Error("Otro administrador cambió este THP en Supabase. Vuelve a actualizar antes de intentarlo.");
 if(result.status==="invalid")throw new Error("El THP no es válido.");
 return result;
}
function effectiveTHP(name,read){return memberTHP(name);}
function parsePower(raw){const text=String(raw||"").replace(/O(?=\d)|(?<=\d)O/g,"0");const m=text.match(/(\d{1,4}(?:[.,]\d{1,2})?)\s*[mM]\b/);return m?Number(m[1].replace(",",".")):null;}

function parseCandidates(lines,prep){
 const out=[],maxY=prep.h*.835,minY=prep.h*.345;
 const generic=/\b(?:poder|power|estrateg|seleccion|fuerza especial|búsqueda|batalla|hero|participantes|suplentes|titulares|total|reservas|buscar|battle|confirmed|squad|alliance)\b/i;
 for(const row of lines){
  if(row.y<minY||row.y>maxY||row.x<prep.w*.19||row.x>prep.w*.60)continue;
  const raw=String(row.text||"").replace(/^\s*\d{1,3}\s*[.)-]\s*/,"").replace(/(?:\[\s*)?HOLa(?:\s*\])?/gi,"").replace(/\s{2,}/g," ").trim();
  if(raw.length<3||raw.length>65||generic.test(raw))continue;
  const matched=matchMember(raw);
  const role=readRole(prep,row.y);
  if(!matched.name){
   const key=normal(raw);
   // Do not require a recognised THP just to show a plausible nickname
   // for manual identification in the review panel.
   if(key.length>=4&&key.length<=35&&/\p{L}/u.test(raw)&&!rejectedOCR.has(key)&&rejectedOCR.size<35)
    rejectedOCR.set(key,{text:raw,file:prep.name,role:role.role,power:null,note:"Posible nombre no reconocido; selecciona el miembro oficial si corresponde."});
   continue;
  }
  const note=!matched.exact?"Comprueba el nombre oficial.":role.note;
  out.push({ocrName:raw,name:matched.name,exact:matched.exact,rowY:row.y,
   ocrPower:null,power:memberTHP(matched.name),role:role.role,
   confirmed:matched.exact&&!!role.role&&!note,note,file:prep.name,manual:false,
   powerVerified:false,requiresTHPReview:false});
 }
 const unique=new Map();
 for(const p of out){
  const key=normal(p.name),old=unique.get(key);
  if(!old||Number(p.confirmed)>Number(old.confirmed)||(!old.exact&&p.exact))unique.set(key,p);
 }
 return [...unique.values()];
}
// Preserve nicknames: dictionary corrections can turn player names into English words.
async function getOCRWorker(){
 if(ocrWorker)return ocrWorker;
 if(!window.Tesseract?.createWorker)await new Promise((res,rej)=>{
  const script=document.createElement("script");script.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
  script.onload=res;script.onerror=()=>{script.remove();rej(new Error("No se pudo descargar Tesseract. Comprueba la conexión y vuelve a intentarlo."));};document.head.append(script);
 });
 ocrWorker=await window.Tesseract.createWorker("eng",1,{
  logger:m=>{if(m.status==="recognizing text")$("ocrStatus").textContent=ocrProgress+" · "+Math.round((m.progress||0)*100)+"%";}
 },{load_system_dawg:"0",load_freq_dawg:"0"});
 await ocrWorker.setParameters({preserve_interword_spaces:"1",user_defined_dpi:"300"});
 return ocrWorker;
}
let ocrProgress="Tesseract";
function contrastOCRImage(canvas){
 const copy=document.createElement("canvas");copy.width=canvas.width;copy.height=canvas.height;
 const ctx=copy.getContext("2d",{willReadFrequently:true});ctx.drawImage(canvas,0,0);
 const pixels=ctx.getImageData(0,0,copy.width,copy.height),data=pixels.data;
 // Game text is light on a dark panel. Invert and stretch contrast without
 // binarizing: hard thresholds can erase thin strokes and decimal separators.
 for(let i=0;i<data.length;i+=4){
  const light=.299*data[i]+.587*data[i+1]+.114*data[i+2];
  const value=255-Math.max(0,Math.min(255,(light-35)*255/185));
  data[i]=data[i+1]=data[i+2]=value;
 }
 ctx.putImageData(pixels,0,0);return copy;
}

function powerRowImage(prep,startY,endY){
 const top=Math.max(0,Math.round(startY)),bottom=Math.min(prep.h,Math.round(endY));
 const x=Math.round(prep.w*.19),right=Math.round(prep.w*.71),scale=3;
 if(bottom-top<5)return null;
 const strip=document.createElement("canvas");
 strip.width=Math.round((right-x)*scale);strip.height=Math.round((bottom-top)*scale);
 strip.getContext("2d").drawImage(prep.original,x,top,right-x,bottom-top,0,0,strip.width,strip.height);
 return strip;
}
async function readPowerCard(worker,prep,p,nextNameY,label,errors){
 // A THP can ONLY come from this card's own vertical slice.
 // Never associate numbers in the following OCR lines with a different player.
 const top=p.rowY-prep.h*.013,end=Math.min(p.rowY+prep.h*.070,nextNameY-prep.h*.006);
 const image=powerRowImage(prep,top,end);
 if(!image)return;
 const reads=[];
 for(const [mode,canvas,pass] of [["7",image,"color"],["6",contrastOCRImage(image),"contraste"]]){
  ocrProgress=label+" · "+p.name+" THP "+pass;
  try{
   await worker.setParameters({tessedit_pageseg_mode:mode});
   const result=await worker.recognize(canvas);
   const value=parsePower(result?.data?.text||"");
   if(value!=null)reads.push(value);
  }catch(e){errors.push(prep.name+" · THP "+p.name+" ("+pass+"): "+String(e?.message||e));}
 }
 if(reads.length===2&&Math.abs(reads[0]-reads[1])<=.05){
  p.ocrPower=reads[0];p.powerVerified=true;
 }else{
  // Ignore inconsistent or missing power; never flag a player for THP.
  p.ocrPower=null;p.powerVerified=false;
 }
 p.power=memberTHP(p.name);
}
async function readTesseractPasses(worker,prep,label,errors){
 const passes=[{image:prep.cropped,mode:"11",label:"nombres color"},{image:contrastOCRImage(prep.cropped),mode:"6",label:"nombres contraste"}];
 const perScreenshot=new Map();let completed=0;
 for(const pass of passes){
  ocrProgress=label+" · "+pass.label;$("ocrStatus").textContent=ocrProgress;
  try{
   await worker.setParameters({tessedit_pageseg_mode:pass.mode});
   const {data}=await worker.recognize(pass.image,{}, {text:true,blocks:true});
   for(const incoming of parseCandidates(normalizeOCRLines(data,prep.ox,prep.oy,prep.scale),prep)){
    const key=normal(incoming.name),old=perScreenshot.get(key);
    if(!old){perScreenshot.set(key,incoming);continue;}
    if(old.role&&incoming.role&&old.role!==incoming.role){
     old.role="";old.roleConflict=true;old.note="B contradictoria: selecciona titular o suplente.";old.confirmed=false;
    }else if(!old.role&&!old.roleConflict&&incoming.role)old.role=incoming.role;
    if(!old.exact&&incoming.exact){old.exact=true;old.rowY=incoming.rowY;old.ocrName=incoming.ocrName;}
   }
   completed++;
  }catch(e){errors.push(prep.name+" ("+pass.label+"): "+String(e?.message||e));}
 }
 const rows=[...perScreenshot.values()].sort((a,b)=>a.rowY-b.rowY);
 for(let i=0;i<rows.length;i++)await readPowerCard(worker,prep,rows[i],rows[i+1]?.rowY??Infinity,label,errors);
 mergeProposals(rows);
 return completed;
}
function mergeProposals(rows){
 for(const incoming of rows){
  if(!incoming.name)continue;
  const key=normal(incoming.name);
  const old=proposals.find(p=>normal(p.name)===key);
  if(!old){proposals.push({...incoming,roleConflict:!!incoming.roleConflict,powerConflict:false});continue;}
  old.exact=old.exact||incoming.exact;
  if(!old.roleConflict&&old.role&&incoming.role&&old.role!==incoming.role){old.role="";old.roleConflict=true;}
  else if(!old.roleConflict&&!old.role&&incoming.role)old.role=incoming.role;
  if(!old.powerConflict&&old.ocrPower!=null&&incoming.ocrPower!=null&&Math.abs(old.ocrPower-incoming.ocrPower)>.15){old.ocrPower=null;old.powerConflict=true;}
  else if(!old.powerConflict&&old.ocrPower==null&&incoming.ocrPower!=null)old.ocrPower=incoming.ocrPower;
  old.requiresTHPReview=!!(old.requiresTHPReview||incoming.requiresTHPReview);
   old.roleConflict=!!(old.roleConflict||incoming.roleConflict);
   old.powerConflict=!!(old.powerConflict||incoming.powerConflict);
   old.powerVerified=!!(old.powerVerified||incoming.powerVerified)&&!old.powerConflict;
   old.power=effectiveTHP(old.name,old.powerConflict?null:old.ocrPower);
  if(!old.ocrName&&incoming.ocrName)old.ocrName=incoming.ocrName;
  const notes=[];
  if(old.roleConflict)notes.push("La B difiere entre lecturas: comprueba titular o suplente.");
   if(!old.exact)notes.push("Confirma el nombre del jugador.");
  if(!old.role)notes.push("Selecciona la columna B.");
  old.note=notes.join(" ");
  old.confirmed=!!old.exact&&!!old.role&&!old.note;
 }
}

// THP recognition is optional; player recognition/role never depend on it.
async function applyOCRPowerUpgrades(){
 const outcomes={updated:[],ignored:[],failed:[]};
 for(const p of proposals){
  p.power=memberTHP(p.name);
  if(!p.exact||!p.powerVerified||p.powerConflict||p.ocrPower==null)continue;
  const saved=memberTHP(p.name);
  if(saved==null||p.ocrPower<=saved||p.ocrPower-saved>MAX_OCR_THP_INCREASE+0.00001){
   outcomes.ignored.push(p.name);continue;
  }
  try{
   const result=await raiseOfficialTHP(p.name,p.ocrPower,{reviewed:false});
   if(result.status==="updated")outcomes.updated.push(p.name);
   else if(result.status==="ignored")outcomes.ignored.push(p.name);
  }catch(error){outcomes.failed.push(p.name+": "+String(error?.message||error));}
  p.power=memberTHP(p.name);
 }
 if(outcomes.updated.length&&state){renderRoster();mutate();}
 return outcomes;
}
function existingRosterRecord(name){
 const nameKey=normal(canonical(name)||name);
 return nameKey?state?.roster?.find(r=>normal(canonical(r.name)||r.name)===nameKey)||null:null;
}
function ocrTriage(){
 const accepted=[],toAdd=[],pending=[];
 for(let i=0;i<proposals.length;i++){
  const p=proposals[i],existing=existingRosterRecord(p.name);
  if(existing&&existing.role===p.role&&!p.note){accepted.push({p,i});continue;}
  if(canAcceptAutomatically(p))toAdd.push({p,i});
  else pending.push({p,i});
 }
 return {accepted,toAdd,pending,unmatched:[...rejectedOCR.entries()]};
}
function eligibleMemberOptions(selected="",label="Elegir miembro de HOLa"){
 const options=members.filter(n=>{
  const key=normal(n);
  return key===normal(selected)||(!existingRosterRecord(n)&&!rosterOther.has(key));
 });
 return '<option value="">'+esc(label)+'</option>'+options.map(n=>
  '<option value="'+esc(n)+'"'+(n===selected?' selected':'')+'>'+esc(n)+'</option>').join("");
}
function canAcceptAutomatically(p){
 if(!p||!p.name||!p.exact||p.manual||p.roleConflict)return false;
 const name=canonical(p.name);
 if(!name||!["starter","sub"].includes(p.role)||rosterOther.has(normal(name)))return false;
 // The OCR result may be from a previous accepted batch. Never offer to
 // "add" somebody who is already in the roster or silently change their THP.
 if(existingRosterRecord(name))return false;
 const note=String(p.note||"").trim();
 return !note;
}
function ocrCandidateReason(p){
 if(p.note)return String(p.note);
 if(!p.name||!canonical(p.name))return "Selecciona el nombre oficial de HOLa.";
 if(rosterOther.has(normal(canonical(p.name))))return "Este jugador pertenece al otro equipo en esta jornada.";
 const existing=state?.roster?.find(r=>normal(r.name)===normal(canonical(p.name)));
 if(existing&&existing.role!==p.role)return "Ya está inscrito como "+(existing.role==="starter"?"titular":"suplente")+". Revisa la B.";
 if(!["starter","sub"].includes(p.role))return "No se distingue la B. Indica titular o suplente.";
 if(p.roleConflict)return "B contradictoria entre capturas. Elige la columna correcta.";
 if(!p.exact)return "Confirma el nombre que ha propuesto el OCR.";
 return "Comprueba esta lectura y pulsa «Añadir al equipo».";
}
function renderProposals(){
 if(!$("ocrReview"))return;
 const {accepted,toAdd,pending}=ocrTriage();
 const pendingCount=pending.length;
 $("ocrReview").hidden=!ocrHasRead&&!proposals.length;
 const rosterCounts=state?counts():{starter:0,sub:0};
 const newStarters=toAdd.filter(({p})=>p.role==="starter").length;
 const newSubs=toAdd.filter(({p})=>p.role==="sub").length;
 const missingStarters=Math.max(0,20-rosterCounts.starter);
 const needAfterAccept=Math.max(0,missingStarters-newStarters);
 const registeredText=rosterCounts.starter+"/20 titulares · "+rosterCounts.sub+" suplentes";
 $("ocrSummary").innerHTML='<strong>'+registeredText+'</strong>'+
  '<div class="ocr-counts">'+
  '<span>Nuevos: '+toAdd.length+'</span>'+
  '<span>Por revisar: '+pendingCount+'</span></div>'+
  (missingStarters?
   '<div class="ocr-needed" role="status"><strong>Faltan '+missingStarters+
   ' titular'+(missingStarters===1?'':'es')+' para completar los 20.</strong>'+
   (newStarters?' Hay '+newStarters+' titular'+(newStarters===1?'':'es')+' identificado'+(newStarters===1?'':'s')+' pendiente'+(newStarters===1?'':'s')+' de aceptar.':'')+
   (needAfterAccept?' Si no aparece en las lecturas, selecciónalo abajo de los miembros HOLa.':'')+
   '</div>':
   '<div class="ocr-complete">✓ Los 20 titulares están inscritos. No hace falta completar 10 suplentes.</div>');
 $("ocrAutoPanel").hidden=!toAdd.length;
 $("ocrAutoList").innerHTML=toAdd.length?
  '<details><summary>Ver '+toAdd.length+' jugadores nuevos cotejados con HOLa</summary><div>'+
  toAdd.map(({p})=>'<span class="ocr-ready-person">'+esc(canonical(p.name))+
   ' · '+(p.role==="starter"?"Titular":"Suplente")+(p.power==null?' · THP pendiente':'')+'</span>').join("")+
  '</div></details>':
  '<p class="muted">No quedan nuevos jugadores identificados para incorporar.</p>';
 const bulk=$("acceptVerified");
 bulk.disabled=!toAdd.length||busy||acceptBusy;
 bulk.textContent=acceptBusy?"Comprobando inscripciones…":"✓ Aceptar los "+toAdd.length+" jugadores nuevos";
 $("ocrReviewBox").hidden=!pendingCount;
 $("ocrReviewTitle").textContent="Por revisar · "+pendingCount;
 $("ocrProposals").innerHTML=pending.map(({p,i})=>{
  const roleText=p.role==="starter"?"Titular":p.role==="sub"?"Suplente":"Sin identificar";
  return '<article class="ocr-proposal" data-index="'+i+'">'+
   '<div><strong>Lectura: '+esc(p.ocrName||p.name||"—")+'</strong><small class="muted"> · '+esc(p.file||"captura")+'</small></div>'+
   '<div class="review-warn" role="status">'+esc(ocrCandidateReason(p))+'</div>'+
   '<div class="two"><div class="field"><label>Miembro oficial de HOLa</label><select class="proposal-name">'+playerOption(p.name||"","Seleccionar miembro")+'</select></div>'+
   '<div class="field"><label>B del juego</label><select class="proposal-role"><option value="">Seleccionar</option><option value="starter"'+(p.role==="starter"?" selected":"")+'>B izquierda · Titular</option><option value="sub"'+(p.role==="sub"?" selected":"")+'>B derecha · Suplente</option></select></div></div>'+
   '<div class="field"><label>THP en millones (opcional)</label><input class="proposal-power" type="number" min="0.01" max="9999" step="any" inputmode="decimal" value="'+(p.power??"")+'"></div>'+
   '<button type="button" class="btn good proposal-add" data-add-index="'+i+'">✓ Añadir al equipo como '+roleText.toLowerCase()+'</button>'+
   '</article>';
 }).join("");
 const missingSelect=$("ocrMissingPlayer"),selectedMissing=missingSelect.value||"";
 missingSelect.innerHTML=eligibleMemberOptions(selectedMissing,"Elegir miembro que falta");
 const missing=$("ocrMissingDetails");
 // Manual entry is already visible at the top of this page.
 if(!missingStarters&&missing.open)missing.open=false;
}
function showOCRResult({recognized,newPlayers,existing,pending,readCount,totalShots,failed}){
 $("ocrResultTotal").textContent=String(recognized);
 $("ocrResultNew").textContent=newPlayers+" nuevos";
 $("ocrResultExisting").textContent=existing+" ya inscritos";
 $("ocrResultPending").textContent=pending+" por revisar";
 const details=$("ocrResultAdditional"),notes=[];
 if(readCount<totalShots)notes.push(readCount+"/"+totalShots+" capturas procesadas");
 if(failed)notes.push(failed+" avisos de lectura");
 details.textContent=notes.join(" · ");details.hidden=!notes.length;
 const dialog=$("ocrResultDialog");
 if(!dialog.open){
  if(typeof dialog.showModal==="function")dialog.showModal();
  else dialog.setAttribute("open","");
 }
}
function closeOCRResult(){
 const dialog=$("ocrResultDialog");
 if(typeof dialog.close==="function")dialog.close();else dialog.removeAttribute("open");
}
async function readShots(){
 const shots=[...$("participantShots").files];
 if(!shots.length){notice("Selecciona las capturas del listado del juego.","error");return;}
 if(busy||acceptBusy)return;
 busy=true;$("readShots").disabled=true;$("ocrStatus").hidden=false;proposals=[];rejectedOCR=new Map();ocrHasRead=true;renderProposals();
 const errors=[];let readCount=0;
 try{
  try{await refreshOfficialTHP({render:false});}catch(e){errors.push("THP de Supabase: "+String(e?.message||e));}
  const worker=await getOCRWorker();
  for(let i=0;i<shots.length;i++){
   $("ocrStatus").textContent="Leyendo captura "+(i+1)+"/"+shots.length+" · "+shots[i].name;
   try{
    const prep=await prepareImage(shots[i]);
    const completed=await readTesseractPasses(worker,prep,"Captura "+(i+1)+"/"+shots.length,errors);
    if(completed)readCount++;
   }catch(e){errors.push(shots[i].name+": "+String(e?.message||e));}
  }
  const powerSync=await applyOCRPowerUpgrades();
  proposals.sort((a,b)=>a.role===b.role?(Number(b.power||0)-Number(a.power||0)):(a.role==="starter"?-1:1));
  renderRoster();renderProposals();
  const {accepted,toAdd,pending}=ocrTriage();
  const {starter,sub}=counts();
  showOCRResult({
   recognized:accepted.length+toAdd.length+pending.length,
   newPlayers:toAdd.length,existing:accepted.length,pending:pending.length,
   readCount,totalShots:shots.length,failed:errors.length
  });
  $("ocrStatus").textContent="";
 }catch(e){notice("Error de lectura: "+String(e?.message||e),"error");}
 finally{if(ocrWorker){try{await ocrWorker.terminate();}catch{}ocrWorker=null;}busy=false;$("readShots").disabled=false;$("ocrStatus").hidden=true;renderProposals();}
}
function reviewedPower(value){
 const text=String(value??"").trim().replace(",",".");
 if(!text)return null;
 const number=Number(text);
 if(!Number.isFinite(number)||number<=0||number>9999)throw new Error("Introduce un THP válido en millones o déjalo vacío para completarlo después.");
 return number;
}
function proposalChange(e){
 const row=e.target.closest("[data-index]");if(!row)return;
 const p=proposals[Number(row.dataset.index)];if(!p)return;
 if(e.target.classList.contains("proposal-name")){p.name=e.target.value;p.power=effectiveTHP(p.name,p.ocrPower);}
 if(e.target.classList.contains("proposal-role"))p.role=e.target.value;
 if(e.target.classList.contains("proposal-power")){
  try{p.ocrPower=reviewedPower(e.target.value);p.power=effectiveTHP(p.name,p.ocrPower);p.powerConflict=false;p.requiresTHPReview=false;}catch{p.power=null;}
 }
 if(!e.target.matches(".proposal-name,.proposal-role,.proposal-power"))return;
 p.manual=true;p.confirmed=false;p.note="";
 const reason=ocrCandidateReason(p),warn=row.querySelector(".review-warn");
 if(warn)warn.textContent=reason;
 const add=row.querySelector(".proposal-add");
 if(add)add.textContent="✓ Añadir al equipo como "+(p.role==="starter"?"titular":p.role==="sub"?"suplente":"jugador");
}
function reviewMessage(card,message,type="error"){
 const warning=card?.querySelector(".review-warn");
 if(warning){warning.textContent=message;warning.scrollIntoView({block:"nearest",behavior:"smooth"});}
 notice(message,type);
}
async function acceptOneProposal(index){
 if(busy||acceptBusy)return false;
 const p=proposals[index];if(!p)return false;
 const card=$("ocrProposals").querySelector('[data-index="'+index+'"]');
 const name=canonical(p.name);
 if(!name||!["starter","sub"].includes(p.role)){
  reviewMessage(card,"Selecciona un miembro de HOLa y su B (titular o suplente).");return false;
 }
 let power;
 try{power=reviewedPower(card?.querySelector(".proposal-power")?.value??p.power);}
 catch(e){reviewMessage(card,String(e.message));return false;}
 acceptBusy=true;
 try{
  await refreshOther();
  const added=addRoster(name,p.role);
   // THP failure must not prevent registration.
   try{await ensureHigherTHP(name,power,{reviewed:false});}catch(error){console.warn('THP no actualizado:',error);}
  proposals.splice(index,1);renderRoster();mutate();
  notice((added?"✓ Añadido: ":"✓ Ya inscrito: ")+name+" · "+(p.role==="starter"?"Titular":"Suplente")+
   (memberTHP(name)==null?" · THP pendiente en Supabase.":" · THP sincronizado.") ,"success");
  return true;
 }catch(e){
  p.note=String(e?.message||e);p.manual=true;
  reviewMessage(card,p.note);return false;
 }finally{acceptBusy=false;renderProposals();}
}
async function addMissingPlayer(){
 if(busy||acceptBusy)return false;
 const name=canonical($("ocrMissingPlayer").value),role=$("ocrMissingRole").value;
 if(!name||!["starter","sub"].includes(role)){notice("Elige un miembro oficial y su tipo de inscripción.","error");return false;}
 let power;
 try{power=reviewedPower($("ocrMissingPower").value);}
 catch(e){notice(String(e.message),"error");return false;}
 acceptBusy=true;
 try{
  await refreshOther();
  const added=addRoster(name,role);
   try{await ensureHigherTHP(name,power);}catch(error){console.warn('THP no actualizado:',error);}
  $("ocrMissingPlayer").value="";$("ocrMissingPower").value="";
  renderRoster();mutate();
  notice((added?"✓ Añadido manualmente: ":"✓ Ya inscrito: ")+name+" · "+(role==="starter"?"Titular":"Suplente")+".","success");
  return true;
 }catch(e){notice("No se pudo añadir: "+String(e?.message||e),"error");return false;}
 finally{acceptBusy=false;renderProposals();}
}
async function acceptProposals(){
 if(busy||acceptBusy)return;
 const eligible=proposals.filter(canAcceptAutomatically);
 if(!eligible.length){const n=counts();notice("No hay jugadores nuevos cotejados para incorporar. Inscritos: "+n.starter+"/20 titulares y "+n.sub+" suplentes. Si falta alguien, usa la selección de miembros HOLa.","info");return;}
 acceptBusy=true;renderProposals();
 let added=0,already=0;const rejected=[];
 try{
  await refreshOther();
  const remaining=[];
  for(const p of proposals){
   const existing=existingRosterRecord(p.name);
   if(existing&&existing.role===p.role){
    if(p.manual||p.note){remaining.push(p);continue;}
    already++;continue;
   }
   if(!canAcceptAutomatically(p)){
    if(rosterOther.has(normal(canonical(p.name))))p.note="Este jugador figura en el otro equipo. Comprueba su inscripción.";
    remaining.push(p);continue;
   }
   try{
    if(addRoster(p.name,p.role))added++;else already++;
   }catch(e){p.note=String(e?.message||e);p.manual=true;remaining.push(p);rejected.push(p.name+": "+p.note);}
  }
  proposals=remaining;renderRoster();mutate();
  const pending=ocrTriage().pending.length,actual=counts();
  notice("✓ Incorporados "+added+" · ya inscritos "+already+" · jugadores por revisar "+pending+
   ". Titulares "+actual.starter+"/20 · suplentes "+actual.sub+"."+
   (rejected.length?" Revisa: "+rejected.join(" · "):""),
   rejected.length?"error":"success");
 }catch(e){notice("No se pudo cotejar el otro equipo: "+String(e?.message||e),"error");}
 finally{acceptBusy=false;renderProposals();}
}
function fillUnassignedSlots(){
 if(!state||phase==="final")return;
 const current=phaseSlots(),targets=phaseTargets();
 const taken=new Set(assignedNames(current));
 const waiting=state.roster.filter(r=>r.role==="starter"&&!taken.has(r.name)).sort((a,b)=>Number(b.power||0)-Number(a.power||0));
 let filled=0;
 for(const [slot,target] of Object.entries(targets)){
  while(current[slot].length<target&&waiting.length){const p=waiting.shift();current[slot].push(p.name);filled++;}
 }
 mutate();
 notice(filled?"✓ Colocados "+filled+" titulares en plazas vacías de "+(phase==="phase1"?"Fase 1":"Fase 2")+". Las asignaciones anteriores no se han cambiado; revisa el reparto antes de publicar.":"No quedan titulares libres o plazas vacías en esta fase.","success");
}
function phaseTargets(){return phase==="phase1"?TARGET1:TARGET2;}
function phaseSlots(){return phase==="phase1"?state.phase1:state.phase2;}
function assignedNames(obj){return Object.values(obj).flat();}
function freeStarters(obj){const used=new Set(assignedNames(obj));return state.roster.filter(r=>r.role==="starter"&&!used.has(r.name));}
function assignPerson(slot,name){if(!name)return;if(phase==="final")return;const obj=phaseSlots();if(!obj[slot])return;if(!state.roster.some(r=>r.name===name&&r.role==="starter"))return;for(const k of Object.keys(obj))obj[k]=obj[k].filter(n=>n!==name);obj[slot].push(name);mutate();}
function removePerson(slot,name){const obj=phaseSlots();if(obj[slot])obj[slot]=obj[slot].filter(n=>n!==name);mutate();}
function addSpecial(type,name){
 if(!name)return;
 if(type==="SUB"){setSubDestination(name,selectedBuilding,"phase1");return;}
 const starters=state.roster.filter(r=>r.role==="starter");if(!starters.some(r=>r.name===name))return;
 const assignedHospital=HOSP.some(k=>state.phase1[k].includes(name));
 if(!assignedHospital){notice("La misión especial de Fase 1 debe asignarse a un titular de hospital, no del Science Hub.","error");return;}
 for(const k of Object.keys(state.missions))state.missions[k]=state.missions[k].filter(n=>n!==name);
 state.missions[type].push(name);
 mutate();
}
function removeSpecial(type,slot,name){
 if(type==="SUB")setSubDestination(name,"","phase1");
 else{state.missions[type]=state.missions[type].filter(n=>n!==name);mutate();}
}
function setSubDestination(name,slot,which){
 const allowed=which==="phase1"?SUB_P1:SUB_P2;
 if(slot&&!allowed.includes(slot))return;
 if(!state.roster.some(r=>r.name===name&&r.role==="sub"))return;
 const map=which==="phase1"?state.subs:state.subsPhase2;
 const old=allowed.find(k=>(map[k]||[]).includes(name))||"";
 const oldPhase2=SUB_P2.find(k=>(state.subsPhase2[k]||[]).includes(name))||"";
 for(const k of allowed)map[k]=(map[k]||[]).filter(n=>n!==name);
 if(slot)map[slot].push(name);
 // Preserve manually customised Phase 2 destinations. Default destinations follow Phase 1.
 if(which==="phase1"&&(!oldPhase2||oldPhase2===old)){
  for(const k of SUB_P2)state.subsPhase2[k]=(state.subsPhase2[k]||[]).filter(n=>n!==name);
  if(slot&&SUB_P2.includes(slot))state.subsPhase2[slot].push(name);
 }
 mutate();
}
function setPhase2SubDestination(name,slot){setSubDestination(name,slot,"phase2");}
function listPersons(names,kind="",removable=true){return names.length?names.map(n=>{const r=state.roster.find(x=>x.name===n);return '<div class="person '+esc(kind)+'"><span>'+esc(n)+'</span><span class="power">'+(r?.power==null?"":number(r.power)+"M")+'</span>'+(removable?'<button type="button" data-remove="'+esc(n)+'" aria-label="Quitar '+esc(n)+'">×</button>':"")+'</div>';}).join(""):'<div class="muted">Sin asignar</div>';}
function renderMap(){
 if(!state)return;const boardImage=document.querySelector("#board > img");const mapSrc=mapSource();if(boardImage&&boardImage.getAttribute("src")!==mapSrc)boardImage.src=mapSrc;document.querySelectorAll("[data-phase]").forEach(b=>b.classList.toggle("active",b.dataset.phase===phase));
 $("autoAssign").disabled=phase==="final";$("clearPhase").disabled=phase==="final";$("lastAssault").hidden=phase!=="final";
 $("specialSection").hidden=phase==="final";const shown=phase==="phase1"?SUB_P1:phase==="phase2"?SUB_P2:["SILO","INFO"];
 const obj=phaseSlots(),targets=phaseTargets();$("phaseCount").textContent=phase==="final"?"Orden activada por palabra clave":assignedNames(obj).length+"/20 asignados";
 $("phaseHelp").textContent=phase==="phase1"?"4 titulares por hospital y 4 en Science Hub. Info Center (2) y cada refinería (1) son misiones desde hospitales; nadie abandona Science Hub.":phase==="phase2"?"2 titulares por hospital; 4 en Silo; 2 en Arsenal, Mercenary, Science Hub e Info Center. Apoyo bidireccional Arsenal ↔ Info Center y Mercenary ↔ Science Hub.":"Los jugadores conocen de antemano el protocolo. Solo se activa cuando el responsable escriba la palabra clave al final.";
 if(!shown.includes(selectedBuilding))selectedBuilding=shown[0];
 $("pins").innerHTML=shown.map(k=>{
 const b=BUILDINGS[k],n=phase==="phase1"?(k==="INFO"||k.startsWith("REF")?state.missions[k].length:obj[k]?.length||0):phase==="phase2"?obj[k]?.length||0:"";
 const subMap=phase==="phase1"?state.subs:state.subsPhase2,subCount=phase==="final"?0:(subMap[k]||[]).length;
 return '<button type="button" class="pin '+(selectedBuilding===k?"active":"")+'" data-building="'+k+'" style="left:'+b.x+'%;top:'+b.y+'%">'+b.icon+' '+esc(b.label.replace("Field Hospital ","H").replace("Oil Refinery ","Ref "))+
  '<small>'+(phase==="final"?"OBJETIVO":n+"/"+(targets[k]||(k==="INFO"&&phase==="phase1"?2:1))+(subCount?" · 🔵"+subCount:""))+'</small></button>';
 }).join("");
 if(phase==="final"){$("buildingList").innerHTML='<div class="building"><h3>☢️ Nuclear Silo</h3><p>Todos los jugadores disponibles se concentran para tomar y mantener el Silo.</p></div><div class="building"><h3>📡 Info Center</h3><p>Tomar y mantener para aumentar los puntos del equipo. Abandonar los hospitales.</p></div>';return;}
 $("buildingList").innerHTML=Object.keys(targets).map(k=>{
 const b=BUILDINGS[k],names=obj[k]||[],unused=freeStarters(obj),subMap=phase==="phase1"?state.subs:state.subsPhase2,subNames=subMap[k]||[];
 return '<article class="building '+(selectedBuilding===k?"target":"")+' '+(names.length!==targets[k]?"missing":"")+'" id="building-'+k+'" data-slot="'+k+'"><div class="building-head"><h3>'+b.icon+' '+esc(b.label)+'</h3><span class="counter '+(names.length!==targets[k]?"warn":"")+'">'+names.length+'/'+targets[k]+'</span></div><div class="people">'+listPersons(names)+(subNames.length?'<div class="sub-building-note">🔵 Suplentes: '+esc(subNames.join(", "))+'</div>':"")+'</div><div class="assign-control"><select class="assign-select" aria-label="Asignar jugador a '+esc(b.label)+'"><option value="">Elegir titular libre</option>'+unused.map(r=>'<option value="'+esc(r.name)+'">'+esc(r.name)+' · '+(r.power==null?"?":number(r.power)+"M")+'</option>').join("")+'</select><button type="button" class="btn small assign-btn">＋</button></div></article>';
 }).join("");
 if(phase==="phase1")renderSpecials();
 if(phase==="phase2"){
  const refineryCards=["REF1","REF2"].map(k=>{
   const subs=state.subsPhase2[k]||[];
   return '<article class="building" id="building-'+k+'" data-slot="'+k+'"><h3>'+BUILDINGS[k].icon+' '+esc(BUILDINGS[k].label)+'</h3><div class="people">'+
    (subs.length?'<div class="sub-building-note">🔵 Suplentes: '+esc(subs.join(", "))+'</div>':'<p class="muted">Sin suplentes destinados.</p>')+
    '</div><p class="muted">Destino de suplentes, sin plazas adicionales de titular.</p></article>';
  }).join("");
  $("buildingList").insertAdjacentHTML("beforeend",refineryCards);
  renderPhase2Subs();
 }
}
function renderSpecials(){
 const groups=[["INFO","Info Center · 2 misiones",2],["REF1","Refinería 1 · 1 misión",1],["REF2","Refinería 2 · 1 misión",1]];
 const hospitalStarters=state.roster.filter(r=>r.role==="starter"&&HOSP.some(k=>state.phase1[k].includes(r.name)));
 const already=new Set(Object.values(state.missions).flat());
 $("specialList").innerHTML=groups.map(([slot,title,count])=>{
  const names=state.missions[slot];
  return '<article class="building" data-special="'+slot+'" data-slot="'+slot+'"><div class="building-head"><h3>'+esc(title)+'</h3><span class="counter">'+names.length+'/'+count+'</span></div><div class="people">'+listPersons(names,"mission")+'</div><div class="assign-control"><select class="assign-select" aria-label="Asignar '+esc(title)+'"><option value="">Elegir titular de hospital</option>'+hospitalStarters.filter(r=>!already.has(r.name)).map(r=>'<option value="'+esc(r.name)+'">'+esc(r.name)+'</option>').join("")+'</select><button type="button" class="btn small assign-btn">＋</button></div></article>';
 }).join("");
 $("specialList").insertAdjacentHTML("beforeend",renderSubDestinationPanel("phase1"));
}
function renderPhase2Subs(){
 $("specialList").innerHTML=renderSubDestinationPanel("phase2")+
  '<div class="building"><h3>↔ Apoyo entre edificios</h3><p>Arsenal ↔ Info Center</p><p>Mercenary ↔ Science Hub</p></div>';
}
function renderSubDestinationPanel(which){
 const first=which==="phase1",targetKeys=first?SUB_P1:SUB_P2,map=first?state.subs:state.subsPhase2;
 const subs=state.roster.filter(r=>r.role==="sub").sort((a,b)=>Number(b.power||0)-Number(a.power||0));
 const assigned=subs.filter(r=>targetKeys.some(k=>(map[k]||[]).includes(r.name))).length;
 const cards=subs.map(r=>{
  const destination=targetKeys.find(k=>(map[k]||[]).includes(r.name))||"";
  return '<div class="phase2-sub-row"><div><strong>'+esc(r.name)+'</strong><small> '+(r.power==null?'THP pendiente':number(r.power)+'M')+'</small></div>'+
   '<select class="sub-destination-target" data-sub-phase="'+which+'" data-sub-player="'+esc(r.name)+'" aria-label="Destino del suplente '+esc(r.name)+'">'+
   '<option value=""'+(destination?'':' selected')+'>Elegir destino</option>'+
   targetKeys.map(k=>'<option value="'+k+'"'+(k===destination?' selected':'')+'>'+esc(BUILDINGS[k].label)+'</option>').join('')+
   '</select></div>';
 }).join("");
 return '<div class="building phase2-sub-panel"><div class="building-head"><h3>🔵 Destinos manuales de suplentes · '+(first?'Fase 1':'Fase 2')+'</h3><span class="counter '+(assigned!==subs.length?'warn':'')+'">'+assigned+'/'+subs.length+'</span></div>'+
  '<p class="muted"><span>'+(first?'Elige libremente un hospital, Science Hub, Info Center o una refinería. Silo, Arsenal y Mercenary siguen cerrados durante esta fase.':'Elige cualquier edificio para cada suplente: Silo, Science Hub, Arsenal, Info Center, Mercenary, hospitales o refinerías.')+'</span> <span>Los suplentes no ocupan plazas adicionales; solo entran cuando hay hueco.</span></p>'+
  '<div class="phase2-sub-grid">'+(cards||'<p class="muted">No hay suplentes inscritos.</p>')+'</div></div>';
}
function autoAssign(){
 if(!state||phase==="final")return;
 const starters=state.roster.filter(r=>r.role==="starter");
 if(!starters.length){
  notice("No hay titulares inscritos. Añade jugadores en «02 · Equipo» antes de repartir el mapa.","error");
  return;
 }
 const withoutPower=starters.filter(r=>r.power==null||!Number.isFinite(Number(r.power))||Number(r.power)<=0);
 const sorted=[...starters].sort((a,b)=>{
  const ap=a.power!=null&&Number.isFinite(Number(a.power))&&Number(a.power)>0;
  const bp=b.power!=null&&Number.isFinite(Number(b.power))&&Number(b.power)>0;
  return Number(bp)-Number(ap)||(bp?Number(b.power)-Number(a.power):0);
 }).map(r=>r.name);
 if(phase==="phase1"){
  for(const k of P1)state.phase1[k]=[];
  const waves=[...P1,...[...P1].reverse(),...P1,...[...P1].reverse()];
  sorted.forEach((name,i)=>state.phase1[waves[i]].push(name));
  const used=new Set(),hospitalPool=HOSP.flatMap(k=>state.phase1[k]);
  const pick=preferred=>{
   const name=[preferred,...hospitalPool].find(n=>n&&!used.has(n));
   if(name)used.add(name);
   return name||null;
  };
  state.missions={
   INFO:[pick(state.phase1.H4[1]),pick(state.phase1.H1[1])].filter(Boolean),
   REF1:[pick(state.phase1.H1[2])].filter(Boolean),
   REF2:[pick(state.phase1.H2[2])].filter(Boolean)
  };
  const power=new Map(starters.map(r=>[r.name,r.power==null?0:Number(r.power)||0]));
  const strength=k=>state.phase1[k].reduce((sum,name)=>sum+(power.get(name)||0),0);
  const hospitalByStrength=[...HOSP].sort((a,b)=>strength(b)-strength(a));
  // Auto-arrange unassigned substitutes only: never erase a manual choice in either phase.
  const subsByPower=state.roster.filter(r=>r.role==="sub").sort((a,b)=>Number(a.power||0)-Number(b.power||0));
  let nextHospital=0;
  for(const r of subsByPower){
   const assigned1=SUB_P1.find(k=>(state.subs[k]||[]).includes(r.name));
   if(!assigned1){const hospital=hospitalByStrength[nextHospital++%4];state.subs[hospital].push(r.name);}
   const assigned2=SUB_P2.some(k=>(state.subsPhase2[k]||[]).includes(r.name));
   if(!assigned2){
    const dest=SUB_P1.find(k=>(state.subs[k]||[]).includes(r.name));
    if(dest&&SUB_P2.includes(dest))state.subsPhase2[dest].push(r.name);
   }
  }
 }else if(phase==="phase2"){
  for(const k of P2)state.phase2[k]=[];
  state.phase2.SILO=sorted.slice(0,4);
  ["ARSENAL","MERC","HUB","INFO"].forEach((k,i)=>state.phase2[k]=[sorted[4+i],sorted[8+i]].filter(Boolean));
  HOSP.forEach((k,i)=>state.phase2[k]=[sorted[12+i],sorted[16+i]].filter(Boolean));
 }
 mutate();
 const remaining=20-starters.length;
 const partial=remaining>0||withoutPower.length>0;
 let message=remaining>0?
  "Repartidos "+starters.length+"/20 titulares inscritos en "+(phase==="phase1"?"Fase 1":"Fase 2")+
  ". Faltan "+remaining+" por inscribir; sus plazas siguen vacías. ":
  "✓ Los 20 titulares repartidos en "+(phase==="phase1"?"Fase 1":"Fase 2")+". ";
 if(withoutPower.length)message+=withoutPower.length+" titular"+(withoutPower.length===1?"":"es")+
  " sin THP: reparto provisional, no equilibrado por poder. Añade sus THP y revisa el mapa. ";
 notice(message+"Comprueba el reparto antes de guardar.",partial?"info":"success");
}
function validate(){
 const errors=[],warnings=[];const countsNow=counts();
 if(countsNow.starter!==20)errors.push("Convocatoria: hay "+countsNow.starter+"/20 titulares inscritos; faltan "+(20-countsNow.starter)+" personas en el roster.");
 if(countsNow.sub>10)errors.push("Convocatoria: hay más de 10 suplentes.");
 if(new Set(state.roster.map(r=>normal(r.name))).size!==state.roster.length)errors.push("Hay jugadores duplicados en la convocatoria.");
 const overlap=state.roster.filter(r=>rosterOther.has(normal(r.name))).map(r=>r.name);if(overlap.length)errors.push("Inscritos también en el otro equipo: "+overlap.join(", ")+".");
 if(state.roster.some(r=>r.power==null))warnings.push("Hay THP sin registrar en Supabase. El mapa puede prepararse, pero el reparto equilibrado queda provisional hasta actualizar las fichas de miembros.");
 for(const [phaseKey,targets] of [["phase1",TARGET1],["phase2",TARGET2]]){
  const assigned=assignedNames(state[phaseKey]);
  for(const [slot,n]of Object.entries(targets))if(state[phaseKey][slot].length!==n)errors.push((phaseKey==="phase1"?"Fase 1 (MAPA): ":"Fase 2 (MAPA): ")+BUILDINGS[slot].label+" tiene "+state[phaseKey][slot].length+"/"+n+" plazas asignadas; no significa que falten inscritos.");
  if(new Set(assigned).size!==assigned.length)errors.push("Un jugador figura dos veces en "+phaseKey+".");
  if(assigned.some(n=>!state.roster.some(r=>r.name===n&&r.role==="starter")))errors.push("Una fase contiene alguien que no es titular.");
 }
 for(const [key,n]of [["INFO",2],["REF1",1],["REF2",1]])if(state.missions[key].length!==n)errors.push("Misión "+BUILDINGS[key].label+": "+state.missions[key].length+"/"+n+".");
 const missions=assignedNames(state.missions);if(new Set(missions).size!==missions.length)errors.push("Hay un jugador asignado a dos misiones simultáneas en Fase 1.");
 if(missions.some(n=>!HOSP.some(k=>state.phase1[k].includes(n))))errors.push("Las misiones de Info y refinerías deben salir de los hospitales; nadie abandona Science Hub.");
 const subNames=state.roster.filter(r=>r.role==="sub").map(r=>r.name);
 for(const [field,phaseLabel,validKeys] of [["subs","Fase 1",SUB_P1],["subsPhase2","Fase 2",SUB_P2]]){
  const allEntries=Object.entries(state[field]);
  const subsAssigned=allEntries.flatMap(([,names])=>names);
  if(allEntries.some(([k,names])=>!validKeys.includes(k)&&names.length))errors.push("Hay suplentes en un edificio cerrado de "+phaseLabel+".");
  if(subsAssigned.length!==subNames.length||new Set(subsAssigned).size!==subsAssigned.length||subNames.some(n=>!subsAssigned.includes(n)))errors.push("Todos los suplentes deben tener exactamente un destino asignado en "+phaseLabel+".");
 }
 if(!state.leader||!state.roster.some(r=>r.name===state.leader&&r.role==="starter"))errors.push("Elige un titular como responsable de la palabra clave.");
 if(state.alternate&&(!state.roster.some(r=>r.name===state.alternate&&r.role==="starter")||state.alternate===state.leader))errors.push("El responsable alternativo debe ser otro titular.");
 if(!state.keyword.trim())errors.push("Define la palabra clave del Último Asalto.");
 return {errors,warnings};
}
function renderValidation(){if(!state)return;const {errors,warnings}=validate();$("validation").innerHTML=errors.map(s=>'<div class="review-error">⚠ '+esc(s)+'</div>').join("")+warnings.map(s=>'<div class="review-warn">ℹ '+esc(s)+'</div>').join("")+(!errors.length?'<div class="review-good">✓ Convocatoria y dos fases completas. Lista para publicar.</div>':"");$("publishPlan").disabled=!!errors.length||busy;}
function groupText(phaseKey,lang){
 const obj=state[phaseKey],targets=phaseKey==="phase1"?TARGET1:TARGET2;
 const trLabels={H1:"Saha Hastanesi 1",H2:"Saha Hastanesi 2",H3:"Saha Hastanesi 3",H4:"Saha Hastanesi 4",HUB:"Bilim Merkezi",INFO:"Bilgi Merkezi",SILO:"Nükleer Silo",ARSENAL:"Cephanelik",MERC:"Paralı Asker Fabrikası"};
 const subMap=phaseKey==="phase1"?state.subs:state.subsPhase2;
 const keys=phaseKey==="phase1"?SUB_P1:SUB_P2;
 return keys.map(k=>{
  const names=obj[k]||[],reserve=subMap[k]||[];
  if(!targets[k]&&!reserve.length)return "";
  return (lang==="tr"?trLabels[k]||BUILDINGS[k].label:BUILDINGS[k].label)+": "+(names.join(", ")||"—")+(reserve.length?" ["+(lang==="tr"?"YEDEK":lang==="en"?"SUB":"SUPLENTES")+": "+reserve.join(", ")+"]":"");
 }).filter(Boolean).join("\n");
}
function buildMail(){if(!state)return "";const en=state.language==="en",t=state.team,head="HOLa · DESERT STORM · TEAM "+t+"\n"+state.templateName+" · "+state.battle_date+" · "+state.serverTime+" SERVER\n";
 if(state.language==="tr")return head+"\nFAZ 1 (00:00–10:00)\n"+groupText("phase1","tr")+"\n\nÖZEL GÖREVLER (hastanelerden)\nInfo Center: "+state.missions.INFO.join(", ")+"\nPetrol Rafinerisi 1: "+state.missions.REF1.join(", ")+"\nPetrol Rafinerisi 2: "+state.missions.REF2.join(", ")+"\nScience Hub oyuncuları merkezden ayrılmaz.\n\nFAZ 2 (10:00'DAN SONRA)\n"+groupText("phase2","tr")+"\n\nKARŞILIKLI DESTEK\nArsenal ↔ Info Center. Mercenary Factory ↔ Science Hub.\n\nYEDEKLER\nSahada en fazla 20 oyuncu bulunabilir. Asil oyuncular savaştan 5 dakika önce girebilir; yedekler ancak savaş başladıktan sonra boş kontenjan varsa girebilir. Birlikleri biten oyuncu çıkarak yer açabilir. Her yedek, 10. dakikadan önce Faz 1 için atanan hedefe; 10. dakikadan sonra Faz 2 için atanan hedefe gider. Çıkan oyuncunun yerine değil, kendi hedefinize gidin.\n\nSON HÜCUM (YALNIZCA EMİRLE)\nKod sözcüğü: "+state.keyword+" · Komut veren: "+(state.leader||"Henüz seçilmedi")+(state.alternate?" · Yedek: "+state.alternate:"")+"\nSavaşın sonuna doğru az farkla gerideysek ve kod sözcüğü yazılırsa: hastaneleri terk edin, tüm uygun oyuncular Nuclear Silo'ya; Info Center'ı ele geçirip tutun.\n\nYayımlanan haritayı HOLa Desert Storm sayfasında inceleyin.";
 if(en)return head+"\nPHASE 1 (00:00–10:00)\n"+groupText("phase1","en")+"\n\nSPECIAL MISSIONS (from hospitals)\nInfo Center: "+state.missions.INFO.join(", ")+"\nOil Refinery 1: "+state.missions.REF1.join(", ")+"\nOil Refinery 2: "+state.missions.REF2.join(", ")+"\nScience Hub players stay at the Hub.\n\nPHASE 2 (AFTER 10:00)\n"+groupText("phase2","en")+"\n\nMUTUAL SUPPORT\nArsenal ↔ Info Center. Mercenary Factory ↔ Science Hub.\n\nSUBSTITUTES\nOnly 20 players can be inside. Starters may enter 5 min before battle; substitutes enter only after battle starts if a slot is free. A player who runs out of troops may leave to free a slot. Before minute 10, go to your assigned Phase 1 destination. After minute 10, go to your assigned Phase 2 destination (including refineries). Follow the plan regardless of who left.\n\nFINAL ASSAULT (ONLY WHEN ORDERED)\nKeyword: "+state.keyword+" · Caller: "+(state.leader||"TBD")+(state.alternate?" · Backup: "+state.alternate:"")+"\nNear the end, if we are slightly behind and the keyword is posted: abandon hospitals, all available players to Nuclear Silo, take and hold Info Center.\n\nRead the published map on the HOLa Desert Storm page.";
 return head+"\nFASE 1 (00:00–10:00)\n"+groupText("phase1","es")+"\n\nMISIONES ESPECIALES (desde hospitales)\nInfo Center: "+state.missions.INFO.join(", ")+"\nRefinería 1: "+state.missions.REF1.join(", ")+"\nRefinería 2: "+state.missions.REF2.join(", ")+"\nLos jugadores de Science Hub no lo abandonan.\n\nFASE 2 (DESDE EL MINUTO 10)\n"+groupText("phase2","es")+"\n\nAPOYO MUTUO\nArsenal ↔ Info Center. Mercenary Factory ↔ Science Hub.\n\nSUPLENTES\nSolo 20 jugadores pueden estar dentro. Los titulares pueden entrar 5 min antes; los suplentes solo tras el inicio si hay plaza. Un jugador sin tropas puede salir y liberar una plaza. Antes del minuto 10, cada suplente va al edificio que tenga asignado en Fase 1. Después del minuto 10, al edificio asignado en Fase 2 (incluidas refinerías), sin importar quién haya salido.\n\nÚLTIMO ASALTO (SOLO POR ORDEN)\nPalabra clave: "+state.keyword+" · Responsable: "+(state.leader||"Pendiente")+(state.alternate?" · Alternativo: "+state.alternate:"")+"\nAl final, si perdemos por poco y se escribe la clave: abandonar hospitales, concentrarse en Nuclear Silo y tomar Info Center.\n\nConsulta el mapa publicado en la página Desert Storm de HOLa.";
}
function buildAnnouncement(){const en=state.language==="en";if(en)return "HOLa DS TEAM "+state.team+" · "+state.battle_date+" · "+state.serverTime+" server. Starters: be ready 5 min before battle. Substitutes: enter only after start if a slot opens; follow your assigned Phase 1 or Phase 2 destination. Follow Phase 1 and Phase 2 in the in-game mail and HOLa DS page. Final assault ONLY on keyword "+state.keyword+" from "+(state.leader||"the team caller")+". Then leave hospitals, push Nuclear Silo and take Info Center.";
 if(state.language==="tr")return "HOLa DS TEAM "+state.team+" · "+state.battle_date+" · "+state.serverTime+" sunucu saati. Asil oyuncular: savaştan 5 dk önce hazır olun. Yedekler: savaş başladıktan sonra boş yer varsa girin ve Faz 1 veya Faz 2 hedefinize gidin. Faz 1 ve Faz 2 için oyun postasını ve HOLa DS sayfasını okuyun. Son hücum yalnızca "+state.keyword+" koduyla ("+(state.leader||"takım komutanı")+"). Hastaneleri terk edin, Silo ve Info Center'ı alın.";
 return "HOLa DS TEAM "+state.team+" · "+state.battle_date+" · "+state.serverTime+" servidor. Titulares: preparados 5 min antes. Suplentes: entrad solo después del inicio si hay plaza y seguid el destino asignado según la fase. Seguid las fases del correo y la web HOLa. Último asalto SOLO con la clave "+state.keyword+" de "+(state.leader||"el responsable")+". Entonces abandonad hospitales, atacad Silo y tomad Info Center.";
}
function renderOutputs(){if(!state)return;$("mailOutput").value=buildMail();if(document.activeElement!==$("announcement"))$("announcement").value=buildAnnouncement();updateAnnounceCount();}
function updateAnnounceCount(){const len=$("announcement").value.length;$("announceCount").textContent=len+"/500";$("announceCount").classList.toggle("warn",len>500);$("copyAnnouncement").disabled=len>500||!len;}
async function copyText(id){const text=$(id).value;try{await navigator.clipboard.writeText(text);notice("Texto copiado al portapapeles.","success");}catch{$(id).focus();$(id).select();notice("Selecciona y copia el texto manualmente: el navegador bloqueó el portapapeles.","info");}}
async function saveDraft(published=false){
 if(busy)return false;busy=true;for(const b of ["publishPlan","saveDraftPlan","saveDraftBottom"])$(b).disabled=true;
 try{await refreshOther();await refreshOfficialTHP({render:false});if(published){const {errors}=validate();if(errors.length)throw new Error("Revisa los avisos antes de publicar: "+errors[0]);}
  state.battle_date=$("battleDate").value;state.team=$("team").value;state.serverTime=$("serverTime").value;state.templateName=$("templateName").value.trim()||"Operación Faraón";state.keyword=$("keyword").value.trim();state.leader=$("leader").value;state.alternate=$("alternate").value;state.language=$("language").value;
  const payload={battle_date:state.battle_date,team:state.team,draft:JSON.parse(JSON.stringify(state)),updated_at:new Date().toISOString()};
  if(published){payload.published=JSON.parse(JSON.stringify(state));payload.published_at=new Date().toISOString();}
  const {error}=await sb.from("desert_storm_plans").upsert(payload,{onConflict:"battle_date,team"});if(error)throw error;storeLocal();await loadSavedDrafts().catch(e=>console.warn('Listado de borradores DS:',e));
  notice(published?"✓ Estrategia publicada para Team "+state.team+". La web DS mostrará esta versión.":"✓ Borrador guardado en Supabase (todavía no publicado).","success");return true;
 }catch(e){notice("No se pudo "+(published?"publicar":"guardar")+": "+e.message,"error");return false;}finally{busy=false;for(const b of ["publishPlan","saveDraftPlan","saveDraftBottom"])$(b).disabled=false;renderValidation();}
}
function drawText(ctx,text,x,y,maxWidth,font,color){ctx.font=font;ctx.fillStyle=color;ctx.fillText(String(text),x,y,maxWidth);}
// The poster uses the same fixed battlefield as the interactive map. All player
// names, secondary missions and substitute names stay inside its image area.
function posterType(ctx,value,x,y,maxWidth,size=19,color="#fff8e9",weight=800){
 const txt=String(value??"");let px=size;
 while(px>13){ctx.font=weight+" "+px+"px system-ui,-apple-system,Segoe UI,sans-serif";if(ctx.measureText(txt).width<=maxWidth)break;px--;}
 ctx.font=weight+" "+px+"px system-ui,-apple-system,Segoe UI,sans-serif";
 ctx.fillStyle=color;ctx.fillText(txt,x,y,maxWidth);
}
function posterBox(ctx,x,y,w,h,stroke,fill){
 ctx.save();ctx.shadowColor="rgba(0,10,24,.5)";ctx.shadowBlur=16;ctx.shadowOffsetY=5;
 ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,13);ctx.fill();ctx.restore();
 ctx.lineWidth=2;ctx.strokeStyle=stroke;ctx.beginPath();ctx.roundRect(x,y,w,h,13);ctx.stroke();
}
function posterSubLines(ctx,names,maxWidth){
 const lines=[];ctx.font="750 16px system-ui,-apple-system,Segoe UI,sans-serif";
 for(const name of names){
  const last=lines.length-1,joined=last>=0?lines[last]+" · "+name:name;
  if(last<0||ctx.measureText(joined).width>maxWidth)lines.push(name);else lines[last]=joined;
 }
 return lines;
}
function posterCardHeight(ctx,which,k,w){
 const names=state[which][k]||[];
 const subs=(which==="phase1"?state.subs:state.subsPhase2)[k]||[];
 const subLines=posterSubLines(ctx,subs,w-40);
 return Math.max(which==="phase1"?166:108,53+Math.max(names.length,1)*23+(subLines.length?13+subLines.length*19:0)+13);
}
function posterCard(ctx,which,k,rect,tr,trBuildings,mapTop){
 const b=BUILDINGS[k],names=state[which][k]||[],subs=(which==="phase1"?state.subs:state.subsPhase2)[k]||[];
 const {x,y,w,h}=rect,Y=mapTop+y;
 const missionFor=which==="phase1"?state.missions:{};
 const blue="#89d4ff",green="#94ffc0",gold="#f4d584";
 // A short connector identifies the original location without moving the building.
 const ax=b.x*12-60,ay=mapTop+b.y*8.5,nearX=Math.max(x,Math.min(x+w,ax)),nearY=Math.max(Y,Math.min(Y+h,ay));
 if(ax<nearX-8||ax>nearX+8||ay<nearY-8||ay>nearY+8){
  ctx.save();ctx.strokeStyle="rgba(255,221,128,.83)";ctx.lineWidth=2.5;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(nearX,nearY);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle="#ffdf84";ctx.beginPath();ctx.arc(ax,ay,5,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 posterBox(ctx,x,Y,w,h,"#d9b86b","rgba(5,29,49,.93)");
 ctx.fillStyle=which==="phase1"?"#d4ac59":"#53b7c7";ctx.beginPath();ctx.roundRect(x+2,Y+2,5,h-4,3);ctx.fill();
 posterType(ctx,b.icon+" "+(tr?trBuildings[k]||b.label:b.label),x+17,Y+27,w-77,19,gold,900);
 posterType(ctx,names.length+"/"+(which==="phase1"?TARGET1[k]:TARGET2[k]),x+w-56,Y+27,45,15,"#9ce7ef",900);
 ctx.strokeStyle="rgba(232,197,118,.36)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+16,Y+36);ctx.lineTo(x+w-15,Y+36);ctx.stroke();
 let cursor=Y+55;
 if(!names.length)posterType(ctx,tr?"Atanmadı":"Unassigned",x+19,cursor,w-35,17,"#b4c4cd",650);
 for(const name of names){
  const mission=Object.keys(missionFor).find(m=>missionFor[m]?.includes(name));
  if(mission){ctx.fillStyle="rgba(50,174,107,.22)";ctx.beginPath();ctx.roundRect(x+12,cursor-18,w-24,23,5);ctx.fill();}
  posterType(ctx,(mission?"◆ ":"• ")+name,x+19,cursor,w-(mission?111:35),18,mission?green:"#fff9ed",800);
  if(mission)posterType(ctx,mission==="INFO"?"INFO":mission==="REF1"?"REF 1":"REF 2",x+w-81,cursor,68,13,green,900);
  cursor+=23;
 }
 const subLines=posterSubLines(ctx,subs,w-45);
 if(subLines.length){
  cursor+=3;ctx.strokeStyle="rgba(108,186,246,.4)";ctx.beginPath();ctx.moveTo(x+16,cursor);ctx.lineTo(x+w-16,cursor);ctx.stroke();cursor+=19;
  subLines.forEach((line,i)=>{posterType(ctx,(i?"  ":"↳ ")+(tr?"YEDEK: ":"SUB: ")+line,x+19,cursor+i*19,w-37,16,blue,800);});
 }
}
function posterMission(ctx,k,rect,tr,trBuildings,mapTop){
 const names=state.missions[k]||[],subs=state.subs?.[k]||[],{x,y,w}=rect;
 const base=names.length>1?95:76,h=base+(subs.length?26:0),Y=mapTop+y;
 posterBox(ctx,x,Y,w,h,"#7edf9b","rgba(6,53,44,.94)");
 posterType(ctx,"◆ "+(tr?trBuildings[k]||BUILDINGS[k].label:BUILDINGS[k].label),x+14,Y+28,w-29,17,"#c7f9ce",900);
 if(names.length){names.forEach((n,i)=>posterType(ctx,n,x+15,Y+53+i*21,w-28,17,"#fffef1",800));}
 else posterType(ctx,tr?"Görevli yok":"Not assigned",x+15,Y+53,w-28,16,"#d0e5db",650);
 if(subs.length)posterType(ctx,(tr?"YEDEK: ":"SUB: ")+subs.join(" · "),x+15,Y+h-12,w-28,15,"#89d4ff",850);
}
async function createPoster(what="phase1"){
 const isCombined=what==="combined",width=1080,unitHeight=1210,height=isCombined?unitHeight*2:unitHeight;
 const tr=state.language==="tr";
 const trBuildings={H1:"Saha Hastanesi 1",H2:"Saha Hastanesi 2",H3:"Saha Hastanesi 3",H4:"Saha Hastanesi 4",HUB:"Bilim Merkezi",INFO:"Bilgi Merkezi",REF1:"Petrol Rafinerisi 1",REF2:"Petrol Rafinerisi 2",SILO:"Nükleer Silo",ARSENAL:"Cephanelik",MERC:"Paralı Asker Fabrikası"};
 const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const ctx=canvas.getContext("2d");
 const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("No se pudo cargar el mapa de edificios."));i.src=mapSource();});
 function drawPhase(which,offset){
  const mapTop=offset+174,mapHeight=850;
  ctx.fillStyle="#071d30";ctx.fillRect(0,offset,width,unitHeight);
  const grad=ctx.createLinearGradient(0,offset,0,offset+174);grad.addColorStop(0,"#073f59");grad.addColorStop(1,"#061c30");ctx.fillStyle=grad;ctx.fillRect(0,offset,width,174);
  ctx.fillStyle="#d8b65d";ctx.fillRect(0,offset+171,width,3);
  posterType(ctx,state.templateName.toUpperCase()+" · TEAM "+state.team,35,offset+42,1005,27,"#f0d27a",900);
  posterType(ctx,tr?(which==="phase1"?"FAZ 1 · 00:00–10:00":"FAZ 2 · 10:00 SONRASI"):(which==="phase1"?"PHASE 1 · 00:00–10:00":"PHASE 2 · AFTER 10:00"),35,offset+111,1005,54,"#fff7e8",900);
  posterType(ctx,state.battle_date+" · "+state.serverTime+(tr?" SUNUCU SAATİ":" SERVER"),38,offset+148,985,22,"#9de8f5",750);
  // The original map is 1200 × 850. Only 60 px of empty side margins are cropped.
  // Building positions remain unchanged; no names are placed outside the battlefield.
  ctx.drawImage(img,img.naturalWidth*.05,0,img.naturalWidth*.90,img.naturalHeight,0,mapTop,width,mapHeight);
  ctx.fillStyle="rgba(4,19,32,.16)";ctx.fillRect(0,mapTop,width,mapHeight);
  const layout=which==="phase1"?
   {H1:{x:20,y:342,w:315},H3:{x:20,y:610,w:315},H4:{x:743,y:17,w:316},H2:{x:743,y:240,w:316},HUB:{x:743,y:614,w:316}}:
   {INFO:{x:18,y:20,w:292},ARSENAL:{x:385,y:16,w:292},H4:{x:767,y:20,w:292},H2:{x:767,y:224,w:292},H1:{x:18,y:402,w:292},SILO:{x:384,y:344,w:310},H3:{x:18,y:666,w:292},MERC:{x:385,y:664,w:292},HUB:{x:767,y:666,w:292}};
  const keys=which==="phase1"?P1:P2;
  for(const k of keys)layout[k].h=posterCardHeight(ctx,which,k,layout[k].w);
  // Adjust crowded columns if a hospital has several substitutes.
  if(which==="phase1"){
   for(const column of [["H4","H2","HUB"],["H1","H3"]]){
    let bottom=0;for(const k of column){layout[k].y=Math.max(layout[k].y,bottom+12);bottom=layout[k].y+layout[k].h;}
    const overflow=bottom-842;if(overflow>0)for(const k of column)layout[k].y-=overflow;
   }
  }
  if(which==="phase2"){
   for(const column of [["INFO","H1","H3"],["ARSENAL","SILO","MERC"],["H4","H2","HUB"]]){
    let last=8;
    for(const k of column){layout[k].y=Math.max(layout[k].y,last);last=layout[k].y+layout[k].h+9;}
    const overflow=last-9-842;
    if(overflow>0){
     const shift=Math.min(overflow,layout[column[0]].y-8);
     for(const k of column)layout[k].y-=shift;
     if(overflow>shift){let top=8;for(const k of column){layout[k].y=top;top+=layout[k].h+9;}}
    }
   }
  }
  if(which==="phase1"){
   posterMission(ctx,"INFO",{x:326,y:73,w:304},tr,trBuildings,mapTop);
   posterMission(ctx,"REF1",{x:20,y:217,w:285},tr,trBuildings,mapTop);
   posterMission(ctx,"REF2",{x:754,y:456,w:302},tr,trBuildings,mapTop);
  }
  keys.forEach(k=>posterCard(ctx,which,k,layout[k],tr,trBuildings,mapTop));
  ctx.fillStyle="#08283d";ctx.fillRect(0,offset+1024,width,186);
  ctx.fillStyle="#d6af59";ctx.fillRect(0,offset+1024,width,3);
  if(which==="phase1"){
   posterType(ctx,tr?"YEŞİL: GÖREV  ·  MAVİ: YEDEK":"GREEN: SPECIAL MISSION · BLUE: SUBSTITUTE",34,offset+1068,1005,21,"#9fecc8",850);
   posterType(ctx,tr?"YEDEKLER: ATANDIĞINIZ HEDEFE GİDİN":"SUBSTITUTES: GO TO YOUR PHASE 1 DESTINATION",34,offset+1112,1005,20,"#89d4ff",850);
  }else{
   posterType(ctx,"ARSENAL ↔ INFO CENTER · MERCENARY ↔ HUB",34,offset+1068,1005,20,"#a1e5ce",900);
   posterType(ctx,tr?"YEDEKLER: FAZ 2 HEDEFİNE":"BLUE: SUBSTITUTES · GO TO YOUR PHASE 2 DESTINATION",34,offset+1112,1005,21,"#89d4ff",900);
   const refinerySubs=["REF1","REF2"].filter(k=>(state.subsPhase2?.[k]||[]).length)
    .map(k=>(k==="REF1"?"REF 1: ":"REF 2: ")+state.subsPhase2[k].join(", "));
   if(refinerySubs.length)posterType(ctx,"🔵 "+refinerySubs.join("  |  "),34,offset+1138,1005,15,"#89d4ff",800);
  }
  posterType(ctx,(tr?"SON HÜCUM: ":"FINAL: ")+state.keyword+" · "+(state.leader||(tr?"Komutan belirlenmedi":"Caller TBD"))+" · HOLa",34,offset+1162,1005,23,"#f0d17e",900);
  posterType(ctx,"HEROES OF LAST AREA",35,offset+1191,1005,14,"#90b7c6",850);
 }
 if(isCombined){drawPhase("phase1",0);drawPhase("phase2",unitHeight);}else drawPhase(what,0);
 const blob=await new Promise(res=>canvas.toBlob(res,"image/png"));if(!blob)throw new Error("No se pudo generar el PNG.");const url=URL.createObjectURL(blob);
 $("posterPreview").src=url;$("posterPreview").hidden=false;
 const a=document.createElement("a");a.href=url;a.download="HOLa-DS-"+state.team+"-"+state.battle_date+"-"+(isCombined?"Fases-1-2":what)+".png";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function renderMain(){renderRoster();mutate();syncSetup();}
function events(){
 document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
 $("battleDate").addEventListener("change",()=>loadDraft());$("team").addEventListener("change",()=>loadDraft());
 $("previousFriday").onclick=()=>moveFriday(-1);$("nextFriday").onclick=()=>moveFriday(1);
 for(const key of ["serverTime","templateName","keyword","leader","alternate","language"])$(key).addEventListener("change",()=>{if(!state)return;state[key]=$(key).value;mutate();});
 $("saveDraftPlan").onclick=()=>saveDraft();$("saveDraftBottom").onclick=()=>saveDraft();$("publishPlan").onclick=()=>saveDraft(true);
 $("participantShots").onchange=()=>{$("filesInfo").textContent=$("participantShots").files.length+" capturas seleccionadas.";$("filesInfo").hidden=!$("participantShots").files.length;};$("readShots").onclick=readShots;
 $("ocrResultClose").onclick=closeOCRResult;
 $("ocrResultView").onclick=()=>{closeOCRResult();$("ocrReview").hidden=false;$("ocrReview").scrollIntoView({behavior:"smooth",block:"start"});};
 $("ocrResultDialog").addEventListener("click",e=>{if(e.target===$("ocrResultDialog"))closeOCRResult();});
 $("ocrProposals").addEventListener("change",proposalChange);$("ocrProposals").addEventListener("input",proposalChange);$("ocrProposals").addEventListener("click",e=>{const b=e.target.closest(".proposal-add");if(b)acceptOneProposal(Number(b.dataset.addIndex));});$("acceptVerified").onclick=acceptProposals;$("ocrAddMissing").onclick=addMissingPlayer;$("closeReview").onclick=()=>{$("ocrReview").hidden=true;};
 $("manualPlayer").innerHTML=playerOption("","Elegir miembro de HOLa");$("addPlayer").onclick=addManualPlayer;
 $("bulkRosterText").addEventListener("input",invalidateBulkRoster);$("bulkReplace").addEventListener("change",invalidateBulkRoster);
 $("bulkCheck").onclick=previewBulkRoster;$("bulkApply").onclick=applyBulkRoster;
 $("rosterList").addEventListener("change",rosterChange);$("rosterList").addEventListener("click",rosterChange);
 $("refreshTHP").onclick=async()=>{const button=$("refreshTHP");button.disabled=true;try{const n=await refreshOfficialTHP();notice("✓ THP actualizado desde Supabase: "+n+"/"+state.roster.length+" participantes con datos.","success");}catch(error){notice("No se pudo actualizar THP: "+String(error?.message||error),"error");}finally{button.disabled=false;}};
 $("teamAAuditOpen").onclick=()=>{$("teamAAuditResult").hidden=!$("teamAAuditResult").hidden;renderTeamAAudit();};
 $("teamAAuditResult").addEventListener("click",event=>{
  const button=event.target.closest("[data-audit-name][data-audit-role]");
  if(!button||button.disabled||state?.team!=="A"||state.battle_date!=="2026-09-25")return;
  const name=button.dataset.auditName,role=button.dataset.auditRole;
  if(!GAME_A_20260925[role==="starter"?"starters":"subs"].some(n=>normal(n)===normal(name)))return;
  try{const added=addRoster(name,role,null);renderRoster();mutate();
   notice((added?"✓ Añadido: ":"✓ Ya inscrito: ")+name+" · "+(role==="starter"?"Titular":"Suplente")+". THP: "+(memberTHP(name)==null?"pendiente en Supabase":"cargado desde Supabase")+".","success");
  }catch(error){notice("No se ha añadido "+name+": "+String(error?.message||error),"error");}
 });

 $("toPlan").onclick=()=>switchTab("plan");$("toPublish").onclick=()=>switchTab("publish");
 document.querySelectorAll("[data-phase]").forEach(b=>b.addEventListener("click",()=>{phase=b.dataset.phase;renderMap();}));
 $("autoAssign").onclick=autoAssign;$("fillUnassigned").onclick=fillUnassignedSlots;$("clearPhase").onclick=()=>{if(phase==="final")return;for(const k of Object.keys(phaseSlots()))phaseSlots()[k]=[];mutate();};
 $("pins").addEventListener("click",e=>{const k=e.target.closest("[data-building]")?.dataset.building;if(!k)return;selectedBuilding=k;renderMap();$("building-"+k)?.scrollIntoView({behavior:"smooth",block:"center"});});
 $("buildingList").addEventListener("click",e=>{const card=e.target.closest("[data-slot]");if(!card)return;const k=card.dataset.slot;if(e.target.matches("[data-remove]")){removePerson(k,e.target.dataset.remove);return;}if(e.target.closest(".assign-btn")){const select=card.querySelector(".assign-select");assignPerson(k,select?.value);}});
 $("specialList").addEventListener("change",e=>{if(e.target.matches(".sub-destination-target"))setSubDestination(e.target.dataset.subPlayer,e.target.value,e.target.dataset.subPhase);});
 $("specialList").addEventListener("click",e=>{const card=e.target.closest("[data-special]");if(!card)return;const type=card.dataset.special,slot=card.dataset.slot;if(e.target.matches("[data-remove]"))removeSpecial(type,slot,e.target.dataset.remove);else if(e.target.closest(".assign-btn")){selectedBuilding=slot;addSpecial(type,card.querySelector(".assign-select")?.value);}});
 $("copyMail").onclick=()=>copyText("mailOutput");$("copyAnnouncement").onclick=()=>copyText("announcement");
 $("announcement").addEventListener("input",updateAnnounceCount);$("refreshAnnouncement").onclick=()=>{$("announcement").value=buildAnnouncement();updateAnnounceCount();};$("refreshMail").onclick=()=>{$("mailOutput").value=buildMail();};
 for(const [id,kind] of [["poster1","phase1"],["poster2","phase2"],["posterCombined","combined"]])$(id).onclick=()=>createPoster(kind).catch(e=>notice(e.message,"error"));
}
(async()=>{
 try{
  populateFridayDates();$("team").value="B";$("serverTime").value="09:00";
  if(!await verifyAccess())return;
  events();
  try{await loadSavedDrafts(false);}
  catch(e){console.warn("Recuperación de DS:",e);notice("No se pudo consultar tus borradores: "+e.message,"error");}
  await loadDraft(false);
  // No welcome notification: the selected Friday and team are shown in the fields.
 }catch(e){
  $("gate").textContent="No se pudo iniciar el DS Builder: "+e.message;
  $("gate").className="notice error";$("app").hidden=true;console.error(e);
 }
})();