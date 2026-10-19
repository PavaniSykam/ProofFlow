const cron = require('node-cron');
const StageInstance = require('../models/StageInstance');
const Request = require('../models/Request');
const WorkflowVersion = require('../models/WorkflowVersion');
const User = require('../models/User');
const Department = require('../models/Department');
const Organization = require('../models/Organization');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const { climbManagerChain } = require('../engine/resolveAssignees');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Resolve the escalation target user(s).
 * Targets: manager_of_approver, role, user.
 * Excludes: requester, inactive users.
 */
async function resolveEscalationTarget(targetDef, instance, request) {
  const requesterId = request.requesterId;
  const approverIds = instance.assignedTo || [];

  switch (targetDef.type) {
    case 'manager_of_approver': {
      // Find the first assigned approver and climb their manager chain
      for (const approverId of approverIds) {
        const approver = await User.findById(approverId);
        if (approver && approver.managerId) {
          const target = await climbManagerChain(approver.managerId, requesterId);
          if (target && target.isActive) {
            return [target._id];
          }
        }
      }
      return [];
    }

    case 'role': {
      const holders = await User.find({
        roles: targetDef.roleKey,
        isActive: true,
        _id: { $ne: requesterId },
      }).select('_id');
      return holders.map((u) => u._id);
    }

    case 'user': {
      const targetUser = await User.findById(targetDef.userId);
      if (targetUser && targetUser.isActive && !targetUser._id.equals(requesterId)) {
        return [targetUser._id];
      }
      return [];
    }

    default:
      return [];
  }
}

/**
 * Run the three SLA passes (idempotent):
 * 1. Reminder
 * 2. Overdue notice
 * 3. Escalation
 *
 * Can be called with an optional `nowDate` for testing time shifts.
 */
