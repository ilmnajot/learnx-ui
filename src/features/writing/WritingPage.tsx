import { useMutation } from '@tanstack/react-query'
import { Check, Copy } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import type { MessageFeedback } from '../../api/types'
import { Button, ErrorNote, Screen } from '../../components/ui'
import { t } from '../../i18n'

export default function WritingPage() {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const improve = useMutation({
    mutationFn: (value: string) => api<MessageFeedback>('/writing/improve', { method: 'POST', body: { text: value } }),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setCopied(false)
    if (text.trim()) improve.mutate(text.trim())
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(true)
  }

  return (
    <Screen backTo="/" title={t.writingTitle}>
      <form className="stack" onSubmit={submit}>
        <p className="muted">{t.writingHint}</p>
        <p className="notice small">{t.writingPrivacy}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.writingPlaceholder}
          aria-label={t.writingTitle}
          rows={6}
          maxLength={2000}
          required
        />
        <ErrorNote error={improve.error} />
        <Button type="submit" variant="primary" disabled={improve.isPending || !text.trim()}>
          {improve.isPending ? t.checking : t.improve}
        </Button>
      </form>

      {improve.data && (
        <section className="stack result">
          <div className="feedback">
            <span className="eyebrow ok">{t.improved}</span>
            <p>{improve.data.improved}</p>
            <Button onClick={() => improve.data && copy(improve.data.improved)}>
              {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copied ? t.copied : t.copy}
            </Button>
          </div>
          {improve.data.tips.length > 0 && (
            <div className="card tip">
              <span className="eyebrow">{t.tip}</span>
              {improve.data.tips.map((tip) => <p key={tip}>{tip}</p>)}
            </div>
          )}
          {improve.data.provider === 'rule_based' && <p className="muted small">{t.basicChecker}</p>}
        </section>
      )}
    </Screen>
  )
}
