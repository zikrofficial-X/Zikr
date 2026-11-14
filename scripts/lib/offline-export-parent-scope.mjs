const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PUBLISHED_PARENT_SCOPES = Object.freeze({
  prophet_sections: { parentDataset: "prophets", foreignKey: "prophet_id" },
  battle_events: { parentDataset: "battles", foreignKey: "battle_id" },
  conquest_events: { parentDataset: "conquests", foreignKey: "conquest_id" },
  companion_stories: { parentDataset: "companions", foreignKey: "companion_id" },
  kids_game_levels: { parentDataset: "kids_games", foreignKey: "game_id" },
});

export function isParentScopedOfflineDataset(dataset) {
  return Object.hasOwn(PUBLISHED_PARENT_SCOPES, dataset);
}

export function getPublishedParentScope(dataset, exported) {
  const scope = PUBLISHED_PARENT_SCOPES[dataset];
  if (!scope) return null;

  const parent = exported.find((item) => item.dataset === scope.parentDataset);
  if (!parent || !Array.isArray(parent.rows)) {
    throw new Error(
      `Offline export cannot scope ${dataset}: validated ${scope.parentDataset} rows are unavailable.`,
    );
  }

  const ids = [...new Set(parent.rows.map((row) => row?.id))];
  if (ids.some((id) => typeof id !== "string" || !UUID_PATTERN.test(id))) {
    throw new Error(
      `Offline export cannot scope ${dataset}: the published parent set contains an invalid id.`,
    );
  }

  if (!ids.length) {
    return { filter: null, hasParents: false, parentDataset: scope.parentDataset };
  }

  return {
    filter: `${scope.foreignKey}=in.(${ids.join(",")})`,
    hasParents: true,
    parentDataset: scope.parentDataset,
  };
}
