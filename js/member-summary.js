const copy = {
 es:['Resumen de miembros','Selecciona jugadores o pega una lista de nombres.','Buscar en la lista…','Seleccionar visibles','Limpiar selección','Pegar lista de nombres','Separados por comas, punto y coma o saltos de línea.','Seleccionar lista','Generar resumen','Copiar resumen','Seleccionados','Sin resultados','No encontrados o ambiguos','Cargando fichas…','No se pudo generar el resumen','Copiado','Selecciona el texto para copiarlo','Pendiente','Sí','No','Profesión','País / bandera','Encuesta','Completada','Escuadra','Miembros','THP total conocido','THP informado','HQ informado','T10 confirmado','Última actualización','No se pudieron cargar estas fichas'],
 en:['Member summary','Select players or paste a list of names.','Search the list…','Select visible','Clear selection','Paste names','Separate names with commas, semicolons or new lines.','Select list','Generate summary','Copy summary','Selected','No results','Not found or ambiguous','Loading profiles…','Could not generate the summary','Copied','Select the text to copy it','Pending','Yes','No','Profession','Country / flag','Survey','Completed','Squad','Members','Known total THP','THP reported','HQ reported','T10 confirmed','Last update','These profiles could not be loaded']
};
export const summaryKey=value=>String(value??'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f\u0640ᓚᘏᗢ]/g,'').replace(/[^\p{L}\p{N}]+/gu,'');
export function resolveSummaryNames(text,players){
 const names=String(text||'').split(/[,;\n\r]+/).map(x=>x.trim()).filter(Boolean),found=new Set(),missing=[];
 for(const name of names){const exact=players.filter(p=>p.name===name),matches=exact.length?exact:players.filter(p=>summaryKey(p.name)===summaryKey(name));if(matches.length===1)found.add(matches[0].name);else missing.push(name);}
 return {names:[...found],missing:[...new Set(missing)]};
}
export function summaryPower(raw){
 const match=String(raw??'').trim().replace(/\s/g,'').match(/^(\d+(?:[.,]\d+)?)([mkb])?$/i);
 if(!match)return null;const value=Number(match[1].replace(',','.'));
 return Number.isFinite(value)&&value>=0?value*({m:1,k:.001,b:1000}[match[2]?.toLowerCase()]??1):null;
}
export function buildMemberSummary(rows,lang='es'){
 const w=copy[lang]||copy.en,locale=lang==='es'?'es-ES':'en-GB',pending=w[17],num=n=>new Intl.NumberFormat(locale,{minimumFractionDigits:1,maximumFractionDigits:1}).format(n),boolean=v=>v===true?w[18]:v===false?w[19]:pending;
 const label=value=>String(value??'').trim()||pending;
 const type=value=>lang==='es'?({Tank:'Tanque',Aircraft:'Aéreo',Missile:'Misil',Engineer:'Ingeniero',Warlord:'Señor de la guerra'}[value]||value):value;
 const power=value=>{const n=summaryPower(value);return n==null?label(value):num(n)+'M';};
 const values=rows.map(p=>summaryPower(p.thp)).filter(n=>n!=null),total=values.reduce((sum,n)=>sum+n,0),hq=rows.filter(p=>Number(p.hq_level)>0).length,t10=rows.filter(p=>p.t10===true).length;
 const stats=[`${w[25]}: ${rows.length}`,`${w[26]}: ${values.length?num(total)+'M':pending} (${values.length}/${rows.length})`,`${w[28]}: ${hq}/${rows.length}`,`${w[29]}: ${t10}/${rows.length}`];
 const cards=rows.map(p=>({name:p.name,avatar:String(p.avatar||'').trim(),fields:[
  ['HQ',Number(p.hq_level)>0?String(p.hq_level):pending],['THP',power(p.thp)],['T10',boolean(p.t10)],['Overlord',boolean(p.supreme_lord_unlocked)],
  [w[20],label(type(p.profession))],['Rango',label(p.rank)],[w[21],label(p.country||p.flag)],[w[22],p.survey_completed===true?w[23]:pending],
  ...[1,2,3].map(i=>[`${w[24]} ${i}`,[type(p[`squad${i}_type`]),p[`squad${i}_power`]?power(p[`squad${i}_power`]):''].filter(Boolean).join(' · ')||pending])
 ]}));
 if(lang!=='es')for(const card of cards)card.fields.find(f=>f[0]==='Rango')[0]='Rank';
 return {stats,cards,text:['HOLa · '+w[0],stats.join('\n'),...cards.map(card=>[card.name,...card.fields.map(([key,value])=>`${key}: ${value}`)].join('\n'))].join('\n\n')};
}
// Each PNG holds at most twelve profiles, keeping text readable on phones.
export function loadSummaryAvatars(cards,{createImage=()=>new Image(),timeoutMs=12000}={}){
 return Promise.all(cards.map(card=>new Promise(resolve=>{
  if(!card.avatar)return resolve([card.name,null]);const img=createImage();let done=false;
  const finish=value=>{if(done)return;done=true;clearTimeout(timer);img.onload=null;img.onerror=null;resolve([card.name,value]);};
  const timer=setTimeout(()=>finish(null),timeoutMs);img.onload=()=>finish(img);img.onerror=()=>finish(null);img.crossOrigin='anonymous';img.src=card.avatar;
 }))).then(entries=>new Map(entries));
}
export function renderSummaryImage(result,{page=0,lang='es',date=new Date(),avatars=new Map(),createCanvas=()=>document.createElement('canvas')}={}){
 const pages=Math.max(1,Math.ceil(result.cards.length/12));page=Math.max(0,Math.min(pages-1,Math.floor(page)||0));
 const cards=result.cards.slice(page*12,(page+1)*12),canvas=createCanvas();canvas.width=1600;canvas.height=1;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
 const font=(size,bold=false)=>`${bold?'700':'500'} ${size}px Arial, sans-serif`;
 function wrap(text,width,size,bold=false){ctx.font=font(size,bold);const lines=[];let line='';for(const word of String(text).split(/\s+/)){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width<=width){line=candidate;continue;}if(line){lines.push(line);line='';}for(const ch of word){if(line&&ctx.measureText(line+ch).width>width){lines.push(line);line='';}line+=ch;}}if(line)lines.push(line);return lines.length?lines:[''];}
 const margin=48,gap=24,width=(1600-margin*2-gap)/2;
 const layouts=cards.map(card=>{const names=wrap(card.name,width-174,34,true),fields=card.fields.map(([key,value])=>({key,lines:wrap(value,width-290,25,true)})),head=Math.max(132,46+names.length*42);return {name:card.name,names,fields,head,height:head+18+fields.reduce((sum,f)=>sum+Math.max(1,f.lines.length)*34+9,0)+22};});
 const rowHeights=[];for(let i=0;i<layouts.length;i+=2)rowHeights.push(Math.max(layouts[i].height,layouts[i+1]?.height||0));
 const stats=result.stats.flatMap(s=>wrap(s,1504,27)),header=164+stats.length*38,footer=90;
 canvas.height=header+rowHeights.reduce((sum,h)=>sum+h+gap,0)+footer;
 ctx.fillStyle='#f7e8c7';ctx.fillRect(0,0,canvas.width,canvas.height);
 const gradient=ctx.createLinearGradient(0,0,1600,header);gradient.addColorStop(0,'#103f69');gradient.addColorStop(1,'#167fa2');ctx.fillStyle=gradient;ctx.fillRect(0,0,1600,header-24);
 ctx.textBaseline='top';ctx.textAlign='left';ctx.fillStyle='#fff7df';ctx.font=font(48,true);ctx.fillText('HOLa · '+(lang==='es'?'Resumen de miembros':'Member summary'),margin,36);
 ctx.font=font(27);ctx.fillStyle='#ddf5fc';stats.forEach((s,i)=>ctx.fillText(s,margin,106+i*38));
 let y=header;
 for(let i=0;i<layouts.length;i+=2){for(let col=0;col<2&&i+col<layouts.length;col++){
  const card=layouts[i+col],x=margin+col*(width+gap),h=rowHeights[i/2];ctx.fillStyle='#fffdf7';ctx.strokeStyle='#ceb16c';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,width,h,22);ctx.fill();ctx.stroke();
  ctx.save();ctx.beginPath();ctx.arc(x+76,y+72,48,0,Math.PI*2);ctx.clip();ctx.fillStyle='#dceef5';ctx.fillRect(x+28,y+24,96,96);const img=avatars.get(card.name);
  if(img){const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,size=Math.min(iw,ih);ctx.drawImage(img,(iw-size)/2,(ih-size)/2,size,size,x+28,y+24,96,96);}else{ctx.fillStyle='#167fa2';ctx.font=font(38,true);ctx.textAlign='center';ctx.fillText([...card.name.trim()].slice(0,2).join('').toUpperCase(),x+76,y+50);}ctx.restore();ctx.textAlign='left';
  ctx.fillStyle='#103f69';ctx.font=font(34,true);card.names.forEach((line,j)=>ctx.fillText(line,x+146,y+26+j*42));let fy=y+card.head;
  for(const field of card.fields){ctx.font=font(24);ctx.fillStyle='#627a88';ctx.textAlign='left';ctx.fillText(field.key,x+28,fy);ctx.font=font(25,true);ctx.fillStyle='#183b5c';ctx.textAlign='right';field.lines.forEach((line,j)=>ctx.fillText(line,x+width-28,fy+j*34));fy+=field.lines.length*34+9;}
  ctx.textAlign='left';
 }y+=rowHeights[i/2]+gap;}
 ctx.font=font(23);ctx.fillStyle='#536d7b';const stamp=new Intl.DateTimeFormat(lang==='es'?'es-ES':'en-GB',{dateStyle:'medium',timeStyle:'short'}).format(date);ctx.fillText(stamp,margin,canvas.height-58);ctx.textAlign='right';ctx.fillText(`${page+1} / ${pages}`,1600-margin,canvas.height-58);return canvas;
}
export function mountMemberSummary({sb,getPlayers,getLanguage}){
 const $=id=>document.getElementById(id),picked=new Set();let version=0,lastRows=null,summaryText='';
 const words=()=>copy[getLanguage()]||copy.en;
 function invalidate(){version++;lastRows=null;summaryText='';$('memberSummaryOutput').hidden=true;$('memberSummaryNotice').textContent='';}
 function applyLanguage(){const w=words();document.querySelectorAll('[data-summary-word]').forEach(el=>{el.textContent=w[Number(el.dataset.summaryWord)]});$('memberSummarySearch').placeholder=w[2];$('memberSummaryDownload').textContent=getLanguage()==='es'?'Descargar imagen PNG':'Download PNG image';render();if(lastRows)show(lastRows);}
 function render(){
  const w=words(),list=$('memberSummaryList'),query=summaryKey($('memberSummarySearch').value),visible=getPlayers().filter(p=>!query||summaryKey(p.name).includes(query));list.replaceChildren();
  for(const p of visible){const row=document.createElement('label');row.className='summary-choice';const box=document.createElement('input');box.type='checkbox';box.checked=picked.has(p.name);box.addEventListener('change',()=>{if(box.checked)picked.add(p.name);else picked.delete(p.name);invalidate();render();});const name=document.createElement('span');name.textContent=p.name;const meta=document.createElement('small');meta.textContent=[p.rank,p.thp].filter(Boolean).join(' · ');row.append(box,name,meta);list.append(row);}
  if(!visible.length){const empty=document.createElement('p');empty.textContent=w[11];list.append(empty);}
  $('memberSummaryCount').textContent=`${w[10]}: ${picked.size}`;$('memberSummaryGenerate').disabled=!picked.size;
 }
 function show(rows){const result=buildMemberSummary(rows,getLanguage());summaryText=result.text;$('memberSummaryStats').textContent=result.stats.join(' · ');const box=$('memberSummaryCards');box.replaceChildren();
  for(const card of result.cards){const article=document.createElement('article');article.className='summary-card';const head=document.createElement('div');head.className='summary-card-head';const avatar=document.createElement('img');avatar.className='summary-card-avatar';avatar.loading='lazy';avatar.alt='Avatar · '+card.name;avatar.src=card.avatar||'hola-s3-logo.png';avatar.addEventListener('error',()=>{avatar.hidden=true;});const title=document.createElement('h3');title.textContent=card.name;head.append(avatar,title);const dl=document.createElement('dl');for(const [key,value] of card.fields){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;dl.append(dt,dd);}article.append(head,dl);box.append(article);}
  const pages=Math.ceil(result.cards.length/12),pageSelect=$('memberSummaryImagePage');pageSelect.replaceChildren();for(let i=0;i<pages;i++){const option=document.createElement('option');option.value=String(i);option.textContent=(getLanguage()==='es'?'Imagen':'Image')+` ${i+1} / ${pages}`;pageSelect.append(option);}pageSelect.value='0';pageSelect.hidden=pages<=1;
  $('memberSummaryText').value=summaryText;$('memberSummaryOutput').hidden=false;
 }
 $('memberSummarySearch').addEventListener('input',render);
 $('memberSummarySelectVisible').addEventListener('click',()=>{const q=summaryKey($('memberSummarySearch').value);for(const p of getPlayers())if(!q||summaryKey(p.name).includes(q))picked.add(p.name);invalidate();render();});
 $('memberSummaryClear').addEventListener('click',()=>{picked.clear();invalidate();render();});
 $('memberSummaryPasteApply').addEventListener('click',()=>{const result=resolveSummaryNames($('memberSummaryNames').value,getPlayers());for(const name of result.names)picked.add(name);invalidate();render();$('memberSummaryNotice').textContent=result.missing.length?words()[12]+': '+result.missing.join(', '):'';});
 $('memberSummaryGenerate').addEventListener('click',async()=>{
  if(!picked.size)return;const stamp=++version,names=[...picked];$('memberSummaryOutput').hidden=true;$('memberSummaryGenerate').disabled=true;$('memberSummaryNotice').textContent=words()[13];
  try{const {data,error}=await sb.from('players').select('name,avatar,rank,thp,hq_level,t10,supreme_lord_unlocked,profession,country,flag,survey_completed,squad1_type,squad1_power,squad2_type,squad2_power,squad3_type,squad3_power').in('name',names).order('name');if(stamp!==version)return;if(error)throw error;
   const rows=Array.isArray(data)?data:[],missing=names.filter(name=>!rows.some(p=>p.name===name));if(missing.length)throw new Error(words()[31]+': '+missing.join(', '));lastRows=rows;show(rows);$('memberSummaryNotice').textContent='';
  }catch(e){if(stamp===version){lastRows=null;summaryText='';$('memberSummaryNotice').textContent=words()[14]+': '+(e.message||e);}}finally{if(stamp===version)render();}
 });
 $('memberSummaryCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summaryText);$('memberSummaryNotice').textContent=words()[15];}catch{$('memberSummaryText').focus();$('memberSummaryText').select();$('memberSummaryNotice').textContent=words()[16];}});
 $('memberSummaryDownload').addEventListener('click',async()=>{
  if(!lastRows?.length)return;const button=$('memberSummaryDownload'),lang=getLanguage(),page=Number($('memberSummaryImagePage').value)||0,rows=lastRows;button.disabled=true;
  try{const result=buildMemberSummary(rows,lang),cards=result.cards.slice(page*12,(page+1)*12);$('memberSummaryNotice').textContent=lang==='es'?'Preparando imagen y avatares…':'Preparing image and avatars…';const avatars=await loadSummaryAvatars(cards),canvas=renderSummaryImage(result,{page,lang,avatars});const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG unavailable')),'image/png'));const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`HOLa-resumen-miembros-${new Date().toISOString().slice(0,10)}-${page+1}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);const missing=cards.filter(card=>!avatars.get(card.name)).length;$('memberSummaryNotice').textContent=(lang==='es'?'Imagen PNG preparada.':'PNG image ready.')+(missing?(lang==='es'?` Avatares no disponibles: ${missing}; se muestran iniciales.`:` Unavailable avatars: ${missing}; initials are shown.`):'');
  }catch(e){$('memberSummaryNotice').textContent=(lang==='es'?'No se pudo descargar la imagen: ':'Could not download image: ')+(e.message||e);}finally{button.disabled=false;}
 });
 applyLanguage();
 return {sync(rename){if(rename&&picked.delete(rename.from))picked.add(rename.to);const available=new Set(getPlayers().map(p=>p.name));for(const name of picked)if(!available.has(name))picked.delete(name);invalidate();render();},applyLanguage};
}
