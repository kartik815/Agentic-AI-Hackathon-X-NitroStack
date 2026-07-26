import { NextResponse } from 'next/server';
import { OcrEngineService } from '../../../../../../services/ocr-engine.service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documents } = body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'No documents provided for OCR processing.' },
        { status: 400 }
      );
    }

    const ocrResult = await OcrEngineService.processSessionDocuments(documents);

    return NextResponse.json({
      status: 'success',
      ocrResult
    });
  } catch (error: any) {
    console.error('Error in POST /api/integrations/gmail/ocr:', error);
    return NextResponse.json({ status: 'error', message: error?.message || 'OCR processing failed' }, { status: 500 });
  }
}
