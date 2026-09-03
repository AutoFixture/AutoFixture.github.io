import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatCompactCount } from '../app/utils/formatCompactCount.ts'

describe('formatCompactCount', () => {
  it('formatCompactCount_WhenBelowOneThousand_ReturnsExactCount', () => {
    assert.equal(formatCompactCount(0), '0')
    assert.equal(formatCompactCount(999), '999')
  })

  it('formatCompactCount_WhenExactlyOneThousand_Returns1K', () => {
    assert.equal(formatCompactCount(1000), '1K')
  })

  it('formatCompactCount_When3600_Returns3Point6K', () => {
    assert.equal(formatCompactCount(3600), '3.6K')
  })

  it('formatCompactCount_When3537_Returns3Point5K', () => {
    assert.equal(formatCompactCount(3537), '3.5K')
  })

  it('formatCompactCount_WhenExactlyThreeThousand_Returns3K', () => {
    assert.equal(formatCompactCount(3000), '3K')
  })

  it('formatCompactCount_WhenOnePointFiveMillion_Returns1Point5M', () => {
    assert.equal(formatCompactCount(1_500_000), '1.5M')
  })
})
