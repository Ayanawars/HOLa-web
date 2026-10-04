/* Shared lightweight DS avatars; changed profiles refresh individually. */
(() => {
  let pending,profiles=[],checked=false;
  const key=s=>String(s||'').replace(/[\u200B-\u200D\uFEFF]/g,'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  async function refresh(){
    if(checked)return;checked=true;
    try{
      const rows=await rest('players','select=name,updated_at,default_avatar&order=name.asc');
      const known=new Map(profiles.map(p=>[key(p.name),p]));
      const changed=rows.filter(p=>!known.has(key(p.name))||Date.parse(p.updated_at)!==Date.parse(known.get(key(p.name)).updated_at));
      let cursor=0;
      await Promise.all(Array.from({length:Math.min(3,changed.length)},async()=>{
        while(cursor<changed.length){
          const p=changed[cursor++];
          const current=await rest('players','select=name,updated_at,avatar,uploaded_avatar,hola_avatar,default_avatar&name=eq.'+encodeURIComponent(p.name)+'&limit=1');
          if(current[0])known.set(key(p.name),current[0]);
        }
      }));
      profiles=rows.map(p=>known.get(key(p.name))||p);
      window.dispatchEvent(new Event('hola-ds-profiles'));
    }catch(e){console.warn('DS avatar refresh:',e);}
  }
  window.holaDsProfiles={
    get(){
      if(!pending)pending=fetch('ds-avatar-thumbnails.json?v=20261004-2').then(r=>{if(!r.ok)throw new Error('Avatar thumbnails unavailable');return r.json();}).then(rows=>{profiles=rows;refresh();return profiles;}).catch(e=>{pending=null;console.warn(e);return [];});
      return pending.then(()=>profiles);
    },
    current:()=>profiles
  };
})();
