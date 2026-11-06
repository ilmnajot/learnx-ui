import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Mic, Square } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../../api/client'
import type { MessageFeedback, VideoCompletion, VideoDetail } from '../../api/types'
import { Confetti } from '../../components/Confetti'
import { Button, ErrorNote, ListenButton, QueryView, Screen, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'
import { useSpeechRecognition } from '../lesson/useSpeechRecognition'
import { VideoPlayer } from './VideoPlayer'
import { CATEGORY_STYLE } from './VideosPage'

function Retell({ prompt }: { prompt: string }) {
  const [text, setText] = useState('')
  const speech = useSpeechRecognition(setText)
  const improve = useMutation({
    mutationFn: (value: string) => api<MessageFeedback>('/writing/improve', { method: 'POST', body: { text: value } }),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (speech.listening) speech.stop()
    const value = text.trim()
    if (value && !improve.isPending) improve.mutate(value)
  }

  return (
    <form className="card stack-sm" onSubmit={submit}>
      <span className="eyebrow">{t.videoRetell}</span>
      <p className="prompt-sm">{prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.typePlaceholder}
        aria-label={t.videoRetell}
        maxLength={500}
        rows={3}
        disabled={improve.isPending}
      />
      {speech.error === 'denied' && <p className="error">{t.micDenied}</p>}
      {speech.error === 'failed' && <p className="error">{t.micError}</p>}
      <ErrorNote error={improve.error} />
      <div className="row gap">
        {speech.supported && (
          <Button
            className={speech.listening ? 'recording grow' : 'grow'}
            aria-pressed={speech.listening}
            onClick={speech.listening ? speech.stop : speech.start}
            disabled={improve.isPending}
          >
            {speech.listening
              ? <><Square size={16} aria-hidden /> {t.stopSpeaking}</>
              : <><Mic size={16} aria-hidden /> {t.speak}</>}
          </Button>
        )}
        <Button type="submit" variant="primary" className="grow" disabled={improve.isPending || !text.trim()}>
          {improve.isPending ? t.checking : t.check}
        </Button>
      </div>
      {improve.data && (
        <>
          <div className="feedback">
            <span className="eyebrow ok">{t.sayLikeThis}</span>
            <div className="row between">
              <p>{improve.data.improved}</p>
              <ListenButton text={improve.data.improved} />
            </div>
          </div>
          {improve.data.tips.map((tip) => <p key={tip} className="small tip-line">{tip}</p>)}
          {improve.data.provider === 'rule_based' && <p className="muted small">{t.basicChecker}</p>}
        </>
      )}
    </form>
  )
}

export default function VideoPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const query = useApiQuery<VideoDetail>(['video', id], `/videos/${id}`)
  const complete = useMutation({
    mutationFn: () => api<VideoCompletion>(`/videos/${id}/complete`, { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'video' }),
  })

  return (
    <Screen backTo="/videos">
      <QueryView query={query}>
        {({ video, phrases }) => {
          const { icon: Icon, color, label } = CATEGORY_STYLE[video.category]
          return (
            <div className="stack">
              <VideoPlayer youtubeId={video.youtubeId} title={video.title} />
              <div className="stack-sm">
                <span className={`tag ${color}`}><Icon size={13} aria-hidden /> {label}</span>
                <h1>{video.title}</h1>
                <p className="muted small">{video.channel}</p>
                <p>{video.whyWatch}</p>
                <p className="muted small">{t.videoCaptionsHint}</p>
              </div>

              <section className="stack-sm">
                <h2>{t.videoPhrases}</h2>
                {phrases.map((phrase) => (
                  <article key={phrase.id} className="card stack-xs">
                    <div className="row between">
                      <strong className="phrase">{phrase.english}</strong>
                      <ListenButton text={phrase.example} />
                    </div>
                    <span className="muted small">{phrase.translation}</span>
                    <span className="example">{phrase.example}</span>
                  </article>
                ))}
              </section>

              <Retell prompt={video.speakPrompt} />

              <ErrorNote error={complete.error} />
              {complete.isSuccess ? (
                <div className="center stack-sm">
                  <Confetti />
                  <CheckCircle2 size={48} className="ok self-center pop" aria-hidden />
                  <p className="muted">{t.phrasesScheduled}</p>
                  <Link className="btn btn-secondary" to="/videos">{t.videoMore}</Link>
                </div>
              ) : (
                <Button variant="primary" disabled={complete.isPending} onClick={() => complete.mutate()}>
                  {video.completedAt ? t.videoAgain : t.videoFinish}
                </Button>
              )}
            </div>
          )
        }}
      </QueryView>
    </Screen>
  )
}
