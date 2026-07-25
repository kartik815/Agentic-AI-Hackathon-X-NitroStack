'use client';

import React from 'react';
import Link from 'next/link';
import { Sidebar } from '../../components/Sidebar';
import { RightInfoPanel } from '../../components/RightInfoPanel';
import { Users, Clock, CheckCircle2, AlertTriangle, Activity, ArrowRight, ShieldAlert, Sparkles, Stethoscope, FileText } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 sticky top-0 backdrop-blur-xs z-20 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Clinical Operations Dashboard
              <span className="text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                Live Shift Active
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Hospital consultation queue & multi-agent risk monitoring</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/consultations"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-indigo-200 transition"
            >
              <Stethoscope size={16} />
              <span>Launch Consultation Queue</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-6 gap-4">
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Today's Appointments</span>
                <Clock size={16} className="text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">18</div>
              <div className="text-[10px] text-slate-500 font-mono">12 Scheduled • 6 Walk-in</div>
            </div>

            <div className="bg-white border border-amber-200 p-4 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-xs font-medium">Waiting Patients</span>
                <Users size={16} className="text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">4</div>
              <div className="text-[10px] text-amber-700 font-mono">Avg Wait: 12 mins</div>
            </div>

            <div className="bg-white border border-indigo-200 p-4 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between text-indigo-700">
                <span className="text-xs font-medium">Active Visit</span>
                <Activity size={16} className="text-indigo-600 animate-pulse" />
              </div>
              <div className="text-2xl font-black text-indigo-600">1</div>
              <div className="text-[10px] text-indigo-700 font-mono">Eleanor Vance (70y)</div>
            </div>

            <div className="bg-white border border-emerald-200 p-4 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-xs font-medium">Completed</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">13</div>
              <div className="text-[10px] text-emerald-700 font-mono">Reports Finalized</div>
            </div>

            <div className="bg-white border border-red-200 p-4 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between text-red-700">
                <span className="text-xs font-medium">Emergency Alerts</span>
                <AlertTriangle size={16} className="text-red-600 animate-bounce" />
              </div>
              <div className="text-2xl font-black text-red-600">2</div>
              <div className="text-[10px] text-red-700 font-mono">Penicillin & Bleeding</div>
            </div>

            <div className="bg-white border border-purple-200 p-4 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between text-purple-700">
                <span className="text-xs font-medium">Recent AI Alerts</span>
                <Sparkles size={16} className="text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">5</div>
              <div className="text-[10px] text-purple-700 font-mono">Literature Matches</div>
            </div>
          </div>

          {/* Active Consultation Spotlight */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                  <h3 className="font-bold text-sm text-slate-900">Current Active Consultation</h3>
                  <span className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                    ID: 1234
                  </span>
                </div>
                <Link
                  href="/workspace"
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-bold transition"
                >
                  <span>Open AI Canvas Workspace</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Eleanor Vance</span>
                    <span className="text-xs font-mono text-slate-500">70y / Female</span>
                  </div>
                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    "Acute chest pain x2 days, productive cough, fever risk in diabetic patient."
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] px-2 py-0.5 rounded font-bold">
                      ⚠️ Penicillin Allergy
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-2 py-0.5 rounded">
                      Type 2 Diabetes
                    </span>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Live Agent Orchestration</span>
                  <div className="space-y-1.5 text-xs text-slate-700 font-mono">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <CheckCircle2 size={14} />
                      <span>History Agent: EHR records pulled</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-700 font-bold">
                      <ShieldAlert size={14} />
                      <span>Medication Agent: Allergy Warning</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-700">
                      <CheckCircle2 size={14} />
                      <span>Research Agent: JAMA 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency AI Risk Feed */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
                <span>Emergency Risk Feed</span>
                <span className="text-[10px] font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-bold">Live</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-red-700 font-bold">
                    <span>Penicillin Anaphylaxis Risk</span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: 1234</span>
                  </div>
                  <p className="text-[11px] text-red-800 leading-snug">
                    Amoxicillin proposed; patient has severe Penicillin allergy. Switch to Levofloxacin.
                  </p>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-amber-700 font-bold">
                    <span>Warfarin + NSAID Bleeding</span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: 5678</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Ibuprofen initiated on Warfarin. Discontinue Ibuprofen immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Queue Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Today's Patient Queue</h3>
                <p className="text-xs text-slate-500">Click any patient to launch instant AI workspace consultation</p>
              </div>
              <Link href="/patients" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                View Patient Directory →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">ID</th>
                    <th className="p-3">Chief Complaint</th>
                    <th className="p-3">Risk Level</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">Eleanor Vance (70y)</td>
                    <td className="p-3 font-mono text-slate-500">1234</td>
                    <td className="p-3">Severe chest pain x2 days, productive cough</td>
                    <td className="p-3">
                      <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] px-2 py-0.5 rounded font-bold">
                        CRITICAL RISK
                      </span>
                    </td>
                    <td className="p-3 text-indigo-600 font-bold">Active Consultation</td>
                    <td className="p-3 text-right">
                      <Link href="/workspace" className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition">
                        Open AI Canvas
                      </Link>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">Robert Miller (60y)</td>
                    <td className="p-3 font-mono text-slate-500">5678</td>
                    <td className="p-3">Right knee arthritis pain; taking Ibuprofen with Warfarin</td>
                    <td className="p-3">
                      <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded font-bold">
                        HIGH RISK
                      </span>
                    </td>
                    <td className="p-3 text-amber-700 font-bold">Waiting</td>
                    <td className="p-3 text-right">
                      <Link href="/workspace" className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition">
                        Start Visit
                      </Link>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">Sarah Jenkins (25y)</td>
                    <td className="p-3 font-mono text-slate-500">9012</td>
                    <td className="p-3">Mild runny nose, clear discharge, headache</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded font-bold">
                        LOW RISK
                      </span>
                    </td>
                    <td className="p-3 text-emerald-700 font-bold">Completed</td>
                    <td className="p-3 text-right">
                      <Link href="/patients/9012" className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition">
                        View Report
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <RightInfoPanel />
    </div>
  );
}
