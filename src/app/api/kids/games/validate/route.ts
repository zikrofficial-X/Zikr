/**
 * Games Validation API
 * Validates both the legacy catalog and the registry used by the live game runtime.
 */
import { NextResponse } from 'next/server';
import { GAMES_REGISTRY, getGamesStatistics } from '@/features/kids/data/games-index';
import { GAME_REGISTRY } from '@/lib/games/registry';

export async function GET() {
  try {
    const runtimeGames = Object.values(GAME_REGISTRY);
    const qualityChecks = {
      hasCatalogGames: GAMES_REGISTRY.length > 0,
      allGamesHaveIcons: GAMES_REGISTRY.every(g => typeof g.icon === 'string' && g.icon.trim().length > 0),
      allGamesHaveDescriptions: GAMES_REGISTRY.every(g => Boolean(g.descriptionAr?.trim() && g.descriptionEn?.trim())),
      allGamesHaveLevels: GAMES_REGISTRY.every(g => Number.isInteger(g.levels) && g.levels > 0),
      allGamesHaveDifficulty: GAMES_REGISTRY.every(g => Boolean(g.difficulty)),
      allGamesEnabled: GAMES_REGISTRY.every(g => g.isEnabled),
      hasRuntimeGames: runtimeGames.length > 0,
      allRuntimeGamesHaveIcons: runtimeGames.every(g => typeof g.icon === 'string' && g.icon.trim().length > 0),
      allRuntimeGamesHaveDescriptions: runtimeGames.every(g => Boolean(g.descriptionAr?.trim() && g.descriptionEn?.trim())),
      allRuntimeGamesHaveAgeGroups: runtimeGames.every(g => Array.isArray(g.supportedAgeGroups) && g.supportedAgeGroups.length > 0),
      allRuntimeGamesHaveDifficulties: runtimeGames.every(g => Array.isArray(g.difficulties) && g.difficulties.length > 0),
      allRuntimeGamesHaveRuntimeKinds: runtimeGames.every(g => typeof g.runtimeKind === 'string' && g.runtimeKind.trim().length > 0),
      allRuntimeGamesHaveValidScoringBounds: runtimeGames.every(g =>
        Number.isFinite(g.maxScore) && g.maxScore > 0 &&
        Number.isFinite(g.maxCollectibles) && g.maxCollectibles >= 0 &&
        Number.isFinite(g.maxDistance) && g.maxDistance >= 0
      ),
    };
    const allQualityChecksPassed = Object.values(qualityChecks).every(Boolean);
    const validation = {
      timestamp: new Date().toISOString(),
      status: allQualityChecksPassed ? 'success' : 'warning',
      gamesRegistry: {
        source: 'legacy-catalog',
        total: GAMES_REGISTRY.length,
        enabled: GAMES_REGISTRY.filter(g => g.isEnabled).length,
        games: GAMES_REGISTRY.map(g => ({
          id: g.id,
          name: g.nameEn,
          enabled: g.isEnabled,
          levels: g.levels,
          ageRange: [g.ageMin, g.ageMax].join('-'),
          category: g.category,
          status: g.isEnabled ? 'enabled' : 'disabled',
        })),
      },
      runtimeRegistry: {
        total: runtimeGames.length,
        games: runtimeGames.map(g => ({
          id: g.id,
          titleAr: g.titleAr,
          titleEn: g.titleEn,
          icon: g.icon,
          runtimeKind: g.runtimeKind,
          supportedAgeGroups: g.supportedAgeGroups,
          difficulties: g.difficulties,
          maxScore: g.maxScore,
        })),
      },
      statistics: getGamesStatistics(),
      qualityChecks,
      overallStatus: allQualityChecksPassed
        ? 'ALL CATALOG AND RUNTIME GAMES VALIDATED AND READY'
        : 'GAMES REQUIRE ATTENTION',
    };

    return NextResponse.json(validation, { status: allQualityChecksPassed ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Validation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
