import { z } from "zod";

export const SUPPORTED_MIME_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const FILE_SIGNATURES = {
  pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF
  docx: new Uint8Array([0x50, 0x4B, 0x03, 0x04]), // PK (ZIP-based)
} as const;

export function validateFileType(fileName: string, mimeType: string): { valid: boolean; error?: string } {
  const ext = fileName.toLowerCase().split(".").pop();
  const allowedExts: string[] | undefined = (SUPPORTED_MIME_TYPES as unknown as Record<string, string[]>)[mimeType];

  if (!allowedExts) {
    return { valid: false, error: `Unsupported file type: ${mimeType}. Only PDF and DOCX are supported.` };
  }

  if (!ext || !allowedExts.includes(`.${ext}`)) {
    return { valid: false, error: `File extension .${ext} does not match MIME type ${mimeType}.` };
  }

  return { valid: true };
}

export function validateFileSize(fileSize: number): { valid: boolean; error?: string } {
  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: `File size ${(fileSize / 1024 / 1024).toFixed(1)}MB exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB.` };
  }
  if (fileSize === 0) {
    return { valid: false, error: "File is empty." };
  }
  return { valid: true };
}

export async function validateFileSignature(buffer: ArrayBuffer, mimeType: string): Promise<{ valid: boolean; error?: string }> {
  const uint8 = new Uint8Array(buffer.slice(0, 8));

  if (mimeType === "application/pdf") {
    const pdfSig = FILE_SIGNATURES.pdf;
    if (!uint8.slice(0, pdfSig.length).every((v, i) => v === pdfSig[i])) {
      return { valid: false, error: "File signature does not match PDF format." };
    }
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const zipSig = FILE_SIGNATURES.docx;
    if (!uint8.slice(0, zipSig.length).every((v, i) => v === zipSig[i])) {
      return { valid: false, error: "File signature does not match DOCX format." };
    }
    // Additional check: DOCX should contain [Content_Types].xml
    const text = new TextDecoder().decode(uint8);
    if (!text.includes("[Content_Types].xml") && !text.includes("word/")) {
      // Might be a different ZIP-based format
      return { valid: false, error: "File does not appear to be a valid DOCX document." };
    }
  }

  return { valid: true };
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 255);
}

export function generateStorageKey(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const sanitized = sanitizeFileName(fileName);
  return `resumes/${userId}/${timestamp}-${random}-${sanitized}`;
}

export const uploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
});