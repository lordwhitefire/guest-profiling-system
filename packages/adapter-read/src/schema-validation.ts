// =============================================================================
// Schema validation — Card 1 §3.3 contract
// =============================================================================
// Per Card 1's validateTable:
//   1. Extract source table schema (CREATE TABLE statement + indices + PK)
//   2. Compare to expected shape (from the SourceMapping's schema)
//   3. On mismatch: abort unless resyncOnSchemaChange is set
//
// v1 simplification: we only check column existence and PK existence.
// Type comparison (VARCHAR → TEXT changes, etc.) is TODO.

import type { Db } from "@gps/shared";
import type { SourceSchema } from "./mappings/types.js";

export interface ValidationResult {
  valid: boolean;
  resync?: boolean;
  reason?: string;
  // Detailed findings for the admin UI / log output.
  missingColumns?: string[];
  extraColumns?: string[];
  primaryKeys?: string[];
}

export class SchemaValidator {
  constructor(private source: Db, private expected: SourceSchema) {}

  /**
   * Validate the source table against the expected schema.
   *
   * Per Card 1: returns {valid: true} if everything matches;
   * {valid: false, reason: ...} if mismatch;
   * {valid: false, resync: true, reason: ...} if mismatch and resyncOnSchemaChange is set.
   */
  async validate(resyncOnSchemaChange: boolean): Promise<ValidationResult> {
    const actualCols = await this.getSourceColumns();
    const actualPks = await this.getSourcePrimaryKeys();

    const missingColumns: string[] = [];
    const extraColumns: string[] = [];

    const expectedColNames = new Set(this.expected.columns.map((c) => c.name));
    const actualColNames = new Set(actualCols.map((c) => c.name));

    for (const expected of expectedColNames) {
      if (!actualColNames.has(expected)) {
        missingColumns.push(expected);
      }
    }
    for (const actual of actualColNames) {
      if (!expectedColNames.has(actual)) {
        extraColumns.push(actual);
      }
    }

    // PK check — source must have all expected PKs.
    const actualPkSet = new Set(actualPks);
    const expectedPkSet = new Set(this.expected.primaryKeys);
    const missingPks = this.expected.primaryKeys.filter((pk) => !actualPkSet.has(pk));

    if (missingColumns.length > 0) {
      return {
        valid: false,
        resync: resyncOnSchemaChange,
        reason: `missing columns: ${missingColumns.join(", ")}`,
        missingColumns,
        extraColumns,
        primaryKeys: actualPks,
      };
    }

    if (missingPks.length > 0) {
      return {
        valid: false,
        resync: resyncOnSchemaChange,
        reason: `missing primary keys: ${missingPks.join(", ")}`,
        missingColumns,
        extraColumns,
        primaryKeys: actualPks,
      };
    }

    // Extra columns are tolerated in v1 — they don't break the mapping.
    // The mapping only SELECTs the columns it explicitly lists.
    // TODO: in a future task, warn on extra columns so the operator knows
    // about schema drift even when it doesn't break the sync.

    return {
      valid: true,
      missingColumns: [],
      extraColumns,
      primaryKeys: actualPks,
    };
  }

  /**
   * Get column names from the source table via information_schema.
   */
  private async getSourceColumns(): Promise<{ name: string; type: string; nullable: boolean }[]> {
    const rows = await this.source`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = ${this.expected.tableName}
      ORDER BY ordinal_position
    `;
    return rows.map((r: unknown) => {
      const row = r as { column_name: string; data_type: string; is_nullable: string };
      return {
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
      };
    });
  }

  /**
   * Get primary key column names from the source table.
   */
  private async getSourcePrimaryKeys(): Promise<string[]> {
    const rows = await this.source`
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = ${this.expected.tableName}::regclass AND i.indisprimary
      ORDER BY a.attname
    `;
    return rows.map((r: unknown) => (r as { attname: string }).attname);
  }
}
