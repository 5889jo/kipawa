import { describe, expect, it } from 'vitest'
import { canAccessAdminBookingPath, canSubmitCourseRequest, getAdminBookingDataAccess } from './adminBookingAccess'

describe('admin booking access', () => {
  it('prevents administrators from submitting learner course requests', () => {
    expect(canSubmitCourseRequest('admin')).toBe(false)
    expect(canSubmitCourseRequest('user')).toBe(true)
    expect(canSubmitCourseRequest('staff')).toBe(true)
  })

  it('limits short-course enquiry access to course request endpoints', () => {
    const permissions = ['shortCourseEnquiries']

    expect(canAccessAdminBookingPath('/bookings/requests/42', 'staff', permissions)).toBe(true)
    expect(canAccessAdminBookingPath('/bookings/42', 'staff', permissions)).toBe(false)
    expect(getAdminBookingDataAccess('staff', permissions)).toEqual({
      legacyBookings: false,
      courseBookings: true
    })
  })

  it('allows booking managers to access both booking datasets', () => {
    const permissions = ['bookings']

    expect(canAccessAdminBookingPath('/bookings/42', 'staff', permissions)).toBe(true)
    expect(getAdminBookingDataAccess('staff', permissions)).toEqual({
      legacyBookings: true,
      courseBookings: true
    })
  })

  it('does not grant booking access to unrelated permission holders', () => {
    expect(canAccessAdminBookingPath('/bookings/requests/42', 'staff', ['news'])).toBe(false)
    expect(getAdminBookingDataAccess('staff', ['news'])).toEqual({
      legacyBookings: false,
      courseBookings: false
    })
  })

  it('preserves full booking access for administrators', () => {
    expect(canAccessAdminBookingPath('/bookings/42', 'admin', [])).toBe(true)
    expect(getAdminBookingDataAccess('admin', [])).toEqual({
      legacyBookings: true,
      courseBookings: true
    })
  })
})
