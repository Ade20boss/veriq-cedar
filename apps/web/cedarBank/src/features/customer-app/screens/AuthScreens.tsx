import { ArrowRight, Fingerprint, ShieldCheck } from "lucide-react"
import { Button, CedarMark, Field, TextInput } from "../../../ui"

export function Splash() {
  return (
    <main className="splash">
      <div className="splash-glow" />
      <CedarMark light />
      <p>Banking, rooted in trust.</p>
      <span className="demo-chip">FICTIONAL DEMO BANK</span>
    </main>
  )
}

export function Login({
  onLogin,
  loading,
  error,
}: {
  onLogin: () => void
  loading?: boolean
  error?: string
}) {
  return (
    <main className="login-page">
      <div className="login-top">
        <CedarMark light />
        <span className="secure-label">
          <ShieldCheck size={14} /> Secure demo
        </span>
        <div className="welcome">
          <span className="eyebrow light">WELCOME BACK</span>
          <h1>
            Cedar customer session
          </h1>
          <p>
            {error ||
              "This app uses a server-provisioned demo session; there is no browser login."}
          </p>
        </div>
      </div>
      <section className="login-card">
        <div className="customer-row">
          <div className="avatar">CB</div>
          <div>
            <strong>Server-provisioned session</strong>
            <span>No browser credentials are collected</span>
          </div>
          <button className="text-button">Switch</button>
        </div>
                <Field label="Session status" hint="Cedar sessions are provisioned by the backend; this screen cannot create one">
          <div className="input-wrap">
            <TextInput
                            type="text"
                            value="Waiting for server session"
                            readOnly
            />
          </div>
        </Field>
        <Button loading={loading} onClick={onLogin}>
                    Retry session check <ArrowRight size={18} />
        </Button>
        <button className="biometric" onClick={onLogin}>
          <Fingerprint size={26} />
          <span>
                        <strong>Use existing demo session</strong>
                        <small>No credentials are collected in the browser</small>
          </span>
        </button>
        <p className="safety">
          <ShieldCheck size={15} /> This is a simulated banking environment.
          Never enter real credentials.
        </p>
      </section>
    </main>
  )
}
