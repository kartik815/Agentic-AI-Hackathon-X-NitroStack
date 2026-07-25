'use client';

import React from 'react';
import { ShieldAlert, User, Zap, Sparkles } from 'lucide-react';

interface RightInfoPanelProps {
  patient?: any;
}

export function RightInfoPanel({ patient }: RightInfoPanelProps) {
  const defaultPatient = patient || {
    name: 'Eleanor Vance',
    patientId: '1234',
    age: 70,
    gender: 'Female',
    riskCategory: 'CRITICAL RISK',
    conditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
    allergies: ['Penicillin'],
    medications: ['Metformin 500mg BID', 'Lisinopril 10mg Daily'],
    recentLabs: ['HbA1c: 7.8%', 'BP: 138/84 mmHg']
  };

  return (
    <aside className="w-80 bg-white border-l border-slate-200/80 flex flex-col justify-between shrink-0 font-sans p-5 space-y-6 overflow-y-auto z-20">
      {/* Active Patient Quick Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User size={16} className="text-indigo-600" />
            <h3 className="section-title">Active Consultation</h3>
          </div>
          <span className="badge-critical">
            {defaultPatient.riskCategory}
          </span>
        </div>

        <div className="patient-card space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="heading-4">{defaultPatient.name}</h4>
            <span className="caption-text font-mono">ID: {defaultPatient.patientId}</span>
          </div>
          <p className="body-sm font-mono">{defaultPatient.age}y / {defaultPatient.gender} • Medicare Choice</p>

          <div className="pt-2 space-y-1.5 text-xs">
            <div>
              <span className="label-text block">Documented Allergies:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {defaultPatient.allergies.map((a: string, i: number) => (
                  <span key={i} className="badge-critical flex items-center gap-1">
                    <ShieldAlert size={10} /> {a}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="label-text block">Active Conditions:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {defaultPatient.conditions.map((c: string, i: number) => (
                  <span key={i} className="badge-review">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STAT Clinical Tasks & Alerts */}
      <div className="space-y-3">
        <h3 className="section-title border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <Zap size={14} className="text-amber-500" />
          <span>STAT Agent Recommendations</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-red-700 font-bold text-[11px]">
              <span>Contradiction Warning</span>
              <span className="agent-badge-medication">Medication</span>
            </div>
            <p className="text-[11px] text-red-800 leading-snug">
              Do NOT administer Beta-lactam antibiotics. Penicillin hypersensitivity flag triggered.
            </p>
          </div>

          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-blue-700 font-bold text-[11px]">
              <span>JAMA 2026 Guideline</span>
              <span className="agent-badge-research">Research</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-snug">
              Initiate Levofloxacin 750mg QD + Stat Chest Radiograph PA/Lateral.
            </p>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-amber-700 font-bold text-[11px]">
              <span>Missing History Gap</span>
              <span className="agent-badge-gap">Gap Agent</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-snug">
              Inquire about smoking history & occupational pulmonary irritant exposure.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Copilot Actions */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <h4 className="label-text block">Instant AI Actions</h4>
        <button className="btn-primary w-full shadow-sm">
          <Sparkles size={14} />
          <span>Generate Summary Briefing</span>
        </button>
      </div>
    </aside>
  );
}
