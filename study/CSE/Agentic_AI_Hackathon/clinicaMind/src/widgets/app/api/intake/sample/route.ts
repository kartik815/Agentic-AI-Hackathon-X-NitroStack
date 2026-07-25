import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { IntakeOrchestratorService } from '../../../../../services/intake/intake-orchestrator.service';

export async function POST() {
  try {
    const sampleInput = {
      senderEmail: 'reception.central@cityhospital.org',
      subject: 'FWD: Patient Intake Package - Vance, Eleanor (Emergency Referral)',
      attachments: [
        {
          fileName: 'Patient_Registration_Form_Vance.pdf',
          documentType: 'Registration Form',
          textContent: `
PATIENT REGISTRATION & INTAKE FORM
Name: Eleanor Vance
DOB: 1956-03-14 | Age: 70 | Gender: Female
Phone: +1 (555) 234-5678 | Email: eleanor.vance@example.com
Address: 742 Evergreen Terrace, Springfield, IL 62704
Emergency Contact: Thomas Vance (Son), Phone: +1 (555) 876-5432
Blood Group: O+
Insurance: Medicare Choice Health (Policy: MC-9872104-X, Group: GRP-55412)
`
        },
        {
          fileName: 'Insurance_Card_Medicare_Vance.png',
          documentType: 'Insurance',
          textContent: `
MEDICARE CHOICE HEALTH PLAN
Subscriber: Eleanor Vance
Policy ID: MC-9872104-X | Group: GRP-55412
Primary Physician: Dr. Marcus Vance, MD
RxBIN: 004336 | RxPCN: ADV
`
        },
        {
          fileName: 'Clinical_History_Allergies_Report.pdf',
          documentType: 'Medical Reports',
          textContent: `
CONFIDENTIAL CLINICAL BRIEFING
Known Allergies: Penicillin (Anaphylaxis, severe bronchospasm), Sulfa drugs
Medical History: Type 2 Diabetes Mellitus, Essential Hypertension, High-risk Community-Acquired Pneumonia
Current Medication: Metformin 500mg BID, Lisinopril 10mg Daily, Levofloxacin 750mg QD
Surgeries: Appendectomy (2004), Total Knee Replacement (2019)
Family History: Mother: Type 2 Diabetes; Father: Coronary Artery Disease
Vitals: BP Systolic: 138, BP Diastolic: 84, Heart Rate: 88, Resp Rate: 22, Temperature: 101.2, SpO2: 94%
Risk Factors: Penicillin Anaphylaxis Alert, Diabetic Comorbidity, Fever & Hypoxemia
`
        },
        {
          fileName: 'Chest_PA_Lateral_XRay_Impression.pdf',
          documentType: 'Imaging',
          textContent: `
RADIOLOGY REPORT - CHEST PA & LATERAL
Patient: Eleanor Vance | Date: 2026-07-25
Findings: Right lower lobe consolidation with air bronchograms. Mild bilateral pleural effusion. No pneumothorax.
Impression: High-probability Right Lower Lobe Acute Community-Acquired Pneumonia (CAP).
`
        }
      ]
    };

    const result = await IntakeOrchestratorService.processAutonomousIntake(sampleInput);

    return NextResponse.json({
      status: 'success',
      message: 'Sample autonomous patient intake package successfully ingested & extracted!',
      package: result.packageEntity,
      extractedPatient: result.extractedProfile
    });
  } catch (error: any) {
    console.error('Error triggering sample intake:', error);
    return NextResponse.json({ status: 'error', message: error?.message || 'Server error' }, { status: 500 });
  }
}
