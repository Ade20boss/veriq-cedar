import Link from "next/link"

export default function NotFound() {
  return (
    <main className="state-page">
      <div className="state-icon denied" aria-hidden="true">?</div>
      <p className="eyebrow teal">Route not found</p>
      <h1>That Operations route does not exist</h1>
      <p>Use the Cedar workspace entry point to continue.</p>
      <Link className="btn btn-primary" href="/">Return to sign-in</Link>
    </main>
  )
}
