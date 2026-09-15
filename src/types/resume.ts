export type FormatType = "default" | "ats" | "custom";

export interface ConvertResponse {
  html?: string;
  content?: string;
  output?: string;
  filename?: string;
  file?: string;
  [key: string]: unknown;
}

export interface MergeResponse {
  html?: string;
  content?: string;
  output?: string;
  filename?: string;
  file?: string;
  [key: string]: unknown;
}

export interface PdfResponse {
  url?: string;
  download_url?: string;
  file_url?: string;
  filename?: string;
  file?: string;
  pdf?: string;
  [key: string]: unknown;
}