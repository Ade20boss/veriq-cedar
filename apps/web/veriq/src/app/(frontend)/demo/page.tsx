import VeriqApp from "../components/veriq-app"

export default function DemoPage() {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[100] flex min-h-9 items-center justify-center bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-950 shadow-sm">
        Synthetic demo mode — no live institution data and no authenticated
        session.
      </div>
      <div className="pt-9">
        <VeriqApp initialInstitution="Northstar Research Institute" />
      </div>
    </>
  )
}
