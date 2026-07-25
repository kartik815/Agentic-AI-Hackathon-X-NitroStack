'use client';

import React, { useState, useRef } from 'react';
import { Mic, MicOff, Upload, Activity, FileText, CheckCircle2, UserCheck, Stethoscope } from 'lucide-react';

interface AudioStreamRecorderProps {
  onTranscriptUpdate: (newTranscript: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
}

export function AudioStreamRecorder({
  onTranscriptUpdate,
  isListening,
  onToggleListening
}: AudioStreamRecorderProps) {
  const [diarizedTurns, setDiarizedTurns] = useState<Array<{ speaker: 'Doctor' | 'Patient'; text: string; time: string }>>([
    {
      speaker: 'Doctor',
      text: 'Good morning Eleanor. What symptoms have been troubling you over the past two days?',
      time: '10:14 AM'
    },
    {
      speaker: 'Patient',
      text: 'Doctor, I have severe chest pain when breathing, a productive cough with yellowish phlegm, and chills.',
      time: '10:15 AM'
    },
    {
      speaker: 'Doctor',
      text: 'I see. Before we discuss antibiotics, let me double check your allergies. You have a documented Penicillin allergy, correct?',
      time: '10:15 AM'
    },
    {
      speaker: 'Patient',
      text: 'Yes doctor, Penicillin gave me severe hives and breathing difficulty as a child.',
      time: '10:16 AM'
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadedTurn = {
        speaker: 'Patient' as const,
        text: `[Audio Upload Transcribed: ${file.name}] Patient reports sudden onset chest pressure and shortness of breath upon exertion.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setDiarizedTurns((prev) => [...prev, uploadedTurn]);
      onTranscriptUpdate(`Patient presents with severe chest pain x2 days, productive cough, chills, and uploaded consultation recording (${file.name}).`);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 font-sans">
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Stethoscope size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              AssemblyAI Live Audio Stream & Speaker Diarization
              <span className={isListening ? 'badge-critical animate-pulse' : 'badge-normal'}>
                {isListening ? 'LIVE ASR ACTIVE' : 'SPEECH READY'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Automatic speaker turn attribution (Doctor vs Patient)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleListening}
            className={isListening ? 'btn-danger text-xs' : 'btn-primary text-xs'}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            <span>{isListening ? 'Pause Recording' : 'Start Mic Stream'}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs"
          >
            <Upload size={14} />
            <span>Upload Audio File</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*,.wav,.mp3,.m4a"
            className="hidden"
          />
        </div>
      </div>

      {/* Diarized Turns Stream */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {diarizedTurns.map((turn, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border text-xs space-y-1 ${
              turn.speaker === 'Doctor'
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between font-mono font-bold text-[10px]">
              <span className="flex items-center gap-1.5">
                <UserCheck size={12} className={turn.speaker === 'Doctor' ? 'text-blue-600' : 'text-emerald-600'} />
                <span>{turn.speaker} (Speaker {turn.speaker === 'Doctor' ? 'A' : 'B'})</span>
              </span>
              <span className="text-slate-400">{turn.time}</span>
            </div>
            <p className="leading-relaxed font-medium">"{turn.text}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}
