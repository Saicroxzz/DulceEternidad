// Dulce Eternidad - Almacenamiento unificado (Supabase + Fallback Local)
import { getSupabaseClient, STORAGE_BUCKET } from "./supabaseClient.js";
import { isSupabaseConfigured } from "./config.js";

export const CATEGORIES = [
  "Ramos",
  "Arreglos",
  "Eventos",
  "Regalos especiales",
];

export const OCCASIONS = [
  "Amor",
  "Cumpleaños",
  "Aniversario",
  "Agradecimiento",
  "Evento",
];

export const PLACEHOLDER = "./assets/placeholder.svg";

const KEYS = {
  products: "dulce_eternidad_products_v6",
  settings: "dulce_eternidad_settings_v6",
  user: "dulce_eternidad_user_v6",
  session: "dulce_eternidad_session_v6",
};

// Limpiar versiones viejas si existían
try {
  localStorage.removeItem("de_products_v2");
  localStorage.removeItem("dulce_eternidad_products_v3");
  localStorage.removeItem("dulce_eternidad_products_v4");
  localStorage.removeItem("dulce_eternidad_products_v5");
} catch (e) {}

export const STORAGE_CDN = "https://lwatxuxsyxzjmbvupqhq.supabase.co/storage/v1/object/public/catalog-images/";
export const DEFAULT_LOGO = STORAGE_CDN + "logo.jpeg";
export const DEFAULT_TARJETA = STORAGE_CDN + "tarjeta.jpeg";
export const DEFAULT_HERO_IMAGE = STORAGE_CDN + "hero-flores-amarillas.png";

// Catálogo consistente con fotos reales de los ramos artesanales en limpia pipas
export const SEED_PRODUCTS = [
  {
    id: "de-p1",
    name: "Ramo Amor Radiante",
    category: "Ramos",
    occasion: "Amor",
    price: 85000,
    description: "Ramo floral artesanal elaborado a mano en técnica limpia pipas. Destaca un girasol central, rosas rojas y flores de acompañamiento con lazo satinado.",
    flowers: "Girasol, rosas rojas y flores de relleno en limpia pipas",
    size: "Mediano (aprox. 35 cm de alto)",
    available: true,
    featured: true,
    images: [STORAGE_CDN + "ramo-amor-radiante.jpeg"],
  },
  {
    id: "de-p2",
    name: "Ramo 5 Gerberas",
    category: "Ramos",
    occasion: "Cumpleaños",
    price: 75000,
    description: "Cinco gerberas amarillas artesanales tejidas con esmero en limpia pipas. Incluye mariposa dorada calada y lazo con detalle de corazones.",
    flowers: "5 gerberas amarillas y follaje en limpia pipas",
    size: "Mediano (aprox. 35 cm de alto)",
    available: true,
    featured: true,
    images: [STORAGE_CDN + "5-gerberas.jpeg"],
  },
  {
    id: "de-p3",
    name: "Dúo de Amor",
    category: "Arreglos",
    occasion: "Amor",
    price: 50000,
    description: "Arreglo dulce con dos rosas eternas en limpia pipas y corazón decorativo. Un obsequio ideal para sorprender o lucir en cualquier rincón.",
    flowers: "Dos rosas eternas en limpia pipas y follaje",
    size: "Pequeño (aprox. 25 cm de alto)",
    available: true,
    featured: true,
    images: [STORAGE_CDN + "duo-de-amor.jpeg"],
  },
  {
    id: "de-p4",
    name: "Ramo Día de Sol",
    category: "Ramos",
    occasion: "Agradecimiento",
    price: 80000,
    description: "Diseño alegre con girasol y flores en tonos amarillos y blancos sobre papel floral con borde dorado.",
    flowers: "Girasol, gerberas y follaje artesanal",
    size: "Mediano (aprox. 35 cm de alto)",
    available: true,
    featured: false,
    images: [STORAGE_CDN + "ramo-dia-de-sol.jpeg"],
  },
  {
    id: "de-p5",
    name: "Ramo Eterno Encanto",
    category: "Ramos",
    occasion: "Aniversario",
    price: 95000,
    description: "Ramo artesanal en tonos suaves y románticos, diseñado para recordar fechas inolvidables sin marchitarse.",
    flowers: "Rosas artesanales y flores variadas en limpia pipas",
    size: "Grande (aprox. 45 cm de alto)",
    available: true,
    featured: false,
    images: [STORAGE_CDN + "ramo-eterno-encanto.jpeg"],
  },
  {
    id: "de-p6",
    name: "Ramo Mi Delirio",
    category: "Ramos",
    occasion: "Amor",
    price: 90000,
    description: "Conjunto de rosas rojas eternas con follaje verde elaborado pacientemente a mano en limpia pipas.",
    flowers: "Rosas rojas artesanales y hojas verdes",
    size: "Mediano (aprox. 38 cm de alto)",
    available: true,
    featured: false,
    images: [STORAGE_CDN + "ramo-mi-delirio.jpeg"],
  },
  {
    id: "de-p7",
    name: "Rosa Individual Eterna",
    category: "Regalos especiales",
    occasion: "Aniversario",
    price: 25000,
    description: "Detalle individual con rosa hecha a mano en limpia pipas, presentada en cono decorativo con lazo. Lista para regalar.",
    flowers: "Rosa en limpia pipas y tallo con hojas",
    size: "Individual (aprox. 30 cm de alto)",
    available: true,
    featured: false,
    images: [STORAGE_CDN + "eterna.jpeg"],
  },
  {
    id: "de-p8",
    name: "Arreglo Floral para Eventos",
    category: "Eventos",
    occasion: "Evento",
    price: null,
    description: "Centros de mesa y detalles florales a medida para celebraciones especiales. Cada proyecto se cotiza y adapta a la temática.",
    flowers: "A convenir según colores y temática del evento",
    size: "A medida",
    available: true,
    featured: false,
    images: [STORAGE_CDN + "ramo-eterno-encanto.jpeg"],
  },
];

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Error en localStorage:", err);
  }
}

