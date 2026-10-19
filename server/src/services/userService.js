const User = require('../models/User');
const Department = require('../models/Department');
const Role = require('../models/Role');
const AdminChangeLog = require('../models/AdminChangeLog');
const StageInstance = require('../models/StageInstance');
const AppError = require('../utils/AppError');
const authService = require('./authService');

class UserService {
  async getAll({ page = 1, limit = 20, search, departmentId, role, isActive } = {}) {
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (departmentId) query.departmentId = departmentId;
    if (role) query.roles = role;
    if (isActive !== undefined) query.isActive = isActive === 'true' || isActive === true;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(query)
        .populate('departmentId', 'name code')
        .populate('managerId', 'name email')
        .sort({ name: 1 })
        .skip(skip)
        .limit(Math.min(limit, 100))
        .lean(),
      User.countDocuments(query),
    ]);
    return { items, total, page, limit };
  }

  async getById(id) {
    const user = await User.findById(id)
      .populate('departmentId', 'name code')
      .populate('managerId', 'name email');
    if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');
    return user;
  }

  async create(data, adminId) {
    // Validate no self-manager
    if (data.managerId && data.managerId.toString() === 'self') {
      throw new AppError('VALIDATION_ERROR', 400, 'A user cannot be their own manager');
    }

    // Validate manager exists and is active
    if (data.managerId) {
      const manager = await User.findById(data.managerId);
      if (!manager) throw new AppError('VALIDATION_ERROR', 400, 'Manager not found');
      if (!manager.isActive) throw new AppError('VALIDATION_ERROR', 400, 'Manager is not active');
    }

    // Validate department exists
    if (data.departmentId) {
      const dept = await Department.findById(data.departmentId);
      if (!dept) throw new AppError('VALIDATION_ERROR', 400, 'Department not found');
    }

    // Validate roles exist
    if (data.roles && data.roles.length > 0) {
      const validRoles = await Role.find({ key: { $in: data.roles } });
      const validKeys = validRoles.map((r) => r.key);
      const invalid = data.roles.filter((r) => !validKeys.includes(r));
      if (invalid.length > 0) {
        throw new AppError('VALIDATION_ERROR', 400, `Invalid roles: ${invalid.join(', ')}`);
      }
    }

    const passwordHash = await authService.hashPassword(data.password || 'changeme123');

    const user = new User({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      roles: data.roles || [],
      departmentId: data.departmentId || null,
      managerId: data.managerId || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      mustChangePassword: true,
    });

    // Check for self-manager after id assignment
    await user.save();

    if (data.managerId && user._id.equals(data.managerId)) {
      await User.findByIdAndDelete(user._id);
      throw new AppError('VALIDATION_ERROR', 400, 'A user cannot be their own manager');
    }

    // Check for manager cycle
    if (data.managerId) {
      const hasCycle = await this.detectManagerCycle(user._id, data.managerId);
      if (hasCycle) {
        await User.findByIdAndUpdate(user._id, { managerId: null });
        throw new AppError('VALIDATION_ERROR', 400, 'Manager assignment would create a cycle');
      }
    }

    // Log admin change
    await AdminChangeLog.create({
      adminId,
      entityType: 'user',
      entityId: user._id,
      action: 'created',
      changes: { name: data.name, email: data.email, roles: data.roles },
    });

    return this.getById(user._id);
  }

  async update(id, data, adminId) {
    const user = await User.findById(id);
    if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');

    const changes = {};

    // Self-manager check
    if (data.managerId !== undefined) {
      if (data.managerId && data.managerId.toString() === id.toString()) {
        throw new AppError('VALIDATION_ERROR', 400, 'A user cannot be their own manager');
      }
      if (data.managerId) {
        const manager = await User.findById(data.managerId);
        if (!manager) throw new AppError('VALIDATION_ERROR', 400, 'Manager not found');
        if (!manager.isActive) throw new AppError('VALIDATION_ERROR', 400, 'Manager is not active');
        // Cycle detection
        const hasCycle = await this.detectManagerCycle(id, data.managerId);
        if (hasCycle) {
          throw new AppError('VALIDATION_ERROR', 400, 'Manager assignment would create a cycle');
        }
      }
      changes.managerId = { from: user.managerId, to: data.managerId };
      user.managerId = data.managerId || null;
    }

    if (data.name !== undefined) {
      changes.name = { from: user.name, to: data.name };
      user.name = data.name;
    }

    if (data.email !== undefined) {
      changes.email = { from: user.email, to: data.email };
      user.email = data.email.toLowerCase();
    }

    if (data.roles !== undefined) {
      // Validate roles
      if (data.roles.length > 0) {
        const validRoles = await Role.find({ key: { $in: data.roles } });
        const validKeys = validRoles.map((r) => r.key);
        const invalid = data.roles.filter((r) => !validKeys.includes(r));
        if (invalid.length > 0) {
          throw new AppError('VALIDATION_ERROR', 400, `Invalid roles: ${invalid.join(', ')}`);
        }
      }
      changes.roles = { from: user.roles, to: data.roles };
      user.roles = data.roles;
      // Increment tokenVersion when roles change
      user.tokenVersion += 1;
    }

    if (data.departmentId !== undefined) {
      changes.departmentId = { from: user.departmentId, to: data.departmentId };
      user.departmentId = data.departmentId || null;
    }

    await user.save();

    // Log admin change
    if (Object.keys(changes).length > 0) {
      await AdminChangeLog.create({
        adminId,
        entityType: 'user',
        entityId: user._id,
        action: 'updated',
        changes,
      });
    }

    return this.getById(user._id);
  }

  async deactivate(id, confirmOrAdminId, maybeAdminId) {
    const adminId = maybeAdminId || confirmOrAdminId;
    const user = await User.findById(id);
    if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');

    // Check for direct reports
    const directReports = await User.countDocuments({ managerId: id, isActive: true });

    // Check for active stage instances
    const activeStages = await StageInstance.countDocuments({
      $or: [
        { assignedTo: id, status: 'active' },
        { escalatedTo: id, status: 'active' },
      ],
    });

    user.isActive = false;
    user.tokenVersion += 1; // Invalidate existing tokens
    await user.save();

    await AdminChangeLog.create({
      adminId,
      entityType: 'user',
      entityId: user._id,
      action: 'deactivated',
      changes: { directReports, activeStages },
    });

    return {
      user: await this.getById(user._id),
      warnings: {
        directReports,
        activeStages,
        message: directReports > 0 || activeStages > 0
          ? 'This user has direct reports or active stages that need reassignment'
          : null,
      },
    };
  }

  async resetPassword(id, newPasswordOrAdminId, maybeAdminId) {
    const adminId = maybeAdminId || newPasswordOrAdminId;
    const user = await User.findById(id);
    if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');

    const tempPassword = typeof newPasswordOrAdminId === 'string' && newPasswordOrAdminId.length > 24
      ? newPasswordOrAdminId
      : 'TempPass@' + Math.random().toString(36).slice(2, 8);

    user.passwordHash = await authService.hashPassword(tempPassword);
    user.mustChangePassword = true;
    user.tokenVersion += 1;
    await user.save();

    await AdminChangeLog.create({
      adminId,
      entityType: 'user',
      entityId: user._id,
      action: 'password_reset',
      changes: {},
    });

    return { tempPassword };
  }

  /**
   * Detect if assigning managerId would create a cycle in the reporting chain.
   */
  async detectManagerCycle(userId, managerId, maxDepth = 20) {
    let currentId = managerId;
    let depth = 0;
    const userIdStr = userId.toString();

    while (currentId && depth < maxDepth) {
      if (currentId.toString() === userIdStr) return true;
      const mgr = await User.findById(currentId).select('managerId');
      if (!mgr) return false;
      currentId = mgr.managerId;
      depth++;
    }
    return false;
  }

  /**
   * Build org chart data.
   */
  async getOrgChart() {
    const users = await User.find({ isActive: true })
      .select('name email roles departmentId managerId')
      .populate('departmentId', 'name code')
      .lean();

    return users;
  }

  /**
   * Lookup users with limited fields (for pickers).
   */
  async lookup({ search, departmentId, role, isActive = true } = {}) {
    const query = { isActive };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (departmentId) query.departmentId = departmentId;
    if (role) query.roles = role;

    return User.find(query)
      .select('name email roles departmentId')
      .populate('departmentId', 'name')
      .limit(50)
      .lean();
  }
}

module.exports = new UserService();
