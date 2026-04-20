// IRS-based deduction rules (US). Each rule defines conditions and deductible percentage.
// Structure: { rule_id, name, description, percentage, conditions }
const DEDUCTION_RULES = {
  BUSINESS_MEALS: {
    name: 'Business Meals (50%)',
    description: 'Meals with clients or for business purposes are 50% deductible.',
    percentage: 50,
    categories: ['Business Meals'],
    types: ['business', 'mixed'],
    keywords: ['dinner', 'lunch', 'breakfast', 'client meal', 'team lunch', 'business meal'],
  },
  BUSINESS_TRAVEL: {
    name: 'Business Travel (100%)',
    description: 'Flights, hotels, and transportation for business travel are fully deductible.',
    percentage: 100,
    categories: ['Travel'],
    types: ['business'],
    keywords: ['business trip', 'conference', 'client visit'],
  },
  HOME_OFFICE: {
    name: 'Home Office (100%)',
    description: 'Expenses for a dedicated home office space are fully deductible.',
    percentage: 100,
    categories: ['Home Office'],
    types: ['business', 'mixed'],
    keywords: ['home office', 'office rent', 'workspace'],
  },
  PHONE_INTERNET: {
    name: 'Phone & Internet (Business %)',
    description: 'Business portion of phone and internet is deductible.',
    percentage: 50,
    categories: ['Phone & Internet'],
    types: ['business', 'mixed'],
    keywords: ['phone', 'internet', 'wifi', 'cellular', 'broadband'],
  },
  SOFTWARE: {
    name: 'Business Software (100%)',
    description: 'Software and SaaS subscriptions used for business are fully deductible.',
    percentage: 100,
    categories: ['Software & Subscriptions'],
    types: ['business'],
    keywords: ['software', 'subscription', 'saas', 'license', 'cloud service'],
  },
  MARKETING: {
    name: 'Marketing & Advertising (100%)',
    description: 'All marketing and advertising expenses are fully deductible.',
    percentage: 100,
    categories: ['Marketing & Advertising'],
    types: ['business'],
    keywords: ['advertising', 'marketing', 'promotion', 'campaign', 'social media'],
  },
  PROFESSIONAL_SERVICES: {
    name: 'Professional Services (100%)',
    description: 'Legal, accounting, and consulting fees are fully deductible.',
    percentage: 100,
    categories: ['Professional Services'],
    types: ['business'],
    keywords: ['legal', 'accounting', 'consulting', 'advisory', 'attorney'],
  },
  OFFICE_SUPPLIES: {
    name: 'Office Supplies (100%)',
    description: 'Office supplies and materials used for business are fully deductible.',
    percentage: 100,
    categories: ['Office Supplies'],
    types: ['business'],
    keywords: ['office supply', 'paper', 'printer', 'stationery', 'desk'],
  },
  EQUIPMENT: {
    name: 'Business Equipment (100%)',
    description: 'Equipment purchased for business use can be fully expensed (Section 179).',
    percentage: 100,
    categories: ['Equipment'],
    types: ['business'],
    keywords: ['computer', 'laptop', 'monitor', 'equipment', 'hardware', 'device'],
  },
  VEHICLE: {
    name: 'Vehicle Business Use (Mileage)',
    description: 'Business vehicle expenses are deductible based on actual business use %.',
    percentage: 100,
    categories: ['Vehicle (Business)', 'Transportation'],
    types: ['business'],
    keywords: ['mileage', 'vehicle', 'car rental', 'auto', 'gas', 'fuel'],
  },
  EDUCATION: {
    name: 'Professional Development (100%)',
    description: 'Education and training directly related to your business is deductible.',
    percentage: 100,
    categories: ['Education'],
    types: ['business'],
    keywords: ['course', 'training', 'workshop', 'conference', 'certification', 'book', 'seminar'],
  },
  INSURANCE: {
    name: 'Business Insurance (100%)',
    description: 'Business insurance premiums are fully deductible.',
    percentage: 100,
    categories: ['Insurance (Business)'],
    types: ['business'],
    keywords: ['insurance', 'liability', 'premium', 'coverage'],
  },
};

const taxService = {
  analyze(expenseData) {
    const { type, category_id, description = '', merchant_name = '', amount = 0 } = expenseData;
    const text = `${description} ${merchant_name}`.toLowerCase();

    if (type === 'personal') {
      return {
        ...expenseData,
        is_deductible: false,
        deductible_percentage: 0,
        deductible_amount: 0,
        deduction_rule: null,
      };
    }

    for (const [ruleId, rule] of Object.entries(DEDUCTION_RULES)) {
      if (!rule.types.includes(type)) continue;

      const keywordMatch = rule.keywords.some(k => text.includes(k));
      if (keywordMatch) {
        const pct = rule.percentage;
        return {
          ...expenseData,
          is_deductible: true,
          deductible_percentage: pct,
          deductible_amount: parseFloat(((amount * pct) / 100).toFixed(2)),
          deduction_rule: ruleId,
        };
      }
    }

    // Default: business expenses without a specific rule are fully deductible
    if (type === 'business') {
      return {
        ...expenseData,
        is_deductible: true,
        deductible_percentage: 100,
        deductible_amount: parseFloat(amount),
        deduction_rule: 'GENERAL_BUSINESS',
      };
    }

    return {
      ...expenseData,
      is_deductible: false,
      deductible_percentage: 0,
      deductible_amount: 0,
      deduction_rule: null,
    };
  },

  getSuggestions(expenses = []) {
    return expenses
      .filter(e => !e.is_deductible && e.type !== 'personal')
      .map(e => {
        const text = `${e.description} ${e.merchant_name || ''}`.toLowerCase();
        for (const [ruleId, rule] of Object.entries(DEDUCTION_RULES)) {
          if (rule.keywords.some(k => text.includes(k))) {
            return {
              expense_id: e.id,
              description: e.description,
              amount: e.amount,
              rule: rule.name,
              rule_description: rule.description,
              potential_deduction: parseFloat(((e.amount * rule.percentage) / 100).toFixed(2)),
            };
          }
        }
        return null;
      })
      .filter(Boolean);
  },

  getRules() {
    return Object.entries(DEDUCTION_RULES).map(([id, rule]) => ({
      id,
      name: rule.name,
      description: rule.description,
      percentage: rule.percentage,
    }));
  },
};

module.exports = taxService;
