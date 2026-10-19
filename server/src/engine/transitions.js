const Request = require('../models/Request');
const AppError = require('../utils/AppError');

/**
 * Atomic request state transition using optimistic concurrency (rev field).
 * Uses findOneAndUpdate with the current status and rev to prevent race conditions.
 *
 * Valid transitions:
 *   draft → pending (submit)
 *   pending → pending (stage approved, more stages remain)
 *   pending → approved (last stage approved)
 *   pending → rejected (stage rejected)
 *   pending → changes_requested (stage requests changes)
 *   changes_requested → pending (resubmit)
 *   draft|pending|changes_requested → cancelled (cancel)
 *
 * @param {ObjectId} requestId
 * @param {string} fromStatus - Expected current status
 * @param {string} toStatus   - Target status
 * @param {Object} extraUpdates - Additional $set fields
 * @returns {Object} Updated request document
 * @throws {AppError} 409 if the current state doesn't match (race condition or invalid transition)
 */

const VALID_TRANSITIONS = {
  draft: ['pending', 'cancelled'],
  pending: ['pending', 'approved', 'rejected', 'changes_requested', 'cancelled'],
  changes_requested: ['pending', 'cancelled'],
  // Terminal states: no transitions out
  approved: [],
  rejected: [],
  cancelled: [],
};

async function transitionRequest(requestId, fromStatus, toStatus, extraUpdates = {}) {
  const allowed = VALID_TRANSITIONS[fromStatus];
  if (!allowed || !allowed.includes(toStatus)) {
    throw new AppError(
      'INVALID_TRANSITION',
      409,
      `Cannot transition from '${fromStatus}' to '${toStatus}'`
    );
  }

  const updateFields = {
    status: toStatus,
    ...extraUpdates,
  };

  // Terminal states get closedAt
  if (['approved', 'rejected', 'cancelled'].includes(toStatus) && !updateFields.closedAt) {
    updateFields.closedAt = new Date();
  }

  const updated = await Request.findOneAndUpdate(
    { _id: requestId, status: fromStatus },
    { $set: updateFields, $inc: { rev: 1 } },
    { new: true }
  );

  if (!updated) {
    throw new AppError(
      'CONFLICT',
      409,
      'Request state has changed. Please refresh and try again.'
    );
  }

  return updated;
}

module.exports = { transitionRequest, VALID_TRANSITIONS };
