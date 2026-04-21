const express = require('express');
const supabase = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    const operatorId = req.operator.id;

    const [
      { count: vehicleCount },
      { count: parentCount },
      { count: childCount },
      { data: recentActivity },
      { data: parentRows },
    ] = await Promise.all([
      supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('operator_id', operatorId).eq('status', 'ACTIVE'),
      supabase.from('parents').select('*', { count: 'exact', head: true }).eq('operator_id', operatorId),
      supabase.from('children').select('parents!inner(operator_id)', { count: 'exact', head: true }).eq('parents.operator_id', operatorId),
      supabase.from('activity_logs').select('*, vehicles(license_plate, model)').eq('operator_id', operatorId).order('timestamp', { ascending: false }).limit(10),
      supabase.from('parents').select('id').eq('operator_id', operatorId),
    ]);

    // Aggregate pending payments from parent IDs
    const parentIds = (parentRows || []).map((p) => p.id);
    let pendingCount = 0;
    let pendingAmount = 0;

    if (parentIds.length > 0) {
      const { data: pendingPayments } = await supabase
        .from('payments')
        .select('amount')
        .in('parent_id', parentIds)
        .eq('status', 'PENDING');

      pendingCount = pendingPayments?.length || 0;
      pendingAmount = (pendingPayments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    }

    res.json({
      stats: {
        active_vehicles: vehicleCount || 0,
        total_parents: parentCount || 0,
        total_students: childCount || 0,
        pending_payments_count: pendingCount,
        pending_payments_amount: pendingAmount,
      },
      recent_activity: recentActivity || [],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
