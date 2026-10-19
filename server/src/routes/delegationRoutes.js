const express = require('express');
const delegationController = require('../controllers/delegationController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { delegationSchemas } = require('../validators/schemas');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(delegationController.getDelegations));
router.post(
  '/',
  validate(delegationSchemas.create),
  asyncHandler(delegationController.createDelegation)
);
router.post('/:id/revoke', asyncHandler(delegationController.revokeDelegation));

module.exports = router;
