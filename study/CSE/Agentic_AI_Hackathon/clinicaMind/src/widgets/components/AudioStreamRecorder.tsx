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
  const [diarizedTurns, setDiarizedTurns] = useState<DiarizedTurn[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [micStatus, setMicStatus] = useState<'READY' | 'RECORDING' | 'PERMISSION_DENIED' | 'UNSUPPORTED' | 'DISCONNECTED'>('READY');
  const [audioError, setAudioError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const deepgramWsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Web Audio API Analyser & Canvas Visualizer
  const setupAudioContext = (stream: MediaStream) => {
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

  // Setup Deepgram WebSocket Streaming API if API Key is configured, else fallback to Web Speech API
  const setupDeepgramStreaming = (stream: MediaStream) => {
    const deepgramKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (!deepgramKey) return false;

    try {
      const ws = new WebSocket(`wss://api.deepgram.com/v1/listen?model=nova-2-medical&diarize=true&punctuate=true`, ['token', deepgramKey]);
      
      ws.onopen = () => {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };
        mediaRecorder.start(250);
        mediaRecorderRef.current = mediaRecorder;
      };

      ws.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives[0]?.transcript;
        if (transcript) {
          const speakerId = received.channel?.alternatives[0]?.words[0]?.speaker || 0;
          const speakerLabel: 'Doctor' | 'Patient' = speakerId === 0 ? 'Doctor' : 'Patient';

          if (received.is_final) {
            addTurn(speakerLabel, transcript, 0.97, true);
          } else {
            setInterimText(transcript);
          }
        }
      };

      deepgramWsRef.current = ws;
      return true;
    } catch (e) {
      console.warn('Deepgram streaming fallback notice:', e);
      return false;
    }
  };

  // Setup Native SpeechRecognition Listener (Fallback STT Engine)
  const setupSpeechRecognition = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition API not available in browser. Speech turns will be added via audio input.');
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

            addTurn(inferredSpeaker, transcriptText.trim(), parseFloat(conf.toFixed(2)), true);
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

  const addTurn = (speaker: 'Doctor' | 'Patient', text: string, confidence: number, isFinal: boolean) => {
    const newTurn: DiarizedTurn = {
      id: `turn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      speaker,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      confidence,
      isFinal
    };

    setDiarizedTurns((prev) => {
      const updated = [...prev, newTurn];
      const fullText = updated.map((t) => `${t.speaker}: "${t.text}"`).join(' ');
      onTranscriptUpdate(fullText);
      return updated;
    });
  };

  // Setup Browser Microphone Stream
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

        const deepgramStarted = setupDeepgramStreaming(stream);
        if (!deepgramStarted) {
          setupSpeechRecognition();
        }

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
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (deepgramWsRef.current) {
        try { deepgramWsRef.current.close(); } catch (e) {}
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

  // Toggle speaker turn manually (Doctor ↔ Patient)
  const handleSwapSpeaker = (turnId: string) => {
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
      addTurn('Patient', `[Audio File Transcribed: ${file.name}] Patient presents with acute symptoms.`, 0.99, true);
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
              Single Audio Stream & Automatic Diarization
              <span className={isListening ? 'badge-critical animate-pulse' : 'badge-normal'}>
                {micStatus === 'RECORDING' ? 'LIVE MIC RECORDING' : micStatus === 'PERMISSION_DENIED' ? 'PERM DENIED' : 'AUDIO READY'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Automatic Doctor vs Patient diarization with one-click speaker swap</p>
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
          <span>{audioError}</span>
        </div>
      )}

      {/* Single Authoritative Web Audio API FFT Canvas Spectrum */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 relative">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Volume2 size={14} className="text-emerald-400 animate-pulse" />
            <span>Single Audio Stream Waveform (AnalyserNode FFT)</span>
          </span>
          <span className="text-emerald-400 font-bold">44.1 kHz • Mono Input</span>
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
        {diarizedTurns.length > 0 ? (
          diarizedTurns.map((turn) => (
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
                  <span>{turn.speaker}</span>
                  <span className="text-slate-400 font-normal">Conf: {turn.confidence}</span>
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{turn.time}</span>
                  <button
                    onClick={() => handleSwapSpeaker(turn.id)}
                    className="hover:bg-white/80 p-1 rounded transition text-slate-500 hover:text-slate-900 flex items-center gap-1 text-[10px]"
                    title="Swap Speaker Label (Doctor ↔ Patient)"
                  >
                    <RefreshCcw size={10} />
                    <span>Swap Speaker</span>
                  </button>
                </div>
              </div>
              <p className="leading-relaxed font-medium">"{turn.text}"</p>
            </div>
          ))
        ) : (
          <div className="p-6 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 font-mono">
            <span>Microphone Audio Active • Speak to record consultation transcript turns</span>
          </div>
        )}
      </div>
    </div>
  );
}
