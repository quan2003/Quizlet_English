import { create } from "zustand";

export const useStudyStore = create((set, get) => ({
  quizSessions: [],
  flashcard: { index: 0, flipped: false, shuffled: false },
  learnSession: null,
  matchSession: null,
  testSession: null,
  setFlashcard: (patch) => set((state) => ({ flashcard: { ...state.flashcard, ...patch } })),
  resetFlashcard: () => set({ flashcard: { index: 0, flipped: false, shuffled: false } }),
  startLearn: (setId, cards, progressGetter) => set({
    learnSession: {
      setId,
      queue: cards.map((card) => ({ card, correctCount: progressGetter(card.id).correct_streak || 0 })),
      current: null,
      correct: 0,
      wrong: 0,
      startedAt: Date.now(),
      completed: false
    }
  }),
  popLearnCard: () => {
    const session = get().learnSession;
    if (!session || session.current) return;
    const [current, ...queue] = session.queue;
    set({ learnSession: { ...session, current: current || null, queue, completed: !current } });
  },
  answerLearn: (correct) => {
    const session = get().learnSession;
    if (!session?.current) return null;
    const current = {
      ...session.current,
      correctCount: correct ? session.current.correctCount + 1 : 0
    };
    const shouldRepeat = !correct || current.correctCount < 2;
    set({
      learnSession: {
        ...session,
        queue: shouldRepeat ? [...session.queue, current] : session.queue,
        current,
        correct: session.correct + (correct ? 1 : 0),
        wrong: session.wrong + (correct ? 0 : 1)
      }
    });
    return current;
  },
  advanceLearn: () => {
    const session = get().learnSession;
    if (!session) return;
    const [current, ...queue] = session.queue;
    set({ learnSession: { ...session, current: current || null, queue, completed: !current } });
  },
  startMatch: (setId, cards) => {
    const pairs = cards.slice().sort(() => Math.random() - 0.5).slice(0, 6);
    const tiles = pairs
      .flatMap((card) => [
        { id: `${card.id}_term`, pair: card.id, text: card.term, matched: false },
        { id: `${card.id}_def`, pair: card.id, text: card.definition, matched: false }
      ])
      .sort(() => Math.random() - 0.5);
    set({ matchSession: { setId, tiles, selected: [], startedAt: Date.now(), completed: false } });
  },
  selectMatchTile: (tileId) => {
    const session = get().matchSession;
    if (!session || session.completed) return null;
    const tile = session.tiles.find((item) => item.id === tileId);
    if (!tile || tile.matched || session.selected.includes(tileId)) return null;

    const selected = [...session.selected, tileId];
    if (selected.length < 2) {
      set({ matchSession: { ...session, selected } });
      return { status: "selected", tile };
    }

    const [a, b] = selected.map((id) => session.tiles.find((item) => item.id === id));
    const isMatch = a.pair === b.pair && a.id !== b.id;
    const tiles = isMatch
      ? session.tiles.map((item) => item.pair === a.pair ? { ...item, matched: true } : item)
      : session.tiles;
    const completed = tiles.every((item) => item.matched);
    set({ matchSession: { ...session, tiles, selected: [], completed } });
    return isMatch
      ? { status: "match", cardId: a.pair, completed }
      : { status: "miss", first: a, second: b };
  },
  addSession: (session) => set((state) => ({ quizSessions: [...state.quizSessions, session] })),
  deleteSessionsForSet: (setId) => set((state) => ({
    quizSessions: state.quizSessions.filter((session) => session.set_id !== setId)
  }))
}));
