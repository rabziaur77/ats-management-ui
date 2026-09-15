import { Maximize2, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  html: string | null;
  loading: boolean;
  label: string;
}

export default function ResumePreview({ html, loading, label }: Props) {
  const [scale, setScale] = useState(0.82);
  const [fullScreen, setFullScreen] = useState(false);

  const srcDoc = useMemo(() => {
    if (!html) return "";
    return html;
  }, [html]);

  return (
    <section className={`preview-panel ${fullScreen ? "fullscreen" : ""}`}>
      <div className="preview-toolbar">
        <div>
          <span className="eyebrow">LIVE PREVIEW</span>
          <h2>{label}</h2>
        </div>
        <div className="preview-actions">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setScale((v) => Math.max(0.55, +(v - 0.05).toFixed(2)))}
          >
            <Minus size={16} />
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setScale((v) => Math.min(1.1, +(v + 0.05).toFixed(2)))}
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            aria-label="Toggle fullscreen"
            onClick={() => setFullScreen((v) => !v)}
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      <div className="preview-canvas">
        {loading && (
          <div className="preview-loading">
            <div className="spinner large" />
            <strong>Preparing preview</strong>
            <span>This may take a few seconds.</span>
          </div>
        )}

        {!loading && !srcDoc && (
          <div className="preview-empty">
            <div className="empty-document">
              <span />
              <span />
              <span />
              <span />
            </div>
            <strong>Your resume preview will appear here</strong>
            <p>Upload a PDF to begin.</p>
          </div>
        )}

        {!loading && srcDoc && (
          <div
            className="resume-frame-wrap"
            style={{ width: `${100 / scale}%`, minHeight: `${100 / scale}%` }}
          >
            <iframe
              title="Resume preview"
              className="resume-frame"
              srcDoc={srcDoc}
              sandbox="allow-same-origin"
              style={{
                width: `${scale * 100}%`,
                minHeight: `${100 / scale}%`,
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}