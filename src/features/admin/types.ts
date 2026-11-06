export interface AdminStats {
  totals: {
    users: number
    verified: number
    banned: number
    newThisWeek: number
    activeToday: number
    activeThisWeek: number
    lessonsCompleted: number
    videosCompleted: number
    squads: number
    pendingComments: number
    aiRequestsToday: number
  }
  aiGlobalDailyLimit: number
  levels: { level: string; count: number }[]
  signups: { day: string; count: number }[]
}

export interface AdminUser {
  id: string
  email: string
  displayName: string
  jobRole?: string | null
  level?: string | null
  role: 'USER' | 'ADMIN'
  emailVerifiedAt?: string | null
  bannedAt?: string | null
  createdAt: string
  lessonsCompleted: number
  lastActive?: string | null
}

export interface UserPage {
  users: AdminUser[]
  total: number
  page: number
  size: number
}

export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AdminComment {
  id: string
  email: string
  displayName: string
  body: string
  rating: number
  status: CommentStatus
  updatedAt: string
}

export interface AdminVideo {
  id: string
  title: string
  channel: string
  category: string
  youtubeId: string
  hiddenAt?: string | null
  completions: number
}

export interface SiteSettingsValues {
  donationEnabled: boolean
  donationCard: string
  donationHolder: string
  donationMessage: string
  commentsEnabled: boolean
  statsMinLearners: number
}

export interface AuditEntry {
  id: string
  adminEmail: string
  action: string
  target?: string | null
  createdAt: string
}
