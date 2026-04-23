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
      .select('amount, status, invoice_month, payment_date, amount_collected')
      .in('parent_id', parentIds);

    if (error) throw error;

    const monthMap = {};
    for (const p of payments || []) {
      const m = p.invoice_month;
      if (!monthMap[m]) monthMap[m] = { month: m, invoiced: 0, collected: 0, pending: 0, count: 0, paid_count: 0 };
      const amt = parseFloat(p.amount);
      const collected = parseFloat(p.amount_collected || 0);
      monthMap[m].invoiced += amt;
      monthMap[m].count += 1;
      if (p.status === 'PAID') { monthMap[m].collected += amt; monthMap[m].paid_count += 1; }
      else if (p.status === 'PARTIALLY_PAID') { monthMap[m].collected += collected; monthMap[m].pending += (amt - collected); }
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

const getProfitAndLoss = async (req, res, next) => {
  try {
    const operatorId = req.operator.id;
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear().toString();

    const { data: parents } = await supabase.from('parents').select('id').eq('operator_id', operatorId);
    const parentIds = (parents || []).map((p) => p.id);

    // Fetch payments for this year
    let totalRevenue = 0;
    let totalCollected = 0;
    const monthlyData = {};

    if (parentIds.length) {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, status, invoice_month, amount_collected')
        .in('parent_id', parentIds);

      if (error) throw error;

      for (const p of payments || []) {
        if (!p.invoice_month.startsWith(currentYear)) continue;
        const m = p.invoice_month;
        if (!monthlyData[m]) monthlyData[m] = { month: m, revenue: 0, collected: 0, expenses: 0 };
        const amt = parseFloat(p.amount);
        const collected = parseFloat(p.amount_collected || 0);
        monthlyData[m].revenue += amt;
        monthlyData[m].collected += p.status === 'PAID' ? amt : collected;
        totalRevenue += amt;
        totalCollected += p.status === 'PAID' ? amt : collected;
      }
    }

    // Fetch actual expenses for this year
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount, expense_date')
      .eq('operator_id', operatorId)
      .gte('expense_date', `${currentYear}-01-01`)
      .lte('expense_date', `${currentYear}-12-31`);

    let totalExpenses = 0;
    for (const e of expensesData || []) {
      const m = e.expense_date.slice(0, 7);
      if (!monthlyData[m]) monthlyData[m] = { month: m, revenue: 0, collected: 0, expenses: 0 };
      monthlyData[m].expenses += parseFloat(e.amount);
      totalExpenses += parseFloat(e.amount);
    }

    const grossProfit = totalCollected - totalExpenses;
    const netProfit = grossProfit;

    res.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalCollected: parseFloat(totalCollected.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      operatingIncome: parseFloat(grossProfit.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      profitMargin: totalCollected > 0 ? parseFloat(((netProfit / totalCollected) * 100).toFixed(2)) : 0,
      collectionRate: totalRevenue > 0 ? parseFloat(((totalCollected / totalRevenue) * 100).toFixed(2)) : 0,
      monthly: Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month)),
    });
  } catch (err) {
    next(err);
  }
};

const getFinancialSummary = async (req, res, next) => {
  try {
    const operatorId = req.operator.id;
    const { month } = req.query; // e.g. "2026-04" — optional monthly filter

    const { data: parents } = await supabase.from('parents').select('id').eq('operator_id', operatorId);
    const parentIds = (parents || []).map((p) => p.id);

    if (!parentIds.length) return res.json(financialSummaryZeroed());

    let paymentQuery = supabase
      .from('payments')
      .select('amount, status, amount_collected')
      .in('parent_id', parentIds);

    if (month) paymentQuery = paymentQuery.eq('invoice_month', month);

    const { data: payments, error } = await paymentQuery;
    if (error) throw error;

    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalPartiallyPaid = 0;
    let pendingInvoices = 0;
    let paidInvoices = 0;
    let partiallyPaidCount = 0;
    let pendingCount = 0;

    for (const p of payments || []) {
      const amt = parseFloat(p.amount);
      const collected = parseFloat(p.amount_collected || 0);
      totalInvoiced += amt;
      if (p.status === 'PAID') {
        totalCollected += amt;
        paidInvoices += 1;
      } else if (p.status === 'PARTIALLY_PAID') {
        totalCollected += collected;
        totalPartiallyPaid += amt - collected;
        partiallyPaidCount += 1;
      } else {
        pendingInvoices += amt;
        pendingCount += 1;
      }
    }

    // Fetch actual expenses for the period
    let expenseQuery = supabase
      .from('expenses')
      .select('amount')
      .eq('operator_id', operatorId);

    if (month) {
      expenseQuery = expenseQuery
        .gte('expense_date', `${month}-01`)
        .lte('expense_date', `${month}-31`);
    }

    const { data: expensesData } = await expenseQuery;
    const totalExpenses = (expensesData || []).reduce((s, e) => s + parseFloat(e.amount), 0);

    const assets = totalCollected;
    const liabilities = pendingInvoices + totalPartiallyPaid;
    const businessValue = assets - liabilities - totalExpenses;

    res.json({
      assets: parseFloat(assets.toFixed(2)),
      liabilities: parseFloat(liabilities.toFixed(2)),
      businessValue: parseFloat(businessValue.toFixed(2)),
      equity: parseFloat(businessValue.toFixed(2)), // backward compat
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      totalInvoiced: parseFloat(totalInvoiced.toFixed(2)),
      totalCollected: parseFloat(totalCollected.toFixed(2)),
      totalOutstanding: parseFloat((pendingInvoices + totalPartiallyPaid).toFixed(2)),
      invoices: {
        paid: paidInvoices,
        partiallypaid: partiallyPaidCount,
        pending: pendingCount,
        total: paidInvoices + partiallyPaidCount + pendingCount,
      },
      collectionRate: totalInvoiced > 0 ? parseFloat(((totalCollected / totalInvoiced) * 100).toFixed(2)) : 0,
      month: month || null,
    });
  } catch (err) {
    next(err);
  }
};

const zeroed = () => ({ total_invoiced: 0, total_collected: 0, total_pending: 0, collection_rate: '0.0' });
const pnlZeroed = () => ({
  totalRevenue: 0,
  totalCollected: 0,
  totalExpenses: 0,
  grossProfit: 0,
  operatingIncome: 0,
  netProfit: 0,
  profitMargin: 0,
  collectionRate: 0,
  monthly: [],
});
const financialSummaryZeroed = () => ({
  assets: 0,
  liabilities: 0,
  businessValue: 0,
  equity: 0,
  totalExpenses: 0,
  totalInvoiced: 0,
  totalCollected: 0,
  totalOutstanding: 0,
  invoices: { paid: 0, partiallypaid: 0, pending: 0, total: 0 },
  collectionRate: 0,
  month: null,
});

module.exports = { getBalanceSheet, getProfitAndLoss, getFinancialSummary };
