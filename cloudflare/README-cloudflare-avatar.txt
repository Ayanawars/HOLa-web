HOLa S3 v16 · Cloudflare FLUX.2 Klein 4B

- Motor: @cf/black-forest-labs/flux-2-klein-4b
- Input del Avatar Maker reducido a 510x510 para cumplir el límite de referencia <512x512.
- Salida configurada a 1024x1024.
- Usa multipart + input_image_0, como exige FLUX.2 Klein 4B.
- Endpoint: https://hola-avatar-transform.ayanawarslastwar.workers.dev/avatar-transform
- Binding requerido: Workers AI con nombre AI.

Sustituye todo el contenido de worker.js en Cloudflare por el worker.js incluido aquí y pulsa Implementar.
