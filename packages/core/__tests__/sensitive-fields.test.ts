// =============================================================================
// Sensitive-field stripping tests — Card 2 §4.4
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  stripSensitiveFields,
  stripSensitiveFieldsFromArray,
  SENSITIVE_GUEST_FIELDS,
} from "../src/server/guests/sensitive-fields";

describe("Sensitive-field stripping (Card 2 §4.4)", () => {
  it("declares the 4 sensitive field names", () => {
    expect(SENSITIVE_GUEST_FIELDS).toContain("identity_doc_type");
    expect(SENSITIVE_GUEST_FIELDS).toContain("identity_doc_number");
    expect(SENSITIVE_GUEST_FIELDS).toContain("identity_doc_expiry");
    expect(SENSITIVE_GUEST_FIELDS).toContain("identity_documents");
  });

  it("strips identity_doc_type if present", () => {
    const input = { guest_id: "g1", identity_doc_type: "PASSPORT" };
    const result = stripSensitiveFields(input);
    expect(result).not.toHaveProperty("identity_doc_type");
    expect(result.guest_id).toBe("g1");
  });

  it("strips identity_doc_number if present", () => {
    const input = { guest_id: "g1", identity_doc_number: "P12345" };
    const result = stripSensitiveFields(input);
    expect(result).not.toHaveProperty("identity_doc_number");
  });

  it("strips identity_doc_expiry if present", () => {
    const input = { guest_id: "g1", identity_doc_expiry: "2030-01-01" };
    const result = stripSensitiveFields(input);
    expect(result).not.toHaveProperty("identity_doc_expiry");
  });

  it("strips identity_documents array if present", () => {
    const input = { guest_id: "g1", identity_documents: [{ type: "PASSPORT" }] };
    const result = stripSensitiveFields(input);
    expect(result).not.toHaveProperty("identity_documents");
  });

  it("preserves all non-sensitive fields", () => {
    const input = {
      guest_id: "g1",
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      phone: "+2348001234567",
      identity_doc_type: "PASSPORT",
      identity_doc_number: "P12345",
    };
    const result = stripSensitiveFields(input);
    expect(result.guest_id).toBe("g1");
    expect(result.first_name).toBe("John");
    expect(result.last_name).toBe("Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.phone).toBe("+2348001234567");
  });

  it("does not modify the input (returns a copy)", () => {
    const input = { guest_id: "g1", identity_doc_type: "PASSPORT" };
    const result = stripSensitiveFields(input);
    expect(input).toHaveProperty("identity_doc_type"); // original is unchanged
    expect(result).not.toHaveProperty("identity_doc_type");
  });

  it("handles a guest object with no sensitive fields (no-op)", () => {
    const input = { guest_id: "g1", first_name: "John" };
    const result = stripSensitiveFields(input);
    expect(result).toEqual(input);
  });

  it("stripSensitiveFieldsFromArray works on a list", () => {
    const input = [
      { guest_id: "g1", identity_doc_type: "PASSPORT" },
      { guest_id: "g2", first_name: "Jane" },
    ];
    const result = stripSensitiveFieldsFromArray(input);
    expect(result.length).toBe(2);
    expect(result[0]!).not.toHaveProperty("identity_doc_type");
    expect(result[1]!.first_name).toBe("Jane");
  });
});
