const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const generateToken = (operator) => {
  return jwt.sign(
    { id: operator.id, email: operator.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, full_name, business_name, phone } = req.body;

    const existing = await prisma.operator.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const operator = await prisma.operator.create({
      data: { email, password_hash, full_name, business_name, phone },
      select: {
        id: true, email: true, full_name: true,
        business_name: true, phone: true, subscription_status: true, created_at: true,
      },
    });

    const token = generateToken(operator);

    res.status(201).json({ token, operator });
  } catch (err) {
    next(err);
  }
};

const signin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const operator = await prisma.operator.findUnique({ where: { email } });
    if (!operator) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, operator.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(operator);

    const { password_hash, ...operatorData } = operator;
    res.json({ token, operator: operatorData });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const operator = await prisma.operator.findUnique({
      where: { id: req.operator.id },
      select: {
        id: true, email: true, full_name: true, business_name: true,
        phone: true, mpesa_paybill: true, subscription_status: true, created_at: true,
      },
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    res.json({ operator });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, signin, getMe };
