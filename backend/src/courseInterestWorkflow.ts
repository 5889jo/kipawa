export type CourseInterestAction =
  | 'contacted'
  | 'verify_phone'
  | 'issue_control_number'
  | 'verify_form_fee'
  | 'reject_form_fee'
  | 'verify_course_fee'
  | 'request_application_changes'
  | 'decline_application'
  | 'send_start_date'

export function getCourseInterestActionStatuses(action: CourseInterestAction, isRegisteredLearner: boolean) {
  switch (action) {
    case 'contacted':
    case 'verify_phone':
    case 'issue_control_number':
      return ['new']
    case 'verify_form_fee':
      return isRegisteredLearner ? ['payment_submitted'] : ['contacted']
    case 'reject_form_fee':
      return ['payment_submitted']
    case 'verify_course_fee':
      return isRegisteredLearner ? [] : ['form_fee_verified']
    case 'request_application_changes':
    case 'decline_application':
      return ['application_submitted']
    case 'send_start_date':
      return isRegisteredLearner ? ['application_submitted'] : ['course_fee_verified']
  }
}

export function canSubmitCourseApplication(status: string, isRegisteredLearner: boolean) {
  return ['form_fee_verified', 'application_needs_changes'].includes(status) ||
    (isRegisteredLearner && status === 'course_fee_verified')
}
