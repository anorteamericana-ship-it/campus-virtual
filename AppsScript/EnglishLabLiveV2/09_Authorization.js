/** English LAB LIVE v2 · capability and resource-ownership checks. */
function ELV2_hasCapability(actor, capability) {
  return !!actor && Array.isArray(actor.capabilities) && actor.capabilities.indexOf(capability) !== -1;
}

function ELV2_assertCapability(actor, capability) {
  if (!ELV2_hasCapability(actor, capability)) throw new Error('ELV2_FORBIDDEN:' + capability);
}

function ELV2_assertStudentJoinActor(actor) {
  ELV2_assertCapability(actor, ELV2_CAPABILITY.LIVE_JOIN);
  if (!actor || actor.role !== 'student') throw new Error('ELV2_FORBIDDEN:student_role_required');
  if (typeof actor.student_id !== 'string' || !actor.student_id.trim()) throw new Error('ELV2_ACTOR_STUDENT_ID_REQUIRED');
  if (actor.live_eligible !== true) throw new Error('ELV2_ROOM_NOT_AVAILABLE');
  return true;
}

function ELV2_assertRoomCreateGroup(actor, groupId) {
  ELV2_assertCapability(actor, ELV2_CAPABILITY.LIVE_CREATE);
  var normalizedGroupId = typeof groupId === 'string' ? groupId.trim() : '';
  if (!normalizedGroupId) throw new Error('ELV2_FORBIDDEN:room_group');
  if (!actor || !Array.isArray(actor.authorized_group_ids) || actor.authorized_group_ids.indexOf(normalizedGroupId) === -1) {
    throw new Error('ELV2_FORBIDDEN:room_group');
  }
  return normalizedGroupId;
}

function ELV2_assertRoomController(actor, room) {
  if (!actor || !room) throw new Error('ELV2_FORBIDDEN:controller_context');
  if (ELV2_hasCapability(actor, ELV2_CAPABILITY.LIVE_CONTROL_ANY)) return true;
  if (ELV2_hasCapability(actor, ELV2_CAPABILITY.LIVE_CONTROL_OWN) && room.owner_user_id === actor.user_id) return true;
  throw new Error('ELV2_FORBIDDEN:room_control');
}