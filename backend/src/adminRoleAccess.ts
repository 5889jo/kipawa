export interface AdminRoleAccessActor {
  role: string
  permissions: readonly string[]
}

export interface ManagedAdminRole {
  name: string
  permissions: readonly string[]
}

export function canAssignRole(actor: AdminRoleAccessActor, role: ManagedAdminRole) {
  return actor.role === 'admin' ||
    (role.name.toLowerCase() !== 'admin' &&
      role.permissions.every((permission) => actor.permissions.includes(permission)))
}
