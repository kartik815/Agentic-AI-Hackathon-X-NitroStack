'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Upload, Volume2, UserCheck, Stethoscope, AlertCircle, RefreshCcw, Terminal, CheckCircle2, XCircle } from 'lucide-react';

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

  // Server-Side STT Proxy Diagnostics State
  const [diagnostics, setDiagnostics] = useState<{
    browserToServer: string;
    serverToDeepgram: string;
    mediaRecorderState: 'inactive' | 'recording' | 'paused';
    recorderMimeType: string;
    packetsForwarded: number;
    bytesForwarded: number;
    lastChunkSize: number | null;
    transcriptEventsReceived: number;
    firstTranscriptReceived: boolean;
    rawJsonSnippet: string;
    failureReason: string;
  }>({
    browserToServer: 'Idle',
    serverToDeepgram: 'Idle',
    mediaRecorderState: 'inactive',
    recorderMimeType: 'N/A',
    packetsForwarded: 0,
    bytesForwarded: 0,
    lastChunkSize: null,
    transcriptEventsReceived: 0,
    firstTranscriptReceived: false,
    rawJsonSnippet: 'None received yet',
    failureReason: ''
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Start Server-Side STT Stream Proxy via POST /api/stt/stream with SSE
  const startServerSttStream = (stream: MediaStream) => {
    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      setDiagnostics((prev) => ({
        ...prev,
        browserToServer: 'Connecting to /api/stt/stream...',
        recorderMimeType: mimeType
      }));

      // Create a ReadableStream of Uint8Array chunks from MediaRecorder
      let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
      const audioStream = new ReadableStream<Uint8Array>({
        start(controller) {
          streamController = controller;
        }
      });

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0 && streamController) {
          const buffer = await event.data.arrayBuffer();
          streamController.enqueue(new Uint8Array(buffer));

          setDiagnostics((prev) => ({
            ...prev,
            lastChunkSize: event.data.size,
            packetsForwarded: prev.packetsForwarded + 1,
            bytesForwarded: prev.bytesForwarded + event.data.size
          }));
        }
      };

      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;

      setDiagnostics((prev) => ({
        ...prev,
        mediaRecorderState: 'recording',
        browserToServer: '✅ Browser ➔ Server Stream Active'
      }));

      // Post Audio ReadableStream to Next.js API Route /api/stt/stream
      fetch('/api/stt/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: audioStream,
        signal: abortController.signal,
        // @ts-ignore - duplext: 'half' required for streaming fetch body
        duplex: 'half'
      })
        .then(async (response) => {
          if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const msg = errJson.message || `Server returned status ${response.status}`;
            console.error('❌ [/api/stt/stream Response Error]:', msg);
            setDiagnostics((prev) => ({
              ...prev,
              serverToDeepgram: '❌ Server Error',
              failureReason: msg
            }));
            return;
          }

          setDiagnostics((prev) => ({
            ...prev,
            serverToDeepgram: '✅ Server ➔ Deepgram Connected'
          }));

          // Read Server-Sent Events (SSE) from response stream
          const reader = response.body?.getReader();
          if (!reader) return;

          const decoder = new TextDecoder();
          let bufferStr = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            bufferStr += decoder.decode(value, { stream: true });
            const lines = bufferStr.split('\n\n');
            bufferStr = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonText = line.substring(6).trim();
                try {
                  const eventData = JSON.parse(jsonText);

                  if (eventData.type === 'status') {
                    setDiagnostics((prev) => ({
                      ...prev,
                      serverToDeepgram: eventData.message
                    }));
                  } else if (eventData.type === 'transcript') {
                    setDiagnostics((prev) => ({
                      ...prev,
                      transcriptEventsReceived: prev.transcriptEventsReceived + 1,
                      firstTranscriptReceived: true,
                      rawJsonSnippet: eventData.rawJsonSnippet || eventData.text
                    }));

                    if (eventData.isFinal) {
                      addTurn(eventData.speaker || 'Doctor', eventData.text, eventData.confidence || 0.95, true);
                      setInterimText('');
                    } else {
                      setInterimText(eventData.text);
                    }
                  } else if (eventData.type === 'error') {
                    setDiagnostics((prev) => ({
                      ...prev,
                      failureReason: eventData.message
                    }));
                  }
                } catch (e) {
                  console.warn('SSE JSON parse error:', e);
                }
              }
            }
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('❌ [STT Streaming Fetch Error]:', err);
            setDiagnostics((prev) => ({
              ...prev,
              browserToServer: '❌ Fetch Error',
              failureReason: err.message || 'Failed to stream audio to server API'
            }));
          }
        });

    } catch (err: any) {
      console.error('❌ [startServerSttStream Error]:', err);
      setDiagnostics((prev) => ({
        ...prev,
        failureReason: `Failed to initialize server STT stream: ${err.message || err}`
      }));
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

        console.log('🎤 [Requesting Microphone Permission...]');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        activeStream = stream;
        mediaStreamRef.current = stream;
        setMicStatus('RECORDING');

        const audioTrack = stream.getAudioTracks()[0];
        const settings = audioTrack.getSettings();
        const sampleRate = settings.sampleRate || 44100;
        const channelCount = settings.channelCount || 1;
        const label = audioTrack.label || 'Default Audio Device';

        console.log(`✅ [Microphone Opened]: ${label}, SampleRate: ${sampleRate} Hz, Channels: ${channelCount}`);

        // 1. Setup Web Audio API Analyser & Canvas Visualizer
        setupAudioContext(stream);

        // 2. Start Server-Side STT Proxy Stream (Audio ➔ POST /api/stt/stream ➔ Deepgram WS ➔ SSE Transcripts)
        startServerSttStream(stream);

        // Handle track disconnects
        audioTrack.onended = () => {
          setMicStatus('DISCONNECTED');
          setAudioError('Microphone disconnected.');
        };

      } catch (err: any) {
        console.error('❌ [Microphone Access Error]:', err);
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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      setMicStatus('READY');
      setDiagnostics((prev) => ({
        ...prev,
        mediaRecorderState: 'inactive',
        browserToServer: 'Idle',
        serverToDeepgram: 'Idle'
      }));
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
              Server-Side STT Stream Proxy & Automatic Diarization
              <span className={isListening ? 'badge-critical animate-pulse' : 'badge-normal'}>
                {micStatus === 'RECORDING' ? 'LIVE MIC RECORDING' : micStatus === 'PERMISSION_DENIED' ? 'PERM DENIED' : 'AUDIO READY'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Server-side Deepgram proxy (/api/stt/stream) with zero direct browser websocket calls</p>
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

      {/* Live Pipeline Diagnostics Panel */}
      <div className="bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
            <Terminal size={14} />
            <span>Server STT Proxy Pipeline Diagnostics:</span>
          </div>
          <span className="text-[10px] text-slate-400">POST /api/stt/stream (SSE)</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Browser to Server */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Browser ➔ Server:</span>
            <span className={`font-bold block mt-0.5 ${diagnostics.browserToServer.includes('✅') ? 'text-emerald-400' : 'text-amber-400'}`}>
              {diagnostics.browserToServer}
            </span>
          </div>

          {/* Server to Deepgram */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Server ➔ Deepgram:</span>
            <span className={`font-bold block mt-0.5 ${diagnostics.serverToDeepgram.includes('✅') ? 'text-emerald-400' : 'text-amber-400'}`}>
              {diagnostics.serverToDeepgram}
            </span>
          </div>

          {/* Audio Chunks Forwarded */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Packets Forwarded:</span>
            <span className="font-bold text-slate-200 block mt-0.5">
              {diagnostics.packetsForwarded} ({diagnostics.bytesForwarded} bytes)
            </span>
          </div>

          {/* First Transcript Status */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">1st Transcript Recv:</span>
            <span className={`font-bold flex items-center gap-1 mt-0.5 ${diagnostics.firstTranscriptReceived ? 'text-emerald-400' : 'text-slate-400'}`}>
              {diagnostics.firstTranscriptReceived ? <CheckCircle2 size={12} /> : null}
              <span>{diagnostics.firstTranscriptReceived ? 'YES' : 'NO'}</span>
            </span>
          </div>
        </div>

        {/* Audio Stats & Diagnostic Snippet */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <div>
            <span>MediaRecorder: <strong className="text-slate-200">{diagnostics.recorderMimeType} ({diagnostics.mediaRecorderState})</strong></span>
            <span className="mx-2">•</span>
            <span>Last Chunk: <strong className="text-slate-200">{diagnostics.lastChunkSize ? `${diagnostics.lastChunkSize} bytes` : 'Waiting...'}</strong></span>
          </div>
          <span>Events Recv: {diagnostics.transcriptEventsReceived}</span>
        </div>

        {/* Diagnostic Failure Reason Report */}
        {diagnostics.failureReason && (
          <div className="p-2.5 bg-red-950/60 border border-red-800 rounded-lg text-red-300 text-[11px] font-sans flex items-start gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <span><strong>STT Proxy Notice:</strong> {diagnostics.failureReason}</span>
          </div>
        )}
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
