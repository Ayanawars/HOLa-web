import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const sb=createClient("https://ovybstpiomphrouvqxmf.supabase.co","sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV",{auth:{persistSession:true,autoRefreshToken:true}});
const AZURE_URL="https://ovybstpiomphrouvqxmf.supabase.co/functions/v1/vs-azure-ocr";
const KEY="sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV";
const $=id=>document.getElementById(id);
const HOSP=["H1","H2","H3","H4"],P1=["H1","H2","H3","H4","HUB"],P2=["H1","H2","H3","H4","SILO","ARSENAL","MERC","HUB","INFO"];
const BUILDINGS={
H1:{label:"Field Hospital 1",icon:"🏥",x:22,y:65},H2:{label:"Field Hospital 2",icon:"🏥",x:82,y:34},
H3:{label:"Field Hospital 3",icon:"🏥",x:30,y:79},H4:{label:"Field Hospital 4",icon:"🏥",x:68,y:18},
HUB:{label:"Science Hub",icon:"🔬",x:71,y:80},INFO:{label:"Info Center",icon:"📡",x:35,y:19},
REF1:{label:"Oil Refinery 1",icon:"🛢️",x:22,y:36},REF2:{label:"Oil Refinery 2",icon:"🛢️",x:82,y:65},
SILO:{label:"Nuclear Silo",icon:"☢️",x:51,y:48},ARSENAL:{label:"Arsenal",icon:"⚔️",x:52,y:20},
MERC:{label:"Mercenary Factory",icon:"🏭",x:52,y:79}};
const TARGET1={H1:4,H2:4,H3:4,H4:4,HUB:4};
const TARGET2={H1:2,H2:2,H3:2,H4:2,SILO:4,ARSENAL:2,MERC:2,HUB:2,INFO:2};
let members=[],memberByKey=new Map(),rosterOther=new Set(),storedTemplates=[],state=null,phase="phase1",selectedBuilding="H1",proposals=[],ocrWorker=null,currentTab="setup",busy=false;
const normal=value=>String(value||"").normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f\u0640]/g,"").replace(/[^\p{L}\p{N}]+/gu,"");
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const number=value=>Number(value||0).toLocaleString("es-ES",{maximumFractionDigits:1});
function notice(msg,type="info"){$("message").textContent=msg;$("message").className="notice "+type;}
function fresh(){return {version:1,battle_date:$("battleDate").value,team:$("team").value,serverTime:$("team").value==="A"?"18:00":"09:00",templateName:"Operación Faraón",keyword:"ANUBIS",leader:$("team").value==="A"?"Ayana wars":"",alternate:"",language:"en",baseMapDataUrl:"",roster:[],phase1:{H1:[],H2:[],H3:[],H4:[],HUB:[]},phase2:{H1:[],H2:[],H3:[],H4:[],HUB:[],INFO:[],SILO:[],ARSENAL:[],MERC:[]},missions:{INFO:[],REF1:[],REF2:[]},subs:{H1:[],H2:[],H3:[],H4:[]}};}
function canonical(raw){
 const key=normal(raw);
 const aliases={"lolo":"مثالـي25","taajb":"مثالـي25","memofex042":"Memofex042 ᓚᘏᗢ","lazziyaa":"Laz Ziyaaa ᓚᘏᗢ","lazziyaaa":"Laz Ziyaaa ᓚᘏᗢ","sinsiflex":"sinsifeX ᓚᘏᗢ","judex":"Judéx ᓚᘏᗢ","ophicat":"Ophicat ᓚᘏᗢ","jebrawuu":"JEBRAWW"};
 const alias=aliases[key];if(alias&&memberByKey.has(normal(alias)))return memberByKey.get(normal(alias));
 return memberByKey.get(key)||"";
}
function matchMember(raw){
 let name=canonical(raw);if(name)return {name,exact:true};
 const text=normal(String(raw).replace(/poder.*$/i,"").replace(/^\d{1,3}\s+/,""));
 name=memberByKey.get(text);if(name)return {name,exact:true};
 let best="",distance=99,other=99;
 for(const member of members){const key=normal(member);if(key.length<4)continue;
  if(text.startsWith(key)&&text.length-key.length<9)return {name:member,exact:false};
  const d=levenshtein(key,text);if(d<distance){other=distance;distance=d;best=member;}else if(d<other){other=d;}
 }
 return distance<=2&&distance<other&&distance/Math.max(text.length,5)<.24?{name:best,exact:false}:{name:"",exact:false};
}
function levenshtein(a,b){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){const next=[i+1];for(let j=0;j<b.length;j++)next.push(Math.min(next[j]+1,row[j+1]+1,row[j]+(a[i]===b[j]?0:1)));row=next;}return row[b.length];}
function playerOption(selected="",empty="Elegir miembro"){return '<option value="">'+esc(empty)+'</option>'+members.map(n=>'<option value="'+esc(n)+'"'+(n===selected?' selected':'')+'>'+esc(n)+'</option>').join("");}
function stateReady(input){const s=fresh();if(input&&typeof input==="object"){for(const key of ["battle_date","team","serverTime","templateName","keyword","leader","alternate","language"])if(typeof input[key]==="string")s[key]=input[key];if(typeof input.baseMapDataUrl==="string"&&input.baseMapDataUrl.length<600000&&/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(input.baseMapDataUrl))s.baseMapDataUrl=input.baseMapDataUrl;if(Array.isArray(input.roster))s.roster=input.roster.filter(r=>r&&typeof r.name==="string").map(r=>({name:canonical(r.name)||r.name,role:r.role==="sub"?"sub":"starter",power:Number.isFinite(Number(r.power))?Number(r.power):null}));for(const field of ["phase1","phase2","missions","subs"]){for(const key of Object.keys(s[field]))if(Array.isArray(input[field]?.[key]))s[field][key]=input[field][key].filter(n=>typeof n==="string").map(n=>canonical(n)||n);}}return s;}
function localKey(){return "hola-ds-builder-v1:"+$("battleDate").value+":"+$("team").value;}
function storeLocal(){if(state)try{localStorage.setItem(localKey(),JSON.stringify(state));}catch{}}
function mapSource(){return state?.baseMapDataUrl||"assets/ds-battlefield.svg";}
async function useOriginalMap(file){if(!file)return;try{const picture=await new Promise((res,rej)=>{const im=new Image(),url=URL.createObjectURL(file);im.onload=()=>{URL.revokeObjectURL(url);res(im);};im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("No se pudo abrir la imagen."));};im.src=url;});const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=850;canvas.getContext("2d").drawImage(picture,0,0,1200,850);let data=canvas.toDataURL("image/webp",.83);if(data.length>530000)data=canvas.toDataURL("image/webp",.62);if(data.length>530000)throw new Error("El mapa es demasiado grande. Prueba con un JPG o WebP más ligero.");state.baseMapDataUrl=data;mutate();notice("Mapa original incorporado a esta estrategia. Guarda el borrador para conservarlo y publícalo cuando esté listo.","success");}catch(e){notice("No se pudo usar el mapa: "+e.message,"error");}}
function mutate(){storeLocal();renderStats();renderMap();renderValidation();renderOutputs();}
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
 const {data:players,error:pe}=await sb.from("players").select("name,rank").order("name");
 if(pe)throw pe;
 const officer=players.find(p=>["R4","R5"].includes(String(p.rank||"").toUpperCase())&&normal(p.name)===normal(admin.display_name));
 if(!officer){location.replace("admin-login.html");return false;}
 members=players.map(p=>p.name);memberByKey=new Map(members.map(n=>[normal(n),n]));
 $("gate").hidden=true;$("app").hidden=false;notice("Acceso autorizado · "+officer.name+" · R"+officer.rank.replace(/R/i,"").trim(),"success");return true;
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
 if(otherRoster.length){for(const r of otherRoster)if(r?.name)rosterOther.add(normal(r.name));}
 else {for(const r of legacy||[])rosterOther.add(normal(r.player_name));}
}
async function loadDraft(show=true){
 const d=$("battleDate").value,t=$("team").value;if(!d){notice("Selecciona una fecha válida.","error");return;}
 try{await refreshOther();const {data,error}=await sb.from("desert_storm_plans").select("draft,published_at").eq("battle_date",d).eq("team",t).maybeSingle();if(error)throw error;
  const fallback=localStorage.getItem(localKey());const src=data?.draft&&Object.keys(data.draft).length?data.draft:(fallback?JSON.parse(fallback):null);
  state=stateReady(src);state.battle_date=d;state.team=t;state.serverTime=src?.serverTime|| (t==="A"?"18:00":"09:00");
  syncSetup();renderRoster();mutate();loadTemplates().catch(error=>console.warn("Plantillas DS:",error));if(show)notice(src?"Borrador cargado · Team "+t:"Jornada nueva · Team "+t,"success");
 }catch(e){notice("No se pudo cargar la jornada: "+(e.message||e),"error");}
}
function syncSetup(){for(const key of ["serverTime","templateName","keyword","language"])$(key).value=state[key];updateLeaders();}
function counts(){return {starter:state.roster.filter(x=>x.role==="starter").length,sub:state.roster.filter(x=>x.role==="sub").length};}
function removeAssignments(name){for(const field of ["phase1","phase2","missions","subs"])for(const key of Object.keys(state[field]))state[field][key]=state[field][key].filter(n=>n!==name);}
function addRoster(name,role,power){
 name=canonical(name);if(!name)throw new Error("Selecciona un miembro actual de HOLa.");
 if(rosterOther.has(normal(name)))throw new Error(name+" ya figura en el otro equipo para esta jornada.");
 const existing=state.roster.find(r=>normal(r.name)===normal(name));
 if(existing){if(existing.role!==role)throw new Error(name+" ya figura como "+(existing.role==="starter"?"titular":"suplente")+". Revisa su B.");if(power!=null&&Number.isFinite(Number(power)))existing.power=Number(power);return false;}
 const count=counts();if(role==="starter"&&count.starter>=20)throw new Error("Ya hay 20 titulares; no puedes añadir más.");if(role==="sub"&&count.sub>=10)throw new Error("Ya hay 10 suplentes; no puedes añadir más.");
 state.roster.push({name,role,power:power!==""&&power!=null&&Number.isFinite(Number(power))?Number(power):null});return true;
}
function renderStats(){if(!state)return;const {starter,sub}=counts();$("starterCount").textContent="Titulares "+starter+"/20";$("subCount").textContent="Suplentes "+sub+"/10";$("starterCount").classList.toggle("warn",starter!==20);$("subCount").classList.toggle("warn",sub>10);$("totalPower").textContent="THP titulares "+number(state.roster.filter(r=>r.role==="starter").reduce((s,r)=>s+Number(r.power||0),0))+"M";updateLeaders();}
function renderRoster(){if(!state)return;const list=$("rosterList");const roster=[...state.roster].sort((a,b)=>a.role.localeCompare(b.role)||Number(b.power||0)-Number(a.power||0));list.innerHTML=roster.length?roster.map(r=>
 '<article class="roster-card" data-name="'+esc(r.name)+'"><div class="person-name"><strong>'+esc(r.name)+'</strong><small>'+esc(r.role==="starter"?"Titular":"Suplente")+' · '+(r.power==null?"Poder por verificar":number(r.power)+"M")+'</small></div>'+
 '<div class="field"><label>Poder M</label><input class="roster-power" inputmode="decimal" type="number" min="0" max="9999" step=".1" value="'+(r.power??"")+'"></div>'+
 '<div class="field role-field"><label>Tipo</label><select class="roster-role"><option value="starter"'+(r.role==="starter"?" selected":"")+'>Titular</option><option value="sub"'+(r.role==="sub"?" selected":"")+'>Suplente</option></select></div>'+
 '<button type="button" class="remove" title="Quitar participante" aria-label="Quitar '+esc(r.name)+'">×</button></article>').join(""):'<p class="muted">Todavía no hay participantes. Sube capturas o añádelos manualmente.</p>';
 renderStats();
}
function rosterChange(e){const card=e.target.closest(".roster-card");if(!card)return;const r=state.roster.find(x=>x.name===card.dataset.name);if(!r)return;
 if(e.target.classList.contains("remove")){removeAssignments(r.name);state.roster=state.roster.filter(x=>x!==r);renderRoster();mutate();return;}
 if(e.target.classList.contains("roster-role")){const next=e.target.value;if(next!==r.role){const count=counts();if(next==="starter"&&count.starter>=20||next==="sub"&&count.sub>=10){notice("No puedes superar 20 titulares o 10 suplentes.","error");e.target.value=r.role;return;}removeAssignments(r.name);r.role=next;renderRoster();mutate();}return;}
 if(e.target.classList.contains("roster-power")){const v=e.target.value;r.power=v===""?null:Math.max(0,Number(v)||0);mutate();}
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
function azureOCRLines(data,ox,oy,scale){const result=[];for(const parsed of data?.ParsedResults||[])for(const line of parsed.TextOverlay?.Lines||[]){result.push({text:String(line.LineText||"").trim(),x:ox+Number(line.Words?.[0]?.Left||0)/scale,y:oy+Number(line.MinTop||0)/scale});}return result.sort((a,b)=>a.y-b.y);}
async function prepareImage(file){
 const img=await new Promise((resolve,reject)=>{const image=new Image(),url=URL.createObjectURL(file);image.onload=()=>{URL.revokeObjectURL(url);resolve(image);};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("No se pudo abrir "+file.name));};image.src=url;});
 const w=img.naturalWidth,h=img.naturalHeight,original=document.createElement("canvas");original.width=w;original.height=h;
 const ctx=original.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0);
 const x=Math.round(w*.205),y=Math.round(h*.355),cw=Math.round(w*.42),ch=Math.round(h*.465),scale=2.25;
 const cropped=document.createElement("canvas");cropped.width=Math.round(cw*scale);cropped.height=Math.round(ch*scale);
 cropped.getContext("2d").drawImage(img,x,y,cw,ch,0,0,cropped.width,cropped.height);
 const blob=await new Promise(res=>cropped.toBlob(res,"image/jpeg",.94));if(!blob)throw new Error("No se pudo recortar la captura.");
 return {original,blob,ox:x,oy:y,scale,w,h,name:file.name};
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
 const cy=nameTop+prep.h*.029,left=blueScore(prep.original,.649,cy),right=blueScore(prep.original,.794,cy),best=Math.max(left,right),least=Math.min(left,right);
 if(best<45||best<least*1.8)return {role:"",note:"No se distingue con seguridad la B: elige titular o suplente."};
 return {role:left>right?"starter":"sub",note:""};
}
function parsePower(raw){const text=String(raw||"").replace(/O(?=\d)|(?<=\d)O/g,"0");const m=text.match(/(\d{1,4}(?:[.,]\d{1,2})?)\s*[mM]\b/);return m?Number(m[1].replace(",",".")):null;}
function parseCandidates(lines,prep){
 const out=[];const maxY=prep.h*.81,minY=prep.h*.39;
 for(let i=0;i<lines.length;i++){
  const row=lines[i];if(row.y<minY||row.y>maxY||row.x<prep.w*.19||row.x>prep.w*.57)continue;
  const raw=row.text.replace(/^\s*(?:\d+\s+)?/,"").replace(/\s*\[?HOLa\]?.*$/i,"").trim();
  if(!raw||/poder|estrateg|seleccion|fuerza especial|búsqueda|batalla|hero|r[2345]\s*\d+/i.test(raw))continue;
  const match=matchMember(raw);if(!match.name&&raw.length<4)continue;
  // Puntuación THP suele estar en la línea inmediatamente inferior al nombre.
  let power=parsePower(raw);
  for(let j=i+1;j<Math.min(lines.length,i+5)&&power==null;j++)if(lines[j].y-row.y>=-5&&lines[j].y-row.y<prep.h*.065)power=parsePower(lines[j].text);
  const role=readRole(prep,row.y);
  if(!match.name&&!/[\p{L}]/u.test(raw))continue;
  // Los nombres sin coincidencia exacta se revisan: nunca se asignan a ciegas.
  out.push({ocrName:raw,name:match.name,power,role:role.role,verified:match.exact&&!!role.role&&power!=null,note:role.note||(!match.exact?"Confirma el nombre del jugador.":power==null?"Comprueba el poder detectado.":""),file:prep.name});
 }
 const unique=new Map();for(const row of out){const key=normal(row.name||row.ocrName);if(!key)continue;const prev=unique.get(key);if(!prev||Number(row.verified)>Number(prev.verified))unique.set(key,row);}
 return [...unique.values()];
}
async function getOCRWorker(){if(ocrWorker)return ocrWorker;if(!window.Tesseract?.createWorker)await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";s.onload=res;s.onerror=()=>rej(new Error("No se pudo descargar Tesseract."));document.head.append(s);});ocrWorker=await window.Tesseract.createWorker("eng",1,{logger:m=>{if(m.status==="recognizing text")$("ocrStatus").textContent="Tesseract · "+Math.round((m.progress||0)*100)+"%";}});return ocrWorker;}
async function azureLines(prep){
 const response=await fetch(AZURE_URL,{method:"POST",headers:{"apikey":KEY,"Content-Type":"image/jpeg"},body:prep.blob});
 const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error||"Azure "+response.status);
 return azureOCRLines(data,prep.ox,prep.oy,prep.scale);
}
function mergeProposals(rows){
 for(const item of rows){const key=normal(item.name||item.ocrName);if(!key)continue;const old=proposals.find(p=>normal(p.name||p.ocrName)===key);
  if(!old){proposals.push(item);continue;}
  if(item.name&&old.name&&! (normal(item.name)===normal(old.name)))old.note="Nombre diferente entre capturas: confirma la identidad.";
  if(item.role&&old.role&&item.role!==old.role){old.note="La columna B difiere entre capturas: confirma el tipo.";old.role="";}
  if(item.power!=null&&old.power!=null&&Math.abs(item.power-old.power)>.15){old.note="Poder diferente entre capturas: revisa la cifra.";old.power=null;}
  if(!old.name&&item.name)old.name=item.name;if(old.power==null&&item.power!=null&&!/Poder diferente/.test(old.note))old.power=item.power;if(!old.role&&item.role&&!/columna B difiere/.test(old.note))old.role=item.role;
  old.verified=old.verified&&item.verified&&!old.note;
 }
}
function renderProposals(){
 $("ocrReview").hidden=!proposals.length;
 $("ocrProposals").innerHTML=proposals.map((p,i)=>'<article class="ocr-proposal '+(p.verified?"good":"")+'" data-index="'+i+'"><div><strong>'+esc(p.ocrName)+'</strong><small class="muted"> · '+esc(p.file||"captura")+'</small></div>'+
 (p.note?'<div class="review-warn">'+esc(p.note)+'</div>':"")+
 '<div class="two"><div class="field"><label>Miembro oficial</label><select class="proposal-name">'+playerOption(p.name,"Seleccionar nombre")+'</select></div><div class="field"><label>B del juego</label><select class="proposal-role"><option value="">Revisar tipo</option><option value="starter"'+(p.role==="starter"?" selected":"")+'>B izquierda · Titular</option><option value="sub"'+(p.role==="sub"?" selected":"")+'>B derecha · Suplente</option></select></div></div>'+
 '<div class="two"><div class="field"><label>THP (millones)</label><input class="proposal-power" type="number" min="0" max="9999" step=".1" value="'+(p.power??"")+'"></div><div class="field"><label>Estado</label><span class="counter '+(p.verified?"":"warn")+'">'+(p.verified?"Reconocido":"Revisar")+'</span></div></div></article>').join("");
}
async function readShots(){
 const shots=[...$("participantShots").files];if(!shots.length){notice("Selecciona las capturas del listado del juego.","error");return;}
 if(busy)return;busy=true;$("readShots").disabled=true;proposals=[];renderProposals();
 const errors=[];let azureUsed=0;try{const worker=await getOCRWorker();
  for(let i=0;i<shots.length;i++){
   $("ocrStatus").textContent="Leyendo captura "+(i+1)+"/"+shots.length+" · "+shots[i].name;
   try{const prep=await prepareImage(shots[i]);const {data}=await worker.recognize(prep.blob,{}, {text:true,blocks:true});
    let candidates=parseCandidates(normalizeOCRLines(data,prep.ox,prep.oy,prep.scale),prep);
    if(candidates.filter(p=>!!p.name).length<4){try{const azure=parseCandidates(await azureLines(prep),prep);azureUsed++;for(const p of azure){const old=candidates.find(x=>normal(x.name||x.ocrName)===normal(p.name||p.ocrName));if(!old)candidates.push(p);else if(!old.verified&&p.verified)Object.assign(old,p);}}catch(e){errors.push("Azure "+shots[i].name+": "+e.message);}}
    mergeProposals(candidates);
   }catch(e){errors.push(shots[i].name+": "+e.message);}
  }
  renderProposals();$("ocrStatus").textContent="OCR terminado: "+proposals.length+" jugadores únicos. Azure usado en "+azureUsed+" captura(s). "+(errors.length?"Avisos: "+errors.join(" · "):"Revisa las lecturas y confirma.");
  notice(proposals.length?"Lectura terminada. Confirma los "+proposals.length+" participantes antes de incorporarlos.":"No se reconocieron participantes. Prueba otras capturas o añade los nombres manualmente.",proposals.length?"info":"error");
 }catch(e){notice("Error al iniciar OCR: "+e.message,"error");}
 finally{if(ocrWorker){try{await ocrWorker.terminate();}catch{}ocrWorker=null;}busy=false;$("readShots").disabled=false;}
}
function proposalChange(e){const row=e.target.closest("[data-index]");if(!row)return;const p=proposals[Number(row.dataset.index)];if(!p)return;
 if(e.target.classList.contains("proposal-name"))p.name=e.target.value;if(e.target.classList.contains("proposal-role"))p.role=e.target.value;if(e.target.classList.contains("proposal-power"))p.power=e.target.value===""?null:Number(e.target.value);
 p.verified=!!p.name&&!!p.role&&p.power!=null;p.note="";row.classList.toggle("good",p.verified);
}
function acceptProposals(){let added=0,already=0;const remaining=[],errors=[];for(const p of proposals){if(!p.name||!p.role||p.power==null){remaining.push(p);continue;}try{if(addRoster(p.name,p.role,p.power))added++;else already++;}catch(e){p.note=e.message;remaining.push(p);errors.push(p.name||p.ocrName+": "+e.message);}}
 proposals=remaining;renderProposals();renderRoster();mutate();notice("Incorporados "+added+" · repetidos "+already+" · pendientes "+remaining.length+". "+(errors.length?errors.join(" · "):""),errors.length?"error":"success");}
