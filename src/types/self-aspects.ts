export interface SelfAspect {
  id: string
  title: string
  description: string
  traits: string[]
  status: 'new' | 'accepted' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

export interface SelfAspectResponse {
  cards: SelfAspect[]
}
