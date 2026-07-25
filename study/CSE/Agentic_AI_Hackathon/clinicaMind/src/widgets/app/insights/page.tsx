'use client';

import React from 'react';
import { Sidebar } from '../../components/Sidebar';
import { RightInfoPanel } from '../../components/RightInfoPanel';
import { Sparkles, ShieldAlert, Pill } from 'lucide-react';

export default function AIInsightsPage() {
  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 sticky top-0 backdrop-blur-xs z-20 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              AI Risk Analytics & Population Insights
              <span className="text-xs font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-bold">
                Multi-Agent Intelligence
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Population risk stratification, drug safety alerts, and evidence trends</p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* High Risk Patients */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldAlert size={18} className="text-red-600" />
                <span>High Risk Cohort Patients</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Eleanor Vance (70y)</span>
                    <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] px-2 py-0.5 rounded font-bold">CRITICAL RISK</span>
                  </div>
                  <p className="text-slate-600">Community-Acquired Pneumonia with Type 2 Diabetes & Penicillin allergy.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Robert Miller (60y)</span>
                    <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded font-bold">HIGH RISK</span>
                  </div>
                  <p className="text-slate-600">Atrial Fibrillation on Warfarin with unmonitored NSAID usage.</p>
                </div>
              </div>
            </div>

            {/* Active Medication Conflicts */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Pill size={18} className="text-purple-600" />
                <span>Active Medication Conflicts</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-xl space-y-1">
                  <span className="font-bold text-purple-900">Warfarin + NSAID Bleeding Hazard</span>
                  <p className="text-purple-800 text-[11px]">3.4-fold increase in upper GI hemorrhage. Recommendation: Switch to Acetaminophen.</p>
                </div>

                <div className="bg-red-50/80 border border-red-200 p-4 rounded-xl space-y-1">
                  <span className="font-bold text-red-900">Beta-Lactam Anaphylaxis Conflict</span>
                  <p className="text-red-800 text-[11px]">Penicillin allergy documented. Amoxicillin/Augmentin strictly contraindicated.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <RightInfoPanel />
    </div>
  );
}
