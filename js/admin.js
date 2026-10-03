import {
  CATEGORIES,
  OCCASIONS,
  getProducts,
  getProduct,
  upsertProduct,
  deleteProduct,
  formatPrice,
  productImage,
  getSettings,
  saveSettings,
  DEFAULT_HERO_IMAGE,
  DEFAULT_SETTINGS,
  requireAdmin,
  clearSession,
  uploadProductImage,
  logoutUser,
  formatWhatsAppNumber,
  sanitizeWhatsAppMessage,
  whatsappUrl,
} from "./store.js";
import { getSupabaseConfig, saveSupabaseConfig, isSupabaseConfigured } from "./config.js";
import { getSupabaseClient, resetSupabaseClient } from "./supabaseClient.js";
import { escapeHtml } from "./ui.js";

// Protect admin route
await requireAdmin();

// Shell DOM elements
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("sidebar-backdrop");
const sideToggle = document.querySelector("[data-side-toggle]");
const pageTitle = document.getElementById("page-title");
const toast = document.getElementById("admin-toast");

// User session elements
const userAvatarEl = document.getElementById("admin-user-avatar");
const userEmailEl = document.getElementById("admin-user-email");
const userRoleEl = document.getElementById("admin-user-role");

// Product modal elements
const productModal = document.getElementById("product-modal");
const confirmModal = document.getElementById("confirm-modal");
const productForm = document.getElementById("product-form");
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const imagePreviews = document.getElementById("image-previews");
const dbStatusBadge = document.getElementById("db-status-badge");
const sbCardBadge = document.getElementById("sb-card-badge");
const sbStatusBox = document.getElementById("sb-status-box");

let editingProductId = null;
let currentImages = [];
let pendingDeleteId = null;

// Toast notifications
function showToast(message, isSage = true) {
  if (!toast) return;
  toast.textContent = message;
  toast.style.borderLeftColor = isSage ? "var(--sage)" : "var(--error)";
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

// User session management
async function initUserSession() {
  const client = await getSupabaseClient();
  if (client) {
    try {
      const { data } = await client.auth.getUser();
      if (data?.user?.email) {
        const email = data.user.email;
        if (userEmailEl) userEmailEl.textContent = email;
        if (userRoleEl) userRoleEl.textContent = "Supabase Admin";
        if (userAvatarEl) {
          const parts = email.split("@")[0].split(/[._-]/);
          const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : email.slice(0, 2).toUpperCase();
          userAvatarEl.textContent = initials;
        }
        return;
      }
    } catch (e) {}
  }

  if (userEmailEl) userEmailEl.textContent = "Admin Local";
  if (userRoleEl) userRoleEl.textContent = "Modo Demo";
  if (userAvatarEl) userAvatarEl.textContent = "DE";
}

// Live Supabase status checker
async function updateSupabaseStatusUI() {
  const diagDb = document.getElementById("diag-db");
  const diagStorage = document.getElementById("diag-storage");

  if (!isSupabaseConfigured()) {
    if (dbStatusBadge) {
      dbStatusBadge.textContent = "Modo Local (Demo)";
      dbStatusBadge.className = "badge";
      dbStatusBadge.style.background = "#FAF8F5";
      dbStatusBadge.style.color = "var(--charcoal)";
      dbStatusBadge.style.border = "1px solid var(--gold-soft)";
    }
    if (sbCardBadge) {
      sbCardBadge.textContent = "Modo Local";
      sbCardBadge.className = "badge";
    }
    if (diagDb) diagDb.textContent = "Almacenamiento Local";
    return;
  }

  try {
    const client = await getSupabaseClient();
    if (!client) throw new Error("No inicializado");

    const { error } = await client.from("products").select("id").limit(1);
    if (error) throw error;

    if (dbStatusBadge) {
      dbStatusBadge.textContent = "Supabase Conectado";
      dbStatusBadge.className = "badge badge-ok";
      dbStatusBadge.style.background = "";
      dbStatusBadge.style.color = "";
      dbStatusBadge.style.border = "";
    }
    if (sbCardBadge) {
      sbCardBadge.textContent = "Conectado a la Nube";
      sbCardBadge.className = "badge badge-ok";
    }
    if (diagDb) {
      diagDb.textContent = "Conectado (PostgreSQL)";
      diagDb.style.color = "var(--sage)";
    }
    if (diagStorage) {
      diagStorage.textContent = "catalog-images (Activo)";
      diagStorage.style.color = "var(--sage)";
    }
  } catch (err) {
    if (dbStatusBadge) {
      dbStatusBadge.textContent = "Supabase Desconectado";
      dbStatusBadge.className = "badge badge-off";
      dbStatusBadge.style.background = "";
      dbStatusBadge.style.color = "";
      dbStatusBadge.style.border = "";
    }
    if (sbCardBadge) {
      sbCardBadge.textContent = "Error de conexión";
      sbCardBadge.className = "badge badge-off";
    }
    if (diagDb) {
      diagDb.textContent = "Desconectado";
      diagDb.style.color = "var(--error)";
    }
  }
}

// Navigation & panels
const PANEL_TITLES = {
  resumen: "Resumen del catálogo",
  productos: "Gestión de Productos",
  consultas: "Pedidos & WhatsApp",
  "sec-envios": "Taller, Horarios & Envíos",
  "sec-plantillas-wa": "Plantillas Rápidas de WhatsApp",
  "sec-hero": "Banner Principal (Hero)",
  "sec-marquee": "Cinta de Anuncios",
  "sec-promociones": "Colección & Promociones",
  "sec-historia": "Historia y Valores",
  "sec-menu": "Menú y Cabecera",
  "sec-footer": "Pie de Página (Footer)",
  "sec-estilo": "Apariencia y Colores",
  configuracion: "Base de Datos (Supabase)",
};

async function switchPanel(panelId) {
  const panels = document.querySelectorAll(".panel");
  const navLinks = sidebar.querySelectorAll("nav a");

  panels.forEach((p) => p.classList.remove("active"));
  navLinks.forEach((a) => a.removeAttribute("aria-current"));

  const targetPanel = document.getElementById("panel-" + panelId) || document.getElementById("panel-resumen");
  targetPanel?.classList.add("active");

  const activeLink = sidebar.querySelector(`nav a[data-panel="${panelId}"]`) || sidebar.querySelector('nav a[data-panel="resumen"]');
  if (activeLink) {
    activeLink.setAttribute("aria-current", "page");
  }

  if (pageTitle) {
    pageTitle.textContent = PANEL_TITLES[panelId] || "Panel de Control";
  }

  closeSidebar();

  if (panelId === "resumen") await renderResumen();
  else if (panelId === "productos") await renderProductsTable();
  else if (panelId === "consultas") await loadWaConfig();
  else if (panelId === "sec-envios") await loadEnviosConfig();
  else if (panelId === "sec-plantillas-wa") await loadPlantillasWa();
  else if (panelId === "sec-hero") await loadHeroConfig();
  else if (panelId === "sec-marquee") await loadMarqueeConfig();
  else if (panelId === "sec-promociones") await loadPromoConfig();
  else if (panelId === "sec-historia") await loadHistoriaConfig();
  else if (panelId === "sec-menu") await loadMenuConfig();
  else if (panelId === "sec-footer") await loadFooterConfig();
  else if (panelId === "sec-estilo") await loadEstiloConfig();
  else if (panelId === "configuracion") await loadSupabaseConfigPanel();
}

function openSidebar() {
  sidebar.classList.add("open");
  backdrop.classList.add("show");
  sideToggle?.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  backdrop.classList.remove("show");
  sideToggle?.setAttribute("aria-expanded", "false");
}

sideToggle?.addEventListener("click", () => {
  if (sidebar.classList.contains("open")) closeSidebar();
  else openSidebar();
});
backdrop?.addEventListener("click", closeSidebar);

document.querySelectorAll("[data-panel]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const panelId = link.getAttribute("data-panel");
    window.location.hash = panelId;
    switchPanel(panelId);
  });
});

