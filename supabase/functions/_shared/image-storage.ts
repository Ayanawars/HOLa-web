// Content-addressed images: a profile stores a URL, never the image bytes.
const BUCKET = 'profile-media';
const TYPES: Record<string, string> = {'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'};

export async function storeImage(value: string, url: string, key: string): Promise<string> {
  if (!value.startsWith('data:image/')) return value;
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(value);
  if (!match) throw new Error('Unsupported image data');
  const raw = atob(match[2].replace(/\s/g,''));
  if (raw.length > 10 * 1024 * 1024) throw new Error('Image exceeds 10 MB');
  const bytes = Uint8Array.from(raw, c=>c.charCodeAt(0));
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const path = `${hash}.${TYPES[match[1]]}`;
  const headers = {apikey:key,Authorization:`Bearer ${key}`};
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method:'POST', headers:{...headers,'Content-Type':match[1],'Cache-Control':'max-age=31536000','x-upsert':'false'}, body:bytes
  });
  // A retry may find an identical, already stored content hash.
  if (!response.ok) {
    const error = await response.json().catch(()=>({}));
    if (String(error.statusCode) !== '409' && error.error !== 'Duplicate') throw new Error(`IMAGE_UPLOAD_${response.status}`);
  } else await response.arrayBuffer();
  const publicUrl = `${url}/storage/v1/object/public/${BUCKET}/${path}`;
  // Confirm that the stored object is the exact image before replacing a DB value.
  const stored = await fetch(publicUrl);
  if (!stored.ok) throw new Error('IMAGE_VERIFY_FAILED');
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await stored.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if (digest !== hash) throw new Error('IMAGE_HASH_MISMATCH');
  return publicUrl;
}

