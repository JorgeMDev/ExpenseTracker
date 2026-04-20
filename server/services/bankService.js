const { PlaidApi, PlaidEnvironments, Configuration, Products, CountryCode } = require('plaid');
const db = require('../config/db');
const taxService = require('./taxService');
const categoryService = require('./categoryService');

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(config);

const bankService = {
  async createLinkToken(userId) {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'ExpenseTracker',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    return response.data.link_token;
  },

  async exchangePublicToken(userId, publicToken, metadata) {
    const exchange = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    const { access_token, item_id } = exchange.data;

    await db.query(
      `INSERT INTO plaid_accounts (user_id, access_token, item_id, institution_name, institution_id, accounts)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (item_id) DO UPDATE SET access_token = $2, accounts = $6`,
      [userId, access_token, item_id, metadata?.institution?.name, metadata?.institution?.institution_id, JSON.stringify(metadata?.accounts || [])]
    );

    return { item_id, institution: metadata?.institution?.name };
  },

  async syncTransactions(userId) {
    const { rows: accounts } = await db.query(
      'SELECT * FROM plaid_accounts WHERE user_id = $1',
      [userId]
    );

    let syncedCount = 0;
    for (const account of accounts) {
      try {
        const startDate = account.last_sync
          ? account.last_sync.toISOString().split('T')[0]
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];

        const txResponse = await plaidClient.transactionsGet({
          access_token: account.access_token,
          start_date: startDate,
          end_date: endDate,
          options: { count: 500 },
        });

        for (const tx of txResponse.data.transactions) {
          if (tx.amount <= 0) continue;

          const suggestedCategory = categoryService.suggestCategory(tx.name, tx.merchant_name);
          const expenseData = {
            transaction_id: tx.transaction_id,
            date: tx.date,
            amount: Math.abs(tx.amount),
            currency: tx.iso_currency_code || 'USD',
            description: tx.name,
            merchant_name: tx.merchant_name,
            type: 'personal',
            source: 'plaid',
            plaid_account_id: tx.account_id,
          };

          const enriched = taxService.analyze(expenseData);

          await db.query(
            `INSERT INTO expenses
              (user_id, transaction_id, date, amount, currency, description, merchant_name,
               type, is_deductible, deductible_percentage, deductible_amount, deduction_rule, source, plaid_account_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
             ON CONFLICT (transaction_id) DO NOTHING`,
            [userId, enriched.transaction_id, enriched.date, enriched.amount, enriched.currency,
             enriched.description, enriched.merchant_name, enriched.type, enriched.is_deductible,
             enriched.deductible_percentage, enriched.deductible_amount, enriched.deduction_rule,
             'plaid', enriched.plaid_account_id]
          );
          syncedCount++;
        }

        await db.query('UPDATE plaid_accounts SET last_sync = NOW() WHERE id = $1', [account.id]);
      } catch (err) {
        // Only log the item_id for security, not the full access token
        console.error(`Sync error for item ${account.item_id}:`, err.message);
      }
    }

    return { synced: syncedCount };
  },

  async getAccounts(userId) {
    const { rows } = await db.query(
      'SELECT id, institution_name, accounts, last_sync, created_at FROM plaid_accounts WHERE user_id = $1',
      [userId]
    );
    return rows;
  },

  async removeAccount(userId, accountId) {
    const { rows } = await db.query(
      'SELECT access_token FROM plaid_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );
    if (rows[0]) {
      await plaidClient.itemRemove({ access_token: rows[0].access_token }).catch(() => {});
    }
    await db.query('DELETE FROM plaid_accounts WHERE id = $1 AND user_id = $2', [accountId, userId]);
  },
};

module.exports = bankService;
