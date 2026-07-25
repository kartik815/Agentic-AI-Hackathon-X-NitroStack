'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '../../components/Sidebar';
import { RightInfoPanel } from '../../components/RightInfoPanel';
import { Stethoscope, Clock, CheckCircle2, AlertTriangle, Activity, ArrowRight } from 'lucide-react';

export default function ConsultationsQueuePage() {
  const [activeTab, setActiveTab] = useState<'waiting' | 'active' | 'completed' | 'emergency'>('waiting');

  const patientsWaiting = [
    { id: '5678', name: 'Robert Miller', age: 60, gender: 'Male', complaint: 'Knee pain; taking Ibuprofen with Warfarin', risk: 'HIGH RISK', waitTime: '8 mins' },
    { id: '1092', name: 'James Wilson', age: 54, gender: 'Male', complaint: 'Hypertension follow-up & headache', risk: 'MODERATE RISK', waitTime: '15 mins' }
  ];

  const activeConsultation = [
    { id: '1234', name: 'Eleanor Vance', age: 70, gender: 'Female', complaint: 'Acute chest pain x2 days, cough, fever in diabetic patient', risk: 'CRITICAL RISK', startTime: '10:15 AM' }
  ];

  const completedConsultations = [
    { id: '9012', name: 'Sarah Jenkins', age: 25, gender: 'Female', complaint: 'Mild runny nose and clear discharge', risk: 'LOW RISK', completedTime: '09:45 AM' }
  ];

  const emergencyPatients = [
    { id: '1234', name: 'Eleanor Vance', age: 70, complaint: 'Penicillin allergy & severe chest distress', alert: 'Critical Anaphylaxis Warning' }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 sticky top-0 backdrop-blur-xs z-20 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Today's Consultation Triage Queue
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                Shift Triage
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Manage patient arrivals, active visits, and launch AI canvas</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/workspace"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-indigo-200 transition"
            >
              <Stethoscope size={16} />
              <span>Launch AI Canvas Workspace</span>
            </Link>
          </div>
        </header>

        {/* Tab Filters */}
        <div className="bg-white border-b border-slate-200/80 px-8 flex items-center gap-2 text-xs font-bold shrink-0 shadow-xs">
          <button
            onClick={() => setActiveTab('waiting')}
            className={`px-4 py-3 border-b-2 transition ${activeTab === 'waiting' ? 'border-amber-500 text-amber-700 bg-amber-50/50' : 'border-transparent text-slate-500'}`}
          >
            Waiting ({patientsWaiting.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-3 border-b-2 transition ${activeTab === 'active' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500'}`}
          >
            Active ({activeConsultation.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-3 border-b-2 transition ${activeTab === 'completed' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-500'}`}
          >
            Completed ({completedConsultations.length})
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-4 py-3 border-b-2 transition ${activeTab === 'emergency' ? 'border-red-600 text-red-700 bg-red-50/50' : 'border-transparent text-slate-500'}`}
          >
            Emergency ({emergencyPatients.length})
          </button>
        </div>

        {/* Queue Content */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-4">
          {activeTab === 'waiting' && (
            <div className="space-y-3">
              {patientsWaiting.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs hover:shadow-md transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-base text-slate-900">{p.name} ({p.age}y / {p.gender})</h3>
                      <span className="text-xs font-mono text-slate-500">ID: {p.id}</span>
                      <span className="text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                        {p.risk}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{p.complaint}</p>
                    <span className="text-[10px] text-slate-400 font-mono">Wait Time: {p.waitTime}</span>
                  </div>

                  <Link
                    href="/workspace"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-200"
                  >
                    <span>Start Consultation</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'active' && (
            <div className="space-y-3">
              {activeConsultation.map((p) => (
                <div key={p.id} className="bg-white border-2 border-indigo-500 p-5 rounded-2xl flex items-center justify-between shadow-md">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <h3 className="font-bold text-base text-slate-900">{p.name} ({p.age}y / {p.gender})</h3>
                      <span className="text-xs font-mono text-slate-500">ID: {p.id}</span>
                      <span className="text-xs font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded">
                        {p.risk}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{p.complaint}</p>
                  </div>

                  <Link
                    href="/workspace"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-200"
                  >
                    <span>Open AI Canvas Workspace</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-3">
              {completedConsultations.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-base text-slate-900">{p.name} ({p.age}y / {p.gender})</h3>
                      <span className="text-xs font-mono text-slate-500">ID: {p.id}</span>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                        {p.risk}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{p.complaint}</p>
                  </div>

                  <Link
                    href={`/patients/${p.id}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl border border-slate-200 transition"
                  >
                    View Patient File
                  </Link>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="space-y-3">
              {emergencyPatients.map((p) => (
                <div key={p.id} className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={18} className="text-red-600 animate-bounce" />
                      <h3 className="font-bold text-base text-red-900">{p.name} ({p.age}y)</h3>
                      <span className="text-xs font-mono bg-red-600 text-white px-2 py-0.5 rounded font-bold">EMERGENCY</span>
                    </div>
                    <p className="text-xs text-red-800">{p.complaint}</p>
                    <span className="text-[11px] font-bold text-red-700 block">{p.alert}</span>
                  </div>

                  <Link
                    href="/workspace"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-red-200"
                  >
                    <span>Emergency Canvas</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <RightInfoPanel />
    </div>
  );
}
