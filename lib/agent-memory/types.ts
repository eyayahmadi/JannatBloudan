export type MemoryChunk = {
  id: string
  text: string
  createdAt: string
  /** Tags inferes pour retrieval lexical */
  tokens: string[]
}

export type ClientAgentMemory = {
  clientKey: string
  tasteVector: Record<string, number>
  orderSummaries: string[]
  reactions: { positive: string[]; negative: string[] }
  chunks: MemoryChunk[]
  updatedAt: string
  /** Metriques auto-learning (demo) */
  learningScore: number
}
