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

    // Monthly breakdown
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

    const { data: parents } = await supabase.from('parents').select('id').eq('operator_id', operatorId);
    const parentIds = (parents || []).map((p) => p.id);

    if (!parentIds.length) {
      return res.json(pnlZeroed());
    }

    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, status, invoice_month, amount_collected')
      .in('parent_id', parentIds);

    if (error) throw error;

    let totalRevenue = 0;
    let totalCollected = 0;
    let monthlyData = {};

    for (const p of payments || []) {
      if (year && !p.invoice_month.startsWith(year)) continue;
      const m = p.invoice_month;
      if (!monthlyData[m]) monthlyData[m] = { month: m, revenue: 0, collected: 0 };
      const amt = parseFloat(p.amount);
      const collected = parseFloat(p.amount_collected || 0);
      monthlyData[m].revenue += amt;
      monthlyData[m].collected += p.status === 'PAID' ? amt : collected;
      totalRevenue += amt;
      totalCollected += p.status === 'PAID' ? amt : collected;
    }

    // Estimated expenses (typically 20-30% of revenue for transport business)
    const estimatedExpenses = totalRevenue * 0.25;
    const grossProfit = totalRevenue - estimatedExpenses;
    const netProfit = grossProfit;

    res.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalCollected: parseFloat(totalCollected.toFixed(2)),
      estimatedExpenses: parseFloat(estimatedExpenses.toFixed(2)),
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      operatingIncome: parseFloat(grossProfit.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      profitMargin: totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0,
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

    const { data: parents } = await supabase.from('parents').select('id').eq('operator_id', operatorId);
    const parentIds = (parents || []).map((p) => p.id);

    if (!parentIds.length) {
      return res.json(financialSummaryZeroed());
    }

    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, status, amount_collected')
      .in('parent_id', parentIds);

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

    // Balance sheet: assets = liabilities + equity
    const assets = totalCollected; // cash collected
    const liabilities = pendingInvoices + totalPartiallyPaid; // outstanding payments
    const equity = assets - liabilities;

    res.json({
      assets: parseFloat(assets.toFixed(2)),
      liabilities: parseFloat(liabilities.toFixed(2)),
      equity: parseFloat(equity.toFixed(2)),
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
    });
  } catch (err) {
    next(err);
  }
};

const zeroed = () => ({ total_invoiced: 0, total_collected: 0, total_pending: 0, collection_rate: '0.0' });
const pnlZeroed = () => ({
  totalRevenue: 0,
  totalCollected: 0,
  estimatedExpenses: 0,
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
  equity: 0,
  totalInvoiced: 0,
  totalCollected: 0,
  totalOutstanding: 0,
  invoices: { paid: 0, partiallypaid: 0, pending: 0, total: 0 },
  collectionRate: 0,
});

// Combined endpoint — fetches parent IDs once, runs all 3 computations in parallel
const getAll = async (req, res, next) => {
  try {
    const operatorId = req.operator.id;
    const { year } = req.query;

    const { data: parents } = await supabase.from('parents').select('id').eq('operator_id', operatorId);
    const parentIds = (parents || []).map((p) => p.id);

    if (!parentIds.length) {
      return res.json({
        balanceSheet: { summary: zeroed(), monthly: [] },
        pnl: pnlZeroed(),
        summary: financialSummaryZeroed(),
      });
    }

    const [bsPayments, pnlPayments, sumPayments] = await Promise.all([
      supabase.from('payments').select('amount, status, invoice_month, payment_date, amount_collected').in('parent_id', parentIds),
      supabase.from('payments').select('amount, status, invoice_month, amount_collected').in('parent_id', parentIds),
      supabase.from('payments').select('amount, status, amount_collected').in('parent_id', parentIds),
    ]);

    // Balance sheet monthly breakdown
    const monthMap = {};
    for (const p of bsPayments.data || []) {
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
    const bsMonthly = Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month));
    const totalInvoiced = bsMonthly.reduce((s, m) => s + m.invoiced, 0);
    const totalCollected = bsMonthly.reduce((s, m) => s + m.collected, 0);
    const totalPending = bsMonthly.reduce((s, m) => s + m.pending, 0);

    // P&L
    let pnlRevenue = 0, pnlCollected = 0;
    const pnlMonthly = {};
    for (const p of pnlPayments.data || []) {
      if (year && !p.invoice_month.startsWith(year)) continue;
      const m = p.invoice_month;
      if (!pnlMonthly[m]) pnlMonthly[m] = { month: m, revenue: 0, collected: 0 };
      const amt = parseFloat(p.amount);
      const col = parseFloat(p.amount_collected || 0);
      pnlMonthly[m].revenue += amt;
      pnlMonthly[m].collected += p.status === 'PAID' ? amt : col;
      pnlRevenue += amt;
      pnlCollected += p.status === 'PAID' ? amt : col;
    }
    const estimatedExpenses = pnlRevenue * 0.25;
    const netProfit = pnlRevenue - estimatedExpenses;

    // Summary
    let sInvoiced = 0, sCollected = 0, sPartial = 0, sPending = 0;
    let paid = 0, partial = 0, pending = 0;
    for (const p of sumPayments.data || []) {
      const amt = parseFloat(p.amount);
      const col = parseFloat(p.amount_collected || 0);
      sInvoiced += amt;
      if (p.status === 'PAID') { sCollected += amt; paid++; }
      else if (p.status === 'PARTIALLY_PAID') { sCollected += col; sPartial += amt - col; partial++; }
      else { sPending += amt; pending++; }
    }

    res.json({
      balanceSheet: {
        summary: { total_invoiced: totalInvoiced, total_collected: totalCollected, total_pending: totalPending, collection_rate: totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0.0' },
        monthly: bsMonthly,
      },
      pnl: {
        totalRevenue: parseFloat(pnlRevenue.toFixed(2)),
        totalCollected: parseFloat(pnlCollected.toFixed(2)),
        estimatedExpenses: parseFloat(estimatedExpenses.toFixed(2)),
        grossProfit: parseFloat(netProfit.toFixed(2)),
        operatingIncome: parseFloat(netProfit.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        profitMargin: pnlRevenue > 0 ? parseFloat(((netProfit / pnlRevenue) * 100).toFixed(2)) : 0,
        collectionRate: pnlRevenue > 0 ? parseFloat(((pnlCollected / pnlRevenue) * 100).toFixed(2)) : 0,
        monthly: Object.values(pnlMonthly).sort((a, b) => b.month.localeCompare(a.month)),
      },
      summary: {
        assets: parseFloat(sCollected.toFixed(2)),
        liabilities: parseFloat((sPending + sPartial).toFixed(2)),
        equity: parseFloat((sCollected - sPending - sPartial).toFixed(2)),
        totalInvoiced: parseFloat(sInvoiced.toFixed(2)),
        totalCollected: parseFloat(sCollected.toFixed(2)),
        totalOutstanding: parseFloat((sPending + sPartial).toFixed(2)),
        invoices: { paid, partiallypaid: partial, pending, total: paid + partial + pending },
        collectionRate: sInvoiced > 0 ? parseFloat(((sCollected / sInvoiced) * 100).toFixed(2)) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBalanceSheet, getProfitAndLoss, getFinancialSummary, getAll };
