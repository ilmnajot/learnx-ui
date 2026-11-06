import { CheckCircle2, Circle } from 'lucide-react'
import { Link } from 'react-router'
import type { Topic } from '../../api/types'
import { QueryView, Screen, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'

export default function CoursePage() {
  const query = useApiQuery<Topic[]>(['topics'], '/topics')

  return (
    <Screen title={t.navCourse}>
      <QueryView query={query}>
        {(topics) => (
          <div className="stack">
            {topics.map((topic) => (
              <section key={topic.id} className="card stack-sm">
                <div className="row between">
                  <h2>{topic.title}</h2>
                  <span className="muted mono">
                    {topic.lessons.filter((l) => l.completedAt).length} / {topic.lessons.length}
                  </span>
                </div>
                <ul className="list">
                  {topic.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link to={`/lessons/${lesson.id}`} className="list-link">
                        {lesson.completedAt
                          ? <CheckCircle2 size={18} className="ok" aria-hidden />
                          : <Circle size={18} className="muted" aria-hidden />}
                        <span>{lesson.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </QueryView>
    </Screen>
  )
}
