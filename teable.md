# Teable Integration Guide

## ⚠️ Critical Rules

1. **Server Actions Only**: Wrap all Teable calls in `"use server"` functions
2. **SQL for Queries**: Use `sqlQuery()` with `dbTableName` and `dbFieldName` from schema
3. **Field IDs for Writes**: Use `fldXXX` IDs when creating/updating records
4. **Double Quotes**: All SQL identifiers must use double quotes: `"schema"."table"`

## Quick Start

\`\`\`typescript
// Server Action
"use server";
import { sqlQuery, createRecord, signAttachments, safeParseJson } from '@/lib/teable';

// Query (use dbTableName/dbFieldName from schema)
export async function getUsers() {
  const { rows } = await sqlQuery('bseXXX', 
    `SELECT "__id", "fld_name", "fld_status" FROM "bseXXX"."tbl_users" WHERE "fld_status" = 'Active' LIMIT 100`
  );
  return rows;
}

// Aggregation
export async function getStats() {
  const { rows } = await sqlQuery('bseXXX',
    `SELECT COUNT(*) as "total", SUM(CAST("fld_amount" AS numeric)) as "sum" FROM "bseXXX"."tbl_orders"`
  );
  return rows[0];
}

// Create (use field IDs)
export async function addUser(name: string) {
  return createRecord('tblXXX', { fldName: name, fldStatus: 'Active' });
}
\`\`\`

## SQL Reference

| Rule | Example |
|------|---------|
| Table name | `"bseXXX"."tbl_users"` (from `dbTableName`) |
| Field name | `"fld_name"` (from `dbFieldName`) |
| Record ID | `"__id"` |
| String value | `'Active'` (single quotes) |
| Always add | `LIMIT 100` for non-aggregate queries |

### Field Type → SQL

| Type | SQL Usage |
|------|-----------|
| text | `"fld_name" = 'value'` |
| number | `CAST("fld_amount" AS numeric)` for SUM/AVG |
| checkbox | `"fld_done" = true` |
| singleSelect | `"fld_status" = 'Active'` |
| multipleSelect | `"fld_tags" @> '["tag1"]'` |
| date | `"fld_date" > '2024-01-01'` |
| attachment | Parse JSON, use `signAttachments()` |

### Link Field (Important!)

Single-value links have **two columns**: JSON (`dbFieldName`) and FK (`options.foreignKeyName`).

| Type | JSON Column | FK Column |
|------|-------------|-----------|
| Single (ManyOne/OneOne) | `{"id":"recXXX","title":"..."}` | `"__fk_fldXXX"` = `recXXX` |
| Multi (OneMany/ManyMany) | `[{"id":".."},{}]` | N/A (use JSON) |

**⚠️ For single-value links, prefer FK column (more reliable):**

\`\`\`sql
-- ✅ BEST: Use FK column for JOIN (find foreignKeyName in schema options)
SELECT t.*, p."fld_name" as "project_name"
FROM "bseXXX"."tbl_tasks" t
LEFT JOIN "bseXXX"."tbl_projects" p ON p."__id" = t."__fk_fldProject";

-- Group by linked record using FK
SELECT t."__fk_fldProject", p."fld_name", COUNT(*) as "count"
FROM "bseXXX"."tbl_tasks" t
LEFT JOIN "bseXXX"."tbl_projects" p ON p."__id" = t."__fk_fldProject"
GROUP BY 1, 2;

-- ⚠️ JSON extraction (may be null/malformed)
SELECT "fld_project"::jsonb->>'id' as "project_id" FROM "bseXXX"."tbl_tasks";
\`\`\`

**Multi-value links (use JSON):**
\`\`\`sql
SELECT * FROM "bseXXX"."tbl_projects" WHERE "fld_tasks"::jsonb @> '[{"id":"recXXX"}]';
SELECT "fld_name", jsonb_array_length("fld_tasks"::jsonb) as "count" FROM "bseXXX"."tbl_projects";
\`\`\`

### User Field

User fields: `{ id, title, email? }`. Check `isMultipleCellValue` for single vs multi.

\`\`\`sql
-- Single user
SELECT "fld_assignee"::jsonb->>'id' as "user_id", "fld_assignee"::jsonb->>'title' as "user_name"
FROM "bseXXX"."tbl_tasks";

-- Multi user: check contains
SELECT * FROM "bseXXX"."tbl_tasks" WHERE "fld_members"::jsonb @> '[{"id":"usrXXX"}]';
\`\`\`

## Attachments

Batch ALL attachments in ONE request:

\`\`\`typescript
const { rows } = await sqlQuery(baseId, `SELECT "__id", "fld_files" FROM "bseXXX"."tbl_docs" LIMIT 50`);

// Collect all attachments (use safeParseJson from above)
const all = rows.flatMap(row => {
  const files = safeParseJson(row.fld_files) || [];
  return files.map((f: any) => ({ ...f, rowId: row.__id }));
});

// Sign once
const signed = await signAttachments(baseId, all);
\`\`\`

## Write Operations

Use field IDs (`fldXXX`), not `dbFieldName`:

\`\`\`typescript
await createRecord('tblXXX', { fldName: 'Task', fldStatus: 'Pending' });
await updateRecord('tblXXX', 'recXXX', { fldStatus: 'Done' });
await deleteRecord('tblXXX', 'recXXX');
\`\`\`

| Type | Format |
|------|--------|
| Text | `"value"` |
| Number | `123.45` |
| Checkbox | `true` / `false` |
| Date | `"2024-01-15T00:00:00.000Z"` |
| Select | `"Option"` or `["A", "B"]` |
| User/Link | `["usrXXX"]` / `["recXXX"]` |

## ⚠️ Common Mistakes

### 1. Wrong field name
\`\`\`sql
-- ❌ SELECT "Access Key" FROM ...     (uses 'name' with spaces)
-- ✅ SELECT "Access_Key" FROM ...     (uses 'dbFieldName')
\`\`\`

### 2. Missing quotes
\`\`\`sql
-- ❌ SELECT fld_name FROM bseXXX.users
-- ✅ SELECT "fld_name" FROM "bseXXX"."users"
\`\`\`

### 3. Reserved words (must quote)
`"Group"`, `"Order"`, `"User"`, `"Date"`, `"Name"`, `"Status"`, `"Type"`, `"Key"`

### 4. Alias without quotes
\`\`\`sql
-- ❌ SELECT "Group" as group FROM ...
-- ✅ SELECT "Group" as "group_name" FROM ...
\`\`\`

### 5. Quote rule
- **Double quotes** `"..."` → identifiers (tables, fields, aliases)
- **Single quotes** `'...'` → string values

### 6. JSON field parsing
JSON fields (User, Link, Attachment) may be string OR already-parsed object. Always use safe parse:

\`\`\`typescript
function safeParseJson(value: unknown): any {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
}

// Usage
const user = safeParseJson(row.fld_assignee);
const attachments = safeParseJson(row.fld_files) || [];
\`\`\`

## Schema Files

`schema/table-{id}.json` contains:
- `dbTableName`: Use in SQL (e.g., `"bseXXX"."tbl_xxx"`)
- `fields[].dbFieldName`: Column name for SQL
- `fields[].id`: Field ID for write operations
- `fields[].isMultipleCellValue`: true = multi-value (link/user)
- `fields[].options.foreignKeyName`: FK column for single-value link (e.g., `"__fk_fldXXX"`)

## Runtime

Keep `<ErrorReporter />` in `app/layout.tsx`.

## Teable Resources Context

### Current Teable Base

- Base ID: `bsePH2l9XDPenJU6LVu`
- Use this `baseId` for any API that requires a base identifier

### Teable Resources Schema

All Teable table schemas are stored as JSON files under the `schema/` directory of this project.

Available tables (id → name → schema file):

- `tbl2dKkvEFWwSRBjhQ0` → Receipt database → `schema/table-tbl2dKkvEFWwSRBjhQ0.json` (SQL: `"bsePH2l9XDPenJU6LVu"."Fa_Piao_Guan_Li"`)
