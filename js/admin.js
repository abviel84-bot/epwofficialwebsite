/**
 * admin.js
 * ------------------------------------------------------------------
 * Gesto oculto (5 clicks en 2s sobre el logo) -> abre login.
 * Login correcto -> activa "Modo Edición" (clase .admin-mode en body).
 * En modo edición, los formularios leen/escriben sobre getDB()/saveDB()
 * de data.js y vuelven a llamar a window.NOCTURNA.renderAll() para
 * reflejar los cambios al instante.
 *
 * Migración futura a backend real: reemplazar checkAdminPassword() por
 * una llamada a una API de auth, y las funciones saveDB()/getDB() de
 * data.js por fetch() a endpoints reales. El resto de este archivo
 * (los formularios) no necesita cambiar.
 * ------------------------------------------------------------------
 */

(function () {
  const CLICK_WINDOW_MS = 2000;
  const CLICKS_REQUIRED = 5;
  let clickTimestamps = [];

  const brandTrigger = document.getElementById("brandTrigger");
  const adminLoginModal = document.getElementById("adminLoginModal");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const adminLoginError = document.getElementById("adminLoginError");
  const formModal = document.getElementById("formModal");
  const formModalTitle = document.getElementById("formModalTitle");
  const formModalBody = document.getElementById("formModalBody");

  /* ---------------- Gesto de 5 clicks ---------------- */

  brandTrigger.addEventListener("click", () => {
    const now = Date.now();
    clickTimestamps.push(now);
    clickTimestamps = clickTimestamps.filter((t) => now - t <= CLICK_WINDOW_MS);

    if (clickTimestamps.length >= CLICKS_REQUIRED) {
      clickTimestamps = [];
      if (document.body.classList.contains("admin-mode")) {
        exitAdminMode();
      } else {
        adminLoginError.classList.remove("show");
        adminLoginForm.reset();
        window.NOCTURNA.openModal("adminLoginModal");
        document.getElementById("adminPasswordInput").focus();
      }
    }
  });

  document.getElementById("adminLoginClose").addEventListener("click", () => window.NOCTURNA.closeModal("adminLoginModal"));

  adminLoginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = document.getElementById("adminPasswordInput").value;
    if (value === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_KEY, "1");
      window.NOCTURNA.closeModal("adminLoginModal");
      enterAdminMode();
    } else {
      adminLoginError.classList.add("show");
    }
  });

  function enterAdminMode() {
    document.body.classList.add("admin-mode");
    window.NOCTURNA_IS_ADMIN = true;
    window.NOCTURNA.renderAll();
    window.NOCTURNA.showToast("Modo administrador activado.");
  }

  function exitAdminMode() {
    document.body.classList.remove("admin-mode");
    window.NOCTURNA_IS_ADMIN = false;
    sessionStorage.removeItem(ADMIN_KEY);
    window.NOCTURNA.renderAll();
    window.NOCTURNA.showToast("Modo administrador desactivado.");
  }

  // Restaura la sesión si el navegador se recarga estando autenticado
  if (sessionStorage.getItem(ADMIN_KEY) === "1") {
    document.addEventListener("DOMContentLoaded", enterAdminMode);
  }

  document.getElementById("adminResetBtn")?.addEventListener("click", async () => {
    if (confirm("Esto borrará todos los cambios guardados y volverá a los valores de fábrica, para TODOS los visitantes. ¿Continuar?")) {
      await resetDB();
      window.NOCTURNA.renderAll();
      window.NOCTURNA.showToast("Datos restaurados a los valores de fábrica.");
    }
  });

  /* ---------------- Utilidades de formulario ---------------- */

  function field(label, name, value, type, step) {
    type = type || "text";
    return `
      <div class="form-field">
        <label for="f_${name}">${label}</label>
        <input id="f_${name}" name="${name}" type="${type}" value="${value ?? ""}" ${step ? `step="${step}"` : ""} />
      </div>`;
  }

  function textarea(label, name, value) {
    return `
      <div class="form-field">
        <label for="f_${name}">${label}</label>
        <textarea id="f_${name}" name="${name}">${value ?? ""}</textarea>
      </div>`;
  }

  function heroMediaField(label, name, value, placeholder) {
    const isVideo = value && !isIdbRef(value) && isVideoSrc(value);
    return `
      <div class="form-field image-field">
        <label for="f_${name}">${label}</label>
        <div class="image-upload-row">
          <div class="image-upload-preview" id="preview_${name}">
            ${
              value
                ? isIdbRef(value)
                  ? `<span>Guardado ✓</span>`
                  : isVideo
                  ? `<video src="${value}" muted></video>`
                  : `<img src="${value}" alt="" />`
                : `<span>Sin imagen</span>`
            }
          </div>
          <div class="image-upload-controls">
            <input type="file" accept="image/*,video/*" data-media-for="${name}" id="filepick_${name}" />
            <label class="btn btn-outline btn-sm" for="filepick_${name}">Subir foto o video</label>
            <button type="button" class="btn-ghost btn-sm" data-clear-image="${name}">Quitar</button>
          </div>
        </div>
        <input type="text" name="${name}" id="f_${name}" value="${value ?? ""}" placeholder="${placeholder || "O pega una URL de imagen o video"}" style="margin-top:8px;" />
        <p style="font-size:0.72rem; color:var(--gray-dim); margin-top:6px;">Video hasta 50MB — se guarda en el almacenamiento del navegador para archivos grandes (IndexedDB), así que sí caben videos pesados. El texto "idb:..." de arriba es solo la referencia interna del archivo guardado; no lo borres a menos que quieras quitarlo. También puedes pegar una URL de video ya subido (YouTube, Vimeo, tu propio hosting) en su lugar.</p>
      </div>`;
  }

  /**
   * Campo de imagen con dos formas de llenarlo: subir una foto desde el
   * dispositivo (se convierte a base64 y se guarda directo en el campo,
   * sin necesitar servidor de archivos) o pegar una URL externa. La
   * vista previa usa object-fit: contain, así que la foto nunca se
   * recorta ni se deforma — se adapta al espacio disponible.
   *
   * NOTA: ya no se usa en ningún formulario del sitio (todas las fotos
   * pasan por photoField, que sube a Cloudinary). Se deja disponible
   * solo por si hiciera falta un campo de imagen simple en el futuro.
   */
  function imageField(label, name, value, placeholder) {
    return `
      <div class="form-field image-field">
        <label for="f_${name}">${label}</label>
        <div class="image-upload-row">
          <div class="image-upload-preview" id="preview_${name}">
            ${value ? `<img src="${value}" alt="" />` : `<span>Sin imagen</span>`}
          </div>
          <div class="image-upload-controls">
            <input type="file" accept="image/*" data-image-for="${name}" id="filepick_${name}" />
            <label class="btn btn-outline btn-sm" for="filepick_${name}">Subir foto</label>
            <button type="button" class="btn-ghost btn-sm" data-clear-image="${name}">Quitar</button>
          </div>
        </div>
        <input type="text" name="${name}" id="f_${name}" value="${value ?? ""}" placeholder="${placeholder || "O pega una URL de imagen"}" style="margin-top:8px;" />
      </div>`;
  }

  /**
   * Igual que imageField(), pero sube el archivo a Cloudinary en vez de
   * guardarlo como base64 — así puedes tener tantas tarjetas con foto
   * como quieras (luchadores, eventos, etc.) sin límite real de tamaño,
   * y el dato que queda guardado en Firestore es solo la URL final
   * (liviana), no el archivo completo. Si allowVideo es true, también
   * acepta video (igual que el fondo del hero en Inicio).
   */
  function photoField(label, name, value, placeholder, allowVideo) {
    return `
      <div class="form-field image-field">
        <label for="f_${name}">${label}</label>
        <div class="image-upload-row">
          <div class="image-upload-preview" id="preview_${name}">
            ${
              value
                ? isIdbRef(value)
                  ? `<span>Guardado ✓</span>`
                  : `<img src="${value}" alt="" />`
                : `<span>Sin imagen</span>`
            }
          </div>
          <div class="image-upload-controls">
            <input type="file" accept="${allowVideo ? "image/*,video/*" : "image/*"}" data-photo-for="${name}" ${allowVideo ? 'data-allow-video="true"' : ""} id="filepick_${name}" />
            <label class="btn btn-outline btn-sm" for="filepick_${name}">Subir ${allowVideo ? "foto o video" : "foto"}</label>
            <button type="button" class="btn-ghost btn-sm" data-clear-image="${name}">Quitar</button>
          </div>
        </div>
        <input type="text" name="${name}" id="f_${name}" value="${value ?? ""}" placeholder="${placeholder || "O pega una URL"}" style="margin-top:8px;" />
      </div>`;
  }

  /** Conecta los inputs de tipo file y los botones de "Quitar" dentro de un formulario recién insertado. */
  function wireImageInputs(root) {
    root.querySelectorAll("input[type='file'][data-image-for]").forEach((fileInput) => {
      fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) {
          window.NOCTURNA.showToast("Esa foto pesa mucho. Usa una imagen de menos de 3MB.");
          fileInput.value = "";
          return;
        }
        const name = fileInput.dataset.imageFor;
        const reader = new FileReader();
        reader.onload = () => {
          const hidden = root.querySelector(`#f_${name}`);
          if (hidden) hidden.value = reader.result;
          const preview = root.querySelector(`#preview_${name}`);
          if (preview) preview.innerHTML = `<img src="${reader.result}" alt="" />`;
        };
        reader.readAsDataURL(file);
      });
    });

    root.querySelectorAll("input[type='file'][data-photo-for]").forEach((fileInput) => {
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;
        const isVideo = file.type.startsWith("video/");
        const maxSize = fileInput.dataset.allowVideo === "true" ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
        if (file.size > maxSize) {
          window.NOCTURNA.showToast(
            isVideo ? "Ese video pesa más de 50MB. Usa uno más liviano." : "Esa foto pesa más de 20MB. Usa una imagen más ligera."
          );
          fileInput.value = "";
          return;
        }
        const name = fileInput.dataset.photoFor;
        const key = `${name}-${uid("ph")}`;
        const preview = root.querySelector(`#preview_${name}`);
        const hidden = root.querySelector(`#f_${name}`);
        if (preview) preview.innerHTML = `<span>Subiendo…</span>`;
        try {
          const url = await idbSetFile(key, file);
          if (hidden) hidden.value = url;
          if (preview) {
            preview.innerHTML = isVideo ? `<video src="${url}" muted></video>` : `<img src="${url}" alt="" />`;
          }
        } catch (err) {
          console.error(err);
          if (preview) preview.innerHTML = `<span>Sin imagen</span>`;
          window.NOCTURNA.showToast(`No se pudo subir: ${err.message || "error desconocido"}`);
        }
      });
    });

    root.querySelectorAll("input[type='file'][data-media-for]").forEach((fileInput) => {
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
          window.NOCTURNA.showToast("Ese archivo pesa más de 50MB. Usa uno más liviano o pega una URL.");
          fileInput.value = "";
          return;
        }
        const name = fileInput.dataset.mediaFor;
        const key = `${name}-${uid("m")}`;
        const preview = root.querySelector(`#preview_${name}`);
        const hidden = root.querySelector(`#f_${name}`);
        if (preview) preview.innerHTML = `<span>Subiendo…</span>`;
        try {
          const url = await idbSetFile(key, file);
          if (hidden) hidden.value = url;
          if (preview) {
            preview.innerHTML = file.type.startsWith("video/")
              ? `<video src="${url}" muted></video>`
              : `<img src="${url}" alt="" />`;
          }
        } catch (err) {
          console.error(err);
          if (preview) preview.innerHTML = `<span>Sin imagen</span>`;
          window.NOCTURNA.showToast(`No se pudo subir: ${err.message || "error desconocido"}`);
        }
      });
    });

    root.querySelectorAll("[data-clear-image]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.clearImage;
        const hidden = root.querySelector(`#f_${name}`);
        if (hidden) hidden.value = "";
        const preview = root.querySelector(`#preview_${name}`);
        if (preview) preview.innerHTML = `<span>Sin imagen</span>`;
      });
    });
  }

  function openForm(title, bodyHTML, onSubmit) {
    formModalTitle.textContent = title;
    formModalBody.innerHTML = bodyHTML;
    window.NOCTURNA.openModal("formModal");
    wireImageInputs(formModalBody);
    const form = formModalBody.querySelector("form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      onSubmit(data);
      window.NOCTURNA.closeModal("formModal");
    });
  }

  document.getElementById("formModalClose").addEventListener("click", () => window.NOCTURNA.closeModal("formModal"));

  /**
   * Guarda la base de datos y SIEMPRE avisa si falló. Antes, muchas
   * funciones llamaban a saveDB() sin revisar si de verdad guardó, así
   * que si algo fallaba (ej. sin conexión a internet), el usuario veía
   * "Guardado" aunque nada se hubiera guardado en realidad.
   */
  async function persistAndReport(db, successMessage) {
    window.NOCTURNA.showToast("Guardando…");
    const ok = await saveDB(db);
    window.NOCTURNA.renderAll();
    if (ok) {
      window.NOCTURNA.showToast(successMessage);
    } else {
      window.NOCTURNA.showToast("No se pudo guardar. Revisa tu conexión a internet e intenta de nuevo.");
    }
    return ok;
  }


  /* ---------------- EVENTOS ---------------- */

  function eventFormHTML(ev) {
    ev = ev || {};
    return `
      <form>
        ${field("Nombre del evento", "name", ev.name)}
        ${photoField("Foto o poster del evento", "posterUrl", ev.posterUrl)}
        <div class="form-row">
          ${field("Fecha", "date", ev.date, "date")}
          ${field("Hora", "time", ev.time, "time")}
        </div>
        ${field("Lugar (sede)", "venue", ev.venue)}
        ${field("Dirección", "address", ev.address)}
        ${textarea("Descripción breve", "description", ev.description)}
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Guardar cambios</button>
        </div>
      </form>`;
  }

  function addEvent() {
    openForm("Añadir evento", eventFormHTML(), (data) => {
      const db = getDB();
      db.events.push({ id: uid("ev"), ...data });
      persistAndReport(db, "Evento añadido.");
    });
  }

  function editEvent(id) {
    const db = getDB();
    const ev = db.events.find((e) => e.id === id);
    if (!ev) return;
    openForm("Editar evento", eventFormHTML(ev), (data) => {
      Object.assign(ev, data);
      persistAndReport(db, "Evento actualizado.");
    });
  }

  function deleteEvent(id) {
    if (!confirm("¿Eliminar este evento? También se eliminarán sus tickets.")) return;
    const db = getDB();
    db.events = db.events.filter((e) => e.id !== id);
    db.ticketTypes = db.ticketTypes.filter((t) => t.eventId !== id);
    persistAndReport(db, "Evento eliminado.");
  }

  /* ---------------- LUCHADORES / ROSTER (por secciones) ---------------- */

  function categorySelectHTML(categories, selectedId) {
    return `
      <div class="form-field">
        <label for="f_categoryId">Sección</label>
        <select id="f_categoryId" name="categoryId">
          ${categories
            .map((c) => `<option value="${c.id}" ${c.id === selectedId ? "selected" : ""}>${c.label}</option>`)
            .join("")}
        </select>
      </div>`;
  }

  function wrestlerFormHTML(w, categories) {
    w = w || {};
    return `
      <form>
        ${field("Nombre real", "name", w.name)}
        ${field("Nombre de luchador / apodo", "ringName", w.ringName)}
        ${categorySelectHTML(categories, w.categoryId || (categories[0] && categories[0].id))}
        ${photoField("Foto", "photoUrl", w.photoUrl)}
        ${textarea("Biografía breve", "bio", w.bio)}
        <div class="form-row">
          ${field("Instagram", "instagram", w.instagram)}
          ${field("Facebook", "facebook", w.facebook)}
        </div>
        <div class="form-row">
          ${field("TikTok", "tiktok", w.tiktok)}
          ${field("YouTube", "youtube", w.youtube)}
        </div>
        <div class="form-row">
          ${field("X / Twitter", "twitter", w.twitter)}
          ${field("Sitio web", "website", w.website)}
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Guardar cambios</button>
        </div>
      </form>`;
  }

  function addWrestler(categoryId) {
    const db = getDB();
    const categories = db.rosterCategories && db.rosterCategories.length ? db.rosterCategories : [{ id: "activos", label: "Luchadores Activos" }];
    openForm("Añadir a la sección", wrestlerFormHTML({ categoryId }, categories), (data) => {
      const db2 = getDB();
      db2.wrestlers.push({ id: uid("wr"), ...data });
      persistAndReport(db2, "Persona añadida.");
    });
  }

  function editWrestler(id) {
    const db = getDB();
    const w = db.wrestlers.find((x) => x.id === id);
    if (!w) return;
    const categories = db.rosterCategories && db.rosterCategories.length ? db.rosterCategories : [{ id: "activos", label: "Luchadores Activos" }];
    openForm("Editar persona", wrestlerFormHTML(w, categories), (data) => {
      Object.assign(w, data);
      persistAndReport(db, "Persona actualizada.");
    });
  }

  function deleteWrestler(id) {
    if (!confirm("¿Eliminar a esta persona del roster?")) return;
    const db = getDB();
    db.wrestlers = db.wrestlers.filter((w) => w.id !== id);
    persistAndReport(db, "Persona eliminada.");
  }

  /** Mueve una persona un lugar arriba (-1) o abajo (+1) dentro de su propia sección. */
  function moveWrestler(id, direction) {
    const db = getDB();
    const w = db.wrestlers.find((x) => x.id === id);
    if (!w) return;
    const categoryId = w.categoryId || "activos";
    const sameCategoryIds = db.wrestlers.filter((x) => (x.categoryId || "activos") === categoryId).map((x) => x.id);
    const pos = sameCategoryIds.indexOf(id);
    const targetPos = pos + direction;
    if (targetPos < 0 || targetPos >= sameCategoryIds.length) return;
    const targetId = sameCategoryIds[targetPos];
    const idxA = db.wrestlers.findIndex((x) => x.id === id);
    const idxB = db.wrestlers.findIndex((x) => x.id === targetId);
    [db.wrestlers[idxA], db.wrestlers[idxB]] = [db.wrestlers[idxB], db.wrestlers[idxA]];
    saveDB(db);
    window.NOCTURNA.renderAll();
  }

  function addCategory() {
    openForm(
      "Añadir sección",
      `<form>
        ${field("Nombre de la sección", "label", "")}
        <div class="form-actions"><button type="submit" class="btn btn-primary">Añadir</button></div>
      </form>`,
      (data) => {
        const db = getDB();
        if (!db.rosterCategories) db.rosterCategories = [];
        const label = (data.label || "").trim() || "Nueva sección";
        db.rosterCategories.push({ id: uid("cat"), label });
        persistAndReport(db, "Sección añadida.");
      }
    );
  }

  function deleteCategory(id) {
    const db = getDB();
    const cats = db.rosterCategories || [];
    const cat = cats.find((c) => c.id === id);
    if (!cat) return;
    if (cats.length <= 1) {
      window.NOCTURNA.showToast("Debe quedar al menos una sección.");
      return;
    }
    const count = db.wrestlers.filter((w) => (w.categoryId || "activos") === id).length;
    const msg =
      count > 0
        ? `¿Eliminar la sección "${cat.label}"? También se eliminarán las ${count} persona(s) que tiene dentro.`
        : `¿Eliminar la sección "${cat.label}"?`;
    if (!confirm(msg)) return;
    db.rosterCategories = cats.filter((c) => c.id !== id);
    db.wrestlers = db.wrestlers.filter((w) => (w.categoryId || "activos") !== id);
    persistAndReport(db, "Sección eliminada.");
  }

  /** Mueve una sección completa un lugar arriba (-1) o abajo (+1). */
  function moveCategory(id, direction) {
    const db = getDB();
    const cats = db.rosterCategories || [];
    const idx = cats.findIndex((c) => c.id === id);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= cats.length) return;
    [cats[idx], cats[targetIdx]] = [cats[targetIdx], cats[idx]];
    saveDB(db);
    window.NOCTURNA.renderAll();
  }

  /* ---------------- TICKETS ---------------- */

  function ticketFormHTML(t) {
    t = t || {};
    return `
      <form>
        ${field("Nombre del ticket", "name", t.name)}
        ${textarea("Descripción", "description", t.description)}
        <div class="form-row">
          ${field("Precio", "price", t.price, "number", "0.01")}
          ${field("Cantidad disponible", "quantityAvailable", t.quantityAvailable, "number")}
        </div>
        ${photoField("Imagen del ticket (opcional)", "imageUrl", t.imageUrl)}
        ${field("Enlace o método de compra", "purchaseLink", t.purchaseLink)}
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Guardar cambios</button>
        </div>
      </form>`;
  }

  function addTicket(eventId) {
    openForm("Añadir ticket", ticketFormHTML(), (data) => {
      const db = getDB();
      db.ticketTypes.push({
        id: uid("tk"),
        eventId,
        currency: "MXN",
        ...data,
        price: Number(data.price) || 0,
        quantityAvailable: Number(data.quantityAvailable) || 0,
      });
      persistAndReport(db, "Ticket añadido.");
    });
  }

  function editTicket(id) {
    const db = getDB();
    const t = db.ticketTypes.find((x) => x.id === id);
    if (!t) return;
    openForm("Editar ticket", ticketFormHTML(t), (data) => {
      Object.assign(t, data, {
        price: Number(data.price) || 0,
        quantityAvailable: Number(data.quantityAvailable) || 0,
      });
      persistAndReport(db, "Ticket actualizado.");
    });
  }

  function deleteTicket(id) {
    if (!confirm("¿Eliminar este tipo de ticket?")) return;
    const db = getDB();
    db.ticketTypes = db.ticketTypes.filter((t) => t.id !== id);
    persistAndReport(db, "Ticket eliminado.");
  }

  /* ---------------- SECCIONES DE TEXTO GLOBAL ---------------- */

  function editHero() {
    const db = getDB();
    openForm(
      "Editar Inicio",
      `<form>
        ${field("Nombre de la promoción", "brand", db.site.brand)}
        ${textarea("Frase / slogan", "heroSubtitle", db.site.heroSubtitle)}
        ${heroMediaField("Foto o video de fondo del hero", "heroMediaUrl", db.site.heroMediaUrl)}
        <div class="form-actions"><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
      </form>`,
      (data) => {
        Object.assign(db.site, data);
        persistAndReport(db, "Sección de inicio actualizada.");
      }
    );
  }

  function editAbout() {
    const db = getDB();
    openForm(
      "Editar Acerca de Nosotros",
      `<form>
        ${field("Título", "aboutTitle", db.site.aboutTitle)}
        ${textarea("Historia / descripción", "aboutBody", db.site.aboutBody)}
        ${photoField("Foto o video de fondo del encabezado", "aboutMediaUrl", db.site.aboutMediaUrl, null, true)}
        <div class="form-actions"><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
      </form>`,
      (data) => {
        db.site.aboutTitle = data.aboutTitle;
        db.site.aboutBody = data.aboutBody;
        db.site.aboutMediaUrl = data.aboutMediaUrl;
        persistAndReport(db, "Sección actualizada.");
      }
    );
  }

  function editSuperfan() {
    const db = getDB();
    const sf = db.superFan;
    openForm(
      "Editar Súper Fan",
      `<form>
        ${field("Título", "title", sf.title)}
        ${textarea("Descripción", "description", sf.description)}
        ${photoField("Imagen / banner", "bannerUrl", sf.bannerUrl)}
        <div class="form-row">
          ${field("Precio", "price", sf.price, "number", "0.01")}
          ${field("Etiqueta del precio", "priceLabel", sf.priceLabel)}
        </div>
        ${textarea("Beneficios (uno por línea)", "benefitsText", (sf.benefits || []).join("\n"))}
        ${field("Texto del botón", "ctaLabel", sf.ctaLabel)}
        ${field("Enlace de YouTube (Súper Fan)", "ctaLink", sf.ctaLink)}
        <div class="form-actions"><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
      </form>`,
      (data) => {
        db.superFan = {
          ...sf,
          title: data.title,
          description: data.description,
          bannerUrl: data.bannerUrl,
          price: Number(data.price) || 0,
          priceLabel: data.priceLabel,
          benefits: data.benefitsText.split("\n").map((s) => s.trim()).filter(Boolean),
          ctaLabel: data.ctaLabel,
          ctaLink: data.ctaLink,
        };
        persistAndReport(db, "Súper Fan actualizado.");
      }
    );
  }

  function editContactHero() {
    const db = getDB();
    openForm(
      "Editar encabezado de Contacto",
      `<form>
        ${field("Antetítulo", "contactEyebrow", db.site.contactEyebrow)}
        ${field("Título", "contactTitle", db.site.contactTitle)}
        ${textarea("Subtítulo / descripción", "contactSubtitle", db.site.contactSubtitle)}
        ${field("Palabras clave (separadas por coma)", "contactTags", db.site.contactTags)}
        ${photoField("Foto o video de fondo", "contactMediaUrl", db.site.contactMediaUrl, null, true)}
        <div class="form-actions"><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
      </form>`,
      (data) => {
        Object.assign(db.site, data);
        persistAndReport(db, "Encabezado actualizado.");
      }
    );
  }

  function editContact() {
    const db = getDB();
    openForm(
      "Editar redes y contacto",
      `<form>
        ${field("Instagram", "instagramUrl", db.site.instagramUrl)}
        ${field("Facebook", "facebookUrl", db.site.facebookUrl)}
        ${field("TikTok", "tiktokUrl", db.site.tiktokUrl)}
        ${field("Correo de contacto", "contactEmail", db.site.contactEmail, "email")}
        ${field("Teléfono", "phone", db.site.phone)}
        ${field("Ubicación", "location", db.site.location)}
        ${textarea("Horario", "hours", db.site.hours)}
        <div class="form-actions"><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
      </form>`,
      (data) => {
        Object.assign(db.site, data);
        persistAndReport(db, "Redes y contacto actualizados.");
      }
    );
  }

  function editContactCta() {
    const db = getDB();
    openForm(
      "Editar sección final",
      `<form>
        ${field("Antetítulo", "ctaEyebrow", db.site.ctaEyebrow)}
        ${field("Título", "ctaTitle", db.site.ctaTitle)}
        ${field("Subtítulo", "ctaSubtitle", db.site.ctaSubtitle)}
        ${field("Texto del botón", "ctaButtonLabel", db.site.ctaButtonLabel)}
        ${field("Enlace del botón", "ctaButtonLink", db.site.ctaButtonLink)}
        ${photoField("Foto o video de fondo", "ctaMediaUrl", db.site.ctaMediaUrl, null, true)}
        <div class="form-actions"><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
      </form>`,
      (data) => {
        Object.assign(db.site, data);
        persistAndReport(db, "Sección actualizada.");
      }
    );
  }

  function editContactForm() {
    const db = getDB();
    openForm(
      "Editar formulario de contacto",
      `<form>
        ${field("Opciones de \"¿En qué estás interesado?\" (separadas por coma)", "contactFormOptions", db.site.contactFormOptions)}
        ${field("Correo al que llegan los mensajes (vacío = usar el correo de contacto)", "contactFormRecipient", db.site.contactFormRecipient, "email")}
        <div class="form-actions"><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
      </form>`,
      (data) => {
        Object.assign(db.site, data);
        persistAndReport(db, "Formulario actualizado.");
      }
    );
  }

  /* ---------------- Delegación de clicks del panel admin ---------------- */

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || !document.body.classList.contains("admin-mode")) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    switch (action) {
      case "add-event": return addEvent();
      case "edit-event": return editEvent(id);
      case "delete-event": return deleteEvent(id);

      case "add-wrestler": return addWrestler(btn.dataset.categoryId);
      case "edit-wrestler": return editWrestler(id);
      case "delete-wrestler": return deleteWrestler(id);
      case "move-wrestler-up": return moveWrestler(id, -1);
      case "move-wrestler-down": return moveWrestler(id, 1);

      case "add-category": return addCategory();
      case "delete-category": return deleteCategory(id);
      case "move-category-up": return moveCategory(id, -1);
      case "move-category-down": return moveCategory(id, 1);

      case "add-ticket": return addTicket(btn.dataset.eventId);
      case "edit-ticket": return editTicket(id);
      case "delete-ticket": return deleteTicket(id);

      case "edit-hero": return editHero();
      case "edit-about": return editAbout();
      case "edit-superfan": return editSuperfan();
      case "edit-contact-hero": return editContactHero();
      case "edit-contact": return editContact();
      case "edit-contact-cta": return editContactCta();
      case "edit-contact-form": return editContactForm();
      default: return;
    }
  });
})();
