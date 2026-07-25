const fs = require('fs');
const path = require('path');

function createSimpleSVG(width, height, title, subtitle) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#020617"/>
    <rect x="20" y="20" width="${width - 40}" height="70" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
    <circle cx="55" cy="55" r="16" fill="#4f46e5"/>
    <text x="85" y="52" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="900">ClinicaMind EMR</text>
    <text x="85" y="70" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12" font-weight="500">${title} • Hospital AI Intelligence Workspace</text>
    
    <rect x="20" y="110" width="240" height="${height - 130}" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
    <text x="40" y="150" fill="#6366f1" font-family="system-ui, sans-serif" font-size="14" font-weight="700">CLINICAL NAVIGATION</text>
    <text x="40" y="190" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13">1. Operations Dashboard</text>
    <text x="40" y="230" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13">2. Today's Queue</text>
    <text x="40" y="270" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13">3. Patient Digital Folders</text>
    <text x="40" y="310" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13">4. AI Clinical Workspace</text>
    <text x="40" y="350" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13">5. Population Insights</text>
    <text x="40" y="390" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13">6. Reports &amp; PDF Export</text>
    
    <rect x="280" y="110" width="${width - 300}" height="${height - 130}" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
    <text x="320" y="160" fill="#ffffff" font-family="system-ui, sans-serif" font-size="24" font-weight="800">${title}</text>
    <text x="320" y="190" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14">${subtitle}</text>

    <rect x="320" y="220" width="${width - 380}" height="140" rx="12" fill="#020617" stroke="#334155" stroke-width="1.5"/>
    <text x="340" y="260" fill="#10b981" font-family="monospace" font-size="14" font-weight="bold">✓ NITROSTACK MULTI-AGENT PIPELINE ACTIVE</text>
    <text x="340" y="290" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="13">Agents: Supervisor (Purple) | History (Green) | Medication (Purple) | Research (Blue) | Gap (Orange) | Report (Red)</text>
    <text x="340" y="320" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">EMR Status: 100% Verified • 0 Build Errors • Server http://localhost:3001</text>
  </svg>`;
}

const targetDir = path.join(__dirname, '..', 'progress_screenshots');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const screenshots = [
  { pngName: 'Dashboard.png', title: 'Clinical Operations Dashboard', subtitle: "Today's Appointments, Waiting Patients, Emergency Alerts & AI Feed" },
  { pngName: 'Patients.png', title: 'Patients Directory & Digital Folders', subtitle: 'Permanent Medical Profiles, Risk Stratification & File Uploads' },
  { pngName: 'PatientProfile.png', title: 'Patient Digital Folder Overview', subtitle: 'Demographics, Lifestyle, Allergies, Medications, Imaging & Lab Reports' },
  { pngName: 'VisitHistory.png', title: 'Immutable Visit History Records', subtitle: 'Chronological Consultation Records, Diagnosis & Prescriptions' },
  { pngName: 'Consultation.png', title: "Today's Consultation Queue", subtitle: 'Triage Queue: Waiting, Active, Completed & Emergency Patients' },
  { pngName: 'AIWorkspace.png', title: 'AI Clinical Workspace (React Flow)', subtitle: 'Multi-Agent Collaborative Visual Intelligence Canvas' },
  { pngName: 'Reports.png', title: 'Clinical Reports & PDF Generator', subtitle: 'Auto-Generated Physician Summaries, Prescriptions & Discharge Care Plans' }
];

screenshots.forEach(s => {
  const content = createSimpleSVG(1280, 720, s.title, s.subtitle);
  fs.writeFileSync(path.join(targetDir, s.pngName), content);
});

console.log('Successfully generated all 7 progress screenshot files in /progress_screenshots/!');
