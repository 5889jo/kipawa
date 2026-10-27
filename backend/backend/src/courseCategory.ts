export const courseCategories = ['ICT', 'ELECTRICAL', 'ELECTRONICS', 'MECHATRONICS', 'OTHER'] as const

export function getCourseCategoryForDisplay(courseType: string, category: string | null | undefined) {
  if (courseType === 'Short Course' && !courseCategories.some((knownCategory) => knownCategory === category)) {
    return 'OTHER'
  }
  return category ?? 'ICT'
}
