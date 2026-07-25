import { initDb } from './database';
import { PatientRepository } from './repositories/patient.repository';
import { VisitRepository } from './repositories/visit.repository';
import { TranscriptRepository } from './repositories/transcript.repository';
import { ClinicalRecordsRepository } from './repositories/clinical-records.repository';
import { ReportRepository } from './repositories/report.repository';
import { AuditRepository } from './repositories/audit.repository';

console.log('🌱 Executing optional developer test data seeder...');

initDb();

try {
  // 1. Seed Doctor User Audit Log
  const doctorId = 'doc-1';

  // 2. Seed Eleanor Vance (Test Case 1)
  const patient1Id = '1234';
  PatientRepository.create({
    id: patient1Id,
    mrn: 'EHR-1234',
    firstName: 'Eleanor',
    lastName: 'Vance',
    dob: '1956-03-14',
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '+1 (555) 234-5678',
    email: 'eleanor.vance@example.com',
    address: '742 Evergreen Terrace, Springfield',
    emergencyContact: 'Thomas Vance (Son): +1 (555) 876-5432',
    insurance: 'Medicare Choice Health (Policy: MC-9872104-X)',
    primaryDoctor: 'Dr. Marcus Vance, MD'
  });

  // Allergies
  ClinicalRecordsRepository.addAllergy({
    id: 'alg-1',
    patientId: patient1Id,
    allergen: 'Penicillin',
    reaction: 'Anaphylaxis, severe hives, bronchospasm',
    severity: 'ANAPHYLAXIS'
  });

  // Medical History
  ClinicalRecordsRepository.addMedicalHistory({
    id: 'med-hist-1',
    patientId: patient1Id,
    condition: 'Type 2 Diabetes Mellitus',
    diagnosedDate: '2015-05-10',
    resolved: 0,
    notes: 'Managed with Metformin'
  });

  ClinicalRecordsRepository.addMedicalHistory({
    id: 'med-hist-2',
    patientId: patient1Id,
    condition: 'Essential Hypertension',
    diagnosedDate: '2018-09-12',
    resolved: 0,
    notes: 'Managed with Lisinopril'
  });

  // Current Medications
  ClinicalRecordsRepository.addCurrentMedication({
    id: 'curr-med-1',
    patientId: patient1Id,
    medicationName: 'Metformin',
    dosage: '500mg',
    frequency: 'BID',
    prescribedBy: 'Dr. Marcus Vance'
  });

  ClinicalRecordsRepository.addCurrentMedication({
    id: 'curr-med-2',
    patientId: patient1Id,
    medicationName: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Daily',
    prescribedBy: 'Dr. Marcus Vance'
  });

  // Vitals
  ClinicalRecordsRepository.addVitals({
    id: 'vit-1',
    patientId: patient1Id,
    bpSystolic: 138,
    bpDiastolic: 84,
    heartRate: 88,
    respRate: 22,
    temperature: 101.2,
    spO2: 94
  });

  // Visit
  const visitId = 'v-101';
  VisitRepository.create({
    id: visitId,
    patientId: patient1Id,
    doctorId: doctorId,
    visitStatus: 'COMPLETED',
    chiefComplaint: 'Acute chest pain x2 days, productive cough, fever in 70yo diabetic female.',
    startedAt: '2026-07-25T10:15:00Z',
    symptoms: JSON.stringify(['Chest Pain', 'Productive Cough', 'Fever']),
    diagnosis: JSON.stringify(['High-risk Community-Acquired Pneumonia (CAP)']),
    medicationsOrdered: JSON.stringify(['Levofloxacin 750mg QD x7d', 'Acetaminophen 500mg q6h PRN']),
    testsOrdered: JSON.stringify(['Stat PA/Lateral Chest Radiograph', 'Blood Cultures x2', 'Serum Lactate']),
    researchFindings: JSON.stringify(['JAMA 2026 CAP Guidelines', 'NEJM 2025 Non-Penicillin Respiratory Antibiotic Selection']),
    aiSummary: 'CRITICAL ALLERGY ALERT: Documented severe Penicillin allergy. Beta-lactam antibiotics strictly contraindicated. Respiratory fluoroquinolone Levofloxacin initiated.',
    clinicalNotes: 'Patient Eleanor Vance presented with acute respiratory distress. Penicillin allergy cross-referenced; Levofloxacin recommended per JAMA 2026 guidelines.',
    followUpPlan: 'Re-evaluate chest X-ray in 48 hours. Monitor oxygen saturation twice daily.'
  });

  // Transcripts
  TranscriptRepository.addTurn({
    id: 'tr-1',
    visitId: visitId,
    speaker: 'Doctor',
    text: 'Hello Eleanor, what symptoms are you experiencing today?',
    confidence: 0.98,
    isFinal: 1
  });

  TranscriptRepository.addTurn({
    id: 'tr-2',
    visitId: visitId,
    speaker: 'Patient',
    text: 'I have severe chest pain for two days, a bad cough, and fever.',
    confidence: 0.96,
    isFinal: 1
  });

  // Reports
  ReportRepository.create({
    id: 'rep-1',
    visitId: visitId,
    patientId: patient1Id,
    reportType: 'CLINICAL_SUMMARY',
    title: 'Clinical Summary Briefing - Community Acquired Pneumonia',
    content: 'Patient Eleanor Vance (70y) presents with acute chest pain and productive cough. Cross-referenced EHR history confirming severe Penicillin allergy. Levofloxacin 750mg QD initiated per JAMA 2026 guidelines.',
    status: 'FINALIZED'
  });

  // Audit log
  AuditRepository.log('SEED_TEST_DATA', 'Patient', patient1Id, { note: 'Optional developer seed data loaded' });

  console.log('✅ Optional developer test data successfully seeded!');
} catch (err) {
  console.error('❌ Seeder error:', err);
}
