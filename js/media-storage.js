/* Officer map uploads use immutable URLs; public visitors have read access only. */
window.holaStoreMedia = async function(client,value) {
  if(typeof value!=='string'||!value.startsWith('data:image/'))return value;
  const match=/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(value);
  if(!match)throw Error('Unsupported image format');
  const raw=atob(match[2].replace(/\s/g,''));
  if(raw.length>10*1024*1024)throw Error('Image exceeds 10 MB');
  const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  const digest=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const hash=await digest(bytes),ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'}[match[1]];
  const path=hash+'.'+ext,bucket=client.storage.from('profile-media');
  const {error}=await bucket.upload(path,bytes,{contentType:match[1],cacheControl:'31536000',upsert:false});
  if(error&&String(error.statusCode)!=='409'&&!/already exists|duplicate/i.test(error.message||''))throw error;
  const {data}=bucket.getPublicUrl(path);
  const response=await fetch(data.publicUrl);
  if(!response.ok||await digest(await response.arrayBuffer())!==hash)throw Error('Image upload verification failed');
  return data.publicUrl;
};
