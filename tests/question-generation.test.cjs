const assert = require("node:assert/strict")
const fs = require("node:fs")
const test = require("node:test")
const ts = require("typescript")
const ai = require("ai")
const { MockLanguageModelV1, simulateReadableStream } = require("ai/test")

function loadModule(path, imports) {
  const source = fs.readFileSync(path, "utf8")
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
    },
  }).outputText
  const exports = {}
  const resolve = name => {
    if (name in imports) return imports[name]
    throw new Error(`Unexpected import: ${name}`)
  }
  new Function("require", "exports", js)(resolve, exports)
  return exports
}

function setup(chunks, saveQuestion) {
  const model = new MockLanguageModelV1({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks,
        initialDelayInMs: null,
        chunkDelayInMs: null,
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
    }),
  })
  const errors = loadModule("src/services/ai/questionErrors.ts", {})
  const aiQuestions = loadModule("src/services/ai/questions.ts", {
    ai,
    "./models/google": { geminiFlash: model },
  })
  const route = loadModule("src/app/api/ai/questions/generate-question/route.ts", {
    "@/data/db": {
      query: async sql => ({
        rows: sql.includes('"job_info"')
          ? [{ title: "Test", description: "Test", experienceLevel: "junior" }]
          : [],
      }),
    },
    "@/data/dbTypes": { questionDifficulties: ["easy", "medium", "hard"] },
    "@/features/jobInfos/dbCache": { getJobInfoIdTag: () => "job" },
    "@/features/questions/db": { insertQuestion: saveQuestion },
    "@/features/questions/dbCache": { getQuestionJobInfoTag: () => "questions" },
    "@/features/questions/permissions": { canCreateQuestion: async () => true },
    "@/lib/errorToast": { PLAN_LIMIT_MESSAGE: "PLAN_LIMIT" },
    "@/services/ai/questions": aiQuestions,
    "@/services/ai/questionErrors": errors,
    "@/services/clerk/lib/getCurrentUser": {
      getCurrentUser: async () => ({ userId: "test-user" }),
    },
    ai,
    "next/dist/server/use-cache/cache-tag": { cacheTag: () => {} },
    zod: require("zod"),
  })
  return async () => {
    const response = await route.POST(
      new Request("http://localhost/api/ai/questions/generate-question", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "easy", jobInfoId: "job-id" }),
      })
    )
    return response.text()
  }
}

const finish = {
  type: "finish",
  finishReason: "stop",
  usage: { promptTokens: 1, completionTokens: 1 },
}

test("streams a saved question and its id", async () => {
  let saved = false
  const run = setup(
    [{ type: "text-delta", textDelta: "Test question?" }, finish],
    async question => {
      await new Promise(resolve => setTimeout(resolve, 10))
      assert.equal(question.text, "Test question?")
      saved = true
      return { id: "question-id" }
    }
  )
  const output = await run()
  assert.equal(saved, true)
  const text = output.split("\n")
    .filter(line => line.startsWith("0:"))
    .map(line => JSON.parse(line.slice(2)))
    .join("")
  assert.equal(text, "Test question?")
  assert.match(output, /question-id/)
  assert.doesNotMatch(output, /(?:^|\n)3:/)
})

test("reports provider quota errors without exposing provider details", async () => {
  let saved = false
  const run = setup(
    [{ type: "error", error: { name: "APICallError", statusCode: 429, message: "private details" } }],
    async () => {
      saved = true
      return { id: "unexpected" }
    }
  )
  const output = await run()
  assert.match(output, /rate limit or quota/)
  assert.doesNotMatch(output, /private details/)
  assert.equal(saved, false)
})

test("reports save errors and does not send a question id", async () => {
  const run = setup(
    [{ type: "text-delta", textDelta: "Test question?" }, finish],
    async () => {
      throw Object.assign(new Error("private database details"), { code: "23505" })
    }
  )
  const output = await run()
  assert.match(output, /could not be saved/)
  assert.doesNotMatch(output, /private database details|questionId/)
})

test("does not save an empty model response", async () => {
  let saved = false
  const run = setup([finish], async () => {
    saved = true
    return { id: "unexpected" }
  })
  const output = await run()
  assert.match(output, /Question generation failed/)
  assert.equal(saved, false)
})

test("distinguishes provider access and model errors", () => {
  const { questionStreamError } = loadModule("src/services/ai/questionErrors.ts", {})
  assert.match(questionStreamError({ statusCode: 403 }), /API key/)
  assert.match(questionStreamError({ lastError: { statusCode: 404 } }), /model is unavailable/)
})
