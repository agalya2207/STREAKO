const supabaseAuthClient = require('../config/supabaseAuthClient');
const supabase = require('../config/supabase'); // service_role client for profile creation

// SIGNUP
const signup = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabaseAuthClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Create a profile row for this user (using service_role client to bypass RLS)
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName || '',
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the whole signup if profile creation has an issue
      }
    }

    res.status(201).json({
      message: 'Signup successful! Please check your email to verify your account.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Something went wrong during signup' });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong during login' });
  }
};

// LOGOUT
const logout = async (req, res) => {
  try {
    const { error } = await supabaseAuthClient.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Something went wrong during logout' });
  }
};

// GET CURRENT USER (uses auth middleware)
const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json({ user: profile });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = { signup, login, logout, getCurrentUser };