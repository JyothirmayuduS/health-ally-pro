#!/usr/bin/env node
import pg from "pg";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "wsnpwyqypgclsclktoyf";
const REGION = process.env.SUPABASE_REGION || "ap-south-1";
const password = process.env.SUPABASE_DB_PASSWORD;

const SCHEMA_Q = `SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'hospital_desk_records'
ORDER BY ordinal_position;`;

const POLICY_Q = `SELECT polname, cmd, qual::text AS qual, with_check::text AS with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'hospital_desk_records';`;

const GRANTS_Q = `SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='hospital_desk_records'
ORDER BY grantee, privilege_type;`;

async function main() {
  if (!password) {
    console.error("ERROR: SUPABASE_DB_PASSWORD not set");
    process.exit(2);
  }
  const encoded = encodeURIComponent(password);
  const url = `postgresql://postgres.${PROJECT_REF}:${encoded}@aws-0-${REGION}.pooler.supabase.com:6543/postgres`;
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  for (const [label, q] of [
    ["SCHEMA", SCHEMA_Q],
    ["POLICIES", POLICY_Q],
    ["GRANTS", GRANTS_Q],
  ]) {
    console.log(`\n-- ${label}`);
    console.log(q);
    const res = await client.query(q);
    console.log(JSON.stringify(res.rows, null, 2));
  }
  await client.end();
}

main().catch((e) => {
  console.error("SQL ERROR:", e.message);
  process.exit(1);
});
