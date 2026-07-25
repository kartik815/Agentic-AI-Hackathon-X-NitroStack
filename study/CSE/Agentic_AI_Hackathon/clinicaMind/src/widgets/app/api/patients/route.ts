import { NextResponse } from 'next/server';
import { HistoryService } from '../../../../modules/history/history.service';

const historyService = new HistoryService();

export async function GET() {
  try {
    const patients = historyService.getAllPatients();
    return NextResponse.json({ status: 'success', patients });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = historyService.createPatient(body);
    return NextResponse.json({ status: 'success', patient: created });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error?.message }, { status: 500 });
  }
}
