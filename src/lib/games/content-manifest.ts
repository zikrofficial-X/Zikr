import { GAME_REGISTRY, type GameId } from "@/lib/games/registry";

export type KidsContentSourceKind =
  | "kids-content-record"
  | "canonical-quran"
  | "local-runtime";

export type KidsContentReviewStatus =
  | "approved-source-linked"
  | "canonical-source"
  | "gameplay-only"
  | "editorial-review-required"
  | "repository-copy-review-complete";

type SourceDeclaration = {
  kind: KidsContentSourceKind;
  references: readonly string[];
  fields: readonly string[];
  reviewStatus: KidsContentReviewStatus;
  /** Increment when this game's educational or player-facing content changes. */
  revision: number;
  reviewNote?: string;
};

export type KidsGameContentManifestEntry = {
  gameId: GameId;
  titleAr: string;
  titleEn: string;
  ageGroups: readonly string[];
  learningObjective: { ar: string; en: string };
  source: {
    kind: KidsContentSourceKind;
    references: readonly string[];
    fields: readonly string[];
  };
  reviewStatus: KidsContentReviewStatus;
  revision: number;
  reviewNote?: string;
};

/**
 * Content provenance for the canonical Kids game registry.
 *
 * "editorial-review-required" is intentionally not treated as approved.
 * Gameplay-only entries do not make religious or factual claims.
 */
