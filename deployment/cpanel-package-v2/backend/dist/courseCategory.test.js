"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const courseCategory_1 = require("./courseCategory");
(0, vitest_1.describe)('short-course categories', () => {
    (0, vitest_1.it)('uses Other for missing or invalid short-course categories', () => {
        (0, vitest_1.expect)((0, courseCategory_1.getCourseCategoryForDisplay)('Short Course', null)).toBe('OTHER');
        (0, vitest_1.expect)((0, courseCategory_1.getCourseCategoryForDisplay)('Short Course', undefined)).toBe('OTHER');
        (0, vitest_1.expect)((0, courseCategory_1.getCourseCategoryForDisplay)('Short Course', '')).toBe('OTHER');
        (0, vitest_1.expect)((0, courseCategory_1.getCourseCategoryForDisplay)('Short Course', 'UNCATEGORIZED')).toBe('OTHER');
    });
    (0, vitest_1.it)('preserves an explicitly assigned short-course category', () => {
        (0, vitest_1.expect)((0, courseCategory_1.getCourseCategoryForDisplay)('Short Course', 'ICT')).toBe('ICT');
        (0, vitest_1.expect)((0, courseCategory_1.getCourseCategoryForDisplay)('Short Course', 'ELECTRICAL')).toBe('ELECTRICAL');
        (0, vitest_1.expect)((0, courseCategory_1.getCourseCategoryForDisplay)('Short Course', 'ELECTRONICS')).toBe('ELECTRONICS');
        (0, vitest_1.expect)((0, courseCategory_1.getCourseCategoryForDisplay)('Short Course', 'MECHATRONICS')).toBe('MECHATRONICS');
    });
    (0, vitest_1.it)('does not reclassify long courses', () => {
        (0, vitest_1.expect)((0, courseCategory_1.getCourseCategoryForDisplay)('Long Course', 'ICT')).toBe('ICT');
        (0, vitest_1.expect)((0, courseCategory_1.getCourseCategoryForDisplay)('Long Course', 'UNCATEGORIZED')).toBe('UNCATEGORIZED');
    });
});
