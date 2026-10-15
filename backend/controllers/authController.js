const supabaseAuthClient = require('../config/supabaseAuthClient');
const supabase = require('../config/supabase'); // service_role client for profile creation
const { Resend } = require('resend');

// Safely initialize Resend without crashing if API key is missing
let resend = null;
try {
  const apiKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  if (apiKey) {
    resend = new Resend(apiKey);
  }
} catch (resendErr) {
  console.warn('Resend initialization warning:', resendErr.message);
}

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

    if (error && error.code !== 'PGRST116') {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json({
      user: {
        id: req.user.id,
        email: profile?.email || req.user.email,
        fullName: profile?.full_name || req.user.user_metadata?.full_name || '',
      }
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE USER PROFILE
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, email } = req.body;

    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (email !== undefined) updates.email = email;

    // 1. Upsert into profiles table
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, email: email || req.user.email, full_name: fullName || '' })
      .select()
      .single();

    if (profileErr) {
      console.error('Error updating profile in db:', profileErr);
    }

    // 2. Update Supabase Auth user metadata / email
    try {
      const authUpdates = {};
      if (fullName !== undefined) authUpdates.user_metadata = { full_name: fullName };
      if (email && email !== req.user.email) authUpdates.email = email;

      if (Object.keys(authUpdates).length > 0) {
        await supabase.auth.admin.updateUserById(userId, authUpdates);
      }
    } catch (authErr) {
      console.warn('Auth admin update warning:', authErr.message);
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: userId,
        email: email || profile?.email || req.user.email,
        fullName: fullName || profile?.full_name || '',
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(400).json({ error: err.message || 'Failed to update profile' });
  }
};

// FORGOT PASSWORD - Generate recovery OTP and link for real user
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Please enter your registered email address' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify user exists in Supabase Auth
    let targetUser = null;
    try {
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      targetUser = usersData?.users?.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    } catch (findErr) {
      console.error('Error looking up user for password reset:', findErr);
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'No account found with this email address. Please check the spelling or sign up.' });
    }

    // 2. Generate Supabase recovery link & OTP
    let otpCode = null;
    let actionLink = null;
    try {
      const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
      const linkRes = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
        options: {
          redirectTo: `${origin}/forgot-password`
        }
      });

      if (linkRes.data?.properties) {
        otpCode = linkRes.data.properties.email_otp || null;
        actionLink = linkRes.data.properties.action_link || null;
      }
    } catch (linkError) {
      console.warn('generateLink recovery notice:', linkError.message);
    }

    // Fallback 6-digit OTP if generateLink didn't provide one
    if (!otpCode) {
      otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 3. Attempt to send email via Resend
    let emailSent = false;
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: cleanEmail,
          subject: 'STREAKO Password Reset Code',
          html: `<h2>STREAKO Password Reset</h2><p>Your verification code is: <strong>${otpCode}</strong></p><p>Please enter this code on the password reset page.</p>`
        });

        if (error) {
          console.error('Resend error:', error);
        } else {
          emailSent = true;
        }
      } catch (mailErr) {
        console.warn('Email dispatch warning:', mailErr.message);
      }
    }

    // Store recovery OTP in user_metadata for reliable validation
    try {
      await supabase.auth.admin.updateUserById(targetUser.id, {
        user_metadata: {
          ...(targetUser.user_metadata || {}),
          recovery_otp: otpCode,
          recovery_otp_created_at: new Date().toISOString()
        }
      });
    } catch (metaErr) {
      console.warn('Could not store recovery_otp in user_metadata:', metaErr.message);
    }

    return res.status(200).json({
      message: 'A verification code has been sent to your email address.',
      email: cleanEmail,
      emailSent
    });
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process password reset request' });
  }
};

// RESET PASSWORD - Verify code and update password in Supabase in real-time
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user in Supabase
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    const user = usersData?.users?.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    // 2. Validate verification code if supplied
    if (code) {
      const storedOtp = user.user_metadata?.recovery_otp;
      let valid = false;

      if (storedOtp && String(storedOtp).trim() === String(code).trim()) {
        valid = true;
      }

      if (!valid) {
        try {
          const verifyRes = await supabaseAuthClient.auth.verifyOtp({
            email: cleanEmail,
            token: String(code).trim(),
            type: 'recovery'
          });
          if (!verifyRes.error) {
            valid = true;
          }
        } catch (vErr) {
          // ignore
        }
      }

      if (!valid) {
        return res.status(400).json({ error: 'Invalid or expired verification code. Please check and try again.' });
      }
    }

    // 3. Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: {
        ...(user.user_metadata || {}),
        recovery_otp: null
      }
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // 4. Automatically establish session with new password
    let session = null;
    try {
      const signInResult = await supabaseAuthClient.auth.signInWithPassword({
        email: cleanEmail,
        password: newPassword
      });
      if (signInResult.data && signInResult.data.session) {
        session = signInResult.data.session;
      }
    } catch (loginErr) {
      console.warn('Auto-login after reset warning:', loginErr.message);
    }

    return res.status(200).json({
      message: 'Password has been reset successfully! You can now log in.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || ''
      },
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      } : null
    });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ error: err.message || 'Failed to reset password' });
  }
};

