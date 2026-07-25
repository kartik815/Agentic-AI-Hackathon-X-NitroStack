import { Injectable } from '@nitrostack/core';

export interface PatientDocument {
  id: string;
  name: string;
  category: 'Photograph' | 'Govt ID' | 'Insurance Card' | 'Prescription' | 'History PDF' | 'MRI' | 'CT' | 'X-ray' | 'ECG' | 'Ultrasound' | 'Blood Report' | 'Lab Report' | 'Other';
  uploadDate: string;
  fileSize: string;
  url?: string;
  summary?: string;
}

export interface VisitRecord {
  id: string;
  visitDate: string;
  chiefComplaint: string;
  doctor: string;
  symptoms: string[];
  diagnosis: string;
  medications: string[];
  testsRecommended: string[];
  researchCitations: string[];
  aiNotes: string;
  generatedReport: string;
  followUpPlan: string;
  status: 'COMPLETED' | 'ACTIVE' | 'SCHEDULED';
}

export interface PatientProfile {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  lifestyle: {
    smoking: 'Never' | 'Former' | 'Current' | 'Chain Smoker';
    alcohol: 'None' | 'Occasional' | 'Moderate' | 'Heavy';
    exercise: string;
    diet: string;
  };
  familyHistory: string[];
  pastSurgeries: string[];
  conditions: string[];
  allergies: string[];
  medications: string[];
  recentLabs: string[];
  documents: PatientDocument[];
  visitHistory: VisitRecord[];
  riskCategory: 'CRITICAL RISK' | 'HIGH RISK' | 'MODERATE RISK' | 'LOW RISK';
}

