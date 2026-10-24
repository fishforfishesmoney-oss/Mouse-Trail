(() => {
  if (window.__cursorTrail) return;
  window.__cursorTrail = true;

  const CONFIG = {
    image: "images/star.svg", // file inside the images/ folder, or null to use EMOJI instead
    emoji: "✨",               // used when image is null
    length: 20,                // number of trail items
    size: 28,                  // starting size in px
    spin: true,                // rotate items as they age
    fade: true                 // fade older items out
  };

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

  let img = null;
  let imgReady = false;
  if (CONFIG.image) {
    img = new Image();
    img.onload = () => { imgReady = true; };
    img.onerror = () => { img = null; }; // fall back to emoji if the file is missing
    img.src = chrome.runtime.getURL(CONFIG.image);
  }

  const points = [];
  let mouse = null;

  addEventListener("mousemove", (e) => {
    mouse = { x: e.clientX, y: e.clientY };
  }, { passive: true });

  function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    if (mouse) points.push({ x: mouse.x, y: mouse.y });
    if (points.length > CONFIG.length || (!mouse && points.length)) points.shift();
    mouse = null;

    const useImage = CONFIG.image && img;
    if (!useImage || imgReady) {
      points.forEach((p, i) => {
        const t = (i + 1) / points.length; // near 0 = oldest, 1 = newest
        const s = CONFIG.size * t;
        ctx.save();
        ctx.translate(p.x, p.y);
        if (CONFIG.spin) ctx.rotate((1 - t) * Math.PI);
        if (CONFIG.fade) ctx.globalAlpha = t;
        if (useImage) {
          ctx.drawImage(img, -s / 2, -s / 2, s, s);
        } else {
          ctx.font = `${s}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(CONFIG.emoji, 0, 0);
        }
        ctx.restore();
      });
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
