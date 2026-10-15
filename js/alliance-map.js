import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {comparePositions,applyPositionReviews} from './map-position-compare.js?v=20261010-manual-red';
import {marshallError,mapGeometry} from './map-marshall.js?v=20261015-trim-1';
import {initHiveSearch} from './hive-public-ui.js?v=20261015-1';
const sb=createClient('https://ovybstpiomphrouvqxmf.supabase.co','sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV');
const $=id=>document.getElementById(id),admin=document.body.classList.contains('admin');
let marshall={x:195,y:959},marshallDraft=null,geometry=mapGeometry(marshall);
const visibleMarshall=()=>marshallDraft||marshall;
const overlapsMarshall=s=>Math.abs(s.x-visibleMarshall().x)<3&&Math.abs(s.y-visibleMarshall().y)<3;
function resizeMap(){geometry=mapGeometry(visibleMarshall(),slots);W=geometry.width;H=geometry.height;canvas.width=W*2;canvas.height=H*2;ctx.scale(2,2);size();}
let slots=[],revision,selected=null,zoom=1,busy=false,lang=localStorage.getItem('hola-language')||'es';
const norm=s=>{const n=(s||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');return n==='mirliva'?'mirrliva':n};
let hiveSearch=null,publicStatusRevision=null,publicStatusState='loading',publicStatusQueriedAt=null;
const en=()=>lang!=='es',say=(es,english)=>en()?english:es;
const canvas=$('map'),ctx=canvas.getContext('2d'),S=48,L=140,T=150;
let W=geometry.width,H=geometry.height;
canvas.width=W*2;canvas.height=H*2;ctx.scale(2,2);
const px=x=>L+(x-geometry.minX-.5)*S,py=y=>T+(1000-y)*S;
const images={};
function status(s){$('status').textContent=s}
function label(s){return `${String(s.id).padStart(3,'0')} · ${s.name||say('Libre','Available')} · X${s.x} Y${s.y}`}
function translate(){document.documentElement.lang=en()?'en':'es';$('title').textContent=admin?say('Organización del mapa','Map administration'):say('Mapa de la alianza','Alliance map');$('intro').textContent=say('Encuentra tu nombre y consulta las coordenadas del centro de tu base.','Find your name and the coordinates of your base centre.');$('search-label').textContent=say('Nombre del jugador','Player name');$('search').placeholder=say('Escribe tu nombre','Type your name');for(const [id,a,b] of [['find','Buscar','Search'],['copy','Copiar nombre y coordenadas','Copy name and coordinates'],['download','Descargar mapa HD','Download HD map'],['fit','Ver todo','Fit map']])$(id).textContent=say(a,b);$('language').textContent=en()?'Español':'English';$('map-hint').textContent=say('Desliza para recorrer el mapa. Bases de 3 × 3 casillas. Coordenadas del centro. Límite Y999.','Scroll to explore. Bases occupy 3 × 3 cells. Centre coordinates. Upper limit Y999.');$('terrain-note').textContent=say('Contorno aproximado: comprueba la colocación en el juego.','Approximate terrain outline: verify placement in game.');if(selected)show(selected,false);if(admin){translateMarshall();renderScan();}else{translatePublicHive();hiveSearch?.close();}draw();}
function fit(){zoom=Math.min($('viewport').clientWidth/W,(admin?Math.min(window.innerHeight*.72,750):$('viewport').clientHeight)/H,1);size();$('viewport').scrollTo({left:0,top:0})}
function size(){canvas.style.width=W*zoom+'px';canvas.style.height=H*zoom+'px';$('viewport').style.height=admin?Math.min(H*zoom+2,window.innerHeight*.72,750)+'px':''}
function centerSelected(behavior='smooth'){if(!selected)return;$('viewport').scrollTo({left:px(selected.x)*zoom-$('viewport').clientWidth/2,top:py(selected.y)*zoom-$('viewport').clientHeight/2,behavior})}
window.addEventListener('resize',()=>{if(slots.length){if(!admin&&selected){size();centerSelected('auto')}else fit()}});
window.visualViewport?.addEventListener('resize',()=>{if(!admin&&selected)centerSelected('auto')});
function box(x1,y1,x2,y2,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(px(x1),py(y2),(x2-x1)*S,(y2-y1)*S);ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.strokeRect(px(x1),py(y2),(x2-x1)*S,(y2-y1)*S)}
function text(s,x,y,size=18,color='#163f58'){ctx.fillStyle=color;ctx.font=`700 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y)}
function building(name,x1,y1,x2,y2,title){box(x1,y1,x2,y2,'#c7a366','#9b743f');const im=images[name];if(im){const w=(x2-x1)*S,h=(y2-y1)*S,ratio=Math.min(w/im.width,(h-48)/im.height);ctx.drawImage(im,px(x1)+(w-im.width*ratio)/2,py(y2)+10,im.width*ratio,im.height*ratio)}text(title,(px(x1)+px(x2))/2,py(y1)-15,22)}

function drawBaseLabel(s,active){
 const misplaced=isMisplaced(s);
 const name=(s.name||say('Libre','Available')).replace(/ᓚᘏᗢ|ツ/g,'').trim();
 let fontSize=25;
 if(!name.includes(' ')){
  while(fontSize>17){ctx.font=`700 ${fontSize}px system-ui`;if(ctx.measureText(name).width<=132)break;fontSize--}
 }
 let lines=[];
 do{
  ctx.font=`700 ${fontSize}px system-ui`;lines=[];let line='';
  for(const char of Array.from(name)){
   if(line&&ctx.measureText(line+char).width>132){lines.push(line);line=''}
   line+=char;
  }
  if(line)lines.push(line);
  if(lines.length<=3)break;
  fontSize--;
 }while(fontSize>8);
 const total=lines.length*fontSize;
 for(let i=0;i<lines.length;i++)text(lines[i],px(s.x),py(s.y)-32.5-total/2+(i+.5)*fontSize,fontSize,misplaced?'#7f1326':'#082e43');
 ctx.fillStyle=misplaced?'#ffe5e5':active?'#fff1bf':'#effbff';
 ctx.fillRect(px(s.x)-68.5,py(s.y)+9,137,59.5);
 text(`X:${s.x}`,px(s.x),py(s.y)+24.5,29,'#082e43');
 text(`Y:${s.y}`,px(s.x),py(s.y)+53.5,29,'#082e43');
}

function draw(){const displayedMarshall=visibleMarshall();ctx.fillStyle='#d4b477';ctx.fillRect(0,0,W,H);text('HOLa · '+say('MAPA DE LA ALIANZA','ALLIANCE MAP'),W/2,55,38);text(say('Nombre · coordenadas del centro · bases 3 × 3','Name · centre coordinates · 3 × 3 bases'),W/2,95,21);ctx.strokeStyle='#a58c61';ctx.lineWidth=1;for(let x=Math.ceil(geometry.minX);x<=geometry.maxX;x++){ctx.beginPath();ctx.moveTo(px(x-.5),py(999.5));ctx.lineTo(px(x-.5),py(geometry.minY));ctx.stroke();if((x-195)%5===0)text(x,px(x),132,18)}for(let y=Math.ceil(geometry.minY);y<=1000;y++){ctx.beginPath();ctx.moveTo(px(geometry.minX),py(y-.5));ctx.lineTo(px(geometry.maxX),py(y-.5));ctx.stroke();if(y%5===0)text(y,75,py(y)+6,18)}ctx.strokeStyle='#655132';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px(geometry.minX),py(999.5));ctx.lineTo(px(geometry.maxX),py(999.5));ctx.stroke();building('center',220.5,986.5,229.5,995.5,say('CENTRO DE ALIANZA','ALLIANCE CENTRE'));building('mountain',218.5,971.5,234.5,986.5,say('MONTAÑA','MOUNTAIN'));building('building',displayedMarshall.x-1.5,displayedMarshall.y-1.5,displayedMarshall.x+1.5,displayedMarshall.y+1.5,'X:'+displayedMarshall.x+' Y:'+displayedMarshall.y);if(marshallDraft)text(say('VISTA PREVIA','PREVIEW'),px(displayedMarshall.x),py(displayedMarshall.y)-90,20,'#075f88');for(const s of slots){if(!s.name&&overlapsMarshall(s))continue;const active=s.id===selected?.id,misplaced=isMisplaced(s);box(s.x-1.5,s.y-1.5,s.x+1.5,s.y+1.5,misplaced?'#ffb5b5':isWellPlaced(s)?'#c9eed8':active?'#ffe17e':'#c4ecf5',misplaced?'#b51d35':isWellPlaced(s)?'#27845b':active?'#ba6f00':'#439ab5');drawBaseLabel(s,active);if(active){ctx.strokeStyle='#155d91';ctx.lineWidth=7;ctx.strokeRect(px(s.x-1.5)-5,py(s.y+1.5)-5,3*S+10,3*S+10);}}if(admin&&positionScan&&$('scan-show').checked){const wrong=[...positionResults.values()].filter(r=>['misplaced','manual-misplaced'].includes(r.status)).length;text(say('Rojo: mal colocado o marcado manualmente','Red: misplaced or manually marked')+' · '+wrong+' · '+say('Verde: posición correcta o confirmada','Green: correct or confirmed position')+' · '+say('Datos LWAtlas','LWAtlas data')+' '+String(positionScan.observed_at||'').replace('T',' ').replace(/\.\d+$/,''),W/2,H-130,23,'#8f2235');}text(say('Contorno aproximado · comprueba las posiciones en el juego','Approximate terrain · verify positions in game'),W/2,H-90,22);}
function show(s,focus=true){if(!s)return;selected=s;if(admin){$('selected').textContent=label(s);scanSelection(s);$('slot').value=s.id;$('player').value=s.name||''}else{document.body.classList.add('has-selection');$('copy').disabled=false;renderPublicSelection();}draw();if(focus){zoom=Math.max(zoom,.65);size();if(!admin)$('viewport').scrollIntoView({behavior:'smooth',block:'center'});centerSelected();}}
const recordedSearches=new Map();
async function recordSearch(s){
 if(admin||!s?.name)return;
 const key=norm(s.name),now=Date.now();
 if(now-(recordedSearches.get(key)||0)<30000)return;
 recordedSearches.set(key,now);
 try{const {error}=await sb.from('alliance_map_searches').insert({slot_id:s.id});if(error){recordedSearches.delete(key);console.warn('Map search could not be recorded',error.code)}}catch{recordedSearches.delete(key)}
}
function search(submit=false){
 const q=norm($('search').value);$('matches').replaceChildren();if(!q)return;
 const found=slots.filter(s=>s.name&&norm(s.name).includes(q));
 for(const s of found){const b=document.createElement('button');b.textContent=label(s);b.onclick=()=>{show(s);recordSearch(s)};$('matches').append(b)}
 if(!found.length)status(say('No hay coincidencias. Comprueba el nombre.','No matches. Check the name.'));
 else{status('');const exact=found.find(s=>norm(s.name)===q);if(exact||found.length===1){const s=exact||found[0];show(s);if(exact||submit)recordSearch(s)}}
}
async function loadSearchHistory(){
 if(!admin)return;
 const info=$('search-history-status');info.textContent='Cargando consultas…';
 try{
 const {data,error}=await sb.from('alliance_map_search_summary').select('player_name,searches,last_search').order('last_search',{ascending:false});
 if(error)throw error;
 $('search-history').replaceChildren();
 for(const item of data){const row=document.createElement('tr');for(const value of [item.player_name,item.searches,new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(item.last_search))]){const cell=document.createElement('td');cell.textContent=value;row.append(cell)}$('search-history').append(row)}
 info.textContent=data.length?`${data.length} nombres consultados · ${data.reduce((n,r)=>n+Number(r.searches),0)} consultas`:'Todavía no hay consultas registradas.';
 }catch{info.textContent='No se pudieron cargar las consultas. Pulsa Actualizar para reintentar.'}
}
async function refresh(){const {data,error}=await sb.from('alliance_map_config').select('slots,revision,marshall_x,marshall_y').eq('id',1).single();if(error)throw error;slots=data.slots;revision=data.revision;if(!admin&&selected){selected=slots.find(s=>s.name&&norm(s.name)===norm(selected.name))||null;if(!selected){document.body.classList.remove('has-selection');$('copy').disabled=true;$('selected').replaceChildren();}}marshall={x:data.marshall_x,y:data.marshall_y};marshallDraft=null;resizeMap();if(admin){$('marshall-x').value=marshall.x;$('marshall-y').value=marshall.y;}if(admin){$('slot').replaceChildren(...slots.map(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=label(s);return o}));compareScan();}draw();}
async function save(remove=false){if(busy)return;const target=slots.find(s=>s.id===Number($('slot').value)),name=$('player').value.trim();if(!remove&&!name){status('Escribe un nombre.');return}if(!confirm(remove?`¿Retirar a ${target.name||'este jugador'} del puesto ${target.id}?`:`¿Guardar ${name} en X${target.x} Y${target.y}? Si ya tiene puesto, se intercambiarán los jugadores.`))return;busy=true;$('assign').disabled=$('remove').disabled=true;const next=structuredClone(slots),dest=next.find(s=>s.id===target.id),source=next.find(s=>s.id!==target.id&&norm(s.name)===norm(name));if(source&&!remove)source.name=dest.name;dest.name=remove?null:name;try{const {data,error}=await sb.from('alliance_map_config').update({slots:next}).eq('id',1).eq('revision',revision).select('slots,revision').maybeSingle();if(error)throw error;if(!data){await refresh();throw Error('Otro administrador ha actualizado el mapa. Revisa el cambio y vuelve a guardar.')}slots=data.slots;revision=data.revision;await refresh();show(slots.find(s=>s.id===target.id),false);status('Guardado. El mapa público y las descargas ya incluyen el cambio.')}catch(e){status(e.message||'No se pudo guardar.')}finally{busy=false;$('assign').disabled=$('remove').disabled=false}}
$('language').onclick=()=>{lang=en()?'es':'en';translate()};$('search').oninput=admin?()=>search():null;$('find').onclick=()=>search(true);$('search').onkeydown=admin?e=>{if(e.key==='Enter')search(true)}:null;$('fit').onclick=fit;$('zoom-in').onclick=()=>{zoom=Math.min(2,zoom*1.3);size()};$('zoom-out').onclick=()=>{zoom=Math.max(.15,zoom/1.3);size()};canvas.onclick=e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;if(admin&&Math.abs(x-px(visibleMarshall().x))<1.5*S&&Math.abs(y-py(visibleMarshall().y))<1.5*S){$('marshall-editor').scrollIntoView({behavior:'smooth',block:'center'});$('marshall-x').focus();return}const s=slots.find(s=>Math.abs(x-px(s.x))<1.5*S&&Math.abs(y-py(s.y))<1.5*S);if(s)show(s,false);};
$('copy').onclick=async()=>{if(!selected)return status(say('Selecciona primero un puesto.','Select a position first.'));const coordinate=`${selected.name||say('Libre','Available')} — X:${selected.x} Y:${selected.y}`;try{await navigator.clipboard.writeText(coordinate);status(say(`Copiado: ${coordinate}`,`Copied: ${coordinate}`))}catch{status(say(`Copia este texto: ${coordinate}`,`Copy this text: ${coordinate}`))}};
$('download').onclick=async()=>{if(!slots.length)return;try{await refresh();if(!admin)await loadPublicPositionStatus()}catch{status(say('No se pudo comprobar la versión actual. Inténtalo de nuevo.','Could not check the latest version. Please retry.'));return}canvas.toBlob(blob=>{if(!blob)return status('No se pudo generar la descarga.');const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='HOLa-mapa-coordenadas-HD.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)},'image/png')};
async function init(){try{if(admin){const {data:{session}}=await sb.auth.getSession();if(!session){location.href='admin-login.html';return}const {data,error}=await sb.rpc('is_hola_r4_r5_admin');if(error||!data){status('Acceso reservado a R4/R5.');return}$('content').hidden=false;$('refresh-searches').onclick=loadSearchHistory;loadSearchHistory();$('marshall-save').onclick=saveMarshall;$('marshall-x').oninput=previewMarshall;$('marshall-y').oninput=previewMarshall;$('marshall-form').onsubmit=e=>{e.preventDefault();saveMarshall()};$('assign').onclick=()=>save();$('remove').onclick=()=>save(true);$('slot').onchange=()=>show(slots.find(s=>s.id===Number($('slot').value)));const {data:members}=await sb.from('players').select('name').order('name');if(members)$('members').replaceChildren(...members.map(p=>{const o=document.createElement('option');o.value=p.name;return o}))}await Promise.all(['center','mountain','building'].map(name=>new Promise(resolve=>{const im=new Image;im.onload=()=>{images[name]=im;resolve()};im.onerror=resolve;im.src=`assets/map/${name}.${name==='building'?'png':'jpg'}`})));await refresh();translate();fit();if(admin){setupPositionScan();await Promise.all([loadPositionScan(),loadPositionReviews()]);show(slots[0],false);}else{hiveSearch=initHiveSearch({input:$('search'),list:$('matches'),getSlots:()=>slots,norm,getLang:()=>lang,choose:s=>{show(s);recordSearch(s)},emptyLabel:()=>say('No se encontraron jugadores.','No players found.')});await loadPublicPositionStatus();}status('')}catch(e){status(say('No se pudo cargar el mapa. Recarga para intentarlo de nuevo.','Map could not load. Reload to try again.'));console.error(e)}}
let positionScan=null,positionResults=new Map(),positionReviews=[],reviewsLoaded=false;
const scanMargin=()=>Number($('scan-margin')?.value||10);
const placementState=s=>(admin||publicStatusRevision===revision)?positionResults.get(s.id)?.status:'unknown';
const isMisplaced=s=>(!admin||$('scan-show')?.checked)&&['misplaced','manual-misplaced'].includes(placementState(s));
const isWellPlaced=s=>['correct','verified'].includes(placementState(s));
function scanLabel(state){return ({'manual-misplaced':say('Mal colocado · marcado manualmente','Misplaced · manually marked'),verified:say('Verificado manualmente','Manually verified'),correct:say('Correcto','Correct'),misplaced:say('Mal colocado','Misplaced'),away:say('Lejos de la colmena · sin rojo','Away from hive · no red'),unknown:say('Sin datos fiables · sin rojo','No reliable data · no red'),'other-server':say('Otro servidor · sin rojo','Other server · no red')})[state];}
function scanSelection(s){
 if(!admin)return;reviewControls(s);const r=positionResults.get(s.id);if(!r)return;
 const actual=r.position?(' · '+say('Detectado','Detected')+' #'+r.position.server+' X'+r.position.x+' Y'+r.position.y):'';
 $('selected').textContent=label(s)+actual+' · '+scanLabel(r.status);
}
function compareScan(render=true){
 if(!admin)return;
 positionResults=applyPositionReviews(comparePositions(slots,positionScan?.positions||[],scanMargin()).results,positionReviews,positionScan?.queried_at||null);
 if(render)renderScan();
}
function renderScan(){
 if(!admin||!$('scan-report'))return;
 $('scan-title').textContent=say('Comprobar posiciones de la colmena','Check hive positions');
 $('scan-button').textContent=say('Consultar posiciones de HOLa','Check HOLa positions');
 $('scan-margin-label').textContent=say('Margen alrededor de los puestos','Margin around assigned positions');
 $('scan-show-label').textContent=say('Mostrar mal colocados en rojo','Show misplaced players in red');
 $('scan-help').textContent=say('Solo se marcan errores en el servidor 1834 dentro del área de los puestos asignados más el margen. Se compara el centro exacto de la base. Fuera de la zona, sin datos o en otro servidor: sin rojo automático. Puedes marcar cualquier jugador manualmente.','Only mismatches on server 1834 inside the assigned area plus the margin are marked. Exact base centres are compared. Outside the area, missing data or another server: no automatic red. You can manually mark any player.');
 $('scan-freshness').textContent=say('Datos del último escaneo de LWAtlas; no es un escaneo en tiempo real. LWAtlas anuncia su cierre para el 30 oct 2026.','Latest LWAtlas scan; not a live game scan. LWAtlas announces closure on 30 Oct 2026.');
 $('scan-report').replaceChildren();$('scan-counts').replaceChildren();
 if(!positionScan){$('scan-date').textContent=say('Todavía no se han consultado posiciones.','No positions checked yet.');if(selected)scanSelection(selected);draw();return;}
 const {bounds}=comparePositions(slots,positionScan.positions,scanMargin());
 const observed=String(positionScan.observed_at||say('no disponible','not available')).replace('T',' ').replace(/\.\d+$/,'');
 $('scan-date').textContent=say('Escaneo de la fuente: ','Source scan: ')+observed+' · '+say('Zona: ','Area: ')+(bounds?'X'+bounds.minX+'–'+bounds.maxX+' · Y'+bounds.minY+'–'+bounds.maxY:'—')+' · '+say('Las fechas de LWAtlas no indican zona horaria.','LWAtlas dates have no published timezone.');
 const values=[...positionResults.values()];
 for(const state of ['misplaced','manual-misplaced','correct','verified','away','other-server','unknown']){
  const n=values.filter(r=>r.status===state).length;if(!n&&state==='other-server')continue;
  const badge=document.createElement('span');badge.className='scan-count '+state;badge.textContent=n+' · '+scanLabel(state);$('scan-counts').append(badge);
 }
 const wrong=values.filter(r=>['misplaced','manual-misplaced'].includes(r.status));
 if(!wrong.length){const p=document.createElement('p');p.textContent=say('No hay jugadores marcados como mal colocados.','No players marked as misplaced.');$('scan-report').append(p);}
 function row(r){
  const b=document.createElement('button');b.type='button';b.className='scan-player '+r.status;
  b.textContent=r.slot.name+' · '+say('Asignado','Assigned')+' X'+r.slot.x+' Y'+r.slot.y+(r.position?' · '+say('Detectado','Detected')+' X'+r.position.x+' Y'+r.position.y:'')+(r.position?.observedAt?' · '+say('Observado','Observed')+' '+r.position.observedAt.replace('T',' ').replace(/\.\d+$/,''):'');
  b.onclick=()=>show(r.slot);return b;
 }
 wrong.forEach(r=>$('scan-report').append(row(r)));
 for(const state of ['verified','away','other-server','unknown']){
  const items=values.filter(r=>r.status===state);if(!items.length)continue;
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=items.length+' · '+scanLabel(state);details.append(summary);items.forEach(r=>details.append(row(r)));$('scan-report').append(details);
 }
 if(selected)scanSelection(selected);draw();
}
async function loadPositionScan(){
 if(!admin)return;
 try{const {data,error}=await sb.from('alliance_map_position_scan').select('positions,source,observed_at,queried_at').eq('id',1).single();if(error)throw error;positionScan=data.queried_at?data:null;compareScan();}
 catch(e){$('scan-status').textContent=say('No se pudo cargar la comprobación anterior. Puedes consultar de nuevo.','Previous check unavailable. You can run a new check.');}
}
async function scanPositions(){
 $('scan-button').disabled=true;$('scan-status').textContent=say('Consultando posiciones registradas en LWAtlas…','Reading recorded LWAtlas positions…');
 try{
  const {data,error}=await sb.functions.invoke('scan-alliance-positions',{body:{}});
  if(error){let message=error.message;if(error.context instanceof Response){const detail=await error.context.json().catch(()=>null);if(detail?.error)message=detail.error;}throw Error(message);}
  if(!Array.isArray(data?.scan?.positions))throw Error(say('Respuesta incompleta','Incomplete response'));
  positionScan=data.scan;await refresh();compareScan();
  $('scan-status').textContent=positionScan.positions.length+' '+say('jugadores consultados. Comparación actualizada.','players checked. Comparison updated.');
 }catch(e){$('scan-status').textContent=say('No se pudo comprobar: ','Check failed: ')+(e.message||e)+say('. Se conserva la comprobación anterior.','. Previous comparison kept.');}
 finally{$('scan-button').disabled=false;}
}
function setupPositionScan(){
 const value=localStorage.getItem('hola-map-scan-margin');if(['0','5','10','20','30'].includes(value))$('scan-margin').value=value;
 $('scan-button').onclick=scanPositions;
 $('position-verify').onclick=()=>savePositionReview(false);
 $('position-unverify').onclick=()=>savePositionReview(true);
 $('position-misplaced').onclick=()=>savePositionReview(false,'misplaced');
 $('scan-margin').onchange=()=>{localStorage.setItem('hola-map-scan-margin',$('scan-margin').value);compareScan();};
 $('scan-show').onchange=()=>draw();
 renderScan();
}

function reviewControls(s){
 if(!admin||!$('position-verify'))return;const r=s&&positionResults.get(s.id),verified=r?.status==='verified',manualMisplaced=r?.status==='manual-misplaced';
 $('position-verify').textContent=say('Marcar como bien colocado','Mark as correctly placed');$('position-unverify').textContent=say('Quitar marca manual','Remove manual mark');$('position-misplaced').textContent=say('Marcar como mal colocado','Mark as misplaced');
 $('position-misplaced').disabled=busy||!reviewsLoaded||!s?.name||manualMisplaced;
 $('position-verify').disabled=busy||!reviewsLoaded||!s?.name||verified;
 $('position-unverify').disabled=busy||!reviewsLoaded||!s?.name;$('position-unverify').hidden=!s?.name||!positionReviews.some(review=>review.player_name===s.name);
 $('position-review-state').textContent=(verified||manualMisplaced)?(manualMisplaced?say('Marcado manualmente como mal colocado: ','Manually marked as misplaced: '):say('Confirmado manualmente para este puesto: ','Manually confirmed for this position: '))+new Intl.DateTimeFormat(en()?'en-GB':'es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(r.review.verified_at)):say('Selecciona una base en este mapa para reorganizarla. Cuando compruebes su colocación en el juego, puedes confirmarla aquí.','Select a base on this map to reorganize it. After checking its position in game, confirm it here.');
}
async function loadPositionReviews(){
 try{const {data,error}=await sb.from('alliance_map_position_reviews').select('player_name,assigned_x,assigned_y,source_queried_at,verified_at,status').order('player_name');if(error)throw error;positionReviews=data||[];reviewsLoaded=true;compareScan();}
 catch(e){reviewsLoaded=false;$('position-review-status').textContent=say('No se pudieron cargar las confirmaciones. Recarga para reintentar.','Could not load confirmations. Reload to retry.');if(selected)reviewControls(selected);}
}
async function savePositionReview(remove,reviewStatus='correct'){
 if(busy||!reviewsLoaded||!selected?.name)return;const slot=slots.find(s=>s.id===selected.id);if(!slot?.name)return;
 busy=true;reviewControls(slot);$('assign').disabled=$('remove').disabled=true;$('position-review-status').textContent=say('Guardando confirmación…','Saving confirmation…');
 try{let result;if(remove){result=await sb.from('alliance_map_position_reviews').delete().eq('player_name',slot.name).select('player_name');}else{
  const {data:{session}}=await sb.auth.getSession();if(!session?.user)throw Error(say('Inicia sesión de nuevo.','Sign in again.'));
  result=await sb.from('alliance_map_position_reviews').upsert({player_name:slot.name,assigned_x:slot.x,assigned_y:slot.y,status:reviewStatus,source_queried_at:positionScan?.queried_at||null,verified_at:new Date().toISOString(),verified_by:session.user.id},{onConflict:'player_name'}).select('player_name');
 }if(result.error)throw result.error;if(!remove&&!result.data?.length)throw Error(say('No se confirmó el guardado.','Save was not confirmed.'));
 await refresh();await loadPositionReviews();show(slots.find(s=>s.id===slot.id),false);if(!reviewsLoaded){$('position-review-status').textContent=say('Guardado, pero no se pudieron recargar las confirmaciones. Recarga el mapa.','Saved, but confirmations could not be reloaded. Reload the map.');return;}$('position-review-status').textContent=remove?say('Marca manual retirada. Se vuelve a mostrar el resultado del escaneo.','Manual mark removed. The scan result is shown again.'):(reviewStatus==='misplaced'?say('Mal colocado: marcado en rojo y guardado para los administradores.','Misplaced: marked in red and saved for administrators.'):say('Bien colocado: confirmado y guardado para los administradores.','Correct placement confirmed and saved for administrators.'));
 }catch(e){$('position-review-status').textContent=say('No se pudo guardar: ','Could not save: ')+(e.message||e);}finally{busy=false;$('assign').disabled=$('remove').disabled=false;if(selected)reviewControls(selected);}
}

function translateMarshall(){
 if(!admin)return;
 $('marshall-title').textContent=say('Mover el Marshall','Move Marshall');
 $('marshall-help').textContent=say('Edita las coordenadas del centro del Marshall. Zona disponible: X180–270 · Y915–998. Puedes usar puestos libres. Pulsa Guardar posición del Marshall para publicar el cambio.','Edit Marshall’s centre coordinates. Available area: X180–270 · Y915–998. Empty positions can be used. Press Save Marshall position to publish the change.');
 $('marshall-save').textContent=say('Guardar posición del Marshall','Save Marshall position');
}
function marshallMessage(code){
 return ({integer:say('Introduce coordenadas enteras.','Enter whole-number coordinates.'),bounds:say('Usa X180–270 e Y915–998.','Use X180–270 and Y915–998.'),player:say('El Marshall se solapa con un jugador asignado. Elige un puesto libre.','Marshall overlaps an assigned player. Choose an empty position.'),terrain:say('El Marshall se solapa con el centro o la montaña. Elige una zona libre.','Marshall overlaps the centre or mountain. Choose a free area.')})[code];
}

function previewMarshall(){
 if(!admin||busy)return;
 const x=$('marshall-x').value.trim(),y=$('marshall-y').value.trim();
 const next={x:x===''?NaN:Number(x),y:y===''?NaN:Number(y)},error=marshallError(next,slots);
 marshallDraft=error||next.x===marshall.x&&next.y===marshall.y?null:next;
 resizeMap();draw();
 $('marshall-status').textContent=error?marshallMessage(error):marshallDraft?say('Vista previa en ','Preview at ')+'X'+next.x+' Y'+next.y+say('. Falta guardar para publicar el cambio.','. Save to publish the change.'):say('Posición guardada: ','Saved position: ')+'X'+marshall.x+' Y'+marshall.y;
}

async function saveMarshall(){
 if(!admin||busy)return;
 const rawX=$('marshall-x').value.trim(),rawY=$('marshall-y').value.trim();
 const next={x:rawX===''?NaN:Number(rawX),y:rawY===''?NaN:Number(rawY)},error=marshallError(next,slots),info=$('marshall-status');
 if(error){info.textContent=marshallMessage(error);return}
 if(next.x===marshall.x&&next.y===marshall.y){info.textContent=say('El Marshall ya está en esas coordenadas.','Marshall is already at these coordinates.');return}
 busy=true;$('marshall-save').disabled=$('assign').disabled=$('remove').disabled=true;
 info.textContent=say('Guardando posición…','Saving position…');
 try{
 const {data,error}=await sb.from('alliance_map_config').update({marshall_x:next.x,marshall_y:next.y}).eq('id',1).eq('revision',revision).select('revision').maybeSingle();
 if(error)throw error;
 if(!data){await refresh();throw Error(say('Otro administrador ha cambiado el mapa. Revisa las coordenadas y vuelve a guardar.','Another administrator changed the map. Review the coordinates and save again.'));}
 await refresh();fit();info.textContent=say('Marshall guardado en ','Marshall saved at ')+'X'+marshall.x+' Y'+marshall.y+say('. Ya aparece en el mapa público y en las descargas.','. The public map and downloads now use this position.');
 }catch(e){info.textContent=say('No se pudo guardar: ','Could not save: ')+(e.message||e)}
 finally{busy=false;$('marshall-save').disabled=$('assign').disabled=$('remove').disabled=false;}
}

function translatePublicHive(){
 $('title').textContent=say('Colmena','Hive');
 $('search-label').textContent=say('Encuentra tu puesto','Find your position');
 $('search').placeholder=say('Busca tu nombre…','Search your name…');
 $('matches').setAttribute('aria-label',say('Jugadores de la colmena','Hive players'));
 $('copy').textContent=say('Copiar','Copy');$('copy').setAttribute('aria-label',say('Copiar nombre y coordenadas','Copy name and coordinates'));
 $('download').textContent=say('Mapa HD','HD map');$('download').setAttribute('aria-label',say('Descargar mapa HD','Download HD map'));
 $('fit').textContent='⌖';$('fit').setAttribute('aria-label',say('Ver todo el mapa','Fit entire map'));$('fit').title=say('Ver todo el mapa','Fit entire map');
 $('zoom-in').setAttribute('aria-label',say('Acercar','Zoom in'));$('zoom-out').setAttribute('aria-label',say('Alejar','Zoom out'));
 $('map-hint').textContent=say('Elige tu nombre para ir directamente a tu posición.','Choose your name to go directly to your position.');
 $('legend-correct').textContent=say('Bien colocado','Correct position');$('legend-wrong').textContent=say('Revisar posición','Check position');$('legend-unknown').textContent=say('Sin confirmar','Unconfirmed');
 renderPublicStatusDate();if(selected)renderPublicSelection();
}
function renderPublicSelection(){
 if(admin||!selected)return;
 const name=document.createElement('strong');name.className='hive-selected-name';name.textContent=selected.name||say('Libre','Available');
 const coords=document.createElement('span');coords.className='hive-selected-coords';coords.textContent='X'+selected.x+' · Y'+selected.y;
 const state=placementState(selected)||'unknown',badge=document.createElement('span');badge.className='hive-selected-state '+state;
 badge.textContent=state==='correct'?say('Bien colocado','Correct position'):state==='verified'?say('Confirmado','Confirmed'):['misplaced','manual-misplaced'].includes(state)?say('Revisar posición','Check position'):say('Sin confirmar','Unconfirmed');
 $('selected').replaceChildren(name,coords,badge);
}
function renderPublicStatusDate(){
 if(admin)return;
 const el=$('public-scan-date');
 if(publicStatusState==='loading'){el.textContent=say('Cargando estado de las posiciones…','Loading placement status…');return}
 if(publicStatusState==='error'){el.textContent=say('No se pudo cargar el estado. Los puestos quedan sin confirmar; recarga para reintentar.','Placement status unavailable. Positions remain unconfirmed; reload to retry.');return}
 const date=publicStatusQueriedAt&&new Date(publicStatusQueriedAt);
 el.textContent=(date&&Number.isFinite(date.getTime())?say('Última consulta: ','Last check: ')+new Intl.DateTimeFormat(en()?'en-GB':'es-ES',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Madrid'}).format(date):say('Sin consulta guardada.','No saved check.'))+' · '+say('Datos guardados, no en tiempo real.','Saved data, not live.');
}
async function loadPublicPositionStatus(retry=true){
 if(admin)return;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
 const margin=Math.max(0,Math.min(50,Number(localStorage.getItem('hola-map-scan-margin')||10)));
 const response=await fetch('https://ovybstpiomphrouvqxmf.supabase.co/functions/v1/public-hive-status?margin='+margin,{headers:{apikey:'sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV'},signal:controller.signal,cache:'no-store'});
 if(!response.ok)throw Error('Placement status unavailable');
 const data=await response.json();
 if(!Array.isArray(data.statuses))throw Error('Invalid placement status');
 if(data.revision!==revision){if(retry){await refresh();return await loadPublicPositionStatus(false)}throw Error('Map changed');}
 const allowed=new Set(['correct','verified','misplaced','manual-misplaced','away','other-server','unknown']);
 positionResults=new Map(data.statuses.filter(r=>allowed.has(r.status)&&slots.some(s=>s.id===r.slot_id)).map(r=>[r.slot_id,{status:r.status}]));
 publicStatusRevision=data.revision;publicStatusQueriedAt=data.queried_at;publicStatusState='ready';
 }catch{publicStatusRevision=null;publicStatusState='error'}
 finally{clearTimeout(timer);renderPublicStatusDate();if(selected)renderPublicSelection();draw();}
}

init();