const CONTENT_SOURCES: Record<GameId, SourceDeclaration> = {
  "zikr-runner": {
    kind: "kids-content-record",
    references: [
      "game-scenario-smart-choice",
      "quiz-akhlaq-adventure",
      "quiz-akhlaq-daily-life",
    ],
    fields: ["quiz_data.questions"],
    reviewStatus: "approved-source-linked",
    revision: 1,
    reviewNote:
      "Scenario wording and child-safety review recorded in docs/kids-content-editorial-audit-2026-10-21.md; factual correctness remains bounded by the named source records.",
  },
  "zikr-memory": {
    kind: "kids-content-record",
    references: ["game-memory-dhikr-cards"],
    fields: ["memory_pairs.id", "memory_pairs.situation", "memory_pairs.dhikr"],
    reviewStatus: "approved-source-linked",
    revision: 1,
  },
  "wudu-challenge": {
    kind: "kids-content-record",
    references: ["wudu-steps"],
    fields: ["wudu_steps.order", "wudu_steps.text", "wudu_after_dhikr"],
    reviewStatus: "approved-source-linked",
    revision: 1,
  },
  "verse-puzzle": {
    kind: "canonical-quran",
    references: [
      "src/app/api/kids/games/verse/route.ts",
      "src/features/quran/services/quran-server.ts#getAyahFromDb",
    ],
    fields: ["surah", "ayah", "sourceText", "indexed word tokens"],
    reviewStatus: "canonical-source",
    revision: 1,
  },
  "zikr-quiz": {
    kind: "kids-content-record",
    references: [
      "quiz-pillars",
      "quiz-prophets",
      "quiz-wudu",
      "quiz-akhlaq",
      "game-matching-dua-times",
      "game-memory-dhikr-cards",
      "game-scenario-smart-choice",
      "quiz-akhlaq-adventure",
      "quiz-islamic-basics-plus",
      "quiz-akhlaq-daily-life",
    ],
    fields: ["quiz_data.questions.text", "quiz_data.questions.options", "quiz_data.questions.correctAnswer"],
    reviewStatus: "approved-source-linked",
    revision: 1,
  },
  "mosque-adventure": {
    kind: "kids-content-record",
    references: [
      "game-scenario-smart-choice",
      "quiz-akhlaq-adventure",
      "quiz-akhlaq-daily-life",
    ],
    fields: ["quiz_data.questions.text", "quiz_data.questions.options", "quiz_data.questions.correctAnswer"],
    reviewStatus: "approved-source-linked",
    revision: 1,
    reviewNote:
      "Scenario wording and child-safety review recorded in docs/kids-content-editorial-audit-2026-10-21.md; factual correctness remains bounded by the named source records.",
  },
  "zikr-road": {
    kind: "kids-content-record",
    references: [
      "game-scenario-smart-choice",
      "quiz-akhlaq-adventure",
      "quiz-akhlaq-daily-life",
    ],
    fields: ["quiz_data.questions.text", "quiz_data.questions.options", "quiz_data.questions.correctAnswer"],
    reviewStatus: "approved-source-linked",
    revision: 1,
    reviewNote:
      "Scenario wording and child-safety review recorded in docs/kids-content-editorial-audit-2026-10-21.md; factual correctness remains bounded by the named source records.",
  },
  "zikr-jump": {
    kind: "local-runtime",
    references: ["src/lib/games/zikr-jump.ts#getZikrJumpLevels"],
    fields: ["platform layouts", "collectibles", "hazards", "completion rules"],
    reviewStatus: "gameplay-only",
    revision: 1,
  },
  "good-deeds": {
    kind: "local-runtime",
    references: ["src/features/kids/components/games/kids-values-coloring.tsx#DEEDS"],
    fields: ["title", "description", "steps", "feedback"],
    reviewStatus: "repository-copy-review-complete",
    revision: 1,
    reviewNote:
      "Repository-level wording and basic child-safety review recorded in docs/kids-content-editorial-audit-2026-10-21.md; this is not external child-development certification.",
  },
  "hilal-fly": {
    kind: "local-runtime",
    references: ["src/lib/games/hilal-fly.ts#getHilalFlyLevels"],
    fields: ["level themes", "obstacle layouts", "completion rules"],
    reviewStatus: "gameplay-only",
    revision: 1,
  },
  "mosque-cleanup": {
    kind: "local-runtime",
    references: ["src/features/kids/components/games/kids-values-coloring.tsx#CLEANUP_ITEMS", "src/features/kids/components/games/kids-values-coloring.tsx#CLEANUP_ZONES"],
    fields: ["item names", "sorting zones", "match rules"],
    reviewStatus: "repository-copy-review-complete",
    revision: 1,
    reviewNote:
      "Repository-level wording and category review recorded in docs/kids-content-editorial-audit-2026-10-21.md; this is not external educational certification.",
  },
  "zikr-coloring": {
    kind: "local-runtime",
    references: ["src/features/kids/components/games/kids-values-coloring.tsx#COLORING_SHEETS"],
    fields: ["scene titles", "scene descriptions", "paintable regions"],
    reviewStatus: "gameplay-only",
    revision: 1,
  },
  "letter-lab": {
    kind: "local-runtime",
    references: ["src/features/kids/components/games/kids-letter-lab.tsx#LETTERS"],
    fields: ["28 isolated Arabic base letters", "visual matching choices", "visual-only feedback", "localized learning objective"],
    reviewStatus: "repository-copy-review-complete",
    revision: 2,
    reviewNote:
      "Repository copy and the 28-letter isolated-form inventory were reviewed against the conventional introductory inventory described by Open University OpenLearn (https://www.open.edu/openlearn/mod/oucontent/view.php?id=171153&section=3). The game deliberately teaches visual matching only: it has no audio prompt and does not teach pronunciation, letter names, or joined forms. Formal age-specific curriculum/pedagogy sign-off remains pending; see docs/kids-content-editorial-audit-2026-10-21.md.",
  },
};

export function getKidsGameContentManifest(
  gameId: GameId
): KidsGameContentManifestEntry {
  const definition = GAME_REGISTRY[gameId];
  const source = CONTENT_SOURCES[gameId];

  return {
    gameId,
    titleAr: definition.titleAr,
    titleEn: definition.titleEn,
    ageGroups: [...definition.supportedAgeGroups],
    learningObjective: {
      ar: definition.skillAr,
      en: definition.skillEn,
    },
    source: {
      kind: source.kind,
      references: [...source.references],
      fields: [...source.fields],
    },
    reviewStatus: source.reviewStatus,
    revision: source.revision,
    reviewNote: source.reviewNote,
  };
}

export function getAllKidsGameContentManifests(): KidsGameContentManifestEntry[] {
  return (Object.keys(GAME_REGISTRY) as GameId[]).map(
    getKidsGameContentManifest
  );
}
