const pdfParse = require('pdf-parse');

function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) hash = (hash * 33) ^ str.charCodeAt(i);
  return (hash >>> 0).toString(36);
}

function parseBofADate(str) {
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!m) return null;
  const [, mo, d, y] = m;
  const year = parseInt(y) >= 50 ? `19${y}` : `20${y}`;
  return `${year}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function parseAmount(str) {
  const v = parseFloat(str.replace(/[$,]/g, ''));
  return isNaN(v) ? null : v;
}

async function parseBofAPDF(buffer) {
  const { text } = await pdfParse(buffer);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const transactions = [];

  // BofA concatenates date directly onto description with no space: "03/04/26DIAMOND PERFECT..."
  const DATE_START = /^(\d{2}\/\d{2}\/\d{2})(.*)/;

  // Lines that should not be appended to the current transaction's description
  const SKIP_LINE = /^(date\s|continued on|page \d|pull:|bc:|ssm-|when you use|scan here|explore our|reach for|take your|check your|to learn more|what would you|bank of america|preferred rewards|your checking|card account|progenerations|dba waterflow|daily ledger)/i;

  let section = null; // 'deposits' | 'withdrawals' | null
  let current = null; // { dateStr, accumLines[], section }

  const flush = () => {
    if (!current) return;
    const date = parseBofADate(current.dateStr);
    if (!date) { current = null; return; }

    const fullText = current.accumLines.join(' ');

    // Find the last dollar amount anywhere in the accumulated text
    // (amount may be on the same line or on a continuation line)
    const amtMatches = [...fullText.matchAll(/([-]?[\d,]+\.\d{2})/g)];
    if (!amtMatches.length) { current = null; return; }

    const lastMatch = amtMatches[amtMatches.length - 1];
    const rawAmount = parseAmount(lastMatch[0]);
    if (rawAmount === null || rawAmount === 0) { current = null; return; }

    const amount = Math.abs(rawAmount);
    if (amount <= 0) { current = null; return; }

    const description = fullText
      .slice(0, lastMatch.index)
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!description) { current = null; return; }

    const txId = `pdf_${djb2(`${date}|${amount.toFixed(2)}|${description.toLowerCase()}`)}`;

    transactions.push({
      date,
      description,
      amount,
      currency: 'USD',
      merchant_name: '',
      type: 'personal',
      source: 'pdf',
      is_income: current.section === 'deposits',
      transaction_id: txId,
      _selected: current.section === 'withdrawals',
    });

    current = null;
  };

  for (const line of lines) {
    // Section headers — handle both plain and "- continued" variants
    if (/deposits and other credits/i.test(line) && !/total/i.test(line)) {
      flush();
      section = 'deposits';
      continue;
    }
    if (/withdrawals and other debits/i.test(line) && !/total/i.test(line)) {
      flush();
      section = 'withdrawals';
      continue;
    }
    // End of transaction data
    if (/^(service fees|daily ledger|total deposits|total withdrawals|subtotal for card)/i.test(line)) {
      flush();
      section = null;
      continue;
    }

    if (!section) continue;
    if (SKIP_LINE.test(line)) continue;

    const dateMatch = line.match(DATE_START);
    if (dateMatch) {
      flush();
      current = {
        dateStr: dateMatch[1],
        accumLines: [dateMatch[2]],
        section,
      };
    } else if (current) {
      current.accumLines.push(line);
    }
  }

  flush();

  if (transactions.length === 0) {
    throw new Error('No transactions found. Make sure this is a Bank of America PDF statement.');
  }

  return transactions;
}

module.exports = { parseBofAPDF };
