function tokenizeCSV(text) {
  // Strip BOM and normalize line endings
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"' && clean[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field.trim()); field = ''; }
      else if (ch === '\n') {
        row.push(field.trim());
        if (row.some(c => c !== '')) rows.push(row);
        row = []; field = '';
      } else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(c => c !== '')) rows.push(row); }
  return rows;
}

function parseAmount(str) {
  if (!str) return NaN;
  const s = String(str).trim();
  const negative = s.startsWith('(') && s.endsWith(')');
  const cleaned = s.replace(/[(),$\s]/g, '');
  const val = parseFloat(cleaned);
  return negative ? -val : val;
}

function parseDate(str) {
  if (!str) return null;
  const s = str.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // MM/DD/YY
  const mdy2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (mdy2) {
    const [, m, d, y] = mdy2;
    const year = parseInt(y) >= 50 ? `19${y}` : `20${y}`;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return null;
}

function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function makeTransactionId(date, amount, description) {
  const raw = `${date}|${parseFloat(amount).toFixed(2)}|${String(description).trim().toLowerCase()}`;
  return `csv_${djb2(raw)}`;
}

function colIndex(headers, name) {
  return headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
}

function parseRow(headers, row, config) {
  const get = (col) => (row[colIndex(headers, col)] || '').trim();
  const getIdx = (idx) => (row[idx] || '').trim();

  let date, description, amount;

  if (config.type === 'wellsfargo') {
    date = parseDate(getIdx(0));
    amount = parseAmount(getIdx(1));
    description = getIdx(4) || getIdx(3) || getIdx(2);
  } else if (config.type === 'citi') {
    const debit = get('Debit');
    if (!debit) return null; // credit/income row
    date = parseDate(get('Date'));
    description = get('Description');
    amount = parseAmount(debit);
  } else {
    // chase, bofa, generic
    const dateCol = config.dateCol || 'Date';
    const descCol = config.descCol || 'Description';
    const amtCol = config.amountCol || 'Amount';
    date = parseDate(get(dateCol));
    description = get(descCol);
    amount = parseAmount(get(amtCol));
    // Negative = expense for these banks; skip credits (positive)
    if (config.skipPositive && amount > 0) return null;
    amount = Math.abs(amount);
  }

  if (!date || !description || isNaN(amount) || amount <= 0) return null;
  return { date, description, amount };
}

const BANK_CONFIGS = {
  chase:      { type: 'chase',      dateCol: 'Date', descCol: 'Description', amountCol: 'Amount', skipPositive: true },
  bofa:       { type: 'bofa',       dateCol: 'Date', descCol: 'Description', amountCol: 'Amount', skipPositive: true },
  wellsfargo: { type: 'wellsfargo' },
  citi:       { type: 'citi' },
  generic:    { type: 'generic' },
};

function detectGenericCols(headers) {
  const dateI   = headers.findIndex(h => /date|time|posted/i.test(h));
  const descI   = headers.findIndex(h => /description|name|memo|narrative|details/i.test(h));
  const amtI    = headers.findIndex(h => /amount|debit|charge|withdrawal/i.test(h));
  if (dateI < 0 || descI < 0 || amtI < 0) {
    throw new Error('Could not auto-detect columns. Please select your bank format.');
  }
  return { dateIdx: dateI, descIdx: descI, amtIdx: amtI };
}

export function parseCSV(rawText, bankFormat = 'generic') {
  const rows = tokenizeCSV(rawText);
  if (rows.length < 2) throw new Error('CSV appears empty or has no data rows.');

  // BofA: skip metadata rows before the real header (find row containing "Date")
  let startRow = 0;
  if (bankFormat === 'bofa') {
    startRow = rows.findIndex(r => r.some(c => /^date$/i.test(c)));
    if (startRow < 0) startRow = 0;
  }

  let headers = rows[startRow].map(h => h.trim());
  const dataRows = rows.slice(startRow + 1);

  // Generic: detect column indices then re-map headers
  let genericCols = null;
  if (bankFormat === 'generic') {
    genericCols = detectGenericCols(headers);
    headers = ['Date', 'skip1', 'skip2', 'skip3', 'Description', 'skip4'];
    // Override using indices
  }

  const config = BANK_CONFIGS[bankFormat] || BANK_CONFIGS.generic;
  const transactions = [];

  for (const row of dataRows) {
    try {
      let parsed;
      if (bankFormat === 'generic' && genericCols) {
        const date = parseDate((row[genericCols.dateIdx] || '').trim());
        const description = (row[genericCols.descIdx] || '').trim();
        const amount = Math.abs(parseAmount((row[genericCols.amtIdx] || '').trim()));
        if (!date || !description || isNaN(amount) || amount <= 0) continue;
        parsed = { date, description, amount };
      } else {
        parsed = parseRow(headers, row, config);
      }

      if (!parsed) continue;

      transactions.push({
        date: parsed.date,
        description: parsed.description,
        amount: parsed.amount,
        currency: 'USD',
        merchant_name: '',
        type: 'personal',
        source: 'csv',
        transaction_id: makeTransactionId(parsed.date, parsed.amount, parsed.description),
        _selected: true,
      });
    } catch {
      // Skip malformed rows
    }
  }

  if (transactions.length === 0) {
    throw new Error('No valid expense rows found. Check the file or try a different bank format.');
  }

  return transactions;
}
