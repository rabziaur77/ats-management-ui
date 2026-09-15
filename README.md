# ATS Management UI

React + TypeScript + Vite frontend for the ATS resume formatting workflow.

## APIs

The frontend expects these local services:

- PDF → HTML: `POST http://127.0.0.1:8001/convert`
- HTML Merge: `POST http://127.0.0.1:8002/merge-cv`
- HTML → PDF: `POST http://127.0.0.1:8003/cv/upload`

## Run

```bash
npm install
npm run dev
```

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
