import {
  ArrowRight,
  AudioLines,
  BatteryLow,
  BookOpenCheck,
  Clapperboard,
  Gamepad2,
  HeartHandshake,
  Mail,
  MessagesSquare,
  Mic,
  PenLine,
  RefreshCw,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ThemeToggle } from '../../components/ThemeToggle'
import { landing as l } from '../../i18n/landing'
import { Hero3D } from './Hero3D'
import './landing.css'

const FEATURE_STYLE: Record<string, { icon: LucideIcon; color: string }> = {
  roleplay: { icon: MessagesSquare, color: 'green' },
  shadow: { icon: AudioLines, color: 'blue' },
  video: { icon: Clapperboard, color: 'amber' },
  squad: { icon: Users, color: 'violet' },
  games: { icon: Gamepad2, color: 'pink' },
  fix: { icon: PenLine, color: 'coral' },
}
const PROBLEM_ICONS: LucideIcon[] = [BookOpenCheck, BatteryLow, HeartHandshake]
const STEP_ICONS: LucideIcon[] = [BookOpenCheck, Mic, RefreshCw]
const CUBE_FACES = ['>_', '{ }', '</>', 'EN', 'git', 'UZ']

/** Fades a section in once it scrolls into view. */
function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const element = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (visible || !element.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.12 })
    observer.observe(element.current)
    return () => observer.disconnect()
  }, [visible])

  return <div ref={element} className={`reveal ${visible ? 'in' : ''} ${className}`}>{children}</div>
}

function Cube({ small = false }: { small?: boolean }) {
  return (
    <div className={small ? 'cube-wrap small' : 'cube-wrap'} aria-hidden>
      <div className="cube">
        {CUBE_FACES.map((face, i) => <span key={face} className={`cube-face f${i}`}>{face}</span>)}
      </div>
    </div>
  )
}

function Demo() {
  const [active, setActive] = useState(0)
  const demo = l.demos[active] ?? l.demos[0]
  if (!demo) return null
  return (
    <div className="demo">
      <div className="filters" role="group" aria-label={l.demoTitle}>
        {l.demos.map((item, i) => (
          <button
            key={item.label}
            type="button"
            className={i === active ? 'filter active' : 'filter'}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div key={demo.label} className="demo-card">
        <span className="eyebrow">{l.demoSaid}</span>
        <p className="demo-said">{demo.said}</p>
        <span className="eyebrow ok">{l.demoBetter}</span>
        <p className="demo-better">{demo.better}</p>
        <span className="eyebrow">{l.demoTip}</span>
        <p className="small">{demo.tip}</p>
      </div>
      <p className="muted small center">{l.demoNote}</p>
    </div>
  )
}

export default function LandingPage() {
  const contact = import.meta.env.VITE_CONTACT_EMAIL as string | undefined

  return (
    <div className="landing">
      <header className="lp-nav">
        <div className="lp-inner lp-nav-row">
          <Link to="/" className="brand"><span aria-hidden>&gt;_</span> LearnX</Link>
          <nav className="row gap-sm">
            <ThemeToggle />
            <Link to="/signin?mode=signin" className="btn btn-ghost lp-login">{l.navLogin}</Link>
            <Link to="/signin" className="btn btn-primary lp-start">{l.navStart}</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-inner lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-tag">{l.heroTag}</span>
              <h1>{l.heroTitle}</h1>
              <p className="lp-lead">{l.heroText}</p>
              <div className="lp-actions">
                <Link to="/signin" className="btn btn-primary lp-cta">{l.heroCta} <ArrowRight size={18} aria-hidden /></Link>
                <a href="#how" className="btn btn-secondary lp-cta">{l.heroSecondary}</a>
              </div>
            </div>
            <Hero3D />
          </div>
        </section>

        <section className="lp-stats" aria-label="LearnX">
          <div className="lp-inner lp-stats-grid">
            {l.stats.map((stat) => (
              <div key={stat.label} className="lp-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section">
          <Reveal className="lp-inner">
            <div className="lp-heading-row">
              <div>
                <h2>{l.problemTitle}</h2>
                <p className="lp-lead">{l.problemText}</p>
              </div>
              <Cube />
            </div>
            <div className="lp-cards three">
              {l.problems.map((problem, i) => {
                const Icon = PROBLEM_ICONS[i] ?? BookOpenCheck
                return (
                  <article key={problem.title} className="lp-card tilt">
                    <span className="chip coral"><Icon size={20} aria-hidden /></span>
                    <h3>{problem.title}</h3>
                    <p className="muted">{problem.text}</p>
                  </article>
                )
              })}
            </div>
          </Reveal>
        </section>

        <section className="lp-section tinted" id="how">
          <Reveal className="lp-inner">
            <h2 className="center">{l.howTitle}</h2>
            <ol className="lp-steps">
              {l.steps.map((step, i) => {
                const Icon = STEP_ICONS[i] ?? Mic
                return (
                  <li key={step.title} className="lp-step">
                    <span className="lp-step-num"><Icon size={22} aria-hidden /></span>
                    <h3>{i + 1}. {step.title}</h3>
                    <p className="muted">{step.text}</p>
                  </li>
                )
              })}
            </ol>
          </Reveal>
        </section>

        <section className="lp-section">
          <Reveal className="lp-inner lp-demo-grid">
            <div>
              <h2>{l.demoTitle}</h2>
              <p className="lp-lead">{l.demoText}</p>
            </div>
            <Demo />
          </Reveal>
        </section>

        <section className="lp-section tinted">
          <Reveal className="lp-inner">
            <h2 className="center">{l.featuresTitle}</h2>
            <div className="lp-cards">
              {l.features.map((feature) => {
                const style = FEATURE_STYLE[feature.id] ?? { icon: Mic, color: 'green' }
                const Icon = style.icon
                return (
                  <article key={feature.id} className="lp-card tilt">
                    <span className={`chip ${style.color}`}><Icon size={20} aria-hidden /></span>
                    <h3>{feature.title}</h3>
                    <p className="muted">{feature.text}</p>
                  </article>
                )
              })}
            </div>
          </Reveal>
        </section>

        <section className="lp-section">
          <Reveal className="lp-inner center">
            <h2>{l.topicsTitle}</h2>
            <ul className="lp-topics">
              {l.topics.map((topic) => <li key={topic}>{topic}</li>)}
            </ul>
          </Reveal>
        </section>

        <section className="lp-section">
          <Reveal className="lp-inner">
            <div className="lp-final">
              <Cube small />
              <h2>{l.ctaTitle}</h2>
              <p>{l.ctaText}</p>
              <Link to="/signin" className="btn btn-hero lp-cta">{l.ctaButton} <ArrowRight size={18} aria-hidden /></Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-inner lp-footer-row">
          <span className="brand"><span aria-hidden>&gt;_</span> LearnX</span>
          <span className="muted small">{l.footerTagline}</span>
          <span className="row gap">
            <Link to="/privacy" className="small lp-link">{l.footerPrivacy}</Link>
            {contact && <a href={`mailto:${contact}`} className="small lp-link" aria-label={contact}><Mail size={16} aria-hidden /></a>}
          </span>
        </div>
      </footer>
    </div>
  )
}