function phaseTargets(){return phase==="phase1"?TARGET1:TARGET2;}
function phaseSlots(){return phase==="phase1"?state.phase1:state.phase2;}
function assignedNames(obj){return Object.values(obj).flat();}
function freeStarters(obj){const used=new Set(assignedNames(obj));return state.roster.filter(r=>r.role==="starter"&&!used.has(r.name));}
function assignPerson(slot,name){if(!name)return;if(phase==="final")return;const obj=phaseSlots();if(!obj[slot])return;if(!state.roster.some(r=>r.name===name&&r.role==="starter"))return;for(const k of Object.keys(obj))obj[k]=obj[k].filter(n=>n!==name);obj[slot].push(name);mutate();}
function removePerson(slot,name){const obj=phaseSlots();if(obj[slot])obj[slot]=obj[slot].filter(n=>n!==name);mutate();}
function addSpecial(type,name){if(!name)return;if(type==="SUB"){const r=state.roster.find(p=>p.name===name);if(!r||r.role!=="sub")return;for(const k of HOSP)state.subs[k]=state.subs[k].filter(n=>n!==name);state.subs[selectedBuilding].push(name);}
 else{const starters=state.roster.filter(r=>r.role==="starter");if(!starters.some(r=>r.name===name))return;const assignedHospital=HOSP.some(k=>state.phase1[k].includes(name));if(!assignedHospital){notice("La misión especial de Fase 1 debe asignarse a un titular de hospital, no del Science Hub.","error");return;}for(const k of Object.keys(state.missions))state.missions[k]=state.missions[k].filter(n=>n!==name);state.missions[type].push(name);}
 mutate();}
