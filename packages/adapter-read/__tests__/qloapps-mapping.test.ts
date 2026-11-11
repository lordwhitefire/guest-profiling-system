// =============================================================================
// QloApps mapping tests
// =============================================================================
// Verifies every Card 4 edge case from Behavioral Specification Section 6.6.

import { describe, it, expect } from "vitest";
import { qloappsMapping, ALLOWED_COLUMNS, FORBIDDEN_COLUMNS } from "../src/mappings/qloapps.js";

describe("QloApps source mapping (Card 4)", () => {
  describe("column mapping", () => {
    it("maps id_customer (int) to source_ref (string)", () => {
      const result = qloappsMapping.mapRow({ id_customer: 42 });
      expect(result.source_ref).toBe("42");
    });

    it("maps firstname to first_name", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1, firstname: "John" });
      expect(result.first_name).toBe("John");
    });

    it("maps lastname to last_name", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1, lastname: "Doe" });
      expect(result.last_name).toBe("Doe");
    });

    it("truncates firstname > 32 chars to 32 chars", () => {
      const long = "A".repeat(50);
      const result = qloappsMapping.mapRow({ id_customer: 1, firstname: long });
      expect(result.first_name?.length).toBe(32);
      expect(result.first_name).toBe("A".repeat(32));
    });

    it("truncates lastname > 32 chars to 32 chars", () => {
      const long = "B".repeat(50);
      const result = qloappsMapping.mapRow({ id_customer: 1, lastname: long });
      expect(result.last_name?.length).toBe(32);
    });

    it("lowercases and trims email", () => {
      const result = qloappsMapping.mapRow({
        id_customer: 1,
        firstname: "X",
        lastname: "Y",
        email: "  John@Example.COM  ",
      });
      expect(result.email).toBe("john@example.com");
    });

    it("returns null email for null input", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1, email: null });
      expect(result.email).toBeNull();
    });

    it("returns null email for empty string input", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1, email: "  " });
      expect(result.email).toBeNull();
    });
  });

  describe("phone normalization", () => {
    it("strips non-digits from phone", () => {
      const result = qloappsMapping.mapRow({
        id_customer: 1,
        phone: "+234 800 123 4567",
      });
      expect(result.phone).toBe("2348001234567");
    });

    it("strips dashes from phone", () => {
      const result = qloappsMapping.mapRow({
        id_customer: 1,
        phone: "+1-555-123-4567",
      });
      expect(result.phone).toBe("15551234567");
    });

    it("handles phone with no country code (no transformation)", () => {
      const result = qloappsMapping.mapRow({
        id_customer: 1,
        phone: "08001234567",
      });
      expect(result.phone).toBe("08001234567");
    });

    it("returns null phone for null input", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1, phone: null });
      expect(result.phone).toBeNull();
    });

    it("returns null phone for empty input", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1, phone: "" });
      expect(result.phone).toBeNull();
    });
  });

  describe("birthday parsing", () => {
    it("parses valid ISO date", () => {
      const result = qloappsMapping.mapRow({
        id_customer: 1,
        birthday: "1990-05-15",
      });
      expect(result.date_of_birth).toBeInstanceOf(Date);
      expect(result.date_of_birth?.toISOString().slice(0, 10)).toBe("1990-05-15");
    });

    it("treats 0000-00-00 as null (legacy MySQL zero date)", () => {
      const result = qloappsMapping.mapRow({
        id_customer: 1,
        birthday: "0000-00-00",
      });
      expect(result.date_of_birth).toBeNull();
    });

    it("treats null birthday as null", () => {
      const result = qloappsMapping.mapRow({
        id_customer: 1,
        birthday: null,
      });
      expect(result.date_of_birth).toBeNull();
    });

    it("treats empty string birthday as null", () => {
      const result = qloappsMapping.mapRow({
        id_customer: 1,
        birthday: "",
      });
      expect(result.date_of_birth).toBeNull();
    });
  });

  describe("consent / comm_prefs", () => {
    it("maps newsletter=1 to email_opt_in=true", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1, newsletter: 1 });
      expect(result.comm_prefs.email_opt_in).toBe(true);
    });

    it("maps newsletter=0 to email_opt_in=false", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1, newsletter: 0 });
      expect(result.comm_prefs.email_opt_in).toBe(false);
    });

    it("maps optin=1 to marketing_opt_in=true", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1, optin: 1 });
      expect(result.comm_prefs.marketing_opt_in).toBe(true);
    });

    it("maps optin=0 to marketing_opt_in=false", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1, optin: 0 });
      expect(result.comm_prefs.marketing_opt_in).toBe(false);
    });

    it("sms_opt_in is always false (QloApps has no SMS opt-in)", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1 });
      expect(result.comm_prefs.sms_opt_in).toBe(false);
    });

    it("push_opt_in is always false (QloApps has no push opt-in)", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1 });
      expect(result.comm_prefs.push_opt_in).toBe(false);
    });
  });

  describe("soft-delete mirroring", () => {
    it("maps deleted=1 to deleted_at=NOW()", () => {
      const before = Date.now();
      const result = qloappsMapping.mapRow({ id_customer: 1, deleted: 1 });
      const after = Date.now();
      expect(result.deleted_at).toBeInstanceOf(Date);
      const ts = result.deleted_at?.getTime() ?? 0;
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });

    it("maps deleted=0 to deleted_at=null", () => {
      const result = qloappsMapping.mapRow({ id_customer: 1, deleted: 0 });
      expect(result.deleted_at).toBeNull();
    });
  });

  describe("datetime parsing", () => {
    it("parses date_add into ISO Date", () => {
      const result = qloappsMapping.mapRow({
        id_customer: 1,
        date_add: "2026-01-15 10:30:00",
      });
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it("parses date_upd into ISO Date", () => {
      const result = qloappsMapping.mapRow({
        id_customer: 1,
        date_upd: "2026-02-20 14:45:00",
      });
      expect(result.updated_at).toBeInstanceOf(Date);
    });
  });

  describe("schema / security boundaries", () => {
    it("explicitly allows the 11 documented columns", () => {
      expect(ALLOWED_COLUMNS).toEqual([
        "id_customer", "firstname", "lastname", "email",
        "phone", "birthday", "newsletter", "optin",
        "deleted", "date_add", "date_upd",
      ]);
    });

    it("explicitly forbids passwd (security column)", () => {
      expect(FORBIDDEN_COLUMNS).toContain("passwd");
    });

    it("explicitly forbids secure_key (security column)", () => {
      expect(FORBIDDEN_COLUMNS).toContain("secure_key");
    });

    it("explicitly forbids ip_registration_newsletter (privacy column)", () => {
      expect(FORBIDDEN_COLUMNS).toContain("ip_registration_newsletter");
    });

    it("explicitly forbids last_passwd_gen (security column)", () => {
      expect(FORBIDDEN_COLUMNS).toContain("last_passwd_gen");
    });

    it("the SELECT SQL includes only allowed columns", () => {
      const selectSql = qloappsMapping.schema.selectSql;
      for (const allowed of ALLOWED_COLUMNS) {
        expect(selectSql).toContain(allowed);
      }
      for (const forbidden of FORBIDDEN_COLUMNS) {
        expect(selectSql).not.toContain(forbidden);
      }
    });

    it("the SELECT SQL does not include is_guest (we don't store it)", () => {
      expect(qloappsMapping.schema.selectSql).not.toContain("is_guest");
    });

    it("primary key is id_customer", () => {
      expect(qloappsMapping.schema.primaryKeys).toEqual(["id_customer"]);
    });

    it("table name is ps_customer", () => {
      expect(qloappsMapping.schema.tableName).toBe("ps_customer");
    });
  });

  describe("full row mapping (integration)", () => {
    it("maps a complete QloApps customer row correctly", () => {
      const sourceRow = {
        id_customer: 123,
        firstname: "Jane",
        lastname: "Smith",
        email: "  Jane.Smith@Hotel.COM  ",
        phone: "+234 802 345 6789",
        birthday: "1985-08-20",
        newsletter: 1,
        optin: 0,
        deleted: 0,
        date_add: "2026-03-10 09:15:00",
        date_upd: "2026-03-10 09:15:00",
      };
      const result = qloappsMapping.mapRow(sourceRow);
      expect(result.source_ref).toBe("123");
      expect(result.first_name).toBe("Jane");
      expect(result.last_name).toBe("Smith");
      expect(result.email).toBe("jane.smith@hotel.com");
      expect(result.phone).toBe("2348023456789");
      expect(result.date_of_birth?.toISOString().slice(0, 10)).toBe("1985-08-20");
      expect(result.comm_prefs.email_opt_in).toBe(true);
      expect(result.comm_prefs.marketing_opt_in).toBe(false);
      expect(result.deleted_at).toBeNull();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });
  });
});
