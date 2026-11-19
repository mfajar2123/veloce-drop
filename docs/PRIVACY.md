# Privacy implementation

Image and document tools use browser file APIs and local processing. The project contains no application server, upload API, account system, database, or third-party analytics integration. Loading the site still makes network requests for the page and public assets; local processing does not mean the entire browsing session is offline.

## Files and results

Input Blobs and generated results are held in page memory while a tool uses them. Cross-tool handoff uses an in-memory store with a five-result limit, a 50 MB aggregate limit, and a 30-minute TTL. The tray can remove individual results or clear all. A hard reload clears the application's references. The browser controls temporary buffers and may retain a downloaded file according to its own download settings.

The app does not intentionally put user file bytes, thumbnails, filenames, or result data in URLs, localStorage, IndexedDB, a service worker cache, analytics, or server requests. Blob URLs are used for local previews/downloads and are revoked when the relevant result is removed or its component is disposed. This is an implementation description, not a complete independent security audit.

## Public model and processing assets

Background removal loads the public MODNet model and ONNX Runtime WASM from this site's origin when the tool page opens, so a photo can be processed without an extra step. The request is for application assets, not for the user's photo. The model files may be cached by the browser as public static assets. HEIC and PDF/WASM code is loaded from the application origin when the related tool is used.

## Limits and verification

The targeted Playwright suites inspect requests for selected workflows and reject external SVG references. They do not cover every tool, browser extension, host log, browser cache, or network condition. Files are decoded by browser libraries, and some tools still decode before enforcing pixel limits or process on the main thread; large inputs may consume substantial memory. The site asks users to retain originals where appropriate and reports unsupported or malformed inputs where implemented.

The security headers in `public/_headers` must be enabled by the static host and verified in the deployed response. If analytics, advertising, or other external services are enabled later, their requests and consent requirements must be documented and this page updated. None are configured in the current project.
