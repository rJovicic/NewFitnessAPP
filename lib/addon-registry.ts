export interface AddonConfig {
  id: string;
  label: string;
  description: string;
  href: string;
}

// Empty by default — this is the Phase 9 extension point. Approving a new
// small feature (CLAUDE.md §7) means adding one entry here plus its
// nav-config/tile-registry entries; the Settings screen renders straight
// from this array, so no Settings UI change is needed to expose it.
export const addonRegistry: AddonConfig[] = [];
