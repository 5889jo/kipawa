const ADMIN_ROLE = 'admin'
const BOOKING_PERMISSION = 'bookings'
const COURSE_ENQUIRY_PERMISSION = 'shortCourseEnquiries'
const COURSE_REQUESTS_PATH = '/bookings/requests/'

export function canSubmitCourseRequest(role: string) {
  return role !== ADMIN_ROLE
}

export function canAccessAdminBookingPath(path: string, role: string, permissions: readonly string[]) {
  return role === ADMIN_ROLE ||
    permissions.includes(BOOKING_PERMISSION) ||
    (permissions.includes(COURSE_ENQUIRY_PERMISSION) && path.startsWith(COURSE_REQUESTS_PATH))
}

export function getAdminBookingDataAccess(role: string, permissions: readonly string[]) {
  const isAdmin = role === ADMIN_ROLE
  const canAccessLegacyBookings = isAdmin || permissions.includes(BOOKING_PERMISSION)

  return {
    legacyBookings: canAccessLegacyBookings,
    courseBookings: canAccessLegacyBookings || permissions.includes(COURSE_ENQUIRY_PERMISSION)
  }
}
