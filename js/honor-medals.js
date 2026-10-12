/* Top-three positions follow the same rules as the Honor Wall. */
(function(root){
  const normalize=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
  const parsePower=v=>{const raw=String(v??'').trim().replace(/\s/g,'').replace(',','.');if(!raw)return 0;const m=raw.match(/^([\d.]+)([KMB])?$/i);if(!m)return 0;const n=Number(m[1]);return Number.isFinite(n)&&n>0?n*({K:1e3,M:1e6,B:1e9}[m[2]?.toUpperCase()]||1e6):0};
  function build(rows,kills=[]){
    const members=new Map(rows.map(p=>[normalize(p.name),p])),thp=new Map(),squads=new Map(),result=new Map();
    const add=(category,entries)=>entries.sort((a,b)=>b.power-a.power||a.name.localeCompare(b.name)).slice(0,3).forEach((p,index)=>{const id=normalize(p.name);if(!result.has(id))result.set(id,[]);result.get(id).push({category,rank:index+1})});
    for(const p of rows){
      const id=normalize(p.name),power=parsePower(p.thp);if(id&&power&&(!thp.has(id)||power>thp.get(id).power))thp.set(id,{name:p.name,power});
      let best=null;for(let i=1;i<=3;i++){const type=String(p['squad'+i+'_type']||'').trim(),power=parsePower(p['squad'+i+'_power']);if(type&&power&&(!best||power>best.power))best={name:p.name,type,power}}
      if(best&&(!squads.has(id)||best.power>squads.get(id).power))squads.set(id,best);
    }
    for(const type of ['Tank','Missile','Aircraft'])add(type,[...squads.values()].filter(p=>p.type.toLowerCase()===type.toLowerCase()));
    add('THP',[...thp.values()]);
    add('Kills',kills.map(p=>{const member=members.get(normalize(p.name));return member?{name:member.name,power:Number(p.kills)}:null}).filter(p=>p&&Number.isFinite(p.power)&&p.power>0));
    return result;
  }
  root.HolaHonorMedals={normalize,build};
})(typeof window!=='undefined'?window:globalThis);
