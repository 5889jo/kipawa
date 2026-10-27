"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseCategories = void 0;
exports.getCourseCategoryForDisplay = getCourseCategoryForDisplay;
exports.courseCategories = ['ICT', 'ELECTRICAL', 'ELECTRONICS', 'MECHATRONICS', 'OTHER'];
function getCourseCategoryForDisplay(courseType, category) {
    if (courseType === 'Short Course' && !exports.courseCategories.some((knownCategory) => knownCategory === category)) {
        return 'OTHER';
    }
    return category ?? 'ICT';
}
