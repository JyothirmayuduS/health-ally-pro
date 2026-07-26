#!/usr/bin/env node
/** Run exact desk-records SQL against Supabase Postgres. Requires SUPABASE_DB_PASSWORD. */
import pg from "pg";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "wsnpwyqypgclsclktoyf";
const REGION = process.env.SUPABASE_REGION || "ap-south-1";
const password = process.env.SUPABASE_DB_PASSWORD;

const QUERY = `SELECT desk, record_key, updated_at, pg_column_size(payload) AS pg_column_size
FROM hospital_desk_records
WHERE desk IN ('pharmacy','lab','reception')
ORDER BY desk, record_key;`;

async function main() {
  if (!password) {
    console.error("ERROR: SUPABASE_DB_PASSWORD not set");
    process.exit(2);
  }
  const encoded = encodeURIComponent(password);
  const url = `postgresql://postgres.${PROJECT_REF}:${encoded}@aws-0-${REGION}.pooler.supabase.com:6543/postgres`;
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("-- QUERY");
  console.log(QUERY);
  console.log("-- RESULT");
  const res = await client.query(QUERY);
  console.log(
    " desk | record_key | updated_at | pg_column_size\n" +
      "------+------------+------------+---------------",
  );
  for (const r of res.rows) {
    console.log(
      ` ${r.desk} | ${r.record_key} | ${r.updated_at.toISOString()} | ${r.pg_column_size}`,
    );
  }
  if (res.rows.length === 0) console.log("(0 rows)");
  console.log(`(${res.rows.length} row${res.rows.length === 1 ? "" : "s"})`);
  await client.end();
}

main().catch((e) => {
  console.error("SQL ERROR:", e.message);
  process.exit(1);
});
