const User = require('../models/User');
const Department = require('../models/Department');
const logger = require('../utils/logger');

/**
 * CRITICAL: Approver resolution engine.
 * Resolves assignees for a stage based on the approver configuration.
 * All behavior comes from stored data, never from workflow-specific code.
 *
 * Types: REPORTING_MANAGER, DEPARTMENT_HEAD, ROLE, SPECIFIC_USER
 *
 * Self-approval prevention: the requester is NEVER included in the result.
 * If no valid assignee can be found, returns { assignees: [], needsAdminAttention: true }.
 */

/**
 * Climb the manager chain from a starting user, looking for an active person
 * who is not the requester. Returns null if the chain ends with no valid person.
 * Max depth prevents infinite loops in case of data corruption.
 */
async function climbManagerChain(startUserId, requesterId, maxDepth = 10) {
  let currentId = startUserId;
  let depth = 0;

  while (currentId && depth < maxDepth) {
    const mgr = await User.findById(currentId);
    if (!mgr) return null;
    if (mgr.isActive && !mgr._id.equals(requesterId)) {
      return mgr;
    }
    currentId = mgr.managerId;
    depth++;
  }
  return null;
}

/**
 * Resolve assignees for a stage.
 *
 * @param {Object} stageDef - The stage definition from the workflow version
 * @param {Object} request  - The request document
 * @param {Object} requester - The requester user document
 * @returns {{ assignees: ObjectId[], needsAdminAttention: boolean }}
 */
async function resolveAssignees(stageDef, request, requester) {
  const approverConfig = stageDef.approver;
  const requesterId = requester._id;
  let assignees = [];
  let needsAdminAttention = false;

  const rawType = (approverConfig.type || '').toLowerCase();
  const type = rawType === 'specific_user' ? 'user' : rawType;

  switch (type) {
    case 'reporting_manager': {
      // Resolve to exactly one user: the requester's managerId.
      // If missing, inactive, or equals the requester, climb the chain.
      // Fall back to department head. Otherwise needsAdminAttention.
      let manager = null;

      if (requester.managerId) {
        manager = await climbManagerChain(requester.managerId, requesterId);
      }

      if (!manager) {
        // Fall back to department head
        const dept = await Department.findById(requester.departmentId);
        if (dept && dept.headUserId) {
          const head = await User.findById(dept.headUserId);
          if (head && head.isActive && !head._id.equals(requesterId)) {
            manager = head;
          } else if (head && head.managerId) {
            // Department head IS the requester; climb from their manager
            manager = await climbManagerChain(head.managerId, requesterId);
          }
        }
      }

      if (manager) {
        assignees = [manager._id];
      } else {
        needsAdminAttention = true;
        logger.warn(`resolveAssignees: No valid reporting_manager found for request ${request._id}, requester ${requesterId}`);
      }
      break;
    }

    case 'department_head': {
      // Head of the requester's department, never the requester.
      const dept = await Department.findById(requester.departmentId);
      if (dept && dept.headUserId) {
        const head = await User.findById(dept.headUserId);
        if (head && head.isActive && !head._id.equals(requesterId)) {
          assignees = [head._id];
        } else if (head && head.managerId) {
          // Head IS the requester; climb to their manager
          const fallback = await climbManagerChain(head.managerId, requesterId);
          if (fallback) {
            assignees = [fallback._id];
          } else {
            needsAdminAttention = true;
          }
        } else {
          needsAdminAttention = true;
        }
      } else {
        needsAdminAttention = true;
        logger.warn(`resolveAssignees: No department head for department ${requester.departmentId}`);
      }
      break;
    }

    case 'role': {
      // All active users holding roleKey, optionally same department, excluding requester.
      const query = {
        roles: approverConfig.roleKey,
        isActive: true,
        _id: { $ne: requesterId },
      };
      if (approverConfig.sameDepartmentAsRequester) {
        query.departmentId = requester.departmentId;
      }
      const holders = await User.find(query).select('_id');
      assignees = holders.map((u) => u._id);

      if (assignees.length === 0) {
        needsAdminAttention = true;
        logger.warn(`resolveAssignees: No active users with role '${approverConfig.roleKey}' (excluding requester)`);
      }
      break;
    }

    case 'user': {
      // Specific configured user, if active and not the requester.
      const specUser = await User.findById(approverConfig.userId);
      if (specUser && specUser.isActive && !specUser._id.equals(requesterId)) {
        assignees = [specUser._id];
      } else if (specUser && specUser._id.equals(requesterId)) {
        // Climb the requester's manager chain
        if (requester.managerId) {
          const fallback = await climbManagerChain(requester.managerId, requesterId);
          if (fallback) {
            assignees = [fallback._id];
          } else {
            needsAdminAttention = true;
          }
        } else {
          needsAdminAttention = true;
        }
      } else {
        needsAdminAttention = true;
      }
      break;
    }

    default:
      needsAdminAttention = true;
      logger.error(`resolveAssignees: Unknown approver type '${approverConfig.type}'`);
  }

  return { assignees, needsAdminAttention };
}

module.exports = { resolveAssignees, climbManagerChain };
