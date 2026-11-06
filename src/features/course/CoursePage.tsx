import {
  Briefcase,
  Bug,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Circle,
  GitPullRequest,
  Mail,
  MessagesSquare,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import type { Topic } from '../../api/types'
import { ProgressBar, QueryView, Screen, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'

const TOPIC_STYLE: Record<string, { icon: LucideIcon; color: string }> = {
  'Daily standup': { icon: MessagesSquare, color: 'green' },
  'Code review': { icon: GitPullRequest, color: 'violet' },
  'Bugs and incidents': { icon: Bug, color: 'coral' },
  'Planning and clients': { icon: CalendarRange, color: 'blue' },
  'Written messages': { icon: Mail, color: 'amber' },
  'Career and interviews': { icon: Briefcase, color: 'pink' },
}
const DEFAULT_STYLE = { icon: MessagesSquare, color: 'green' }

export default function CoursePage() {
  const query = useApiQuery<Topic[]>(['topics'], '/topics')

  return (
    <Screen title={t.navCourse}>
      <QueryView query={query}>
        {(topics) => (
          <div className="stack">
            {topics.map((topic) => {
              const { icon: Icon, color } = TOPIC_STYLE[topic.title] ?? DEFAULT_STYLE
              const done = topic.lessons.filter((l) => l.completedAt).length
              return (
                <section key={topic.id} className="card stack-sm">
                  <div className="row gap">
                    <span className={`chip ${color}`}><Icon size={20} aria-hidden /></span>
                    <h2 className="grow">{topic.title}</h2>
                    <span className="muted mono small">{done} / {topic.lessons.length}</span>
                  </div>
                  <ProgressBar percent={(done / Math.max(topic.lessons.length, 1)) * 100} label={topic.title} />
                  <ul className="list">
                    {topic.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link to={`/lessons/${lesson.id}`} className="list-link">
                          {lesson.completedAt
                            ? <CheckCircle2 size={18} className="ok" aria-hidden />
                            : <Circle size={18} className="muted" aria-hidden />}
                          <span className="grow">{lesson.title}</span>
                          <ChevronRight size={16} className="muted arrow" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </QueryView>
    </Screen>
  )
}
