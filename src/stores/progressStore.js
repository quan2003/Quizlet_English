import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useProgressStore = create(
  persist(
    (set, get) => ({
      progress: [],
      getProgress: (userId, cardId) =>
        get().progress.find((item) => item.user_id === userId && item.card_id === cardId) || {
          id: `progress_${cardId}`,
          user_id: userId,
          card_id: cardId,
          mastery_level: 0,
          correct_streak: 0,
          last_reviewed_at: null
        },
      updateCardProgress: (userId, cardId, correct) => {
        const existing = get().getProgress(userId, cardId);
        const nextStreak = correct ? existing.correct_streak + 1 : 0;
        const nextProgress = {
          ...existing,
          correct_streak: nextStreak,
          mastery_level: nextStreak >= 2 ? 2 : nextStreak === 1 ? 1 : 0,
          last_reviewed_at: new Date().toISOString()
        };
        set((state) => ({
          progress: [
            ...state.progress.filter((item) => !(item.user_id === userId && item.card_id === cardId)),
            nextProgress
          ]
        }));
      },
      deleteProgressForCards: (cardIds) => {
        const ids = new Set(cardIds);
        set((state) => ({ progress: state.progress.filter((item) => !ids.has(item.card_id)) }));
      },
      statsForCards: (userId, cards) => {
        const progress = get().progress;
        const mastered = cards.filter((card) => progress.find((item) => item.user_id === userId && item.card_id === card.id)?.mastery_level === 2).length;
        const learning = cards.filter((card) => progress.find((item) => item.user_id === userId && item.card_id === card.id)?.mastery_level === 1).length;
        return {
          total: cards.length,
          mastered,
          learning,
          percent: cards.length ? Math.round((mastered / cards.length) * 100) : 0
        };
      },
      resetProgress: () => set({ progress: [] })
    }),
    {
      name: "ielts-vocab-progress",
      version: 2,
      migrate: (persistedState) => {
        const mockPrefixes = ["set_ielts_writing_", "set_environment_"];
        return {
          ...persistedState,
          progress: (persistedState?.progress || []).filter((item) => !mockPrefixes.some((prefix) => item.card_id?.startsWith(prefix)))
        };
      }
    }
  )
);
