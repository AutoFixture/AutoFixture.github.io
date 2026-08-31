export function toVersionSegment(version) {
  return String(version).trim().replace(/\./g, '-')
}

export function versionPaths(packageId, version) {
  const segment = toVersionSegment(version)
  return {
    segment,
    root: `/api/${packageId}/${segment}`,
  }
}
