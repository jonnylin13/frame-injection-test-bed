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

  function createSrcDoc(label) {
    const safeLabel = escapeHtml(label);
    return `<!doctype html><html><body style="font-family:Arial,sans-serif;margin:8px;"><strong>${safeLabel}</strong><div>Injected at ${new Date().toLocaleTimeString()}</div></body></html>`;
  }

  function addViaCreateElement() {
    const label = nextLabel("createElement");
    const iframe = document.createElement("iframe");
    iframe.title = label;
    iframe.srcdoc = createSrcDoc(label);
    framesContainer.appendChild(iframe);
  }

  function addViaAdjacentHtml() {
    const label = nextLabel("insertAdjacentHTML");
    const safeLabel = escapeHtml(label);

    framesContainer.insertAdjacentHTML(
      "beforeend",
      `<iframe title="${safeLabel}"></iframe>`
    );

    const iframe = framesContainer.lastElementChild;
    if (!(iframe instanceof HTMLIFrameElement)) {
      return;
    }

    iframe.srcdoc = createSrcDoc(label);
  }

  function addViaDocumentWrite() {
    const label = nextLabel("document.write");
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
    framesContainer.appendChild(iframe);
    writeIntoIframe();
  }

  function clearFrames() {
    framesContainer.replaceChildren();
    frameCount = 0;
  }

  document.getElementById("btn-create-element")?.addEventListener("click", addViaCreateElement);
  document.getElementById("btn-adjacent-html")?.addEventListener("click", addViaAdjacentHtml);
  document.getElementById("btn-document-write")?.addEventListener("click", addViaDocumentWrite);
  document.getElementById("btn-clear")?.addEventListener("click", clearFrames);
})();
