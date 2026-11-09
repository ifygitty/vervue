const assert = require("node:assert/strict")
const fs = require("node:fs")
const test = require("node:test")
const ts = require("typescript")

function loadModule(path, imports) {
  const js = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
    },
  }).outputText
  const exports = {}
  new Function("require", "exports", js)(name => {
    if (name in imports) return imports[name]
    throw new Error(`Unexpected import: ${name}`)
  }, exports)
  return exports
}

test("all AI workflows use the replacement model without prefilled continuation", async () => {
  const model = { name: "test-model" }
  let modelId
  const google = loadModule("src/services/ai/models/google.ts", {
    "@/data/env/server": { env: { GEMINI_API_KEY: "test-key" } },
    "@ai-sdk/google": {
      createGoogleGenerativeAI: () => id => {
        modelId = id
        return model
      },
    },
  })
  assert.equal(modelId, "gemini-3.5-flash-lite")

  const calls = []
  const ai = {
    streamText: options => { calls.push(options); return {} },
    generateText: async options => { calls.push(options); return { text: "feedback" } },
    streamObject: options => { calls.push(options); return {} },
  }
  const questions = loadModule("src/services/ai/questions.ts", {
    ai,
    "./models/google": google,
  })
  const interviews = loadModule("src/services/ai/interviews.ts", {
    ai,
    "./models/google": google,
    "../hume/lib/api": { fetchChatMessages: async () => [] },
  })
  const resumes = loadModule("src/services/ai/resumes/ai.ts", {
    ai,
    "../models/google": google,
    "./schemas": { aiAnalyzeSchema: {} },
  })
  const jobInfo = { title: "Test", description: "Test", experienceLevel: "junior" }
  questions.generateAiQuestion({
    jobInfo, previousQuestions: [], difficulty: "easy", onFinish: async () => {},
  })
  questions.generateAiQuestionFeedback({ question: "Test?", answer: "Test" })
  await interviews.generateAiInterviewFeedback({ humeChatId: "test", jobInfo, userName: "Test" })
  await resumes.analyzeResumeForJob({
    jobInfo,
    resumeFile: { type: "application/pdf", arrayBuffer: async () => new ArrayBuffer(0) },
  })

  assert.equal(calls.length, 4)
  for (const call of calls) {
    assert.equal(call.model, model)
    assert.notEqual(call.experimental_continueSteps, true)
    assert.equal(call.temperature, undefined)
    assert.equal(call.topP, undefined)
    assert.equal(call.topK, undefined)
  }
  assert.equal(calls[0].messages.at(-1).role, "user")
})
