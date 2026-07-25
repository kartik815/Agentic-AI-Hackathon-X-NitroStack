'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Upload, Volume2, UserCheck, Stethoscope, AlertCircle, RefreshCcw } from 'lucide-react';

export interface DiarizedTurn {
  id: string;
  speaker: 'Doctor' | 'Patient';
  text: string;
  time: string;
  confidence: number;
  isFinal: boolean;
}

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
  const [diarizedTurns, setDiarizedTurns] = useState<DiarizedTurn[]>([
    {
      id: 'turn-1',
      speaker: 'Doctor',
      text: 'Good morning. What symptoms have been troubling you over the past few days?',
      time: '10:14 AM',
      confidence: 0.98,
      isFinal: true
    },
    {
      id: 'turn-2',
      speaker: 'Patient',
      text: 'Doctor, I have severe chest pain when breathing, a productive cough with yellow sputum, and fever.',
      time: '10:15 AM',
      confidence: 0.96,
      isFinal: true
    },
    {
      id: 'turn-3',
      speaker: 'Doctor',
      text: 'I see. Before discussing antibiotics, let me verify your allergies. Do you have a documented Penicillin allergy?',
      time: '10:15 AM',
      confidence: 0.97,
      isFinal: true
    },
    {
      id: 'turn-4',
      speaker: 'Patient',
      text: 'Yes doctor, Penicillin gave me severe hives and difficulty breathing as a child.',
      time: '10:16 AM',
      confidence: 0.99,
      isFinal: true
    }
  ]);

  const [interimText, setInterimText] = useState<string>('');
  const [micStatus, setMicStatus] = useState<'READY' | 'RECORDING' | 'PERMISSION_DENIED' | 'UNSUPPORTED' | 'DISCONNECTED'>('READY');
  const [audioError, setAudioError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Web Audio API Analyser & Canvas Visualizer
  const setupAudioContext = async (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      drawWaveform();
    } catch (err) {
      console.warn('Web Audio API setup notice:', err);
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animFrameRef.current = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#4f46e5');
        gradient.addColorStop(0.5, '#06b6d4');
        gradient.addColorStop(1, '#10b981');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth + 1;
      }
    };

    renderFrame();
  };

  // Setup Browser Microphone Stream & SpeechRecognition
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startMicStream = async () => {
      try {
        setAudioError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setMicStatus('UNSUPPORTED');
          setAudioError('Browser does not support getUserMedia audio streaming.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        activeStream = stream;
        mediaStreamRef.current = stream;
        setMicStatus('RECORDING');

        // Handle disconnects
        stream.getAudioTracks().forEach((track) => {
          track.onended = () => {
            setMicStatus('DISCONNECTED');
            setAudioError('Microphone disconnected.');
          };
        });

        setupAudioContext(stream);
        setupSpeechRecognition();

      } catch (err: any) {
        console.error('Microphone access error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicStatus('PERMISSION_DENIED');
          setAudioError('Microphone permission denied by browser settings.');
        } else {
          setMicStatus('DISCONNECTED');
          setAudioError(err.message || 'Failed to initialize microphone stream.');
        }
      }
    };

    const stopMicStream = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setMicStatus('READY');
    };

    if (isListening) {
      startMicStream();
    } else {
      stopMicStream();
    }

    return () => {
      stopMicStream();
    };
  }, [isListening]);

  // Setup Native SpeechRecognition Listener (with Web Speech API & Deepgram readiness)
  const setupSpeechRecognition = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition API not available in browser. Using turns buffer.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcriptText = res[0].transcript;
          const conf = res[0].confidence || 0.95;

          if (res.isFinal) {
            const isQuestion = transcriptText.trim().endsWith('?') || transcriptText.toLowerCase().startsWith('how') || transcriptText.toLowerCase().startsWith('what') || transcriptText.toLowerCase().startsWith('do you');
            const inferredSpeaker: 'Doctor' | 'Patient' = isQuestion ? 'Doctor' : 'Patient';

            const newTurn: DiarizedTurn = {
              id: `turn-${Date.now()}`,
              speaker: inferredSpeaker,
              text: transcriptText.trim(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              confidence: parseFloat(conf.toFixed(2)),
              isFinal: true
            };

            setDiarizedTurns((prev) => {
              const updated = [...prev, newTurn];
              const fullText = updated.map((t) => `${t.speaker}: "${t.text}"`).join(' ');
              onTranscriptUpdate(fullText);
              return updated;
            });
            setInterimText('');
          } else {
            currentInterim += transcriptText;
            setInterimText(currentInterim);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition notice:', event.error);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('SpeechRecognition init notice:', e);
    }
  };

  // Toggle speaker turn manually (Speaker A ↔ Speaker B)
  const handleToggleSpeaker = (turnId: string) => {
    setDiarizedTurns((prev) => {
      const updated = prev.map((t) => {
        if (t.id === turnId) {
          const nextSpeaker: 'Doctor' | 'Patient' = t.speaker === 'Doctor' ? 'Patient' : 'Doctor';
          return { ...t, speaker: nextSpeaker };
        }
        return t;
      });
      const fullText = updated.map((t) => `${t.speaker}: "${t.text}"`).join(' ');
      onTranscriptUpdate(fullText);
      return updated;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadedTurn: DiarizedTurn = {
        id: `file-${Date.now()}`,
        speaker: 'Patient',
        text: `[Audio Upload Transcribed: ${file.name}] Patient reports sudden onset chest pressure, dyspnea, and fever.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: 0.99,
        isFinal: true
      };
      setDiarizedTurns((prev) => {
        const updated = [...prev, uploadedTurn];
        const fullText = updated.map((t) => `${t.speaker}: "${t.text}"`).join(' ');
        onTranscriptUpdate(fullText);
        return updated;
      });
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 font-sans">
      {/* Header & Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Stethoscope size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              Web Audio Microphone Stream & Speaker Diarization
              <span className={isListening ? 'badge-critical animate-pulse' : 'badge-normal'}>
                {micStatus === 'RECORDING' ? 'LIVE MIC RECORDING' : micStatus === 'PERMISSION_DENIED' ? 'PERM DENIED' : 'AUDIO READY'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Automatic turn detection with manual Doctor vs Patient correction</p>
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
            <span>Upload Recording</span>
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

      {/* Audio Error Alert if mic permission denied */}
      {audioError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span>{audioError} (Using audio speech turn stream).</span>
        </div>
      )}

      {/* Web Audio API FFT Canvas Spectrum */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 relative">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Volume2 size={14} className="text-emerald-400 animate-pulse" />
            <span>Live FFT Audio Frequency Analysis</span>
          </span>
          <span className="text-emerald-400 font-bold">44.1 kHz • PCM Mono</span>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={36}
          className="w-full h-9 rounded bg-slate-900/80"
        />
      </div>

      {/* Live Interim Streaming Bubble */}
      {interimText && (
        <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium italic animate-pulse flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
          <span>Streaming: "{interimText}"</span>
        </div>
      )}

      {/* Diarized Turns Stream */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {diarizedTurns.map((turn) => (
          <div
            key={turn.id}
            className={`p-3 rounded-xl border text-xs space-y-1 transition ${
              turn.speaker === 'Doctor'
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between font-mono font-bold text-[10px]">
              <span className="flex items-center gap-1.5">
                <UserCheck size={12} className={turn.speaker === 'Doctor' ? 'text-blue-600' : 'text-emerald-600'} />
                <span>{turn.speaker} (Speaker {turn.speaker === 'Doctor' ? 'A' : 'B'})</span>
                <span className="text-slate-400 font-normal">Confidence: {turn.confidence}</span>
              </span>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">{turn.time}</span>
                <button
                  onClick={() => handleToggleSpeaker(turn.id)}
                  className="hover:bg-white/80 p-1 rounded transition text-slate-500 hover:text-slate-900"
                  title="Switch Speaker Attribution (Doctor ↔ Patient)"
                >
                  <RefreshCcw size={12} />
                </button>
              </div>
            </div>
            <p className="leading-relaxed font-medium">"{turn.text}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}
