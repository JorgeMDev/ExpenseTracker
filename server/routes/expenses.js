const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/expenseController');
const importCtrl = require('../controllers/importController');

router.use(auth);

router.get('/', ctrl.getAll);
router.get('/summary', ctrl.getSummary);
router.post('/analyze', ctrl.analyze);
router.post('/import', importCtrl.importCSV);
router.get('/:id', ctrl.getOne);

router.post('/', [
  body('date').isDate().withMessage('Valid date required'),
  body('amount').isNumeric().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('type').isIn(['business', 'personal', 'mixed']).withMessage('Invalid type'),
], ctrl.create);

router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
