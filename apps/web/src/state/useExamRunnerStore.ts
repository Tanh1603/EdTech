import { create } from 'zustand';

interface ExamRunnerState {
  currentAnswers: Record<string, string>;
  activeQuestionIdx: number;
  setAnswer: (questionId: string, answer: string) => void;
  setActiveQuestionIdx: (idx: number) => void;
  clearAnswers: () => void;
}

export const useExamRunnerStore = create<ExamRunnerState>((set) => ({
  currentAnswers: {},
  activeQuestionIdx: 0,
  setAnswer: (questionId, answer) =>
    set((state) => ({
      currentAnswers: {
        ...state.currentAnswers,
        [questionId]: answer,
      },
    })),
  setActiveQuestionIdx: (idx) => set({ activeQuestionIdx: idx }),
  clearAnswers: () => set({ currentAnswers: {}, activeQuestionIdx: 0 }),
}));
