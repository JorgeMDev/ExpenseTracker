const router = require('express').Router();
const auth = require('../middleware/auth');
const bankService = require('../services/bankService');

router.use(auth);

router.post('/link-token', async (req, res, next) => {
  try {
    const linkToken = await bankService.createLinkToken(req.user.id);
    res.json({ link_token: linkToken });
  } catch (err) { next(err); }
});

router.post('/exchange-token', async (req, res, next) => {
  try {
    const { public_token, metadata } = req.body;
    const result = await bankService.exchangePublicToken(req.user.id, public_token, metadata);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/sync', async (req, res, next) => {
  try {
    const result = await bankService.syncTransactions(req.user.id);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/accounts', async (req, res, next) => {
  try {
    const accounts = await bankService.getAccounts(req.user.id);
    res.json({ accounts });
  } catch (err) { next(err); }
});

router.delete('/accounts/:id', async (req, res, next) => {
  try {
    await bankService.removeAccount(req.user.id, req.params.id);
    res.json({ message: 'Account disconnected' });
  } catch (err) { next(err); }
});

module.exports = router;
