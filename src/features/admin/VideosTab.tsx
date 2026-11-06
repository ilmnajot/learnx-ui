import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Button, ErrorNote, QueryView, useApiQuery } from '../../components/ui'
import { a } from '../../i18n/admin'
import type { AdminVideo } from './types'

export function VideosTab() {
  const client = useQueryClient()
  const query = useApiQuery<AdminVideo[]>(['admin', 'videos'], '/admin/videos')
  const toggle = useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      api<void>(`/admin/videos/${id}/visibility`, { method: 'POST', body: { hidden } }),
    onSuccess: () => client.invalidateQueries(),
  })

  return (
    <div className="stack">
      <p className="muted small">{a.videosHint}</p>
      <ErrorNote error={toggle.error} />
      <QueryView query={query}>
        {(videos) => (
          <ul className="list ad-list">
            {videos.map((video) => (
              <li key={video.id} className="ad-row wrap">
                <div className="grow">
                  <div className="row gap-sm wrap">
                    <strong>{video.title}</strong>
                    {video.hiddenAt && <span className="tag amber">{a.videoHidden}</span>}
                  </div>
                  <p className="muted small">{video.channel} · {a.completions(video.completions)}</p>
                </div>
                <div className="ad-actions">
                  <Button disabled={toggle.isPending} onClick={() => toggle.mutate({ id: video.id, hidden: !video.hiddenAt })}>
                    {video.hiddenAt ? a.show : a.hide}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </div>
  )
}
