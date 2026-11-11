// =============================================================================
// Mapping registry
// =============================================================================
// Loads the appropriate SourceMapping based on `pms_type` from
// adapter_connections. v1 ships only "qloapps"; other types throw.

import type { SourceMapping } from "./types.js";
import { qloappsMapping } from "./qloapps.js";
import { MappingNotImplementedError } from "./types.js";

const REGISTRY: Record<string, SourceMapping> = {
  qloapps: qloappsMapping,
};

export function getMapping(pmsType: string): SourceMapping {
  const mapping = REGISTRY[pmsType];
  if (!mapping) {
    throw new MappingNotImplementedError(pmsType);
  }
  return mapping;
}

export function listSupportedPmsTypes(): string[] {
  return Object.keys(REGISTRY);
}

export type { SourceMapping, SourceSchema, SourceRow, MappedGuest } from "./types.js";
export { MappingNotImplementedError } from "./types.js";
