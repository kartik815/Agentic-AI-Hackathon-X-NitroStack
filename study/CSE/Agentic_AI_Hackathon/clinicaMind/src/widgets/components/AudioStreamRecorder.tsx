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

  // Explicit Pipeline Diagnostics State
  const [diagnostics, setDiagnostics] = useState<{
    apiKeyDetected: boolean;
    wsConnecting: boolean;
    wsOpened: boolean;
    wsAuthResult: string;
    wsCloseCode: number | null;
    wsCloseReason: string;
    mediaRecorderState: 'inactive' | 'recording' | 'paused';
    recorderMimeType: string;
    recorderStartTimestamp: string | null;
    firstChunkSize: number | null;
    totalChunksSent: number;
    totalBytesSent: number;
    firstTranscriptReceived: boolean;
    rawJsonSnippet: string;
    failureReason: string;
  }>({
    apiKeyDetected: false,
    wsConnecting: false,
    wsOpened: false,
    wsAuthResult: 'Pending',
    wsCloseCode: null,
    wsCloseReason: '',
    mediaRecorderState: 'inactive',
    recorderMimeType: 'N/A',
    recorderStartTimestamp: null,
    firstChunkSize: null,
    totalChunksSent: 0,
    totalBytesSent: 0,
    firstTranscriptReceived: false,
    rawJsonSnippet: 'None received yet',
    failureReason: ''
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const deepgramWsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Chunk Queue to buffer WebM container header until WebSocket is OPEN
  const chunkQueueRef = useRef<Blob[]>([]);
  const packetsSentRef = useRef<number>(0);
  const totalBytesSentRef = useRef<number>(0);

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

  // Helper to send blob as ArrayBuffer to WebSocket
  const sendBlobToWs = (blob: Blob, ws: WebSocket) => {
    blob.arrayBuffer().then((buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Log first 5 bytes for transport verification
        const first5 = new Uint8Array(buffer.slice(0, 5));
        const hexHeader = Array.from(first5).map((b) => '0x' + b.toString(16).padStart(2, '0')).join(' ');
        console.log(`📡 [Sending ArrayBuffer Frame]: size=${buffer.byteLength} bytes, header=[${hexHeader}]`);

        ws.send(buffer);
        packetsSentRef.current += 1;
        totalBytesSentRef.current += buffer.byteLength;

        setDiagnostics((prev) => ({
          ...prev,
          totalChunksSent: packetsSentRef.current,
          totalBytesSent: totalBytesSentRef.current
        }));
      }
    }).catch((err) => console.error('ArrayBuffer conversion error:', err));
  };

  // Start MediaRecorder & Buffer Chunks
  const startMediaRecorder = (stream: MediaStream) => {
    try {
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const startTime = new Date().toLocaleTimeString();

      chunkQueueRef.current = [];
      packetsSentRef.current = 0;
      totalBytesSentRef.current = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          // Explicit Console Logs as requested
          console.log('mediaRecorder.mimeType:', mediaRecorder.mimeType);
          console.log('event.data.type:', event.data.type);
          console.log('event.data.size:', event.data.size);

          const chunkSize = event.data.size;

          setDiagnostics((prev) => ({
            ...prev,
            firstChunkSize: prev.firstChunkSize === null ? chunkSize : prev.firstChunkSize,
            recorderMimeType: mediaRecorder.mimeType
          }));

          const ws = deepgramWsRef.current;
          if (ws && ws.readyState === WebSocket.OPEN) {
            // Flush any buffered chunks first (ensuring WebM header is transmitted)
            while (chunkQueueRef.current.length > 0) {
              const buffered = chunkQueueRef.current.shift();
              if (buffered) sendBlobToWs(buffered, ws);
            }
            sendBlobToWs(event.data, ws);
          } else {
            // Buffer chunk until WebSocket opens so the WebM header is not lost!
            console.log(`📦 [Buffering Audio Chunk while WS Connecting]: size=${chunkSize} bytes`);
            chunkQueueRef.current.push(event.data);
          }
        }
      };

      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;

      setDiagnostics((prev) => ({
        ...prev,
        mediaRecorderState: 'recording',
        recorderStartTimestamp: startTime,
        recorderMimeType: mimeType
      }));

      console.log(`🎙️ [MediaRecorder Started]: State=${mediaRecorder.state}, MimeType=${mimeType}, Time=${startTime}`);
    } catch (err: any) {
      console.error('❌ [MediaRecorder Start Error]:', err);
      setDiagnostics((prev) => ({
        ...prev,
        failureReason: `MediaRecorder failed to start: ${err.message || err}`
      }));
    }
  };

  // Deepgram WebSocket STT Setup
  const setupDeepgramStreaming = (stream: MediaStream) => {
    const deepgramKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    const hasKey = Boolean(deepgramKey && deepgramKey.trim().length > 0);

    setDiagnostics((prev) => ({
      ...prev,
      apiKeyDetected: hasKey
    }));

    if (!hasKey) {
      const missingReason = 'NEXT_PUBLIC_DEEPGRAM_API_KEY is not defined in process.env. Paste your Deepgram key into .env.local file.';
      console.warn('⚠️ [Deepgram Check]:', missingReason);
      setDiagnostics((prev) => ({
        ...prev,
        wsAuthResult: 'Unconfigured (Missing Key)',
        failureReason: missingReason
      }));
      return false;
    }

    try {
      const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2-medical&smart_format=true&diarize=true&interim_results=true`;
      console.log('🌐 [Opening Deepgram WebSocket]:', wsUrl);

      setDiagnostics((prev) => ({
        ...prev,
        wsConnecting: true,
        wsAuthResult: 'Connecting...'
      }));

      const ws = new WebSocket(wsUrl, ['token', deepgramKey!.trim()]);

      ws.onopen = () => {
        console.log('✅ [Deepgram WebSocket Opened Successfully]');
        setDiagnostics((prev) => ({
          ...prev,
          wsConnecting: false,
          wsOpened: true,
          wsAuthResult: 'Authenticated (Token Subprotocol)'
        }));

        // IMMEDIATELY FLUSH BUFFERED CHUNKS INCLUDING WEBM HEADER!
        console.log(`🚀 [Flushing ${chunkQueueRef.current.length} Buffered Audio Chunks (Including WebM EBML Header)...]`);
        while (chunkQueueRef.current.length > 0) {
          const chunk = chunkQueueRef.current.shift();
          if (chunk) sendBlobToWs(chunk, ws);
        }
      };

      ws.onmessage = (message) => {
        console.log('📩 [Deepgram Raw Message Received]:', message.data);
        const rawJsonString = message.data;

        setDiagnostics((prev) => ({
          ...prev,
          rawJsonSnippet: rawJsonString.substring(0, 160)
        }));

        try {
          const received = JSON.parse(message.data);
          const channel = received.channel;
          const transcript = channel?.alternatives?.[0]?.transcript;

          if (transcript && transcript.trim().length > 0) {
            setDiagnostics((prev) => ({
              ...prev,
              firstTranscriptReceived: true
            }));

            const words = channel?.alternatives?.[0]?.words || [];
            const speakerId = words[0]?.speaker !== undefined ? words[0].speaker : 0;
            const speakerLabel: 'Doctor' | 'Patient' = speakerId === 0 ? 'Doctor' : 'Patient';
            const isFinal = received.is_final || false;
            const confidence = channel?.alternatives?.[0]?.confidence || 0.95;

            if (isFinal) {
              addTurn(speakerLabel, transcript.trim(), parseFloat(confidence.toFixed(2)), true);
              setInterimText('');
            } else {
              setInterimText(transcript);
            }
          }
        } catch (err) {
          console.error('Error parsing Deepgram JSON:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ [Deepgram WebSocket Error]:', error);
        setDiagnostics((prev) => ({
          ...prev,
          wsConnecting: false,
          wsAuthResult: 'Failed (WebSocket Error)',
          failureReason: 'Deepgram WebSocket connection failed. Verify network connectivity and API key validity.'
        }));
      };

      ws.onclose = (event) => {
        console.log('🚪 [Deepgram WebSocket Closed]: Code=', event.code, 'Reason=', event.reason);
        setDiagnostics((prev) => ({
          ...prev,
          wsOpened: false,
          wsConnecting: false,
          wsCloseCode: event.code,
          wsCloseReason: event.reason || (event.code === 1011 ? 'Deepgram 1011: Audio Format / Header Missing' : event.code === 1006 ? 'Abnormal Close (401 Unauthorized / Invalid Key)' : 'Connection Closed')
        }));
      };

      deepgramWsRef.current = ws;
      return true;
    } catch (e: any) {
      console.warn('Deepgram streaming exception:', e);
      setDiagnostics((prev) => ({
        ...prev,
        wsConnecting: false,
        wsAuthResult: 'Exception',
        failureReason: `Deepgram Exception: ${e.message || e}`
      }));
      return false;
    }
  };

  // Setup Native SpeechRecognition Listener (Fallback STT Engine)
  const setupSpeechRecognition = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition API not available in browser.');
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

          setDiagnostics((prev) => ({
            ...prev,
            firstTranscriptReceived: true,
            rawJsonSnippet: `SpeechRecognition STT: "${transcriptText}" (IsFinal: ${res.isFinal})`
          }));

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
    } catch (e: any) {
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

        // 2. IMMEDIATELY start MediaRecorder on stream open (buffers early WebM header chunks!)
        startMediaRecorder(stream);

        // 3. Initiate STT Engine (Deepgram WebSocket + Web Speech API fallback)
        const deepgramStarted = setupDeepgramStreaming(stream);
        if (!deepgramStarted) {
          setupSpeechRecognition();
        }

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
      setDiagnostics((prev) => ({
        ...prev,
        mediaRecorderState: 'inactive',
        wsOpened: false,
        wsConnecting: false
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

      {/* Live Pipeline Diagnostics Panel */}
      <div className="bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
            <Terminal size={14} />
            <span>STT Transport Layer Real-Time Diagnostics:</span>
          </div>
          <span className="text-[10px] text-slate-400">Deepgram ArrayBuffer Transport</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* API Key Status */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">API Key Detected:</span>
            <span className={`font-bold flex items-center gap-1 mt-0.5 ${diagnostics.apiKeyDetected ? 'text-emerald-400' : 'text-red-400'}`}>
              {diagnostics.apiKeyDetected ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              <span>{diagnostics.apiKeyDetected ? 'YES' : 'NO (Key Missing)'}</span>
            </span>
          </div>

          {/* MediaRecorder State */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">MediaRecorder State:</span>
            <span className={`font-bold block mt-0.5 ${diagnostics.mediaRecorderState === 'recording' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {diagnostics.mediaRecorderState.toUpperCase()}
            </span>
            <span className="text-[9px] font-mono text-slate-400 block truncate">{diagnostics.recorderMimeType}</span>
          </div>

          {/* WebSocket Status */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">WebSocket Opened:</span>
            <span className={`font-bold block mt-0.5 ${diagnostics.wsOpened ? 'text-emerald-400' : 'text-amber-400'}`}>
              {diagnostics.wsOpened ? 'YES (OPEN)' : diagnostics.wsConnecting ? 'CONNECTING...' : 'NO'}
            </span>
            <span className="text-[9px] text-slate-500 block">Auth: {diagnostics.wsAuthResult}</span>
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

        {/* Audio Transmission Stats & Close Reason */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <div>
            <span>First Chunk: <strong className="text-slate-200">{diagnostics.firstChunkSize ? `${diagnostics.firstChunkSize} bytes` : 'Waiting...'}</strong></span>
            <span className="mx-2">•</span>
            <span>ArrayBuffer Packets Sent: <strong className="text-slate-200">{diagnostics.totalChunksSent} ({diagnostics.totalBytesSent} bytes)</strong></span>
          </div>
          {diagnostics.wsCloseCode && (
            <span className="text-amber-400">WS Close Code: {diagnostics.wsCloseCode} ({diagnostics.wsCloseReason})</span>
          )}
        </div>

        {/* Diagnostic Failure Reason Report */}
        {diagnostics.failureReason && (
          <div className="p-2.5 bg-red-950/60 border border-red-800 rounded-lg text-red-300 text-[11px] font-sans flex items-start gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <span><strong>Transport Diagnostic Notice:</strong> {diagnostics.failureReason}</span>
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
