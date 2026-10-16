export function workspaceTarget(path, search) {
  const params = new URLSearchParams(search)
  return params.get("mode") === "synthetic" ? `${path}?mode=synthetic` : path
}
