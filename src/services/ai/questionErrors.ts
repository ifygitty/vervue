export class QuestionSaveError extends Error {
  constructor() {
    super("Could not save the generated question")
    this.name = "QuestionSaveError"
  }
}

function getErrorDetails(error: unknown, depth = 0): {
  name: string
  statusCode?: number
  code?: string
} {
  if (typeof error !== "object" || error == null) {
    return { name: "UnknownError" }
  }

  const details = error as {
    name?: unknown
    statusCode?: unknown
    code?: unknown
    lastError?: unknown
    cause?: unknown
  }
  const nested = details.lastError ?? details.cause
  if (
    depth < 4 &&
    nested != null &&
    nested !== error &&
    typeof details.statusCode !== "number"
  ) {
    const nestedDetails = getErrorDetails(nested, depth + 1)
    if (nestedDetails.statusCode != null || nestedDetails.code != null) {
      return nestedDetails
    }
  }

  return {
    name:
      typeof details.name === "string" && /^[A-Za-z0-9_]{1,80}$/.test(details.name)
        ? details.name
        : "UnknownError",
    statusCode:
      typeof details.statusCode === "number" ? details.statusCode : undefined,
    code:
      typeof details.code === "string" && /^[A-Z0-9]{5}$/.test(details.code)
        ? details.code
        : undefined,
  }
}

export function logQuestionError(stage: string, error: unknown) {
  console.error(`[question generation] ${stage}`, getErrorDetails(error))
}

export function questionStreamError(error: unknown) {
  logQuestionError("stream failed", error)
  if (error instanceof QuestionSaveError) {
    return "The question was generated but could not be saved. Check the server terminal and try again."
  }

  const { statusCode } = getErrorDetails(error)
  if (statusCode === 429) {
    return "The AI service rate limit or quota was reached. Check your Gemini quota and try again later."
  }
  if (statusCode === 401 || statusCode === 403) {
    return "The AI service rejected the request. Check the Gemini API key and its permissions."
  }
  if (statusCode === 404) {
    return "The requested AI model is unavailable. Check the server terminal and Gemini model access."
  }
  if (statusCode != null && statusCode >= 500) {
    return "The AI service is temporarily unavailable. Please try again later."
  }
  return "Question generation failed. Check the server terminal for diagnostic details and try again."
}
