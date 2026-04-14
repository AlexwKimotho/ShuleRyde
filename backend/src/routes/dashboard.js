const express = require('express');
const prisma = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    const operatorId = req.operator.id;

    const [vehicleCount, parentCount, childCount, recentActivity, pendingPayments] =
      await Promise.all([
        prisma.vehicle.count({ where: { operator_id: operatorId, status: 'ACTIVE' } }),
        prisma.parent.count({ where: { operator_id: operatorId } }),
        prisma.child.count({
          where: { parent: { operator_id: operatorId } },
        }),
        prisma.activityLog.findMany({
          where: { operator_id: operatorId },
          orderBy: { timestamp: 'desc' },
          take: 10,
          include: { vehicle: { select: { license_plate: true, model: true } } },
        }),
        prisma.payment.aggregate({
          where: {
            parent: { operator_id: operatorId },
            status: 'PENDING',
          },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

    res.json({
      stats: {
        active_vehicles: vehicleCount,
        total_students: childCount,
        total_parents: parentCount,
        pending_payments_count: pendingPayments._count,
        pending_payments_amount: pendingPayments._sum.amount || 0,
      },
      recent_activity: recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
