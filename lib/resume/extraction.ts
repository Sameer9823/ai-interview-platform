import "server-only";

export interface ExtractionResult {
  text: string;
  pages: number;
  isScanned: boolean;
  extractionMethod: "pdf-text" | "pdf-ocr" | "docx";
  warnings: string[];
}

export async function extractTextFromPdf(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const warnings: string[] = [];

  try {
    // @ts-ignore - pdfjs-dist module resolution at runtime
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    let fullText = "";
    let isScanned = false;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item: any) => "str" in item)
        .map((item: any) => item.str)
        .join(" ");

      if (pageText.trim().length < 50 && i === 1) {
        isScanned = true;
      }
      fullText += `\n--- PAGE ${i} ---\n${pageText}`;
    }

    if (isScanned && process.env.OCR_API_KEY) {
      warnings.push("PDF appears to be scanned. OCR processing available but not implemented.");
    } else if (isScanned) {
      warnings.push("PDF appears to be scanned/image-based. OCR not configured - text extraction may be incomplete.");
    }

    return {
      text: fullText.trim(),
      pages: pdf.numPages,
      isScanned,
      extractionMethod: isScanned ? "pdf-ocr" : "pdf-text",
      warnings,
    };
  } catch (e) {
    throw new Error(`PDF extraction failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

export async function extractTextFromDocx(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const warnings: string[] = [];

  try {
    // @ts-ignore - mammoth module resolution at runtime
    const mammoth: any = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = result.value;

    if (result.messages.length > 0) {
      warnings.push(...result.messages.map((m: any) => m.message));
    }

    if (!text || text.trim().length < 100) {
      warnings.push("Extracted text is very short - document may be image-based or empty.");
    }

    return {
      text: text.trim(),
      pages: 1,
      isScanned: false,
      extractionMethod: "docx",
      warnings,
    };
  } catch (e) {
    throw new Error(`DOCX extraction failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

export async function extractText(buffer: ArrayBuffer, mimeType: string): Promise<ExtractionResult> {
  if (mimeType === "application/pdf") {
    return extractTextFromPdf(buffer);
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractTextFromDocx(buffer);
  }
  throw new Error(`Unsupported MIME type for extraction: ${mimeType}`);
}

export function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = text.split("\n");

  let currentSection = "header";
  let currentContent: string[] = [];

  const sectionHeaders = [
    "summary", "objective", "profile", "about",
    "experience", "employment", "work history", "professional experience",
    "education", "academic", "qualifications",
    "skills", "technical skills", "competencies", "technologies",
    "projects", "portfolio", "personal projects",
    "certifications", "certificates", "licenses",
    "languages", "languages spoken",
    "publications", "papers", "research",
    "awards", "honors", "achievements",
    "volunteering", "volunteer", "community",
    "interests", "hobbies",
    "references", "referees",
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    const isHeader = sectionHeaders.some((h) =>
      lower === h || lower.startsWith(h + ":") || lower === h.toUpperCase()
    );

    if (isHeader && trimmed.length > 0 && trimmed.length < 50) {
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join("\n").trim();
      }
      currentSection = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join("\n").trim();
  }

  return sections;
}

export function detectContactInfo(text: string): { emails: string[]; phones: string[]; urls: string[] } {
  const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
  const phones = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) ?? [];
  const urls = text.match(/https?:\/\/[^\s]+/g) ?? [];

  return {
    emails: [...new Set(emails)],
    phones: [...new Set(phones)],
    urls: [...new Set(urls)],
  };
}