const PIECES = Array.from({ length: 28 }, (_, i) => i)

/** A short celebration for finished work. Decorative only, and removed under reduced motion. */
export function Confetti() {
  return (
    <div className="confetti" aria-hidden>
      {PIECES.map((i) => (
        <span
          key={i}
          className={`piece c${i % 5}`}
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 7) * 70}ms`,
            animationDuration: `${1300 + (i % 5) * 170}ms`,
          }}
        />
      ))}
    </div>
  )
}