window.addEventListener("hashchange", () => {
  const h = window.location.hash.replace(/^#/, "");
  if (h && PANEL_TITLES[h]) {
    switchPanel(h);
  }
});

document.getElementById("btn-quick-new-product")?.addEventListener("click", () => {
  openProductModal(null);
});

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  if (confirm("¿Deseas cerrar tu sesión de administrador?")) {
    await logoutUser();
    window.location.href = "./login.html";
  }
});

// Summary dashboard
async function renderResumen() {
  const products = await getProducts();
  const total = products.length;
  const active = products.filter((p) => p.available !== false).length;
  const out = total - active;
  const cats = new Set(products.map((p) => p.category)).size;

  const totalEl = document.getElementById("stat-total");
  const activeEl = document.getElementById("stat-active");
  const outEl = document.getElementById("stat-out");
  const catsEl = document.getElementById("stat-cats");

  if (totalEl) totalEl.textContent = total;
  if (activeEl) activeEl.textContent = active;
  if (outEl) outEl.textContent = out;
  if (catsEl) catsEl.textContent = cats || 4;

  const recentList = document.getElementById("recent-list");
  if (recentList) {
    const recents = products.slice(-5).reverse();
    if (recents.length === 0) {
      recentList.innerHTML = '<p class="muted" style="margin: 8px 0;">No hay ramos registrados todavía.</p>';
    } else {
      recentList.innerHTML = recents
        .map(
          (p) => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #FAF8F5; border-radius: var(--r-sm); border: 1px solid var(--gold-soft);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${escapeHtml(productImage(p))}" style="width: 36px; height: 44px; object-fit: cover; border-radius: 4px; border: 1px solid var(--gold-soft);">
              <div>
                <strong style="color: var(--burgundy); font-size: 0.92rem;">${escapeHtml(p.name)}</strong>
                <span class="muted" style="display: block; font-size: 0.76rem;">${escapeHtml(p.category)} · ${formatPrice(p.price)}</span>
              </div>
            </div>
            <span class="badge ${p.available !== false ? "badge-ok" : "badge-off"}" style="font-size: 0.72rem;">
              ${p.available !== false ? "Disponible" : "Agotado"}
            </span>
          </div>
        `
        )
        .join("");
    }
  }
}

// Products list management
const searchInput = document.getElementById("admin-search");
const catFilter = document.getElementById("admin-cat-filter");
const productsTbody = document.getElementById("products-tbody");

function populateCatFilter() {
  if (!catFilter) return;
  catFilter.innerHTML = '<option value="">Todas las categorías</option>';
  CATEGORIES.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    catFilter.appendChild(opt);
  });
}

async function renderProductsTable() {
  populateCatFilter();
  let list = await getProducts();

  const q = (searchInput?.value || "").trim().toLowerCase();
  const cat = catFilter?.value || "";

  if (cat) {
    list = list.filter((p) => p.category === cat);
  }
  if (q) {
    list = list.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.flowers || "").toLowerCase().includes(q)
    );
  }

  if (!productsTbody) return;

  if (list.length === 0) {
    productsTbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 32px;" class="muted">
          No hay productos que coincidan con los filtros.
        </td>
      </tr>
    `;
    return;
  }

  productsTbody.innerHTML = list
    .map(
      (p) => `
      <tr id="row-${escapeHtml(p.id)}">
        <td>
          <img class="mini" src="${escapeHtml(productImage(p))}" alt="${escapeHtml(p.name)}">
        </td>
        <td>
          <strong style="color: var(--burgundy);">${escapeHtml(p.name)}</strong>
          ${p.featured ? '<span class="badge badge-featured" style="position:static; margin-left:6px; font-size:0.62rem; padding: 2px 6px;">Destacado</span>' : ""}
        </td>
        <td><span class="badge badge-cat">${escapeHtml(p.category)}</span></td>
        <td>${formatPrice(p.price)}</td>
        <td>
          <button type="button" class="btn-toggle-avail badge ${p.available !== false ? "badge-ok" : "badge-off"}" data-id="${escapeHtml(p.id)}" style="cursor: pointer; border: 1px solid var(--gold-soft); background: none;" title="Haz clic para alternar disponibilidad">
            ${p.available !== false ? "Disponible ✓" : "Agotado ✕"}
          </button>
        </td>
        <td style="text-align: right;">
          <div class="row-actions" style="justify-content: flex-end;">
            <button class="btn btn-secondary btn-edit-prod" data-id="${escapeHtml(p.id)}" style="padding: 4px 10px; font-size: 0.8rem;">
              Editar
            </button>
            <button class="btn btn-secondary btn-del-prod" data-id="${escapeHtml(p.id)}" style="padding: 4px 10px; font-size: 0.8rem; color: var(--error);">
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  // Direct availability toggle
  productsTbody.querySelectorAll(".btn-toggle-avail").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pId = btn.getAttribute("data-id");
      const prod = await getProduct(pId);
      if (prod) {
        prod.available = prod.available === false;
        await upsertProduct(prod);
        showToast(`${prod.name}: ${prod.available ? "Disponible" : "Agotado"}`);
        await renderProductsTable();
      }
    });
  });

  productsTbody.querySelectorAll(".btn-edit-prod").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pId = btn.getAttribute("data-id");
      const product = await getProduct(pId);
      if (product) openProductModal(product);
    });
  });

  productsTbody.querySelectorAll(".btn-del-prod").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pId = btn.getAttribute("data-id");
      pendingDeleteId = pId;
      confirmModal.classList.add("open");
    });
  });
}

searchInput?.addEventListener("input", renderProductsTable);
catFilter?.addEventListener("change", renderProductsTable);

// Delete confirmation modal
document.getElementById("confirm-cancel")?.addEventListener("click", () => {
  confirmModal.classList.remove("open");
  pendingDeleteId = null;
});

document.getElementById("confirm-delete")?.addEventListener("click", async () => {
  if (pendingDeleteId) {
    await deleteProduct(pendingDeleteId);
    confirmModal.classList.remove("open");
    pendingDeleteId = null;
    showToast("Producto eliminado del catálogo", false);
    await renderProductsTable();
    await renderResumen();
  }
});

// Modal step pagination (Paso 1 y Paso 2 sin scroll)
function setModalStep(step) {
  const tab1 = document.getElementById("tab-step-1");
  const tab2 = document.getElementById("tab-step-2");
  const pane1 = document.getElementById("pane-step-1");
  const pane2 = document.getElementById("pane-step-2");

  if (step === 1) {
    tab1?.classList.add("active");
    tab2?.classList.remove("active");
    pane1?.classList.add("active");
    pane2?.classList.remove("active");
  } else {
    // Validar nombre antes de pasar
    const nameVal = (document.getElementById("f-name")?.value || "").trim();
    if (!nameVal) {
      alert("Por favor ingresa un nombre para el ramo antes de continuar.");
      document.getElementById("f-name")?.focus();
      return;
    }
    tab1?.classList.remove("active");
    tab2?.classList.add("active");
    pane1?.classList.remove("active");
    pane2?.classList.add("active");
  }
}

document.getElementById("btn-next-step")?.addEventListener("click", () => setModalStep(2));
document.getElementById("btn-prev-step")?.addEventListener("click", () => setModalStep(1));
document.getElementById("tab-step-1")?.addEventListener("click", () => setModalStep(1));
document.getElementById("tab-step-2")?.addEventListener("click", () => setModalStep(2));
document.getElementById("btn-close-modal")?.addEventListener("click", closeProductModal);

function populateModalSelects() {
  const catSel = document.getElementById("f-cat");
  const occSel = document.getElementById("f-occ");
  if (catSel && catSel.children.length === 0) {
    CATEGORIES.forEach((c) => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      catSel.appendChild(o);
    });
  }
  if (occSel && occSel.children.length === 0) {
    OCCASIONS.forEach((occ) => {
      const o = document.createElement("option");
      o.value = occ;
      o.textContent = occ;
      occSel.appendChild(o);
    });
  }
}

function openProductModal(product = null) {
  populateModalSelects();

  editingProductId = product ? product.id : "de-" + Date.now();
  currentImages = product && Array.isArray(product.images) ? [...product.images] : [];

  document.getElementById("form-title").textContent = product ? "Editar producto" : "Nuevo producto";
  document.getElementById("f-name").value = product?.name || "";
  document.getElementById("f-cat").value = product?.category || CATEGORIES[0];
  document.getElementById("f-occ").value = product?.occasion || OCCASIONS[0];
  document.getElementById("f-price").value = product?.price !== null && product?.price !== undefined ? product.price : "";
  document.getElementById("f-desc").value = product?.description || "";
  document.getElementById("f-flowers").value = product?.flowers || "";
  document.getElementById("f-size").value = product?.size || "";
  document.getElementById("f-avail").checked = product ? product.available !== false : true;
  document.getElementById("f-feat").checked = product?.featured || false;

  renderImagePreviews();
  setModalStep(1);
  productModal.classList.add("open");
  document.getElementById("f-name").focus();
}

function closeProductModal() {
  productModal.classList.remove("open");
  editingProductId = null;
  currentImages = [];
}

document.getElementById("btn-new-product")?.addEventListener("click", () => openProductModal(null));
document.getElementById("btn-cancel-modal")?.addEventListener("click", closeProductModal);

productModal?.addEventListener("click", (e) => {
  if (e.target === productModal) closeProductModal();
});

dropzone?.addEventListener("click", () => fileInput.click());
dropzone?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});
dropzone?.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.style.backgroundColor = "var(--blush)";
});
dropzone?.addEventListener("dragleave", () => {
  dropzone.style.backgroundColor = "var(--cream)";
});

async function handleFilesUpload(files) {
  if (!files || files.length === 0) return;
  const dropText = dropzone.querySelector("p");
  if (dropText) dropText.textContent = "Subiendo fotos a la nube...";
  dropzone.style.opacity = "0.6";

  try {
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      const uploadedUrl = await uploadProductImage(f);
      currentImages.push(uploadedUrl);
    }
    renderImagePreviews();
    showToast("Foto subida correctamente");
  } catch (err) {
    console.error("Error al procesar fotos:", err);
    showToast("Error subiendo foto", false);
  } finally {
    dropzone.style.opacity = "1";
    if (dropText) dropText.textContent = "Arrastra tus fotos o haz clic para subir";
    fileInput.value = "";
  }
}

fileInput?.addEventListener("change", (e) => handleFilesUpload(e.target.files));
dropzone?.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.style.backgroundColor = "var(--cream)";
  handleFilesUpload(e.dataTransfer.files);
});

function renderImagePreviews() {
  if (!imagePreviews) return;
  imagePreviews.innerHTML = currentImages
    .map(
      (img, i) => `
      <div class="preview-item">
        <img src="${escapeHtml(img)}" alt="Foto ${i + 1}">
        <button type="button" data-remove-img="${i}" aria-label="Eliminar foto">&times;</button>
      </div>
    `
    )
    .join("");

  imagePreviews.querySelectorAll("[data-remove-img]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute("data-remove-img"), 10);
      currentImages.splice(idx, 1);
      renderImagePreviews();
    });
  });
}

// Product form submission
productForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("f-name").value.trim();
  const category = document.getElementById("f-cat").value;
  const occasion = document.getElementById("f-occ").value;
  const priceVal = document.getElementById("f-price").value;
  const price = priceVal !== "" ? parseFloat(priceVal) : null;
  const description = document.getElementById("f-desc").value.trim();
  const flowers = document.getElementById("f-flowers").value.trim();
  const size = document.getElementById("f-size").value.trim();
  const available = document.getElementById("f-avail").checked;
  const featured = document.getElementById("f-feat").checked;

  const saveBtn = document.getElementById("btn-save-product");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";
  }

  try {
    await upsertProduct({
      id: editingProductId,
      name,
      category,
      occasion,
      price,
      description,
      flowers,
      size,
      available,
      featured,
      images: currentImages.length > 0 ? currentImages : ["./assets/placeholder.svg"],
    });

    closeProductModal();
    await renderProductsTable();
    await renderResumen();
    showToast("Producto guardado correctamente");
  } catch (err) {
    console.error("Error guardando producto:", err);
    showToast("Error al guardar producto", false);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar producto";
    }
  }
});

// WhatsApp orders panel & test shortener
async function loadWaConfig() {
  const settings = await getSettings();
  const numInput = document.getElementById("cfg-wa-num");
  const msgInput = document.getElementById("cfg-wa-default-msg");
  const prevText = document.getElementById("wa-preview-text");
  const prevBtn = document.getElementById("wa-preview-test-btn");
  const cleanBoxMsg = document.getElementById("wa-clean-preview-msg");

  const num = settings.whatsapp || DEFAULT_SETTINGS.whatsapp;
  const msg = settings.whatsappDefaultMessage || DEFAULT_SETTINGS.whatsappDefaultMessage;

  if (numInput) numInput.value = num;
  if (msgInput) msgInput.value = msg;

  const updatePreview = () => {
    const rawNum = formatWhatsAppNumber(numInput?.value || "");
    const curMsg = msgInput?.value || "";
    const cleanMsg = sanitizeWhatsAppMessage(curMsg);

    if (cleanBoxMsg) cleanBoxMsg.textContent = cleanMsg || "(Mensaje vacío)";

    if (rawNum) {
      const url = `https://wa.me/${rawNum}?text=${encodeURIComponent(cleanMsg)}`;
      if (prevText) prevText.textContent = url;
      if (prevBtn) {
        prevBtn.href = url;
        prevBtn.style.opacity = "1";
        prevBtn.style.pointerEvents = "auto";
      }
    } else {
      if (prevText) prevText.textContent = "Ingresa un número de WhatsApp con código de país.";
      if (prevBtn) {
        prevBtn.href = "#";
        prevBtn.style.opacity = "0.5";
        prevBtn.style.pointerEvents = "none";
      }
    }
  };

  numInput?.addEventListener("input", updatePreview);
  msgInput?.addEventListener("input", updatePreview);
  updatePreview();
}

document.getElementById("wa-config-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const rawNum = formatWhatsAppNumber(document.getElementById("cfg-wa-num")?.value || "");
  const defaultMsg = sanitizeWhatsAppMessage(document.getElementById("cfg-wa-default-msg")?.value || "");

  await saveSettings({
    whatsapp: rawNum,
    whatsappDefaultMessage: defaultMsg,
    waDefaultMsg: defaultMsg,
  });

  showToast("Configuración de WhatsApp guardada");
});

