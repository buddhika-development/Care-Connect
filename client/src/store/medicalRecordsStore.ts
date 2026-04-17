import { create } from 'zustand';

export type MedicalRecordsTab = 'prescriptions' | 'reports';

interface MedicalRecordsUIState {
  activeTab: MedicalRecordsTab;
  previewDocumentUrl: string | null;
  previewDocumentName: string | null;
  setActiveTab: (tab: MedicalRecordsTab) => void;
  openPreview: (url: string, name: string) => void;
  closePreview: () => void;
}

export const useMedicalRecordsStore = create<MedicalRecordsUIState>((set) => ({
  activeTab: 'prescriptions',
  previewDocumentUrl: null,
  previewDocumentName: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  openPreview: (url, name) => set({ previewDocumentUrl: url, previewDocumentName: name }),
  closePreview: () => set({ previewDocumentUrl: null, previewDocumentName: null }),
}));
