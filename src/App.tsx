import { useEffect, useRef } from 'react'
import { Monument } from './components/Monument'
import {
  useReducedMotion,
  useScrollProgress,
  useSmoothScroll,
} from './scroll/useSmoothScroll'

const WORDMARK_LINES = ['FER', 'BITTENCOURT']

export default function App() {
  const reducedMotion = useReducedMotion()
  const thresholdRef = useRef<HTMLElement>(null)
  const decayRef = useRef(0)

  useSmoothScroll(!reducedMotion)

  const progress = useScrollProgress(thresholdRef)

  useEffect(() => {
    decayRef.current = progress
    /** The SVG baseline decays alongside the shader, so both agree. */
    thresholdRef.current?.style.setProperty('--decay', progress.toFixed(4))
  }, [progress])

  return (
    <main>
      <section className="threshold" id="threshold" ref={thresholdRef}>
        <header className="system">
          <p className="system__name">Fer Bittencourt</p>
          <p className="system__label system__label--a">Creative frontend</p>
          <p className="system__label system__label--b">Marketing perspective</p>
          <p className="system__index" aria-label="Section one of six">
            <span aria-hidden="true">01</span>
            <span aria-hidden="true">06</span>
          </p>
        </header>

        <h1 className="monument-heading">
          <Monument
            lines={WORDMARK_LINES}
            label="Fer Bittencourt"
            reducedMotion={reducedMotion}
            decayRef={decayRef}
          />
        </h1>

        <div className="threshold__foot">
          <p className="intro-copy">
            I build expressive digital experiences through frontend development,
            shaped by a marketing perspective and an eye for culture.
          </p>

          <aside
            className="coordinates"
            aria-label="Current practice and future direction"
          >
            <div className="coordinate">
              <p className="coordinate__label">Now — current practice</p>
              <p>Frontend development</p>
              <p>Marketing &amp; communication</p>
            </div>

            <div className="coordinate coordinate--next">
              <p className="coordinate__label">Next — learning &amp; building</p>
              <p>AI for business</p>
              <p>Automation · Data analytics</p>
            </div>
          </aside>

          <a className="scroll-cue" href="#present-coordinates">
            <span>Present coordinates</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section
        className="present"
        id="present-coordinates"
        aria-labelledby="present-title"
      >
        <header className="section-head">
          <p className="section-head__index" aria-hidden="true">
            02
          </p>
          <h2 id="present-title">Present coordinates</h2>
        </header>

        <div className="present__grid">
          <article className="volume">
            <p className="volume__label">Discipline 01</p>
            <h3>Frontend development</h3>
            <p>
              I build interfaces in the browser — semantic structure, modern CSS,
              TypeScript, and interaction that stays usable when the atmosphere is
              stripped away. This page is the working example: the monument above
              is original vector geometry driven by a shader, and it degrades to
              plain markup without losing meaning.
            </p>
          </article>

          <article className="volume">
            <p className="volume__label">Discipline 02</p>
            <h3>Marketing perspective</h3>
            <p>
              I think about who is reading, what they need to believe, and what
              the next action should be. Positioning, message hierarchy, and the
              difference between a sentence that sounds impressive and one that
              actually says something.
            </p>
          </article>

          <article className="volume volume--wide">
            <p className="volume__label">Why the combination matters</p>
            <p>
              Most briefs fail in the gap between the two. A well-built interface
              that says nothing, or a sharp message that nobody can execute. I
              work across both ends, which means the argument and the artifact
              stay in agreement.
            </p>
          </article>
        </div>

        <footer className="architect-note">
          <p className="architect-note__index">Architect&rsquo;s note — 001</p>
          <p>
            This portfolio is the first public artifact in my body of work. There
            are no client case studies here yet, and I am not going to invent
            any. What is here is the thing itself, built in the open.
          </p>
        </footer>
      </section>
    </main>
  )
}
