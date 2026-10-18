/* Cache only publicly readable avatar fields. Metadata checks invalidate edited profiles. */
(() => {
  'use strict';
  const network = window.fetch.bind(window);
  const URLClass = window.URL;
  const project = 'https://ovybstpiomphrouvqxmf.supabase.co';
  const allowed = new Set(['name','avatar','uploaded_avatar','hola_avatar','default_avatar','updated_at']);
  const pending = new Map();
  let database, manifest, manifestAt = 0, manifestPending;
  function openDB() {
    if (!window.indexedDB) return Promise.resolve(null);
    if (!database) database = new Promise(resolve => {
      const request = indexedDB.open('hola-public-avatars-v1',1);
      request.onupgradeneeded = () => request.result.createObjectStore('profiles',{keyPath:'name'});
      request.onsuccess = () => resolve(request.result);
      request.onerror = request.onblocked = () => resolve(null);
    });
    return database;
  }
  async function read(name) {
    try {
      const db=await openDB(); if(!db)return null;
      return await new Promise(resolve=>{const request=db.transaction('profiles').objectStore('profiles').get(name);request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);});
    } catch { return null; }
  }
  async function save(row,version) {
    try {
      const db=await openDB();if(!db)return;
      const old=await read(row.name);
      await new Promise(resolve=>{
        const tx=db.transaction('profiles','readwrite');
        const store=tx.objectStore('profiles');
        store.put({name:row.name,version,fields:{...(old?.version===version?old.fields:{}),...row},storedAt:Date.now()});
        // Keep the cache bounded when players leave or names change.
        const cursor=store.openCursor();cursor.onsuccess=()=>{const c=cursor.result;if(!c)return;if(!manifest?.has(c.key)||Date.now()-c.value.storedAt>30*86400000)c.delete();c.continue();};
        tx.oncomplete=tx.onerror=tx.onabort=()=>resolve();
      });
    } catch { /* A full/private browser cache must not block the page. */ }
  }
  async function versions(apikey) {
    if(manifest && Date.now()-manifestAt<60000)return manifest;
    if(!manifestPending)manifestPending=(async()=>{
      const response=await network(project+'/rest/v1/players?select=name,updated_at&order=name.asc',{headers:{apikey},cache:'no-store'});
      if(!response.ok)throw Error('Avatar version lookup failed');
      const rows=await response.json();
      manifest=new Map(rows.map(row=>[row.name,row.updated_at||'']));manifestAt=Date.now();return manifest;
    })().finally(()=>{manifestPending=null;});
    return manifestPending;
  }
  function namesOf(filter) {
    if(filter?.startsWith('eq.'))return [filter.slice(3)];
    if(filter?.startsWith('in.(')&&filter.endsWith(')'))return (filter.slice(4,-1).match(/"(?:[^"\\]|\\.)*"|[^,]+/g)||[]).map(name=>name.startsWith('"')?JSON.parse(name):name);
    return null;
  }
  async function cached(input,init={}) {
    const href=typeof input==='string'?input:input instanceof URLClass?input.href:input.url;
    let url;try{url=new URLClass(href,location.href);}catch{return network(input,init);}
    const method=(init.method||input.method||'GET').toUpperCase();
    const headers=new Headers(input.headers||{});new Headers(init.headers||{}).forEach((v,k)=>headers.set(k,v));
    const fields=(url.searchParams.get('select')||'').split(',');
    const apikey=headers.get('apikey'),auth=headers.get('authorization');
    let names;try{names=namesOf(url.searchParams.get('name'));}catch{}
    if(method!=='GET'||url.origin!==project||url.pathname!=='/rest/v1/players'||!apikey||
      (auth&&auth!==`Bearer ${apikey}`)||!names?.length||
      !fields.some(field=>['avatar','uploaded_avatar','hola_avatar'].includes(field))||
      fields.some(field=>!allowed.has(field))||[...url.searchParams.keys()].some(key=>!['name','select','limit'].includes(key))||
      headers.has('range')||headers.get('prefer')?.includes('count=')||headers.get('accept')?.includes('object+json'))return network(input,init);
    if((init.signal||input.signal)?.aborted)throw new DOMException('Aborted','AbortError');
    let version;try{version=await versions(apikey);}catch{return network(input,init);}
    const limit=Number(url.searchParams.get('limit')||names.length);
    const cachedRows=await Promise.all(names.slice(0,limit).map(async name=>{
      const row=await read(name);if(!version.has(name)||!row||row.version!==version.get(name)||!fields.every(field=>Object.hasOwn(row.fields,field)))return null;
      return Object.fromEntries(fields.map(field=>[field,row.fields[field]]));
    }));
    if(cachedRows.every(Boolean))return new Response(JSON.stringify(cachedRows),{headers:{'Content-Type':'application/json','X-HOLa-Avatar-Cache':'hit'}});
    const id=url.href;
    if(pending.has(id))return (await pending.get(id)).clone();
    const request=(async()=>{
      // Include name for storage, while returning exactly the requested projection.
      const source=new URLClass(url);source.searchParams.set('select',[...new Set(['name',...fields])].join(','));
      const response=await network(source.href,{...init,headers,signal:init.signal||input.signal});
      if(!response.ok)return response;
      const rows=await response.json();if(!Array.isArray(rows))return new Response(JSON.stringify(rows),{status:response.status,headers:response.headers});
      await Promise.all(rows.filter(row=>version.has(row.name)).map(row=>save(row,version.get(row.name))));
      const result=rows.map(row=>Object.fromEntries(fields.map(field=>[field,row[field]])));
      return new Response(JSON.stringify(result),{status:response.status,headers:response.headers});
    })();
    pending.set(id,request);
    try{return (await request).clone();}finally{pending.delete(id);}
  }
  window.holaAvatarFetch=cached;
  window.fetch=cached;
})();
