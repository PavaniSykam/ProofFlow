const Workflow = require('../models/Workflow');
const WorkflowVersion = require('../models/WorkflowVersion');
const AdminChangeLog = require('../models/AdminChangeLog');
const AppError = require('../utils/AppError');

class WorkflowService {
  async getAllActive(userRoles = []) {
    const workflows = await Workflow.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    // Filter by allowedSubmitterRoles if specified
    const filtered = workflows.filter((wf) => {
      if (!wf.allowedSubmitterRoles || wf.allowedSubmitterRoles.length === 0) {
        return true;
      }
      return wf.allowedSubmitterRoles.some((role) => userRoles.includes(role));
    });

    // Attach latest version definition
    const results = await Promise.all(
      filtered.map(async (wf) => {
        const latestVersion = await WorkflowVersion.findOne({
          workflowId: wf._id,
          version: wf.currentVersion,
        }).lean();
        return {
          ...wf,
          versionDefinition: latestVersion,
        };
      })
    );

    return results;
  }

  async getAllForAdmin() {
    const workflows = await Workflow.find().sort({ createdAt: -1 }).lean();
    return Promise.all(
      workflows.map(async (wf) => {
        const latestVersion = await WorkflowVersion.findOne({
          workflowId: wf._id,
          version: wf.currentVersion,
        }).lean();
        const totalVersions = await WorkflowVersion.countDocuments({
          workflowId: wf._id,
        });
        return {
          ...wf,
          latestVersion,
          totalVersions,
        };
      })
    );
  }

  async getById(id) {
    const workflow = await Workflow.findById(id).lean();
    if (!workflow) {
      throw new AppError('NOT_FOUND', 404, 'Workflow not found');
    }

    const versionDoc = await WorkflowVersion.findOne({
      workflowId: workflow._id,
      version: workflow.currentVersion,
    }).lean();

    return {
      ...workflow,
      versionDefinition: versionDoc,
    };
  }

  async getVersions(workflowId) {
    const versions = await WorkflowVersion.find({ workflowId })
      .sort({ version: -1 })
      .populate('createdBy', 'name email')
      .lean();
    return versions;
  }

  async create(data, adminId) {
    const key = data.key.toLowerCase().trim();
    const existing = await Workflow.findOne({ key });
    if (existing) {
      throw new AppError('CONFLICT', 409, `Workflow key '${key}' already exists`);
    }

    const workflow = new Workflow({
      key,
      name: data.name.trim(),
      description: data.description || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      currentVersion: 1,
      createdBy: adminId,
      allowedSubmitterRoles: data.allowedSubmitterRoles || [],
    });
    await workflow.save();

    const versionDoc = new WorkflowVersion({
      workflowId: workflow._id,
      version: 1,
      fields: data.fields || [],
      stages: data.stages || [],
      settings: {
        allowCancel: data.settings?.allowCancel !== undefined ? data.settings.allowCancel : true,
        resubmitMode: 'restart',
      },
      createdBy: adminId,
      publishedAt: new Date(),
    });
    await versionDoc.save();

    await AdminChangeLog.create({
      adminId,
      entityType: 'workflow',
      entityId: workflow._id,
      action: 'created',
      changes: { key, name: workflow.name, version: 1 },
    });

    return this.getById(workflow._id);
  }

  async update(id, data, adminId) {
    const workflow = await Workflow.findById(id);
    if (!workflow) {
      throw new AppError('NOT_FOUND', 404, 'Workflow not found');
    }

    let createsNewVersion = false;
    if (data.fields !== undefined || data.stages !== undefined || data.settings !== undefined) {
      createsNewVersion = true;
    }

    if (data.name !== undefined) workflow.name = data.name.trim();
    if (data.description !== undefined) workflow.description = data.description;
    if (data.allowedSubmitterRoles !== undefined) {
      workflow.allowedSubmitterRoles = data.allowedSubmitterRoles;
    }
    if (data.isActive !== undefined) workflow.isActive = data.isActive;

    if (createsNewVersion) {
      const nextVersion = workflow.currentVersion + 1;
      workflow.currentVersion = nextVersion;

      // Fetch previous version to fallback unchanged properties
      const prevVersion = await WorkflowVersion.findOne({
        workflowId: workflow._id,
        version: workflow.currentVersion - 1,
      }).lean();

      const newVersionDoc = new WorkflowVersion({
        workflowId: workflow._id,
        version: nextVersion,
        fields: data.fields !== undefined ? data.fields : prevVersion?.fields || [],
        stages: data.stages !== undefined ? data.stages : prevVersion?.stages || [],
        settings: {
          allowCancel:
            data.settings?.allowCancel !== undefined
              ? data.settings.allowCancel
              : prevVersion?.settings?.allowCancel ?? true,
          resubmitMode: 'restart',
        },
        createdBy: adminId,
        publishedAt: new Date(),
      });
      await newVersionDoc.save();
    }

    await workflow.save();

    await AdminChangeLog.create({
      adminId,
      entityType: 'workflow',
      entityId: workflow._id,
      action: 'updated',
      changes: {
        currentVersion: workflow.currentVersion,
        createsNewVersion,
      },
    });

    return this.getById(workflow._id);
  }

  async toggleActive(id, isActive, adminId) {
    const workflow = await Workflow.findById(id);
    if (!workflow) {
      throw new AppError('NOT_FOUND', 404, 'Workflow not found');
    }

    workflow.isActive = isActive;
    await workflow.save();

    await AdminChangeLog.create({
      adminId,
      entityType: 'workflow',
      entityId: workflow._id,
      action: 'updated',
      changes: { isActive },
    });

    return workflow;
  }
}

module.exports = new WorkflowService();