// Workshop & delivery policies
async function loadEnviosConfig() {
  const settings = await getSettings();
  const hoursInput = document.getElementById("f-workshop-hours");
  const prepInput = document.getElementById("f-workshop-prep");
  const covInput = document.getElementById("f-delivery-coverage");

  if (hoursInput) hoursInput.value = settings.workshopSchedule || DEFAULT_SETTINGS.workshopSchedule;
  if (prepInput) prepInput.value = settings.workshopPrepTime || DEFAULT_SETTINGS.workshopPrepTime;
  if (covInput) covInput.value = settings.deliveryCoverage || DEFAULT_SETTINGS.deliveryCoverage;

  const updatePreview = () => {
    const prevHours = document.getElementById("prev-workshop-hours");
    const prevPrep = document.getElementById("prev-workshop-prep");
    const prevCov = document.getElementById("prev-delivery-cov");
    if (prevHours) prevHours.textContent = hoursInput?.value || "";
    if (prevPrep) prevPrep.textContent = prepInput?.value || "";
    if (prevCov) prevCov.textContent = covInput?.value || "";
  };

  [hoursInput, prepInput, covInput].forEach((el) => el?.addEventListener("input", updatePreview));
  updatePreview();
}

document.getElementById("envios-config-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await saveSettings({
    workshopSchedule: document.getElementById("f-workshop-hours")?.value || "",
    workshopPrepTime: document.getElementById("f-workshop-prep")?.value || "",
    deliveryCoverage: document.getElementById("f-delivery-coverage")?.value || "",
  });
  showToast("Políticas de taller y envíos guardadas");
});

