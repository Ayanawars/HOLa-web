import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {comparePositions} from './map-position-compare.js?v=20261010-1';
const sb=createClient('https://ovybstpiomphrouvqxmf.supabase.co','sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV');
const $=id=>document.getElementById(id),admin=document.body.classList.contains('admin');
let slots=[],revision,selected=null,zoom=1,busy=false,lang=localStorage.getItem('hola-language')||'es';
const norm=s=>(s||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const en=()=>lang!=='es',say=(es,english)=>en()?english:es;
const canvas=$('map'),ctx=canvas.getContext('2d'),W=3200,H=2400,S=48,L=140,T=150;
canvas.width=W*2;canvas.height=H*2;ctx.scale(2,2);
const px=x=>L+(x-193)*S,py=y=>T+(1000-y)*S;
const images={};
function status(s){$('status').textContent=s}
function label(s){return `${String(s.id).padStart(3,'0')} · ${s.name||say('Libre','Available')} · X${s.x} Y${s.y}`}
function translate(){document.documentElement.lang=en()?'en':'es';$('title').textContent=admin?say('Organización del mapa','Map administration'):say('Mapa de la alianza','Alliance map');$('intro').textContent=say('Encuentra tu nombre y consulta las coordenadas del centro de tu base.','Find your name and the coordinates of your base centre.');$('search-label').textContent=say('Nombre del jugador','Player name');$('search').placeholder=say('Escribe tu nombre','Type your name');for(const [id,a,b] of [['find','Buscar','Search'],['copy','Copiar nombre y coordenadas','Copy name and coordinates'],['download','Descargar mapa HD','Download HD map'],['fit','Ver todo','Fit map']])$(id).textContent=say(a,b);$('language').textContent=en()?'Español':'English';$('map-hint').textContent=say('Desliza para recorrer el mapa. Bases de 3 × 3 casillas. Coordenadas del centro. Límite Y999.','Scroll to explore. Bases occupy 3 × 3 cells. Centre coordinates. Upper limit Y999.');$('terrain-note').textContent=say('Contorno aproximado: comprueba la colocación en el juego.','Approximate terrain outline: verify placement in game.');if(selected)show(selected,false);if(admin)renderScan();draw();}
function fit(){zoom=Math.min($('viewport').clientWidth/W,$('viewport').clientHeight/H,1);size();$('viewport').scrollTo({left:0,top:0})}
function size(){canvas.style.width=W*zoom+'px';canvas.style.height=H*zoom+'px'}
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

function draw(){ctx.fillStyle='#d4b477';ctx.fillRect(0,0,W,H);text('HOLa · '+say('MAPA DE LA ALIANZA','ALLIANCE MAP'),W/2,55,38);text(say('Nombre · coordenadas del centro · bases 3 × 3','Name · centre coordinates · 3 × 3 bases'),W/2,95,21);ctx.strokeStyle='#a58c61';ctx.lineWidth=1;for(let x=193;x<=256;x++){ctx.beginPath();ctx.moveTo(px(x-.5),py(999.5));ctx.lineTo(px(x-.5),py(956.5));ctx.stroke();if((x-195)%5===0)text(x,px(x),132,18)}for(let y=957;y<=1000;y++){ctx.beginPath();ctx.moveTo(px(192.5),py(y-.5));ctx.lineTo(px(256),py(y-.5));ctx.stroke();if(y%5===0)text(y,75,py(y)+6,18)}ctx.strokeStyle='#655132';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px(192.5),py(999.5));ctx.lineTo(px(256),py(999.5));ctx.stroke();building('center',220.5,986.5,229.5,995.5,say('CENTRO DE ALIANZA','ALLIANCE CENTRE'));building('mountain',218.5,971.5,234.5,986.5,say('MONTAÑA','MOUNTAIN'));building('building',193.5,957.5,196.5,960.5,'X:195 Y:959');for(const s of slots){const active=s.id===selected?.id,misplaced=isMisplaced(s);box(s.x-1.5,s.y-1.5,s.x+1.5,s.y+1.5,misplaced?'#ffb5b5':active?'#ffe17e':'#c4ecf5',misplaced?'#b51d35':active?'#ba6f00':'#439ab5');drawBaseLabel(s,active);}if(admin&&positionScan&&$('scan-show').checked){const wrong=[...positionResults.values()].filter(r=>r.status==='misplaced').length;text(say('Rojo: posición distinta cerca de la colmena','Red: misplaced near hive')+' · '+wrong+' · '+say('Datos LWAtlas','LWAtlas data')+' '+String(positionScan.observed_at||'').replace('T',' ').replace(/\.\d+$/,''),W/2,H-130,23,'#8f2235');}text(say('Contorno aproximado · comprueba las posiciones en el juego','Approximate terrain · verify positions in game'),W/2,H-90,22);}
function show(s,focus=true){selected=s;$('selected').textContent=label(s);scanSelection(s);if(admin){$('slot').value=s.id;$('player').value=s.name||''}draw();if(focus){zoom=Math.max(zoom,.65);size();$('viewport').scrollTo({left:px(s.x)*zoom-$('viewport').clientWidth/2,top:py(s.y)*zoom-$('viewport').clientHeight/2,behavior:'smooth'})}}
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
async function refresh(){const {data,error}=await sb.from('alliance_map_config').select('slots,revision').eq('id',1).single();if(error)throw error;slots=data.slots;revision=data.revision;if(admin){$('slot').replaceChildren(...slots.map(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=label(s);return o}));compareScan();}draw();}
async function save(remove=false){if(busy)return;const target=slots.find(s=>s.id===Number($('slot').value)),name=$('player').value.trim();if(!remove&&!name){status('Escribe un nombre.');return}if(!confirm(remove?`¿Retirar a ${target.name||'este jugador'} del puesto ${target.id}?`:`¿Guardar ${name} en X${target.x} Y${target.y}? Si ya tiene puesto, se intercambiarán los jugadores.`))return;busy=true;$('assign').disabled=$('remove').disabled=true;const next=structuredClone(slots),dest=next.find(s=>s.id===target.id),source=next.find(s=>s.id!==target.id&&norm(s.name)===norm(name));if(source&&!remove)source.name=dest.name;dest.name=remove?null:name;try{const {data,error}=await sb.from('alliance_map_config').update({slots:next}).eq('id',1).eq('revision',revision).select('slots,revision').maybeSingle();if(error)throw error;if(!data){await refresh();throw Error('Otro administrador ha actualizado el mapa. Revisa el cambio y vuelve a guardar.')}slots=data.slots;revision=data.revision;await refresh();show(slots.find(s=>s.id===target.id),false);status('Guardado. El mapa público y las descargas ya incluyen el cambio.')}catch(e){status(e.message||'No se pudo guardar.')}finally{busy=false;$('assign').disabled=$('remove').disabled=false}}
$('language').onclick=()=>{lang=en()?'es':'en';translate()};$('search').oninput=()=>search();$('find').onclick=()=>search(true);$('search').onkeydown=e=>{if(e.key==='Enter')search(true)};$('fit').onclick=fit;$('zoom-in').onclick=()=>{zoom=Math.min(2,zoom*1.3);size()};$('zoom-out').onclick=()=>{zoom=Math.max(.15,zoom/1.3);size()};canvas.onclick=e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;const s=slots.find(s=>Math.abs(x-px(s.x))<1.5*S&&Math.abs(y-py(s.y))<1.5*S);if(s)show(s,false)};
$('copy').onclick=async()=>{if(!selected)return status(say('Selecciona primero un puesto.','Select a position first.'));const coordinate=`${selected.name||say('Libre','Available')} — X:${selected.x} Y:${selected.y}`;try{await navigator.clipboard.writeText(coordinate);status(say(`Copiado: ${coordinate}`,`Copied: ${coordinate}`))}catch{status(say(`Copia este texto: ${coordinate}`,`Copy this text: ${coordinate}`))}};
$('download').onclick=async()=>{if(!slots.length)return;try{await refresh()}catch{status(say('No se pudo comprobar la versión actual. Inténtalo de nuevo.','Could not check the latest version. Please retry.'));return}canvas.toBlob(blob=>{if(!blob)return status('No se pudo generar la descarga.');const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='HOLa-mapa-coordenadas-HD.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)},'image/png')};
async function init(){try{if(admin){const {data:{session}}=await sb.auth.getSession();if(!session){location.href='admin-login.html';return}const {data,error}=await sb.rpc('is_hola_r4_r5_admin');if(error||!data){status('Acceso reservado a R4/R5.');return}$('content').hidden=false;$('refresh-searches').onclick=loadSearchHistory;loadSearchHistory();$('assign').onclick=()=>save();$('remove').onclick=()=>save(true);$('slot').onchange=()=>show(slots.find(s=>s.id===Number($('slot').value)));const {data:members}=await sb.from('players').select('name').order('name');if(members)$('members').replaceChildren(...members.map(p=>{const o=document.createElement('option');o.value=p.name;return o}))}await Promise.all(['center','mountain','building'].map(name=>new Promise(resolve=>{const im=new Image;im.onload=()=>{images[name]=im;resolve()};im.onerror=resolve;im.src=`assets/map/${name}.${name==='building'?'png':'jpg'}`})));await refresh();translate();fit();if(admin){setupPositionScan();await loadPositionScan();show(slots[0],false);}status('')}catch(e){status(say('No se pudo cargar el mapa. Recarga para intentarlo de nuevo.','Map could not load. Reload to try again.'));console.error(e)}}
let positionScan=null,positionResults=new Map();
const scanMargin=()=>Number($('scan-margin')?.value||10);
const isMisplaced=s=>admin&&$('scan-show')?.checked&&positionResults.get(s.id)?.status==='misplaced';
function scanLabel(state){return ({correct:say('Correcto','Correct'),misplaced:say('Mal colocado','Misplaced'),away:say('Lejos de la colmena · sin rojo','Away from hive · no red'),unknown:say('Sin datos fiables · sin rojo','No reliable data · no red'),'other-server':say('Otro servidor · sin rojo','Other server · no red')})[state];}
function scanSelection(s){
 const r=positionResults.get(s.id);if(!admin||!r)return;
 const actual=r.position?(' · '+say('Detectado','Detected')+' #'+r.position.server+' X'+r.position.x+' Y'+r.position.y):'';
 $('selected').textContent=label(s)+actual+' · '+scanLabel(r.status);
}
function compareScan(render=true){
 if(!admin)return;
 positionResults=positionScan?comparePositions(slots,positionScan.positions,scanMargin()).results:new Map();
 if(render)renderScan();
}
function renderScan(){
 if(!admin||!$('scan-report'))return;
 $('scan-title').textContent=say('Comprobar posiciones de la colmena','Check hive positions');
 $('scan-button').textContent=say('Consultar posiciones de HOLa','Check HOLa positions');
 $('scan-margin-label').textContent=say('Margen alrededor de los puestos','Margin around assigned positions');
 $('scan-show-label').textContent=say('Mostrar mal colocados en rojo','Show misplaced players in red');
 $('scan-help').textContent=say('Solo se marcan errores en el servidor 1834 dentro del área de los puestos asignados más el margen. Se compara el centro exacto de la base. Fuera de la zona, sin datos o en otro servidor: sin rojo.','Only mismatches on server 1834 inside the assigned area plus the margin are marked. Exact base centres are compared. Outside the area, missing data or another server: no red.');
 $('scan-freshness').textContent=say('Datos del último escaneo de LWAtlas; no es un escaneo en tiempo real. LWAtlas anuncia su cierre para el 30 oct 2026.','Latest LWAtlas scan; not a live game scan. LWAtlas announces closure on 30 Oct 2026.');
 $('scan-report').replaceChildren();$('scan-counts').replaceChildren();
 if(!positionScan){$('scan-date').textContent=say('Todavía no se han consultado posiciones.','No positions checked yet.');draw();return;}
 const {bounds}=comparePositions(slots,positionScan.positions,scanMargin());
 const observed=String(positionScan.observed_at||say('no disponible','not available')).replace('T',' ').replace(/\.\d+$/,'');
 $('scan-date').textContent=say('Escaneo de la fuente: ','Source scan: ')+observed+' · '+say('Zona: ','Area: ')+(bounds?'X'+bounds.minX+'–'+bounds.maxX+' · Y'+bounds.minY+'–'+bounds.maxY:'—')+' · '+say('Las fechas de LWAtlas no indican zona horaria.','LWAtlas dates have no published timezone.');
 const values=[...positionResults.values()];
 for(const state of ['misplaced','correct','away','other-server','unknown']){
  const n=values.filter(r=>r.status===state).length;if(!n&&state==='other-server')continue;
  const badge=document.createElement('span');badge.className='scan-count '+state;badge.textContent=n+' · '+scanLabel(state);$('scan-counts').append(badge);
 }
 const wrong=values.filter(r=>r.status==='misplaced');
 if(!wrong.length){const p=document.createElement('p');p.textContent=say('No hay posiciones incorrectas detectadas cerca de la colmena.','No misplaced positions detected near the hive.');$('scan-report').append(p);}
 function row(r){
  const b=document.createElement('button');b.type='button';b.className='scan-player '+r.status;
  b.textContent=r.slot.name+' · '+say('Asignado','Assigned')+' X'+r.slot.x+' Y'+r.slot.y+(r.position?' · '+say('Detectado','Detected')+' X'+r.position.x+' Y'+r.position.y:'')+(r.position?.observedAt?' · '+say('Observado','Observed')+' '+r.position.observedAt.replace('T',' ').replace(/\.\d+$/,''):'');
  b.onclick=()=>show(r.slot);return b;
 }
 wrong.forEach(r=>$('scan-report').append(row(r)));
 for(const state of ['away','other-server','unknown']){
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
 $('scan-margin').onchange=()=>{localStorage.setItem('hola-map-scan-margin',$('scan-margin').value);compareScan();};
 $('scan-show').onchange=()=>draw();
 renderScan();
}

init();
