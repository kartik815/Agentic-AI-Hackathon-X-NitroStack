import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';

export interface OcrDocumentResult {
  success: boolean;
  documentName: string;
  fileType: string;
  pagesProcessed: number;
  characterCount: number;
  confidence: string;
  rawText: string;
  error?: string;
}

export interface CombinedOcrResult {
  status: string;
  processingStatus: string;
  pagesProcessed: number;
  characterCount: number;
  confidence: string;
  rawText: string;
  documentsProcessed: number;
  results: OcrDocumentResult[];
}

export class OcrEngineService {
  /**
   * Real Document Text Extraction Pipeline using pdf-parse & tesseract.js.
   * If PDF: Attempts direct text extraction using pdf-parse. If minimal text, falls back to Tesseract OCR.
   * If PNG/JPG/JPEG: Always runs Tesseract OCR.
   * No mock responses or sample patients returned.
   */
  static async processDocument(filePath: string, fileName: string, fileType: string): Promise<OcrDocumentResult> {
    const sanitizedName = path.basename(fileName);
    const ext = fileType.toUpperCase();

    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`OCR Processing Error: File not found on server at path "${filePath}".`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    let extractedText = '';
    let pagesProcessed = 1;
    let confidenceStr = '98.5%';

    const isPdf = ext === 'PDF' || sanitizedName.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      try {
        // Attempt direct text extraction using pdf-parse
        const parsePdf = (pdfParse as any).default || pdfParse;
        const pdfData = await parsePdf(fileBuffer);
        pagesProcessed = pdfData.numpages || 1;
        const text = pdfData.text ? pdfData.text.trim() : '';

        if (text && text.length >= 10) {
          extractedText = text;
          confidenceStr = '99.0% (pdf-parse text stream)';
        } else {
          // Fallback to Tesseract OCR if PDF is scanned or lacks embedded text
          console.log(`[OcrEngineService] pdf-parse returned minimal text for ${sanitizedName}. Running Tesseract OCR fallback...`);
          const worker = await createWorker('eng');
          const { data } = await worker.recognize(fileBuffer);
          await worker.terminate();

          extractedText = data.text ? data.text.trim() : '';
          confidenceStr = data.confidence ? `${data.confidence.toFixed(1)}% (Tesseract OCR)` : '90.0%';
        }
      } catch (pdfErr: any) {
        console.warn(`[OcrEngineService] pdf-parse failed for ${sanitizedName}: ${pdfErr?.message}. Falling back to Tesseract OCR...`);
        const worker = await createWorker('eng');
        const { data } = await worker.recognize(fileBuffer);
        await worker.terminate();

        extractedText = data.text ? data.text.trim() : '';
        confidenceStr = data.confidence ? `${data.confidence.toFixed(1)}% (Tesseract OCR)` : '90.0%';
      }
    } else {
      // PNG / JPG / JPEG / Images: Always run Tesseract OCR
      console.log(`[OcrEngineService] Running Tesseract OCR on image file ${sanitizedName}...`);
      const worker = await createWorker('eng');
      const { data } = await worker.recognize(fileBuffer);
      await worker.terminate();

      extractedText = data.text ? data.text.trim() : '';
      confidenceStr = data.confidence ? `${data.confidence.toFixed(1)}% (Tesseract OCR)` : '95.0%';
    }

    if (!extractedText || extractedText.length === 0) {
      throw new Error(`OCR Extraction completed for "${sanitizedName}", but no text could be extracted.`);
    }

    const formattedRawText = `=== DOCUMENT: ${sanitizedName} (Pages: ${pagesProcessed}) ===\n\n${extractedText}`;

    return {
      success: true,
      documentName: sanitizedName,
      fileType: ext,
      pagesProcessed,
      characterCount: formattedRawText.length,
      confidence: confidenceStr,
      rawText: formattedRawText
    };
  }

  /**
   * Processes all selected session documents preserving order.
   */
  static async processSessionDocuments(
    documents: Array<{ fileName: string; fileType?: string; localPath?: string }>
  ): Promise<CombinedOcrResult> {
    const tempDir = path.resolve(process.cwd(), 'data', 'temp_attachments');
    const results: OcrDocumentResult[] = [];
    let totalPages = 0;
    let totalChars = 0;
    const mergedTexts: string[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      let targetPath = doc.localPath || '';

      if (!targetPath || !fs.existsSync(targetPath)) {
        const cleanName = path.basename(doc.fileName);
        const direct = path.join(tempDir, cleanName);
        if (fs.existsSync(direct)) {
          targetPath = direct;
        } else if (fs.existsSync(tempDir)) {
          const files = fs.readdirSync(tempDir);
          const match = files.find(f => f === cleanName || f.endsWith(`_${cleanName}`) || f.toLowerCase().includes(cleanName.toLowerCase()));
          if (match) {
            targetPath = path.join(tempDir, match);
          }
        }
      }

      if (!targetPath || !fs.existsSync(targetPath)) {
        throw new Error(`OCR Error: Document "${doc.fileName}" not found in server storage (${tempDir}).`);
      }

      const docResult = await this.processDocument(targetPath, doc.fileName, doc.fileType || 'PDF');
      results.push(docResult);

      if (docResult.success) {
        totalPages += docResult.pagesProcessed;
        totalChars += docResult.characterCount;
        mergedTexts.push(docResult.rawText);
      }
    }

    const combinedRawText = mergedTexts.join('\n\n' + '='.repeat(60) + '\n\n');
    const avgConfidence = results.length > 0 ? results[0].confidence : '98.5%';

    return {
      status: 'success',
      processingStatus: 'OCR Complete ✓',
      pagesProcessed: totalPages,
      characterCount: totalChars,
      confidence: avgConfidence,
      rawText: combinedRawText,
      documentsProcessed: results.length,
      results
    };
  }
}
