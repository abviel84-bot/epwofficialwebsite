/**
 * app.js
 * ------------------------------------------------------------------
 * Renderiza el contenido a partir de getDB() en la página que sea
 * (index, eventos, luchadores, tickets, nosotros o contacto). Cada
 * función usa helpers "seguros" (setText/setHTML/setAttr) que no
 * hacen nada si el elemento no existe en la página actual — así el
 * mismo app.js sirve para todas las páginas sin duplicar lógica.
 * admin.js reutiliza window.NOCTURNA.renderAll() después de guardar
 * cambios para refrescar la página al instante.
 * ------------------------------------------------------------------
 */

const SOCIAL_ICONS = {
  instagram: "IG",
  facebook: "FB",
  tiktok: "TT",
  youtube: "YT",
  twitter: "X",
  website: "WEB",
};

/* ---------------------- Helpers "seguros" ---------------------- */

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? "";
}

function setHTML(id, html) {
  const el = $(id);
  if (el) el.innerHTML = html ?? "";
}

function fmtDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtMoney(amount, currency) {
  const hasCents = Math.round((amount || 0) * 100) % 100 !== 0;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency || "MXN",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);
}

/**
 * Imagen o video sin marco: si hay URL se muestra tal cual (se adapta
 * al ancho disponible), si no, placeholder. Si el archivo se guardó en
 * IndexedDB (referencia "idb:..."), se muestra un "Cargando…" temporal
 * y luego resolveIdbPhotos() lo reemplaza por la imagen o video real
 * una vez leído (detecta el tipo de archivo automáticamente).
 */
function mediaOrPlaceholder(url, altText, placeholderText, placeholderClass) {
  if (url) {
    if (typeof isIdbRef === "function" && isIdbRef(url)) {
      return `<span class="${placeholderClass || "hero-media-placeholder"}" data-idb-photo="${url}" data-idb-alt="${altText}">Cargando…</span>`;
    }
    if (isVideoSrc(url)) {
      return `<video src="${url}" autoplay muted loop playsinline></video>`;
    }
    return `<img src="${url}" alt="${altText}" loading="lazy" />`;
  }
  return `<span class="${placeholderClass || "hero-media-placeholder"}">${placeholderText}</span>`;
}

/** Busca placeholders "Cargando…" dejados por mediaOrPlaceholder() y los reemplaza por la imagen o video real leído de IndexedDB. */
function resolveIdbPhotos(root) {
  if (typeof idbGetFile !== "function") return;
  (root || document).querySelectorAll("[data-idb-photo]").forEach((el) => {
    const ref = el.dataset.idbPhoto;
    const alt = el.dataset.idbAlt || "";
    idbGetFile(idbKeyFromRef(ref))
      .then((file) => {
        if (!file) {
          el.textContent = "No se encontró la foto guardada.";
          return;
        }
        const objUrl = URL.createObjectURL(file);
        let media;
        if (file.type.startsWith("video/")) {
          media = document.createElement("video");
          media.src = objUrl;
          media.autoplay = true;
          media.muted = true;
          media.loop = true;
          media.playsInline = true;
        } else {
          media = document.createElement("img");
          media.src = objUrl;
          media.alt = alt;
          media.loading = "lazy";
        }
        el.replaceWith(media);
      })
      .catch((err) => {
        console.error(err);
        el.textContent = "No se pudo cargar la foto.";
      });
  });
}

function socialLinksHTML(entity, extraClass) {
  return Object.keys(SOCIAL_ICONS)
    .filter((key) => entity[key])
    .map(
      (key) =>
        `<a href="${entity[key]}" target="_blank" rel="noopener noreferrer" aria-label="${key}" class="${extraClass || ""}">${SOCIAL_ICONS[key]}</a>`
    )
    .join("");
}

/* ---------------------- RENDER: HEADER / FOOTER (todas las páginas) ---------------------- */

