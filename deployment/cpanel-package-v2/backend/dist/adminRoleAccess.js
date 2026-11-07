"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAssignRole = canAssignRole;
function canAssignRole(actor, role) {
    return actor.role === 'admin' ||
        (role.name.toLowerCase() !== 'admin' &&
            role.permissions.every((permission) => actor.permissions.includes(permission)));
}
