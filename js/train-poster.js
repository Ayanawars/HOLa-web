// Deterministic 9:16 poster using the selected week's real driver records.
export function posterDrivers(schedule){
  return [...(schedule?.days||[])].sort((a,b)=>a.day-b.day).map(item=>({
    day:item.day,date:item.date,name:String(item.actual||item.planned||'').trim(),
    confirmed:!!item.actual,source:item.source
  }));
}
const playerKey=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function posterAward(schedule,entry,lang='es'){
  const es=lang==='es',say=(a,b)=>es?a:b,save=schedule.weekType==='save';
  const category=({VS:'VS '+(save?'SAVE':'PUSH'),DS_B:'DESERT STORM B',DS_A:'DESERT STORM A',DONATIONS:say('DONACIONES','DONATIONS')})[entry.source]||entry.source;
  const rows=({VS:schedule.vsRanking,DS_B:schedule.teamB,DS_A:schedule.teamA,DONATIONS:schedule.donationRanking})[entry.source]
    ||schedule.days.find(day=>day.source===entry.source)?.rankedSource||[];
  const row=rows.find(row=>playerKey(row.player_name)===playerKey(entry.name));
  const raw=entry.source==='VS'?(save?row?.saveTotal:row?.total):row?.points;
  const score=raw!==null&&raw!==undefined&&raw!==''&&Number.isFinite(Number(raw))?(Number(raw)/1000000).toFixed(2)+'M':null;
  const item=schedule.days.find(day=>day.day===entry.day);
  const replacement=!!item?.actual&&playerKey(item.actual)!==playerKey(item.planned);
  const reason=!entry.name?say('PENDIENTE DE ASIGNAR','TO BE ASSIGNED'):replacement
    ?say('SUSTITUCIÓN CONFIRMADA','CONFIRMED REPLACEMENT')
    :!score?say('SIN PUNTUACIÓN REGISTRADA','NO RECORDED SCORE')
    :entry.source==='VS'?(save?say('MÁS CERCA DEL OBJETIVO LUN–JUE','CLOSEST TO MON–THU TARGET'):say('MAYOR TOTAL VS DISPONIBLE','HIGHEST AVAILABLE VS TOTAL'))
    :entry.source==='DONATIONS'?say('MAYOR DONACIÓN DISPONIBLE · CUMPLE VS','HIGHEST AVAILABLE DONATION · VS QUALIFIED')
    :say('MAYOR PUNTUACIÓN DS DISPONIBLE','HIGHEST AVAILABLE DS SCORE');
  return {badge:category+(score?' · '+(entry.source==='VS'&&save?say('L–J: ','M–TH: '):'')+score:''),reason,
    status:entry.confirmed?say('CONFIRMADO','CONFIRMED'):say('PLANIFICADO','PLANNED')};
}
async function bounded(task,timeoutMs=12000){
  let timer;try{return await Promise.race([task,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),timeoutMs)})])}finally{clearTimeout(timer)}
}
function loadImage(src){
  return new Promise(resolve=>{
    if(!src)return resolve(null);
    const image=new Image();let timer;
    const finish=value=>{clearTimeout(timer);image.onload=null;image.onerror=null;resolve(value)};
    image.onload=()=>finish(image);image.onerror=()=>finish(null);
    timer=setTimeout(()=>finish(null),12000);image.crossOrigin='anonymous';image.src=src;
  });
}
export function renderTrainPoster(schedule,{lang='es',avatars=new Map(),logo=null,header=null,createCanvas=()=>document.createElement('canvas')}={}){
  const canvas=createCanvas();canvas.width=1080;canvas.height=1920;
  const c=canvas.getContext('2d');if(!c)throw Error('Canvas unavailable');
  const es=lang==='es',say=(a,b)=>es?a:b;
  const days=es?['','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO','DOMINGO']:['','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
  const date=value=>new Intl.DateTimeFormat(es?'es-ES':'en-GB',{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
  const font=(size,bold=true)=>`${bold?700:500} ${size}px Arial, sans-serif`;
  const fit=(text,width,size,min=23)=>{while(size>min){c.font=font(size);if(c.measureText(text).width<=width)break;size--}c.font=font(size);return size};
  const cover=(image,x,y,w,h)=>{const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height,scale=Math.max(w/iw,h/ih),sw=w/scale,sh=h/scale;c.drawImage(image,(iw-sw)/2,(ih-sh)/2,sw,sh,x,y,w,h)};
  const background=c.createLinearGradient(0,0,1080,1920);background.addColorStop(0,'#e3f3f6');background.addColorStop(.3,'#fff9eb');background.addColorStop(1,'#efdcaf');c.fillStyle=background;c.fillRect(0,0,1080,1920);
  c.strokeStyle='#cba64c';c.lineWidth=3;c.strokeRect(22,22,1036,1876);
  if(header){cover(header,24,24,1032,260);c.fillStyle='rgba(255,250,235,.82)';c.fillRect(24,24,1032,260)}
  c.textBaseline='top';c.textAlign='left';
  if(logo)c.drawImage(logo,55,48,155,108);
  c.fillStyle='#163f59';c.font=font(62);c.fillText(say('TREN DE HOLa','HOLa TRAIN'),logo?230:60,64);
  c.font=font(28,false);c.fillText('Heroes of Last Area',logo?232:62,143);
  c.font=font(36);c.textAlign='center';c.fillText(date(schedule.week)+' - '+date(schedule.weekEnd),540,210);
  const entries=posterDrivers(schedule),margin=48,rowHeight=192,gap=14,start=300;
  const colors=['#2083a7','#2691a5','#36779a','#368e9d','#447aaa','#a98237','#9b7530'];
  for(const [i,entry] of entries.entries()){
    const y=start+i*(rowHeight+gap),accent=colors[(entry.day-1)%7];
    c.fillStyle='#fffdf6';c.strokeStyle='#d0b579';c.lineWidth=2;c.beginPath();c.roundRect(margin,y,984,rowHeight,24);c.fill();c.stroke();
    c.fillStyle=accent;c.beginPath();c.roundRect(margin,y,18,rowHeight,9);c.fill();
    c.save();c.beginPath();c.arc(150,y+96,63,0,Math.PI*2);c.clip();c.fillStyle='#d4eaf2';c.fillRect(87,y+33,126,126);
    const image=avatars.get(entry.name);
    if(image)cover(image,87,y+33,126,126);else{c.fillStyle='#23647f';c.font=font(40);c.textAlign='center';c.fillText(entry.name?[...entry.name].slice(0,2).join('').toUpperCase():'?',150,y+72)}
    c.restore();c.strokeStyle='#c99e44';c.lineWidth=4;c.beginPath();c.arc(150,y+96,66,0,Math.PI*2);c.stroke();
    c.textAlign='left';c.fillStyle=accent;c.font=font(27);c.fillText(days[entry.day]+' - '+date(entry.date),245,y+21);
    const name=entry.name||say('Pendiente de asignar','To be assigned');
    c.fillStyle='#163f59';fit(name,738,42);c.fillText(name,245,y+60,738);
    const award=posterAward(schedule,entry,lang);
    const badgeColor=entry.source==='DONATIONS'?'#227553':entry.source==='DS_A'||entry.source==='DS_B'?'#405f96':'#087f9d';
    c.fillStyle=badgeColor;c.beginPath();c.roundRect(245,y+112,758,39,10);c.fill();
    c.fillStyle='#ffffff';fit(award.badge,728,27,20);c.fillText(award.badge,260,y+119,728);
    const detail=award.reason+' · '+award.status;
    c.fillStyle='#244d62';fit(detail,758,19,15);c.fillText(detail,245,y+163,758);
  }
  c.textAlign='center';c.fillStyle='#173f58';c.font=font(29);c.fillText(say('Dona 3 tickets antes de la salida.','Donate 3 tickets before departure.'),540,1770);
  c.font=font(24,false);c.fillText(say('Suplentes y normas en el correo semanal.','Substitutes and rules in the weekly mail.'),540,1816);
  c.fillStyle='#7f6b3c';c.font=font(21,false);c.fillText('ayanawars.github.io/HOLa-web',540,1860);
  return canvas;
}
export function mountTrainPoster({sb,getSchedule,getLanguage}){
  const $=id=>document.getElementById(id);let version=0,url=null,busy=false;
  const reset=()=>{version++;if(url){URL.revokeObjectURL(url);url=null}$('trainPosterPreview').removeAttribute('src');$('trainPosterPreview').hidden=true;$('downloadTrainPoster').disabled=true;$('generateTrainPoster').disabled=!getSchedule()||busy;$('trainPosterStatus').textContent=''};
  $('generateTrainPoster').addEventListener('click',async()=>{
    const current=getSchedule();if(!current||busy)return;
    const snapshot=JSON.parse(JSON.stringify(current)),lang=getLanguage(),request=++version;busy=true;$('generateTrainPoster').disabled=true;
    $('trainPosterStatus').textContent='Generando imagen y cargando los avatares...';
    try{
      const entries=posterDrivers(snapshot),names=[...new Set(entries.map(x=>x.name).filter(Boolean))];
      const [avatarEntries,logo,header]=await Promise.all([
        Promise.all(names.map(async name=>{
          try{const {data,error}=await bounded(sb.from('players').select('avatar').eq('name',name).maybeSingle());if(error)throw error;return [name,await loadImage(data?.avatar)]}catch{return [name,null]}
        })),loadImage('assets/logo-hola.webp'),loadImage('assets/header-egipto.webp')
      ]);
      if(request!==version)return;
      const avatars=new Map(avatarEntries),canvas=renderTrainPoster(snapshot,{lang,avatars,logo,header});
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('PNG export failed')),'image/png'));
      if(request!==version)return;
      if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);
      $('trainPosterPreview').src=url;$('trainPosterPreview').hidden=false;$('downloadTrainPoster').disabled=false;
      $('downloadTrainPoster').dataset.filename='HOLa-tren-'+snapshot.week+'-'+lang+'.png';
      const missing=avatarEntries.filter(([,image])=>!image).length;
      $('trainPosterStatus').textContent='Imagen lista: 1080 × 1920 (9:16).'+(missing?' '+missing+' avatares no disponibles; se muestran iniciales.':'');
    }catch{$('trainPosterStatus').textContent='No se pudo generar la imagen. Pulsa Generar imagen para intentarlo de nuevo.'}
    finally{busy=false;$('generateTrainPoster').disabled=!getSchedule()}
  });
  $('downloadTrainPoster').addEventListener('click',()=>{if(!url)return;const a=document.createElement('a');a.href=url;a.download=$('downloadTrainPoster').dataset.filename;document.body.append(a);a.click();a.remove()});
  reset();return {reset};
}
