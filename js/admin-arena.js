import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import {arenaKey,detectArenaNames,mergeArenaDraft,arenaSaveRows} from './arena-presence.js?v=20261015-ranking-1';
import {prepareArenaLocal,arenaRowCanvas} from './arena-ocr-layout.js?v=20261015-1';
const URL_BASE='https://ovybstpiomphrouvqxmf.supabase.co',API_KEY='sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV';
const sb=createClient(URL_BASE,API_KEY,{auth:{persistSession:true,autoRefreshToken:true}}),$=id=>document.getElementById(id);
const texts={
 es:{back:'Volver al panel',title:'Guerras de arena',language:'Idioma',gate:'Comprobando acceso R4/R5...',battleTitle:'1. Selecciona la batalla',savedBattles:'Batallas guardadas',newBattle:'Crear una nueva batalla',date:'Fecha de la batalla (servidor)',battleName:'Nombre o referencia',create:'CREAR BATALLA',multipleBattles:'Si hay varias batallas el mismo día, usa nombres distintos.',screensTitle:'2. Añade las capturas de puntaje',presenceHelp:'Se registra presencia al confirmar el nombre; no se exige un mínimo de puntos. La captura debe mostrar a quienes participaron.',screenshots:'Capturas de la lista de participantes',layout:'Formato de captura',rankingLayout:'Matar Enemigo · Ranking diario (pantalla completa)',croppedLayout:'Imagen recortada / otro formato',refining:'Afinando nombres: fila',screensHelp:'Puedes añadir capturas sucesivas. El OCR acumula nombres y elimina duplicados. Revisa los resultados antes de guardarlos.',readLocal:'LEER CAPTURAS',readAzure:'REINTENTAR CON AZURE',clearDraft:'LIMPIAR BORRADOR',ocrText:'Texto leído por el OCR',reviewTitle:'3. Revisa y confirma',reviewHelp:'Las coincidencias exactas están marcadas. Las sugerencias necesitan tu confirmación. No aparecer en estas capturas no significa estar ausente.',selectAll:'ACEPTAR TODOS LOS NOMBRES DETECTADOS',manualName:'Añadir un miembro manualmente',add:'AÑADIR PARTICIPANTE',save:'GUARDAR PARTICIPACIÓN',savedTitle:'Participantes ya confirmados',reload:'RECARGAR REGISTRO',copy:'COPIAR LISTA',choose:'Selecciona una batalla',emptyBattles:'No hay batallas guardadas. Crea la primera con la fecha de hoy.',saved:'confirmados',pending:'por guardar',unconfirmed:'sin confirmar en estas capturas',emptyDraft:'Añade capturas o un nombre manual para empezar.',emptySaved:'Todavía no hay participantes confirmados.',suggestion:'Sugerencia: revisar antes de marcar',exact:'Nombre detectado',manual:'Añadido manualmente',remove:'Quitar',removeSaved:'Quitar del registro',selectBattle:'Selecciona o crea una batalla primero.',checkAccess:'Acceso reservado a administradores R4/R5.',ready:'Añade capturas del puntaje para registrar quién participó.',error:'No se pudo completar la operación: ',creating:'Creando batalla...',badDate:'Indica una fecha válida, que no sea futura, y un nombre para la batalla.',created:'Batalla lista. Puedes añadir las capturas.',switchConfirm:'Hay nombres sin guardar. ¿Quieres cambiar de batalla y descartar el borrador?',clearConfirm:'¿Limpiar capturas y nombres sin guardar? El registro confirmado se conserva.',noFiles:'Añade primero una captura.',largeFile:'Imagen no válida o superior a 15 MB: ',reading:'Leyendo captura',of:'de',ocrReady:'OCR terminado. Revisa los nombres detectados y pulsa Guardar participación.',ocrFailed:'No se pudo leer alguna captura. Puedes reintentar con Azure o añadir los nombres manualmente.',noMatches:'No se han reconocido miembros. Revisa el texto OCR, prueba Azure o añade los nombres manualmente.',loadingOCR:'Preparando OCR local...',loadingSaved:'Cargando participantes...',nameMissing:'Selecciona un nombre válido de la lista de miembros.',added:'Nombre añadido al borrador.',saving:'Guardando participantes...',savedOk:'Participación guardada. Puedes seguir añadiendo capturas sin duplicar jugadores.',savedRemoveConfirm:'¿Quitar a {name} de esta batalla?',removed:'Participante retirado del registro. Puedes añadirlo de nuevo si fue un error.',unsaved:'Cambios sin guardar',copied:'Lista copiada con saltos de línea.',copyFailed:'No se pudo copiar. Selecciona los nombres del registro para copiarlos.',confirmedHeading:'PARTICIPANTES CONFIRMADOS',noSavedCopy:'No hay participantes confirmados para copiar.',notAttendance:'Sin confirmar no significa ausente.',nothing:'Marca al menos un participante para guardar.'},
 en:{back:'Back to admin',title:'Arena Wars',language:'Language',gate:'Checking R4/R5 access...',battleTitle:'1. Select the battle',savedBattles:'Saved battles',newBattle:'Create a new battle',date:'Battle date (server)',battleName:'Name or reference',create:'CREATE BATTLE',multipleBattles:'For multiple battles on the same day, use different names.',screensTitle:'2. Add score screenshots',presenceHelp:'Confirming a name records presence; there is no minimum score. Screenshots must show actual participants.',screenshots:'Participant list screenshots',layout:'Screenshot format',rankingLayout:'Kill Enemy · Daily ranking (full screen)',croppedLayout:'Cropped image / other format',refining:'Refining names: row',screensHelp:'Add screenshots in several batches. OCR merges names and removes duplicates. Review the results before saving.',readLocal:'READ SCREENSHOTS',readAzure:'RETRY WITH AZURE',clearDraft:'CLEAR DRAFT',ocrText:'Text read by OCR',reviewTitle:'3. Review and confirm',reviewHelp:'Exact matches are checked. Suggestions require confirmation. Not appearing in these screenshots does not mean absent.',selectAll:'ACCEPT ALL DETECTED NAMES',manualName:'Add a member manually',add:'ADD PARTICIPANT',save:'SAVE PARTICIPATION',savedTitle:'Already confirmed participants',reload:'RELOAD RECORDS',copy:'COPY LIST',choose:'Select a battle',emptyBattles:'No battles saved yet. Create the first one with today’s date.',saved:'confirmed',pending:'to save',unconfirmed:'unconfirmed in these screenshots',emptyDraft:'Add screenshots or a name manually to start.',emptySaved:'No confirmed participants yet.',suggestion:'Suggestion: review before checking',exact:'Name detected',manual:'Added manually',remove:'Remove',removeSaved:'Remove from records',selectBattle:'Select or create a battle first.',checkAccess:'Access is restricted to R4/R5 administrators.',ready:'Add score screenshots to record who took part.',error:'The operation could not be completed: ',creating:'Creating battle...',badDate:'Enter a valid date, not in the future, and a battle name.',created:'Battle ready. You can add screenshots.',switchConfirm:'There are unsaved names. Switch battles and discard the draft?',clearConfirm:'Clear screenshots and unsaved names? Confirmed records will be kept.',noFiles:'Add a screenshot first.',largeFile:'Invalid image or larger than 15 MB: ',reading:'Reading screenshot',of:'of',ocrReady:'OCR complete. Review the detected names and save participation.',ocrFailed:'Some screenshots could not be read. Retry with Azure or add names manually.',noMatches:'No members recognized. Check the OCR text, try Azure or add names manually.',loadingOCR:'Preparing local OCR...',loadingSaved:'Loading participants...',nameMissing:'Select a valid name from the member list.',added:'Name added to the draft.',saving:'Saving participants...',savedOk:'Participation saved. Keep adding screenshots without duplicating players.',savedRemoveConfirm:'Remove {name} from this battle?',removed:'Participant removed. You can add them again if this was a mistake.',unsaved:'Unsaved changes',copied:'List copied with line breaks.',copyFailed:'Could not copy. Select the names in the saved records and copy them manually.',confirmedHeading:'CONFIRMED PARTICIPANTS',noSavedCopy:'No confirmed participants to copy.',notAttendance:'Unconfirmed does not mean absent.',nothing:'Check at least one participant to save.'}
};
let lang=(localStorage.getItem('hola-arena-language')||localStorage.getItem('hola-language')||'es')==='es'?'es':'en';
let players=[],battles=[],active=null,saved=new Map(),draft=new Map(),files=new Map(),processed=new Set(),busy=false,workerPromise=null;
const t=key=>texts[lang][key]||texts.en[key]||key;
function status(text,kind=''){$('status').textContent=text;$('status').className='status '+kind}
function error(e){status(t('error')+(e?.message||String(e)),'error')}
function currentBattle(){return battles.find(b=>b.id===active)}
function formatDate(value){return new Intl.DateTimeFormat(lang==='es'?'es-ES':'en-GB',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'))}
function busyState(value){busy=value;$('controls').disabled=value;updateCounts()}
function unsaved(){return draft.size>0}
function updateCounts(){
 const selected=[...draft.values()].filter(p=>p.checked).length;
 $('savedCount').textContent=saved.size+' '+t('saved');$('draftCount').textContent=selected+' '+t('pending');
 $('unconfirmedCount').textContent=players.filter(p=>!saved.has(p.name)&&!draft.get(p.name)?.checked).length+' '+t('unconfirmed');
 $('countInfo').textContent=selected+' '+t('pending');$('save').disabled=busy||!active||!selected;
}
function label(text,tag='span'){const el=document.createElement(tag);el.textContent=text;return el}
function renderDraft(){
 const box=$('draftList');box.replaceChildren();
 for(const entry of [...draft.values()].sort((a,b)=>a.name.localeCompare(b.name))){
  const row=document.createElement('label');row.className='person'+(entry.confidence==='suggestion'?' suggestion':'');
  const check=document.createElement('input');check.type='checkbox';check.checked=entry.checked;check.addEventListener('change',()=>{entry.checked=check.checked;entry.reviewed=true;updateCounts()});
  const copy=document.createElement('span');copy.append(label(entry.name,'strong'),label(entry.source==='manual'?t('manual'):entry.confidence==='exact'?t('exact'):t('suggestion'),'small'));
  if(entry.evidence?.length)copy.append(label(entry.evidence.slice(0,2).join(' / '),'small'));
  const remove=label(t('remove'),'button');remove.type='button';remove.addEventListener('click',event=>{event.preventDefault();draft.delete(entry.name);renderDraft()});
  row.append(check,copy,remove);box.append(row);
 }
 if(!draft.size)box.append(label(t('emptyDraft'),'p'));updateCounts();
}
function renderSaved(){
 const box=$('savedList');box.replaceChildren();
 for(const name of [...saved.keys()].sort((a,b)=>a.localeCompare(b))){const row=document.createElement('div');row.className='person saved';const mark=label('✓');mark.setAttribute('aria-hidden','true');const remove=label(t('removeSaved'),'button');remove.type='button';remove.addEventListener('click',()=>removeParticipant(name));row.append(mark,label(name,'strong'),remove);box.append(row)}
 if(!saved.size)box.append(label(t('emptySaved'),'p'));updateCounts();
}
function renderBattles(){
 const select=$('battleSelect');select.replaceChildren();const empty=label(t('choose'),'option');empty.value='';select.append(empty);
 for(const battle of battles){const option=label(formatDate(battle.battle_date)+' · '+battle.title,'option');option.value=battle.id;select.append(option)}select.value=active||'';
 const battle=currentBattle();$('battleInfo').textContent=battle?formatDate(battle.battle_date)+' · '+battle.title:!battles.length?t('emptyBattles'):t('choose');
}
function translate(){
 document.documentElement.lang=lang;document.title='HOLa · '+t('title');$('language').value=lang;
 for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
 renderBattles();renderDraft();renderSaved();
}
function clearDraft(){for(const entry of files.values())URL.revokeObjectURL(entry.url);files.clear();processed.clear();draft.clear();$('screenshots').value='';$('gallery').replaceChildren();$('ocrText').value='';renderDraft()}
async function reloadBattles(){const {data,error:err}=await sb.from('arena_battles').select('id,battle_date,title,created_at').order('battle_date',{ascending:false}).order('created_at',{ascending:false});if(err)throw err;battles=data||[];renderBattles()}
async function loadSaved(){
 if(!active){saved.clear();renderSaved();return}
 const id=active,{data,error:err}=await sb.from('arena_participation').select('player_name,source,recorded_at').eq('battle_id',id).order('player_name');if(err)throw err;if(id!==active)return;
 saved=new Map((data||[]).map(p=>[p.player_name,p]));for(const name of saved.keys())draft.delete(name);renderSaved();renderDraft();
}
async function switchBattle(id){
 if(busy)return;if(unsaved()&&!confirm(t('switchConfirm'))){$('battleSelect').value=active||'';return}
 clearDraft();active=id||null;saved.clear();renderBattles();renderSaved();busyState(true);
 try{await loadSaved();status(active?t('ready'):t('selectBattle'))}catch(e){error(e)}finally{busyState(false)}
}
async function createBattle(){
 const date=$('battleDate').value,title=$('battleName').value.trim();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>new Date().toISOString().slice(0,10)||!title){status(t('badDate'),'error');return}
 if(unsaved()&&!confirm(t('switchConfirm')))return;
 busyState(true);status(t('creating'));
 try{
  const {data,error:err}=await sb.from('arena_battles').upsert({battle_date:date,title},{onConflict:'battle_date,title',ignoreDuplicates:true}).select('id,battle_date,title,created_at');if(err)throw err;
  await reloadBattles();const battle=data?.[0]||battles.find(b=>b.battle_date===date&&b.title===title);if(!battle)throw Error(t('selectBattle'));
  clearDraft();active=battle.id;await loadSaved();renderBattles();status(t('created'),'ok');
 }catch(e){error(e)}finally{busyState(false)}
}
function timeout(promise,ms,message){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(message)),ms)})]).finally(()=>clearTimeout(timer))}
async function localWorker(){
 if(workerPromise)return workerPromise;
 workerPromise=(async()=>{
  if(!window.Tesseract)await timeout(new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';script.onload=resolve;script.onerror=()=>reject(Error(t('ocrFailed')));document.head.append(script)}),20000,t('ocrFailed'));
  const worker=await timeout(window.Tesseract.createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0',langPath:'https://tessdata.projectnaptha.com/4.0.0'},{load_system_dawg:'0',load_freq_dawg:'0'}),60000,t('ocrFailed'));
  await worker.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1',user_defined_dpi:'300'});return worker;
 })().catch(e=>{workerPromise=null;throw e});return workerPromise;
}
async function prepare(file){
 const bitmap=await createImageBitmap(file);const scale=Math.min(2200/Math.max(bitmap.width,bitmap.height),Math.max(1,1600/bitmap.width));
 const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const context=canvas.getContext('2d');if(!context)throw Error(t('ocrFailed'));context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas;
}
async function azureText(canvas){
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(Error(t('ocrFailed'))),'image/jpeg',.94));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{const {data:{session}}=await sb.auth.getSession();const response=await fetch(URL_BASE+'/functions/v1/vs-azure-ocr',{method:'POST',headers:{apikey:API_KEY,Authorization:'Bearer '+(session?.access_token||API_KEY),'Content-Type':'image/jpeg'},body:blob,signal:controller.signal});const data=await response.json().catch(()=>null);if(!response.ok)throw Error(data?.error||'Azure '+response.status);const text=data?.ParsedResults?.[0]?.ParsedText;if(!text)throw Error(data?.warning||t('noMatches'));return text}finally{clearTimeout(timer)}
}

