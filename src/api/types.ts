export interface User {
  id: string
  email: string
  displayName: string
  jobRole?: string | null
  goal?: string | null
  level?: string | null
  nativeLanguage: string
  timezone: string
  onboarded: boolean
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface LessonSummary {
  id: string
  topicId: string
  title: string
  canDo: string
  estMinutes: number
  completedAt?: string | null
}

export interface Topic {
  id: string
  title: string
  lessons: LessonSummary[]
}

export interface Phrase {
  id: string
  english: string
  translation: string
  example: string
}

export interface LessonDetail {
  lesson: {
    id: string
    title: string
    canDo: string
    scenario: string
    aiPersona: string
    openingLine: string
    estMinutes: number
  }
  phrases: Phrase[]
  completed: boolean
}

export interface Today {
  streak: number
  dueReviews: number
  nextLesson?: LessonSummary | null
  completedLessons: number
  totalLessons: number
  latestCanDo?: string | null
}

export interface Progress {
  streak: number
  totalPracticeDays: number
  completedLessons: number
  totalLessons: number
  canDos: string[]
  recentDays: string[]
}

export interface PlacementQuestion {
  id: string
  prompt: string
  options: string[]
}

export interface PlacementResult {
  level: string
  score: number
  maxScore: number
}

export interface RoleplayStarted {
  sessionId: string
  openingLine: string
  scenario: string
  maxTurns: number
}

export interface RoleplayTurn {
  turnNumber: number
  improved: string
  tips: string[]
  reply: string
  finished: boolean
  provider: string
}

export interface MessageFeedback {
  improved: string
  tips: string[]
  provider: string
}

export interface ReviewCard {
  phraseId: string
  english: string
  translation: string
  example: string
}

export interface ReviewAnswer {
  nextReviewInDays: number
  remainingDue: number
}

export interface GameResult {
  points: number
  gamesScoredToday: number
}

export type GameName = 'PHRASE_MATCH' | 'WORD_ORDER'

export type VideoCategory = 'COMEDY' | 'INSPIRATION' | 'SPEAKING'

export interface Video {
  id: string
  youtubeId: string
  title: string
  channel: string
  category: VideoCategory
  durationSeconds: number
  whyWatch: string
  speakPrompt: string
  completedAt?: string | null
}

export interface VideoDetail {
  video: Video
  phrases: Phrase[]
}

export interface VideoCompletion {
  firstCompletion: boolean
  phrasesScheduled: number
}

export interface SquadMember {
  userId: string
  displayName: string
  weekPoints: number
  practisedToday: boolean
}

export interface Squad {
  id: string
  name: string
  inviteCode: string
  owner: boolean
  streak: number
  practisedToday: number
  requiredToday: number
  streakSafeToday: boolean
  incident: {
    title: string
    points: number
    target: number
    progressPercent: number
    resolved: boolean
  }
  members: SquadMember[]
}
