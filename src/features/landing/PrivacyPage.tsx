import { Link } from 'react-router'
import { landing as l } from '../../i18n/landing'
import './landing.css'

export default function PrivacyPage() {
  const contact = import.meta.env.VITE_CONTACT_EMAIL as string | undefined

  return (
    <main className="legal">
      <Link to="/" className="brand"><span aria-hidden>&gt;_</span> LearnX</Link>
      <h1>{l.privacyTitle}</h1>
      <p className="muted">{l.privacyIntro}</p>
      {l.privacySections.map((section) => (
        <section key={section.title} className="stack-sm">
          <h2>{section.title}</h2>
          <ul>
            {section.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ))}
      {contact && (
        <p>{l.privacyContact} <a className="link" href={`mailto:${contact}`}>{contact}</a></p>
      )}
      <Link to="/" className="btn btn-secondary">{l.privacyBack}</Link>
    </main>
  )
}