// WhatsApp template shortcuts
async function loadPlantillasWa() {
  const settings = await getSettings();
  const rawNum = formatWhatsAppNumber(settings.whatsapp || "573001234567");

  const templates = {
    cotizacion: "Hola! Me gustaría cotizar un ramo artesanal personalizado en limpia pipas con mis flores y colores favoritos.",
    ocasion: "Hola Dulce Eternidad, tengo una fecha especial próxima y quisiera encargar un ramo que no se marchite para regalo.",
    envio: "Hola, me gustaría saber los tiempos de entrega y el costo de envío a mi ciudad para un ramo artesanal."
  };

  document.querySelectorAll(".btn-wa-template").forEach((btn) => {
    const tplKey = btn.dataset.tpl;
    const msg = templates[tplKey] || "";
    const clean = sanitizeWhatsAppMessage(msg);
    btn.href = `https://wa.me/${rawNum}?text=${encodeURIComponent(clean)}`;
  });
}

// Hero banner config
async function loadHeroConfig() {
  const settings = await getSettings();

  const ebInput = document.getElementById("f-hero-eyebrow");
  const titleInput = document.getElementById("f-hero-title");
  const subInput = document.getElementById("f-hero-subtitle");
  const b1TextInput = document.getElementById("f-hero-btn1-text");
  const b1LinkInput = document.getElementById("f-hero-btn1-link");
  const b2TextInput = document.getElementById("f-hero-btn2-text");
  const b2LinkInput = document.getElementById("f-hero-btn2-link");
  const imgInput = document.getElementById("f-hero-image");

  if (ebInput) ebInput.value = settings.heroEyebrow || DEFAULT_SETTINGS.heroEyebrow;
  if (titleInput) titleInput.value = settings.heroTitle || DEFAULT_SETTINGS.heroTitle;
  if (subInput) subInput.value = settings.heroSubtitle || DEFAULT_SETTINGS.heroSubtitle;
  if (b1TextInput) b1TextInput.value = settings.heroBtnPrimaryText || DEFAULT_SETTINGS.heroBtnPrimaryText;
  if (b1LinkInput) b1LinkInput.value = settings.heroBtnPrimaryLink || DEFAULT_SETTINGS.heroBtnPrimaryLink;
  if (b2TextInput) b2TextInput.value = settings.heroBtnSecondaryText || DEFAULT_SETTINGS.heroBtnSecondaryText;
  if (b2LinkInput) b2LinkInput.value = settings.heroBtnSecondaryLink || DEFAULT_SETTINGS.heroBtnSecondaryLink;
  if (imgInput) imgInput.value = settings.heroImage || DEFAULT_HERO_IMAGE;

  const prevBg = document.getElementById("hero-prev-bg");
  const prevEb = document.getElementById("hero-prev-eyebrow");
  const prevTitle = document.getElementById("hero-prev-title");
  const prevSub = document.getElementById("hero-prev-sub");
  const prevB1 = document.getElementById("hero-prev-b1");
  const prevB2 = document.getElementById("hero-prev-b2");

  const updatePreview = () => {
    if (prevBg) prevBg.style.backgroundImage = `url("${imgInput?.value || DEFAULT_HERO_IMAGE}")`;
    if (prevEb) prevEb.textContent = ebInput?.value || "";
    if (prevTitle) {
      const raw = titleInput?.value || "";
      prevTitle.innerHTML = raw.includes("_") ? escapeHtml(raw).replace(/_([^_]+)_/g, "<em>$1</em>") : escapeHtml(raw);
    }
    if (prevSub) prevSub.textContent = subInput?.value || "";
    if (prevB1) prevB1.textContent = b1TextInput?.value || "Ver catálogo";
    if (prevB2) prevB2.textContent = b2TextInput?.value || "Nuestra historia";
  };

  [ebInput, titleInput, subInput, b1TextInput, b2TextInput, imgInput].forEach((el) => {
    el?.addEventListener("input", updatePreview);
  });
  updatePreview();

  document.getElementById("btn-hero-reset-img")?.addEventListener("click", () => {
    if (imgInput) {
      imgInput.value = DEFAULT_HERO_IMAGE;
      updatePreview();
    }
  });
}