function renderSiteChrome(db) {
  document.title = `${db.site.brand} Wrestling`;

  document.querySelectorAll(".brand").forEach((el) => (el.textContent = db.site.brand));
  document.querySelectorAll(".footer-brand").forEach((el) => (el.textContent = db.site.brand));

  // Enlace de Súper Fan: redirige a YouTube en vez de a una sección/página local.
  document.querySelectorAll(".js-superfan-link").forEach((el) => {
    el.href = db.superFan.ctaLink || "#";
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  });

  const socials = { instagram: db.site.instagramUrl, facebook: db.site.facebookUrl, tiktok: db.site.tiktokUrl };

  document.querySelectorAll(".js-social-row").forEach((row) => {
    row.innerHTML =
      Object.entries(socials)
        .filter(([, url]) => url)
        .map(
          ([key, url]) =>
            `<a class="btn btn-outline btn-sm" href="${url}" target="_blank" rel="noopener noreferrer">${key === "instagram" ? "Instagram" : key === "facebook" ? "Facebook" : "TikTok"}</a>`
        )
        .join("") || `<a class="btn btn-outline btn-sm" href="#">Instagram próximamente</a>`;
  });

  document.querySelectorAll(".js-footer-socials").forEach((el) => {
    el.innerHTML =
      Object.entries(socials)
        .filter(([, url]) => url)
        .map(([key, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${key}</a>`)
        .join("") || `<span style="color:var(--gray-dim); font-size:0.85rem;">Próximamente</span>`;
  });

  document.querySelectorAll(".js-footer-email").forEach((el) => {
    el.textContent = db.site.contactEmail;
    el.href = `mailto:${db.site.contactEmail}`;
  });

  document.querySelectorAll(".js-footer-year").forEach((el) => (el.textContent = new Date().getFullYear()));
}

/** Marca el link activo del menú según data-page del <body> vs data-page de cada <a>. */
function setActiveNav() {
  const current = document.body.dataset.page;
  if (!current) return;
  document.querySelectorAll(".main-nav a, .mobile-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.page === current);
  });
}

/* ---------------------- RENDER: HERO / PRÓXIMO EVENTO (index.html) ---------------------- */

/** Detecta si una URL/base64 corresponde a un video, para elegir <video> o <img>. */
function isVideoSrc(url) {
  if (!url) return false;
  return (
    /^data:video\//i.test(url) ||
    /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url) ||
    url.includes("res.cloudinary.com") && url.includes("/video/upload/") // las URLs de video de Cloudinary a veces no terminan en una extensión reconocible
  );
}

function renderHero(db) {
  setText("heroBrand", db.site.brand);
  setText("heroSubtitle", db.site.heroSubtitle);
  const bg = $("heroMediaBg");
  if (!bg) return;

  const url = db.site.heroMediaUrl;

  if (!url) {
    bg.innerHTML = `<span class="hero-media-placeholder">Espacio para imagen o video promocional de fondo (editable en Modo Administrador)</span>`;
    return;
  }

  if (typeof isIdbRef === "function" && isIdbRef(url)) {
    bg.innerHTML = `<span class="hero-media-placeholder">Cargando…</span>`;
    idbGetFile(idbKeyFromRef(url))
      .then((file) => {
        if (!file) {
          bg.innerHTML = `<span class="hero-media-placeholder">No se encontró el archivo guardado.</span>`;
          return;
        }
        const objUrl = URL.createObjectURL(file);
        bg.innerHTML = file.type.startsWith("video/")
          ? `<video src="${objUrl}" autoplay muted loop playsinline></video>`
          : `<img src="${objUrl}" alt="${db.site.brand}" />`;
      })
      .catch((err) => {
        console.error(err);
        bg.innerHTML = `<span class="hero-media-placeholder">No se pudo cargar el archivo guardado.</span>`;
      });
    return;
  }

  bg.innerHTML = isVideoSrc(url)
    ? `<video src="${url}" autoplay muted loop playsinline></video>`
    : `<img src="${url}" alt="${db.site.brand}" />`;
}

function renderNextEvent(db) {
  const block = $("nextEventBlock");
  if (!block) return;

  const sorted = [...db.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const next = sorted[0];

  if (!next) {
    block.innerHTML = `<p>Aún no hay eventos programados.</p>`;
    return;
  }

  block.innerHTML = `
    <div class="next-event-poster">${mediaOrPlaceholder(next.posterUrl, next.name, "Poster")}</div>
    <div>
      <div class="next-event-label">Próximo evento</div>
      <h3>${next.name}</h3>
      <div class="next-event-meta">
        <span>📅 ${fmtDate(next.date)}</span>
        <span>🕗 ${next.time} hrs</span>
        <span>📍 ${next.venue}</span>
      </div>
      <a href="tickets.html" class="btn btn-primary">Comprar Tickets</a>
    </div>
  `;
}

/* ---------------------- RENDER: EVENTOS (eventos.html) ---------------------- */

function renderEvents(db) {
  const grid = $("eventGrid");
  if (!grid) return;

  const cards = db.events
    .map(
      (ev) => `
    <article class="event-card" data-id="${ev.id}">
      <div class="event-poster">${mediaOrPlaceholder(ev.posterUrl, ev.name, "Poster del evento", "event-poster-placeholder")}</div>
      <div class="event-body">
        <div class="event-date">${fmtDate(ev.date)} · ${ev.time} hrs</div>
        <h3>${ev.name}</h3>
        <div class="event-meta">${ev.venue} — ${ev.address}</div>
        <p class="event-desc">${ev.description}</p>
        <a href="tickets.html" class="btn btn-primary btn-sm">Comprar Tickets</a>
      </div>
      <div class="admin-card-controls admin-only">
        <button class="btn-ghost btn-sm" data-action="edit-event" data-id="${ev.id}">Editar</button>
        <button class="btn-danger btn-sm" data-action="delete-event" data-id="${ev.id}">Eliminar</button>
      </div>
    </article>`
    )
    .join("");

  grid.innerHTML =
    cards + `<button class="admin-add-tile admin-only" data-action="add-event" type="button">+ Añadir evento</button>`;
}

/* ---------------------- RENDER: LUCHADORES (luchadores.html) ---------------------- */

function renderWrestlers(db) {
  const grid = $("wrestlerGrid");
  if (!grid) return;

  const categories =
    db.rosterCategories && db.rosterCategories.length
      ? db.rosterCategories
      : [{ id: "activos", label: "Luchadores Activos" }];

  const sectionsHTML = categories
    .map((cat, catIdx) => {
      const people = db.wrestlers.filter((w) => (w.categoryId || "activos") === cat.id);

      const cards = people
        .map(
          (w, i) => `
      <div>
        <button class="wrestler-card" data-action="open-wrestler" data-id="${w.id}" type="button">
          <div class="wrestler-photo">${mediaOrPlaceholder(w.photoUrl, w.ringName, "Foto", "wrestler-photo-placeholder")}</div>
          <div class="wrestler-info">
            <div class="wrestler-ringname">${w.ringName}</div>
            <div class="wrestler-name">${w.name}</div>
            <div class="wrestler-socials">${socialLinksHTML(w)}</div>
          </div>
        </button>
        <div class="admin-card-controls admin-only" style="padding-left:2px; flex-wrap:wrap;">
          <button class="btn-ghost btn-sm" data-action="move-wrestler-up" data-id="${w.id}" aria-label="Mover arriba" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="btn-ghost btn-sm" data-action="move-wrestler-down" data-id="${w.id}" aria-label="Mover abajo" ${i === people.length - 1 ? "disabled" : ""}>↓</button>
          <button class="btn-ghost btn-sm" data-action="edit-wrestler" data-id="${w.id}">Editar</button>
          <button class="btn-danger btn-sm" data-action="delete-wrestler" data-id="${w.id}">Eliminar</button>
        </div>
      </div>`
        )
        .join("");

      return `
      <div class="roster-category" data-category-id="${cat.id}">
        <div class="roster-category-head">
          <h3>${cat.label}</h3>
          <div class="admin-only" style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn-ghost btn-sm" data-action="move-category-up" data-id="${cat.id}" aria-label="Subir sección" ${catIdx === 0 ? "disabled" : ""}>↑ Sección</button>
            <button class="btn-ghost btn-sm" data-action="move-category-down" data-id="${cat.id}" aria-label="Bajar sección" ${catIdx === categories.length - 1 ? "disabled" : ""}>↓ Sección</button>
            <button class="btn-danger btn-sm" data-action="delete-category" data-id="${cat.id}">Eliminar sección</button>
          </div>
        </div>
        <div class="wrestler-grid">
          ${cards}
          <button class="admin-add-tile admin-only" type="button" data-action="add-wrestler" data-category-id="${cat.id}">+ Añadir a ${cat.label}</button>
        </div>
      </div>`;
    })
    .join("");

  grid.innerHTML =
    sectionsHTML +
    `<button class="btn btn-outline admin-only" type="button" data-action="add-category" style="margin-top:8px;">+ Añadir sección</button>`;
}

function openWrestlerModal(db, id) {
  const w = db.wrestlers.find((x) => x.id === id);
  if (!w || !$("wrestlerModal")) return;
  setHTML("wrestlerModalPhoto", mediaOrPlaceholder(w.photoUrl, w.ringName, "Foto", "wrestler-photo-placeholder"));
  setText("wrestlerModalRingName", w.ringName);
  setText("wrestlerModalName", w.name);
  setText("wrestlerModalBio", w.bio);
  setHTML("wrestlerModalSocials", socialLinksHTML(w));
  openModal("wrestlerModal");
  resolveIdbPhotos($("wrestlerModalPhoto"));
}

/* ---------------------- RENDER: TICKETS (tickets.html) ---------------------- */

function renderTickets(db) {
  const wrap = $("ticketsByEvent");
  if (!wrap) return;

  const blocks = db.events
    .map((ev) => {
      const evTickets = db.ticketTypes.filter((t) => t.eventId === ev.id);
      const ticketCards = evTickets
        .map(
          (t) => `
      <div class="ticket-card" data-id="${t.id}">
        <h4>${t.name}</h4>
        <p class="ticket-desc">${t.description}</p>
        <div class="ticket-price">${fmtMoney(t.price, t.currency)}</div>
        <div class="ticket-avail">${t.quantityAvailable} disponibles</div>
        <div class="qty-row">
          <div class="qty-control" data-qty-for="${t.id}">
            <button type="button" data-qty-action="minus" data-id="${t.id}" aria-label="Restar">–</button>
            <span class="qty-value" data-qty-value="${t.id}">0</span>
            <button type="button" data-qty-action="plus" data-id="${t.id}" aria-label="Sumar" data-max="${t.quantityAvailable}">+</button>
          </div>
          <a href="${t.purchaseLink || "#"}" class="btn btn-primary btn-sm" data-action="buy-ticket" data-id="${t.id}">Comprar Ticket</a>
        </div>
        <div class="admin-card-controls-tickets admin-only">
          <button class="btn-ghost btn-sm" data-action="edit-ticket" data-id="${t.id}">Editar</button>
          <button class="btn-danger btn-sm" data-action="delete-ticket" data-id="${t.id}">Eliminar</button>
        </div>
      </div>`
        )
        .join("");

      return `
      <div class="tickets-event-block">
        <div class="tickets-event-title">
          <h3>${ev.name}</h3>
          <span>${fmtDate(ev.date)} · ${ev.venue}</span>
        </div>
        <div class="ticket-grid">
          ${ticketCards}
          <button class="admin-add-tile admin-only" data-action="add-ticket" data-event-id="${ev.id}" type="button">+ Añadir ticket</button>
        </div>
      </div>`;
    })
    .join("");

  wrap.innerHTML = blocks || `<p>Aún no hay eventos para vender tickets. Añade un evento primero.</p>`;
}

/* ---------------------- RENDER: SUPER FAN (teaser en index.html) ---------------------- */

function renderSuperFan(db) {
  if (!$("superfanTitle")) return;
  const sf = db.superFan;
  setText("superfanTitle", sf.title);
  setText("superfanDescription", sf.description);
  setHTML("superfanPrice", `${fmtMoney(sf.price, "MXN")} <span>${sf.priceLabel}</span>`);
  setHTML("superfanBenefits", sf.benefits.map((b) => `<li>${b}</li>`).join(""));

  const cta = $("superfanCta");
  if (cta) {
    cta.textContent = sf.ctaLabel;
    cta.href = sf.ctaLink || "#";
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
  }

  setHTML("superfanBanner", mediaOrPlaceholder(sf.bannerUrl, sf.title, "Imagen o banner de Súper Fan"));
}

/* ---------------------- RENDER: ACERCA DE NOSOTROS (nosotros.html) ---------------------- */

function renderAbout(db) {
  if (!$("aboutTitle")) return;
  setText("aboutTitle", db.site.aboutTitle);
  setText("aboutBody", db.site.aboutBody);

  const bannerMedia = $("aboutBannerMedia");
  if (bannerMedia) {
    bannerMedia.innerHTML = mediaOrPlaceholder(
      db.site.aboutMediaUrl,
      db.site.aboutTitle,
      "Foto o video de fondo (editable en Modo Administrador)",
      "hero-media-placeholder"
    );
  }
}

function renderContactPage(db) {
  if (!$("contactTitle")) return; // esta página no está presente (no es contacto.html)

  setText("contactEyebrow", db.site.contactEyebrow);
  setText("contactTitle", db.site.contactTitle);
  setText("contactSubtitle", db.site.contactSubtitle);

  const bannerMedia = $("contactBannerMedia");
  if (bannerMedia) {
    bannerMedia.innerHTML = mediaOrPlaceholder(
      db.site.contactMediaUrl,
      db.site.contactTitle,
      "Foto o video de fondo (editable en Modo Administrador)",
      "hero-media-placeholder"
    );
  }

  const tagsList = $("contactHeroTags");
  if (tagsList) {
    const tags = (db.site.contactTags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    tagsList.innerHTML = tags.map((t) => `<li>${t}</li>`).join("");
  }

  const infoList = $("contactInfoList");
  if (infoList) {
    const items = [
      { icon: "📍", label: "Ubicación", value: db.site.location },
      { icon: "📞", label: "Teléfono", value: db.site.phone, href: db.site.phone ? `tel:${db.site.phone.replace(/[^+\d]/g, "")}` : "" },
      { icon: "✉️", label: "Correo", value: db.site.contactEmail, href: db.site.contactEmail ? `mailto:${db.site.contactEmail}` : "" },
      { icon: "📷", label: "Instagram", action: db.site.instagramUrl, actionLabel: "Seguir" },
      { icon: "👍", label: "Facebook", action: db.site.facebookUrl, actionLabel: "Seguir" },
      { icon: "🕒", label: "Horario", value: db.site.hours },
    ].filter((it) => it.value || it.action);

    infoList.innerHTML = items
      .map(
        (it) => `
        <li class="contact-info-item">
          <span class="contact-info-icon">${it.icon}</span>
          <div>
            <strong>${it.label}</strong>
            ${
              it.action
                ? `<a class="btn btn-outline btn-sm contact-info-action" href="${it.action}" target="_blank" rel="noopener noreferrer">${it.actionLabel}</a>`
                : it.href
                ? `<p><a href="${it.href}">${String(it.value).replace(/\n/g, "<br>")}</a></p>`
                : `<p>${String(it.value).replace(/\n/g, "<br>")}</p>`
            }
          </div>
        </li>`
      )
      .join("");
  }

  const map = $("contactMap");
  if (map) {
    map.innerHTML = db.site.location
      ? `<iframe src="https://www.google.com/maps?q=${encodeURIComponent(db.site.location)}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Ubicación"></iframe>`
      : `<span class="hero-media-placeholder">Añade una ubicación en "Editar redes y contacto" para mostrar el mapa</span>`;
  }

  setText("ctaEyebrow", db.site.ctaEyebrow);
  setText("ctaTitle", db.site.ctaTitle);
  setText("ctaSubtitle", db.site.ctaSubtitle);

  const ctaBtn = $("ctaButton");
  if (ctaBtn) {
    ctaBtn.textContent = db.site.ctaButtonLabel || "";
    ctaBtn.setAttribute("href", db.site.ctaButtonLink || "#");
  }

  const ctaMedia = $("contactCtaMedia");
  if (ctaMedia) {
    ctaMedia.innerHTML = mediaOrPlaceholder(
      db.site.ctaMediaUrl,
      db.site.ctaTitle,
      "Foto o video de fondo (editable en Modo Administrador)",
      "hero-media-placeholder"
    );
  }

  const interestSelect = $("cf_interest");
  if (interestSelect) {
    const options = (db.site.contactFormOptions || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    interestSelect.innerHTML =
      `<option value="" disabled selected>Elige una opción</option>` +
      options.map((o) => `<option value="${o}">${o}</option>`).join("");
  }

  // El formulario público no tiene backend: al enviarlo, se abre el
  // cliente de correo del visitante con los datos ya redactados.
  const form = $("contactForm");
  if (form && !form.dataset.wired) {
    form.dataset.wired = "true";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const current = getDB(); // datos frescos, por si el admin cambió el destinatario después de cargar la página
      const data = Object.fromEntries(new FormData(form).entries());
      const to = current.site.contactFormRecipient || current.site.contactEmail || "";
      const subject = `Mensaje de ${data.name || "un visitante"} — sitio web ${current.site.brand || ""}`;
      const body = [
        `Nombre: ${data.name || ""}`,
        `Correo: ${data.email || ""}`,
        `Teléfono: ${data.phone || ""}`,
        `Interés: ${data.interest || ""}`,
        "",
        data.message || "",
      ].join("\n");
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      showToast("Se abrió tu cliente de correo con el mensaje listo para enviar.");
      form.reset();
    });
  }
}

/* ---------------------- RENDER TOTAL ---------------------- */

function renderAll() {
  const db = getDB();
  renderSiteChrome(db);
  renderHero(db);
  renderNextEvent(db);
  renderEvents(db);
  renderWrestlers(db);
  renderTickets(db);
  renderSuperFan(db);
  renderAbout(db);
  renderContactPage(db);
  setActiveNav();
  resolveIdbPhotos();
}

/* ---------------------- MODALES ---------------------- */

function openModal(id) {
  const el = $(id);
  if (!el) return;
  el.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove("open");
  document.body.style.overflow = "";
}

document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

if ($("wrestlerModalClose")) {
  $("wrestlerModalClose").addEventListener("click", () => closeModal("wrestlerModal"));
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach((m) => closeModal(m.id));
  }
});

/* ---------------------- NAV MÓVIL ---------------------- */

const hamburgerBtn = $("hamburgerBtn");
const mobileNav = $("mobileNav");

if (hamburgerBtn && mobileNav) {
  hamburgerBtn.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("open");
    hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      hamburgerBtn.setAttribute("aria-expanded", "false");
    })
  );
}

/* ---------------------- DELEGACIÓN DE CLICKS PÚBLICOS ---------------------- */

document.addEventListener("click", (e) => {
  const wrestlerBtn = e.target.closest('[data-action="open-wrestler"]');
  if (wrestlerBtn) {
    openWrestlerModal(getDB(), wrestlerBtn.dataset.id);
    return;
  }

  const qtyBtn = e.target.closest("[data-qty-action]");
  if (qtyBtn) {
    const id = qtyBtn.dataset.id;
    const valueEl = document.querySelector(`[data-qty-value="${id}"]`);
    let current = parseInt(valueEl.textContent, 10) || 0;
    const max = parseInt(qtyBtn.dataset.max || "999", 10);
    if (qtyBtn.dataset.qtyAction === "plus") current = Math.min(current + 1, max);
    if (qtyBtn.dataset.qtyAction === "minus") current = Math.max(current - 1, 0);
    valueEl.textContent = current;
    return;
  }

  const buyBtn = e.target.closest('[data-action="buy-ticket"]');
  if (buyBtn) {
    const id = buyBtn.dataset.id;
    const qty = parseInt(document.querySelector(`[data-qty-value="${id}"]`)?.textContent || "0", 10);
    const db = getDB();
    const ticket = db.ticketTypes.find((t) => t.id === id);
    if (!ticket) return;
    if (!ticket.purchaseLink) {
      e.preventDefault();
      showToast(
        qty > 0
          ? `${qty} × ${ticket.name} — conecta un proveedor de pagos (Stripe/PayPal) para procesar la compra.`
          : "Selecciona una cantidad antes de comprar."
      );
    }
    return;
  }
});

/* Primer render al cargar cualquier página del sitio */
document.addEventListener("DOMContentLoaded", async () => {
  await initDB(); // trae los datos reales de Firebase
  renderAll();
});

/* Expuesto para que admin.js pueda re-renderizar tras guardar cambios */
window.NOCTURNA = { renderAll, showToast, openModal, closeModal };
