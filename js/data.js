/**
 * data.js
 * ------------------------------------------------------------------
 * Toda la información editable del sitio vive aquí, en objetos y
 * arrays planos. El "Modo Administrador" lee estos mismos arrays,
 * los modifica y guarda una copia en localStorage bajo NOCTURNA_DB.
 * Cuando exista un backend real, basta con reemplazar las funciones
 * de este archivo (getDB / saveDB) por llamadas fetch() a una API:
 * el resto del sitio (app.js, admin.js) no necesita cambiar porque
 * siempre consume datos a través de getDB().
 * ------------------------------------------------------------------
 */

const STORAGE_KEY = "NOCTURNA_DB";
const ADMIN_KEY = "NOCTURNA_ADMIN_SESSION";

// Contraseña de administrador del prototipo.
// ADVERTENCIA: esto es solo para maquetar la interfaz. No es un
// sistema de seguridad real. Antes de vender tickets de verdad,
// esto debe moverse a un backend con autenticación real.
const ADMIN_PASSWORD = "nocturna2026";

/**
 * Estado inicial / valores de fábrica. Si el visitante nunca ha
 * usado el modo administrador, el sitio se ve exactamente así.
 */
const DEFAULT_DB = {
  site: {
    brand: "EPW",
    tagline: "La lucha libre no duerme.",
    heroSubtitle:
      "Cada mes, el cuadrilátero se enciende cuando cae el sol. Combates reales, personajes reales, una noche que no vas a olvidar.",
    heroMediaUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    contactEmail: "",
    logoUrl: "",
    aboutTitle: "Diez años saliendo a escena cuando todo lo demás cierra",
    aboutBody:
      "EPW nació en un gimnasio sin techo y una lona prestada. Hoy llenamos arenas, pero la idea sigue intacta: la función empieza cuando anochece y no para hasta que alguien queda tirado en la lona. Formamos luchadores, armamos rivalidades que duran años y tratamos cada boleto vendido como una promesa que hay que cumplir arriba del ring.",
    aboutMediaUrl: "",
    contactEyebrow: "Hablemos",
    contactTitle: "Contáctanos",
    contactSubtitle:
      "¿Tienes preguntas, quieres entrenar con nosotros, colaborar o ser parte de algún evento? Escríbenos, estamos listos para ayudarte.",
    contactTags: "Disciplina, Comunidad, Lucha, Evolución",
    contactMediaUrl: "",
    contactFormOptions: "Entrenar, Asistir a un evento, Colaborar / patrocinio, Otro",
    contactFormRecipient: "",
    location: "San Juan, Puerto Rico",
    phone: "",
    hours: "Lunes - Sábados\n10:00 AM - 10:00 PM",
    ctaEyebrow: "Más que lucha",
    ctaTitle: "Sé parte del movimiento",
    ctaSubtitle: "Entrena. Vive. Lucha.",
    ctaButtonLabel: "Únete Ahora",
    ctaButtonLink: "contacto.html",
    ctaMediaUrl: "",
  },

  events: [
    {
      id: "ev-001",
      name: "Noche de Sangre",
      posterUrl: "",
      date: "2026-10-17",
      time: "20:30",
      venue: "Arena Central",
      address: "Av. Insurgentes 1450, Ciudad de México",
      description:
        "La rivalidad entre El Espectro y Máquina 7 llega a su punto de quiebre en una jaula de acero. Además, título de parejas en juego.",
    },
    {
      id: "ev-002",
      name: "Guerra de Territorios",
      posterUrl: "",
      date: "2026-11-14",
      time: "19:00",
      venue: "Palacio de los Deportes",
      address: "Río Churubusco s/n, Ciudad de México",
      description:
        "Battle royal de 20 luchadores por el derecho a retar al campeón. Entran veinte, sale uno.",
    },
    {
      id: "ev-003",
      name: "Última Función del Año",
      posterUrl: "",
      date: "2026-12-19",
      time: "20:00",
      venue: "Coliseo Norte",
      address: "Blvd. Manuel Ávila Camacho 88, Ciudad de México",
      description:
        "Cierre de temporada con el campeonato mundial en disputa y el debut de dos luchadores enmascarados.",
    },
  ],

  rosterCategories: [
    { id: "campeones", label: "Campeones" },
    { id: "activos", label: "Luchadores Activos" },
    { id: "femeninas", label: "Luchadoras Féminas" },
    { id: "narradores", label: "Narradores" },
    { id: "arbitros", label: "Árbitros" },
  ],

  wrestlers: [
    {
      id: "wr-001",
      categoryId: "activos",
      photoUrl: "",
      name: "Daniel Restrepo",
      ringName: "El Espectro",
      bio: "Técnico veloz, especialista en llaves aéreas. Campeón EPW 2024-2025.",
      instagram: "https://instagram.com/elespectro",
      facebook: "",
      tiktok: "https://tiktok.com/@elespectro",
      youtube: "",
      twitter: "https://x.com/elespectro",
      website: "",
    },
    {
      id: "wr-002",
      categoryId: "activos",
      photoUrl: "",
      name: "Marco Villanueva",
      ringName: "Máquina 7",
      bio: "Rudo de fuerza bruta. Nunca ha sido noqueado antes del minuto veinte.",
      instagram: "https://instagram.com/maquina7oficial",
      facebook: "https://facebook.com/maquina7oficial",
      tiktok: "",
      youtube: "https://youtube.com/@maquina7",
      twitter: "",
      website: "",
    },
    {
      id: "wr-003",
      categoryId: "femeninas",
      photoUrl: "",
      name: "Renata Cruz",
      ringName: "Furia",
      bio: "La primera mujer en encabezar una función EPW. Estilo agresivo, sin miedo a las alturas.",
      instagram: "https://instagram.com/furia.nocturna",
      facebook: "",
      tiktok: "https://tiktok.com/@furia.nocturna",
      youtube: "",
      twitter: "",
      website: "https://furiaoficial.com",
    },
  ],

  ticketTypes: [
    {
      id: "tk-001",
      eventId: "ev-001",
      name: "General",
      description: "Acceso a gradas generales. Numeración por orden de llegada.",
      price: 350,
      currency: "MXN",
      quantityAvailable: 800,
      imageUrl: "",
      purchaseLink: "",
    },
    {
      id: "tk-002",
      eventId: "ev-001",
      name: "Ringside",
      description: "Primeras filas alrededor del cuadrilátero. Asiento numerado.",
      price: 900,
      currency: "MXN",
      quantityAvailable: 150,
      imageUrl: "",
      purchaseLink: "",
    },
    {
      id: "tk-003",
      eventId: "ev-001",
      name: "VIP EPW",
      description:
        "Ringside + acceso a zona de meet & greet con luchadores después de la función.",
      price: 1600,
      currency: "MXN",
      quantityAvailable: 40,
      imageUrl: "",
      purchaseLink: "",
    },
  ],

  superFan: {
    bannerUrl: "",
    title: "Súper Fan",
    description:
      "Para quienes no se pierden una función. Únete a la membresía Súper Fan de EPW en YouTube: acceso prioritario, precios especiales y contenido que nadie más ve.",
    benefits: [
      "Preventa exclusiva antes que el público general",
      "Descuento fijo en todos los boletos",
      "Contenido detrás de cámaras cada semana",
      "Sorteo mensual de acceso a camerinos",
    ],
    price: 199,
    priceLabel: "por mes",
    ctaLabel: "Convertirme en Súper Fan (YouTube)",
    ctaLink: "",
  },
};