document.getElementById("hero-config-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await saveSettings({
    heroEyebrow: document.getElementById("f-hero-eyebrow")?.value || "",
    heroTitle: document.getElementById("f-hero-title")?.value || "",
    heroSubtitle: document.getElementById("f-hero-subtitle")?.value || "",
    heroBtnPrimaryText: document.getElementById("f-hero-btn1-text")?.value || "",
    heroBtnPrimaryLink: document.getElementById("f-hero-btn1-link")?.value || "",
    heroBtnSecondaryText: document.getElementById("f-hero-btn2-text")?.value || "",
    heroBtnSecondaryLink: document.getElementById("f-hero-btn2-link")?.value || "",
    heroImage: document.getElementById("f-hero-image")?.value || DEFAULT_HERO_IMAGE,
  });
  showToast("Banner principal guardado");
});

// Marquee announcement tape
async function loadMarqueeConfig() {
  const settings = await getSettings();
  const rawInput = document.getElementById("f-marquee-raw");
  const prevContainer = document.getElementById("marquee-preview-content");

  const items = Array.isArray(settings.marqueeItems) && settings.marqueeItems.length > 0 ? settings.marqueeItems : DEFAULT_SETTINGS.marqueeItems;
  if (rawInput) rawInput.value = items.join("\n");

  const updatePreview = () => {
    const lines = (rawInput?.value || "")
      .split(/\n|,/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (prevContainer) {
      prevContainer.innerHTML = lines.map((item) => `<span>${escapeHtml(item)}</span>`).join(" · ");
    }
  };

  rawInput?.addEventListener("input", updatePreview);
  updatePreview();
}

document.getElementById("marquee-config-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const lines = (document.getElementById("f-marquee-raw")?.value || "")
    .split(/\n|,/)
    .map((l) => l.trim())
    .filter(Boolean);

  await saveSettings({
    marqueeItems: lines.length > 0 ? lines : DEFAULT_SETTINGS.marqueeItems,
  });
  showToast("Cinta de anuncios guardada");
});

