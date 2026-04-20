const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

router.use(auth);

router.get('/summary', ctrl.summary);
router.get('/tax', ctrl.taxReport);
router.get('/daily', ctrl.dailySpend);
router.get('/deduction-suggestions', ctrl.deductionSuggestions);

module.exports = router;
