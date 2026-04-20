// Maps merchant/description keywords to category names (extensible dictionary)
const CATEGORY_MAP = {
  // Food & Dining
  'restaurant': 'Food & Dining', 'cafe': 'Food & Dining', 'coffee': 'Food & Dining',
  'starbucks': 'Food & Dining', 'mcdonald': 'Food & Dining', 'chipotle': 'Food & Dining',
  'subway': 'Food & Dining', 'uber eats': 'Business Meals', 'doordash': 'Food & Dining',
  'grubhub': 'Food & Dining', 'pizza': 'Food & Dining', 'sushi': 'Food & Dining',

  // Transportation
  'uber': 'Transportation', 'lyft': 'Transportation', 'taxi': 'Transportation',
  'gas station': 'Vehicle (Business)', 'shell': 'Vehicle (Business)', 'bp': 'Vehicle (Business)',
  'exxon': 'Vehicle (Business)', 'parking': 'Transportation', 'toll': 'Transportation',

  // Travel
  'airline': 'Travel', 'airbnb': 'Travel', 'hotel': 'Travel', 'marriott': 'Travel',
  'hilton': 'Travel', 'delta': 'Travel', 'united': 'Travel', 'american airlines': 'Travel',
  'southwest': 'Travel', 'booking.com': 'Travel', 'expedia': 'Travel',

  // Software & Subscriptions
  'aws': 'Software & Subscriptions', 'google cloud': 'Software & Subscriptions',
  'azure': 'Software & Subscriptions', 'github': 'Software & Subscriptions',
  'slack': 'Software & Subscriptions', 'notion': 'Software & Subscriptions',
  'figma': 'Software & Subscriptions', 'adobe': 'Software & Subscriptions',
  'zoom': 'Software & Subscriptions', 'dropbox': 'Software & Subscriptions',
  'microsoft': 'Software & Subscriptions', 'apple': 'Software & Subscriptions',
  'netflix': 'Entertainment', 'spotify': 'Entertainment', 'hulu': 'Entertainment',

  // Office Supplies
  'staples': 'Office Supplies', 'office depot': 'Office Supplies',
  'amazon': 'Office Supplies', 'best buy': 'Equipment',

  // Marketing
  'facebook ads': 'Marketing & Advertising', 'google ads': 'Marketing & Advertising',
  'mailchimp': 'Marketing & Advertising', 'hootsuite': 'Marketing & Advertising',

  // Professional Services
  'lawyer': 'Professional Services', 'accountant': 'Professional Services',
  'consultant': 'Professional Services', 'freelancer': 'Professional Services',

  // Healthcare
  'pharmacy': 'Healthcare', 'cvs': 'Healthcare', 'walgreens': 'Healthcare',
  'hospital': 'Healthcare', 'doctor': 'Healthcare', 'dental': 'Healthcare',

  // Phone & Internet
  'at&t': 'Phone & Internet', 'verizon': 'Phone & Internet',
  't-mobile': 'Phone & Internet', 'comcast': 'Phone & Internet',
};

const categoryService = {
  suggestCategory(description = '', merchantName = '') {
    const text = `${description} ${merchantName}`.toLowerCase();
    for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
      if (text.includes(keyword)) return category;
    }
    return 'Other';
  },
};

module.exports = categoryService;
