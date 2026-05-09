import { create } from 'zustand';

interface StudyStore {
  activeDocumentName: string | null;
  activeDocumentText: string | null;
  setActiveDocument: (name: string, text: string) => void;
  clearActiveDocument: () => void;
}

export const useStudyStore = create<StudyStore>((set) => ({
  activeDocumentName: null,
  activeDocumentText: null,
  setActiveDocument: (name, text) => set({ activeDocumentName: name, activeDocumentText: text }),
  clearActiveDocument: () => set({ activeDocumentName: null, activeDocumentText: null }),
}));