export const DEFAULT_SETTINGS = {
  whatsapp: "573001234567",
  whatsappDefaultMessage: "Hola, me gustaría información sobre sus creaciones florales artesanales.",
  instagram: "dulce.eternidad7",
  heroImage: DEFAULT_HERO_IMAGE,
  // Cabecera y Marca
  brandName: "Dulce Eternidad",
  brandSubtitle: "Boutique floral",
  // Banner Hero
  heroEyebrow: "Flores artesanales · Limpia pipas",
  heroTitle: "El arte de regalar amor eterno",
  heroSubtitle: "Cada pétalo modelado a mano, uno a uno. Flores que no se marchitan, pensadas para los momentos que queremos recordar siempre.",
  heroBtnPrimaryText: "Ver catálogo",
  heroBtnPrimaryLink: "/catalogo",
  heroBtnSecondaryText: "Nuestra historia",
  heroBtnSecondaryLink: "/nosotros",
  // Cinta de Anuncios
  marqueeItems: [
    "100% Hecho a mano",
    "Flores que no se marchitan",
    "Técnica Limpia Pipas",
    "Ramos personalizados",
    "Envíos a todo el país",
    "Momentos eternos",
  ],
  // Colección & Promociones (Configurable)
  promoSectionEnabled: true,
  promoSectionType: "promociones", // "promociones" | "mas_vendidos" | "mas_recientes"
  promoSectionEyebrow: "Colección Destacada",
  promoSectionTitle: "Creaciones en Promoción & Más Elegidas",
  promoSectionSubtitle: "Aprovecha nuestras flores artesanales modeladas en limpia pipas con acabados exclusivos.",
  promoSectionBadge: "Edición Limitada · Confección Artesanal",
  // Historia
  storyEyebrow: "Nuestra historia",
  storyTitle: "Hecho con calma y con las manos",
  storyParagraph1: "Dulce Eternidad es un taller floral dedicado a la creación de flores eternas modeladas a mano con la técnica de limpia pipas. Cada pétalo, tallo y hoja se arma pacientemente para una ocasión concreta: un cumpleaños, un aniversario, un agradecimiento, o simplemente un 'te quiero'.",
  storyParagraph2: "No usamos flores de plástico desechables ni imitaciones industriales. Cada pieza es un trabajo manual único que conserva su forma y color sin marchitarse.",
  stat1Number: "100%",
  stat1Label: "Hecho a mano",
  stat2Number: "∞",
  stat2Label: "No se marchita",
  stat3Number: "1×1",
  stat3Label: "Cada pieza es única",
  // Tarjeta Instagram
  igEyebrow: "Síguenos",
  igTitle: "@dulce.eternidad7",
  igQuote: '"Conoce más de nuestros ramos, nuestras creaciones y sé parte de esta dulce historia."',
  igDescription: "Publicamos nuevos diseños, encargos personalizados y el proceso artesanal de cada flor.",
  // Footer
  footerQuote: "El arte de regalar amor eterno",
  footerContactNote: "Flores artesanales en limpia pipas.",
  footerCopyright: "Dulce Eternidad. Flores artesanales hechas con calma y con las manos.",
  // Apariencia
  primaryColor: "#8B2F4B",
  accentColor: "#C9A25B",
  bgTheme: "white",
  fontTheme: "editorial",
  // Taller y Envíos
  workshopSchedule: "Lunes a Sábado: 8:00 AM - 6:00 PM",
  workshopPrepTime: "2 a 3 días de elaboración",
  deliveryCoverage: "Envíos a todo el país y entregas locales",
};

