-- Default categories (is_default = true, user_id = null means global)
INSERT INTO categories (name, type, icon, color, is_default) VALUES
  ('Food & Dining', 'personal', 'utensils', '#F59E0B', true),
  ('Transportation', 'personal', 'car', '#3B82F6', true),
  ('Housing', 'personal', 'home', '#8B5CF6', true),
  ('Healthcare', 'personal', 'heart', '#EF4444', true),
  ('Entertainment', 'personal', 'film', '#EC4899', true),
  ('Shopping', 'personal', 'shopping-bag', '#14B8A6', true),
  ('Education', 'personal', 'book', '#6366F1', true),
  ('Travel', 'mixed', 'plane', '#0EA5E9', true),
  ('Business Meals', 'business', 'briefcase', '#F97316', true),
  ('Office Supplies', 'business', 'clipboard', '#84CC16', true),
  ('Software & Subscriptions', 'business', 'monitor', '#06B6D4', true),
  ('Marketing & Advertising', 'business', 'megaphone', '#A855F7', true),
  ('Professional Services', 'business', 'users', '#F43F5E', true),
  ('Equipment', 'business', 'cpu', '#64748B', true),
  ('Home Office', 'business', 'home', '#10B981', true),
  ('Vehicle (Business)', 'business', 'truck', '#EAB308', true),
  ('Phone & Internet', 'mixed', 'phone', '#22D3EE', true),
  ('Insurance (Business)', 'business', 'shield', '#7C3AED', true),
  ('Banking & Finance', 'business', 'dollar-sign', '#059669', true),
  ('Other', 'personal', 'more-horizontal', '#6B7280', true)
ON CONFLICT DO NOTHING;
