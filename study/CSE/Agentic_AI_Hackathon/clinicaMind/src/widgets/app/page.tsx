'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { Activity, Stethoscope } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { RightInfoPanel } from '../components/RightInfoPanel';
import { ConsultationHeroCard } from '../components/ConsultationHeroCard';
import { CopilotDrawer } from '../components/CopilotDrawer';
import { AudioStreamRecorder } from '../components/AudioStreamRecorder';

import { SpeechNode } from '../components/canvas/SpeechNode';
import { SupervisorNode } from '../components/canvas/SupervisorNode';
import { HistoryNode } from '../components/canvas/HistoryNode';
import { MedicationNode } from '../components/canvas/MedicationNode';
import { ResearchNode } from '../components/canvas/ResearchNode';
import { GapNode } from '../components/canvas/GapNode';
import { ReportNode } from '../components/canvas/ReportNode';

const PATIENT_TRIAGE_CASES = [
  {
    id: 'case-3-pneumonia',
    title: 'Eleanor Vance (70yo / EHR 1234)',
    patientId: '1234',
    badge: 'CRITICAL RISK',
    badgeClass: 'badge-critical'
  },
  {
    id: 'case-2-warfarin',
    title: 'Robert Miller (60yo / EHR 5678)',
    patientId: '5678',
    badge: 'HIGH RISK',
    badgeClass: 'badge-warning'
  },
  {
    id: 'case-1-cold',
    title: 'Sarah Jenkins (25yo / EHR 9012)',
    patientId: '9012',
    badge: 'LOW RISK',
    badgeClass: 'badge-normal'
  }
];

export default function ClinicaMindWorkspace() {
  const [isListening, setIsListening] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(PATIENT_TRIAGE_CASES[0]);
  const [transcript, setTranscript] = useState('');
  const [patientId, setPatientId] = useState('1234');
  const [graphData, setGraphData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const nodeTypes = useMemo(() => ({
    speech: SpeechNode,
    supervisor: SupervisorNode,
    history: HistoryNode,
    medication: MedicationNode,
    research: ResearchNode,
    gap: GapNode,
    report: ReportNode
  }), []);

  const runOrchestration = async (text: string, pid: string) => {
    if (!text || text.trim().length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, patientId: pid })
      });

      if (response.ok) {
        const json = await response.json();
        setGraphData(json.data);
      }
    } catch (error) {
      console.error('Error connecting to NitroStack backend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transcript && transcript.trim().length > 0) {
      runOrchestration(transcript, patientId);
    }
  }, [transcript, patientId]);

  const handleScenarioChange = (scen: typeof PATIENT_TRIAGE_CASES[0]) => {
    setSelectedScenario(scen);
    setPatientId(scen.patientId);
    setTranscript('');
    setGraphData(null);
  };

  return (
    <div className="page-container font-sans overflow-hidden">
      {/* 1. Sidebar Navigation */}
      <Sidebar onOpenCopilot={() => setIsCopilotOpen(true)} />

      {/* 2. Main Workspace Layout */}
      <div className="workspace">
        {/* Workspace Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl shadow-md shadow-indigo-200">
              <Stethoscope size={20} className="text-white" />
            </div>
            <div>
              <h1 className="heading-4 flex items-center gap-2">
                AI Clinical Decision Support Workspace
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                  NitroStack Canvas
                </span>
              </h1>
              <p className="body-sm">Real-time collaborative multi-agent reasoning graph</p>
            </div>
          </div>

          {/* Patient EHR Triage Switcher */}
          <div className="flex items-center gap-2">
            <span className="label-text mr-1">Active Patient EHR:</span>
            {PATIENT_TRIAGE_CASES.map((scen) => (
              <button
                key={scen.id}
                onClick={() => handleScenarioChange(scen)}
                className={selectedScenario.id === scen.id ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
              >
                {scen.title.split(' ')[0]} {scen.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </header>

        {/* Content Body: Hero Consultation Card + Audio Recorder + React Flow Canvas */}
        <main className="content-area">
          {/* Live Consultation Hero Card */}
          <ConsultationHeroCard
            isListening={isListening}
            onToggleListening={() => setIsListening(!isListening)}
            transcript={transcript}
            onRefresh={() => runOrchestration(transcript, patientId)}
            isLoading={isLoading}
            graphData={graphData}
          />

          {/* Live Audio Stream Recorder & Diarization Component */}
          <AudioStreamRecorder
            onTranscriptUpdate={(newText) => {
              setTranscript(newText);
              runOrchestration(newText, patientId);
            }}
            isListening={isListening}
            onToggleListening={() => setIsListening(!isListening)}
          />

          {/* React Flow Multi-Agent Graph Canvas */}
          <div className="h-[560px] panel relative min-h-[500px]">
            <div className="absolute top-3 left-3 z-10 glass-card px-3 py-1.5 text-xs font-mono text-slate-700 font-bold flex items-center gap-2 shadow-xs">
              <Activity size={14} className="text-emerald-500 animate-pulse" />
              <span>Multi-Agent Live Graph</span>
            </div>

            {graphData ? (
              <ReactFlow
                nodes={graphData.nodes}
                edges={graphData.edges}
                nodeTypes={nodeTypes}
                fitView
                nodesFocusable={true}
                edgesFocusable={true}
                className="bg-slate-50/50"
              >
                <Background color="#cbd5e1" gap={24} size={1} />
                <Controls className="!bg-white !border-slate-200 !text-slate-700 !shadow-md" />
                <MiniMap
                  nodeColor={(n) => {
                    switch (n.type) {
                      case 'speech': return '#4f46e5';
                      case 'supervisor': return '#2563eb';
                      case 'history': return '#059669';
                      case 'medication': return '#7c3aed';
                      case 'research': return '#0891b2';
                      case 'gap': return '#ea580c';
                      case 'report': return '#475569';
                      default: return '#64748b';
                    }
                  }}
                  className="!bg-white/90 !border-slate-200 rounded-xl !shadow-md"
                />
              </ReactFlow>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs">
                <span>Start Audio Consultation or speak into microphone to trigger dynamic multi-agent execution...</span>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3. Right Information Panel */}
      <RightInfoPanel />

      {/* 4. AI Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        patientId={patientId}
        patientName={selectedScenario.id === 'case-3-pneumonia' ? 'Eleanor Vance' : selectedScenario.id === 'case-2-warfarin' ? 'Robert Miller' : 'Sarah Jenkins'}
        transcript={transcript}
      />
    </div>
  );
}
