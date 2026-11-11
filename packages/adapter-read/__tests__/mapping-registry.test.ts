// =============================================================================
// Mapping registry tests
// =============================================================================

import { describe, it, expect } from "vitest";
import { getMapping, listSupportedPmsTypes, MappingNotImplementedError } from "../src/mappings/index.js";

describe("Mapping registry", () => {
  it("returns the qloapps mapping for pms_type='qloapps'", () => {
    const m = getMapping("qloapps");
    expect(m.pmsType).toBe("qloapps");
    expect(m.schema.tableName).toBe("ps_customer");
  });

  it("lists 'qloapps' as the only supported PMS type in v1", () => {
    expect(listSupportedPmsTypes()).toEqual(["qloapps"]);
  });

  it("throws MappingNotImplementedError for unknown PMS type", () => {
    expect(() => getMapping("mews")).toThrow(MappingNotImplementedError);
    expect(() => getMapping("cloudbeds")).toThrow(MappingNotImplementedError);
    expect(() => getMapping("apaleo")).toThrow(MappingNotImplementedError);
    expect(() => getMapping("custom")).toThrow(MappingNotImplementedError);
  });

  it("the error message mentions v1 ships only qloapps", () => {
    try {
      getMapping("mews");
    } catch (err) {
      expect((err as Error).message).toMatch(/v1 ships only "qloapps"/);
    }
  });
});
