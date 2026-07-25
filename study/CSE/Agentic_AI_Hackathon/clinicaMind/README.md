# ClinicaMind: AI Clinical Decision Support Workspace

**One-line Pitch:** *ClinicaMind is an AI-powered assistant that listens during doctor–patient consultations and orchestrates patient history, medication checks, and medical literature into an evidence-backed clinical briefing.*

## Overview
ClinicaMind addresses fragmented patient data and decision overload in healthcare. As the patient and doctor converse, specialized AI agents retrieve past records, detect drug interactions, query latest research, and identify missing information. These agents work in concert to produce a live **Clinical Briefing** with possible diagnoses and evidence, while leaving final decisions to the physician.

## Demo Script
1. **Start Demo:** Doctor opens ClinicaMind UI and clicks *“Start Consultation.”* The system begins listening.
2. **Patient Speaks:** Patient says, *“I have chest pain and a cough.”* The Supervisor Agent extracts symptoms and triggers the History, Medication, and Research agents.
3. **Agent Actions:** ClinicaMind displays draggable nodes for symptom, history, medication, research, and warnings.
4. **Alert:** A Warning node appears: *“Potential pneumonia. High-risk due to diabetes and penicillin allergy. Recent paper suggests early evaluation.”*
5. **Doctor Response:** Doctor reviews the AI briefing, asks follow-up questions, and confirms a care plan.

## Features
- Real-time transcription of consultation speech.
- Multi-agent workflow: history lookup, drug/allergy check, literature search, gap analysis.
- Evidence-backed recommendations using PubMed API and OpenFDA-style drug data.
- Interactive canvas UI powered by React Flow.
- NitroStack MCP backend for modular tool orchestration.

## Tech Stack
- **Backend:** NitroStack MCP (TypeScript)
- **Agents/AI:** OpenAI GPT via NitroStack prompts
- **APIs:** NCBI PubMed E-utilities, OpenFDA drug-label lookup
- **Frontend:** React, React Flow for node canvas

## Quick Start
1. Clone the repo:
   ```bash
git clone https://github.com/your-repo/clinica-mind.git
cd clinica-mind
```
2. Install dependencies:
   ```bash
npm install
```
3. Copy environment variables and set keys:
   ```bash
cp .env.example .env
```
4. Run the app:
   ```bash
npm run dev
```
5. Open the UI at `http://localhost:3000`.

## Usage
- Click *Start Consultation* to begin listening.
- Speak the patient case aloud or paste transcript text.
- Watch nodes populate on the canvas and review the generated briefing.

## Documentation
- Architecture: `docs/ARCHITECTURE.md`
- Agents: `docs/AGENTS.md`
- Tools: `docs/TOOLS.md`
- Workflow: `docs/WORKFLOW.md`
- UI spec: `docs/UI.md`
- Deployment: `docs/DEPLOY.md`
- Integration: `docs/INTEGRATION.md`
- Testing: `docs/TESTING.md`
- Security: `docs/SECURITY_COMPLIANCE.md`
- Contribution: `docs/CONTRIBUTING.md`
- Presentation: `docs/PRESENTATION.md`

## Acknowledgments
This project uses NitroStack’s MCP framework for multi-agent orchestration and public medical APIs for literature and drug safety references.
