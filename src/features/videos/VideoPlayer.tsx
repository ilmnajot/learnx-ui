import { Play } from 'lucide-react'
import { useState } from 'react'
import { t } from '../../i18n'
import { thumbnailUrl } from './VideosPage'

export function embedUrl(youtubeId: string): string {
  const params = new URLSearchParams({ autoplay: '1', rel: '0', cc_load_policy: '1', cc_lang_pref: 'en' })
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?${params}`
}

/** Loads YouTube only after the learner presses play, so opening the page sends nothing to Google. */
export function VideoPlayer({ youtubeId, title }: { youtubeId: string; title: string }) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <div className="player">
        <iframe
          src={embedUrl(youtubeId)}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }

  return (
    <button type="button" className="player player-cover" aria-label={`${t.videoPlay}: ${title}`} onClick={() => setPlaying(true)}>
      <img src={thumbnailUrl(youtubeId)} alt="" referrerPolicy="no-referrer" />
      <span className="video-play big"><Play size={30} aria-hidden /></span>
    </button>
  )
}
