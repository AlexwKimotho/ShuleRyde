const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { operator_id: req.operator.id },
      include: {
        _count: { select: { children: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ vehicles });
  } catch (err) {
    next(err);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { license_plate, model, route, max_capacity } = req.body;

    const vehicle = await prisma.vehicle.create({
      data: {
        operator_id: req.operator.id,
        license_plate: license_plate.toUpperCase(),
        model,
        route,
        max_capacity: max_capacity || 7,
      },
    });

    res.status(201).json({ vehicle });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A vehicle with this license plate already exists' });
    }
    next(err);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { license_plate, model, route, max_capacity, status } = req.body;

    const existing = await prisma.vehicle.findFirst({
      where: { id, operator_id: req.operator.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(license_plate && { license_plate: license_plate.toUpperCase() }),
        ...(model && { model }),
        ...(route !== undefined && { route }),
        ...(max_capacity && { max_capacity }),
        ...(status && { status }),
      },
    });

    res.json({ vehicle });
  } catch (err) {
    next(err);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.vehicle.findFirst({
      where: { id, operator_id: req.operator.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    await prisma.vehicle.delete({ where: { id } });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getVehicles, createVehicle, updateVehicle, deleteVehicle };
