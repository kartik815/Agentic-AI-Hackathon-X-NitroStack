'use client';

import React from 'react';
import { Mic, MicOff, Activity, Sparkles, RefreshCw, Volume2 } from 'lucide-react';

interface ConsultationHeroCardProps {
  isListening: boolean;
  onToggleListening: () => void;
  transcript: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export function ConsultationHeroCard({
  isListening,
  onToggleListening,
  transcript,
  onRefresh,
  isLoading
}: ConsultationHeroCardProps) {
  const detectedSymptoms = ['Severe Chest Pain', 'Productive Cough', 'Chills & Fever', 'Penicillin Allergy', 'Type 2 Diabetes'];

  return (
    <div className="consultation-panel space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Volume2 size={20} />
          </div>
          <div>
            <h2 className="heading-4 flex items-center gap-2">
              Live Consultation Audio & Transcript Stream
              <span className={isListening ? 'badge-critical animate-pulse' : 'badge-normal'}>
                {isListening ? 'LIVE RECORDING' : 'AUDIO READY'}
              </span>
            </h2>
            <p className="body-sm">Real-time voice processing & multi-agent signal extraction</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleListening}
            className={isListening ? 'btn-danger' : 'btn-primary'}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isListening ? 'Pause Recording' : 'Start Audio Consultation'}</span>
          </button>

          <button
            onClick={onRefresh}
            className="btn-icon"
            title="Re-trigger Agent Pipeline"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
          </button>
        </div>
      </div>

      {/* Audio Waveform Equalizer Bar */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Activity size={14} className="text-emerald-400 animate-pulse" />
            <span>Consultation Audio Frequency Input</span>
          </span>
          <span className="text-emerald-400 font-bold">44.1 kHz • Active Stream</span>
        </div>

        {/* Waveform Equalizer Animation Bars */}
        <div className="flex items-center justify-between gap-1 h-10 px-2 pt-1">
          {Array.from({ length: 48 }).map((_, i) => {
            const heights = ['h-3', 'h-6', 'h-8', 'h-4', 'h-9', 'h-5', 'h-7', 'h-2'];
            const heightClass = isListening ? heights[i % heights.length] : 'h-2';
            return (
              <div
                key={i}
                className={`w-1 rounded-full bg-gradient-to-t from-indigo-500 to-emerald-400 transition-all duration-300 ${heightClass}`}
              />
            );
          })}
        </div>
      </div>

      {/* Transcript & Symptom Extraction Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Live Transcript Box */}
        <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
          <span className="label-text block">Live Voice Transcript:</span>
          <p className="body-md italic leading-relaxed">
            "{transcript}"
          </p>
        </div>

        {/* Detected Symptoms Tags */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
          <span className="label-text block">Extracted Symptoms & Flags:</span>
          <div className="flex flex-wrap gap-1">
            {detectedSymptoms.map((symptom, idx) => {
              const isAlert = symptom.includes('Allergy') || symptom.includes('Chest Pain');
              return (
                <span
                  key={idx}
                  className={isAlert ? 'badge-critical' : 'badge-review'}
                >
                  {isAlert ? `⚠️ ${symptom}` : symptom}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Agent Reasoning Activity Strip */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-3 rounded-xl flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <Sparkles size={16} className="text-indigo-400 animate-pulse" />
          <span>Multi-Agent Activity Ticker:</span>
          <span className="text-emerald-300 font-bold">Medication Agent flagged Penicillin Allergy</span>
          <span className="text-slate-400">•</span>
          <span className="text-blue-300">Research Agent cited JAMA 2026</span>
        </div>
        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
          Sync: 12ms
        </span>
      </div>
    </div>
  );
}