function removeSpecial(type,slot,name){if(type==="SUB")state.subs[slot]=state.subs[slot].filter(n=>n!==name);else state.missions[type]=state.missions[type].filter(n=>n!==name);mutate();}
function listPersons(names,kind="",removable=true){return names.length?names.map(n=>{const r=state.roster.find(x=>x.name===n);return '<div class="person '+esc(kind)+'"><span>'+esc(n)+'</span><span class="power">'+(r?.power==null?"":number(r.power)+"M")+'</span>'+(removable?'<button type="button" data-remove="'+esc(n)+'" aria-label="Quitar '+esc(n)+'">×</button>':"")+'</div>';}).join(""):'<div class="muted">Sin asignar</div>';}
function renderMap(){
 if(!state)return;const boardImage=document.querySelector("#board > img");const mapSrc=mapSource();if(boardImage&&boardImage.getAttribute("src")!==mapSrc)boardImage.src=mapSrc;document.querySelectorAll("[data-phase]").forEach(b=>b.classList.toggle("active",b.dataset.phase===phase));
 $("autoAssign").disabled=phase==="final";$("clearPhase").disabled=phase==="final";$("lastAssault").hidden=phase!=="final";
 $("specialSection").hidden=phase==="final";const shown=phase==="phase1"?[...P1,"INFO","REF1","REF2"]:phase==="phase2"?P2:["SILO","INFO"];
 const obj=phaseSlots(),targets=phaseTargets();$("phaseCount").textContent=phase==="final"?"Orden activada por palabra clave":assignedNames(obj).length+"/20 asignados";
 $("phaseHelp").textContent=phase==="phase1"?"4 titulares por hospital y 4 en Science Hub. Info Center (2) y cada refinería (1) son misiones desde hospitales; nadie abandona Science Hub.":phase==="phase2"?"2 titulares por hospital; 4 en Silo; 2 en Arsenal, Mercenary, Science Hub e Info Center. Apoyo bidireccional Arsenal ↔ Info Center y Mercenary ↔ Science Hub.":"Los jugadores conocen de antemano el protocolo. Solo se activa cuando el responsable escriba la palabra clave al final.";
 if(!shown.includes(selectedBuilding))selectedBuilding=shown[0];
 $("pins").innerHTML=shown.map(k=>{const b=BUILDINGS[k],n=phase==="phase1"?(k==="INFO"||k.startsWith("REF")?state.missions[k].length:obj[k]?.length||0):phase==="phase2"?obj[k]?.length||0:"";return '<button type="button" class="pin '+(selectedBuilding===k?"active":"")+'" data-building="'+k+'" style="left:'+b.x+'%;top:'+b.y+'%">'+b.icon+' '+esc(b.label.replace("Field Hospital ","H").replace("Oil Refinery ","Ref "))+'<small>'+(phase==="final"?"OBJETIVO":n+"/"+(targets[k]|| (k==="INFO"?2:1)))+'</small></button>';}).join("");
 if(phase==="final"){$("buildingList").innerHTML='<div class="building"><h3>☢️ Nuclear Silo</h3><p>Todos los jugadores disponibles se concentran para tomar y mantener el Silo.</p></div><div class="building"><h3>📡 Info Center</h3><p>Tomar y mantener para aumentar los puntos del equipo. Abandonar los hospitales.</p></div>';return;}
 $("buildingList").innerHTML=Object.keys(targets).map(k=>{const b=BUILDINGS[k],names=obj[k]||[],unused=freeStarters(obj);return '<article class="building '+(selectedBuilding===k?"target":"")+' '+(names.length!==targets[k]?"missing":"")+'" id="building-'+k+'" data-slot="'+k+'"><div class="building-head"><h3>'+b.icon+' '+esc(b.label)+'</h3><span class="counter '+(names.length!==targets[k]?"warn":"")+'">'+names.length+'/'+targets[k]+'</span></div><div class="people">'+listPersons(names)+'</div><div class="assign-control"><select class="assign-select" aria-label="Asignar jugador a '+esc(b.label)+'"><option value="">Elegir titular libre</option>'+unused.map(r=>'<option value="'+esc(r.name)+'">'+esc(r.name)+' · '+(r.power==null?"?":number(r.power)+"M")+'</option>').join("")+'</select><button type="button" class="btn small assign-btn">＋</button></div></article>';}).join("");
 if(phase==="phase1")renderSpecials();
 if(phase==="phase2")$("specialList").innerHTML='<div class="building"><h3>↔ Arsenal / Info Center</h3><p>Apoyo mutuo entre ambos edificios cuando sea necesario.</p></div><div class="building"><h3>↔ Mercenary / Science Hub</h3><p>Apoyo mutuo entre ambos edificios cuando sea necesario.</p></div>';
}
function renderSpecials(){
 const groups=[["INFO","Info Center · 2 misiones",2],["REF1","Refinería 1 · 1 misión",1],["REF2","Refinería 2 · 1 misión",1],...HOSP.map(k=>["SUB:"+k,"Suplentes · "+BUILDINGS[k].label,null])];
 const hospitalStarters=state.roster.filter(r=>r.role==="starter"&&HOSP.some(k=>state.phase1[k].includes(r.name)));
 const subs=state.roster.filter(r=>r.role==="sub");
 $("specialList").innerHTML=groups.map(([key,title,count])=>{const sub=key.startsWith("SUB:"),slot=sub?key.slice(4):key,names=sub?state.subs[slot]:state.missions[slot],pool=sub?subs:hospitalStarters,already=new Set(Object.values(sub?state.subs:state.missions).flat());
  return '<article class="building" data-special="'+(sub?"SUB":slot)+'" data-slot="'+slot+'"><div class="building-head"><h3>'+esc(title)+'</h3><span class="counter">'+names.length+(count!=null?"/"+count:"")+'</span></div><div class="people">'+listPersons(names,sub?"sub":"mission")+'</div><div class="assign-control"><select class="assign-select" aria-label="Asignar '+esc(title)+'"><option value="">Elegir '+(sub?"suplente":"titular de hospital")+'</option>'+pool.filter(r=>!already.has(r.name)).map(r=>'<option value="'+esc(r.name)+'">'+esc(r.name)+'</option>').join("")+'</select><button type="button" class="btn small assign-btn">＋</button></div></article>';}).join("");
}
function autoAssign(){
 const starters=state.roster.filter(r=>r.role==="starter");if(starters.length!==20||starters.some(r=>r.power==null)){notice("Necesitas 20 titulares y sus poderes confirmados para equilibrar automáticamente.","error");return;}
 const sorted=[...starters].sort((a,b)=>Number(b.power)-Number(a.power)).map(r=>r.name);
 if(phase==="phase1"){for(const k of P1)state.phase1[k]=[];const waves=[...P1,...[...P1].reverse(),...P1,...[...P1].reverse()];sorted.forEach((n,i)=>state.phase1[waves[i]].push(n));
  state.missions={INFO:[state.phase1.H4[1],state.phase1.H1[1]],REF1:[state.phase1.H1[2]],REF2:[state.phase1.H2[2]]};
  const hospitalByStrength=[...HOSP].sort((a,b)=>state.phase1[b].reduce((sum,n)=>sum+Number(state.roster.find(p=>p.name===n)?.power||0),0)-state.phase1[a].reduce((sum,n)=>sum+Number(state.roster.find(p=>p.name===n)?.power||0),0));
  state.subs={H1:[],H2:[],H3:[],H4:[]};state.roster.filter(r=>r.role==="sub").sort((a,b)=>Number(a.power||0)-Number(b.power||0)).forEach((r,i)=>state.subs[hospitalByStrength[i%4]].push(r.name));
 }else if(phase==="phase2"){
  for(const k of P2)state.phase2[k]=[];
  state.phase2.SILO=sorted.slice(0,4);
  const centers=["ARSENAL","MERC","HUB","INFO"];
  centers.forEach((k,i)=>{state.phase2[k]=[sorted[4+i],sorted[8+i]];});
  HOSP.forEach((k,i)=>{state.phase2[k]=[sorted[12+i],sorted[16+i]];});
 }
 mutate();notice("Propuesta distribuida según el poder. Revísala antes de guardar o publicar.","success");
}
function validate(){
 const errors=[],warnings=[];const countsNow=counts();
 if(countsNow.starter!==20)errors.push("Convocatoria: hay "+countsNow.starter+"/20 titulares.");
 if(countsNow.sub>10)errors.push("Convocatoria: hay más de 10 suplentes.");
 if(new Set(state.roster.map(r=>normal(r.name))).size!==state.roster.length)errors.push("Hay jugadores duplicados en la convocatoria.");
 const overlap=state.roster.filter(r=>rosterOther.has(normal(r.name))).map(r=>r.name);if(overlap.length)errors.push("Inscritos también en el otro equipo: "+overlap.join(", ")+".");
 if(state.roster.some(r=>r.power==null))warnings.push("Hay poderes sin confirmar; revisa el equilibrio manualmente.");
 for(const [phaseKey,targets] of [["phase1",TARGET1],["phase2",TARGET2]]){
  const assigned=assignedNames(state[phaseKey]);
  for(const [slot,n]of Object.entries(targets))if(state[phaseKey][slot].length!==n)errors.push((phaseKey==="phase1"?"Fase 1: ":"Fase 2: ")+BUILDINGS[slot].label+" tiene "+state[phaseKey][slot].length+"/"+n+" titulares.");
  if(new Set(assigned).size!==assigned.length)errors.push("Un jugador figura dos veces en "+phaseKey+".");
  if(assigned.some(n=>!state.roster.some(r=>r.name===n&&r.role==="starter")))errors.push("Una fase contiene alguien que no es titular.");
 }
 for(const [key,n]of [["INFO",2],["REF1",1],["REF2",1]])if(state.missions[key].length!==n)errors.push("Misión "+BUILDINGS[key].label+": "+state.missions[key].length+"/"+n+".");
 const missions=assignedNames(state.missions);if(new Set(missions).size!==missions.length)errors.push("Hay un jugador asignado a dos misiones simultáneas en Fase 1.");
 if(missions.some(n=>!HOSP.some(k=>state.phase1[k].includes(n))))errors.push("Las misiones de Info y refinerías deben salir de los hospitales; nadie abandona Science Hub.");
 const subsAssigned=assignedNames(state.subs),subNames=state.roster.filter(r=>r.role==="sub").map(r=>r.name);
 if(subsAssigned.length!==subNames.length||new Set(subsAssigned).size!==subsAssigned.length||subNames.some(n=>!subsAssigned.includes(n)))errors.push("Todos los suplentes deben tener un único hospital asignado.");
 if(!state.leader||!state.roster.some(r=>r.name===state.leader&&r.role==="starter"))errors.push("Elige un titular como responsable de la palabra clave.");
 if(state.alternate&&(!state.roster.some(r=>r.name===state.alternate&&r.role==="starter")||state.alternate===state.leader))errors.push("El responsable alternativo debe ser otro titular.");
 if(!state.keyword.trim())errors.push("Define la palabra clave del Último Asalto.");
 return {errors,warnings};
}
function renderValidation(){if(!state)return;const {errors,warnings}=validate();$("validation").innerHTML=errors.map(s=>'<div class="review-error">⚠ '+esc(s)+'</div>').join("")+warnings.map(s=>'<div class="review-warn">ℹ '+esc(s)+'</div>').join("")+(!errors.length?'<div class="review-good">✓ Convocatoria y dos fases completas. Lista para publicar.</div>':"");$("publishPlan").disabled=!!errors.length||busy;}
function groupText(phaseKey,lang){
 const obj=state[phaseKey],targets=phaseKey==="phase1"?TARGET1:TARGET2;
 return Object.keys(targets).map(k=>BUILDINGS[k].label+": "+(obj[k].join(", ")||"—")+(HOSP.includes(k)&&state.subs[k]?.length?" ("+state.subs[k].join(", ")+")":"")).join("\n");
}
function buildMail(){if(!state)return "";const en=state.language==="en",t=state.team,head="HOLa · DESERT STORM · TEAM "+t+"\n"+state.templateName+" · "+state.battle_date+" · "+state.serverTime+" SERVER\n";
 if(en)return head+"\nPHASE 1 (00:00–10:00)\n"+groupText("phase1","en")+"\n\nSPECIAL MISSIONS (from hospitals)\nInfo Center: "+state.missions.INFO.join(", ")+"\nOil Refinery 1: "+state.missions.REF1.join(", ")+"\nOil Refinery 2: "+state.missions.REF2.join(", ")+"\nScience Hub players stay at the Hub.\n\nPHASE 2 (AFTER 10:00)\n"+groupText("phase2","en")+"\n\nMUTUAL SUPPORT\nArsenal ↔ Info Center. Mercenary Factory ↔ Science Hub.\n\nSUBSTITUTES\nOnly 20 players can be inside. Starters may enter 5 min before battle; substitutes enter only after battle starts if a slot is free. A player who runs out of troops may leave to free a slot. When entering, each substitute goes DIRECTLY to their assigned hospital, regardless of who left. Never choose a different building.\n\nFINAL ASSAULT (ONLY WHEN ORDERED)\nKeyword: "+state.keyword+" · Caller: "+(state.leader||"TBD")+(state.alternate?" · Backup: "+state.alternate:"")+"\nNear the end, if we are slightly behind and the keyword is posted: abandon hospitals, all available players to Nuclear Silo, take and hold Info Center.\n\nRead the published map on the HOLa Desert Storm page.";
 return head+"\nFASE 1 (00:00–10:00)\n"+groupText("phase1","es")+"\n\nMISIONES ESPECIALES (desde hospitales)\nInfo Center: "+state.missions.INFO.join(", ")+"\nRefinería 1: "+state.missions.REF1.join(", ")+"\nRefinería 2: "+state.missions.REF2.join(", ")+"\nLos jugadores de Science Hub no lo abandonan.\n\nFASE 2 (DESDE EL MINUTO 10)\n"+groupText("phase2","es")+"\n\nAPOYO MUTUO\nArsenal ↔ Info Center. Mercenary Factory ↔ Science Hub.\n\nSUPLENTES\nSolo 20 jugadores pueden estar dentro. Los titulares pueden entrar 5 min antes; los suplentes solo tras el inicio si hay plaza. Un jugador sin tropas puede salir y liberar una plaza. Cada suplente va DIRECTAMENTE al hospital asignado, sin importar quién haya salido.\n\nÚLTIMO ASALTO (SOLO POR ORDEN)\nPalabra clave: "+state.keyword+" · Responsable: "+(state.leader||"Pendiente")+(state.alternate?" · Alternativo: "+state.alternate:"")+"\nAl final, si perdemos por poco y se escribe la clave: abandonar hospitales, concentrarse en Nuclear Silo y tomar Info Center.\n\nConsulta el mapa publicado en la página Desert Storm de HOLa.";
}
function buildAnnouncement(){const en=state.language==="en";if(en)return "HOLa DS TEAM "+state.team+" · "+state.battle_date+" · "+state.serverTime+" server. Starters: be ready 5 min before battle. Substitutes: enter only after start if a slot opens; go directly to your assigned hospital. Follow Phase 1 and Phase 2 in the in-game mail and HOLa DS page. Final assault ONLY on keyword "+state.keyword+" from "+(state.leader||"the team caller")+". Then leave hospitals, push Nuclear Silo and take Info Center.";
 return "HOLa DS TEAM "+state.team+" · "+state.battle_date+" · "+state.serverTime+" servidor. Titulares: preparados 5 min antes. Suplentes: entrad solo después del inicio si hay plaza e id a vuestro hospital asignado. Seguid las fases del correo y la web HOLa. Último asalto SOLO con la clave "+state.keyword+" de "+(state.leader||"el responsable")+". Entonces abandonad hospitales, atacad Silo y tomad Info Center.";
}
function renderOutputs(){if(!state)return;$("mailOutput").value=buildMail();if(document.activeElement!==$("announcement"))$("announcement").value=buildAnnouncement();updateAnnounceCount();}
function updateAnnounceCount(){const len=$("announcement").value.length;$("announceCount").textContent=len+"/500";$("announceCount").classList.toggle("warn",len>500);$("copyAnnouncement").disabled=len>500||!len;}
async function copyText(id){const text=$(id).value;try{await navigator.clipboard.writeText(text);notice("Texto copiado al portapapeles.","success");}catch{$(id).focus();$(id).select();notice("Selecciona y copia el texto manualmente: el navegador bloqueó el portapapeles.","info");}}
async function saveDraft(published=false){
 if(busy)return false;busy=true;for(const b of ["publishPlan","saveDraftTop","saveDraftPlan","saveDraftBottom"])$(b).disabled=true;
 try{await refreshOther();if(published){const {errors}=validate();if(errors.length)throw new Error("Revisa los avisos antes de publicar: "+errors[0]);}
  state.battle_date=$("battleDate").value;state.team=$("team").value;state.serverTime=$("serverTime").value;state.templateName=$("templateName").value.trim()||"Operación Faraón";state.keyword=$("keyword").value.trim();state.leader=$("leader").value;state.alternate=$("alternate").value;state.language=$("language").value;
  const payload={battle_date:state.battle_date,team:state.team,draft:JSON.parse(JSON.stringify(state)),updated_at:new Date().toISOString()};
  if(published){payload.published=JSON.parse(JSON.stringify(state));payload.published_at=new Date().toISOString();}
  const {error}=await sb.from("desert_storm_plans").upsert(payload,{onConflict:"battle_date,team"});if(error)throw error;storeLocal();
  notice(published?"✓ Estrategia publicada para Team "+state.team+". La web DS mostrará esta versión.":"✓ Borrador guardado en Supabase (todavía no publicado).","success");return true;
 }catch(e){notice("No se pudo "+(published?"publicar":"guardar")+": "+e.message,"error");return false;}finally{busy=false;for(const b of ["saveDraftTop","saveDraftPlan","saveDraftBottom"])$(b).disabled=false;renderValidation();}
}
async function copyPrevious(){
 if(!state)return;try{const {data,error}=await sb.from("desert_storm_plans").select("draft,battle_date").eq("team",state.team).lt("battle_date",state.battle_date).order("battle_date",{ascending:false}).limit(1);if(error)throw error;if(!data?.length){notice("No hay una estrategia anterior de este equipo.","info");return;}
  const old=stateReady(data[0].draft);state.templateName=old.templateName;state.keyword=old.keyword;state.language=old.language;
  // Solo copiamos los destinos de participantes que estén en la convocatoria actual.
  const starters=new Set(state.roster.filter(r=>r.role==="starter").map(r=>r.name)),subs=new Set(state.roster.filter(r=>r.role==="sub").map(r=>r.name));
  for(const field of ["phase1","phase2","missions","subs"])for(const k of Object.keys(state[field]))state[field][k]=(old[field][k]||[]).filter(n=>(field==="subs"?subs:starters).has(n));
  if(starters.has(old.leader))state.leader=old.leader;if(starters.has(old.alternate))state.alternate=old.alternate;
  syncSetup();mutate();notice("Plantilla del "+data[0].battle_date+" copiada. Comprueba los puestos vacíos y asigna los nuevos jugadores.","success");
 }catch(e){notice("No se pudo copiar la anterior: "+e.message,"error");}
}
async function loadTemplates(){
 const {data,error}=await sb.from("desert_storm_templates").select("team,template_name,layout").order("team").order("template_name");
 if(error)throw error;storedTemplates=data||[];
 $("storedTemplate").innerHTML='<option value="">Elegir plantilla guardada</option>'+storedTemplates.map((t,i)=>'<option value="'+i+'">TEAM '+esc(t.team)+' · '+esc(t.template_name)+'</option>').join("");
}
async function saveTemplate(){
 if(!state)return;const name=$("templateName").value.trim();
 if(!name){notice("Pon un nombre a la plantilla.","error");return;}
 const errors=validate().errors;if(errors.length){notice("Completa y revisa ambas fases antes de guardar una plantilla. "+errors[0],"error");return;}
 try{const layout={version:1,phase1:state.phase1,phase2:state.phase2,missions:state.missions,subs:state.subs,keyword:state.keyword,leader:state.leader,alternate:state.alternate,serverTime:state.serverTime,language:state.language};
 const {error}=await sb.from("desert_storm_templates").upsert({team:state.team,template_name:name,layout,updated_at:new Date().toISOString()},{onConflict:"team,template_name"});
 if(error)throw error;await loadTemplates();notice("✓ Plantilla «"+name+"» guardada en Supabase. Puedes reutilizarla en futuras jornadas.","success");
 }catch(e){notice("No se pudo guardar la plantilla: "+e.message,"error");}
}
function loadTemplate(){
 const chosen=$("storedTemplate").value,row=chosen===""?null:storedTemplates[Number(chosen)];if(!row){notice("Elige una plantilla guardada.","error");return;}
 const l=row.layout||{},starters=new Set(state.roster.filter(r=>r.role==="starter").map(r=>r.name)),subs=new Set(state.roster.filter(r=>r.role==="sub").map(r=>r.name));
 for(const field of ["phase1","phase2","missions","subs"]){
  if(!l[field])continue;
  for(const k of Object.keys(state[field]))state[field][k]=(Array.isArray(l[field][k])?l[field][k]:[]).filter(n=>(field==="subs"?subs:starters).has(n));
 }
 state.templateName=row.template_name;
 if(typeof l.keyword==="string")state.keyword=l.keyword;
 if(typeof l.language==="string")state.language=l.language;
 if(row.team===state.team&&typeof l.serverTime==="string")state.serverTime=l.serverTime;
 if(starters.has(l.leader))state.leader=l.leader;
 if(starters.has(l.alternate))state.alternate=l.alternate;
 syncSetup();mutate();
 notice("Plantilla «"+row.template_name+"» aplicada. Las asignaciones de jugadores que no están en la convocatoria actual han quedado vacías. Revísalas antes de publicar.","success");
}
function drawText(ctx,text,x,y,maxWidth,font,color){ctx.font=font;ctx.fillStyle=color;ctx.fillText(String(text),x,y,maxWidth);}
async function createPoster(what="phase1"){
 const isCombined=what==="combined";const width=1080,unitHeight=1740,height=isCombined?unitHeight*2:unitHeight;
 const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const ctx=canvas.getContext("2d");
 const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("No se pudo cargar el mapa de edificios."));i.src=mapSource();});
 function drawPhase(which,offset){
  ctx.fillStyle="#081d32";ctx.fillRect(0,offset,width,unitHeight);
  let grad=ctx.createLinearGradient(0,offset,0,offset+230);grad.addColorStop(0,"#073454");grad.addColorStop(1,"#081c31");ctx.fillStyle=grad;ctx.fillRect(0,offset,width,220);
  drawText(ctx,state.templateName.toUpperCase()+" · TEAM "+state.team,45,offset+54,970,"900 32px Georgia","#eac55b");
  drawText(ctx,which==="phase1"?"PHASE 1 · 00:00–10:00":"PHASE 2 · AFTER 10:00",45,offset+135,980,"900 62px system-ui","#fff8e9");
  drawText(ctx,state.battle_date+" · "+state.serverTime+" SERVER",47,offset+186,900,"700 24px system-ui","#8adeeb");
  ctx.drawImage(img,0,offset+218,width,765);
  // Cada cartel conserva el mapa y coloca las asignaciones en tarjetas legibles debajo.
  const keys=which==="phase1"?P1:P2,columns=2,cardW=488,rowH=which==="phase1"?112:93,y0=offset+1000;
  keys.forEach((k,index)=>{
   const x=42+(index%columns)*510,y=y0+Math.floor(index/columns)*rowH,w=cardW,h=rowH-7;
   ctx.fillStyle="rgba(11,40,62,.95)";ctx.beginPath();ctx.roundRect(x,y,w,h,12);ctx.fill();
   ctx.strokeStyle="#d6aa4f";ctx.lineWidth=2;ctx.stroke();
   drawText(ctx,BUILDINGS[k].icon+" "+BUILDINGS[k].label,x+12,y+25,w-25,"bold 19px system-ui","#f0c75a");
   const names=state[which][k]||[];
   const half=names.length>2?Math.ceil(names.length/2):names.length;
   drawText(ctx,names.slice(0,half).join(", "),x+12,y+54,w-25,"bold 17px system-ui","#fff");
   if(names.length>half)drawText(ctx,names.slice(half).join(", "),x+12,y+80,w-25,"bold 17px system-ui","#fff");
   if(which==="phase1"&&HOSP.includes(k)&&state.subs[k]?.length)drawText(ctx,"("+state.subs[k].join(", ")+")",x+12,y+h-10,w-25,"bold 15px system-ui","#69caff");
  });
  let footer=which==="phase1"?"INFO: "+state.missions.INFO.join(", ")+"  ·  REF1: "+state.missions.REF1.join(", ")+"  ·  REF2: "+state.missions.REF2.join(", "):"ARSENAL ↔ INFO CENTER   •   MERCENARY ↔ SCIENCE HUB";
  ctx.fillStyle="#09243e";ctx.fillRect(0,offset+unitHeight-132,width,132);
  drawText(ctx,footer,40,offset+unitHeight-90,1000,"bold 19px system-ui","#7de6b0");
  drawText(ctx,"FINAL: "+state.keyword+" · "+(state.leader||"Caller TBD")+" · HOLa · Heroes of Last Area",40,offset+unitHeight-37,1000,"bold 23px system-ui","#e9cb72");
 }
 if(isCombined){drawPhase("phase1",0);drawPhase("phase2",unitHeight);}else drawPhase(what,0);
 const blob=await new Promise(res=>canvas.toBlob(res,"image/png"));if(!blob)throw new Error("No se pudo generar el PNG.");const url=URL.createObjectURL(blob);
 $("posterPreview").src=url;$("posterPreview").hidden=false;
 const a=document.createElement("a");a.href=url;a.download="HOLa-DS-"+state.team+"-"+state.battle_date+"-"+(isCombined?"Fases-1-2":what)+".png";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function renderMain(){renderRoster();mutate();syncSetup();}
