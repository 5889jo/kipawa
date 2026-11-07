"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canSubmitCourseRequest = canSubmitCourseRequest;
exports.canAccessAdminBookingPath = canAccessAdminBookingPath;
exports.getAdminBookingDataAccess = getAdminBookingDataAccess;
const ADMIN_ROLE = 'admin';
const BOOKING_PERMISSION = 'bookings';
const COURSE_ENQUIRY_PERMISSION = 'shortCourseEnquiries';
const COURSE_REQUESTS_PATH = '/bookings/requests/';
function canSubmitCourseRequest(role) {
    return role !== ADMIN_ROLE;
}
function canAccessAdminBookingPath(path, role, permissions) {
    return role === ADMIN_ROLE ||
        permissions.includes(BOOKING_PERMISSION) ||
        (permissions.includes(COURSE_ENQUIRY_PERMISSION) && path.startsWith(COURSE_REQUESTS_PATH));
}
function getAdminBookingDataAccess(role, permissions) {
    const isAdmin = role === ADMIN_ROLE;
    const canAccessLegacyBookings = isAdmin || permissions.includes(BOOKING_PERMISSION);
    return {
        legacyBookings: canAccessLegacyBookings,
        courseBookings: canAccessLegacyBookings || permissions.includes(COURSE_ENQUIRY_PERMISSION)
    };
}
