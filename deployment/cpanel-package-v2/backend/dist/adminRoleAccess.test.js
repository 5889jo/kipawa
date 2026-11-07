"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const adminRoleAccess_1 = require("./adminRoleAccess");
(0, vitest_1.describe)('admin role access', () => {
    (0, vitest_1.it)('lets administrators manage any non-reserved role', () => {
        (0, vitest_1.expect)((0, adminRoleAccess_1.canAssignRole)({ role: 'admin', permissions: [] }, { name: 'Course Manager', permissions: ['courses', 'bookings'] })).toBe(true);
    });
    (0, vitest_1.it)('allows staff to manage roles whose permissions they hold', () => {
        (0, vitest_1.expect)((0, adminRoleAccess_1.canAssignRole)({ role: 'staff', permissions: ['users', 'news'] }, { name: 'News Editor', permissions: ['news'] })).toBe(true);
    });
    (0, vitest_1.it)('blocks staff from granting permissions they do not hold', () => {
        (0, vitest_1.expect)((0, adminRoleAccess_1.canAssignRole)({ role: 'staff', permissions: ['users'] }, { name: 'Escalated Role', permissions: ['users', 'siteSettings'] })).toBe(false);
    });
    (0, vitest_1.it)('never lets non-administrators assign the administrator role', () => {
        (0, vitest_1.expect)((0, adminRoleAccess_1.canAssignRole)({ role: 'staff', permissions: ['users'] }, { name: 'Admin', permissions: [] })).toBe(false);
    });
});
