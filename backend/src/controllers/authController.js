const { validationResult } = require('express-validator');
const supabase = require('../config/database');

const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, full_name, business_name, phone } = req.body;

    // Create user in Supabase Auth (auto-confirms email via admin API)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already')) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw authError;
    }

    // Create operator profile row
    const { data: operator, error: profileError } = await supabase
      .from('operators')
      .insert({ id: authData.user.id, email, full_name, business_name, phone })
      .select('id, email, full_name, business_name, phone, subscription_status, created_at')
      .single();

    if (profileError) throw profileError;

    // Sign in to get an access token the client can use
    const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({ email, password });
    if (sessionError) throw sessionError;

    res.status(201).json({ token: session.session.access_token, operator });
  } catch (err) {
    next(err);
  }
};

const signin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid email or password' });

    const { data: operator, error: profileError } = await supabase
      .from('operators')
      .select('id, email, full_name, business_name, phone, mpesa_paybill, subscription_status, created_at')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!operator) return res.status(404).json({ error: 'Operator profile not found' });

    res.json({ token: data.session.access_token, operator });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { data: operator, error } = await supabase
      .from('operators')
      .select('id, email, full_name, business_name, phone, mpesa_paybill, subscription_status, created_at')
      .eq('id', req.operator.id)
      .maybeSingle();

    if (error || !operator) return res.status(404).json({ error: 'Operator not found' });

    res.json({ operator });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, signin, getMe };
