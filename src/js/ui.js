import { getSettings, getSettingsSync, whatsappUrl, formatPrice, productImage, DEFAULT_LOGO } from "./store.js";

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function applyThemeSettings(settings) {
  if (!settings) return;
  const root = document.documentElement;

  if (settings.primaryColor) {
    root.style.setProperty("--burgundy", settings.primaryColor);
  }
  if (settings.accentColor) {
    root.style.setProperty("--gold", settings.accentColor);
  }
  if (settings.bgTheme === "cream") {
    root.style.setProperty("--white", "#FDF5EE");
    document.body.style.backgroundColor = "#FDF5EE";
  } else if (settings.bgTheme === "white") {
    root.style.setProperty("--white", "#FFFFFF");
    document.body.style.backgroundColor = "#FFFFFF";
  }
  if (settings.fontTheme === "modern") {
    root.style.setProperty("--font-display", "'Manrope', system-ui, sans-serif");
  } else {
    root.style.setProperty("--font-display", "'EB Garamond', Georgia, serif");
  }
}

export function productCard(p, { buttonLabel = "Ver detalle" } = {}) {
  const img = productImage(p);
  const price = formatPrice(p.price);
  const detailUrl = `/producto?id=${encodeURIComponent(p.id)}`;
  const waLink = whatsappUrl(null, p);
  const isAvailable = p.available !== false;

  return `
    <article class="card product-card" id="card-${escapeHtml(p.id)}">
      <a class="thumb" href="${detailUrl}" aria-label="Ver detalles de ${escapeHtml(p.name)}">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy">
        ${p.featured ? `<span class="badge-featured">Destacado</span>` : ""}
      </a>
      <div class="body">
        <div class="product-card-meta">
          <span class="badge badge-cat">${escapeHtml(p.category)}</span>
          ${isAvailable ? `<span class="product-status-dot" title="Disponible">En stock</span>` : `<span class="badge badge-off" style="font-size:0.7rem; padding: 2px 6px;">Agotado</span>`}
        </div>
        <h3><a href="${detailUrl}" class="product-card-title">${escapeHtml(p.name)}</a></h3>
        <p class="desc">${escapeHtml(p.description || "Elaborado a mano en técnica limpia pipas.")}</p>
        <div class="price">${price}</div>
        <div class="product-card-actions">
          ${waLink ? `
            <a class="btn btn-primary btn-wa-order" href="${waLink}" target="_blank" rel="noopener noreferrer" title="Pedir ${escapeHtml(p.name)} por WhatsApp">
              <svg viewBox="0 0 24 24" style="width:14px; height:14px; fill:currentColor;"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.78 14.16c-.24.68-1.39 1.3-1.92 1.38-.5.08-1.14.11-3.69-.94-2.18-.89-3.58-3.13-3.69-3.28-.11-.15-.88-1.17-.88-2.24s.56-1.59.76-1.81c.2-.22.44-.28.59-.28.15 0 .3 0 .43.01.14.01.32-.05.5.38.19.45.64 1.57.7 1.69.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.24.25-.1.5.14.25.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.41.66 1.65.78.24.12.4.18.46.28.06.1.06.58-.18 1.26z"/></svg>
              <span>Pedir por WhatsApp</span>
            </a>
          ` : ""}
          <a class="btn btn-secondary btn-detail-link" href="${detailUrl}">${escapeHtml(buttonLabel)}</a>
        </div>
      </div>
    </article>
  `;
}

export function mountPublicChrome({ current }) {
  const header = document.querySelector("[data-header]");
  const footer = document.querySelector("[data-footer]");
  const settings = getSettingsSync();

  // Aplicar tema dinámico
  applyThemeSettings(settings);

  // Intentar actualizar asíncronamente con la configuración más reciente
  getSettings().then((fresh) => {
    applyThemeSettings(fresh);
  }).catch(() => {});

  if (header) {
    const brandName = settings.brandName || "Dulce Eternidad";
    const brandSub = settings.brandSubtitle || "Boutique floral";

    header.innerHTML = `
      <header class="site-header">
        <div class="wrap inner">
          <a class="brand" href="/" aria-label="${escapeHtml(brandName)} - Inicio">
            <img src="${DEFAULT_LOGO}" alt="Logotipo de ${escapeHtml(brandName)}">
            <span class="brand-name">
              <strong>${escapeHtml(brandName)}</strong>
              <span>${escapeHtml(brandSub)}</span>
            </span>
          </a>

          <nav class="nav-desktop" aria-label="Navegación principal">
            ${renderNavLinks(current)}
          </nav>

          <div class="header-tools">
            <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-mobile" aria-label="Abrir menú" data-menu>
              <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <nav class="nav-mobile" id="nav-mobile" aria-label="Navegación móvil">
          ${renderNavLinks(current)}
        </nav>
      </header>
    `;

    const btn = header.querySelector("[data-menu]");
    const mobile = header.querySelector("#nav-mobile");
    btn?.addEventListener("click", () => {
      const isOpen = mobile.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(isOpen));
      btn.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
      if (isOpen) {
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
      } else {
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        `;
      }
    });
  }

  if (footer) {
    const wa = whatsappUrl("Hola, me gustaría información sobre sus creaciones florales.");
    const waLine = wa
      ? `<p><a href="${wa}" target="_blank" rel="noopener noreferrer">Enviar mensaje por WhatsApp</a></p>`
      : `<p class="muted" style="font-size:.88rem;">WhatsApp: disponible para pedidos personalizados</p>`;
    const year = new Date().getFullYear();
    const brandName = settings.brandName || "Dulce Eternidad";
    const quote = settings.footerQuote || "El arte de regalar amor eterno";
    const note = settings.footerContactNote || "Flores artesanales en limpia pipas.";
    const copyright = settings.footerCopyright || `${brandName}. Flores artesanales hechas con calma y con las manos.`;
    const igHandle = (settings.instagram || "dulce.eternidad7").replace(/^@/, "");

    footer.innerHTML = `
      <footer class="site-footer">
        <div class="wrap">
          <p class="serif footer-quote">"${escapeHtml(quote)}"</p>
          <div class="heart-rule" aria-hidden="true">&#9825;</div>

          <div class="footer-grid">
            <div class="footer-col">
              <h4>Contáctanos</h4>
              <p style="font-size:.93rem;"><strong>${escapeHtml(brandName)}</strong> &mdash; ${escapeHtml(note)}</p>
              <p>
                <a href="https://instagram.com/${escapeHtml(igHandle)}" target="_blank" rel="noopener noreferrer">
                  &#64;${escapeHtml(igHandle)}
                </a>
              </p>
              ${waLine}
            </div>

            <div class="footer-col">
              <h4>Navegación</h4>
              <p><a href="/">Inicio</a></p>
              <p><a href="/catalogo">Catálogo</a></p>
              <p><a href="/nosotros">Nosotros</a></p>
              <p><a href="/contacto">Contacto</a></p>
            </div>
          </div>

          <div class="footer-bottom">
            &copy; ${year} ${escapeHtml(copyright)}
          </div>
        </div>
      </footer>
    `;
  }
}

function renderNavLinks(current) {
  const items = [
    ["/", "Inicio", "inicio"],
    ["/catalogo", "Catálogo", "catalogo"],
    ["/nosotros", "Nosotros", "nosotros"],
    ["/contacto", "Contacto", "contacto"],
  ];
  return items
    .map(
      ([href, label, id]) =>
        `<a href="${href}" ${current === id ? 'aria-current="page"' : ""}>${label}</a>`
    )
    .join("");
}
