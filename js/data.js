/**
 * data.js
 * ------------------------------------------------------------------
 * Toda la información editable del sitio vive aquí, en objetos y
 * arrays planos como valores de fábrica (DEFAULT_DB). El "Modo
 * Administrador" lee y guarda esos mismos datos, pero el
 * almacenamiento real es Firebase Firestore (base de datos en la
 * nube) — así cualquier dispositivo ve los mismos cambios, no solo
 * el navegador donde se editó. Las fotos y videos se suben a
 * Cloudinary y solo su URL final se guarda en Firestore.
 * ------------------------------------------------------------------
 */

const ADMIN_KEY = "EPW_ADMIN_SESSION"; // solo para recordar la sesión de admin en ESTE navegador; no guarda contenido

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

/**
 * ------------------------------------------------------------------
 * BASE DE DATOS EN LÍNEA (Firebase) — así todos los dispositivos ven
 * lo mismo, no solo el navegador donde se editó.
 *
 * PASOS PARA ACTIVARLO (una sola vez, ~10 minutos):
 * 1. Ve a https://console.firebase.google.com/ e inicia sesión con
 *    una cuenta de Google.
 * 2. "Agregar proyecto" → dale cualquier nombre → puedes desactivar
 *    Google Analytics → "Crear proyecto".
 * 3. En el menú izquierdo: "Compilación" → "Firestore Database" →
 *    "Crear base de datos" → elige una ubicación → "Iniciar en modo
 *    de prueba" (esto permite leer/escribir sin login; es aceptable
 *    para este prototipo, igual que la contraseña de administrador
 *    de arriba no es un sistema de seguridad real).
 * 4. Click en el ícono de engranaje (arriba a la izquierda) →
 *    "Configuración del proyecto" → baja hasta "Tus apps" → ícono
 *    "</>" (Web) → dale un apodo → "Registrar app". Ahí te va a
 *    mostrar un bloque `firebaseConfig = {...}` — copia esos 6-7
 *    valores y pégalos abajo, reemplazando el objeto de ejemplo.
 * 5. Sube el data.js actualizado a GitHub. Listo — desde ese momento
 *    todos los dispositivos leen y escriben en el mismo lugar.
 * (Para fotos y videos usamos Cloudinary en vez de Firebase Storage
 * — ver las instrucciones más abajo en este mismo archivo).
 * ------------------------------------------------------------------
 */
const firebaseConfig = {
  apiKey: "AIzaSyAcNLa4Oap7suMjGCq4uHYsSXTguufqkzg",
  authDomain: "epw-website.firebaseapp.com",
  projectId: "epw-website",
  storageBucket: "epw-website.firebasestorage.app",
  messagingSenderId: "1079374497399",
  appId: "1:1079374497399:web:fd0a2470ea275d382ce872",
};

firebase.initializeApp(firebaseConfig);
const firestoreDB = firebase.firestore();
const SITE_DOC = firestoreDB.collection("epw-site").doc("main");

/** Copia en memoria de los datos, para que getDB() siga siendo instantáneo (sin esperar red) en todo el resto del código. Se llena en initDB() al arrancar. */
let _cachedDB = null;

/**
 * Debe llamarse UNA vez al arrancar la página (antes de renderAll),
 * y hay que esperarla (await) porque trae los datos de internet.
 * Si es la primera vez que alguien visita (el documento no existe
 * todavía en Firestore), siembra los valores de fábrica.
 */
async function initDB() {
  try {
    const snap = await SITE_DOC.get();
    if (snap.exists) {
      _cachedDB = { ...structuredClone(DEFAULT_DB), ...snap.data() };
    } else {
      _cachedDB = structuredClone(DEFAULT_DB);
      await SITE_DOC.set(_cachedDB);
    }
  } catch (err) {
    console.error("No se pudo conectar con Firebase, usando valores de fábrica localmente.", err);
    _cachedDB = structuredClone(DEFAULT_DB);
  }
}

/** Devuelve la copia ya cargada (ver initDB). Síncrono, como antes. */
function getDB() {
  return _cachedDB ? structuredClone(_cachedDB) : structuredClone(DEFAULT_DB);
}

/** Guarda en Firestore (nube, para todos) y actualiza la copia local. */
async function saveDB(db) {
  try {
    await SITE_DOC.set(db);
    _cachedDB = structuredClone(db);
    return true;
  } catch (err) {
    console.error("No se pudo guardar en Firebase.", err);
    return false;
  }
}

/** Restaura los valores de fábrica para todo el mundo (botón de emergencia para el admin). */
async function resetDB() {
  _cachedDB = structuredClone(DEFAULT_DB);
  await SITE_DOC.set(_cachedDB);
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

/**
 * ------------------------------------------------------------------
 * Fotos y videos: se suben a Cloudinary (gratis, sin tarjeta) en vez
 * de Firebase Storage (que ahora exige tarjeta de crédito desde
 * feb. 2026, aunque el uso normal siga siendo gratis).
 *
 * PARA ACTIVARLO (~5 minutos, una sola vez):
 * 1. Ve a https://cloudinary.com/users/register/free y crea una
 *    cuenta gratis (no pide tarjeta).
 * 2. En el Dashboard, arriba, copia tu "Cloud name" y pégalo abajo
 *    en CLOUDINARY_CLOUD_NAME.
 * 3. Ve a Settings (engranaje) → pestaña "Upload" → baja hasta
 *    "Upload presets" → "Add upload preset". Ponle "Signing Mode"
 *    en "Unsigned" (muy importante) → Save. Copia el nombre del
 *    preset que se creó (algo como "xxxxxxxx") y pégalo abajo en
 *    CLOUDINARY_UPLOAD_PRESET.
 * ------------------------------------------------------------------
 */
const CLOUDINARY_CLOUD_NAME = "fmajgain";
const CLOUDINARY_UPLOAD_PRESET = "EPW-WEB";

function isIdbRef(value) {
  // Ya no se usa para archivos nuevos (ver comentario abajo), se
  // deja solo por si quedó algún valor viejo guardado.
  return typeof value === "string" && value.startsWith("idb:");
}

function idbKeyFromRef(ref) {
  return ref.slice(4);
}

/** Sube un archivo a Cloudinary y devuelve su URL pública final. */
async function idbSetFile(key, file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("public_id", key);
  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Error al subir el archivo a Cloudinary.");
  }
  return data.secure_url;
}

/** Ya no se usa para archivos nuevos (que son URLs directas), se deja solo por compatibilidad. */
async function idbGetFile() {
  return null;
}

/** Borrar de Cloudinary requiere una llamada firmada desde un servidor (no se puede hacer segura solo con JavaScript en el navegador), así que por ahora las fotos reemplazadas simplemente quedan sin usar en la cuenta de Cloudinary — no afecta al sitio ni tiene costo dentro del plan gratis. */
async function idbDeleteFile() {
  return true;
}

