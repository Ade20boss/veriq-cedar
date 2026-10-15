"use client"

import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Cedar Operations rendering error", error)
  }, [error])

  return (
    <main className="state-page">
      <div className="state-icon denied" aria-hidden="true">!</div>
      <p className="eyebrow teal">Workspace unavailable</p>
      <h1>We could not load this workspace</h1>
      <p>Retry the simulated workspace. No banking record was changed.</p>
      <button className="btn btn-primary" onClick={() => reset()}>Try again</button>
    </main>
  )
}
