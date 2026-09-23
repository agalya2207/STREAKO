const supabaseAuthClient = require('../config/supabaseAuthClient');
const supabase = require('../config/supabase'); // service_role client for profile creation

// SIGNUP
const signup = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    let user = null;

    // Try admin create first to automatically confirm email so user can immediately use app
    try {
      const adminResult = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || '' }
      });

      if (adminResult.error) {
        const msg = adminResult.error.message || '';
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
          return res.status(400).json({ error: 'A user with this email already exists' });
        }
        // Fallback to standard signUp
        const fallbackResult = await supabaseAuthClient.auth.signUp({
          email,
          password,
        });
        if (fallbackResult.error) {
          return res.status(400).json({ error: fallbackResult.error.message });
        }
        user = fallbackResult.data.user;
      } else {
        user = adminResult.data.user;
      }
    } catch (e) {
      console.warn('Admin createUser error, falling back to regular signUp:', e.message);
      const fallbackResult = await supabaseAuthClient.auth.signUp({
        email,
        password,
      });
      if (fallbackResult.error) {
        return res.status(400).json({ error: fallbackResult.error.message });
      }
      user = fallbackResult.data.user;
    }

    // Create / upsert profile row for this user
    if (user) {
      try {
        await supabase
          .from('profiles')
          .upsert([
            {
              id: user.id,
              email: user.email,
              full_name: fullName || '',
            },
          ]);
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    // Automatically establish a session so the user can go straight to the dashboard
    let session = null;
    try {
      const signInResult = await supabaseAuthClient.auth.signInWithPassword({
        email,
        password,
      });
      if (signInResult.data && signInResult.data.session) {
        session = signInResult.data.session;
      }
    } catch (loginErr) {
      console.warn('Auto-login session warning:', loginErr.message);
    }

    res.status(201).json({
      message: 'Signup successful!',
      user: {
        id: user?.id,
        email: user?.email,
        fullName: fullName || '',
      },
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      } : null,
    });
  } catch (err) {
    console.error('Signup caught error:', err);
    res.status(400).json({ error: err.message || 'Signup failed' });
  }
};

// LOGIN
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let { data, error } = await supabaseAuthClient.auth.signInWithPassword({
      email,
      password,
    });

    // If email is not confirmed, auto-confirm it using admin API and retry
    if (error && (error.message?.includes('Email not confirmed') || error.code === 'email_not_confirmed')) {
      try {
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const found = usersData?.users?.find((u) => u.email === email);
        if (found) {
          await supabase.auth.admin.updateUserById(found.id, { email_confirm: true });
          const retry = await supabaseAuthClient.auth.signInWithPassword({
            email,
            password,
          });
          data = retry.data;
          error = retry.error;
        }
      } catch (confirmErr) {
        console.warn('Auto-confirm retry warning:', confirmErr.message);
      }
    }

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    let fullName = data.user.user_metadata?.full_name || '';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .single();
      if (profile?.full_name) {
        fullName = profile.full_name;
      }
    } catch (profErr) {
      console.warn('Profile fetch warning on login:', profErr.message);
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: fullName || '',
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    console.error('Login caught error:', err);
    res.status(400).json({ error: err.message || 'Login failed' });
  }
};

// LOGOUT
const logout = async (req, res, next) => {
  try {
    const { error } = await supabaseAuthClient.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    next(err);
  }
};

// GET CURRENT USER (uses auth middleware)
const getCurrentUser = async (req, res, next) => {
  try {
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
    next(err);
  }
};

module.exports = { signup, login, logout, getCurrentUser };