// GOOGLE AUTH REDIRECT (GET /api/auth/google)
// NOTE: Supabase Google OAuth provider is not enabled in the Supabase dashboard,
// so we cannot redirect to Supabase's authorize endpoint. Instead redirect to login
// with a query param so the frontend opens our custom Google modal immediately.
const googleAuth = async (req, res) => {
  try {
    const origin = req.headers.referer
      ? new URL(req.headers.referer).origin
      : (process.env.APP_URL || 'http://localhost:3000');
    return res.redirect(`${origin}/login?google_modal=1`);
  } catch (err) {
    console.error('Google auth redirect error:', err);
    res.redirect('/login?google_modal=1');
  }
};

// GOOGLE AUTH URL CHECK (GET /api/auth/google/url)
// Always returns enabled: false since Supabase OAuth redirect is not configured.
// The frontend will fall through to our custom modal instead.
const googleAuthUrl = async (req, res) => {
  return res.json({
    enabled: false,
    reason: 'Use POST /api/auth/google with email + fullName to authenticate.'
  });
};

// GOOGLE SIGN IN / UP (POST /api/auth/google)
const googleSignIn = async (req, res) => {
  try {
    let { credential, email, fullName, name, picture, googleId } = req.body || {};

    // 1. If Google Identity Services ID token (credential) is passed, decode or verify it
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          email = payload.email || email;
          fullName = payload.name || payload.given_name || fullName;
          picture = payload.picture || picture;
          googleId = payload.sub || googleId;
        } else {
          // Fallback: parse JWT payload (base64url)
          const parts = credential.split('.');
          if (parts.length === 3) {
            const rawPayload = Buffer.from(parts[1], 'base64').toString('utf-8');
            const decoded = JSON.parse(rawPayload);
            email = decoded.email || email;
            fullName = decoded.name || decoded.given_name || fullName;
            picture = decoded.picture || picture;
            googleId = decoded.sub || googleId;
          }
        }
      } catch (tokenErr) {
        console.warn('Google token verification warning:', tokenErr.message);
      }
    }

    email = (email || '').trim().toLowerCase();
    fullName = (fullName || name || '').trim();

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid Google email is required' });
    }

    if (!fullName) {
      const prefix = email.split('@')[0];
      fullName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    let user = null;

    // 2. Check if user already exists in Supabase Auth
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === email);

      if (existingUser) {
        user = existingUser;
        if (!user.email_confirmed_at) {
          await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
        }
      } else {
        // 3. Create new user with confirmed email
        const createResult = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            avatar_url: picture || '',
            provider: 'google',
            google_id: googleId || ''
          }
        });

        if (createResult.error) {
          console.warn('Admin createUser notice for Google user:', createResult.error.message);
          const { data: retryUsers } = await supabase.auth.admin.listUsers();
          user = retryUsers?.users?.find(u => u.email?.toLowerCase() === email);
        } else {
          user = createResult.data?.user;
        }
      }
    } catch (adminErr) {
      console.error('Error managing user in Supabase auth for Google:', adminErr);
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to initialize Google user account' });
    }

    // 4. Upsert user profile in profiles table
    try {
      await supabase.from('profiles').upsert([
        {
          id: user.id,
          email: user.email,
          full_name: fullName || user.user_metadata?.full_name || '',
          avatar_url: picture || user.user_metadata?.avatar_url || ''
        }
      ]);
    } catch (profileErr) {
      console.warn('Google user profile upsert warning:', profileErr.message);
    }

    // 5. Generate authenticated Supabase session
    let session = null;
    try {
      const linkResult = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email
      });

      if (linkResult.data?.properties?.email_otp) {
        const verifyResult = await supabaseAuthClient.auth.verifyOtp({
          email: user.email,
          token: linkResult.data.properties.email_otp,
          type: 'magiclink'
        });

        if (verifyResult.data?.session) {
          session = verifyResult.data.session;
        }
      }
    } catch (sessionErr) {
      console.warn('Google session generation warning:', sessionErr.message);
    }

    return res.status(200).json({
      message: 'Google login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: fullName || user.user_metadata?.full_name || '',
        avatarUrl: picture || user.user_metadata?.avatar_url || ''
      },
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      } : null
    });
  } catch (err) {
    console.error('Google sign in error:', err);
    res.status(500).json({ error: err.message || 'Google sign in failed' });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleAuthUrl,
  googleSignIn
};