@Injectable({ deps: [] })
export class HistoryService {
  private patientStore: Record<string, PatientProfile> = {
    '1234': {
      patientId: '1234',
      name: 'Eleanor Vance',
      age: 70,
      gender: 'Female',
      dateOfBirth: '1956-03-14',
      phone: '+1 (555) 234-5678',
      email: 'eleanor.vance@example.com',
      address: '742 Evergreen Terrace, Springfield',
      emergencyContact: {
        name: 'Thomas Vance (Son)',
        relationship: 'Son',
        phone: '+1 (555) 876-5432'
      },
      insurance: {
        provider: 'Medicare Choice Health',
        policyNumber: 'MC-9872104-X',
        groupNumber: 'GRP-77401'
      },
      lifestyle: {
        smoking: 'Never',
        alcohol: 'Occasional',
        exercise: 'Light walking 20m/day',
        diet: 'Diabetic Low-Sodium'
      },
      familyHistory: ['Maternal Diabetes Type 2', 'Paternal Coronary Artery Disease'],
      pastSurgeries: ['Cholecystectomy (2014)', 'Cataract Surgery Left Eye (2021)'],
      conditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension', 'Mild Osteoarthritis'],
      allergies: ['Penicillin'],
      medications: ['Metformin 500mg BID', 'Lisinopril 10mg Daily'],
      recentLabs: ['HbA1c: 7.8%', 'BP: 138/84 mmHg', 'eGFR: 65 mL/min', 'Serum Creatinine: 1.1 mg/dL'],
      documents: [
        { id: 'doc-1', name: 'Chest_XRay_PA_Lateral.jpg', category: 'X-ray', uploadDate: '2026-07-20', fileSize: '2.4 MB', summary: 'Bilateral lower lobe opacity suggestive of early consolidation.' },
        { id: 'doc-2', name: 'EHR_Discharge_Summary_2024.pdf', category: 'History PDF', uploadDate: '2025-11-12', fileSize: '1.1 MB', summary: 'Prior admission for diabetic hyperglycemia stabilization.' },
        { id: 'doc-3', name: 'Medicare_Insurance_Card.png', category: 'Insurance Card', uploadDate: '2025-01-10', fileSize: '450 KB' },
        { id: 'doc-4', name: 'CBC_Comprehensive_BMP_Jul2026.pdf', category: 'Blood Report', uploadDate: '2026-07-22', fileSize: '880 KB', summary: 'Leukocytosis (WBC 14.2k) with neutrophilia.' }
      ],
      visitHistory: [
        {
          id: 'v-101',
          visitDate: '2026-07-25',
          chiefComplaint: 'Acute chest pain x2 days, productive cough, fever risk in 70yo diabetic female.',
          doctor: 'Dr. Marcus Vance, MD',
          symptoms: ['Chest Pain', 'Productive Cough', 'Fever'],
          diagnosis: 'High-risk Community-Acquired Pneumonia (CAP)',
          medications: ['Levofloxacin 750mg QD x7d', 'Acetaminophen 500mg q6h PRN'],
          testsRecommended: ['Stat PA/Lateral Chest Radiograph', 'Blood Cultures x2', 'Serum Lactate'],
          researchCitations: ['JAMA 2026 CAP Guidelines', 'NEJM 2025 Non-Penicillin Respiratory Antibiotic Selection'],
          aiNotes: 'CRITICAL ALLERGY ALERT: Documented severe Penicillin allergy. Beta-lactam antibiotics strictly contraindicated. Respiratory fluoroquinolone Levofloxacin initiated.',
          generatedReport: 'Clinical Summary Briefing: Patient Eleanor Vance presented with acute respiratory distress. Penicillin allergy cross-referenced; Levofloxacin recommended per JAMA 2026 guidelines.',
          followUpPlan: 'Re-evaluate chest X-ray in 48 hours. Monitor oxygen saturation twice daily.',
          status: 'COMPLETED'
        },
        {
          id: 'v-98',
          visitDate: '2026-04-12',
          chiefComplaint: 'Quarterly Routine Diabetes & Blood Pressure Follow-up',
          doctor: 'Dr. Sarah Jenkins, MD',
          symptoms: ['Mild fatigue'],
          diagnosis: 'Type 2 Diabetes Mellitus (Uncontrolled HbA1c 7.8%), Essential Hypertension (Controlled)',
          medications: ['Metformin 500mg BID', 'Lisinopril 10mg Daily'],
          testsRecommended: ['HbA1c Lab Test', 'Lipid Panel', 'Urinary Albumin-Creatinine Ratio'],
          researchCitations: ['ADA 2026 Standards of Care in Diabetes'],
          aiNotes: 'HbA1c elevated at 7.8%. Diet counseling reinforced; Metformin dosage maintained.',
          generatedReport: 'Routine Follow-up Report: BP well controlled under Lisinopril. Diabetes care plan updated.',
          followUpPlan: 'Follow up in 3 months with repeat HbA1c.',
          status: 'COMPLETED'
        }
      ],
      riskCategory: 'CRITICAL RISK'
    },
    '5678': {
      patientId: '5678',
      name: 'Robert Miller',
      age: 60,
      gender: 'Male',
      dateOfBirth: '1966-08-22',
      phone: '+1 (555) 345-6789',
      email: 'robert.miller@example.com',
      address: '1048 Market St, San Francisco, CA',
      emergencyContact: {
        name: 'Clara Miller (Wife)',
        relationship: 'Spouse',
        phone: '+1 (555) 987-6543'
      },
      insurance: {
        provider: 'Blue Cross Blue Shield Premium',
        policyNumber: 'BCBS-449102-M',
        groupNumber: 'GRP-99120'
      },
      lifestyle: {
        smoking: 'Former',
        alcohol: 'Moderate',
        exercise: 'Golf weekly',
        diet: 'Heart-Healthy'
      },
      familyHistory: ['Paternal Stroke', 'Hypertension'],
      pastSurgeries: ['Right Knee Arthroscopy (2018)'],
      conditions: ['Atrial Fibrillation', 'Deep Vein Thrombosis (DVT)'],
      allergies: ['Sulfa Drugs'],
      medications: ['Warfarin 5mg Daily', 'Metoprolol 25mg BID'],
      recentLabs: ['INR: 2.4', 'BP: 124/80 mmHg', 'Platelet Count: 210k/mcL'],
      documents: [
        { id: 'doc-5', name: 'ECG_12Lead_Afib.pdf', category: 'ECG', uploadDate: '2026-06-15', fileSize: '1.8 MB', summary: 'Atrial fibrillation with controlled ventricular rate (72 bpm).' },
        { id: 'doc-6', name: 'Ultrasound_Doppler_Leg.jpg', category: 'Ultrasound', uploadDate: '2026-05-10', fileSize: '3.1 MB', summary: 'Resolution of acute thrombosis in right femoral vein.' }
      ],
      visitHistory: [
        {
          id: 'v-102',
          visitDate: '2026-07-25',
          chiefComplaint: 'Knee arthritis pain; initiated OTC Ibuprofen while taking Warfarin.',
          doctor: 'Dr. Marcus Vance, MD',
          symptoms: ['Right knee joint stiffness and localized pain'],
          diagnosis: 'Drug-Drug Interaction Hazard (Warfarin + NSAID Ibuprofen)',
          medications: ['Warfarin 5mg Daily', 'Acetaminophen 500mg q6h PRN (Ibuprofen Discontinued)'],
          testsRecommended: ['Stat INR Blood Test', 'Stool Occult Blood Test'],
          researchCitations: ['Lancet Respiratory Medicine 2025 NSAID & Anticoagulant GI Hemorrhage Study'],
          aiNotes: 'HIGH RISK DRUG INTERACTION: Warfarin + Ibuprofen increases upper GI bleeding 3.4-fold. Discontinued NSAID immediately.',
          generatedReport: 'Drug Interaction Warning Report: Ibuprofen cancelled. Patient advised to utilize Acetaminophen.',
          followUpPlan: 'Check STAT INR today and re-evaluate knee pain in 1 week.',
          status: 'COMPLETED'
        }
      ],
      riskCategory: 'HIGH RISK'
    },
    '9012': {
      patientId: '9012',
      name: 'Sarah Jenkins',
      age: 25,
      gender: 'Female',
      dateOfBirth: '2001-11-05',
      phone: '+1 (555) 456-7890',
      email: 'sarah.jenkins@example.com',
      address: '221B Baker St, San Francisco, CA',
      emergencyContact: {
        name: 'David Jenkins (Father)',
        relationship: 'Father',
        phone: '+1 (555) 123-9876'
      },
      insurance: {
        provider: 'Aetna Student & Young Adult Health',
        policyNumber: 'AET-110293-S',
        groupNumber: 'GRP-10022'
      },
      lifestyle: {
        smoking: 'Never',
        alcohol: 'Occasional',
        exercise: 'Running 3x/week',
        diet: 'Balanced Vegan'
      },
      familyHistory: ['None notable'],
      pastSurgeries: ['None'],
      conditions: ['None'],
      allergies: ['None known'],
      medications: ['None'],
      recentLabs: ['Normal baseline CBC & BMP'],
      documents: [
        { id: 'doc-7', name: 'Annual_Wellness_Check_2025.pdf', category: 'History PDF', uploadDate: '2025-09-01', fileSize: '520 KB' }
      ],
      visitHistory: [
        {
          id: 'v-103',
          visitDate: '2026-07-25',
          chiefComplaint: 'Mild runny nose, clear nasal discharge, and slight frontal headache x1 day.',
          doctor: 'Dr. Marcus Vance, MD',
          symptoms: ['Runny Nose', 'Mild Headache'],
          diagnosis: 'Acute Viral Upper Respiratory Tract Infection (Common Cold)',
          medications: ['OTC Acetaminophen 500mg PRN', 'Saline Nasal Spray'],
          testsRecommended: ['None required'],
          researchCitations: ['BMJ Evidence-Based Medicine 2024 Viral URI Care'],
          aiNotes: 'Low risk viral presentation. Antibiotics not indicated.',
          generatedReport: 'Routine Consultation Summary: Supportive care advised.',
          followUpPlan: 'Return if fever spikes above 101°F or symptoms persist >7 days.',
          status: 'COMPLETED'
        }
      ],
      riskCategory: 'LOW RISK'
    }
  };