// Configurable promotion & best sellers section
async function loadPromoConfig() {
  const settings = await getSettings();

  const enabledCheck = document.getElementById("f-promo-enabled");
  const typeSelect = document.getElementById("f-promo-type");
  const badgeInput = document.getElementById("f-promo-badge");
  const ebInput = document.getElementById("f-promo-eyebrow");
  const titleInput = document.getElementById("f-promo-title");
  const subInput = document.getElementById("f-promo-subtitle");

  if (enabledCheck) enabledCheck.checked = settings.promoSectionEnabled !== false;
  if (typeSelect) typeSelect.value = settings.promoSectionType || "promociones";
  if (badgeInput) badgeInput.value = settings.promoSectionBadge || DEFAULT_SETTINGS.promoSectionBadge;
  if (ebInput) ebInput.value = settings.promoSectionEyebrow || DEFAULT_SETTINGS.promoSectionEyebrow;
  if (titleInput) titleInput.value = settings.promoSectionTitle || DEFAULT_SETTINGS.promoSectionTitle;
  if (subInput) subInput.value = settings.promoSectionSubtitle || DEFAULT_SETTINGS.promoSectionSubtitle;

  const updatePreview = () => {
    const isEnabled = enabledCheck ? enabledCheck.checked : true;
    const badgeText = badgeInput?.value || "Edición Limitada";
    const ebText = ebInput?.value || "Colección Especial";
    const titleText = titleInput?.value || "Creaciones en Promoción";
    const subText = subInput?.value || "";
    const filterText = typeSelect?.options[typeSelect.selectedIndex]?.text || "Promociones";

    const prevStatus = document.getElementById("promo-prev-status");
    if (prevStatus) {
      prevStatus.textContent = isEnabled ? "Activo" : "Inactivo";
      prevStatus.className = isEnabled ? "badge badge-ok" : "badge badge-off";
    }
    const prevBadge = document.getElementById("prev-promo-badge");
    if (prevBadge) prevBadge.textContent = badgeText;
    const prevEb = document.getElementById("prev-promo-eyebrow");
    if (prevEb) prevEb.textContent = ebText;
    const prevTitle = document.getElementById("prev-promo-title");
    if (prevTitle) prevTitle.textContent = titleText;
    const prevSub = document.getElementById("prev-promo-sub");
    if (prevSub) prevSub.textContent = subText;
    const prevFilter = document.getElementById("prev-promo-filter");
    if (prevFilter) prevFilter.textContent = filterText;
  };

  [enabledCheck, typeSelect, badgeInput, ebInput, titleInput, subInput].forEach((el) => {
    el?.addEventListener("input", updatePreview);
    el?.addEventListener("change", updatePreview);
  });
  updatePreview();
}

document.getElementById("promo-config-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await saveSettings({
    promoSectionEnabled: document.getElementById("f-promo-enabled")?.checked ?? true,
    promoSectionType: document.getElementById("f-promo-type")?.value || "promociones",
    promoSectionBadge: document.getElementById("f-promo-badge")?.value || "",
    promoSectionEyebrow: document.getElementById("f-promo-eyebrow")?.value || "",
    promoSectionTitle: document.getElementById("f-promo-title")?.value || "",
    promoSectionSubtitle: document.getElementById("f-promo-subtitle")?.value || "",
  });
  showToast("Colección y promociones guardadas");
});

