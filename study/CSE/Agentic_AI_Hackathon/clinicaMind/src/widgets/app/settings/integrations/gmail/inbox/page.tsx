'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../../../../components/Sidebar';
import { Mail, RefreshCw, Paperclip, ChevronDown, ChevronUp, Inbox, Calendar, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GmailIntakeInboxPage() {
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<any[]>([]);
  const [connected, setConnected] = useState<boolean>(true);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchInbox = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/integrations/gmail/inbox');
      if (res.ok) {
        const json = await res.json();
        setConnected(json.connected !== false);
        setEmails(json.emails || []);
        if (json.message) {
          setStatusMessage(json.message);
        }
      }
    } catch (e: any) {
      console.error('Error fetching Gmail intake inbox:', e);
      setStatusMessage('Failed to connect to server API endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 sticky top-0 backdrop-blur-xs z-20 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-0.5">
              <Link href="/settings/integrations/gmail" className="hover:underline flex items-center gap-1 text-slate-600">
                <ArrowLeft size={12} />
                <span>Gmail Integration</span>
              </Link>
              <span>→</span>
              <span className="text-indigo-600 font-bold">Patient Intake Inbox</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Patient Intake Inbox
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                {emails.length} Matching Messages
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchInbox}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-indigo-200 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Scanning Inbox...' : 'Refresh Inbox'}</span>
            </button>
          </div>
        </header>

        {/* Main Inbox Body */}
        <div className="p-8 space-y-6 max-w-5xl w-full mx-auto">
          {!connected && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <h3 className="font-bold text-sm">Gmail Service Disconnected</h3>
                <p className="mt-0.5">Connect your doctor Gmail account to query patient intake messages.</p>
              </div>
              <Link
                href="/settings/integrations/gmail"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs"
              >
                Connect Gmail →
              </Link>
            </div>
          )}

          {/* Search Query Info Banner */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Active Gmail Search Query:</span>
              <code className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                subject:"NEW PATIENT"
              </code>
            </div>
            <span className="text-[10px] text-slate-400">Subject Search Only (Debug Mode)</span>
          </div>

          {/* Inbox Messages List */}
          {loading ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 text-xs font-mono animate-pulse">
              Scanning Gmail API for matching patient intake emails...
            </div>
          ) : emails.length === 0 ? (
            /* Mandatory Zero Matching Emails Empty State */
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto shadow-xs">
                <Inbox size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No patient intake emails found.</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Send an email with Subject starting with <code className="bg-slate-100 px-1 rounded font-bold text-indigo-700">NEW PATIENT</code> to your connected Gmail address and click Refresh Inbox.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {emails.map((email) => {
                const isExpanded = expandedEmailId === email.id;
                return (
                  <div
                    key={email.id}
                    className={`bg-white border transition-all rounded-2xl overflow-hidden shadow-xs ${
                      isExpanded ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200/80 hover:border-indigo-300'
                    }`}
                  >
                    {/* Email Summary Header (Click to Expand) */}
                    <div
                      onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                      className="p-5 cursor-pointer flex items-start justify-between gap-4 select-none hover:bg-slate-50/50 transition"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition">
                            {email.subject}
                          </h3>
                          {email.attachmentCount > 0 && (
                            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Paperclip size={11} />
                              <span>{email.attachmentCount} Attachments</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <User size={13} className="text-slate-400" />
                            {email.sender}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar size={13} className="text-slate-400" />
                            {formatDate(email.receivedTime)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-1 italic font-sans">
                          "{email.snippet}"
                        </p>
                      </div>

                      <div className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl transition">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>

                    {/* Expanded Content View (Body & Attachment Metadata) */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-6 animate-fadeIn">
                        {/* Body Text */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Email Message Body
                          </span>
                          <div className="bg-white border border-slate-200/80 p-4 rounded-xl text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed shadow-2xs">
                            {email.body}
                          </div>
                        </div>

                        {/* Attachments Metadata */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                              Attached Documents ({email.attachmentCount})
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Metadata Only • Not Downloaded</span>
                          </div>

                          {email.attachments && email.attachments.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                              {email.attachments.map((att: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-white border border-slate-200/80 p-3 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                                >
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                                      <Paperclip size={14} />
                                    </div>
                                    <div className="truncate">
                                      <span className="font-bold text-slate-900 block truncate">{att.fileName}</span>
                                      <span className="text-[10px] text-slate-400 font-mono block">{att.mimeType || 'Document'}</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded shrink-0">
                                    {att.fileSize}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 bg-white border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 text-center font-mono">
                              No file attachments present in this email.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
