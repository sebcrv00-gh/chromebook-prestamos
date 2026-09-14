const { Router } = require('express');
const reportsController = require('./reports.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { ROLES } = require('../../utils/constants');

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN, ROLES.SUPERADMIN));

// GET /api/reports/dashboard - General summary
router.get('/dashboard', reportsController.getDashboardSummary);

// GET /api/reports/usage - Usage report
router.get('/usage', reportsController.getUsageReport);

// GET /api/reports/audit - Audit logs
router.get('/audit', reportsController.getAuditLogs);

module.exports = router;
