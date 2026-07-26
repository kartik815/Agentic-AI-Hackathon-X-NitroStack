'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../../../../components/Sidebar';
import {
  FileText,
  Paperclip,
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  FolderOpen,
  HardDrive,
  Cpu,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export interface IntakeSessionData {
  sessionId: string;
  createdAt: string;
  status: string;
  documentCount: number;
  documents: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    sourceEmail: string;
    uploadTime: string;
    localPath?: string;
    mimeType?: string;
  }>;
  sourceEmail: string;
  receivedTime: string;
  temporaryStoragePath: string;
}

export default function DocumentProcessingPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<IntakeSessionData | null>(null);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/gmail/session');
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.session) {
          setSession(json.session);
        } else {
          // Fallback default mock session if accessed directly
          setSession({
            sessionId: 'SESSION-INTAKE-SAMPLE',
            createdAt: new Date().toISOString(),
            status: 'Ready for OCR',
            documentCount: 1,
            documents: [
              {
                id: 'doc_1',
                fileName: 'Blood_Report.pdf',
                fileType: 'PDF',
                fileSize: '2.3 MB',
                sourceEmail: 'doctor@gmail.com',
                uploadTime: new Date().toLocaleString()
              }
            ],
            sourceEmail: 'doctor@gmail.com',
            receivedTime: new Date().toLocaleString(),
            temporaryStoragePath: 'data/temp_attachments'
          });
        }
      }
    } catch (e) {
      console.error('Error fetching intake processing session:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  const handleStartOCR = () => {
    setOcrNotice('OCR pipeline not yet implemented.');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 sticky top-0 backdrop-blur-xs z-20 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-0.5">
              <Link href="/settings/integrations/gmail/review" className="hover:underline flex items-center gap-1 text-slate-600">
                <ArrowLeft size={12} />
                <span>Document Review Workspace</span>
              </Link>
              <span>→</span>
              <span className="text-indigo-600 font-bold">Document Processing</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Document Processing Session
              <span className="text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded font-bold flex items-center gap-1">
                <CheckCircle2 size={12} />
                {session?.status || 'Ready for OCR'}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* ONE Button: Start OCR Requirement */}
            <button
              onClick={handleStartOCR}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition cursor-pointer"
            >
              <Cpu size={15} />
              <span>Start OCR</span>
            </button>
          </div>
        </header>

        {/* Processing Content Body */}
        <div className="p-8 space-y-6 max-w-6xl w-full mx-auto">
          {/* OCR Notice Banner */}
          {ocrNotice && (
            <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs font-mono font-bold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>{ocrNotice}</span>
              </div>
              <button onClick={() => setOcrNotice(null)} className="text-amber-700 hover:text-amber-950 text-xs px-2 py-1 bg-amber-100 rounded-lg">
                Dismiss
              </button>
            </div>
          )}

          {/* Session Overview Telemetry Card */}
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Intake Processing Session: {session?.sessionId || 'SESSION-ACTIVE'}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Created {session?.createdAt ? new Date(session.createdAt).toLocaleString() : 'Just now'}</span>
                </div>
              </div>
              <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                {session?.status || 'Ready for OCR'}
              </span>
            </div>

            {/* Session Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase mb-1">Document Count:</span>
                <span className="font-bold text-white text-sm">{session?.documentCount || session?.documents?.length || 0} File(s)</span>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase mb-1">Source Email:</span>
                <span className="font-bold text-indigo-300 truncate block">{session?.sourceEmail || 'doctor@gmail.com'}</span>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase mb-1">Received Time:</span>
                <span className="font-bold text-slate-200 truncate block">{session?.receivedTime || 'N/A'}</span>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase mb-1">Temporary Storage Path:</span>
                <span className="font-bold text-amber-300 truncate block">{session?.temporaryStoragePath || 'data/temp_attachments'}</span>
              </div>
            </div>
          </div>

          {/* Selected Documents Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-2">
                <span>Selected Documents for Processing Queue</span>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded font-bold">
                  {session?.documents?.length || 0}
                </span>
              </h3>
            </div>

            {loading ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-xs font-mono text-slate-400 animate-pulse">
                Loading session documents...
              </div>
            ) : !session?.documents || session.documents.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center text-xs font-mono text-slate-500">
                No documents associated with this processing session.
              </div>
            ) : (
              <div className="space-y-6">
                {session.documents.map((doc: any, idx: number) => {
                  const fileUrl = `/api/integrations/gmail/file?file=${encodeURIComponent(doc.fileName)}`;

                  return (
                    <div key={doc.id || idx} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
                      {/* Document Card Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Paperclip size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{doc.fileName}</h4>
                              <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                                {doc.fileType || 'PDF'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              Size: {doc.fileSize || '1.5 MB'} • Source: {doc.sourceEmail || session.sourceEmail}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            Ready for OCR ✓
                          </span>
                        </div>
                      </div>

                      {/* PDF / Image Preview Area (Reusing Existing Server Temp File) */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                        {doc.fileType === 'PDF' || doc.fileName?.toLowerCase().endsWith('.pdf') ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                              <span>PDF Document Preview (Exact Intake Temp File)</span>
                              <a href={fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                                Open Full Window ↗
                              </a>
                            </div>
                            <iframe
                              src={fileUrl}
                              className="w-full h-80 rounded-xl border border-slate-200 shadow-2xs bg-white"
                              title={doc.fileName}
                            />
                          </div>
                        ) : ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(doc.fileType?.toUpperCase()) ? (
                          <div className="space-y-2">
                            <div className="text-xs font-mono text-slate-500">Image Document Preview</div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center">
                              <img src={fileUrl} alt={doc.fileName} className="max-h-80 object-contain mx-auto rounded-lg" />
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 text-center space-y-2 bg-white rounded-xl border border-slate-200">
                            <p className="font-bold text-xs text-slate-800">{doc.fileName}</p>
                            <a href={fileUrl} download={doc.fileName} className="inline-block bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl">
                              Download Document
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
