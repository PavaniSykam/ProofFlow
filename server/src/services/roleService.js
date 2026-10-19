const Role = require('../models/Role');
const AdminChangeLog = require('../models/AdminChangeLog');
const AppError = require('../utils/AppError');

class RoleService {
  async getAll() {
    return Role.find().sort({ name: 1 }).lean();
  }

  async getByKey(key) {
    const role = await Role.findOne({ key: key.toLowerCase() });
    if (!role) throw new AppError('NOT_FOUND', 404, `Role '${key}' not found`);
    return role;
  }

  async create(data, adminId) {
    const key = data.key.toLowerCase().trim();
    const existing = await Role.findOne({ key });
    if (existing) {
      throw new AppError('CONFLICT', 409, `Role '${key}' already exists`);
    }

    const role = new Role({
      key,
      name: data.name.trim(),
      isApproverRole: data.isApproverRole ?? false,
      isSystem: false,
    });
    await role.save();

    await AdminChangeLog.create({
      adminId,
      entityType: 'role',
      entityId: role._id,
      action: 'created',
      changes: { key, name: role.name, isApproverRole: role.isApproverRole },
    });

    return role;
  }

  async update(key, data, adminId) {
    const role = await Role.findOne({ key: key.toLowerCase() });
    if (!role) throw new AppError('NOT_FOUND', 404, `Role '${key}' not found`);

    if (role.isSystem && data.isApproverRole !== undefined && data.isApproverRole !== role.isApproverRole) {
      throw new AppError('FORBIDDEN', 403, 'System role flags cannot be altered');
    }

    const changes = {};
    if (data.name !== undefined && data.name !== role.name) {
      changes.name = { from: role.name, to: data.name };
      role.name = data.name.trim();
    }
    if (data.isApproverRole !== undefined && data.isApproverRole !== role.isApproverRole) {
      changes.isApproverRole = { from: role.isApproverRole, to: data.isApproverRole };
      role.isApproverRole = data.isApproverRole;
    }

    await role.save();

    if (Object.keys(changes).length > 0) {
      await AdminChangeLog.create({
        adminId,
        entityType: 'role',
        entityId: role._id,
        action: 'updated',
        changes,
      });
    }

    return role;
  }
}

module.exports = new RoleService();
