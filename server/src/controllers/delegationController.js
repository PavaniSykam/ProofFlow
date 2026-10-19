const delegationService = require('../services/delegationService');

const getDelegations = async (req, res) => {
  const result = await delegationService.getMyDelegations(req.user._id);
  res.json(result);
};

const createDelegation = async (req, res) => {
  const delegation = await delegationService.create(req.body, req.user._id);
  res.status(201).json({ delegation });
};

const revokeDelegation = async (req, res) => {
  const delegation = await delegationService.revoke(req.params.id, req.user._id);
  res.json({ success: true, delegation });
};

module.exports = {
  getDelegations,
  createDelegation,
  revokeDelegation,
};
