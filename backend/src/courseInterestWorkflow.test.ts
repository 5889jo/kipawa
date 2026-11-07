import { describe, expect, it } from 'vitest'
import { canSubmitCourseApplication, getCourseInterestActionStatuses } from './courseInterestWorkflow'

describe('course interest workflow', () => {
  it('lets learners complete or update an application after form-fee verification', () => {
    expect(canSubmitCourseApplication('form_fee_verified', true)).toBe(true)
    expect(canSubmitCourseApplication('application_needs_changes', true)).toBe(true)
  })

  it('lets a learner recover an application accidentally advanced by the legacy course-fee action', () => {
    expect(canSubmitCourseApplication('course_fee_verified', true)).toBe(true)
  })

  it('does not let staff advance a registered learner past the application form', () => {
    expect(getCourseInterestActionStatuses('verify_course_fee', true)).toEqual([])
    expect(getCourseInterestActionStatuses('send_start_date', true)).toEqual(['application_submitted'])
  })

  it('preserves the standalone enquiry payment and start-date workflow', () => {
    expect(getCourseInterestActionStatuses('verify_course_fee', false)).toEqual(['form_fee_verified'])
    expect(getCourseInterestActionStatuses('send_start_date', false)).toEqual(['course_fee_verified'])
  })
})
