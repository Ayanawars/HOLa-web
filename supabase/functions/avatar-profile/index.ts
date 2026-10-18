import { storeImage } from '../_shared/image-storage.ts';
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://ovybstpiomphrouvqxmf.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

const clean = (v: unknown, max = 500) =>
  String(v ?? "").trim().slice(0, max);

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

async function rest(path: string, init: RequestInit = {}) {
  if (!SERVICE_KEY) throw new Error("SERVICE_ROLE_NOT_CONFIGURED");
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    ...(init.headers || {})
  };
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
}

async function verifiedPlayer(name: string, token: string) {
  if (!name || !token) {
    return { ok: false, status: 401, error: "Verification required.", code: "VERIFICATION_REQUIRED" };
  }

  const tokenHash = await sha256(token);
  const sr = await rest(
    `survey_edit_sessions?token_hash=eq.${encodeURIComponent(tokenHash)}&player_name=eq.${encodeURIComponent(name)}&select=week,expires_at&limit=1`
  );
  if (!sr.ok) throw new Error(`SESSION_LOOKUP_${sr.status}`);
  const sessions = await sr.json().catch(() => []);

  if (!Array.isArray(sessions) || !sessions.length) {
    return { ok: false, status: 401, error: "Verification session not found.", code: "VERIFICATION_INVALID" };
  }

  const session = sessions[0];
  if (!session.expires_at || new Date(session.expires_at).getTime() <= Date.now()) {
    return { ok: false, status: 401, error: "Verification session expired.", code: "VERIFICATION_EXPIRED" };
  }

  const pr = await rest(
    `players?name=eq.${encodeURIComponent(name)}&select=name,ai_detection_week,avatar,uploaded_avatar,hola_avatar,default_avatar&limit=1`
  );
  if (!pr.ok) throw new Error(`PLAYER_LOOKUP_${pr.status}`);
  const rows = await pr.json().catch(() => []);

  if (!Array.isArray(rows) || !rows.length) {
    return { ok: false, status: 404, error: "PLAYER_NOT_FOUND", code: "PLAYER_NOT_FOUND" };
  }

  const player = rows[0];
  if (String(player.ai_detection_week || "") !== String(session.week || "")) {
    return { ok: false, status: 401, error: "A new AI verification is required.", code: "VERIFICATION_STALE" };
  }

  return { ok: true, session, player };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const action = clean(body?.action || "verify", 30);
    const name = clean(body?.name, 80);
    const token = clean(body?.verificationToken, 300);

    const verified = await verifiedPlayer(name, token);
    if (!verified.ok) {
      return json(
        { error: verified.error, code: verified.code },
        verified.status
      );
    }

    const player: any = verified.player;

    if (action === "verify" || action === "get") {
      return json({
        ok: true,
        name: player.name,
        verificationExpiresAt: verified.session.expires_at,
        uploaded_avatar: player.uploaded_avatar || "",
        hola_avatar: player.hola_avatar || "",
        default_avatar: player.default_avatar || "uploaded"
      });
    }

    if (action === "save_hola") {
      let image = clean(body?.image, 7_000_000);
      if (!image.startsWith("data:image/")) {
        return json({ error: "A generated avatar image is required.", code: "IMAGE_REQUIRED" }, 400);
      }
      if (image.length > 6_500_000) {
        return json({ error: "Generated avatar is too large.", code: "IMAGE_TOO_LARGE" }, 413);
      }

      image = await storeImage(image, SUPABASE_URL, SERVICE_KEY);
      const useAsDefault =
        player.default_avatar === "hola" ||
        !player.uploaded_avatar;

      const update: Record<string, unknown> = {
        hola_avatar: image,
        updated_at: new Date().toISOString()
      };

      if (useAsDefault) {
        update.default_avatar = "hola";
        update.avatar = image;
      }

      const ur = await rest(
        `players?name=eq.${encodeURIComponent(name)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(update)
        }
      );

      if (!ur.ok) {
        const t = await ur.text().catch(() => "");
        throw new Error(`AVATAR_SAVE_${ur.status}:${t.slice(0, 300)}`);
      }

      return json({
        ok: true,
        name,
        hola_avatar: image,
        default_avatar: useAsDefault ? "hola" : player.default_avatar || "uploaded"
      });
    }

    if (action === "set_default") {
      const source = clean(body?.source, 20);
      if (source !== "uploaded" && source !== "hola") {
        return json({ error: "Invalid avatar source.", code: "INVALID_SOURCE" }, 400);
      }

      const selected =
        source === "hola"
          ? String(player.hola_avatar || "")
          : String(player.uploaded_avatar || "");

      if (!selected) {
        return json({ error: "Selected avatar does not exist.", code: "AVATAR_MISSING" }, 409);
      }

      const ur = await rest(
        `players?name=eq.${encodeURIComponent(name)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            default_avatar: source,
            avatar: selected,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!ur.ok) {
        const t = await ur.text().catch(() => "");
        throw new Error(`DEFAULT_SAVE_${ur.status}:${t.slice(0, 300)}`);
      }

      return json({ ok: true, name, default_avatar: source });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("avatar-profile", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});

