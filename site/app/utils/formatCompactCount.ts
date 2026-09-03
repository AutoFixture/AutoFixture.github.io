export function formatCompactCount(count: number): string {
  if (count < 1000) {
    return String(Math.round(count))
  }

  if (count < 1_000_000) {
    return `${compactWithSuffix(count / 1000)}K`
  }

  return `${compactWithSuffix(count / 1_000_000)}M`
}

function compactWithSuffix(value: number): string {
  const rounded = Math.round(value * 10) / 10
  if (Number.isInteger(rounded)) return String(rounded)
  return rounded.toFixed(1)
}
