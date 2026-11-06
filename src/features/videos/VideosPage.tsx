import { CheckCircle2, Clock, Laugh, Mic, Play, Rocket, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { Video, VideoCategory } from '../../api/types'
import { QueryView, Screen, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'

export const CATEGORY_STYLE: Record<VideoCategory, { icon: LucideIcon; color: string; label: string }> = {
  COMEDY: { icon: Laugh, color: 'amber', label: t.videoComedy },
  INSPIRATION: { icon: Rocket, color: 'violet', label: t.videoInspiration },
  SPEAKING: { icon: Mic, color: 'blue', label: t.videoSpeaking },
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

export function thumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg`
}

function VideoCard({ video }: { video: Video }) {
  const { icon: Icon, color, label } = CATEGORY_STYLE[video.category]
  return (
    <Link to={`/videos/${video.id}`} className="video-card link-card">
      <span className="video-thumb">
        <img src={thumbnailUrl(video.youtubeId)} alt="" loading="lazy" referrerPolicy="no-referrer" />
        <span className="video-play"><Play size={22} aria-hidden /></span>
        <span className="video-time"><Clock size={12} aria-hidden /> {formatDuration(video.durationSeconds)}</span>
        {video.completedAt && <span className="video-done"><CheckCircle2 size={14} aria-hidden /> {t.videoWatched}</span>}
      </span>
      <span className="video-body">
        <span className={`tag ${color}`}><Icon size={13} aria-hidden /> {label}</span>
        <strong>{video.title}</strong>
        <span className="muted small">{video.channel}</span>
      </span>
    </Link>
  )
}

export default function VideosPage() {
  const query = useApiQuery<Video[]>(['videos'], '/videos')
  const [filter, setFilter] = useState<VideoCategory | 'ALL'>('ALL')

  const filters: { id: VideoCategory | 'ALL'; label: string }[] = [
    { id: 'ALL', label: t.videoAll },
    ...(Object.keys(CATEGORY_STYLE) as VideoCategory[]).map((id) => ({ id, label: CATEGORY_STYLE[id].label })),
  ]

  return (
    <Screen title={t.videosTitle}>
      <QueryView query={query}>
        {(videos) => (
          <div className="stack">
            <p className="muted">{t.videosHint}</p>
            <div className="filters" role="group" aria-label={t.videosTitle}>
              {filters.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={filter === id ? 'filter active' : 'filter'}
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="video-grid">
              {videos
                .filter((v) => filter === 'ALL' || v.category === filter)
                .map((video) => <VideoCard key={video.id} video={video} />)}
            </div>
          </div>
        )}
      </QueryView>
    </Screen>
  )
}