async function runSlaPasses(nowDate = new Date()) {
  const org = await Organization.findOne().lean();
  const defaultReminderPercent = org?.settings?.reminderPercent || 75;

  // Pass 1: Reminders
  try {
    const activeInstances = await StageInstance.find({
      status: 'active',
      reminderSentAt: null,
      dueAt: { $ne: null },
      activatedAt: { $ne: null },
    });

    for (const inst of activeInstances) {
      try {
        const activatedTime = new Date(inst.activatedAt).getTime();
        const dueTime = new Date(inst.dueAt).getTime();
        const totalDuration = dueTime - activatedTime;
        if (totalDuration <= 0) continue;

        const reminderThreshold = activatedTime + (totalDuration * defaultReminderPercent) / 100;

        if (nowDate.getTime() >= reminderThreshold) {
          // Atomic update to ensure it fires only once
          const updated = await StageInstance.findOneAndUpdate(
            { _id: inst._id, reminderSentAt: null, status: 'active' },
            { $set: { reminderSentAt: nowDate } },
            { new: true }
          );

          if (updated && updated.assignedTo.length > 0) {
            const req = await Request.findById(inst.requestId);
            await notificationService.notify({
              userIds: updated.assignedTo,
              type: 'sla_reminder',
              requestId: inst.requestId,
              message: `Reminder: Stage '${inst.name}' for request ${req?.requestNumber || ''} is approaching its deadline.`,
              dedupeKey: `reminder:${inst._id}`,
            });

            await auditService.record({
              requestId: inst.requestId,
              requestNumber: req?.requestNumber,
              actorId: null, // system
              action: 'reminder_sent',
              fromStatus: req?.status,
              toStatus: req?.status,
              stageKey: inst.stageKey,
              cycle: inst.cycle,
              details: { stageName: inst.name, dueAt: inst.dueAt },
            });
          }
        }
      } catch (err) {
        logger.error(`SLA Pass 1 error on instance ${inst._id}:`, err);
      }
    }
  } catch (err) {
    logger.error('SLA Pass 1 (reminders) failed:', err);
  }

  // Pass 2: Overdue Notices
  try {
    const overdueInstances = await StageInstance.find({
      status: 'active',
      overdueNotifiedAt: null,
      dueAt: { $lt: nowDate },
    });

    for (const inst of overdueInstances) {
      try {
        const updated = await StageInstance.findOneAndUpdate(
          { _id: inst._id, overdueNotifiedAt: null, status: 'active' },
          { $set: { overdueNotifiedAt: nowDate } },
          { new: true }
        );

        if (updated) {
          const req = await Request.findById(inst.requestId);
          const notifyRecipients = [...(updated.assignedTo || [])];
          if (req?.requesterId) notifyRecipients.push(req.requesterId);

          await notificationService.notify({
            userIds: notifyRecipients,
            type: 'overdue',
            requestId: inst.requestId,
            message: `Stage '${inst.name}' for request ${req?.requestNumber || ''} is now overdue.`,
            dedupeKey: `overdue:${inst._id}`,
          });

          await auditService.record({
            requestId: inst.requestId,
            requestNumber: req?.requestNumber,
            actorId: null,
            action: 'marked_overdue',
            fromStatus: req?.status,
            toStatus: req?.status,
            stageKey: inst.stageKey,
            cycle: inst.cycle,
            details: { stageName: inst.name, dueAt: inst.dueAt },
          });
        }
      } catch (err) {
        logger.error(`SLA Pass 2 error on instance ${inst._id}:`, err);
      }
    }
  } catch (err) {
    logger.error('SLA Pass 2 (overdue notices) failed:', err);
  }

  // Pass 3: Escalation
  try {
    const activeInstances = await StageInstance.find({
      status: 'active',
      dueAt: { $lt: nowDate },
    });

    for (const inst of activeInstances) {
      try {
        const req = await Request.findById(inst.requestId);
        if (!req || req.status !== 'pending') continue;

        const version = await WorkflowVersion.findById(req.workflowVersionId);
        if (!version) continue;

        const stageDef = version.stages.find((s) => s.key === inst.stageKey);
        if (!stageDef || !stageDef.escalation?.enabled) continue;

        const esc = stageDef.escalation;
        const maxLevels = esc.maxLevels || 2;
        if (inst.escalationLevel >= maxLevels) {
          continue; // Max levels reached
        }

        const afterHoursOverdue = esc.afterHoursOverdue || 0;
        const dueTime = new Date(inst.dueAt).getTime();
        const escalationThreshold = dueTime + afterHoursOverdue * 60 * 60 * 1000;

        if (nowDate.getTime() >= escalationThreshold) {
          // Resolve escalation target
          const targetUserIds = await resolveEscalationTarget(esc.target, inst, req);

          if (targetUserIds.length === 0) {
            // No valid escalation target
            await StageInstance.findByIdAndUpdate(inst._id, { needsAdminAttention: true });
            const admins = await User.find({ roles: 'admin', isActive: true }).select('_id');
            await notificationService.notify({
              userIds: admins.map((a) => a._id),
              type: 'needs_admin_attention',
              requestId: req._id,
              message: `Escalation failed for stage '${inst.name}' (no valid target); requires admin attention.`,
              dedupeKey: `esc_fail:${inst._id}:${inst.escalationLevel}`,
            });
            continue;
          }

          const nextSlaHours = esc.nextSlaHours || 24;
          const newDueAt = new Date(nowDate.getTime() + nextSlaHours * 60 * 60 * 1000);

          // Atomic escalation level increment
          const updated = await StageInstance.findOneAndUpdate(
            { _id: inst._id, escalationLevel: inst.escalationLevel, status: 'active' },
            {
              $addToSet: { escalatedTo: { $each: targetUserIds } },
              $inc: { escalationLevel: 1 },
              $set: { dueAt: newDueAt, overdueNotifiedAt: null, reminderSentAt: null },
            },
            { new: true }
          );

          if (updated) {
            // Notify escalated targets and requester
            await notificationService.notify({
              userIds: targetUserIds,
              type: 'escalation',
              requestId: req._id,
              message: `Request ${req.requestNumber} (stage '${inst.name}') has been escalated to you.`,
            });
            await notificationService.notify({
              userIds: [req.requesterId],
              type: 'escalation',
              requestId: req._id,
              message: `Your request ${req.requestNumber} (stage '${inst.name}') has been escalated.`,
            });

            await auditService.record({
              requestId: req._id,
              requestNumber: req.requestNumber,
              actorId: null, // system
              action: 'escalated',
              fromStatus: req.status,
              toStatus: req.status,
              stageKey: inst.stageKey,
              cycle: inst.cycle,
              details: {
                stageName: inst.name,
                escalationLevel: updated.escalationLevel,
                escalatedTo: targetUserIds,
                newDueAt,
              },
            });
          }
        }
      } catch (err) {
        logger.error(`SLA Pass 3 error on instance ${inst._id}:`, err);
      }
    }
  } catch (err) {
    logger.error('SLA Pass 3 (escalation) failed:', err);
  }
}

let cronTask = null;

function startScheduler() {
  const intervalSeconds = config.schedulerIntervalSeconds || 60;
  // Standard cron format for every X seconds or minutes
  // In node-cron, `* * * * *` is every minute.
  cronTask = cron.schedule('* * * * *', async () => {
    logger.debug('Running SLA scheduler tick');
    await runSlaPasses();
  });
  logger.info(`SLA scheduler started (interval: ${intervalSeconds}s)`);
}

function stopScheduler() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
}

module.exports = {
  runSlaPasses,
  startScheduler,
  stopScheduler,
  resolveEscalationTarget,
};
