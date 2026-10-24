/**
 * TejasAI - PostgreSQL Database Service (Neon)
 *
 * - Creates a connection pool from DATABASE_URL env var.
 * - Auto-creates the `prompts` table on startup if it doesn't exist.
 * - Exports `logPrompt()` for fire-and-forget prompt logging.
 *   Logging failures are swallowed so they never break user requests.
 */

import pg from 'pg';
const { Pool } = pg;

let pool = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString || connectionString === 'your_database_url_here') {
      return null;
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Required for Neon / hosted Postgres
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err.message);
    });
  }
  return pool;
}

/**
 * Ensures the `prompts` table exists. Called once at server startup.
 * Safe to call multiple times — uses CREATE TABLE IF NOT EXISTS.
 */
export async function initDB() {
  const db = getPool();
  if (!db) {
    console.warn('[DB] DATABASE_URL not set — prompt logging disabled.');
    return;
  }

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id            BIGSERIAL PRIMARY KEY,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        original      TEXT        NOT NULL,
        enhanced      TEXT        NOT NULL,
        target_ai     TEXT,
        tweak         TEXT,
        why_better    JSONB,
        engine_used   TEXT,
        request_ip    TEXT
      );

      CREATE INDEX IF NOT EXISTS prompts_created_at_idx ON prompts (created_at DESC);
    `);
    console.info('[DB] ✅ Prompts table ready (Neon PostgreSQL).');
  } catch (err) {
    console.error('[DB] Table init failed:', err.message);
  }
}

/**
 * Fire-and-forget prompt log. Never throws — logging must not break requests.
 *
 * @param {Object} data
 * @param {string} data.original    - The raw user prompt.
 * @param {string} data.enhanced    - The AI-enhanced prompt returned to the user.
 * @param {string} [data.targetAI]  - Target AI platform (chatgpt, gemini, etc.)
 * @param {string} [data.tweak]     - Tweak type (shorter | simpler | moreDetail | null)
 * @param {string[]} [data.whyBetter] - Array of improvement bullets.
 * @param {string} [data.engineUsed]  - 'groq' or 'gemini' (which backend served the request).
 * @param {string} [data.requestIp]   - Anonymized requester IP for analytics.
 */
export async function logPrompt({
  original,
  enhanced,
  targetAI = null,
  tweak = null,
  whyBetter = [],
  engineUsed = null,
  requestIp = null,
}) {
  const db = getPool();
  if (!db) return; // Logging disabled — no DATABASE_URL

  try {
    await db.query(
      `INSERT INTO prompts
         (original, enhanced, target_ai, tweak, why_better, engine_used, request_ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        original,
        enhanced,
        targetAI || null,
        tweak || null,
        JSON.stringify(whyBetter || []),
        engineUsed || null,
        requestIp || null,
      ]
    );
  } catch (err) {
    // Never propagate — DB logging is best-effort
    console.error('[DB] logPrompt failed:', err.message);
  }
}
