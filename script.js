(function () {
  const framesContainer = document.getElementById("frames");

  if (!framesContainer) {
    return;
  }

  let frameCount = 0;

  function nextLabel(method) {
    frameCount += 1;
    return `${method} #${frameCount}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const FORM_STYLE = `
    body{font-family:Arial,sans-serif;margin:8px;font-size:13px}
    fieldset{border:1px solid #bbb;border-radius:3px;padding:6px 10px;margin:6px 0}
    legend{font-weight:bold;font-size:12px;color:#444;padding:0 4px}
    label{display:block;margin:4px 0 1px;color:#333}
    input,textarea,select{width:100%;box-sizing:border-box;padding:3px 5px;font-size:12px;border:1px solid #aaa;border-radius:2px}
    textarea{height:48px;resize:vertical}
    .ts{color:#888;font-size:11px;margin-bottom:4px}
  `;

  function createSrcDoc(label) {
    const safeLabel = escapeHtml(label);
    return `<!doctype html><html><head><style>${FORM_STYLE}</style></head><body>
<strong>${safeLabel}</strong>
<p class="ts">Injected at ${new Date().toLocaleTimeString()}</p>
<fieldset>
  <legend>Personal Info</legend>
  <label>Full Name<input type="text" name="fullname" placeholder="Jane Doe" autocomplete="name"></label>
  <label>Email<input type="email" name="email" placeholder="jane@example.com" autocomplete="email"></label>
  <label>SSN<input type="text" name="ssn" placeholder="123-45-6789" autocomplete="off"></label>
</fieldset>
<fieldset>
  <legend>Payment</legend>
  <label>Credit Card<input type="text" name="cc" placeholder="4111 1111 1111 1111" autocomplete="cc-number"></label>
  <label>Expiry<input type="text" name="expiry" placeholder="MM/YY" autocomplete="cc-exp"></label>
  <label>CVV<input type="password" name="cvv" placeholder="•••" autocomplete="cc-csc"></label>
</fieldset>
<fieldset>
  <legend>Notes</legend>
  <label>Message / PII<textarea name="notes" placeholder="Paste sensitive text here..."></textarea></label>
</fieldset>
</body></html>`;
  }

  // Wraps an iframe in a labelled card matching the static iframe style.
  function wrapFrame(iframe, labelText) {
    const entry = document.createElement("div");
    entry.className = "frame-entry";
    const label = document.createElement("p");
    label.className = "frame-label";
    label.textContent = labelText;
    entry.appendChild(label);
    entry.appendChild(iframe);
    framesContainer.appendChild(entry);
    return iframe;
  }

  function addViaCreateElement() {
    const label = nextLabel("srcdoc (createElement)");
    const iframe = document.createElement("iframe");
    iframe.title = label;
    iframe.srcdoc = createSrcDoc(label);
    wrapFrame(iframe, `srcdoc — src type: srcdoc attribute, via createElement + appendChild`);
  }

  function addViaAdjacentHtml() {
    const label = nextLabel("srcdoc (insertAdjacentHTML)");
    const safeLabel = escapeHtml(label);

    // Insert the wrapper + a placeholder iframe, then upgrade it.
    framesContainer.insertAdjacentHTML(
      "beforeend",
      `<div class="frame-entry"><p class="frame-label">srcdoc — src type: srcdoc attribute, via insertAdjacentHTML</p><iframe title="${safeLabel}"></iframe></div>`
    );

    const entry = framesContainer.lastElementChild;
    const iframe = entry && entry.querySelector("iframe");
    if (!(iframe instanceof HTMLIFrameElement)) {
      return;
    }

    iframe.srcdoc = createSrcDoc(label);
  }

  function addViaDocumentWrite() {
    const label = nextLabel("about:blank + document.write");
    const iframe = document.createElement("iframe");
    iframe.title = label;
    iframe.src = "about:blank";

    let hasWritten = false;
    function writeIntoIframe() {
      if (hasWritten) {
        return;
      }

      const doc = iframe.contentWindow && iframe.contentWindow.document;
      if (!doc) {
        return;
      }

      hasWritten = true;
      doc.open();
      doc.write(createSrcDoc(label));
      doc.close();
    }

    iframe.addEventListener("load", writeIntoIframe, { once: true });
    wrapFrame(iframe, `about:blank — src type: about:blank + document.write`);
    writeIntoIframe();
  }

  function addViaBlobUrl() {
    const label = nextLabel("blob: URL");
    const html = createSrcDoc(label);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.title = label;
    iframe.src = url;

    iframe.addEventListener("load", () => URL.revokeObjectURL(url), { once: true });
    wrapFrame(iframe, `blob: URL — src type: blob:, via URL.createObjectURL`);
  }

  function addViaCrossOrigin() {
    const label = nextLabel("cross-origin src");
    const iframe = document.createElement("iframe");
    iframe.title = label;
    iframe.src = "https://www.google.com";
    wrapFrame(iframe, `cross-origin — src="https://www.google.com" (likely blocked by X-Frame-Options)`);
  }

  function addViaDataUrl() {
    const label = nextLabel("data: URL");
    const html = createSrcDoc(label);
    const iframe = document.createElement("iframe");
    iframe.title = label;
    // data: navigation is blocked in Chrome 60+ for top-level and sandboxed frames;
    // may still work in Firefox or when served from file://
    iframe.src = `data:text/html,${encodeURIComponent(html)}`;
    wrapFrame(iframe, `data: URL — src type: data:text/html (blocked in Chrome 60+ for security)`);
  }

  function clearFrames() {
    framesContainer.replaceChildren();
    frameCount = 0;
  }

  document.getElementById("btn-create-element")?.addEventListener("click", addViaCreateElement);
  document.getElementById("btn-adjacent-html")?.addEventListener("click", addViaAdjacentHtml);
  document.getElementById("btn-document-write")?.addEventListener("click", addViaDocumentWrite);
  document.getElementById("btn-blob-url")?.addEventListener("click", addViaBlobUrl);
  document.getElementById("btn-cross-origin")?.addEventListener("click", addViaCrossOrigin);
  document.getElementById("btn-data-url")?.addEventListener("click", addViaDataUrl);
  document.getElementById("btn-clear")?.addEventListener("click", clearFrames);

  // --- Initialise static iframes that require JS ---

  // Static about:blank — document.write after load
  (function initStaticAboutBlank() {
    const el = document.getElementById("static-about-blank");
    if (!(el instanceof HTMLIFrameElement)) {
      return;
    }
    let hasWritten = false;
    function write() {
      if (hasWritten) return;
      const doc = el.contentWindow && el.contentWindow.document;
      if (!doc) return;
      hasWritten = true;
      doc.open();
      doc.write(createSrcDoc("Static — about:blank"));
      doc.close();
    }
    el.addEventListener("load", write, { once: true });
    write();
  })();

  // Static srcdoc — set via JS so it uses the shared createSrcDoc template
  (function initStaticSrcdoc() {
    const el = document.getElementById("static-srcdoc");
    if (!(el instanceof HTMLIFrameElement)) {
      return;
    }
    el.srcdoc = createSrcDoc("Static — srcdoc");
  })();

  // Static blob: URL
  (function initStaticBlob() {
    const el = document.getElementById("static-blob");
    if (!(el instanceof HTMLIFrameElement)) {
      return;
    }
    const html = createSrcDoc("Static — blob: URL");
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    el.src = url;
    el.addEventListener("load", () => URL.revokeObjectURL(url), { once: true });
  })();

  // Static data: URL — set via JS to avoid parser quirks with inline data: in HTML
  (function initStaticData() {
    const el = document.getElementById("static-data");
    if (!(el instanceof HTMLIFrameElement)) {
      return;
    }
    const html = createSrcDoc("Static — data: URL");
    el.src = `data:text/html,${encodeURIComponent(html)}`;
  })();
})();
