// Dulce Eternidad — Cliente de Supabase
import { getSupabaseConfig, isSupabaseConfigured } from "./config.js";

export const STORAGE_BUCKET = "catalog-images";

let supabaseInstance = null;
let initPromise = null;

export async function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;
  if (!isSupabaseConfigured()) return null;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const { url, anonKey } = getSupabaseConfig();
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.warn("No se pudo inicializar el cliente de Supabase:", err);
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
  initPromise = null;
}
