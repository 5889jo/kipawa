import { describe, expect, it } from 'vitest'
import { canAssignRole } from './adminRoleAccess'

describe('admin role access', () => {
  it('lets administrators manage any non-reserved role', () => {
    expect(canAssignRole(
      { role: 'admin', permissions: [] },
      { name: 'Course Manager', permissions: ['courses', 'bookings'] }
    )).toBe(true)
  })

  it('allows staff to manage roles whose permissions they hold', () => {
    expect(canAssignRole(
      { role: 'staff', permissions: ['users', 'news'] },
      { name: 'News Editor', permissions: ['news'] }
    )).toBe(true)
  })

  it('blocks staff from granting permissions they do not hold', () => {
    expect(canAssignRole(
      { role: 'staff', permissions: ['users'] },
      { name: 'Escalated Role', permissions: ['users', 'siteSettings'] }
    )).toBe(false)
  })

  it('never lets non-administrators assign the administrator role', () => {
    expect(canAssignRole(
      { role: 'staff', permissions: ['users'] },
      { name: 'Admin', permissions: [] }
    )).toBe(false)
  })
})
