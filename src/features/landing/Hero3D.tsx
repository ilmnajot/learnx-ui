import { ArrowRight, Check, Flame, Mic, Sparkles } from 'lucide-react'
import { useRef, type CSSProperties, type PointerEvent } from 'react'
import { landing as l } from '../../i18n/landing'

const MAX_TILT_DEGREES = 12

/** A phone built from CSS 3D faces, with a ring of work words around it. No 3D library, so it stays light on phones. */
export function Hero3D() {
  const tilt = useRef<HTMLDivElement>(null)

  function follow(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || !tilt.current) return
    const box = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width - 0.5
    const y = (event.clientY - box.top) / box.height - 0.5
    tilt.current.style.setProperty('--tilt-y', `${x * MAX_TILT_DEGREES * 2}deg`)
    tilt.current.style.setProperty('--tilt-x', `${-y * MAX_TILT_DEGREES * 2}deg`)
  }

  function reset() {
    tilt.current?.style.removeProperty('--tilt-x')
    tilt.current?.style.removeProperty('--tilt-y')
  }

  return (
    <div className="scene" aria-hidden onPointerMove={follow} onPointerLeave={reset}>
      <div className="scene-glow" />
      <div className="scene-tilt" ref={tilt}>
        <div className="orbit-tilt">
          <div className="orbit">
            {l.orbitWords.map((word, i) => (
              <span key={word} className="orbit-word" style={{ '--i': i } as CSSProperties}>{word}</span>
            ))}
          </div>
        </div>

        <div className="phone3d">
          <div className="phone-face phone-back"><span>&gt;_</span></div>
          <div className="phone-face phone-edge left" />
          <div className="phone-face phone-edge right" />
          <div className="phone-face phone-edge top" />
          <div className="phone-face phone-edge bottom" />
          <div className="phone-face phone-screen">
            <div className="ps-notch" />
            <div className="ps-hero">
              <span className="ps-tag"><Sparkles size={10} /> {l.phoneToday}</span>
              <strong>{l.phoneLesson}</strong>
              <span className="ps-btn">{l.phoneStart} <ArrowRight size={12} /></span>
            </div>
            <div className="ps-bubble coach">{l.phoneCoach}</div>
            <div className="ps-bubble you">{l.phoneYou}</div>
            <div className="ps-wave">
              {Array.from({ length: 16 }, (_, i) => (
                <i key={i} style={{ animationDelay: `${i * 70}ms` }} />
              ))}
            </div>
            <div className="ps-mic"><Mic size={18} /></div>
          </div>
        </div>

        <div className="float-card fc-fix">
          <s>{l.floatBefore}</s>
          <span><Check size={13} /> {l.floatAfter}</span>
        </div>
        <div className="float-card fc-streak"><Flame size={15} /> {l.floatStreak}</div>
        <div className="float-card fc-speak"><Mic size={15} /> {l.floatSpeak}</div>
      </div>
    </div>
  )
}
