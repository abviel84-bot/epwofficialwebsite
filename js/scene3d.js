/**
 * scene3d.js
 * ------------------------------------------------------------------
 * El video del ring es el fondo 3D de todo el sitio, como en un
 * videojuego: la escena NUNCA se recarga.
 *
 * - Al hacer clic en el menú, la página no se recarga: la cámara viaja
 *   por el ring mientras el contenido cambia por debajo, y aparece al
 *   llegar. Las páginas se precargan en segundo plano, así que el
 *   cambio es instantáneo.
 * - Recorrido: afuera del ring → centro del ring → logo → y de vuelta.
 * - El video está a 50 cuadros por segundo (interpolado desde el
 *   original de 25) y hay una copia al revés para retroceder igual de
 *   fluido.
 * - El banner de Espíritu Dojo ondea y el neón respira (WebGL).
 * - Se adapta a la conexión: video liviano en celular y solo fotos con
 *   ahorro de datos.
 * Se carga en el <head> para que el primer cuadro salga sin parpadeo.
 * ------------------------------------------------------------------
 */
(function () {
  const DUR = 303 / 50;
  const BASE = "assets/scene/";

  const RING = 0.04, CENTRO = 3.0, LOGO = DUR - 0.06;
  const STOPS = { home: RING, eventos: CENTRO, luchadores: LOGO, tickets: CENTRO, nosotros: RING, contacto: CENTRO };
  const STILL = { home: "ring", eventos: "centro", luchadores: "logo", tickets: "centro", nosotros: "ring", contacto: "centro" };
  const URLS = { home: "index.html", eventos: "eventos.html", luchadores: "luchadores.html", tickets: "tickets.html", nosotros: "nosotros.html", contacto: "contacto.html" };

  const pageOf = (path) => {
    const file = (path.split("/").pop() || "index.html").replace(/\.html?$/, "").toLowerCase();
    return file === "" || file === "index" ? "home" : file;
  };
  let PAGE = pageOf(location.pathname);
  const known = PAGE in STOPS;

  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ARRIVE_KEY = "EPW_SCENE_ARRIVE";
  const stillUrl = (key) => `${BASE}s-${STILL[key]}.jpg`;

  if (known) {
    root.classList.add("scene-on");
    root.style.background = `linear-gradient(180deg, rgba(8,10,8,.55), rgba(8,10,8,.2) 35%, rgba(8,10,8,.75)), #0a0c0a url("${stillUrl(PAGE)}") center / cover fixed no-repeat`;
  }
  try {
    if (sessionStorage.getItem(ARRIVE_KEY) === PAGE) root.classList.add("scene-entering");
    sessionStorage.removeItem(ARRIVE_KEY);
  } catch (_) {}

  // Calidad según la conexión
  const conn = navigator.connection || {};
  const slow = conn.saveData || ["slow-2g", "2g"].includes(conn.effectiveType);
  const small = innerWidth < 768 || conn.effectiveType === "3g" || (conn.downlink && conn.downlink < 1.5);
  const MODE = slow || reduce ? "lite" : small ? "sd" : "hd";
  const LOCAL_FILE = location.protocol === "file:"; // abierto con doble clic: sin WebGL ni cambio sin recarga

  // Dónde está el banner (cuadro del video original a 25 fps, x0, y0, x1, y1)
  const BANNER = [
    [0, .41, .37, .50, .57], [25, .41, .36, .49, .52], [50, .40, .33, .50, .54],
    [75, .39, .32, .50, .54], [100, .37, .26, .55, .68], [115, .35, .18, .60, .72],
    [130, .33, .08, .66, .79], [140, .34, .04, .66, .81], [152, .31, .01, .66, .81]
  ];
  function bannerAt(f) {
    let k = 0; while (k < BANNER.length - 2 && BANNER[k + 1][0] <= f) k++;
    const a = BANNER[k], b = BANNER[k + 1], t = Math.min(1, Math.max(0, (f - a[0]) / (b[0] - a[0])));
    return [1, 2, 3, 4].map((j) => a[j] + (b[j] - a[j]) * t);
  }

  const now = () => performance.now() / 1000;
  const once = (el, ev) => new Promise((r) => el.addEventListener(ev, r, { once: true }));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!known) {
      PAGE = document.body.dataset.page;
      if (!(PAGE in STOPS)) return;
      root.classList.add("scene-on");
    }

    // ---------- DOM ----------
    const wrap = document.createElement("div");
    wrap.className = "scene3d";
    wrap.setAttribute("aria-hidden", "true");
    wrap.style.backgroundImage = `url("${stillUrl(PAGE)}")`;
    const canvas = document.createElement("canvas");
    const scrim = document.createElement("div"); scrim.className = "scene3d-scrim";
    const dim = document.createElement("div"); dim.className = "scene3d-dim";
    wrap.append(canvas, scrim, dim);
    document.body.prepend(wrap);

    // En Inicio la escena se ve completa; en las demás, un poco más oscura para leer mejor
    const updateDim = () => {
      const base = PAGE === "home" ? 0 : .3;
      dim.style.opacity = Math.min(.82, Math.max(base, (scrollY / innerHeight) * .9)).toFixed(3);
    };
    addEventListener("scroll", updateDim, { passive: true }); updateDim();

    if (root.classList.contains("scene-entering"))
      requestAnimationFrame(() => setTimeout(() => root.classList.remove("scene-entering"), 60));

    // ---------- Estado ----------
    let time = STOPS[PAGE], arrivedAt = now(), zoomMix = 0;
    let videoReady = false, run = null, pending = null, needUpload = true, shown = null, fade = null;
    const stills = {};
    const mkVideo = () => {
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto";
      v.setAttribute("playsinline", ""); v.setAttribute("muted", "");
      return v;
    };
    const VF = mkVideo(), VR = mkVideo();

    // Sube la imagen a la GPU solo cuando el video tiene un cuadro nuevo
    const hasRVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;
    if (hasRVFC) [VF, VR].forEach((v) => {
      const onFrame = () => { if (v === shown) needUpload = true; v.requestVideoFrameCallback(onFrame); };
      v.requestVideoFrameCallback(onFrame);
    });

    // ---------- Render ----------
    let W = 0, H = 0;
    const gl = LOCAL_FILE ? null : canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, powerPreference: "high-performance" });
    let draw;
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 1.25);
      W = canvas.width = Math.round(canvas.clientWidth * dpr);
      H = canvas.height = Math.round(canvas.clientHeight * dpr);
      if (gl) gl.viewport(0, 0, W, H);
    }
    const srcSize = (s) => s instanceof HTMLVideoElement ? [s.videoWidth || 1280, s.videoHeight || 720] : [s.naturalWidth || s.width, s.naturalHeight || s.height];

    if (gl) {
      const vs = "attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; v.y = 1. - v.y; gl_Position = vec4(p, 0., 1.); }";
      const fs = `precision mediump float;
        varying vec2 v; uniform sampler2D A, B; uniform float mixF, t, zoom; uniform vec2 scale; uniform vec4 flag;
        void main(){
          vec2 uv = (v - .5) * scale / zoom + .5;
          vec2 sz = flag.zw - flag.xy;
          vec2 q = (uv - flag.xy) / sz;
          float m = smoothstep(-.06, .04, q.x) * smoothstep(1.06, .96, q.x) * smoothstep(-.03, .04, q.y) * smoothstep(1.08, .96, q.y);
          float hang = clamp(q.y, 0., 1.);
          float ph = q.x * 8. + q.y * 2.5 - t * 1.9;
          vec2 d = vec2(sin(ph) * .028 * (.25 + hang), sin(ph * .6 + 1.7 + t * .4) * .012 * hang) * sz * m;
          vec2 s = uv + d;
          vec3 c = mix(texture2D(A, s).rgb, texture2D(B, s).rgb, mixF);
          c *= 1. + cos(ph) * .16 * (.3 + hang) * m;
          float g = clamp(c.g - max(c.r, c.b), 0., 1.);
          c += vec3(0., g * .35 * sin(t * 1.3), 0.);
          gl_FragColor = vec4(c, 1.);
        }`;
      const sh = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); return s; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog); gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U = (n) => gl.getUniformLocation(prog, n);
      const uMix = U("mixF"), uT = U("t"), uScale = U("scale"), uFlag = U("flag"), uZoom = U("zoom");
      gl.uniform1i(U("A"), 0); gl.uniform1i(U("B"), 1);
      const tex = [0, 1].map((unit) => {
        const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx);
        [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return tx;
      });
      const bound = [null, null];
      const upload = (unit, src, force) => {
        if (bound[unit] === src && !force) return;
        gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex[unit]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        bound[unit] = src;
      };
      draw = (a, b, f, t, frame, zoom, fresh) => {
        upload(0, a, fresh); upload(1, b, false);
        const [iw, ih] = srcSize(a), s = Math.max(W / iw, H / ih);
        gl.uniform2f(uScale, W / (iw * s), H / (ih * s));
        gl.uniform1f(uMix, f); gl.uniform1f(uT, t); gl.uniform1f(uZoom, zoom);
        gl.uniform4fv(uFlag, bannerAt(frame));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
    } else {
      const ctx = canvas.getContext("2d");
      const cover = (img, alpha) => {
        const [iw, ih] = srcSize(img), s = Math.max(W / iw, H / ih), w = iw * s, h = ih * s;
        ctx.globalAlpha = alpha; ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      };
      draw = (a, b, f) => { cover(a, 1); if (f > .01) cover(b, f); ctx.globalAlpha = 1; };
    }
    addEventListener("resize", resize);

    // ---------- Viaje de cámara ----------
    const vidTime = (v) => v === VF ? v.currentTime : DUR - v.currentTime;
    let onArrive = null, onNear = null;

    function arrive() {
      arrivedAt = now();
      const near = onNear; onNear = null; if (near) near();
      const cb = onArrive; onArrive = null; if (cb) cb();
    }

    async function travel(to) {
      const dir = Math.sign(to - time);
      if (Math.abs(to - time) < 0.02) { if (run) { run.vid.pause(); run = null; } arrive(); return; }
      const vid = dir > 0 ? VF : VR;
      if (run && run.vid === vid) { run.target = to; return; }   // misma dirección: solo cambia el destino
      if (run) { run.vid.pause(); run = null; }
      const token = pending = {};
      const want = dir > 0 ? time : DUR - time;
      if (Math.abs(vid.currentTime - want) > 0.01) { vid.currentTime = want; await once(vid, "seeked"); }
      if (pending !== token) return;
      // Duración parecida para todos los viajes (~1.3 s)
      const max = Math.min(4, Math.max(1.2, Math.abs(to - time) / 1.05));
      vid.playbackRate = max * 0.3;
      run = { vid, dir, target: to, start: now(), max };
      shown = vid; needUpload = true;
      try { await vid.play(); } catch (_) { vid.pause(); run = null; time = to; arrive(); }
    }

    function steer() {
      if (!run) return;
      const v = run.vid;
      time = vidTime(v);
      const remaining = (run.target - time) * run.dir;
      if (remaining <= 0.012 || v.ended) { v.pause(); run = null; needUpload = true; arrive(); return; }
      if (onNear && remaining < 0.25 * run.max) { const n = onNear; onNear = null; n(); }   // ~0.3 s antes de llegar
      const accel = Math.min(1, 0.3 + (now() - run.start) / 0.45);          // arranque suave
      const decel = Math.min(1, Math.sqrt(remaining / (0.5 * run.max)));   // frenado suave
      const rate = Math.max(0.35, run.max * Math.min(accel, decel));
      if (Math.abs(rate - v.playbackRate) > 0.05) v.playbackRate = rate;
    }

    // ---------- Bucle ----------
    function loop() {
      const t = now();
      steer();
      const atLogo = STOPS[PAGE] >= LOGO && !run && !reduce;
      zoomMix += ((atLogo ? 1 : 0) - zoomMix) * .03;
      const zoom = 1 + zoomMix * .035 * (.5 - .5 * Math.cos((t - arrivedAt) * .5));
      const tt = reduce ? 0 : t;

      if (fade) {
        const k = Math.min(1, (t - fade.start) / fade.dur), e = k * k * (3 - 2 * k);
        draw(fade.a, fade.b, e, tt, STOPS[e < .5 ? fade.fromKey : fade.toKey] * 25, zoom, false);
        if (k >= 1) { const done = fade.done; fade = null; done(); }
      } else if (shown && shown.readyState >= 2) {
        draw(shown, shown, 0, tt, time * 25, zoom, hasRVFC ? needUpload : (needUpload || !!run));
        needUpload = false;
      } else if (stills[PAGE]) {
        draw(stills[PAGE], stills[PAGE], 0, tt, STOPS[PAGE] * 25, zoom, false);
      }
      requestAnimationFrame(loop);
    }

    // ---------- Páginas precargadas (cambio sin recargar) ----------
    const SPA = !LOCAL_FILE && "fetch" in window && "DOMParser" in window;
    const pageDocs = {};
    const getDoc = (key) => {
      if (!pageDocs[key]) pageDocs[key] = fetch(URLS[key], { credentials: "same-origin" })
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then((html) => new DOMParser().parseFromString(html, "text/html"))
        .catch((err) => { delete pageDocs[key]; throw err; });
      return pageDocs[key];
    };

    function swapContent(doc, key) {
      const newMain = doc.querySelector("main");
      const oldMain = document.querySelector("main");
      if (!newMain || !oldMain) throw new Error("sin <main>");
      oldMain.replaceWith(document.importNode(newMain, true));
      document.title = doc.title;
      document.body.dataset.page = doc.body.dataset.page || key;
      // Modales propios de cada página (por ejemplo, el perfil de luchador en Roster)
      const newIds = new Set([...doc.querySelectorAll(".modal-overlay")].map((m) => m.id));
      document.querySelectorAll(".modal-overlay").forEach((m) => { if (!newIds.has(m.id)) m.remove(); });
      doc.querySelectorAll(".modal-overlay").forEach((m) => {
        if (!document.getElementById(m.id)) document.body.appendChild(document.importNode(m, true));
      });
      PAGE = key;
      scrollTo(0, 0); updateDim();
      if (window.NOCTURNA && typeof window.NOCTURNA.renderAll === "function") {
        try { window.NOCTURNA.renderAll(); } catch (err) { console.error(err); }
      }
    }

    // Cierre de modales que llegan con el cambio de página
    document.addEventListener("click", (e) => {
      const overlay = e.target.classList && e.target.classList.contains("modal-overlay") ? e.target : null;
      const closeBtn = e.target.closest && e.target.closest("#wrestlerModalClose");
      if ((overlay || closeBtn) && window.NOCTURNA) window.NOCTURNA.closeModal((overlay || closeBtn.closest(".modal-overlay")).id);
    });

    let navToken = 0;
    async function navigate(key, push) {
      const token = ++navToken;
      if (push) history.pushState({ epwPage: key }, "", URLS[key]);

      root.classList.remove("scene-entering");
      root.classList.add("scene-leaving");

      // La cámara arranca de inmediato
      const arrived = new Promise((res) => {
        if (reduce) { time = STOPS[key]; res(); return; }
        if (videoReady) { onArrive = res; travel(STOPS[key]); }
        else if (stills[key] && stills[PAGE]) {
          fade = { a: stills[PAGE], b: stills[key], fromKey: PAGE, toKey: key, start: now(), dur: .8, done: res };
        } else res();
      });
      // El contenido nuevo aparece un poco antes de que la cámara pare
      const near = new Promise((res) => { onNear = res; setTimeout(res, 2200); });

      let doc;
      try { [doc] = await Promise.all([getDoc(key), wait(reduce ? 0 : 460)]); }
      catch (_) { location.href = URLS[key]; return; }       // si falla, navegación normal
      if (token !== navToken) return;

      try { swapContent(doc, key); } catch (_) { location.href = URLS[key]; return; }
      root.classList.remove("scene-leaving");
      root.classList.add("scene-entering");

      await Promise.race([near, arrived]);
      if (token !== navToken) return;
      requestAnimationFrame(() => root.classList.remove("scene-entering"));
    }

    // Recarga completa con cinemática (si no se puede cambiar sin recargar)
    function navigateWithReload(key) {
      root.classList.add("scene-leaving");
      const go = () => { try { sessionStorage.setItem(ARRIVE_KEY, key); } catch (_) {} location.href = URLS[key]; };
      if (reduce) return go();
      if (videoReady) { onArrive = go; travel(STOPS[key]); }
      else if (stills[key] && stills[PAGE]) fade = { a: stills[PAGE], b: stills[key], fromKey: PAGE, toKey: key, start: now(), dur: .7, done: go };
      else go();
    }

    // Intercepta los enlaces internos antes que cualquier otro script
    addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#") || /^(mailto|tel):/i.test(href)) return;
      let url; try { url = new URL(href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin || !/(\.html?|\/)$/.test(url.pathname) || url.hash) return;
      const key = pageOf(url.pathname);
      if (!(key in STOPS)) return;
      e.preventDefault();
      if (key === PAGE && !run) { scrollTo({ top: 0, behavior: "smooth" }); return; }
      if (SPA) navigate(key, true); else navigateWithReload(key);
    }, true);

    // Botones atrás / adelante del navegador
    if (SPA) {
      history.replaceState({ epwPage: PAGE }, "", location.href);
      addEventListener("popstate", () => {
        const key = pageOf(location.pathname);
        if (key in STOPS && key !== PAGE) navigate(key, false);
      });
    }

    // Página restaurada desde la caché del navegador
    addEventListener("pageshow", (e) => {
      if (!e.persisted) return;
      onArrive = null; onNear = null; fade = null;
      if (run) { run.vid.pause(); run = null; }
      root.classList.remove("scene-leaving", "scene-entering");
      time = STOPS[PAGE];
      if (videoReady) { VF.currentTime = time; shown = VF; once(VF, "seeked").then(() => { needUpload = true; }); }
    });

    // ---------- Carga ----------
    const loadImg = (src) => new Promise((res) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
    });
    const videoSrc = async (url) => {
      if (LOCAL_FILE) return url;
      return URL.createObjectURL(await (await fetch(url)).blob());
    };
    const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 600));

    (async () => {
      stills[PAGE] = await loadImg(stillUrl(PAGE));
      resize(); requestAnimationFrame(loop);
      Object.keys(STOPS).forEach(async (k) => { if (!stills[k]) stills[k] = await loadImg(stillUrl(k)); });
      if (SPA) idle(() => Object.keys(URLS).forEach((k) => { if (k !== PAGE) getDoc(k).catch(() => {}); }));
      if (MODE === "lite") return;
      try {
        const [f, r] = await Promise.all([videoSrc(`${BASE}${MODE}-f.mp4`), videoSrc(`${BASE}${MODE}-r.mp4`)]);
        VF.src = f; VR.src = r;
        await Promise.all([once(VF, "loadeddata"), once(VR, "loadeddata")]);
        if (run || fade) await new Promise((res) => { const c = () => (run || fade ? setTimeout(c, 100) : res()); c(); });
        time = STOPS[PAGE];
        VF.currentTime = time; await once(VF, "seeked");
        shown = VF; needUpload = true; videoReady = true;
      } catch (_) {
        // Sin video: se queda con los fundidos entre fotos
      }
    })();
  }
})();