  getAllPatients(): PatientProfile[] {
    return Object.values(this.patientStore);
  }

  getPatientProfile(patientId: string): PatientProfile {
    return this.patientStore[patientId] || this.patientStore['1234'];
  }

  getPatientHistory(patientId: string) {
    const profile = this.getPatientProfile(patientId);
    return {
      patientId: profile.patientId,
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      conditions: profile.conditions,
      allergies: profile.allergies,
      medications: profile.medications,
      recentLabs: profile.recentLabs
    };
  }

  addVisitRecord(patientId: string, visit: Omit<VisitRecord, 'id'>): VisitRecord {
    const profile = this.getPatientProfile(patientId);
    const newVisit: VisitRecord = {
      ...visit,
      id: `v-${Date.now()}`
    };
    profile.visitHistory.unshift(newVisit);
    return newVisit;
  }

  createPatient(newProfile: Omit<PatientProfile, 'patientId' | 'documents' | 'visitHistory'>): PatientProfile {
    const id = (Math.floor(1000 + Math.random() * 9000)).toString();
    const created: PatientProfile = {
      ...newProfile,
      patientId: id,
      documents: [
        { id: `doc-${Date.now()}`, name: 'Patient_Onboarding_Form.pdf', category: 'History PDF', uploadDate: new Date().toISOString().split('T')[0], fileSize: '350 KB' }
      ],
      visitHistory: []
    };
    this.patientStore[id] = created;
    return created;
  }

  addDocumentToPatient(patientId: string, doc: Omit<PatientDocument, 'id'>): PatientDocument {
    const profile = this.getPatientProfile(patientId);
    const newDoc: PatientDocument = {
      ...doc,
      id: `doc-${Date.now()}`
    };
    profile.documents.unshift(newDoc);
    return newDoc;
  }
}
