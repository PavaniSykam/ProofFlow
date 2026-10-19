const Department = require('../models/Department');
const AdminChangeLog = require('../models/AdminChangeLog');
const User = require('../models/User');
const AppError = require('../utils/AppError');

class DepartmentService {
  async getAll() {
    return Department.find()
      .populate('headUserId', 'name email')
      .sort({ name: 1 })
      .lean();
  }

  async getById(id) {
    const dept = await Department.findById(id).populate('headUserId', 'name email');
    if (!dept) throw new AppError('NOT_FOUND', 404, 'Department not found');
    return dept;
  }

  async create(data, adminId) {
    if (data.headUserId) {
      const head = await User.findById(data.headUserId);
      if (!head) throw new AppError('VALIDATION_ERROR', 400, 'Head user not found');
    }

    const dept = new Department({
      name: data.name,
      code: data.code.toUpperCase(),
      headUserId: data.headUserId || null,
      isActive: true,
    });
    await dept.save();

    await AdminChangeLog.create({
      adminId,
      entityType: 'department',
      entityId: dept._id,
      action: 'created',
      changes: { name: data.name, code: data.code },
    });

    return this.getById(dept._id);
  }

  async update(id, data, adminId) {
    const dept = await Department.findById(id);
    if (!dept) throw new AppError('NOT_FOUND', 404, 'Department not found');

    const changes = {};

    if (data.name !== undefined) {
      changes.name = { from: dept.name, to: data.name };
      dept.name = data.name;
    }
    if (data.code !== undefined) {
      changes.code = { from: dept.code, to: data.code };
      dept.code = data.code.toUpperCase();
    }
    if (data.headUserId !== undefined) {
      if (data.headUserId) {
        const head = await User.findById(data.headUserId);
        if (!head) throw new AppError('VALIDATION_ERROR', 400, 'Head user not found');
      }
      changes.headUserId = { from: dept.headUserId, to: data.headUserId };
      dept.headUserId = data.headUserId || null;
    }
    if (data.isActive !== undefined) {
      changes.isActive = { from: dept.isActive, to: data.isActive };
      dept.isActive = data.isActive;
    }

    await dept.save();

    if (Object.keys(changes).length > 0) {
      await AdminChangeLog.create({
        adminId,
        entityType: 'department',
        entityId: dept._id,
        action: 'updated',
        changes,
      });
    }

    return this.getById(dept._id);
  }
}

module.exports = new DepartmentService();
