const assert = require("node:assert/strict")
const fs = require("node:fs")
const test = require("node:test")
const ts = require("typescript")

function loadDatabase(env) {
  const source = fs.readFileSync("src/data/db.ts", "utf8")
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  let attachedPool
  class Pool {
    constructor(config) {
      this.config = config
    }
  }
  const imports = {
    "@/data/env/server": { env },
    "@vercel/functions": { attachDatabasePool: pool => (attachedPool = pool) },
    pg: { Pool },
  }
  const exports = {}
  const isolatedGlobal = {}
  const resolve = name => {
    if (name in imports) return imports[name]
    throw new Error(`Unexpected import: ${name}`)
  }
  new Function("require", "exports", "globalThis", "process", js)(
    resolve,
    exports,
    isolatedGlobal,
    { env: { NODE_ENV: "production" } }
  )
  return { db: exports.db, attachedPool }
}

test("uses DATABASE_URL in preference to local PostgreSQL settings", () => {
  const { db, attachedPool } = loadDatabase({
    DATABASE_URL: "postgresql://example/database",
    DB_HOST: "localhost",
  })
  assert.deepEqual(db.config, { connectionString: "postgresql://example/database" })
  assert.equal(attachedPool, db)
})

test("preserves individual PostgreSQL settings when no URL is set", () => {
  const env = {
    DB_HOST: "localhost",
    DB_PORT: 5432,
    DB_USER: "user",
    DB_PASSWORD: "password",
    DB_NAME: "database",
  }
  const { db } = loadDatabase(env)
  assert.deepEqual(db.config, {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  })
})

test("rejects incomplete database configuration", () => {
  assert.throws(() => loadDatabase({ DB_HOST: "localhost" }), /Set DATABASE_URL/)
})
