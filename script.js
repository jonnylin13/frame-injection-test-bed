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

  function createSrcDoc(label) {
    return `<!doctype html><html><body style="font-family:Arial,sans-serif;margin:8px;"><strong>${label}</strong><div>Injected at ${new Date().toLocaleTimeString()}</div></body></html>`;
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
    const srcdoc = createSrcDoc(label).replace(/"/g, "&quot;");
    framesContainer.insertAdjacentHTML(
      "beforeend",
      `<iframe title="${label}" srcdoc="${srcdoc}"></iframe>`
    );
  }

  function addViaDocumentWrite() {
    const label = nextLabel("document.write");
    const iframe = document.createElement("iframe");
    iframe.title = label;
    iframe.src = "about:blank";
    framesContainer.appendChild(iframe);

    const doc = iframe.contentWindow && iframe.contentWindow.document;
    if (!doc) {
      return;
    }

    doc.open();
    doc.write(createSrcDoc(label));
    doc.close();
  }

  function clearFrames() {
    framesContainer.innerHTML = "";
    frameCount = 0;
  }

  document.getElementById("btn-create-element")?.addEventListener("click", addViaCreateElement);
  document.getElementById("btn-adjacent-html")?.addEventListener("click", addViaAdjacentHtml);
  document.getElementById("btn-document-write")?.addEventListener("click", addViaDocumentWrite);
  document.getElementById("btn-clear")?.addEventListener("click", clearFrames);
})();
