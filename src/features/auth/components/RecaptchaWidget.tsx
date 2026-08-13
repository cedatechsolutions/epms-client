import { useEffect, useRef, useState } from 'react'

type RecaptchaWidgetProps = {
  siteKey: string
  resetSignal: number
  onTokenChange: (token: string | null) => void
}

type GrecaptchaRenderParameters = {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
}

type GrecaptchaApi = {
  render: (container: HTMLElement, parameters: GrecaptchaRenderParameters) => number
  reset: (widgetId?: number) => void
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaApi
    __cemsRecaptchaOnload?: () => void
  }
}

const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-script'
const RECAPTCHA_ONLOAD_CALLBACK = '__cemsRecaptchaOnload'

let recaptchaReadyPromise: Promise<GrecaptchaApi> | null = null

function loadRecaptchaScript(): Promise<GrecaptchaApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('reCAPTCHA is only available in the browser.'))
  }

  if (window.grecaptcha?.render) {
    return Promise.resolve(window.grecaptcha)
  }

  if (recaptchaReadyPromise) {
    return recaptchaReadyPromise
  }

  recaptchaReadyPromise = new Promise<GrecaptchaApi>((resolve, reject) => {
    const handleReady = () => {
      if (window.grecaptcha?.render) {
        resolve(window.grecaptcha)
        return
      }

      recaptchaReadyPromise = null
      reject(new Error('reCAPTCHA loaded but is not available.'))
    }

    const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      const pollId = window.setInterval(() => {
        if (window.grecaptcha?.render) {
          window.clearInterval(pollId)
          handleReady()
        }
      }, 50)

      existingScript.addEventListener(
        'error',
        () => {
          window.clearInterval(pollId)
          recaptchaReadyPromise = null
          reject(new Error('Unable to load the reCAPTCHA script.'))
        },
        { once: true },
      )

      return
    }

    window[RECAPTCHA_ONLOAD_CALLBACK] = () => {
      delete window[RECAPTCHA_ONLOAD_CALLBACK]
      handleReady()
    }

    const script = document.createElement('script')
    script.id = RECAPTCHA_SCRIPT_ID
    script.src = `https://www.google.com/recaptcha/api.js?onload=${RECAPTCHA_ONLOAD_CALLBACK}&render=explicit`
    script.async = true
    script.defer = true
    script.onerror = () => {
      delete window[RECAPTCHA_ONLOAD_CALLBACK]
      recaptchaReadyPromise = null
      reject(new Error('Unable to load the reCAPTCHA script.'))
    }

    document.head.appendChild(script)
  })

  return recaptchaReadyPromise
}

export default function RecaptchaWidget({ siteKey, resetSignal, onTokenChange }: RecaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<number | null>(null)
  const onTokenChangeRef = useRef(onTokenChange)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange
  }, [onTokenChange])

  useEffect(() => {
    let cancelled = false

    if (!siteKey) {
      onTokenChangeRef.current(null)
      return undefined
    }

    if (!containerRef.current) {
      return undefined
    }

    void loadRecaptchaScript()
      .then((grecaptcha) => {
        if (cancelled || !containerRef.current || widgetIdRef.current !== null) {
          return
        }

        try {
          widgetIdRef.current = grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => {
              setLoadError(null)
              onTokenChangeRef.current(token)
            },
            'expired-callback': () => {
              onTokenChangeRef.current(null)
            },
            'error-callback': () => {
              setLoadError('Unable to load reCAPTCHA. Refresh the page and try again.')
              onTokenChangeRef.current(null)
            },
          })
        } catch {
          setLoadError('Unable to start sign in verification. Refresh the page and try again.')
          onTokenChangeRef.current(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Unable to load reCAPTCHA. Refresh the page and try again.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [siteKey])

  useEffect(() => {
    if (widgetIdRef.current === null || !window.grecaptcha?.reset) {
      return
    }

    window.grecaptcha.reset(widgetIdRef.current)
    onTokenChange(null)
  }, [onTokenChange, resetSignal])

  if (!siteKey) {
    return (
      <div className="space-y-2">
        <div className="min-h-[78px] border border-dashed border-danger-border-dashed bg-danger-bg-faint px-3 py-4 text-sm text-danger-text">
          Sign in verification is temporarily unavailable.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 w-full">
      <div ref={containerRef} className='w-full'/>
      {loadError ? <p className="text-xs text-danger-strong">{loadError}</p> : null}
    </div>
  )
}
