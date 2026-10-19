const summarizer = require('../services/ai/summarizer');
const requestService = require('../services/requestService');
const Request = require('../models/Request');
const StageInstance = require('../models/StageInstance');
const Workflow = require('../models/Workflow');
const AISummary = require('../models/AISummary');
const AppError = require('../utils/AppError');

async function checkAIAccess(requestId, user) {
  const request = await Request.findById(requestId);
  if (!request) {
    throw new AppError('NOT_FOUND', 404, 'Request not found');
  }

  // Requester or eligible approver/past actor
  const { authorized } = await requestService.checkViewAuthorization(
    request,
    user._id,
    user.roles
  );

  if (!authorized) {
    throw new AppError('NOT_FOUND', 404, 'Request not found');
  }

  return request;
}

const generateSummary = async (req, res) => {
  const request = await checkAIAccess(req.params.id, req.user);

  const [stages, workflow] = await Promise.all([
    StageInstance.find({ requestId: request._id }),
    Workflow.findById(request.workflowId),
  ]);

  const result = await summarizer.summarizeRequest({
    request,
    stages,
    workflow: workflow || { name: 'Workflow' },
    user: req.user,
  });

  res.json(result);
};

const getSummary = async (req, res) => {
  const request = await checkAIAccess(req.params.id, req.user);

  const summaryDoc = await AISummary.findOne({
    requestId: request._id,
    cycle: request.cycle,
  }).sort({ createdAt: -1 });

  if (!summaryDoc) {
    return res.json({ summary: null });
  }

  res.json({
    summary: summaryDoc.summary,
    model: summaryDoc.model,
    createdAt: summaryDoc.createdAt,
  });
};

module.exports = {
  generateSummary,
  getSummary,
};
