/* Shared lightweight DS avatars; changed profiles refresh individually. */
(() => {
  let pending,profiles=[],metadata;
  const checked=new Set();
  const key=s=>String(s||'').replace(/[\u200B-\u200D\uFEFF]/g,'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  async function refresh(names=[]){
    const wanted=new Set(names.map(key).filter(name=>!checked.has(name)));
    if(!wanted.size)return;
    wanted.forEach(name=>checked.add(name));
    try{
      if(!metadata)metadata=rest('players','select=name,updated_at,default_avatar&order=name.asc');
      const rows=await metadata;
      const known=new Map(profiles.map(p=>[key(p.name),p]));
      const changed=rows.filter(p=>wanted.has(key(p.name))&&(!known.has(key(p.name))||Date.parse(p.updated_at)!==Date.parse(known.get(key(p.name)).updated_at)));
      let cursor=0;
      await Promise.all(Array.from({length:Math.min(3,changed.length)},async()=>{
        while(cursor<changed.length){
          const p=changed[cursor++];
          const current=await rest('players','select=name,updated_at,avatar,default_avatar&name=eq.'+encodeURIComponent(p.name)+'&limit=1');
          if(current[0])known.set(key(p.name),current[0]);
        }
      }));
      // Merge only refreshed records, including concurrent team changes.
      const merged=new Map(profiles.map(p=>[key(p.name),p]));
      changed.forEach(p=>merged.set(key(p.name),known.get(key(p.name))||p));
      profiles=rows.map(p=>merged.get(key(p.name))||p);
      window.dispatchEvent(new Event('hola-ds-profiles'));
    }catch(e){wanted.forEach(name=>checked.delete(name));metadata=null;console.warn('DS avatar refresh:',e);}
  }
  window.holaDsProfiles={
    get(names=[]){
      if(!pending)pending=fetch('ds-avatar-thumbnails.json?v=20261004-2').then(r=>{if(!r.ok)throw new Error('Avatar thumbnails unavailable');return r.json();}).then(rows=>{profiles=rows;return profiles;}).catch(e=>{pending=null;console.warn(e);return [];});
      return pending.then(()=>{refresh(names);return profiles});
    },
    current:()=>profiles
  };
})();
