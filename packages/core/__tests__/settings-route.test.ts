import { describe, expect, it } from "vitest";
import { sanitizeSettingsUpdate } from "@/app/api/settings/route";

describe("sanitizeSettingsUpdate", () => {
  it("keeps every recognised field", () => {
    const out = sanitizeSettingsUpdate({
      emailNotifications: false,
      autoSync: false,
      multiFactorAuth: true,
      guestProfileMatching: false,
      dataRetentionDays: 1095,
      defaultLanguage: "en-GB",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      matchingSensitivity: "strict",
      syncFrequencyMinutes: 60,
    });
    expect(out).toEqual({
      emailNotifications: false,
      autoSync: false,
      multiFactorAuth: true,
      guestProfileMatching: false,
      dataRetentionDays: 1095,
      defaultLanguage: "en-GB",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      matchingSensitivity: "strict",
      syncFrequencyMinutes: 60,
    });
  });

  it("drops unknown keys", () => {
    const out = sanitizeSettingsUpdate({ emailNotifications: true, isAdmin: true, evil: "x" });
    expect(out).toEqual({ emailNotifications: true });
  });

  it("drops values outside the allowed sets", () => {
    const out = sanitizeSettingsUpdate({
      defaultLanguage: "fr-FR",
      timezone: "Mars/Olympus",
      dateFormat: "YYYY",
      matchingSensitivity: "wild",
      syncFrequencyMinutes: 7,
      dataRetentionDays: 12,
    });
    expect(out).toEqual({});
  });

  it("drops wrong types", () => {
    const out = sanitizeSettingsUpdate({ emailNotifications: "yes", syncFrequencyMinutes: "60" });
    expect(out).toEqual({});
  });

  it("returns an empty object for non-object bodies", () => {
    expect(sanitizeSettingsUpdate(null)).toEqual({});
    expect(sanitizeSettingsUpdate("nope")).toEqual({});
    expect(sanitizeSettingsUpdate([1, 2])).toEqual({});
  });
});
