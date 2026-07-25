import { NextResponse } from 'next/server';
import { HistoryService } from '../../../../../modules/history/history.service';

const historyService = new HistoryService();

export function generateStaticParams() {
  return [
    { id: '1234' },
    { id: '5678' },
    { id: '9012' }
  ];
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const profile = historyService.getPatientProfile(params.id);
    return NextResponse.json({ status: 'success', profile });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error?.message }, { status: 500 });
  }
}
