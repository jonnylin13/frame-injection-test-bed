# frame-injection-test-bed

Simple static HTML/JS test bed that dynamically injects iframes in different ways.

## Run locally

From the repository root (`/home/runner/work/frame-injection-test-bed/frame-injection-test-bed`):

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080> and click:

- **createElement + appendChild**
- **insertAdjacentHTML**
- **about:blank + document.write**

Use **Clear Frames** to reset the page.
