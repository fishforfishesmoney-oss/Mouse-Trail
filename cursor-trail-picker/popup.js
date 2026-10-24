const DEFAULTS = { image: null, size: 32, length: 20, spin: true, fade: true, enabled: true };
const $ = (id) => document.getElementById(id);

function showPreview(src) {
  const p = $("preview");
  p.textContent = "";
  if (src) {
    const im = document.createElement("img");
    im.src = src;
    p.appendChild(im);
  } else {
    p.textContent = "✨";
  }
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const MAX = 128; // shrink so it stays small in storage
      const w0 = im.naturalWidth || MAX;
      const h0 = im.naturalHeight || MAX;
      const scale = Math.min(1, MAX / Math.max(w0, h0));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w0 * scale));
      c.height = Math.max(1, Math.round(h0 * scale));
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/png"));
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    im.src = url;
  });
}

function bindRange(id, key) {
  const el = $(id);
  el.addEventListener("input", () => {
    $(id + "Val").textContent = el.value;
    chrome.storage.local.set({ [key]: Number(el.value) });
  });
}

function bindCheck(id, key) {
  $(id).addEventListener("change", (e) => chrome.storage.local.set({ [key]: e.target.checked }));
}

chrome.storage.local.get(DEFAULTS, (s) => {
  showPreview(s.image);
  $("size").value = s.size;     $("sizeVal").textContent = s.size;
  $("length").value = s.length; $("lengthVal").textContent = s.length;
  $("spin").checked = s.spin;
  $("fade").checked = s.fade;
  $("enabled").checked = s.enabled;
});

bindRange("size", "size");
bindRange("length", "length");
bindCheck("spin", "spin");
bindCheck("fade", "fade");
bindCheck("enabled", "enabled");

$("choose").addEventListener("click", () => $("file").click());

$("file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await fileToDataURL(file);
    await chrome.storage.local.set({ image: dataUrl });
    showPreview(dataUrl);
  } catch (err) {
    $("preview").textContent = "⚠️";
  }
});

$("reset").addEventListener("click", async () => {
  await chrome.storage.local.set(DEFAULTS);
  location.reload();
});

$("tab").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
});
