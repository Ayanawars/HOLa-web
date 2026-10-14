// Match names only. A visible name with zero points still confirms presence.
export function arenaKey(value){return String(value||'').replace(/[ᓚᘏᗢ]/g,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'')}
function tokens(value){return String(value||'').replace(/[ᓚᘏᗢ]/g,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]}
export function cleanArenaLine(value){
  // Remove grouped score numbers even when OCR joins them to the player name.
  return String(value||'').replace(/\d{1,3}(?:[,.]\d{3})+(?:[,.]\d+)?/g,' ');
}
export function arenaAliases(name){
  const key=arenaKey(name),values=new Set([key]);
  if(/^jebraw+w*$/.test(key))values.add('jebraw');
  if(key==='mirrliva'||key==='mirliva'){values.add('mirliva');values.add('mirrliva')}
  if(key==='ir4ul')values.add('ir4ul91');
  if(key==='tariix')values.add('tariixx');
  // The cat's leading stroke is sometimes recognized as a c attached to the name.
  if(String(name).includes('ᓚ'))values.add(key+'c');
  if(key==='elara')values.add('elara');
  return [...values].filter(Boolean);
}
function distance(a,b){const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let previous=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));previous=old}}return row[b.length]}
export function detectArenaNames(text,players){
  const roster=players.map(p=>typeof p==='string'?p:p.name).filter(Boolean),aliases=new Map();
  for(const name of roster)for(const alias of arenaAliases(name)){if(!aliases.has(alias))aliases.set(alias,new Set());aliases.get(alias).add(name)}
  const exact=new Map(),suggestions=new Map(),unmatched=[];
  for(const raw of String(text||'').split(/\r?\n/)){
    const line=raw.trim();if(!line)continue;
    const parts=tokens(cleanArenaLine(line)),windows=new Set();
    for(let i=0;i<parts.length;i++)for(let n=1;n<=Math.min(6,parts.length-i);n++)windows.add(parts.slice(i,i+n).join(''));
    const matches=new Set();for(const word of windows){const names=aliases.get(word);if(names?.size===1)matches.add([...names][0])}
    // Multiple names in the same OCR line are ambiguous; require manual review.
    if(matches.size===1){const name=[...matches][0];if(!exact.has(name))exact.set(name,{name,evidence:[],confidence:'exact'});exact.get(name).evidence.push(line);continue}
    if(matches.size>1){for(const name of matches)if(!suggestions.has(name))suggestions.set(name,{name,evidence:[line],confidence:'suggestion'});continue}
    let best=null,second=0;
    for(const name of roster){let score=0;for(const alias of arenaAliases(name)){
      if(alias.length<5)continue;
      for(const word of windows){if(Math.abs(alias.length-word.length)>2)continue;const length=Math.max(alias.length,word.length);score=Math.max(score,1-distance(alias,word)/length);
        // G/6 confusion in mixed letter-number names is a suggestion only.
        if(/\d/.test(alias))score=Math.max(score,1-distance(alias.replace(/g/g,'6'),word.replace(/g/g,'6'))/length);
      }
    }if(!best||score>best.score){second=best?.score||0;best={name,score}}else second=Math.max(second,score)}
    if(best&&best.score>=.75&&best.score-second>=.08){if(!suggestions.has(best.name))suggestions.set(best.name,{name:best.name,evidence:[],confidence:'suggestion'});suggestions.get(best.name).evidence.push(line)}else unmatched.push(line);
  }
  for(const name of exact.keys())suggestions.delete(name);
  return {exact:[...exact.values()],suggestions:[...suggestions.values()],unmatched};
}
export function mergeArenaDraft(draft,result,savedNames=[]){
  const saved=new Set(savedNames),next=new Map(draft);
  for(const name of saved)next.delete(name);
  for(const entry of [...result.suggestions,...result.exact]){
    if(saved.has(entry.name))continue;
    const old=next.get(entry.name),exact=entry.confidence==='exact';
    if(old){next.set(entry.name,{...old,evidence:[...new Set([...(old.evidence||[]),...entry.evidence])],confidence:exact?'exact':old.confidence,checked:old.reviewed?old.checked:old.checked||exact})}
    else next.set(entry.name,{...entry,source:'ocr',checked:exact});
  }
  return next;
}
export function arenaSaveRows(battleId,draft){
  if(!battleId)throw Error('No battle selected');
  return [...new Map([...draft.values()].filter(p=>p.checked&&p.name).map(p=>[p.name,{battle_id:battleId,player_name:p.name,source:p.source==='manual'?'manual':'ocr'}])).values()];
}
