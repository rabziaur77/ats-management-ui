import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Download,
  FileDown,
  FileText,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import DropZone from "./components/DropZone";
import FormatSelector from "./components/FormatSelector";
import ResumePreview from "./components/ResumePreview";
import StatusBar from "./components/StatusBar";
import {
  convertHtmlToPdf,
  convertPdfToHtml,
  mergeHtml,
} from "./services/api";
import type { FormatType } from "./types/resume";

function App() {
  const [originalPdf, setOriginalPdf] = useState<File | null>(null);
  const [defaultHtml, setDefaultHtml] = useState<string | null>(null);
  const [atsHtml, setAtsHtml] = useState<string | null>(null);

  const [customReferencePdf, setCustomReferencePdf] = useState<File | null>(
    null,
  );
  const [customReferenceHtml, setCustomReferenceHtml] = useState<string | null>(
    null,
  );
  const [customHtml, setCustomHtml] = useState<string | null>(null);

  const [selectedFormat, setSelectedFormat] =
    useState<FormatType>("default");
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const currentHtml = useMemo(() => {
    if (selectedFormat === "ats") return atsHtml;
    if (selectedFormat === "custom") return customHtml;
    return defaultHtml;
  }, [selectedFormat, defaultHtml, atsHtml, customHtml]);

  const previewLabel = {
    default: "Default Resume",
    ats: "ATS Format",
    custom: "Custom Format",
  }[selectedFormat];

  const handleOriginalPdf = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF resume.");
      return;
    }

    setError(null);
    setOriginalPdf(file);
    setDefaultHtml(null);
    setAtsHtml(null);
    setCustomReferencePdf(null);
    setCustomReferenceHtml(null);
    setCustomHtml(null);
    setSelectedFormat("default");
    setProcessing("Converting your resume to HTML...");

    try {
      const html = await convertPdfToHtml(file);
      setDefaultHtml(html);
    } catch (err) {
      setOriginalPdf(null);
      setError(err instanceof Error ? err.message : "Resume conversion failed.");
    } finally {
      setProcessing(null);
    }
  };

  const handleFormatChange = async (format: FormatType) => {
    if (!defaultHtml) {
      setError("Upload a resume before selecting a format.");
      return;
    }

    setError(null);
    setSelectedFormat(format);

    if (format === "default") return;

    if (format === "ats") {
      if (atsHtml) return;

      setProcessing("Generating ATS format...");
      try {
        // The supplied API list does not include a dedicated ATS endpoint.
        // Until one exists, use the existing HTML merge API with a generated
        // ATS reference if your backend provides one. For now, preserve the
        // source HTML and clearly expose the integration point.
        //
        // Replace this call with the real ATS endpoint when available.
        setAtsHtml(defaultHtml);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ATS formatting failed.");
      } finally {
        setProcessing(null);
      }
      return;
    }

    if (format === "custom" && customHtml) return;
  };

  const handleReferencePdf = async (file: File) => {
    if (!defaultHtml) {
      setError("Upload the original resume first.");
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF reference template.");
      return;
    }

    setError(null);
    setCustomReferencePdf(file);
    setCustomReferenceHtml(null);
    setCustomHtml(null);
    setProcessing("Converting the custom reference PDF...");

    try {
      const referenceHtml = await convertPdfToHtml(file);
      setCustomReferenceHtml(referenceHtml);

      setProcessing("Applying the custom format to your resume...");
      const merged = await mergeHtml(referenceHtml, defaultHtml);
      setCustomHtml(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Custom formatting failed.");
    } finally {
      setProcessing(null);
    }
  };

  const exportPdf = async () => {
    if (!currentHtml) {
      setError("There is no resume version ready to export.");
      return;
    }

    setError(null);
    setExporting(true);

    try {
      const { blob, filename } = await convertHtmlToPdf(currentHtml);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setExporting(false);
    }
  };

  const reset = () => {
    setOriginalPdf(null);
    setDefaultHtml(null);
    setAtsHtml(null);
    setCustomReferencePdf(null);
    setCustomReferenceHtml(null);
    setCustomHtml(null);
    setSelectedFormat("default");
    setProcessing(null);
    setError(null);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={19} />
          </div>
          <div>
            <strong>ATS Management</strong>
            <span>Resume formatting workspace</span>
          </div>
        </div>
        {originalPdf && (
          <button type="button" className="ghost-button" onClick={reset}>
            <RotateCcw size={16} />
            Start over
          </button>
        )}
      </header>

      <main className="workspace">
        <section className="intro">
          <div>
            <span className="eyebrow">RESUME WORKSPACE</span>
            <h1>Transform your resume format.</h1>
            <p>
              Upload your resume, preview the original conversion, and apply an
              ATS or custom reference design without changing your source content.
            </p>
          </div>
        </section>

        <div className="workspace-layout">
          <section className="control-panel">
            <div className="panel-section">
            <div className="section-heading">
              <div>
                <span className="step">01</span>
                <div>
                  <h2>Upload your resume</h2>
                  <p>Your original PDF becomes the source of truth.</p>
                </div>
              </div>
            </div>

            {!originalPdf ? (
              <DropZone
                accept=".pdf,application/pdf"
                label="Drop your resume PDF here"
                hint="or click to browse · PDF only"
                onFile={handleOriginalPdf}
                disabled={Boolean(processing)}
              />
            ) : (
              <div className="file-card">
                <div className="file-icon">
                  <FileText size={20} />
                </div>
                <div className="file-details">
                  <strong>{originalPdf.name}</strong>
                  <span>{(originalPdf.size / 1024 / 1024).toFixed(2)} MB · Source resume</span>
                </div>
                <span className="ready-badge">Ready</span>
              </div>
            )}
            </div>

            <div className="panel-section">
            <div className="section-heading">
              <div>
                <span className="step">02</span>
                <div>
                  <h2>Choose a format</h2>
                  <p>Formatting is always generated from the default source.</p>
                </div>
              </div>
            </div>

            <FormatSelector
              value={selectedFormat}
              onChange={handleFormatChange}
              disabled={!defaultHtml || Boolean(processing)}
            />

            {selectedFormat === "custom" && defaultHtml && (
              <div className="custom-section">
                <div className="custom-heading">
                  <div>
                    <h3>Custom reference</h3>
                    <p>
                      Upload a PDF whose visual structure you want to use.
                    </p>
                  </div>
                  {customReferenceHtml && (
                    <span className="ready-badge">Reference ready</span>
                  )}
                </div>

                {!customReferencePdf ? (
                  <DropZone
                    accept=".pdf,application/pdf"
                    label="Drop the reference PDF here"
                    hint="The reference is used for layout/design only"
                    onFile={handleReferencePdf}
                    disabled={Boolean(processing)}
                  />
                ) : (
                  <div className="file-card compact">
                    <div className="file-icon">
                      <FileText size={19} />
                    </div>
                    <div className="file-details">
                      <strong>{customReferencePdf.name}</strong>
                      <span>Reference design</span>
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        setCustomReferencePdf(null);
                        setCustomReferenceHtml(null);
                        setCustomHtml(null);
                      }}
                      disabled={Boolean(processing)}
                    >
                      Replace
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          </section>

          <ResumePreview
            html={currentHtml}
            loading={Boolean(processing) && !currentHtml}
            label={previewLabel}
          />
        </div>

        {processing && (
          <StatusBar text={processing} loading />
        )}

        {error && (
          <div className="error-bar">
            <AlertCircle size={18} />
            <div>
              <strong>Something went wrong</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        <section className="export-panel">
          <div>
            <span className="eyebrow">03 · EXPORT</span>
            <h2>Ready to download?</h2>
            <p>
              Generate a PDF from the currently selected resume format.
            </p>
          </div>
          <button
            type="button"
            className="primary-button"
            disabled={!currentHtml || exporting || Boolean(processing)}
            onClick={exportPdf}
          >
            {exporting ? (
              <>
                <span className="spinner" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download size={18} />
                Download PDF
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </section>

        <div className="workflow-note">
          <FileDown size={16} />
          <span>
            Default HTML is kept untouched. ATS and Custom formats are generated
            from the original default HTML.
          </span>
        </div>
      </main>
    </div>
  );
}

export default App;