function events(){
 document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
 $("battleDate").addEventListener("change",()=>loadDraft());$("team").addEventListener("change",()=>loadDraft());$("customMap").addEventListener("change",e=>useOriginalMap(e.target.files?.[0]));
 for(const key of ["serverTime","templateName","keyword","leader","alternate","language"])$(key).addEventListener("change",()=>{if(!state)return;state[key]=$(key).value;mutate();});
 $("loadDraft").onclick=()=>loadDraft();$("saveTemplate").onclick=saveTemplate;$("loadTemplate").onclick=loadTemplate;$("saveDraftTop").onclick=()=>saveDraft();$("saveDraftPlan").onclick=()=>saveDraft();$("saveDraftBottom").onclick=()=>saveDraft();$("publishPlan").onclick=()=>saveDraft(true);$("copyPrevious").onclick=copyPrevious;
 $("participantShots").onchange=()=>{$("filesInfo").textContent=$("participantShots").files.length+" capturas seleccionadas.";};$("readShots").onclick=readShots;$("importLegacy").onclick=importLegacy;
 $("ocrProposals").addEventListener("change",proposalChange);$("ocrProposals").addEventListener("input",proposalChange);$("acceptVerified").onclick=acceptProposals;$("closeReview").onclick=()=>{$("ocrReview").hidden=true;};
 $("manualPlayer").innerHTML=playerOption("","Elegir miembro de HOLa");$("addPlayer").onclick=()=>{try{if(addRoster($("manualPlayer").value,"starter",null)){renderRoster();mutate();notice("Participante añadido. Revisa su poder y si es titular o suplente.","success");$("manualPlayer").value="";}}catch(e){notice(e.message,"error");}};
 $("rosterList").addEventListener("change",rosterChange);$("rosterList").addEventListener("click",rosterChange);
 $("toPlan").onclick=()=>switchTab("plan");$("toPublish").onclick=()=>switchTab("publish");
 document.querySelectorAll("[data-phase]").forEach(b=>b.addEventListener("click",()=>{phase=b.dataset.phase;renderMap();}));
 $("autoAssign").onclick=autoAssign;$("clearPhase").onclick=()=>{if(phase==="final")return;for(const k of Object.keys(phaseSlots()))phaseSlots()[k]=[];mutate();};
 $("pins").addEventListener("click",e=>{const k=e.target.closest("[data-building]")?.dataset.building;if(!k)return;selectedBuilding=k;renderMap();$("building-"+k)?.scrollIntoView({behavior:"smooth",block:"center"});});
 $("buildingList").addEventListener("click",e=>{const card=e.target.closest("[data-slot]");if(!card)return;const k=card.dataset.slot;if(e.target.matches("[data-remove]")){removePerson(k,e.target.dataset.remove);return;}if(e.target.closest(".assign-btn")){const select=card.querySelector(".assign-select");assignPerson(k,select?.value);}});
 $("specialList").addEventListener("click",e=>{const card=e.target.closest("[data-special]");if(!card)return;const type=card.dataset.special,slot=card.dataset.slot;if(e.target.matches("[data-remove]"))removeSpecial(type,slot,e.target.dataset.remove);else if(e.target.closest(".assign-btn")){selectedBuilding=slot;addSpecial(type,card.querySelector(".assign-select")?.value);}});
 $("copyMail").onclick=()=>copyText("mailOutput");$("copyAnnouncement").onclick=()=>copyText("announcement");
 $("announcement").addEventListener("input",updateAnnounceCount);$("refreshAnnouncement").onclick=()=>{$("announcement").value=buildAnnouncement();updateAnnounceCount();};$("refreshMail").onclick=()=>{$("mailOutput").value=buildMail();};
 for(const [id,kind] of [["poster1","phase1"],["poster2","phase2"],["posterCombined","combined"]])$(id).onclick=()=>createPoster(kind).catch(e=>notice(e.message,"error"));
}
(async()=>{try{const today=new Date();const yyyy=today.getFullYear(),mm=String(today.getMonth()+1).padStart(2,"0"),dd=String(today.getDate()).padStart(2,"0");$("battleDate").value=yyyy+"-"+mm+"-"+dd;$("team").value="A";if(!await verifyAccess())return;events();await loadDraft(false);notice("DS Builder preparado. Importa la convocatoria de Team A o Team B y guarda tu borrador.","success");}catch(e){$("gate").textContent="No se pudo iniciar el DS Builder: "+e.message;$("gate").className="notice error";$("app").hidden=true;console.error(e);}})();