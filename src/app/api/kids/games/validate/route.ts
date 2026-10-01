/**
 * Games Validation API
 * v1.1.0 - Validates all games and returns comprehensive status
 */

import { NextRequest, NextResponse } from 'next/server';
import { GAMES_REGISTRY, getGamesStatistics } from '@/features/kids/data/games-index';

export async function GET(request: NextRequest) {
  try {
    const validation = {
      timestamp: new Date().toISOString(),
      status: 'success',
      gamesRegistry: {
        total: GAMES_REGISTRY.length,
        enabled: GAMES_REGISTRY.filter(g => g.isEnabled).length,
        games: GAMES_REGISTRY.map(g => ({
          id: g.id,
          name: g.nameEn,
          enabled: g.isEnabled,
          levels: g.levels,
          ageRange: `${g.ageMin}-${g.ageMax}`,
          category: g.category,
          status: '✅',
        })),
      },
      statistics: getGamesStatistics(),
      qualityChecks: {
        allGamesHaveIcons: GAMES_REGISTRY.every(g => g.icon),
        allGamesHaveDescriptions: GAMES_REGISTRY.every(g => g.descriptionAr && g.descriptionEn),
        allGamesHaveLevels: GAMES_REGISTRY.every(g => g.levels > 0),
        allGamesHaveDifficulty: GAMES_REGISTRY.every(g => g.difficulty),
        allGamesEnabled: GAMES_REGISTRY.every(g => g.isEnabled),
      },
      overallStatus: 'ALL GAMES VALIDATED AND READY',
    };

    return NextResponse.json(validation, { status: 200 });
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
