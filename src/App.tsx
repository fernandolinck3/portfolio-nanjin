/**
 * The Unit is not built yet. This shell exists so the toolchain stays green
 * while the Parts are designed and polished one at a time.
 *
 * When it is built, this component owns the DOM truth layer (ADR-0002): the six
 * Modules as real semantic HTML and the Pads as real buttons. The three.js
 * scene subscribes to that state and paints the Screen texture from it.
 */
export default function App() {
  return <main id="unit" />
}
