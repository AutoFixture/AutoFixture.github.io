import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatDocsUpdatedDate, toDocsUpdatedIso } from '../app/utils/formatDocsUpdatedDate.ts'

describe('toDocsUpdatedIso', () => {
  it('toDocsUpdatedIso_WhenMissing_ReturnsUndefined', () => {
    assert.equal(toDocsUpdatedIso(undefined), undefined)
    assert.equal(toDocsUpdatedIso(null), undefined)
    assert.equal(toDocsUpdatedIso(''), undefined)
  })

  it('toDocsUpdatedIso_WhenIsoString_ReturnsSame', () => {
    assert.equal(toDocsUpdatedIso('2026-09-08'), '2026-09-08')
  })

  it('toDocsUpdatedIso_WhenInvalidString_ReturnsUndefined', () => {
    assert.equal(toDocsUpdatedIso('09/08/2026'), undefined)
    assert.equal(toDocsUpdatedIso('2026-13-01'), undefined)
    assert.equal(toDocsUpdatedIso('not-a-date'), undefined)
  })

  it('toDocsUpdatedIso_WhenDate_ReturnsUtcCalendarDay', () => {
    assert.equal(toDocsUpdatedIso(new Date(Date.UTC(2026, 8, 8))), '2026-09-08')
  })
})

describe('formatDocsUpdatedDate', () => {
  it('formatDocsUpdatedDate_WhenIso_ReturnsLabelAndIso', () => {
    assert.deepEqual(formatDocsUpdatedDate('2026-09-08'), {
      iso: '2026-09-08',
      label: 'September 8, 2026',
    })
  })

  it('formatDocsUpdatedDate_WhenInvalid_ReturnsUndefined', () => {
    assert.equal(formatDocsUpdatedDate('nope'), undefined)
  })
})