/** Devuelve una copia profunda del estado guardado, o el default. */
function getDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DB);
    const parsed = JSON.parse(raw);
    // merge superficial por si el default gana nuevas llaves con el tiempo
    return { ...structuredClone(DEFAULT_DB), ...parsed };
  } catch (err) {
    console.error("No se pudo leer NOCTURNA_DB, usando valores de fábrica.", err);
    return structuredClone(DEFAULT_DB);
  }
}

/** Persiste el estado completo. */
function saveDB(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return true;
  } catch (err) {
    console.error("No se pudo guardar en localStorage.", err);
    return false;
  }
}

/** Restaura los valores de fábrica (botón de emergencia para el admin). */
function resetDB() {
  localStorage.removeItem(STORAGE_KEY);
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

/**
 * ------------------------------------------------------------------
 * Almacenamiento de archivos pesados (foto/video del hero) en
 * IndexedDB en vez de localStorage. localStorage solo tiene unos
 * 5-10MB libres en la mayoría de navegadores, así que un video de
 * varios MB nunca cabría ahí. IndexedDB soporta cientos de MB.
 *
 * El objeto guardado en NOCTURNA_DB (localStorage) solo contiene una
 * referencia liviana como "idb:media:heroMediaUrl"; el archivo real
 * (el Blob) vive en IndexedDB bajo esa misma clave.
 * ------------------------------------------------------------------
 */

const MEDIA_DB_NAME = "NOCTURNA_MEDIA";
const MEDIA_STORE = "files";

function isIdbRef(value) {
  return typeof value === "string" && value.startsWith("idb:");
}

function idbKeyFromRef(ref) {
  return ref.slice(4); // quita el prefijo "idb:"
}

function openMediaDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("Este navegador no soporta IndexedDB."));
      return;
    }
    const req = indexedDB.open(MEDIA_DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(MEDIA_STORE)) {
        req.result.createObjectStore(MEDIA_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Guarda un archivo (File/Blob) en IndexedDB bajo la clave dada. */
async function idbSetFile(key, file) {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    tx.objectStore(MEDIA_STORE).put(file, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/** Recupera un archivo (File/Blob) de IndexedDB, o null si no existe. */
async function idbGetFile(key) {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readonly");
    const req = tx.objectStore(MEDIA_STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/** Borra un archivo de IndexedDB. */
async function idbDeleteFile(key) {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    tx.objectStore(MEDIA_STORE).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
