import { GAME_REGISTRY, type GameId } from "@/lib/games/registry";

export type KidsContentSourceKind =
  | "kids-content-record"
  | "canonical-quran"
  | "local-runtime";

export type KidsContentReviewStatus =
  | "approved-source-linked"
  | "canonical-source"
  | "gameplay-only"
  | "editorial-review-required";

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
    reviewStatus: "editorial-review-required",
    revision: 1,
    reviewNote:
      "Values-based scenarios need a recorded editorial suitability review before this status can be changed.",
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
    reviewStatus: "editorial-review-required",
    revision: 1,
    reviewNote:
      "Child-facing item and zone labels require editorial suitability review.",
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
    fields: ["Arabic letter inventory", "visual matching choices", "feedback"],
    reviewStatus: "editorial-review-required",
    revision: 1,
    reviewNote:
      "The runtime teaches visual letter recognition; it does not provide audio prompts. Review the letter inventory and pedagogy before marking content reviewed.",
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
