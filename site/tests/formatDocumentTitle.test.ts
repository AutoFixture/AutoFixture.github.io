import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatDocumentTitle } from '../app/utils/formatDocumentTitle.ts'

describe('formatDocumentTitle', () => {
  it('formatDocumentTitle_WhenMissing_ReturnsAutoFixture', () => {
    assert.equal(formatDocumentTitle(undefined), 'AutoFixture')
    assert.equal(formatDocumentTitle(null), 'AutoFixture')
    assert.equal(formatDocumentTitle(''), 'AutoFixture')
  })

  it('formatDocumentTitle_WhenAlreadySiteName_ReturnsAutoFixture', () => {
    assert.equal(formatDocumentTitle('AutoFixture'), 'AutoFixture')
  })

  it('formatDocumentTitle_WhenPageTitle_AppendsAutoFixture', () => {
    assert.equal(formatDocumentTitle('Introduction'), 'Introduction · AutoFixture')
    assert.equal(formatDocumentTitle('Fixture'), 'Fixture · AutoFixture')
  })
})