// ── SETTINGS ──────────────────────────────────────────────────
export function getSettingsSync() {
  const saved = read(KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function getSettings() {
  const client = await getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from("settings")
        .select("*")
        .eq("id", "general")
        .maybeSingle();

      if (!error && data) {
        const extra = data.config && typeof data.config === "object" ? data.config : {};
        const s = {
          ...DEFAULT_SETTINGS,
          ...extra,
          whatsapp: data.whatsapp || extra.whatsapp || "",
          instagram: data.instagram || extra.instagram || "dulce.eternidad7",
          heroImage: data.hero_image || extra.heroImage || DEFAULT_HERO_IMAGE,
        };
        write(KEYS.settings, s);
        return s;
      }
    } catch (err) {
      console.warn("Error leyendo settings de Supabase:", err);
    }
  }

  return getSettingsSync();
}

export async function saveSettings(next) {
  const current = await getSettings();
  const updated = { ...current, ...next };

  const client = await getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from("settings")
        .upsert({
          id: "general",
          whatsapp: updated.whatsapp || "",
          instagram: updated.instagram || "dulce.eternidad7",
          hero_image: updated.heroImage || DEFAULT_HERO_IMAGE,
          config: updated,
          updated_at: new Date().toISOString(),
        });
      if (error) console.warn("Aviso al guardar settings en Supabase:", error);
    } catch (err) {
      console.error("Error guardando settings en Supabase:", err);
    }
  }

  write(KEYS.settings, updated);
  return updated;
}

// ── PRODUCTOS ─────────────────────────────────────────────────
export function getProductsSync() {
  const list = read(KEYS.products, null);
  if (!list || !Array.isArray(list) || list.length === 0) {
    write(KEYS.products, SEED_PRODUCTS);
    return SEED_PRODUCTS;
  }
  return list;
}

export async function getProducts() {
  const client = await getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        write(KEYS.products, data);
        return data;
      }
    } catch (err) {
      console.warn("Error consultando Supabase, usando respaldo local:", err);
    }
  }

  return getProductsSync();
}

export function saveProducts(list) {
  write(KEYS.products, list);
}

export async function getProduct(id) {
  if (!id) {
    const all = await getProducts();
    return all.length > 0 ? all[0] : null;
  }

  const cleanId = String(id).trim();
  const client = await getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from("products")
        .select("*")
        .eq("id", cleanId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn("Error consultando producto en Supabase:", err);
    }
  }

  const all = await getProducts();
  const match = all.find((p) => String(p.id).toLowerCase() === cleanId.toLowerCase());
  if (match) return match;
  const matchName = all.find((p) => String(p.name).toLowerCase() === cleanId.toLowerCase());
  if (matchName) return matchName;
  return all.length > 0 ? all[0] : null;
}

export async function upsertProduct(product) {
  const client = await getSupabaseClient();
  if (client) {
    try {
      const payload = {
        id: product.id,
        name: product.name,
        category: product.category,
        occasion: product.occasion,
        price: product.price,
        description: product.description,
        flowers: product.flowers,
        size: product.size,
        available: product.available !== false,
        featured: Boolean(product.featured),
        images: product.images || [],
        created_at: product.created_at || new Date().toISOString(),
      };

      const { error } = await client.from("products").upsert(payload);
      if (error) throw error;
    } catch (err) {
      console.error("Error guardando en Supabase:", err);
      // Continuamos para guardar localmente como salvaguarda
    }
  }

  const list = getProductsSync();
  const i = list.findIndex((p) => p.id === product.id);
  if (i >= 0) list[i] = product;
  else list.unshift(product);
  saveProducts(list);
}

export async function deleteProduct(id) {
  const client = await getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from("products").delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("Error eliminando de Supabase:", err);
    }
  }

  const list = getProductsSync();
  saveProducts(list.filter((p) => p.id !== id));
}

