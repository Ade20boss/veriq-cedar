import {
    ArrowRight,
    Eye,
    EyeOff,
    Fingerprint,
    ShieldCheck,
} from "lucide-react"
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
    passwordVisible,
    setPasswordVisible,
    onLogin,
}: {
    passwordVisible: boolean
    setPasswordVisible: (v: boolean) => void
    onLogin: () => void
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
                        Good to see you,
                        <br />
                        Ada.
                    </h1>
                    <p>Sign in to your fictional Cedar account.</p>
                </div>
            </div>
            <section className="login-card">
                <div className="customer-row">
                    <div className="avatar">AO</div>
                    <div>
                        <strong>Ada Okafor</strong>
                        <span>Customer ID •••• 4102</span>
                    </div>
                    <button className="text-button">Switch</button>
                </div>
                <Field label="Demo password" hint="Use any password for this prototype">
                    <div className="input-wrap">
                        <TextInput
                            type={passwordVisible ? "text" : "password"}
                            defaultValue="cedar-demo"
                        />
                        <button
                            className="input-action"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                            {passwordVisible ? <EyeOff size={19} /> : <Eye size={19} />}
                        </button>
                    </div>
                </Field>
                <button className="forgot">Forgot password?</button>
                <Button onClick={onLogin}>
                    Sign in securely <ArrowRight size={18} />
                </Button>
                <button className="biometric" onClick={onLogin}>
                    <Fingerprint size={26} />
                    <span>
                        <strong>Use demo biometrics</strong>
                        <small>No real biometric data is collected</small>
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
