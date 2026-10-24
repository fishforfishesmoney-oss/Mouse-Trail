(() => {
  if (window.__cursorTrail) return;
  window.__cursorTrail = true;

  const S = { image: null, size: 32, length: 20, spin: true, fade: true, enabled: true };
  let img = null;

  function setImage(src) {
    img = null;
    if (!src) return;
    const i = new Image();
    i.onload = () => { img = i; };
    i.src = src;
  }

  try {
    chrome.storage.local.get(S, (items) => {
      Object.assign(S, items);
      setImage(S.image);
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      for (const k in changes) S[k] = changes[k].newValue;
      if ("image" in changes) setImage(S.image);
    });
  } catch (e) { /* extension was reloaded; refresh the page */ }

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "2147483647"
  });
  document.documentElement.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener("resize", resize);

  const points = [];
  let mouse = null;

  addEventListener("mousemove", (e) => {
    mouse = { x: e.clientX, y: e.clientY };
  }, { passive: true });

  function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    if (S.enabled) {
      if (mouse) points.push({ x: mouse.x, y: mouse.y });
      while (points.length > S.length) points.shift();
      if (!mouse && points.length) points.shift(); // shrink when the mouse stops
    } else {
      points.length = 0;
    }
    mouse = null;

    points.forEach((p, i) => {
      const t = (i + 1) / points.length;   // near 0 = oldest, 1 = newest
      const s = S.size * t;
      ctx.save();
      ctx.translate(p.x, p.y);
      if (S.spin) ctx.rotate((1 - t) * Math.PI);
      if (S.fade) ctx.globalAlpha = t;
      if (img) {
        const ar = img.width / img.height || 1;
        const w = ar >= 1 ? s : s * ar;
        const h = ar >= 1 ? s / ar : s;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else if (!S.image) {
        ctx.font = `${s}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✨", 0, 0);
      }
      ctx.restore();
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