async function localRankingText(file){
 const worker=await localWorker(),prepared=await prepareArenaLocal(file,$('ocrLayout').value);
 await worker.setParameters({tessedit_pageseg_mode:'6'});
 const result=await timeout(worker.recognize(prepared.canvas,{}, {text:true}),60000,t('ocrFailed'));
 let text=result?.data?.text||'';
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),extra=[];
 if(prepared.bands.length>=2&&prepared.bands.length<=15){
  await worker.setParameters({tessedit_pageseg_mode:'7'});
  for(let i=0;i<prepared.bands.length;i++){
   // Retry only missing or doubtful rows when block and visual row counts agree.
   if(lines.length===prepared.bands.length&&detectArenaNames(lines[i],players).exact.length===1)continue;
   status(t('refining')+' '+(i+1)+' / '+prepared.bands.length);
   const row=arenaRowCanvas(prepared.gray,prepared.bands[i]),read=await timeout(worker.recognize(row,{}, {text:true}),30000,t('ocrFailed'));
   if(read?.data?.text)extra.push(read.data.text);
  }
 }
 return text+(extra.length?'\n'+extra.join('\n'):'');
}

async function runOCR(engine='local'){
 if(busy)return;if(!active){status(t('selectBattle'),'error');return}if(!files.size){status(t('noFiles'),'error');return}
 busyState(true);let failed=0,read=0;
 try{
  if(engine==='local')status(t('loadingOCR'));
  let index=0;for(const [signature,entry]of files){index++;const stamp=engine+':'+$('ocrLayout').value+':'+signature;if(processed.has(stamp))continue;status(t('reading')+' '+index+' '+t('of')+' '+files.size+' · '+(engine==='local'?'Local':'Azure'));
   try{let text;
    if(engine==='azure')text=await azureText(await prepare(entry.file));else text=await localRankingText(entry.file);
    const found=detectArenaNames(text,players);draft=mergeArenaDraft(draft,found,[...saved.keys()]);$('ocrText').value+=($('ocrText').value?'\n\n':'')+entry.file.name+' ['+engine+']\n'+text;processed.add(stamp);read++;renderDraft();
   }catch(e){failed++;console.warn('Arena OCR',e);if(engine==='local'){const promise=workerPromise;workerPromise=null;promise?.then(w=>w.terminate()).catch(()=>{})}}
  }
  status(failed?t('ocrFailed'):draft.size||saved.size?t('ocrReady'):t('noMatches'),failed?'error':'');
 }catch(e){error(e)}finally{busyState(false)}
}
async function save(){
 if(busy)return;let rows;try{rows=arenaSaveRows(active,draft)}catch{status(t('selectBattle'),'error');return}
 if(!rows.length){status(t('nothing'),'error');return}busyState(true);status(t('saving'));
 try{
  const {error:err}=await sb.from('arena_participation').upsert(rows,{onConflict:'battle_id,player_name',ignoreDuplicates:true});if(err)throw err;
  await loadSaved();status(t('savedOk'),'ok');
 }catch(e){error(e)}finally{busyState(false)}
}
async function removeParticipant(name){
 if(busy||!active||!confirm(t('savedRemoveConfirm').replace('{name}',name)))return;busyState(true);
 try{const {error:err}=await sb.from('arena_participation').delete().eq('battle_id',active).eq('player_name',name);if(err)throw err;await loadSaved();status(t('removed'),'ok')}catch(e){error(e)}finally{busyState(false)}
}
function addManual(){
 if(!active){status(t('selectBattle'),'error');return}
 const raw=$('manualName').value.trim(),literal=players.find(p=>p.name===raw),input=arenaKey(raw),matches=literal?[literal]:players.filter(p=>arenaKey(p.name)===input);
 if(matches.length!==1){status(t('nameMissing'),'error');return}const name=matches[0].name;
 if(!saved.has(name))draft.set(name,{name,source:'manual',confidence:'exact',checked:true,evidence:[]});$('manualName').value='';renderDraft();status(t('added'));
}
$('createBattle').addEventListener('click',createBattle);$('battleSelect').addEventListener('change',()=>switchBattle($('battleSelect').value));
$('screenshots').addEventListener('change',()=>{
 if(!active){$('screenshots').value='';status(t('selectBattle'),'error');return}
 const errors=[];for(const file of $('screenshots').files){if(!file.type.startsWith('image/')||file.size>15*1024*1024){errors.push(t('largeFile')+file.name);continue}const signature=file.name+':'+file.size+':'+file.lastModified;if(files.has(signature))continue;const url=URL.createObjectURL(file);files.set(signature,{file,url});const img=document.createElement('img');img.src=url;img.alt=file.name;$('gallery').append(img)}
 if(errors.length){status(errors.join('\n'),'error');return}runOCR();
});
$('readLocal').addEventListener('click',()=>runOCR());$('readAzure').addEventListener('click',()=>runOCR('azure'));
$('clearDraft').addEventListener('click',()=>{if((files.size||draft.size)&&confirm(t('clearConfirm'))){clearDraft();status(t('ready'))}});
$('selectAll').addEventListener('click',()=>{for(const entry of draft.values()){entry.checked=true;entry.reviewed=true}renderDraft()});
$('addManual').addEventListener('click',addManual);$('manualName').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();addManual()}});$('save').addEventListener('click',save);
$('reloadSaved').addEventListener('click',async()=>{busyState(true);try{await loadSaved();status(t('ready'))}catch(e){error(e)}finally{busyState(false)}});
$('copyNames').addEventListener('click',async()=>{
 const battle=currentBattle();if(!battle||!saved.size){status(t('noSavedCopy'),'error');return}
 const text=[battle.title,formatDate(battle.battle_date),'',t('confirmedHeading')+' ('+saved.size+')',...[...saved.keys()].sort((a,b)=>a.localeCompare(b)).map((name,i)=>(i+1)+'. '+name),'',t('notAttendance')].join('\r\n');
 try{await navigator.clipboard.writeText(text);status(t('copied'),'ok')}catch{status(t('copyFailed'),'error')}
});
$('language').addEventListener('change',()=>{lang=$('language').value==='es'?'es':'en';localStorage.setItem('hola-arena-language',lang);translate()});
window.addEventListener('beforeunload',event=>{if(unsaved()){event.preventDefault();event.returnValue=''}});
async function init(){
 translate();$('battleDate').value=new Date().toISOString().slice(0,10);$('battleDate').max=$('battleDate').value;$('gate').textContent=t('gate');
 try{
  const {data:{session},error:authError}=await sb.auth.getSession();if(authError||!session?.user){location.replace('admin-login.html');return}
  const {data:allowed,error:accessError}=await sb.rpc('is_hola_r4_r5_admin');if(accessError||allowed!==true)throw Error(t('checkAccess'));
  const {data,error:rosterError}=await sb.from('players').select('name').order('name');if(rosterError)throw rosterError;players=data||[];
  const list=$('memberNames');for(const p of players){const option=document.createElement('option');option.value=p.name;list.append(option)}
  await reloadBattles();active=battles[0]?.id||null;renderBattles();await loadSaved();$('gate').hidden=true;$('app').hidden=false;status(t('ready'));
 }catch(e){$('gate').textContent=t('error')+(e?.message||e)}
}
init();
