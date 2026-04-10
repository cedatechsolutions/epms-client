import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'

export default function LoginPage() {
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate('/admin/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f4f7f1] px-4 py-10 text-[#123524] md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-1 items-center justify-center">
        <section className="w-full max-w-[420px] border border-[#d8e1d4] bg-white p-8 shadow-[0_12px_30px_rgba(18,53,36,0.05)] md:p-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#123524]">
              Cavite State University
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#123524]">
              Extension Projects Management System
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#506552]">
              Sign in to continue to the administrative workspace.
            </p>
          </div>

          <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#123524]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                className="w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#123524]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                className="w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b]"
              />
            </div>

            <button
              type="submit"
              className="w-full border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#18492e]"
            >
              Sign in
            </button>
          </form>
        </section>
      </div>

      <p className="mt-6 text-center text-sm text-[#8a9989]">CEDA Tech Solutions</p>
    </main>
  )
}
