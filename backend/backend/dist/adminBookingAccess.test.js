"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const adminBookingAccess_1 = require("./adminBookingAccess");
(0, vitest_1.describe)('admin booking access', () => {
    (0, vitest_1.it)('prevents administrators from submitting learner course requests', () => {
        (0, vitest_1.expect)((0, adminBookingAccess_1.canSubmitCourseRequest)('admin')).toBe(false);
        (0, vitest_1.expect)((0, adminBookingAccess_1.canSubmitCourseRequest)('user')).toBe(true);
        (0, vitest_1.expect)((0, adminBookingAccess_1.canSubmitCourseRequest)('staff')).toBe(true);
    });
    (0, vitest_1.it)('limits short-course enquiry access to course request endpoints', () => {
        const permissions = ['shortCourseEnquiries'];
        (0, vitest_1.expect)((0, adminBookingAccess_1.canAccessAdminBookingPath)('/bookings/requests/42', 'staff', permissions)).toBe(true);
        (0, vitest_1.expect)((0, adminBookingAccess_1.canAccessAdminBookingPath)('/bookings/42', 'staff', permissions)).toBe(false);
        (0, vitest_1.expect)((0, adminBookingAccess_1.getAdminBookingDataAccess)('staff', permissions)).toEqual({
            legacyBookings: false,
            courseBookings: true
        });
    });
    (0, vitest_1.it)('allows booking managers to access both booking datasets', () => {
        const permissions = ['bookings'];
        (0, vitest_1.expect)((0, adminBookingAccess_1.canAccessAdminBookingPath)('/bookings/42', 'staff', permissions)).toBe(true);
        (0, vitest_1.expect)((0, adminBookingAccess_1.getAdminBookingDataAccess)('staff', permissions)).toEqual({
            legacyBookings: true,
            courseBookings: true
        });
    });
    (0, vitest_1.it)('does not grant booking access to unrelated permission holders', () => {
        (0, vitest_1.expect)((0, adminBookingAccess_1.canAccessAdminBookingPath)('/bookings/requests/42', 'staff', ['news'])).toBe(false);
        (0, vitest_1.expect)((0, adminBookingAccess_1.getAdminBookingDataAccess)('staff', ['news'])).toEqual({
            legacyBookings: false,
            courseBookings: false
        });
    });
    (0, vitest_1.it)('preserves full booking access for administrators', () => {
        (0, vitest_1.expect)((0, adminBookingAccess_1.canAccessAdminBookingPath)('/bookings/42', 'admin', [])).toBe(true);
        (0, vitest_1.expect)((0, adminBookingAccess_1.getAdminBookingDataAccess)('admin', [])).toEqual({
            legacyBookings: true,
            courseBookings: true
        });
    });
});
