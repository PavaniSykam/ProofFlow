const Delegation = require('../models/Delegation');
const User = require('../models/User');
const Role = require('../models/Role');
const notificationService = require('./notificationService');
const AppError = require('../utils/AppError');

class DelegationService {
  async create({ delegateId, startsAt, endsAt, workflowIds = [] }, delegatorId) {
    if (delegateId.toString() === delegatorId.toString()) {
      throw new AppError('VALIDATION_ERROR', 400, 'You cannot delegate authority to yourself');
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError('VALIDATION_ERROR', 400, 'Invalid start or end date');
    }
    if (endDate <= startDate) {
      throw new AppError('VALIDATION_ERROR', 400, 'End date must be strictly after start date');
    }

    const delegator = await User.findById(delegatorId);
    const delegate = await User.findById(delegateId);

    if (!delegator || !delegator.isActive) {
      throw new AppError('FORBIDDEN', 403, 'Delegator account is inactive or not found');
    }
    if (!delegate || !delegate.isActive) {
      throw new AppError('VALIDATION_ERROR', 400, 'Delegate user must be active');
    }

    // Delegator must hold at least one approver role
    const approverRoles = await Role.find({ isApproverRole: true }).select('key');
    const approverRoleKeys = approverRoles.map((r) => r.key);
    // Fallback known approver roles if db roles not yet seeded
    const fallbackApproverRoles = ['manager', 'hr', 'finance', 'it', 'procurement', 'department_head', 'administration'];
    const allApproverKeys = Array.from(new Set([...approverRoleKeys, ...fallbackApproverRoles]));

    const delegatorApproverRoles = delegator.roles.filter((r) => allApproverKeys.includes(r));
    if (delegatorApproverRoles.length === 0) {
      throw new AppError('FORBIDDEN', 403, 'Only users with an approver role can create delegations');
    }

    // Delegate must hold at least one of delegator's approver roles (authority is never expanded)
    const sharedRoles = delegate.roles.filter((r) => delegatorApproverRoles.includes(r));
    if (sharedRoles.length === 0) {
      throw new AppError(
        'VALIDATION_ERROR',
        400,
        'Delegate must share at least one of your approver roles (authority cannot be expanded)'
      );
    }

    // Reject overlapping active delegations between the same delegator and delegate
    const overlap = await Delegation.findOne({
      delegatorId,
      delegateId,
      revokedAt: null,
      $or: [
        { startsAt: { $lte: endDate }, endsAt: { $gte: startDate } },
      ],
    });
    if (overlap) {
      throw new AppError('CONFLICT', 409, 'An active delegation already overlaps with this date range');
    }

    const delegation = new Delegation({
      delegatorId,
      delegateId,
      startsAt: startDate,
      endsAt: endDate,
      workflowIds: workflowIds || [],
    });
    await delegation.save();

    // In-app notification to the delegate
    await notificationService.notify({
      userIds: [delegate._id],
      type: 'delegation_received',
      message: `${delegator.name} has delegated approval authority to you from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}.`,
    });

    return delegation;
  }

  async getMyDelegations(userId) {
    const asDelegator = await Delegation.find({ delegatorId: userId })
      .populate('delegateId', 'name email roles')
      .sort({ createdAt: -1 })
      .lean();

    const asDelegate = await Delegation.find({ delegateId: userId })
      .populate('delegatorId', 'name email roles')
      .sort({ createdAt: -1 })
      .lean();

    return { asDelegator, asDelegate };
  }

  async revoke(delegationId, userId) {
    const delegation = await Delegation.findById(delegationId);
    if (!delegation) {
      throw new AppError('NOT_FOUND', 404, 'Delegation not found');
    }

    if (!delegation.delegatorId.equals(userId)) {
      throw new AppError('FORBIDDEN', 403, 'Only the delegator can revoke this delegation');
    }

    if (delegation.revokedAt) {
      throw new AppError('CONFLICT', 409, 'Delegation is already revoked');
    }

    delegation.revokedAt = new Date();
    await delegation.save();

    return delegation;
  }
}

module.exports = new DelegationService();
