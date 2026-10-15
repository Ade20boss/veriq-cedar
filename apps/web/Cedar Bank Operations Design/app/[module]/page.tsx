import { notFound } from "next/navigation"
import OperationsApp from "../../src/App"

const modules = new Set([
  "workspace",
  "queue",
  "customers",
  "transactions",
  "complaints",
  "payments",
  "exceptions",
  "team",
  "audit",
  "veriq",
])

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  if (!modules.has(module)) notFound()
  return <OperationsApp initialRoute={module} />
}
