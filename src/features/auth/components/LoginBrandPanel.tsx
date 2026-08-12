import { Link } from 'react-router'

// Tints are set by contrast against the brightest point of the washed photo (~rgb(65,93,79)):
// pure white lands at 7.2:1 and white/80 at 5.4:1, both clearing WCAG AA for normal text.
// Do not lower these — white/60 measures 3.8:1 here and fails.
const eyebrowClassName = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white'
const bodyClassName = 'mt-2 text-sm leading-6 text-white/80'

const CORE_VALUES = ['Truth', 'Integrity', 'Excellence', 'Service'] as const

/**
 * Login side panel — the university's Vision, Mission, Core Values and Quality Policy over
 * a photograph of the Bacoor City Campus under a green wash.
 *
 * The decorative layers (photo, wash, diamond line-work) sit in an `aria-hidden` wrapper
 * that owns the `overflow-hidden`; the section itself must NOT clip, or long copy would be
 * cut off at short viewport heights.
 *
 * On the photograph: it is landscape and carries a white "BACOOR CAMPUS" caption banner
 * across its foot. `object-cover` in this tall column fits it vertically, which would put
 * that banner in frame as a pale band — so the image box is oversized to `h-[135%]` and
 * anchored `object-top`, letting the wrapper's `overflow-hidden` clip the banner away. Keep
 * `h-[135%]`, `object-top` and the wrapper's `overflow-hidden` together. Tone comes from the
 * photo's `opacity` over the green ground plus the wash on top — adjust the two together.
 */
export default function LoginBrandPanel() {
  return (
    <section className="relative flex flex-col justify-center bg-[#123524] px-6 py-12 text-white sm:px-10 lg:px-16">
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <img
          src="/cvsubacoor.jpg"
          alt=""
          className="absolute inset-x-0 top-0 h-[135%] w-full object-cover object-[90%_top] opacity-60"
        />

        {/* Green wash over the photograph. */}
        <div className="absolute inset-0 bg-[#123524]/80" />

        {/* Abstract diamond line-work — rotated squares, bled off three edges. */}
        <div className="absolute -right-40 top-1/2 h-[680px] w-[680px] -translate-y-1/2 rotate-45 border border-white/10" />
        <div className="absolute -left-52 -top-32 h-[420px] w-[420px] rotate-45 border border-white/[0.07]" />
        <div className="absolute -bottom-40 left-1/4 h-[360px] w-[360px] rotate-45 border border-white/[0.06]" />
      </div>

      <div className="relative mx-auto w-full max-w-[400px] space-y-7 lg:mx-0 lg:max-w-lg">
        <div>
          <h2 className={eyebrowClassName}>Vision</h2>
          <p className={bodyClassName}>
            The premier university in historic Cavite globally recognized for excellence in character
            development, academics, research, innovation and sustainable community engagement.
          </p>
        </div>

        <div>
          <h2 className={eyebrowClassName}>Mission</h2>
          <p className={bodyClassName}>
            Cavite State University shall provide excellent, equitable and relevant educational
            opportunities in the arts, sciences and technology through quality instruction and responsive
            research and development activities. It shall produce professional, skilled and morally upright
            individuals for global competitiveness.
          </p>
        </div>

        <div>
          <h2 className={eyebrowClassName}>Core Values</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {CORE_VALUES.map((value) => (
              <li
                key={value}
                className="inline-flex border border-white/25 px-2.5 py-1 text-xs font-medium text-white"
              >
                {value}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={eyebrowClassName}>Quality Policy</h2>
          <p className={bodyClassName}>
            We Commit to the highest standards of education, value our stakeholders, Strive for continual
            improvement of our products and services, and Uphold the University&rsquo;s tenets of Truth,
            Excellence, and Service to produce globally competitive and morally upright individuals.
          </p>
        </div>

        <div className="border-t border-white/15 pt-6">
          <Link
            to="/privacy"
            className="text-sm font-medium text-white underline-offset-4 transition-colors hover:underline"
          >
            Privacy notice
          </Link>
        </div>
      </div>
    </section>
  )
}
