import {
  GAME_REGISTRY,
  type GameDefinition,
  type GameDifficulty,
} from "@/lib/games/registry";

export interface GameMetadata {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  category: "action" | "educational" | "memory" | "puzzle" | "creativity" | "learning";
  ageMin: number;
  ageMax: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  duration: number;
  levels: number;
  isEnabled: boolean;
  hasArabic: boolean;
  hasEnglish: boolean;
  contentRating: "G" | "PG";
  islamicValues: string[];
  skillsDeveloped: string[];
  rewards: {
    perLevel: number;
    perCompletion: number;
    perAchievement: number;
  };
}

const ageRange: Record<GameDefinition["supportedAgeGroups"][number], [number, number]> = {
  "3-5": [3, 5],
  "6-8": [6, 8],
  "9-12": [9, 12],
  "13-15": [13, 15],
};

function getCategory(game: GameDefinition): GameMetadata["category"] {
  if (game.runtimeKind === "memory") return "memory";
  if (game.runtimeKind === "verse") return "puzzle";
  if (game.runtimeKind === "coloring") return "creativity";
  if (["ordering", "quiz"].includes(game.runtimeKind)) return "educational";
  if (game.runtimeKind === "good-deeds") return "learning";
  return "action";
}

function getDifficulty(difficulties: readonly GameDifficulty[]): GameMetadata["difficulty"] {
  if (difficulties.length === 1) {
    return difficulties[0] === "easy" ? "easy" : difficulties[0] === "hard" ? "hard" : "medium";
  }
  return difficulties.includes("hard") ? "mixed" : "medium";
}

function getAgeBounds(game: GameDefinition): [number, number] {
  const ranges = game.supportedAgeGroups.map(group => ageRange[group]);
  return [
    Math.min(...ranges.map(range => range[0])),
    Math.max(...ranges.map(range => range[1])),
  ];
}

export const GAMES_REGISTRY: GameMetadata[] = Object.values(GAME_REGISTRY).map(game => {
  const [ageMin, ageMax] = getAgeBounds(game);

  return {
    id: game.id,
    nameAr: game.titleAr,
    nameEn: game.titleEn,
    descriptionAr: game.descriptionAr,
    descriptionEn: game.descriptionEn,
    icon: game.icon,
    category: getCategory(game),
    ageMin,
    ageMax,
    difficulty: getDifficulty(game.difficulties),
    duration: game.durationMinutes,
    levels: game.difficulties.length,
    isEnabled: true,
    hasArabic: true,
    hasEnglish: true,
    contentRating: "G",
    islamicValues: [game.category],
    skillsDeveloped: [game.skillAr],
    rewards: {
      perLevel: 0,
      perCompletion: 100,
      perAchievement: 0,
    },
  };
});

export function getGameById(gameId: string): GameMetadata | undefined {
  return GAMES_REGISTRY.find(game => game.id === gameId);
}

export function getEnabledGames(): GameMetadata[] {
  return GAMES_REGISTRY.filter(game => game.isEnabled);
}

export function getGamesByCategory(
  category: GameMetadata["category"],
): GameMetadata[] {
  return GAMES_REGISTRY.filter(game => game.category === category);
}

export function getGamesByAgeGroup(minAge: number, maxAge: number): GameMetadata[] {
  return GAMES_REGISTRY.filter(
    game => game.ageMin <= maxAge && game.ageMax >= minAge,
  );
}

export function getGamesStatistics() {
  const registry = GAMES_REGISTRY;
  const enabledCount = registry.filter(game => game.isEnabled).length;
  const totalLevels = registry.reduce((sum, game) => sum + game.levels, 0);
  const categories = new Set(registry.map(game => game.category)).size;
  const ageRange = {
    min: Math.min(...registry.map(game => game.ageMin)),
    max: Math.max(...registry.map(game => game.ageMax)),
  };

  return {
    totalGames: registry.length,
    enabledGames: enabledCount,
    totalLevels,
    totalRewards: registry.length * 100,
    uniqueCategories: categories,
    ageRange,
    arabicSupported: registry.filter(game => game.hasArabic).length,
    englishSupported: registry.filter(game => game.hasEnglish).length,
  };
}

export function validateGameId(gameId: string): boolean {
  return gameId in GAME_REGISTRY;
}

export function getGamesByLanguage(language: "ar" | "en"): GameMetadata[] {
  return GAMES_REGISTRY.filter(game =>
    language === "ar" ? game.hasArabic : game.hasEnglish,
  );
}
