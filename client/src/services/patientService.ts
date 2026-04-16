import { PatientProfile, Prescription, MedicalDocument, ActivityItem } from '@/types/patient';

const MOCK_PATIENT_PROFILE: PatientProfile = {
  id: 'pat-001',
  userId: 'patient-001',
  firstName: 'Kavindi',
  lastName: 'Perera',
  email: 'kavindi.perera@gmail.com',
  phone: '+94 77 123 4567',
  dateOfBirth: '1995-03-15',
  age: 29,
  gender: 'Female',
  bloodType: 'B+',
  address: '42 Galle Road, Colombo 03, Sri Lanka',
  emergencyContactName: 'Roshan Perera',
  emergencyContactNumber: '+94 71 987 6543',
  allergies: ['Penicillin', 'Dust'],
  chronicConditions: ['Mild Asthma'],
  currentMedications: ['Salbutamol Inhaler'],
  profileImage: null,
  medicalDocuments: [
    {
      id: 'doc-001',
      fileName: 'chest-xray-2024.pdf',
      uploadDate: '2024-11-10',
      fileUrl: '#',
      fileSize: '2.4 MB',
    },
    {
      id: 'doc-002',
      fileName: 'blood-test-results.pdf',
      uploadDate: '2025-01-22',
      fileUrl: '#',
      fileSize: '1.1 MB',
    },
  ],
  isCompleted: true,
};

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-001',
    doctorName: 'Dr. Suresh Fernando',
    doctorSpecialization: 'General Physician',
    date: '2025-03-10',
    medicines: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7 days', instructions: 'Take with food' },
      { name: 'Paracetamol', dosage: '500mg', frequency: 'As needed (max 4 times/day)', duration: '5 days', instructions: 'Do not exceed 2g/day' },
    ],
    notes: 'Patient presented with upper respiratory tract infection. Adequate rest and hydration advised.',
    appointmentId: 'apt-001',
  },
  {
    id: 'rx-002',
    doctorName: 'Dr. Nirmala Jayawardena',
    doctorSpecialization: 'Pulmonologist',
    date: '2025-01-18',
    medicines: [
      { name: 'Salbutamol', dosage: '100mcg', frequency: 'As needed', duration: 'Ongoing', instructions: 'Use inhaler as directed' },
      { name: 'Budesonide', dosage: '200mcg', frequency: 'Twice daily', duration: '30 days', instructions: 'Rinse mouth after use' },
    ],
    notes: 'Asthma management plan updated. Peak flow monitoring recommended.',
    appointmentId: 'apt-002',
  },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: 'act-001', type: 'appointment', title: 'Appointment Confirmed', description: 'With Dr. Suresh Fernando on 20 Apr 2025', timestamp: '2025-04-15T09:30:00Z' },
  { id: 'act-002', type: 'prescription', title: 'New Prescription Added', description: '2 medicines by Dr. Nirmala Jayawardena', timestamp: '2025-04-10T14:00:00Z' },
  { id: 'act-003', type: 'payment', title: 'Payment Successful', description: 'LKR 2,000 for cardiology consultation', timestamp: '2025-04-08T11:15:00Z' },
  { id: 'act-004', type: 'document', title: 'Document Uploaded', description: 'blood-test-results.pdf', timestamp: '2025-04-01T08:00:00Z' },
];

// TODO: Replace with real API endpoint
export async function getPatientProfile(userId: string): Promise<PatientProfile> {
  await new Promise((r) => setTimeout(r, 600));
  void userId;
  return MOCK_PATIENT_PROFILE;
}

// TODO: Replace with real API endpoint
export async function updatePatientProfile(data: Partial<PatientProfile>): Promise<PatientProfile> {
  await new Promise((r) => setTimeout(r, 800));
  return { ...MOCK_PATIENT_PROFILE, ...data };
}

// TODO: Replace with real API endpoint
export async function getPrescriptions(patientId: string): Promise<Prescription[]> {
  await new Promise((r) => setTimeout(r, 500));
  void patientId;
  return MOCK_PRESCRIPTIONS;
}

// TODO: Replace with real API endpoint
export async function getMedicalDocuments(patientId: string): Promise<MedicalDocument[]> {
  await new Promise((r) => setTimeout(r, 400));
  void patientId;
  return MOCK_PATIENT_PROFILE.medicalDocuments;
}

// TODO: Replace with real API endpoint
export async function uploadMedicalDocument(file: File): Promise<MedicalDocument> {
  await new Promise((r) => setTimeout(r, 1200));
  return {
    id: `doc-${Date.now()}`,
    fileName: file.name,
    uploadDate: new Date().toISOString().split('T')[0],
    fileUrl: '#',
    fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
  };
}

// TODO: Replace with real API endpoint
export async function getRecentActivity(patientId: string): Promise<ActivityItem[]> {
  await new Promise((r) => setTimeout(r, 400));
  void patientId;
  return MOCK_ACTIVITY;
}
