import { describe, expect, it } from 'vitest'
import { getCourseCategoryForDisplay } from './courseCategory'

describe('short-course categories', () => {
  it('uses Other for missing or invalid short-course categories', () => {
    expect(getCourseCategoryForDisplay('Short Course', null)).toBe('OTHER')
    expect(getCourseCategoryForDisplay('Short Course', undefined)).toBe('OTHER')
    expect(getCourseCategoryForDisplay('Short Course', '')).toBe('OTHER')
    expect(getCourseCategoryForDisplay('Short Course', 'UNCATEGORIZED')).toBe('OTHER')
  })

  it('preserves an explicitly assigned short-course category', () => {
    expect(getCourseCategoryForDisplay('Short Course', 'ICT')).toBe('ICT')
    expect(getCourseCategoryForDisplay('Short Course', 'ELECTRICAL')).toBe('ELECTRICAL')
    expect(getCourseCategoryForDisplay('Short Course', 'ELECTRONICS')).toBe('ELECTRONICS')
    expect(getCourseCategoryForDisplay('Short Course', 'MECHATRONICS')).toBe('MECHATRONICS')
  })

  it('does not reclassify long courses', () => {
    expect(getCourseCategoryForDisplay('Long Course', 'ICT')).toBe('ICT')
    expect(getCourseCategoryForDisplay('Long Course', 'UNCATEGORIZED')).toBe('UNCATEGORIZED')
  })
})
