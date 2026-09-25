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
 const cleaned=String(raw||"").replace(/(?:\[\s*)?HOLa(?:\s*\])?/gi,"")
  .replace(/^\s*\d{1,3}(?:\s*[.)#:-]\s*|\s+(?=[\p{L}]))/u,"")
  .replace(/\s+(?:\d{1,3}(?:[.,]\d{3}){2,3}|\d{7,9}|\d{1,4}(?:[.,]\d{1,3})?\s*[mМᴍ])(?:\s|$).*$/iu,"")
  .replace(/\s{2,}/g," ").trim();
 const found=official(cleaned);if(found)return {name:found.name,exact:true};
 const input=normal(cleaned);if(input.length<4)return {name:"",exact:false};
 let best=null,lowest=99,runner=99;
 for(const player of profiles){const d=distance(normal(player.name),input);
  if(d<lowest){runner=lowest;lowest=d;best=player;}else if(d<runner)runner=d;}
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
 if(!/^image\/(?:png|jpeg|webp)$/i.test(file.type||"")&&!/\.(?:png|jpe?g|webp)$/i.test(file.name||""))
  throw new Error("Usa capturas JPG, PNG o WebP.");
 if(file.size>12000000)throw new Error("Imagen de más de 12 MB: "+file.name);
 const image=await new Promise((resolve,reject)=>{
  const im=new Image(),url=URL.createObjectURL(file);
  im.onload=()=>{URL.revokeObjectURL(url);resolve(im);};
  im.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("No se pudo abrir "+file.name));};im.src=url;
 });
 const w=image.naturalWidth,h=image.naturalHeight;
 // Names and powers move with screen size and the list's scroll position.
 // The old fixed crop discarded rows on many Android screenshots.
 const scale=Math.min(2,2800/Math.max(w,h));
 const canvas=document.createElement("canvas");
 canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
 const context=canvas.getContext("2d");if(!context)throw new Error("No se pudo preparar la captura.");
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";
 context.drawImage(image,0,0,canvas.width,canvas.height);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.94));
 if(!blob)throw new Error("No se pudo procesar "+file.name);
 return {blob,ox:0,oy:0,scale,w,h,name:file.name};
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
// In DS "Seleccionar participantes", each name is directly ABOVE
// "Poder Total del Héroe: 105.8M" inside the SAME white player card.
function heroPowerLabel(text){
 const norm=String(text||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
  .replace(/0/g,"o").replace(/3/g,"e");
 return /poder\s*total\s*(?:d[e]l?\s*)?heroe/.test(norm)
  || /total\s*hero\s*power/.test(norm);
}
function possiblePlayerLine(text){
 const raw=String(text||"").trim();
 if(raw.length<3||raw.length>75||heroPowerLabel(raw))return false;
 if((raw.match(/\p{L}/gu)||[]).length<2)return false; // Names such as N3v3r89 and N6C6R6
 if(/^(?:r[1-5]\s*[\d/]|[\d/]+$)/i.test(raw))return false;
 if(/\b(?:estratega|strategy|campo|seleccionar|participantes|fuerza\s*especial|b[uú]squeda|poder\s*total|power|squad|miembros|batalla|hospital|ranking|alliance|total|rally)\b/i.test(raw))return false;
 return true;
}
function parseCandidates(lines,prep,engine){
 const all=(lines||[]).map(line=>({
  text:String(line.text||"").trim(),x:Number(line.x||0),y:Number(line.y||0)
 })).filter(line=>line.text&&line.y>=prep.h*.09&&line.y<=prep.h*.965
  &&line.x>=0&&line.x<=prep.w*.99).sort((a,b)=>a.y-b.y||a.x-b.x);
 const labelRows=all.filter(line=>heroPowerLabel(line.text));
 const rowGap=Math.max(34,prep.h*.073),valueGap=Math.max(18,prep.h*.020);
 const found=[];
 for(const label of labelRows){
  // OCR sometimes merges a name and the following "Poder Total..." into one line.
  const matchLabel=String(label.text).normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
   .match(/p[o0]d[e3]r\s*t[o0]tal(?:\s*d[e3]l?)?\s*h[eé3]r[o0]e|total\s*hero\s*power/i);
  const prefix=matchLabel?label.text.slice(0,matchLabel.index).trim():"";
  let rawName="",person=null;
  if(possiblePlayerLine(prefix)){
   const match=matchName(prefix);rawName=prefix;person=match;
  }else{
   // Locate the name immediately ABOVE the power label, not to its right.
   // The next player's name is always in the next white card further down.
   const previous=all.filter(line=>line!==label&&line.y<=label.y
    &&label.y-line.y<=rowGap&&Math.abs(line.x-label.x)<=prep.w*.23
    &&possiblePlayerLine(line.text)).sort((a,b)=>{
     const aMatch=matchName(a.text),bMatch=matchName(b.text);
     return (aMatch.name?0:1)-(bMatch.name?0:1)
      || (label.y-a.y)-(label.y-b.y)
      || Math.abs(a.x-label.x)-Math.abs(b.x-label.x);
    });
   if(previous.length){
    rawName=previous[0].text;
    person=matchName(rawName);
   }
  }
  // The number normally occurs ON the "Poder Total del Héroe" line.
  // If OCR splits it into a separate line, it may be beside that label,
  // not beside the player's name.
  const around=all.filter(line=>line!==label
   &&Math.abs(line.y-label.y)<=valueGap
   &&line.x>=label.x-prep.w*.035&&line.x<=prep.w*.93
   &&tokens(line.text).length
   &&(!heroPowerLabel(line.text)||line.text!==label.text));
  const numbers=[...tokens(label.text),...around.flatMap(line=>tokens(line.text))];
  const unique=[...new Set(numbers.map(power=>power.toFixed(3)))].map(Number);
  const conflict=unique.length>1,power=unique.length===1?unique[0]:null;
  const name=person?.name||"",key=name?"player:"+normal(name):
   "unknown:"+prep.name+":"+Math.round(label.y/14);
  found.push({key,name,raw:rawName||"Nombre no leído en la fila del THP",
   power,conflict,exact:!!person?.exact,manual:!person?.name,
   engine,file:prep.name,labelFound:true});
 }
 // When OCR fails to recognize the exact label, still list known names and
 // candidate THP beneath them for review. Never treat these unlabelled
 // guesses as automatically approved changes.
 const names=all.filter(line=>possiblePlayerLine(line.text)).map(line=>({
  ...line,match:matchName(line.text)
 })).filter(line=>line.match.name);
 for(const line of names){
  if(found.some(row=>row.name&&normal(row.name)===normal(line.match.name)))continue;
  const candidatePower=all.filter(power=>power!==line
   &&power.y>=line.y&&power.y-line.y<=rowGap
   &&Math.abs(power.x-line.x)<=prep.w*.55
   &&tokens(power.text).length
   &&!names.some(other=>other!==line&&other.y>line.y
    &&other.y<power.y&&Math.abs(other.x-line.x)<=prep.w*.25))
   .sort((a,b)=>a.y-b.y);
  const values=[...tokens(line.text),...candidatePower.flatMap(power=>tokens(power.text))];
  const unique=[...new Set(values.map(power=>power.toFixed(3)))].map(Number);
  const conflict=unique.length>1,power=unique.length===1?unique[0]:null;
  const name=line.match.name;
  found.push({key:"player:"+normal(name),name,raw:line.text,power,conflict,
   exact:line.match.exact,manual:true,engine,file:prep.name,labelFound:false});
 }
 // Within one image a name can occasionally be repeated by Azure. Keep the
 // explicit game-label row over a fallback row, but retain any conflicts.
 const deduped=new Map();
 for(const row of found){
  const previous=deduped.get(row.key);
  if(!previous||(!previous.labelFound&&row.labelFound)
   ||(previous.power==null&&row.power!=null))deduped.set(row.key,row);
  else if(previous.power!=null&&row.power!=null
    &&Math.abs(previous.power-row.power)>.001){
   previous.conflict=true;previous.power=null;
  }
 }
 return [...deduped.values()];
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
 if(row.manual&&!row.approved)return {text:"Confirmar THP manual",kind:"warn"};
 if(row.conflict)return {text:"THP contradictorio",kind:"warn"};
 if(row.power==null)return {text:"Sin THP leído",kind:"muted"};
 const current=currentTHP(row);
 if(current!=null&&row.power<=current+.00001)return {text:"Conservar Supabase",kind:"muted"};
 if(jump(row)&&!row.approved)return {text:"Revisar aumento",kind:"warn"};
 return {text:"Puede actualizar",kind:"good"};
}
function eligible(row){return !!(row.name&&official(row.name)&&row.exact&&!row.conflict&&row.power!=null&&row.power>0&&!row.saved&&(!row.manual||row.approved)&&(!jump(row)||row.approved)&&(!row.readings.length||row.readings.length===1||row.edited));}
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
   ((row.manual||row.conflict||jump(row)||!row.exact)?'<label class="confirm"><input type="checkbox" data-field="approve" '+(row.approved?'checked ':'')+disabled+'><span>He revisado esta lectura y confirmo el nombre y THP.</span></label>':'')+
   '<label class="confirm"><input type="checkbox" data-field="selected" '+(row.selected?'checked ':'')+(proposed(row)?disabled:' disabled')+'><span>Incluir este aumento al guardar'+(row.saved?" · guardado":"")+'</span></label>'+
   '</article>';
 }).join(""):'<div class="results-empty">No se reconocieron nombres con THP. Prueba capturas más nítidas o pulsa «Añadir jugador no reconocido» para introducir una fila y revisarla antes de guardar.</div>';
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
 busy=true;scanned=false;results=[];report=null;
 $("scan").disabled=true;$("reload").disabled=true;$("confirmChanges").checked=false;render();
 const warnings=[],summary=[];let azureOK=0,tesseractOK=0,engine=null,engineAttempted=false;
 try{
  await loadProfiles();
  for(let i=0;i<files.length;i++){
   const file=files[i];message("Preparando imagen COMPLETA "+(i+1)+"/"+files.length+" · "+file.name);
   try{
    const prep=await prepare(file);
    let azureRows=[],azureText=[],azureLineCount=0,tessRows=[],tessLineCount=0;
    // Azure first: no large Tesseract download before contacting Azure.
    try{
     message("Azure · leyendo "+(i+1)+"/"+files.length+" · "+file.name);
     azureText=await readAzure(prep);
     azureLineCount=azureText.length;azureRows=parseCandidates(azureText,prep,"Azure");
     mergeCandidates(azureRows);azureOK++;
    }catch(error){warnings.push("Azure "+file.name+": "+String(error?.message||error));}
    const missingValues=azureRows.filter(row=>row.name&&row.power==null).length;
    const labelsSeen=azureText.filter(line=>heroPowerLabel(line.text)).length;
    const complete=azureRows.filter(row=>row.name&&row.power!=null&&!row.conflict).length;
    if(complete<1||missingValues||labelsSeen>complete){
     try{
      if(!engineAttempted){engineAttempted=true;engine=await ocrWorker();}
      if(engine){
       message("Tesseract · segunda lectura de "+file.name);
       const {data}=await engine.recognize(prep.blob,{}, {text:true,blocks:true});
       const tesseractText=normalizeLines(data,prep.ox,prep.oy,prep.scale);
       tessLineCount=tesseractText.length;tessRows=parseCandidates(tesseractText,prep,"Tesseract");
       mergeCandidates(tessRows);tesseractOK++;
      }
     }catch(error){warnings.push("Tesseract "+file.name+": "+String(error?.message||error));}
    }
    summary.push(file.name+": Azure "+azureLineCount+" líneas / "+azureRows.length+
     " posibles jugadores · Tesseract "+tessLineCount+" líneas / "+tessRows.length+" posibles jugadores");
    message("Imagen "+(i+1)+"/"+files.length+" · "+(azureRows.length+tessRows.length)+" posibles lecturas.");
   }catch(error){warnings.push(file.name+": "+String(error?.message||error));}
  }
  results.sort((a,b)=>{const va=a.power??-1,vb=b.power??-1;return vb-va||String(a.name||a.raw).localeCompare(String(b.name||b.raw));});
  results.forEach((row,i)=>row.id=i);
  scanned=true;
  const recognized=results.filter(row=>row.name).length;
  message("Lectura finalizada: "+recognized+" miembros cotejados y "+(results.length-recognized)+
   " nombres por revisar. "+summary.join(" · ")+". No se ha modificado Supabase."+
   (warnings.length?" Avisos: "+warnings.join(" · "):"")+
   (!results.length?" Ningún candidato: comprueba que la captura muestra nombres y poderes. Puedes añadir manualmente las filas visibles.":""),
   warnings.length||!results.length?"warn":"success");
 }catch(error){message("No se pudo leer el listado: "+String(error?.message||error),"error");}
 finally{
  if(engine){try{await engine.terminate();}catch{}worker=null;}
  busy=false;$("scan").disabled=false;$("reload").disabled=false;render();
 }
}
function editRow(event){
 const card=event.target.closest("[data-index]");if(!card)return;
 const row=results.find(r=>r.id===Number(card.dataset.index));if(!row||row.saved)return;
 const field=event.target.dataset.field;
 if(field==="name"){
  row.name=event.target.value;row.exact=!!official(row.name);row.manual=true;row.approved=false;row.selected=false;
 }else if(field==="power"){
  const value=String(event.target.value||"").trim().replace(",",".");
  row.power=value?Number(value):null;
  if(row.power!=null&&(!Number.isFinite(row.power)||row.power<=0||row.power>9999))row.power=null;
  row.edited=true;row.manual=true;row.conflict=false;row.approved=false;row.selected=false;
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
 $("addMissing").addEventListener("click",()=>{
  if(busy||!scanned)return;
  const id=Math.max(-1,...results.map(row=>row.id))+1;
  results.unshift({id,key:"manual:"+id,name:"",raw:"Fila añadida manualmente",power:null,conflict:false,exact:false,
   engine:"Manual",file:"Revisión de captura",readings:[],files:new Set(["Revisión de captura"]),
   selected:false,approved:false,edited:true,manual:true,saved:false});
  $("confirmChanges").checked=false;render();
 });
 $("selectSafe").addEventListener("click",selectSafe);$("unselectAll").addEventListener("click",()=>{results.forEach(r=>r.selected=false);$("confirmChanges").checked=false;render();});
 $("confirmChanges").addEventListener("change",render);
 $("save").addEventListener("click",save);
}
(async()=>{try{if(!await verify())return;bind();}catch(e){$("gate").textContent="No se pudo abrir el actualizador THP: "+String(e?.message||e);$("gate").className="panel gate notice error";console.error(e);}})();
