import { lazy, Suspense, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router'
import { useAuth } from './auth/AuthContext'
import { AppLayout } from './components/AppLayout'
import { Screen } from './components/ui'
import { AuthPage } from './features/auth/AuthPage'
import { t } from './i18n'

const OnboardingPage = lazy(() => import('./features/onboarding/OnboardingPage'))
const TodayPage = lazy(() => import('./features/today/TodayPage'))
const CoursePage = lazy(() => import('./features/course/CoursePage'))
const LessonPage = lazy(() => import('./features/lesson/LessonPage'))
const ReviewPage = lazy(() => import('./features/review/ReviewPage'))
const GamesPage = lazy(() => import('./features/games/GamesPage'))
const PhraseMatchPage = lazy(() => import('./features/games/PhraseMatchPage'))
const WordOrderPage = lazy(() => import('./features/games/WordOrderPage'))
const VideosPage = lazy(() => import('./features/videos/VideosPage'))
const VideoPage = lazy(() => import('./features/videos/VideoPage'))
const SquadPage = lazy(() => import('./features/squad/SquadPage'))
const WritingPage = lazy(() => import('./features/writing/WritingPage'))
const ProgressPage = lazy(() => import('./features/progress/ProgressPage'))

const Loading = () => <p className="muted center pad">{t.loading}</p>

function Protected({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  if (status === 'loading') return <Loading />
  if (status === 'signedOut') return <Navigate to="/signin" replace />
  if (!user?.onboarded) return <Navigate to="/welcome" replace />
  return children
}

export function App() {
  const { status, user } = useAuth()

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route
          path="/signin"
          element={status === 'signedIn' ? <Navigate to="/" replace /> : status === 'loading' ? <Loading /> : <AuthPage />}
        />
        <Route
          path="/welcome"
          element={
            status === 'loading' ? (
              <Loading />
            ) : status === 'signedOut' ? (
              <Navigate to="/signin" replace />
            ) : user?.onboarded ? (
              <Navigate to="/" replace />
            ) : (
              <OnboardingPage />
            )
          }
        />
        <Route element={<Protected><AppLayout /></Protected>}>
          <Route index element={<TodayPage />} />
          <Route path="course" element={<CoursePage />} />
          <Route path="videos" element={<VideosPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="squad" element={<SquadPage />} />
          <Route path="progress" element={<ProgressPage />} />
        </Route>
        <Route path="lessons/:id" element={<Protected><LessonPage /></Protected>} />
        <Route path="videos/:id" element={<Protected><VideoPage /></Protected>} />
        <Route path="review" element={<Protected><ReviewPage /></Protected>} />
        <Route path="games/match" element={<Protected><PhraseMatchPage /></Protected>} />
        <Route path="games/order" element={<Protected><WordOrderPage /></Protected>} />
        <Route path="writing" element={<Protected><WritingPage /></Protected>} />
        <Route
          path="*"
          element={
            <Screen title={t.notFound}>
              <Link to="/" className="btn btn-secondary">{t.home}</Link>
            </Screen>
          }
        />
      </Routes>
    </Suspense>
  )
}
