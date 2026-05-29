import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cards as seedCards, sets as seedSets } from "../data/seed";

export const useSetsStore = create(
  persist(
    (set, get) => ({
      sets: seedSets,
      cards: seedCards,
      getSetBySlug: (slug) => get().sets.find((item) => item.share_slug === slug),
      getCardsBySetId: (setId) => get().cards.filter((item) => item.set_id === setId).sort((a, b) => a.position - b.position),
      createSet: ({ title, description, share_slug, is_public, rows, owner_id }) => {
        const setId = `set_${Date.now()}`;
        const now = new Date().toISOString();
        const newSet = {
          id: setId,
          owner_id,
          title,
          description,
          is_public,
          share_slug,
          created_at: now,
          updated_at: now
        };
        const newCards = rows.map((row, index) => ({
          id: `${setId}_${index + 1}`,
          set_id: setId,
          term: row.term,
          definition: row.definition,
          phonetic: row.phonetic,
          example_sentence: row.example_sentence,
          audio_url: "",
          position: index + 1
        }));
        set((state) => ({ sets: [...state.sets, newSet], cards: [...state.cards, ...newCards] }));
        return newSet;
      },
      deleteSet: (setId) => {
        set((state) => ({
          sets: state.sets.filter((item) => item.id !== setId),
          cards: state.cards.filter((item) => item.set_id !== setId)
        }));
      },
      clearSets: () => set({ sets: seedSets, cards: seedCards })
    }),
    {
      name: "ielts-vocab-sets",
      version: 3,
      migrate: (persistedState) => {
        const mockSetIds = new Set(["set_ielts_writing", "set_environment"]);
        return {
          ...persistedState,
          sets: (persistedState?.sets || [])
            .filter((item) => !mockSetIds.has(item.id))
            .map((item) => ({
              ...item,
              title: cleanImportedTitle(item.title),
              description: cleanImportedDescription(item.description)
            })),
          cards: (persistedState?.cards || []).filter((item) => !mockSetIds.has(item.set_id))
        };
      }
    }
  )
);

function cleanImportedTitle(title) {
  return String(title || "Quizlet Import")
    .replace(/^q\s+/i, "")
    .replace(/\s+h\S*c\s+tr\S*c\s+tuy\S*n.*$/i, "")
    .replace(/\s+\d+\.\s.*$/i, "")
    .trim() || "Quizlet Import";
}

function cleanImportedDescription(description) {
  const value = String(description || "");
  if (/^Imported from .+\.(pdf|csv|tsv|txt)$/i.test(value)) {
    return "Bộ thẻ ôn tập";
  }
  return value;
}
