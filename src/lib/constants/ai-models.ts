export const AI_MODELS = {
  // Default models for different use cases
  DEFAULT: {
    SELF_ASPECTS: "gpt-4o-mini",
  }
} as const

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS]

// Model-specific configurations
export const MODEL_CONFIGS = {
  [AI_MODELS.DEFAULT.SELF_ASPECTS]: {
    maxTokens: 2000,
    temperature: 0.7,
  },
} as const 