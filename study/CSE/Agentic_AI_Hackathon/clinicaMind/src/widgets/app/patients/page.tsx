'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '../../components/Sidebar';
import { PatientOnboardingModal } from '../../components/PatientOnboardingModal';
import { Search, UserPlus, ArrowRight, ShieldAlert } from 'lucide-react';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const json = await res.json();
        setPatients(json.patients || []);
      }
    } catch (e) {
      console.error('Error fetching patients:', e);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientId.includes(searchTerm) ||
    p.conditions.some((c: string) => c.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 sticky top-0 backdrop-blur-xs z-20 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Patients Directory & Digital Folders
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                {patients.length} Active Profiles
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Permanent medical records, file uploads, & clinical history</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-indigo-200 transition"
            >
              <UserPlus size={16} />
              <span>+ New Patient Onboarding</span>
            </button>
          </div>
        </header>

        {/* Patients Hub Content */}
        <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Search & Filter Bar */}
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient by name, ID, or condition..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Filter Risk:</span>
              <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded font-bold cursor-pointer">Critical</span>
              <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded font-bold cursor-pointer">High</span>
              <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded font-bold cursor-pointer">Low</span>
            </div>
          </div>

          {/* Patients Directory Grid */}
          <div className="grid grid-cols-3 gap-6">
            {filteredPatients.map((patient) => {
              const isCritical = patient.riskCategory === 'CRITICAL RISK' || patient.riskCategory === 'HIGH RISK';
              return (
                <div
                  key={patient.patientId}
                  className="bg-white border border-slate-200/80 hover:border-indigo-500/50 rounded-2xl p-6 space-y-4 transition shadow-xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold text-sm">
                          {patient.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition">{patient.name}</h3>
                          <span className="text-xs font-mono text-slate-500">ID: {patient.patientId} • {patient.age}y / {patient.gender}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isCritical ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                        {patient.riskCategory}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Conditions:</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {patient.conditions.map((c: string, idx: number) => (
                            <span key={idx} className="bg-white text-slate-700 border border-slate-200 text-[10px] px-2 py-0.5 rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Allergies:</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {patient.allergies.map((a: string, idx: number) => (
                            <span key={idx} className="bg-red-100 text-red-700 border border-red-200 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                              <ShieldAlert size={10} /> {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">
                      📁 {patient.documents?.length || 0} Files • 🏥 {patient.visitHistory?.length || 0} Visits
                    </span>
                    <Link
                      href={`/patients/${patient.patientId}`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 text-[11px] shadow-xs"
                    >
                      <span>Open Folder</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <PatientOnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPatients}
      />
    </div>
  );
}
