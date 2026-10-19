const approvalService = require('../services/approvalService');

const getInbox = async (req, res) => {
  const result = await approvalService.getInbox(req.user, {
    tab: req.query.tab || 'waiting',
    page: req.query.page,
    limit: req.query.limit,
  });
  res.json(result);
};

const approve = async (req, res) => {
  const instance = await approvalService.approve(
    req.params.stageInstanceId,
    req.body?.comment || null,
    req.user
  );
  res.json({ success: true, message: 'Stage approved successfully', instance });
};

const reject = async (req, res) => {
  const instance = await approvalService.reject(
    req.params.stageInstanceId,
    req.body?.comment,
    req.user
  );
  res.json({ success: true, message: 'Request rejected', instance });
};

const requestChanges = async (req, res) => {
  const instance = await approvalService.requestChanges(
    req.params.stageInstanceId,
    req.body?.comment,
    req.user
  );
  res.json({ success: true, message: 'Changes requested', instance });
};

module.exports = {
  getInbox,
  approve,
  reject,
  requestChanges,
};
