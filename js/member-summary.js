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
 const cards=rows.map(p=>({name:p.name,fields:[
  ['HQ',Number(p.hq_level)>0?String(p.hq_level):pending],['THP',power(p.thp)],['T10',boolean(p.t10)],['Overlord',boolean(p.supreme_lord_unlocked)],
  [w[20],label(type(p.profession))],['Rango',label(p.rank)],[w[21],label(p.country||p.flag)],[w[22],p.survey_completed===true?w[23]:pending],
  ...[1,2,3].map(i=>[`${w[24]} ${i}`,[type(p[`squad${i}_type`]),p[`squad${i}_power`]?power(p[`squad${i}_power`]):''].filter(Boolean).join(' · ')||pending])
 ]}));
 if(lang!=='es')for(const card of cards)card.fields.find(f=>f[0]==='Rango')[0]='Rank';
 return {stats,cards,text:['HOLa · '+w[0],stats.join('\n'),...cards.map(card=>[card.name,...card.fields.map(([key,value])=>`${key}: ${value}`)].join('\n'))].join('\n\n')};
}
export function mountMemberSummary({sb,getPlayers,getLanguage}){
 const $=id=>document.getElementById(id),picked=new Set();let version=0,lastRows=null,summaryText='';
 const words=()=>copy[getLanguage()]||copy.en;
 function invalidate(){version++;lastRows=null;summaryText='';$('memberSummaryOutput').hidden=true;$('memberSummaryNotice').textContent='';}
 function applyLanguage(){const w=words();document.querySelectorAll('[data-summary-word]').forEach(el=>{el.textContent=w[Number(el.dataset.summaryWord)]});$('memberSummarySearch').placeholder=w[2];render();if(lastRows)show(lastRows);}
 function render(){
  const w=words(),list=$('memberSummaryList'),query=summaryKey($('memberSummarySearch').value),visible=getPlayers().filter(p=>!query||summaryKey(p.name).includes(query));list.replaceChildren();
  for(const p of visible){const row=document.createElement('label');row.className='summary-choice';const box=document.createElement('input');box.type='checkbox';box.checked=picked.has(p.name);box.addEventListener('change',()=>{if(box.checked)picked.add(p.name);else picked.delete(p.name);invalidate();render();});const name=document.createElement('span');name.textContent=p.name;const meta=document.createElement('small');meta.textContent=[p.rank,p.thp].filter(Boolean).join(' · ');row.append(box,name,meta);list.append(row);}
  if(!visible.length){const empty=document.createElement('p');empty.textContent=w[11];list.append(empty);}
  $('memberSummaryCount').textContent=`${w[10]}: ${picked.size}`;$('memberSummaryGenerate').disabled=!picked.size;
 }
 function show(rows){const result=buildMemberSummary(rows,getLanguage());summaryText=result.text;$('memberSummaryStats').textContent=result.stats.join(' · ');const box=$('memberSummaryCards');box.replaceChildren();
  for(const card of result.cards){const article=document.createElement('article');article.className='summary-card';const title=document.createElement('h3');title.textContent=card.name;const dl=document.createElement('dl');for(const [key,value] of card.fields){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;dl.append(dt,dd);}article.append(title,dl);box.append(article);}
  $('memberSummaryText').value=summaryText;$('memberSummaryOutput').hidden=false;
 }
 $('memberSummarySearch').addEventListener('input',render);
 $('memberSummarySelectVisible').addEventListener('click',()=>{const q=summaryKey($('memberSummarySearch').value);for(const p of getPlayers())if(!q||summaryKey(p.name).includes(q))picked.add(p.name);invalidate();render();});
 $('memberSummaryClear').addEventListener('click',()=>{picked.clear();invalidate();render();});
 $('memberSummaryPasteApply').addEventListener('click',()=>{const result=resolveSummaryNames($('memberSummaryNames').value,getPlayers());for(const name of result.names)picked.add(name);invalidate();render();$('memberSummaryNotice').textContent=result.missing.length?words()[12]+': '+result.missing.join(', '):'';});
 $('memberSummaryGenerate').addEventListener('click',async()=>{
  if(!picked.size)return;const stamp=++version,names=[...picked];$('memberSummaryOutput').hidden=true;$('memberSummaryGenerate').disabled=true;$('memberSummaryNotice').textContent=words()[13];
  try{const {data,error}=await sb.from('players').select('name,rank,thp,hq_level,t10,supreme_lord_unlocked,profession,country,flag,survey_completed,squad1_type,squad1_power,squad2_type,squad2_power,squad3_type,squad3_power').in('name',names).order('name');if(stamp!==version)return;if(error)throw error;
   const rows=Array.isArray(data)?data:[],missing=names.filter(name=>!rows.some(p=>p.name===name));if(missing.length)throw new Error(words()[31]+': '+missing.join(', '));lastRows=rows;show(rows);$('memberSummaryNotice').textContent='';
  }catch(e){if(stamp===version){lastRows=null;summaryText='';$('memberSummaryNotice').textContent=words()[14]+': '+(e.message||e);}}finally{if(stamp===version)render();}
 });
 $('memberSummaryCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summaryText);$('memberSummaryNotice').textContent=words()[15];}catch{$('memberSummaryText').focus();$('memberSummaryText').select();$('memberSummaryNotice').textContent=words()[16];}});
 applyLanguage();
 return {sync(rename){if(rename&&picked.delete(rename.from))picked.add(rename.to);const available=new Set(getPlayers().map(p=>p.name));for(const name of picked)if(!available.has(name))picked.delete(name);invalidate();render();},applyLanguage};
}
