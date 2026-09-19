export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    const allowed =
      origin === 'https://ayanawars.github.io' ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:');

    const cors = {
      'Access-Control-Allow-Origin': allowed
        ? origin
        : 'https://ayanawars.github.io',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (request.method === 'OPTIONS') {
      return new Response('ok', {
        status: 200,
        headers: cors
      });
    }

    const url = new URL(request.url);

    if (
      request.method !== 'POST' ||
      url.pathname !== '/avatar-transform'
    ) {
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        {
          status: 404,
          headers: {
            ...cors,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Origin not allowed' }),
        {
          status: 403,
          headers: {
            ...cors,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    try {
      const body = await request.json();

      let base64 = String(body.image_base64 || '').trim();
      base64 = base64.replace(/\s/g, '');

      if (!base64) {
        return new Response(
          JSON.stringify({ error: 'image_base64 is required' }),
          {
            status: 400,
            headers: {
              ...cors,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      const prompt =
        String(body.prompt || 'Egyptian fantasy avatar').slice(0, 4000) +
        ' Use input image 0 as the visual reference. Preserve the same character identity, face, sex, skin tone, hairstyle, hair color, eye color, makeup, headdress, armor colors, accessories, Egyptian background concept and frame identity. Transform the simple base illustration into a polished heroic fantasy game avatar with richer materials, lighting and detail. Centered bust portrait, square composition, no text, no watermark.';

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const blob = new Blob(
        [bytes],
        { type: 'image/png' }
      );

      const form = new FormData();
      form.append('input_image_0', blob, 'hola-avatar.png');
      form.append('prompt', prompt);
      form.append('width', '1024');
      form.append('height', '1024');
      form.append('guidance', '4.0');
      form.append(
        'seed',
        String(Math.floor(Math.random() * 2147483647))
      );

      const formResponse = new Response(form);
      const formStream = formResponse.body;
      const formContentType =
        formResponse.headers.get('content-type');

      const result = await env.AI.run(
        '@cf/black-forest-labs/flux-2-klein-4b',
        {
          multipart: {
            body: formStream,
            contentType: formContentType
          }
        }
      );

      if (!result || !result.image) {
        throw new Error('Cloudflare AI did not return an image');
      }

      return new Response(
        JSON.stringify({
          ok: true,
          provider: '@cf/black-forest-labs/flux-2-klein-4b',
          image_base64: result.image,
          mime_type: 'image/jpeg'
        }),
        {
          status: 200,
          headers: {
            ...cors,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          error: String(
            error && error.message
              ? error.message
              : error
          )
        }),
        {
          status: 500,
          headers: {
            ...cors,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
};
