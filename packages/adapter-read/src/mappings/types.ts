// =============================================================================
// Source mapping interface
// =============================================================================
// Each PMS source type implements this interface. The adapter-read worker
// loads the appropriate mapping based on `adapter_connections.pms_type`.

export interface SourceColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface SourceSchema {
  tableName: string;
  columns: SourceColumn[];
  primaryKeys: string[];        // sorted alphabetically
  // The SELECT statement used to read source rows. MUST exclude forbidden
  // columns (e.g., passwd, secure_key for QloApps). The adapter never reads
  // anything not declared here.
  selectSql: string;
  // The WHERE clause to apply if filteredTables config is used. v1: null.
  whereClause: string | null;
}

export interface SourceRow {
  // Map of column_name → value (raw from source DB).
  // The mapping function transforms this into a Guest-shape object.
  [columnName: string]: unknown;
}

export interface MappedGuest {
  // Snake-case keys matching our guests table columns.
  source_ref: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: Date | null;
  preferences: Record<string, unknown>;
  comm_prefs: {
    email_opt_in: boolean;
    sms_opt_in: boolean;
    push_opt_in: boolean;
    marketing_opt_in: boolean;
  };
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // tenant_id and guest_id are set by the adapter, not the mapping.
}

export interface SourceMapping {
  pmsType: string;
  schema: SourceSchema;
  mapRow(row: SourceRow): MappedGuest;
}

export class MappingNotImplementedError extends Error {
  constructor(pmsType: string) {
    super(
      `Source mapping for PMS type "${pmsType}" is not implemented. ` +
      `v1 ships only "qloapps". Other PMS types are deferred to TASK-002 extensions.`
    );
    this.name = "MappingNotImplementedError";
  }
}
