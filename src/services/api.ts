import axios from "axios";

// ============================================================
// API BASE URLs
// ============================================================

const PDF_TO_HTML_API = "http://127.0.0.1:8001";
const HTML_MERGE_API = "http://127.0.0.1:8002";
const HTML_TO_PDF_API = "http://127.0.0.1:8003";

// ============================================================
// Axios Instances
// ============================================================

const pdfToHtmlClient = axios.create({
  baseURL: PDF_TO_HTML_API,
});

const htmlMergeClient = axios.create({
  baseURL: HTML_MERGE_API,
});

const htmlToPdfClient = axios.create({
  baseURL: HTML_TO_PDF_API,
});

// ============================================================
// Types
// ============================================================

interface ConvertResponse {
  job_id: string;
  html_file: string;
  html_url: string;
}

interface PdfUploadResponse {
  id?: string;
  file_id?: string;
  cv_id?: string;
  job_id?: string;
  download_url?: string;
  url?: string;
  file?: string;
  [key: string]: unknown;
}

// ============================================================
// PDF → HTML
// ============================================================

/**
 * Converts a PDF into HTML.
 *
 * Flow:
 * 1. POST /convert
 * 2. Receive html_url
 * 3. GET generated HTML
 * 4. Return HTML as a string
 */
export async function convertPdfToHtml(
  file: File,
): Promise<string> {
  const formData = new FormData();

  formData.append("file", file, file.name);
  formData.append("mode", "fidelity");
  formData.append("ocr", "false");
  formData.append("ai_structure", "false");
  formData.append("groq_model", "qwen/qwen3.6-27b");

  try {
    // ----------------------------------------------------------
    // Step 1: Start PDF conversion
    // ----------------------------------------------------------

    const response = await pdfToHtmlClient.post<ConvertResponse>(
      "/convert",
      formData,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const result = response.data;

    if (!result.html_url) {
      throw new Error(
        "PDF conversion did not return an HTML URL.",
      );
    }

    // ----------------------------------------------------------
    // Step 2: Download generated HTML
    // ----------------------------------------------------------

    const htmlResponse = await pdfToHtmlClient.get<string>(
      result.html_url,
      {
        responseType: "text",
        headers: {
          Accept: "text/html",
        },
      },
    );

    if (!htmlResponse.data) {
      throw new Error(
        "Generated HTML is empty.",
      );
    }

    return htmlResponse.data;
  } catch (error) {
    throw normalizeApiError(
      error,
      "Failed to convert PDF to HTML.",
    );
  }
}

// ============================================================
// HTML MERGE
// ============================================================

/**
 * Merges reference HTML/design with source resume HTML.
 *
 * The source/content HTML remains the actual resume content.
 * The reference HTML provides the formatting/design.
 */
export async function mergeHtml(
  referenceHtml: string,
  contentHtml: string,
): Promise<string> {
  if (!referenceHtml.trim()) {
    throw new Error("Reference HTML is empty.");
  }

  if (!contentHtml.trim()) {
    throw new Error("Content HTML is empty.");
  }

  const formData = new FormData();

  const referenceFile = new File(
    [referenceHtml],
    "reference.html",
    {
      type: "text/html",
    },
  );

  const contentFile = new File(
    [contentHtml],
    "content.html",
    {
      type: "text/html",
    },
  );

  formData.append(
    "reference_file",
    referenceFile,
    "reference.html",
  );

  formData.append(
    "content_file",
    contentFile,
    "content.html",
  );

  formData.append("ocr", "false");

  try {
    const response = await htmlMergeClient.post(
      "/merge-cv",
      formData,
      {
        headers: {
          Accept: "application/json, text/html",
        },
      },
    );

    return await extractMergedHtml(response.data);
  } catch (error) {
    throw normalizeApiError(
      error,
      "Failed to merge reference HTML with resume HTML.",
    );
  }
}

// ============================================================
// HTML → PDF
// ============================================================

/**
 * Converts generated HTML into a PDF.
 */
export async function convertHtmlToPdf(
  html: string,
): Promise<{
  blob: Blob;
  filename: string;
}> {
  if (!html.trim()) {
    throw new Error("HTML content is empty.");
  }

  const formData = new FormData();

  const htmlFile = new File(
    [html],
    "resume.html",
    {
      type: "text/html",
    },
  );

  formData.append(
    "file",
    htmlFile,
    "resume.html",
  );

  try {
    const response = await htmlToPdfClient.post<PdfUploadResponse>(
      "/cv/upload",
      formData,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const downloadReference = extractPdfDownloadReference(response.data);
    if (!downloadReference) {
      throw new Error("PDF conversion did not return a download reference.");
    }

    const downloadUrl = downloadReference.startsWith("http")
      ? downloadReference
      : downloadReference.startsWith("/")
        ? downloadReference
        : `/cv/${downloadReference}/download`;
    const pdfResponse = await htmlToPdfClient.get<Blob>(downloadUrl, {
      responseType: "blob",
      headers: {
        Accept: "application/pdf, application/octet-stream",
      },
    });

    if (!pdfResponse.data || pdfResponse.data.size === 0) {
      throw new Error("Downloaded PDF is empty.");
    }

    return {
      blob: pdfResponse.data,
      filename: "resume.pdf",
    };
  } catch (error) {
    throw normalizeApiError(
      error,
      "Failed to convert HTML to PDF.",
    );
  }
}

function extractPdfDownloadReference(data: unknown): string | null {
  if (typeof data === "string" && data.trim()) return data.trim();
  if (!data || typeof data !== "object") return null;

  const result = data as PdfUploadResponse;
  const reference =
    result.download_url ??
    result.url ??
    result.file ??
    result.id ??
    result.file_id ??
    result.cv_id ??
    result.job_id;

  return typeof reference === "string" && reference.trim()
    ? reference.trim()
    : null;
}

// ============================================================
// MERGE RESPONSE HANDLING
// ============================================================

async function extractMergedHtml(
  data: unknown,
): Promise<string> {
  // ----------------------------------------------------------
  // Direct HTML string
  // ----------------------------------------------------------

  if (typeof data === "string") {
    if (data.trim().startsWith("<")) {
      return data;
    }

    // Could be a URL returned as plain text.
    if (
      data.startsWith("/") ||
      data.startsWith("http://") ||
      data.startsWith("https://")
    ) {
      return downloadHtml(
        data,
        HTML_MERGE_API,
      );
    }
  }

  // ----------------------------------------------------------
  // JSON response
  // ----------------------------------------------------------

  if (data && typeof data === "object") {
    const result = data as Record<string, unknown>;

    // Raw HTML
    const html =
      result.html ??
      result.content ??
      result.output;

    if (typeof html === "string" && html.trim()) {
      return html;
    }

    // Generated HTML URL
    const htmlUrl =
      result.html_url ??
      result.url ??
      result.file_url ??
      result.output_url;

    if (typeof htmlUrl === "string" && htmlUrl.trim()) {
      return downloadHtml(
        htmlUrl,
        HTML_MERGE_API,
      );
    }

    // File path
    const file =
      result.file ??
      result.html_file;

    if (typeof file === "string" && file.trim()) {
      return downloadHtml(
        file,
        HTML_MERGE_API,
      );
    }
  }

  throw new Error(
    "HTML merge API did not return generated HTML.",
  );
}

// ============================================================
// HTML DOWNLOAD HELPER
// ============================================================

async function downloadHtml(
  url: string,
  baseUrl: string,
): Promise<string> {
  const fullUrl = new URL(
    url,
    baseUrl,
  ).toString();

  const response = await axios.get<string>(
    fullUrl,
    {
      responseType: "text",
      headers: {
        Accept: "text/html",
      },
    },
  );

  if (!response.data || !response.data.trim()) {
    throw new Error(
      "Generated HTML file is empty.",
    );
  }

  return response.data;
}

// ============================================================
// ERROR HANDLING
// ============================================================

function normalizeApiError(
  error: unknown,
  fallbackMessage: string,
): Error {
  if (axios.isAxiosError(error)) {
    // Server returned a response
    if (error.response) {
      const status = error.response.status;

      const responseData = error.response.data;

      if (
        typeof responseData === "string" &&
        responseData.trim()
      ) {
        return new Error(
          `${fallbackMessage} (${status}): ${responseData}`,
        );
      }

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        const data =
          responseData as Record<string, unknown>;

        const detail =
          data.detail ??
          data.message ??
          data.error;

        if (typeof detail === "string") {
          return new Error(
            `${fallbackMessage} (${status}): ${detail}`,
          );
        }
      }

      return new Error(
        `${fallbackMessage} (${status}).`,
      );
    }

    // Request was made but server didn't respond
    if (error.request) {
      return new Error(
        `${fallbackMessage} API server is unreachable.`,
      );
    }

    // Axios configuration/request error
    return new Error(
      `${fallbackMessage} ${error.message}`,
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}

// ============================================================
// API CONFIG EXPORT
// ============================================================

export const API_URLS = {
  pdfToHtml: PDF_TO_HTML_API,
  htmlMerge: HTML_MERGE_API,
  htmlToPdf: HTML_TO_PDF_API,
};