import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const sb=createClient("https://ovybstpiomphrouvqxmf.supabase.co","sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV",{auth:{persistSession:true,autoRefreshToken:true}});
const AZURE="https://ovybstpiomphrouvqxmf.supabase.co/functions/v1/vs-azure-ocr";
const KEY="sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV";
const $=id=>document.getElementById(id);
const normal=value=>String(value||"").normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f\u0640]/g,"").replace(/[ᓚᘏᗢ]/g,"").replace(/[^\p{L}\p{N}]+/gu,"");
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const format=value=>Number(value||0).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})+"M";
const aliases={"jebraw":"JEBRAWW","jebrawuu":"JEBRAWW","lazziyaa":"Laz Ziyaaa ᓚᘏᗢ","lazziyaaa":"Laz Ziyaaa ᓚᘏᗢ","sinsiflex":"sinsifeX ᓚᘏᗢ","sinsifex":"sinsifeX ᓚᘏᗢ","siniflex":"sinsifeX ᓚᘏᗢ","sinifex":"sinsifeX ᓚᘏᗢ"};
let profiles=[],byName=new Map(),results=[],worker=null,busy=false,scanned=false,session=null,report=null;
function message(value,kind="info",id="scanStatus"){const el=$(id);el.textContent=value;el.className="notice "+(kind==="info"?"":kind);}
function parseTHP(value){
 const text=String(value??"").trim().replace(/\s/g,"").replace(/[Мᴍｍ]/g,"M");
 if(!text)return null;
 const short=text.match(/^(\d{1,4}(?:[.,]\d{1,3})?)M$/i);
 if(short){const n=Number(short[1].replace(",","."));return n>0&&n<=9999?Math.round(n*1000)/1000:null;}
 // Raw full hero-power numbers (not percentages, HQ levels or squad strength).
 if(/^\d{1,3}(?:[.,]\d{3}){2,3}$/.test(text)||/^\d{7,9}$/.test(text)){
  const n=Number(text.replace(/[.,]/g,""))/1000000;
  return n>0&&n<=9999?Math.round(n*1000)/1000:null;
 }
 return null;
}
function savedTHP(value){
 const text=String(value??"").trim().replace(/\s+/g,"").replace(/m$/i,"");
 if(!/^\d{1,4}(?:[.,]\d{1,3})?$/.test(text))return null;
 const number=Number(text.replace(",","."));
 return Number.isFinite(number)&&number>0&&number<=9999?number:null;
}
function official(raw){
 const key=normal(raw);
 const alias=aliases[key]||"";
 return byName.get(key)||byName.get(normal(alias))||null;
}
function distance(a,b){
 let previous=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=0;i<a.length;i++){const next=[i+1];for(let j=0;j<b.length;j++)next.push(Math.min(next[j]+1,previous[j+1]+1,previous[j]+(a[i]===b[j]?0:1)));previous=next;}
 return previous[b.length];
}
function matchName(raw){
 const cleaned=String(raw||"").replace(/^\s*\d{1,3}\s*[.)-]\s*/,"").replace(/(?:\[\s*)?HOLa(?:\s*\])?/gi,"").replace(/\s+\d{1,4}(?:[.,]\d{1,3})?\s*[mМᴍ]\b.*$/i,"").trim();
 const found=official(cleaned);
 if(found)return {name:found.name,exact:true};
 const input=normal(cleaned);if(input.length<4)return {name:"",exact:false};
 let best=null,lowest=99,runner=99;
 for(const player of profiles){const d=distance(normal(player.name),input);if(d<lowest){runner=lowest;lowest=d;best=player;}else if(d<runner)runner=d;}
 return lowest<=2&&lowest<runner&&lowest/Math.max(5,input.length)<.24?{name:best.name,exact:false}:{name:"",exact:false};
}
function tokens(text){
 const raw=String(text||"").replace(/(?<=\d)[Oo](?=\d)/g,"0").replace(/[Мᴍｍ]/g,"M");
 const pattern=/(?:\d{1,3}(?:[.,]\d{3}){2,3}|\d{7,9}|\d{1,4}(?:[.,]\d{1,3})?\s*M)(?![\p{L}\p{N}])/giu;
 return [...raw.matchAll(pattern)].map(match=>parseTHP(match[0])).filter(n=>n!=null);
}
function normalizeLines(data,ox,oy,scale){
 const out=[];
 for(const block of data?.blocks||[])for(const para of block?.paragraphs||[])for(const line of para?.lines||[]){
  const words=line.words||[],box=line.bbox||words[0]?.bbox||{};
  out.push({text:String(line.text||words.map(w=>w.text).join(" ")).trim(),x:ox+Number(box.x0||0)/scale,y:oy+Number(box.y0||0)/scale});
 }
 if(!out.length)for(const line of data?.lines||[]){const box=line.bbox||{};out.push({text:String(line.text||"").trim(),x:ox+Number(box.x0||0)/scale,y:oy+Number(box.y0||0)/scale});}
 return out.filter(line=>line.text).sort((a,b)=>a.y-b.y||a.x-b.x);
}
function azureLines(data,ox,oy,scale){
 const lines=[];for(const part of data?.ParsedResults||[])for(const line of part.TextOverlay?.Lines||[])
  lines.push({text:String(line.LineText||"").trim(),x:ox+Number(line.Words?.[0]?.Left||0)/scale,y:oy+Number(line.MinTop||0)/scale});
 return lines.filter(line=>line.text).sort((a,b)=>a.y-b.y||a.x-b.x);
}
async function prepare(file){
 if(!/^image\/(?:png|jpeg|webp)$/i.test(file.type||"")&&!/\.(?:png|jpe?g|webp)$/i.test(file.name||""))throw new Error("Usa capturas JPG, PNG o WebP.");
 if(file.size>12000000)throw new Error("Imagen de más de 12 MB: "+file.name);
 const image=await new Promise((resolve,reject)=>{const im=new Image(),url=URL.createObjectURL(file);im.onload=()=>{URL.revokeObjectURL(url);resolve(im);};im.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("No se pudo abrir "+file.name));};im.src=url;});
 const w=image.naturalWidth,h=image.naturalHeight,x=Math.round(w*.19),y=Math.round(h*.33),cw=Math.round(w*.65),ch=Math.round(h*.52),scale=2.0;
 const canvas=document.createElement("canvas");canvas.width=Math.round(cw*scale);canvas.height=Math.round(ch*scale);
 canvas.getContext("2d").drawImage(image,x,y,cw,ch,0,0,canvas.width,canvas.height);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.92));
 if(!blob)throw new Error("No se pudo procesar "+file.name);
 return {blob,ox:x,oy:y,scale,w,h,name:file.name};
}
async function ocrWorker(){
 if(worker)return worker;
 if(!window.Tesseract?.createWorker)await new Promise((resolve,reject)=>{const script=document.createElement("script");script.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";script.onload=resolve;script.onerror=()=>reject(new Error("No se pudo descargar Tesseract."));document.head.append(script);});
 worker=await window.Tesseract.createWorker("eng",1,{logger:event=>{if(event.status==="recognizing text")message("Tesseract · "+Math.round((event.progress||0)*100)+"%");}});
 return worker;
}
async function readAzure(prep){
 const response=await fetch(AZURE,{method:"POST",headers:{"apikey":KEY,"Authorization":"Bearer "+session.access_token,"Content-Type":"image/jpeg"},body:prep.blob});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data?.error||"Azure HTTP "+response.status);
 return azureLines(data,prep.ox,prep.oy,prep.scale);
}
function parseCandidates(lines,prep,engine){
 const generic=/\b(?:poder|power|estrateg|seleccion|fuerza especial|batalla|hero|participantes|suplentes|titulares|total|reservas|buscar|battle|squad|alliance|refiner|hospital|info center|cargar)\b/i;
 const items=[],minY=prep.h*.34,maxY=prep.h*.84;
 for(let i=0;i<lines.length;i++){
  const line=lines[i];if(line.y<minY||line.y>maxY||line.x<prep.w*.17||line.x>prep.w*.66)continue;
  const raw=line.text.replace(/(?:\[\s*)?HOLa(?:\s*\])?/gi,"").trim();
  if(raw.length<3||raw.length>74||generic.test(raw))continue;
  const found=matchName(raw);
  const inline=tokens(raw);
  let candidate=inline.length===1?inline[0]:null,conflict=inline.length>1;
  if(candidate==null&&!conflict){
   const nearby=lines.filter(other=>other!==line&&Math.abs(other.y-line.y)<prep.h*.026&&other.x>line.x+prep.w*.10&&other.x<prep.w*.86&&!matchName(other.text).name);
   const powers=nearby.flatMap(other=>tokens(other.text));
   if(new Set(powers.map(x=>x.toFixed(3))).size===1&&powers.length)candidate=powers[0];
   else if(powers.length>1)conflict=true;
  }
  if(!found.name&&!candidate)continue; // ignore ordinary UI labels without a visible THP
  if(!found.name&&!/[\p{L}]{3}/u.test(raw))continue;
  const name=found.name||"",key=name?"player:"+normal(name):"raw:"+normal(raw);
  items.push({key,name,raw,power:candidate,conflict,exact:found.exact,engine,file:prep.name});
 }
 return items;
}
function mergeCandidates(found){
 for(const item of found){
  let row=results.find(r=>r.key===item.key);
  if(!row){row={...item,id:results.length,readings:[],files:new Set(),selected:false,approved:false,edited:false,saved:false};results.push(row);}
  row.files.add(item.file);row.exact=row.exact||item.exact;
  if(!row.name&&item.name)row.name=item.name;
  if(item.conflict)row.conflict=true;
  if(item.power!=null&&!row.readings.some(v=>Math.abs(v-item.power)<.001))row.readings.push(item.power);
  if(row.readings.length>1&&Math.max(...row.readings)-Math.min(...row.readings)>.001)row.conflict=true;
  if(row.readings.length===1&&!row.conflict&&!row.edited)row.power=row.readings[0];
  if(row.conflict&&!row.edited)row.power=null;
 }
}
async function loadProfiles(){
 const {data,error}=await sb.from("players").select("name,rank,thp").order("name");
 if(error)throw new Error("No se pudo leer los miembros: "+error.message);
 profiles=data||[];byName=new Map(profiles.map(row=>[normal(row.name),row]));
 results.forEach(row=>{if(row.name){const match=official(row.name);if(match)row.name=match.name;}});
}
async function verify(){
 const auth=await sb.auth.getSession(),record=auth.data?.session;
 if(auth.error||!record){location.replace("admin-login.html");return false;}
 const {data:admin,error}=await sb.from("admin_users").select("display_name").eq("user_id",record.user.id).maybeSingle();
 if(error||!admin){location.replace("admin-login.html");return false;}
 session=record;await loadProfiles();
 const officer=profiles.find(p=>normal(p.name)===normal(admin.display_name)&&["R4","R5"].includes(String(p.rank||"").toUpperCase()));
 if(!officer){location.replace("admin-login.html");return false;}
 $("officer").textContent="SESIÓN AUTORIZADA · "+officer.name+" · "+officer.rank;
 $("gate").hidden=true;$("app").hidden=false;return true;
}
function currentTHP(row){const p=official(row.name);return p?savedTHP(p.thp):null;}
function jump(row){const current=currentTHP(row);return row.power!=null&&(current==null?row.power>300:row.power>current*1.5);}
function statusOf(row){
 if(!row.name||!official(row.name))return {text:"Nombre sin identificar",kind:"warn"};
 if(!row.exact)return {text:"Confirmar miembro",kind:"warn"};
 if(row.conflict)return {text:"THP contradictorio",kind:"warn"};
 if(row.power==null)return {text:"Sin THP leído",kind:"muted"};
 const current=currentTHP(row);
 if(current!=null&&row.power<=current+.00001)return {text:"Conservar Supabase",kind:"muted"};
 if(jump(row)&&!row.approved)return {text:"Revisar aumento",kind:"warn"};
 return {text:"Puede actualizar",kind:"good"};
}
function eligible(row){return !!(row.name&&official(row.name)&&row.exact&&!row.conflict&&row.power!=null&&row.power>0&&!row.saved&&(!jump(row)||row.approved)&&(!row.readings.length||row.readings.length===1||row.edited));}
function proposed(row){const db=currentTHP(row);return eligible(row)&&(db==null||row.power>db+.00001);}
function memberOptions(selected){
 return '<option value="">Seleccionar miembro HOLa</option>'+profiles.map(p=>'<option value="'+esc(p.name)+'"'+(p.name===selected?' selected':'')+'>'+esc(p.name)+'</option>').join("");
}
function render(){
 $("review").hidden=!scanned;
 if(!scanned)return;
 const matched=results.filter(r=>r.name&&official(r.name)&&r.exact).length;
 const next=results.filter(proposed).length,uncertain=results.filter(r=>statusOf(r).kind==="warn").length;
 $("detected").textContent=results.length;$("matched").textContent=matched;$("updates").textContent=next;$("needsReview").textContent=uncertain;
 $("results").innerHTML=results.length?results.map(row=>{
  const state=statusOf(row),db=currentTHP(row),disabled=row.saved?' disabled':"",suggested=row.readings.length?row.readings.map(format).join(" / "):"no leído";
  return '<article class="person '+(state.kind==="warn"?"is-review":state.kind==="good"?"is-ready":"is-skip")+'" data-index="'+row.id+'">'+
   '<div class="head"><span class="name">'+esc(row.name||row.raw)+'</span><span class="pill '+state.kind+'">'+esc(state.text)+'</span></div>'+
   '<div class="from">'+esc([...row.files].join(" · "))+' · OCR: '+esc(suggested)+'</div>'+
   '<div class="fields"><div class="member-field"><label>Miembro oficial de HOLa</label><select data-field="name"'+disabled+'>'+memberOptions(row.name)+'</select></div>'+
   '<div><label>Supabase</label><div class="current">'+(db==null?"—":format(db))+'</div></div>'+
   '<div><label>THP leído (M)</label><input type="number" data-field="power" inputmode="decimal" step="0.01" min="0.01" max="9999" value="'+(row.power??"")+'"'+disabled+'></div></div>'+
   ((row.conflict||jump(row)||!row.exact)?'<label class="confirm"><input type="checkbox" data-field="approve" '+(row.approved?'checked ':'')+disabled+'><span>He revisado esta lectura y confirmo el nombre y THP.</span></label>':'')+
   '<label class="confirm"><input type="checkbox" data-field="selected" '+(row.selected?'checked ':'')+(proposed(row)?disabled:' disabled')+'><span>Incluir este aumento al guardar'+(row.saved?" · guardado":"")+'</span></label>'+
   '</article>';
 }).join(""):'<div class="results-empty">No se reconocieron nombres con THP. Comprueba las capturas o usa otras más nítidas.</div>';
 const found=new Set(results.filter(r=>r.name&&official(r.name)).map(r=>normal(r.name)));
 const missing=profiles.filter(p=>!found.has(normal(p.name))).map(p=>p.name);
 $("missingSummary").textContent="Miembros no reconocidos en estas capturas: "+missing.length+"/"+profiles.length;
 $("missingList").textContent=missing.join(" · ")||"Todos los miembros de Supabase aparecen en estas capturas.";
 const selected=results.filter(r=>r.selected&&proposed(r)).length;
 $("saveCount").textContent=selected+" aumento"+(selected===1?"":"s")+" seleccionado"+(selected===1?"":"s");
 $("save").disabled=busy||selected===0||!$("confirmChanges").checked;
}
async function scan(){
 if(busy)return;
 const files=[...$("screenshots").files];
 if(!files.length){message("Selecciona las capturas del listado de miembros.","error");return;}
 if(files.length>20){message("Máximo 20 capturas por lectura. Divide el listado en dos tandas.","error");return;}
 if(scanned&&results.some(r=>r.selected)&&!window.confirm("Hay cambios seleccionados sin guardar. ¿Leer otras capturas y reemplazar la revisión?"))return;
 busy=true;scanned=false;results=[];report=null;$("scan").disabled=true;$("reload").disabled=true;$("confirmChanges").checked=false;render();
 const warnings=[];let azureOK=0,tesseractOK=0;
 try{
  await loadProfiles();
  let engine=null;
  try{engine=await ocrWorker();}catch(e){warnings.push("Tesseract: "+String(e?.message||e));}
  for(let i=0;i<files.length;i++){
   message("Leyendo captura "+(i+1)+"/"+files.length+" · "+files[i].name);
   try{
    const prep=await prepare(files[i]);
    if(engine){try{const {data}=await engine.recognize(prep.blob,{}, {text:true,blocks:true});mergeCandidates(parseCandidates(normalizeLines(data,prep.ox,prep.oy,prep.scale),prep,"Tesseract"));tesseractOK++;}
     catch(e){warnings.push("Tesseract "+files[i].name+": "+String(e?.message||e));}}
    try{message("Cotejando "+files[i].name+" con Azure…");mergeCandidates(parseCandidates(await readAzure(prep),prep,"Azure"));azureOK++;}
    catch(e){warnings.push("Azure "+files[i].name+": "+String(e?.message||e));}
   }catch(e){warnings.push(files[i].name+": "+String(e?.message||e));}
  }
  results.sort((a,b)=>{const va=a.power??-1,vb=b.power??-1;return vb-va||String(a.name||a.raw).localeCompare(String(b.name||b.raw));});
  results.forEach((row,i)=>row.id=i);
  scanned=true;message("Lectura terminada: "+results.length+" entradas · Azure "+azureOK+"/"+files.length+" · Tesseract "+tesseractOK+"/"+files.length+". No se ha modificado Supabase."+(warnings.length?" Avisos: "+warnings.join(" · "):""),warnings.length?"warn":"success");
 }catch(e){message("No se pudo leer el listado: "+String(e?.message||e),"error");}
 finally{if(worker){try{await worker.terminate();}catch{}worker=null;}busy=false;$("scan").disabled=false;$("reload").disabled=false;render();}
}
function editRow(event){
 const card=event.target.closest("[data-index]");if(!card)return;
 const row=results.find(r=>r.id===Number(card.dataset.index));if(!row||row.saved)return;
 const field=event.target.dataset.field;
 if(field==="name"){
  row.name=event.target.value;row.exact=!!official(row.name);row.approved=false;row.selected=false;
 }else if(field==="power"){
  const value=String(event.target.value||"").trim().replace(",",".");
  row.power=value?Number(value):null;
  if(row.power!=null&&(!Number.isFinite(row.power)||row.power<=0||row.power>9999))row.power=null;
  row.edited=true;row.conflict=false;row.approved=false;row.selected=false;
 }else if(field==="approve"){row.approved=event.target.checked;if(!row.approved)row.selected=false;}
 else if(field==="selected"){row.selected=event.target.checked;}
 else return;
 $("confirmChanges").checked=false;render();
}
function selectSafe(){results.forEach(r=>{r.selected=proposed(r)&&!jump(r)&&!r.conflict;});$("confirmChanges").checked=false;render();}
async function updateOne(row){
 const officialName=official(row.name)?.name;if(!officialName||!eligible(row))return "omitido";
 for(let attempt=0;attempt<3;attempt++){
  const {data:latest,error:readError}=await sb.from("players").select("name,thp").eq("name",officialName).maybeSingle();
  if(readError||!latest)throw new Error("No se pudo leer la ficha actual.");
  const old=savedTHP(latest.thp),value=row.power;
  if(old!=null&&value<=old+.00001){const local=official(officialName);if(local)local.thp=latest.thp;return "conservado";}
  if(old==null&&latest.thp!=null&&String(latest.thp).trim())throw new Error("THP de Supabase con formato desconocido. Revisa la ficha.");
  let query=sb.from("players").update({thp:Number(value).toFixed(2)+"M",updated_at:new Date().toISOString()}).eq("name",officialName);
  query=latest.thp==null?query.is("thp",null):query.eq("thp",latest.thp);
  const {data:updated,error:writeError}=await query.select("name,thp").maybeSingle();
  if(writeError)throw new Error("Supabase: "+writeError.message);
  if(updated){const member=official(officialName);if(member)member.thp=updated.thp;return "actualizado";}
 }
 throw new Error("Esta ficha ha cambiado durante el guardado. Pulsa Recargar fichas y revísala.");
}
async function save(){
 if(busy||!scanned||!$("confirmChanges").checked)return;
 const chosen=results.filter(r=>r.selected&&proposed(r));
 if(!chosen.length){message("No hay aumentos confirmados.","warn","saveStatus");return;}
 if(new Set(chosen.map(r=>normal(r.name))).size!==chosen.length){message("Un mismo jugador aparece dos veces entre los seleccionados. Deja una sola lectura antes de guardar.","error","saveStatus");return;}
 busy=true;$("save").disabled=true;$("scan").disabled=true;$("reload").disabled=true;
 let updated=0,preserved=0;const errors=[];
 try{
  for(let i=0;i<chosen.length;i++){
   const row=chosen[i];message("Guardando "+(i+1)+"/"+chosen.length+" · "+row.name+"…","info","saveStatus");
   try{const result=await updateOne(row);if(result==="actualizado")updated++;else preserved++;row.saved=true;row.selected=false;}
   catch(e){errors.push(row.name+": "+String(e?.message||e));row.selected=false;}
  }
  message("Actualización finalizada: "+updated+" THP aumentado"+(updated===1?"":"s")+" · "+preserved+" conservado"+(preserved===1?"":"s")+(errors.length?" · "+errors.length+" sin guardar. Revisa: "+errors.join(" · "):""),errors.length?"warn":"success","saveStatus");
  try{await loadProfiles();}catch(e){message("Se guardaron cambios, pero no se pudo recargar la lista: "+String(e?.message||e),"warn","saveStatus");}
  $("confirmChanges").checked=false;
 }finally{busy=false;$("scan").disabled=false;$("reload").disabled=false;render();}
}
async function refresh(){
 if(busy)return;busy=true;$("reload").disabled=true;try{await loadProfiles();render();message("✓ Fichas oficiales recuperadas de Supabase.","success");}catch(e){message(String(e?.message||e),"error");}finally{busy=false;$("reload").disabled=false;render();}
}
function bind(){
 $("screenshots").addEventListener("change",()=>{$("selected").textContent=$("screenshots").files.length+" capturas seleccionadas.";});
 $("scan").addEventListener("click",scan);$("reload").addEventListener("click",refresh);
 $("results").addEventListener("change",editRow);
 $("selectSafe").addEventListener("click",selectSafe);$("unselectAll").addEventListener("click",()=>{results.forEach(r=>r.selected=false);$("confirmChanges").checked=false;render();});
 $("confirmChanges").addEventListener("change",render);
 $("save").addEventListener("click",save);
}
(async()=>{try{if(!await verify())return;bind();}catch(e){$("gate").textContent="No se pudo abrir el actualizador THP: "+String(e?.message||e);$("gate").className="panel gate notice error";console.error(e);}})();
