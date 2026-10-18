export function cutoffDate(now=new Date()) {
  return new Date(now.getTime()-7*86400000).toISOString().slice(0,10);
}

export async function expireMaps({baseUrl,rest,removeFile,now=new Date()}) {
  const cutoff=cutoffDate(now),prefix=baseUrl+'/storage/v1/object/public/profile-media/';
  const ownedPath=value=>typeof value==='string'&&value.startsWith(prefix)&&/^[a-f0-9]{64}\.(png|jpg|webp|gif)$/.test(value.slice(prefix.length))?value.slice(prefix.length):null;
  const expired=await rest('desert_storm_content?'+new URLSearchParams({select:'id,battle_date,map_data_url',battle_date:'lte.'+cutoff,map_data_url:'not.is.null',limit:'1000'}));
  let cleared=0,deleted=0,shared=0;
  for(const row of expired) {
    if(!row.map_data_url)continue;
    const path=ownedPath(row.map_data_url);
    // Persist a deletion candidate before clearing its link, so failed deletes retry.
    if(path)await rest('ds_map_cleanup_queue?on_conflict=path',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({path})});
    const changed=await rest('desert_storm_content?'+new URLSearchParams({id:'eq.'+row.id,battle_date:'lte.'+cutoff,map_data_url:'eq.'+row.map_data_url,select:'id'}),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({map_data_url:null})});
    cleared+=changed.length;
  }
  const queue=await rest('ds_map_cleanup_queue?select=path&order=queued_at.asc&limit=1000');
  if(queue.length) {
    const [players,maps]=await Promise.all([
      rest('players?select=avatar,uploaded_avatar,hola_avatar'),
      rest('desert_storm_content?select=map_data_url&map_data_url=not.is.null')
    ]);
    const referenced=new Set([...players.flatMap(p=>[p.avatar,p.uploaded_avatar,p.hola_avatar]),...maps.map(p=>p.map_data_url)].map(ownedPath).filter(Boolean));
    for(const {path} of queue) {
      if(!referenced.has(path)){await removeFile(path);deleted++;}else shared++;
      await rest('ds_map_cleanup_queue?'+new URLSearchParams({path:'eq.'+path}),{method:'DELETE'});
    }
  }
  return {cutoff,cleared,deleted,shared};
}
