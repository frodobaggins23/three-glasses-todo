export type ScopeKey = 's' | 'm' | 'l'

export interface ScopeConfig {
  key: ScopeKey
  /** Base dot diameter used for the task-detail scope indicator (rendered at size + 8). */
  size: number
  /** oklch hue in degrees. */
  hue: number
  defCap: number
}

// Display names live in locales/en/translation.json under "scopes" — look them
// up via t(`scopes.${key}`) at render time rather than storing English here,
// so error/label copy stays i18n-able instead of baked into application state.
export const SCOPES: ScopeConfig[] = [
  { key: 's', size: 15, hue: 62, defCap: 12 },
  { key: 'm', size: 22, hue: 22, defCap: 6 },
  { key: 'l', size: 30, hue: 232, defCap: 3 },
]

export const SC: Record<ScopeKey, ScopeConfig> = Object.fromEntries(
  SCOPES.map((s) => [s.key, s]),
) as Record<ScopeKey, ScopeConfig>

/** Settings-screen capacity-row chip dot sizes — distinct from ScopeConfig.size, matches the prototype's hardcoded values. */
export const SETTINGS_CHIP_DOT_SIZE: Record<ScopeKey, number> = { l: 26, m: 20, s: 14 }

/** Sort order for the "Size" recent-list sort: Large first. */
export const SIZE_SORT_ORDER: Record<ScopeKey, number> = { l: 0, m: 1, s: 2 }