// ── SUBIDA DE IMÁGENES (SUPABASE STORAGE) ─────────────────────
export async function uploadProductImage(file) {
  const client = await getSupabaseClient();
  if (!client) {
    // Fallback a Base64 si Supabase no está conectado
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const ext = file.name.split(".").pop().toLowerCase();
  const cleanName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  const fileName = `${Date.now()}_${cleanName}.${ext}`;
  const filePath = `products/${fileName}`;

  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.warn("Aviso al subir imagen a Supabase Storage, usando Base64:", error);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const { data: publicUrlData } = client.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

// ── UTILIDADES ────────────────────────────────────────────────
export function formatPrice(price) {
  if (price === null || price === "" || price === undefined || Number.isNaN(Number(price))) {
    return "Consultar precio";
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

export function productImage(product, index = 0) {
  return product?.images?.[index] || PLACEHOLDER;
}

// ── AUTENTICACIÓN ADMIN (SUPABASE AUTH + FALLBACK) ─────────────
export function getUser() {
  return read(KEYS.user, {
    email: "admin@dulceeternidad.com",
    password: "admin",
  });
}

export function setUser(user) {
  write(KEYS.user, user);
}

export function getSession() {
  return sessionStorage.getItem(KEYS.session) || localStorage.getItem(KEYS.session);
}

export function setSession(remember) {
  const token = "auth_" + Date.now();
  sessionStorage.setItem(KEYS.session, token);
  if (remember) localStorage.setItem(KEYS.session, token);
  else localStorage.removeItem(KEYS.session);
}

export function clearSession() {
  sessionStorage.removeItem(KEYS.session);
  localStorage.removeItem(KEYS.session);
}

export function isLoggedIn() {
  return Boolean(getSession());
}

export async function loginUser(email, password, remember = true) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  const client = await getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });
      if (!error && data?.user) {
        setSession(remember);
        return data.user;
      }
      if (error && error.message !== "Invalid login credentials") {
        console.warn("Supabase Auth error:", error.message);
      }
    } catch (e) {
      console.warn("Supabase Auth error:", e);
    }
  }

  // Fallback local
  const user = getUser();
  if (user.email.toLowerCase() === cleanEmail && user.password === cleanPass) {
    setSession(remember);
    return user;
  }
  throw new Error("Credenciales inválidas. Verifica tu correo y contraseña.");
}

export async function logoutUser() {
  const client = await getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {}
  }
  clearSession();
}

export async function checkAdminSession() {
  const client = await getSupabaseClient();
  if (client) {
    try {
      const { data } = await client.auth.getSession();
      if (data?.session) {
        setSession(true);
        return true;
      }
    } catch (e) {}
  }
  return isLoggedIn();
}

export async function requireAdmin() {
  const authed = await checkAdminSession();
  if (!authed) {
    location.href = "/login";
  }
}

export function instagramUrl() {
  const handle = (getSettingsSync().instagram || "dulce.eternidad7").replace(/^@/, "");
  return "https://instagram.com/" + handle;
}

export function sanitizeWhatsAppMessage(text) {
  if (!text) return "";
  let clean = String(text);
  // Eliminar emojis
  clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F0F5}\u{1F200}-\u{1F270}\u{FE00}-\u{FE0F}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25FE}\u{25FD}\u{25FB}\u{25FC}\u{200D}\u{200C}\u{FEFF}]/gu, "");
  // Eliminar caracteres de control
  clean = clean.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
  // Normalizar espacios
  clean = clean.replace(/[ \t]+/g, " ").trim();
  return clean;
}

export function formatWhatsAppNumber(raw) {
  if (!raw) return "";
  let num = String(raw).replace(/\D/g, "");
  if (num.length === 10 && num.startsWith("3")) {
    num = "57" + num;
  }
  return num;
}

export function whatsappUrl(text, product = null) {
  const settings = getSettingsSync();
  const raw = settings.whatsapp || "573001234567";
  const num = formatWhatsAppNumber(raw);
  if (!num) return null;

  let msg = text;
  if (!msg && product) {
    const priceStr = product.price ? ` (${formatPrice(product.price)})` : "";
    msg = `Hola, me interesa pedir el ramo "${product.name}"${priceStr}. ¿Tienen disponibilidad y tiempo de entrega?`;
  } else if (!msg) {
    msg = settings.whatsappDefaultMessage || "Hola, me gustaría información sobre sus creaciones florales artesanales.";
  }

  const sanitized = sanitizeWhatsAppMessage(msg);
  return `https://wa.me/${num}?text=${encodeURIComponent(sanitized)}`;
}