// Story & values
async function loadHistoriaConfig() {
  const settings = await getSettings();

  const ebInput = document.getElementById("f-hist-eyebrow");
  const titleInput = document.getElementById("f-hist-title");
  const p1Input = document.getElementById("f-hist-p1");
  const p2Input = document.getElementById("f-hist-p2");
  const s1nInput = document.getElementById("f-stat1-n");
  const s1lInput = document.getElementById("f-stat1-l");
  const s2nInput = document.getElementById("f-stat2-n");
  const s2lInput = document.getElementById("f-stat2-l");
  const s3nInput = document.getElementById("f-stat3-n");
  const s3lInput = document.getElementById("f-stat3-l");
  const quoteInput = document.getElementById("f-ig-quote");
  const descInput = document.getElementById("f-ig-desc");

  if (ebInput) ebInput.value = settings.storyEyebrow || DEFAULT_SETTINGS.storyEyebrow;
  if (titleInput) titleInput.value = settings.storyTitle || DEFAULT_SETTINGS.storyTitle;
  if (p1Input) p1Input.value = settings.storyParagraph1 || DEFAULT_SETTINGS.storyParagraph1;
  if (p2Input) p2Input.value = settings.storyParagraph2 || DEFAULT_SETTINGS.storyParagraph2;
  if (s1nInput) s1nInput.value = settings.stat1Number || DEFAULT_SETTINGS.stat1Number;
  if (s1lInput) s1lInput.value = settings.stat1Label || DEFAULT_SETTINGS.stat1Label;
  if (s2nInput) s2nInput.value = settings.stat2Number || DEFAULT_SETTINGS.stat2Number;
  if (s2lInput) s2lInput.value = settings.stat2Label || DEFAULT_SETTINGS.stat2Label;
  if (s3nInput) s3nInput.value = settings.stat3Number || DEFAULT_SETTINGS.stat3Number;
  if (s3lInput) s3lInput.value = settings.stat3Label || DEFAULT_SETTINGS.stat3Label;
  if (quoteInput) quoteInput.value = settings.igQuote || DEFAULT_SETTINGS.igQuote;
  if (descInput) descInput.value = settings.igDescription || DEFAULT_SETTINGS.igDescription;

  const updatePreview = () => {
    document.getElementById("prev-hist-eb").textContent = ebInput?.value || "";
    document.getElementById("prev-hist-title").textContent = titleInput?.value || "";
    document.getElementById("prev-hist-p").textContent = p1Input?.value || "";
    document.getElementById("prev-stat1-n").textContent = s1nInput?.value || "";
    document.getElementById("prev-stat1-l").textContent = s1lInput?.value || "";
    document.getElementById("prev-stat2-n").textContent = s2nInput?.value || "";
    document.getElementById("prev-stat2-l").textContent = s2lInput?.value || "";
    document.getElementById("prev-stat3-n").textContent = s3nInput?.value || "";
    document.getElementById("prev-stat3-l").textContent = s3lInput?.value || "";
  };

  [ebInput, titleInput, p1Input, s1nInput, s1lInput, s2nInput, s2lInput, s3nInput, s3lInput].forEach((el) => {
    el?.addEventListener("input", updatePreview);
  });
  updatePreview();
}

document.getElementById("historia-config-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await saveSettings({
    storyEyebrow: document.getElementById("f-hist-eyebrow")?.value || "",
    storyTitle: document.getElementById("f-hist-title")?.value || "",
    storyParagraph1: document.getElementById("f-hist-p1")?.value || "",
    storyParagraph2: document.getElementById("f-hist-p2")?.value || "",
    stat1Number: document.getElementById("f-stat1-n")?.value || "",
    stat1Label: document.getElementById("f-stat1-l")?.value || "",
    stat2Number: document.getElementById("f-stat2-n")?.value || "",
    stat2Label: document.getElementById("f-stat2-l")?.value || "",
    stat3Number: document.getElementById("f-stat3-n")?.value || "",
    stat3Label: document.getElementById("f-stat3-l")?.value || "",
    igQuote: document.getElementById("f-ig-quote")?.value || "",
    igDescription: document.getElementById("f-ig-desc")?.value || "",
  });
  showToast("Historia y valores guardados");
});

// Menu header config
async function loadMenuConfig() {
  const settings = await getSettings();
  const nameInput = document.getElementById("f-brand-name");
  const subInput = document.getElementById("f-brand-sub");

  if (nameInput) nameInput.value = settings.brandName || DEFAULT_SETTINGS.brandName;
  if (subInput) subInput.value = settings.brandSubtitle || DEFAULT_SETTINGS.brandSubtitle;

  const updatePreview = () => {
    document.getElementById("prev-brand-name").textContent = nameInput?.value || "";
    document.getElementById("prev-brand-sub").textContent = subInput?.value || "";
  };

  nameInput?.addEventListener("input", updatePreview);
  subInput?.addEventListener("input", updatePreview);
  updatePreview();
}

document.getElementById("menu-config-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await saveSettings({
    brandName: document.getElementById("f-brand-name")?.value || "",
    brandSubtitle: document.getElementById("f-brand-sub")?.value || "",
  });
  showToast("Cabecera de tienda guardada");
});

// Footer config
async function loadFooterConfig() {
  const settings = await getSettings();
  const quoteInput = document.getElementById("f-footer-quote");
  const noteInput = document.getElementById("f-footer-note");
  const igInput = document.getElementById("f-footer-ig");
  const copyInput = document.getElementById("f-footer-copy");

  if (quoteInput) quoteInput.value = settings.footerQuote || DEFAULT_SETTINGS.footerQuote;
  if (noteInput) noteInput.value = settings.footerContactNote || DEFAULT_SETTINGS.footerContactNote;
  if (igInput) igInput.value = settings.instagram || DEFAULT_SETTINGS.instagram;
  if (copyInput) copyInput.value = settings.footerCopyright || DEFAULT_SETTINGS.footerCopyright;

  const updatePreview = () => {
    document.getElementById("prev-footer-quote").textContent = `"${quoteInput?.value || ""}"`;
    document.getElementById("prev-footer-note").textContent = noteInput?.value || "";
    document.getElementById("prev-footer-ig").textContent = "@" + (igInput?.value || "").replace(/^@/, "");
    document.getElementById("prev-footer-copy").textContent = copyInput?.value || "";
  };

  [quoteInput, noteInput, igInput, copyInput].forEach((el) => el?.addEventListener("input", updatePreview));
  updatePreview();
}

document.getElementById("footer-config-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await saveSettings({
    footerQuote: document.getElementById("f-footer-quote")?.value || "",
    footerContactNote: document.getElementById("f-footer-note")?.value || "",
    instagram: document.getElementById("f-footer-ig")?.value || "",
    footerCopyright: document.getElementById("f-footer-copy")?.value || "",
  });
  showToast("Pie de página guardado");
});

