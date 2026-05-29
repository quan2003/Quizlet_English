export function makeOptions(correctCard, cards) {
  const wrong = cards
    .filter((card) => card.id !== correctCard.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((card) => card.definition);
  return [...wrong, correctCard.definition].sort(() => Math.random() - 0.5);
}

export function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function parseCards(text) {
  const normalizedText = normalizeQuizletText(text);

  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const hasNumberedQuizletRows = lines.some((line) => /^\d+\.\s*(.+?)\s*(?:\([^)]+\))?\s*:/.test(line));
  const parseableLines = hasNumberedQuizletRows ? lines.filter((line) => /^\d+\.\s*/.test(line)) : lines;

  return parseableLines
    .flatMap((line) => splitQuizletLine(line))
    .filter(Boolean);
}

function splitQuizletLine(line) {
  if (/^q$/i.test(line) || /^học trực tuyến/i.test(line) || /^https?:\/\//i.test(line) || /^unit\s+\w+\s+-/i.test(line)) {
    return [];
  }

  const numbered = line.match(/^\d+\.\s*(.+?)\s*(?:\(([^)]+)\))?\s*:\s*(.+)$/);
  if (numbered) {
    const [, term, partOfSpeech = "", definition] = numbered;
    return [{
      term: term.trim(),
      definition: definition.trim(),
      phonetic: partOfSpeech.trim() ? `(${partOfSpeech.trim()})` : "",
      example_sentence: ""
    }];
  }

  const normalized = line.replace(/\s{3,}/g, "\t");
  const delimiter = normalized.includes("\t") ? "\t" : normalized.includes(";") ? ";" : ",";
  const parts = normalized.split(delimiter).map((item) => item.trim()).filter(Boolean);

  if (parts.length >= 2) {
    const [term, definition, phonetic = "", example_sentence = ""] = parts;
    return [{ term, definition, phonetic, example_sentence }];
  }

  const dashMatch = line.match(/^(.+?)\s[-–—]\s(.+)$/);
  if (dashMatch) {
    return [{ term: dashMatch[1].trim(), definition: dashMatch[2].trim(), phonetic: "", example_sentence: "" }];
  }

  return [];
}

export function inferSetTitle(text, fallback = "Quizlet Import") {
  const lines = normalizeQuizletText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const ignored = [/^q$/i, /^học trực tuyến/i, /^https?:\/\//i, /^quizlet/i];
  const titleLine = lines.find((line) => {
    if (/^\d+\.\s*/.test(line)) return false;
    return !ignored.some((pattern) => pattern.test(line));
  });

  if (!titleLine) return fallback;

  return titleLine
    .replace(/^q\s+/i, "")
    .replace(/\s+h\S*c\s+tr\S*c\s+tuy\S*n.*$/i, "")
    .replace(/\s+\d+\.\s.*$/i, "")
    .trim() || fallback;
}

function normalizeQuizletText(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\s+(?=\d+\.\s*[^\n]+?\s*(?:\([^)]+\))?\s*:)/g, "\n")
    .replace(/(\d+)\s*\.\s*/g, "\n$1. ")
    .replace(/\n{2,}/g, "\n");
}

export async function extractPdfText(file) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(textItemsToLines(content.items));
  }

  return pages.join("\n");
}

function textItemsToLines(items) {
  const rows = [];
  const tolerance = 3;

  items
    .filter((item) => item.str?.trim())
    .forEach((item) => {
      const x = item.transform?.[4] || 0;
      const y = item.transform?.[5] || 0;
      let row = rows.find((candidate) => Math.abs(candidate.y - y) <= tolerance);
      if (!row) {
        row = { y, items: [] };
        rows.push(row);
      }
      row.items.push({ x, text: item.str.trim() });
    });

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) => row.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(" "))
    .join("\n");
}

export function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

export function sessionRecord({ userId, setId, mode, score, total, startedAt }) {
  return {
    id: `session_${Date.now()}`,
    user_id: userId,
    set_id: setId,
    mode,
    score,
    total,
    duration_seconds: Math.max(1, Math.floor((Date.now() - startedAt) / 1000)),
    completed_at: new Date().toLocaleString("vi-VN")
  };
}
