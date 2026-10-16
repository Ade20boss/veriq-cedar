import assert from "node:assert/strict"
import test from "node:test"
import { workspaceTarget } from "../src/app/(frontend)/components/workspace-navigation.js"

test("synthetic onboarding mode survives workspace and case navigation", () => {
  for (const path of [
    "/w/cedar-demo/overview",
    "/w/cedar-demo/knowledge",
    "/w/cedar-demo/monitoring",
    "/w/cedar-demo/incidents",
    "/w/cedar-demo/investigations/case-1",
  ]) {
    assert.equal(
      workspaceTarget(path, "?mode=synthetic"),
      `${path}?mode=synthetic`,
    )
  }
})

test("normal authenticated navigation never acquires synthetic mode", () => {
  assert.equal(
    workspaceTarget("/w/cedar-demo/knowledge", ""),
    "/w/cedar-demo/knowledge",
  )
  assert.equal(
    workspaceTarget("/w/cedar-demo/knowledge", "?mode=live"),
    "/w/cedar-demo/knowledge",
  )
})