// Appearance & color palette
async function loadEstiloConfig() {
  const settings = await getSettings();
  const priInput = document.getElementById("f-color-primary");
  const priHex = document.getElementById("f-color-primary-hex");
  const accInput = document.getElementById("f-color-accent");
  const accHex = document.getElementById("f-color-accent-hex");
  const bgSelect = document.getElementById("f-theme-bg");
  const fontSelect = document.getElementById("f-theme-font");

  const curPri = settings.primaryColor || DEFAULT_SETTINGS.primaryColor;
  const curAcc = settings.accentColor || DEFAULT_SETTINGS.accentColor;

  if (priInput) priInput.value = curPri;
  if (priHex) priHex.value = curPri;
  if (accInput) accInput.value = curAcc;
  if (accHex) accHex.value = curAcc;
  if (bgSelect) bgSelect.value = settings.bgTheme || "white";
  if (fontSelect) fontSelect.value = settings.fontTheme || "editorial";

  const updatePreview = () => {
    const pri = priHex?.value || "#8B2F4B";
    const acc = accHex?.value || "#C9A25B";
    const bg = bgSelect?.value || "white";
    const font = fontSelect?.value || "editorial";

    const prevBox = document.getElementById("style-preview-box");
    const prevBadge = document.getElementById("prev-style-badge");
    const prevHead = document.getElementById("prev-style-heading");
    const prevBtn = document.getElementById("prev-style-btn");

    if (prevBox) {
      prevBox.style.background = bg === "cream" ? "#FDF5EE" : "#FFFFFF";
      prevBox.style.borderColor = acc;
    }
    if (prevHead) {
      prevHead.style.color = pri;
      prevHead.style.fontFamily = font === "modern" ? "'Manrope', sans-serif" : "'EB Garamond', serif";
    }
    if (prevBadge) {
      prevBadge.style.color = pri;
    }
    if (prevBtn) {
      prevBtn.style.background = pri;
      prevBtn.style.borderColor = pri;
    }
  };

  priInput?.addEventListener("input", () => {
    if (priHex) priHex.value = priInput.value;
    updatePreview();
  });
  priHex?.addEventListener("input", () => {
    if (priInput && /^#[0-9A-Fa-f]{6}$/.test(priHex.value)) priInput.value = priHex.value;
    updatePreview();
  });
  accInput?.addEventListener("input", () => {
    if (accHex) accHex.value = accInput.value;
    updatePreview();
  });
  accHex?.addEventListener("input", () => {
    if (accInput && /^#[0-9A-Fa-f]{6}$/.test(accHex.value)) accInput.value = accHex.value;
    updatePreview();
  });
  bgSelect?.addEventListener("change", updatePreview);
  fontSelect?.addEventListener("change", updatePreview);
  updatePreview();
}

document.getElementById("estilo-config-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await saveSettings({
    primaryColor: document.getElementById("f-color-primary-hex")?.value || DEFAULT_SETTINGS.primaryColor,
    accentColor: document.getElementById("f-color-accent-hex")?.value || DEFAULT_SETTINGS.accentColor,
    bgTheme: document.getElementById("f-theme-bg")?.value || "white",
    fontTheme: document.getElementById("f-theme-font")?.value || "editorial",
  });
  showToast("Apariencia guardada");
});

// Database credentials
async function loadSupabaseConfigPanel() {
  const sbUrlInput = document.getElementById("cfg-sb-url");
  const sbKeyInput = document.getElementById("cfg-sb-key");
  const currentCfg = getSupabaseConfig();

  if (sbUrlInput) sbUrlInput.value = currentCfg.url || "";
  if (sbKeyInput) sbKeyInput.value = currentCfg.anonKey || "";
}

document.getElementById("supabase-config-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = (document.getElementById("cfg-sb-url")?.value || "").trim();
  const key = (document.getElementById("cfg-sb-key")?.value || "").trim();

  saveSupabaseConfig(url, key);
  resetSupabaseClient();

  if (sbStatusBox) {
    sbStatusBox.style.display = "block";
    sbStatusBox.textContent = "Verificando conexión con Supabase...";
    sbStatusBox.style.background = "var(--cream)";
    sbStatusBox.style.color = "var(--charcoal)";
  }

  try {
    const client = await getSupabaseClient();
    const { error } = await client.from("products").select("id").limit(1);
    if (error) throw error;

    if (sbStatusBox) {
      sbStatusBox.textContent = "¡Conexión establecida exitosamente con Supabase PostgreSQL!";
      sbStatusBox.style.background = "var(--sage-tint)";
      sbStatusBox.style.color = "var(--sage-text)";
    }
    showToast("Supabase conectado");
    await updateSupabaseStatusUI();
  } catch (err) {
    if (sbStatusBox) {
      sbStatusBox.textContent = "Error al conectar: " + err.message;
      sbStatusBox.style.background = "var(--error-bg)";
      sbStatusBox.style.color = "var(--error)";
    }
    showToast("Error de conexión", false);
  }
});

document.getElementById("btn-disconnect-sb")?.addEventListener("click", () => {
  saveSupabaseConfig("", "");
  resetSupabaseClient();
  loadSupabaseConfigPanel();
  if (sbStatusBox) {
    sbStatusBox.style.display = "block";
    sbStatusBox.textContent = "Supabase desconectado. El panel ahora funciona en Modo Local.";
    sbStatusBox.style.background = "var(--cream)";
    sbStatusBox.style.color = "var(--charcoal)";
  }
  updateSupabaseStatusUI();
  showToast("Desconectado de la nube");
});

// Initialization
await initUserSession();
await updateSupabaseStatusUI();

const initialHash = window.location.hash.replace(/^#/, "");
if (initialHash && PANEL_TITLES[initialHash]) {
  switchPanel(initialHash);
} else {
  switchPanel("resumen");
}
