'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { RightInfoPanel } from '../../components/RightInfoPanel';
import { FileText, Download, CheckCircle2, Printer, Share2, Award } from 'lucide-react';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<'summary' | 'prescription' | 'referral' | 'discharge' | 'followup'>('summary');

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 sticky top-0 backdrop-blur-xs z-20 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Clinical Reports & PDF Document Generator
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                Auto-Generated EMR Briefings
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Export evidence-backed physician summaries, prescriptions, and referrals</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('Generating and downloading official PDF Report...')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-indigo-200 transition"
            >
              <Download size={16} />
              <span>Export Signed PDF</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Document Tab Selector */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 text-xs font-bold shadow-xs">
            <button
              onClick={() => setSelectedReport('summary')}
              className={`px-4 py-2 rounded-xl transition ${selectedReport === 'summary' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Clinical Summary
            </button>
            <button
              onClick={() => setSelectedReport('prescription')}
              className={`px-4 py-2 rounded-xl transition ${selectedReport === 'prescription' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Rx Prescription
            </button>
            <button
              onClick={() => setSelectedReport('referral')}
              className={`px-4 py-2 rounded-xl transition ${selectedReport === 'referral' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Specialist Referral
            </button>
            <button
              onClick={() => setSelectedReport('discharge')}
              className={`px-4 py-2 rounded-xl transition ${selectedReport === 'discharge' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Discharge Summary
            </button>
            <button
              onClick={() => setSelectedReport('followup')}
              className={`px-4 py-2 rounded-xl transition ${selectedReport === 'followup' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Follow-up Care Plan
            </button>
          </div>

          {/* Document Preview Sheet */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 space-y-6 shadow-sm text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider font-mono">
                  ClinicaMind Hospital EMR Report
                </h2>
                <p className="text-slate-500 text-xs">Attending Physician: Dr. Marcus Vance, MD • Date: 2026-07-25</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-600 block">Patient: Eleanor Vance (ID: 1234)</span>
                <span className="text-[10px] text-slate-500 font-mono">DOB: 1956-03-14 (70y Female)</span>
              </div>
            </div>

            {selectedReport === 'summary' && (
              <div className="space-y-4 text-slate-700 leading-relaxed">
                <div>
                  <h4 className="font-bold text-indigo-700 uppercase font-mono text-[11px] mb-1">Chief Complaint & HPI:</h4>
                  <p className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    Patient presents with acute onset chest pain x2 days, productive cough with discolored sputum, and fever spikes. Documented history of Type 2 Diabetes Mellitus (HbA1c 7.8%) and severe Penicillin anaphylactic allergy.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-indigo-700 uppercase font-mono text-[11px] mb-1">Multi-Agent AI Reasoning & Assessment:</h4>
                  <p className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    High-risk Community-Acquired Pneumonia (CAP) suspected. Medication Agent flagged documented Penicillin allergy; beta-lactam antibiotics are strictly contraindicated. Research Agent cross-referenced JAMA 2026 guidelines recommending early empirical Levofloxacin respiratory fluoroquinolone therapy.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-indigo-700 uppercase font-mono text-[11px] mb-1">Actionable Plan:</h4>
                  <ul className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 list-disc list-inside">
                    <li>Stat PA & Lateral Chest Radiograph to evaluate lower lobe consolidation.</li>
                    <li>Initiate Levofloxacin 750mg PO QD x7 days (Non-penicillin respiratory fluoroquinolone).</li>
                    <li>Conduct Gap Analysis follow-up regarding smoking history and travel exposure.</li>
                  </ul>
                </div>
              </div>
            )}

            {selectedReport === 'prescription' && (
              <div className="space-y-4 text-slate-700">
                <h4 className="font-bold text-indigo-700 uppercase font-mono text-[11px]">Rx Prescriptions:</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 font-mono">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-bold text-slate-900">1. Levofloxacin 750mg Oral Tablet</span>
                      <p className="text-[11px] text-slate-500">Sig: Take 1 tablet daily with full glass of water for 7 days.</p>
                    </div>
                    <span className="text-emerald-700 font-bold">Qty: 7 Tablets</span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <span className="font-bold text-slate-900">2. Acetaminophen 500mg Oral Tablet</span>
                      <p className="text-[11px] text-slate-500">Sig: Take 1 tablet every 6 hours PRN fever or chest pain.</p>
                    </div>
                    <span className="text-emerald-700 font-bold">Qty: 20 Tablets</span>
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'referral' && (
              <div className="space-y-3 text-slate-700">
                <h4 className="font-bold text-indigo-700 uppercase font-mono text-[11px]">Pulmonology Specialist Referral:</h4>
                <p className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  Referred to Department of Pulmonology for follow-up evaluation of persistent respiratory consolidation in high-risk diabetic patient.
                </p>
              </div>
            )}

            {selectedReport === 'discharge' && (
              <div className="space-y-3 text-slate-700">
                <h4 className="font-bold text-indigo-700 uppercase font-mono text-[11px]">Outpatient Discharge Instructions:</h4>
                <p className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  Patient discharged with oral Levofloxacin regimen. Educated on red-flag symptoms: shortness of breath, confusion, or temperature exceeding 102°F.
                </p>
              </div>
            )}

            {selectedReport === 'followup' && (
              <div className="space-y-3 text-slate-700">
                <h4 className="font-bold text-indigo-700 uppercase font-mono text-[11px]">Scheduled Follow-up Care Plan:</h4>
                <p className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 font-mono">
                  Follow-up appointment scheduled for July 28, 2026 at 10:00 AM for repeat Chest X-Ray & O2 saturation check.
                </p>
              </div>
            )}

            {/* Doctor Signature Block */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Dr. Marcus Vance, MD</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Attending Physician • License #MD-8819204</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-bold">
                  ✓ Electronically Signed & Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <RightInfoPanel />
    </div>
  );
}
