# ATS Management UI

React + TypeScript + Vite frontend for the ATS resume formatting workflow.

## APIs

For local development, the frontend defaults to these services:

- PDF → HTML: `POST http://127.0.0.1:8001/convert`
- HTML Merge: `POST http://127.0.0.1:8002/merge-cv`
- HTML → PDF: `POST http://127.0.0.1:8003/cv/upload`

API origins are configured with Vite environment variables:

```text
VITE_PDF_TO_HTML_API
VITE_HTML_MERGE_API
VITE_HTML_TO_PDF_API
VITE_FORMAT_API
```

Copy `.env.example` to `.env.local` and replace the production API URLs when
building for deployment. The API servers must allow the GitHub Pages origin in
their CORS configuration.

GitHub Pages builds use `/ats-management-ui/` by default. Override that path
with `VITE_BASE_PATH` when deploying under a different repository or custom
domain.

## Run

```bash
npm install
npm run dev
```

For a production build, configure the variables before running:

```bash
npm run build
```

The included GitHub Actions workflow deploys to GitHub Pages on pushes to
`main`. Add these repository-level **Variables** under
**Settings → Secrets and variables → Actions**:

```text
VITE_PDF_TO_HTML_API
VITE_HTML_MERGE_API
VITE_HTML_TO_PDF_API
VITE_FORMAT_API
```

Set GitHub Pages **Source** to **GitHub Actions**. The backend services must
allow `https://rabziaur77.github.io` and the `/ats-management-ui` site path in
their CORS configuration.

Open the Vite URL, normally:

```text
http://localhost:5173
```

## Important ATS endpoint note

The API list supplied for this frontend contains no dedicated ATS-format endpoint. The UI therefore keeps an `atsHtml` state and currently falls back to the default HTML when ATS is selected.

When the real ATS endpoint is available, replace the ATS branch in:

```text
src/App.tsx
```

with a call such as:

```ts
const html = await yourAtsEndpoint(defaultHtml);
setAtsHtml(html);
```

The rest of the UI does not need to change.

## CORS

Because Vite and the APIs run on different ports, the backend services must allow the frontend origin, for example:

```text
http://localhost:5173
```

or the frontend must be served behind the same origin/reverse proxy as the APIs.

## Response handling

The frontend accepts HTML from JSON fields named `html`, `content`, or `output`, or a raw text response.

The HTML → PDF endpoint is expected to return either:

1. `application/pdf` directly, or
2. JSON containing a downloadable URL under `download_url`, `url`, `file_url`, `file`, or `pdf`.

Adjust `src/services/api.ts` if your actual response schema differs.
