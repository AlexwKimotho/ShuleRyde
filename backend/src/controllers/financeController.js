const supabase = require('../config/database');

const getBalanceSheet = async (req, res, next) => {
  try {
    const operatorId = req.operator.id;

    const { data: parents } = await supabase.from('parents').select('id').eq('operator_id', operatorId);
    const parentIds = (parents || []).map((p) => p.id);

    if (!parentIds.length) {
      return res.json({ summary: zeroed(), monthly: [] });
    }

    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, status, invoice_month, payment_date')
      .in('parent_id', parentIds);

    if (error) throw error;

    // Monthly breakdown
    const monthMap = {};
    for (const p of payments || []) {
      const m = p.invoice_month;
      if (!monthMap[m]) monthMap[m] = { month: m, invoiced: 0, collected: 0, pending: 0, count: 0, paid_count: 0 };
      const amt = parseFloat(p.amount);
      monthMap[m].invoiced += amt;
      monthMap[m].count += 1;
      if (p.status === 'PAID') { monthMap[m].collected += amt; monthMap[m].paid_count += 1; }
      else { monthMap[m].pending += amt; }
    }

    const monthly = Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month));

    const totalInvoiced = monthly.reduce((s, m) => s + m.invoiced, 0);
    const totalCollected = monthly.reduce((s, m) => s + m.collected, 0);
    const totalPending = monthly.reduce((s, m) => s + m.pending, 0);
    const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0.0';

    res.json({
      summary: { total_invoiced: totalInvoiced, total_collected: totalCollected, total_pending: totalPending, collection_rate: collectionRate },
      monthly,
    });
  } catch (err) {
    next(err);
  }
};

const zeroed = () => ({ total_invoiced: 0, total_collected: 0, total_pending: 0, collection_rate: '0.0' });

module.exports = { getBalanceSheet };
