import {
    ArrowDownLeft,
    ArrowRight,
    ArrowUpRight,
    Check,
    Clock3,
    History,
    Home,
    LifeBuoy,
    Send,
    ShieldCheck,
    X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import {
    naira,
    scenarios,
    type Scenario,
    type Transaction,
} from "../../../data"
import { Button, StatusPill } from "../../../ui"
import type { Screen } from "../types"

export function BottomNav({
    current,
    onNavigate,
}: {
    current: Screen
    onNavigate: (s: Screen) => void
}) {
    const items: [Screen, LucideIcon, string][] = [
        ["home", Home, "Home"],
        ["transfer", Send, "Transfer"],
        ["history", History, "History"],
        ["support", LifeBuoy, "Support"],
    ]
    return (
        <nav className="bottom-nav">
            {items.map(([id, Icon, label]) => (
                <button
                    key={id}
                    className={current === id ? "active" : ""}
                    onClick={() => onNavigate(id)}
                >
                    <Icon size={21} />
                    <span>{label}</span>
                </button>
            ))}
        </nav>
    )
}

export function DemoSheet({
    scenario,
    setScenario,
    close,
}: {
    scenario: Scenario
    setScenario: (v: Scenario) => void
    close: () => void
}) {
    return (
        <div className="sheet-backdrop" onClick={close}>
            <section className="sheet" onClick={(e) => e.stopPropagation()}>
                <div className="sheet-handle" />
                <header>
                    <div>
                        <span className="eyebrow">DEMO-ONLY TOOL</span>
                        <h2>Choose transfer scenario</h2>
                    </div>
                    <button className="icon-button" onClick={close}>
                        <X size={20} />
                    </button>
                </header>
                <p>
                    This control is separate from Cedar's customer banking experience.
                </p>
                <div className="scenario-list">
                    {scenarios.map((item) => (
                        <button
                            key={item.id}
                            className={scenario === item.id ? "selected" : ""}
                            onClick={() => setScenario(item.id)}
                        >
                            <span className="radio">{scenario === item.id && <i />}</span>
                            <span>
                                <strong>{item.label}</strong>
                                <small>{item.detail}</small>
                            </span>
                        </button>
                    ))}
                </div>
                <Button onClick={close}>Use selected scenario</Button>
            </section>
        </div>
    )
}

export function TransactionRow({
    item,
    onClick,
}: {
    item: Transaction
    onClick: () => void
}) {
    return (
        <button className="transaction-row" onClick={onClick}>
            <span className={`transaction-icon ${item.direction}`}>
                {item.direction === "credit" ? <ArrowDownLeft /> : <ArrowUpRight />}
            </span>
            <span className="transaction-main">
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
                <StatusPill status={item.status} />
            </span>
            <strong className={item.direction}>
                {item.direction === "credit" ? "+" : "−"}
                {naira(item.amount)}
            </strong>
        </button>
    )
}

export function InfoRow({
    label,
    value,
    strong = false,
}: {
    label: string
    value: string
    strong?: boolean
}) {
    return (
        <div className="info-row">
            <span>{label}</span>
            <strong className={strong ? "emphasis" : ""}>{value}</strong>
        </div>
    )
}

export function TimelineItem({
    done = false,
    active = false,
    title,
    copy,
    time,
}: {
    done?: boolean
    active?: boolean
    title: string
    copy: string
    time?: string
}) {
    return (
        <div
            className={`timeline-item ${done ? "done" : ""} ${active ? "active" : ""
                }`}
        >
            <span className="timeline-dot">
                {done ? <Check size={12} /> : active ? <Clock3 size={12} /> : null}
            </span>
            <div>
                <strong>{title}</strong>
                <p>{copy}</p>
                {time && <small>{time}</small>}
            </div>
        </div>
    )
}

export function MenuItem({
    icon,
    title,
    action,
}: {
    icon: ReactNode
    title: string
    action: () => void
}) {
    return (
        <button onClick={action}>
            <span>{icon}</span>
            <strong>{title}</strong>
            <ArrowRight size={18} />
        </button>
    )
}

export function Empty({
    icon,
    title,
    copy,
}: {
    icon: ReactNode
    title: string
    copy: string
}) {
    return (
        <div className="empty">
            <span>{icon}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
        </div>
    )
}
