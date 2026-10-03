// Dulce Eternidad — Configuración de Supabase
// Puedes definir tus credenciales directamente aquí o configurarlas desde el panel Admin.

export const ENV_CONFIG = {
  url: "https://lwatxuxsyxzjmbvupqhq.supabase.co",
  anonKey: "sb_publishable_J3Dd3q8rxp6uPkeXvThRrQ_z6LrzzhX",
};

function sanitizeUrl(raw) {
  return (raw || "")
    .trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "");
}

export function getSupabaseConfig() {
  let url = ENV_CONFIG.url || "";
  let anonKey = ENV_CONFIG.anonKey || "";

  try {
    const local = localStorage.getItem("dulce_eternidad_supabase_config");
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.url && parsed.anonKey) {
        url = parsed.url;
        anonKey = parsed.anonKey;
      }
    }
  } catch (err) {
    console.warn("Error leyendo supabase_config:", err);
  }

  return {
    url: sanitizeUrl(url),
    anonKey: (anonKey || "").trim(),
  };
}

export function saveSupabaseConfig({ url, anonKey }) {
  try {
    const clean = {
      url: sanitizeUrl(url),
      anonKey: (anonKey || "").trim(),
    };
    localStorage.setItem("dulce_eternidad_supabase_config", JSON.stringify(clean));
    return clean;
  } catch (err) {
    console.warn("Error guardando supabase_config:", err);
    return null;
  }
}

export function isSupabaseConfigured() {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.anonKey && cfg.url.startsWith("https://"));
}
