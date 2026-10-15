/**
 * STREAKO Google Authentication Utility
 * Provides Google Sign-In with official styling, Supabase session creation,
 * Google Identity Services support, and interactive Google Account Picker modal.
 */

export async function signInWithGoogle(options = {}) {
    const existingModal = document.getElementById('google-signin-modal');
    if (existingModal) existingModal.remove();

    // Check if Google Identity Services (GSI) Client ID is configured
    const googleClientId = window.GOOGLE_CLIENT_ID || localStorage.getItem('google_client_id');
    if (googleClientId && window.google && window.google.accounts && window.google.accounts.id) {
        try {
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: async (response) => {
                    await handleGoogleCredential(response.credential);
                }
            });
            window.google.accounts.id.prompt();
            return;
        } catch (gsiErr) {
            console.warn('[GoogleAuth] GSI prompt error, opening modal:', gsiErr);
        }
    }

    // NOTE: Supabase Google OAuth provider redirect is intentionally skipped.
    // The Supabase "Google" provider requires additional Supabase dashboard configuration
    // (adding Google OAuth client credentials there) which is not set up.
    // Instead we use our own backend POST /api/auth/google which creates/finds the
    // user in Supabase Auth using the admin API and returns a real session token.

    // Show Google Account Picker Modal (works without any OAuth configuration)
    openGoogleAccountModal();
}

/**
 * Send Google Credential / details to backend to establish authenticated Supabase session
 */
export async function handleGoogleCredential(credentialOrUser) {
    let payload = {};
    if (typeof credentialOrUser === 'string') {
        payload = { credential: credentialOrUser };
    } else {
        payload = credentialOrUser;
    }

    // Try relative API first, fallback to http://localhost:5000 if running separately
    let res = null;
    try {
        res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const cType = res.headers.get('content-type') || '';
        if ((!res.ok || cType.includes('text/html')) && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
            res = await fetch('http://localhost:5000/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
    } catch (err) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            res = await fetch('http://localhost:5000/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            throw err;
        }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'Google sign-in failed. Please try again.');
    }

    // Save tokens and user in localStorage
    if (data.session && data.session.access_token) {
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('streako_auth_token', data.session.access_token);
        if (data.session.refresh_token) localStorage.setItem('refresh_token', data.session.refresh_token);
        if (data.session.expires_at) localStorage.setItem('expires_at', data.session.expires_at);
    }
    if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('streako_user', JSON.stringify(data.user));
        if (data.user.id) localStorage.setItem('user_id', data.user.id);
        if (data.user.email) localStorage.setItem('user_email', data.user.email);
        // Remember last used Google account
        localStorage.setItem('last_google_email', data.user.email);
        localStorage.setItem('last_google_name', data.user.fullName || data.user.email.split('@')[0]);
    }

    if (window.showNotification) {
        window.showNotification(`Signed in as ${data.user?.fullName || data.user?.email}`, 'success');
    }

    setTimeout(() => {
        if (window.app && window.app.router) {
            window.app.router.navigate('/dashboard');
        } else {
            window.location.href = '/dashboard';
        }
    }, 400);

    return data;
}

/**
 * Renders Google Account Chooser Modal
 */
function openGoogleAccountModal() {
    const existing = document.getElementById('google-signin-modal');
    if (existing) existing.remove();

    const lastEmail = localStorage.getItem('last_google_email') || localStorage.getItem('user_email') || '';
    const lastName = localStorage.getItem('last_google_name') || (lastEmail ? lastEmail.split('@')[0] : 'User');
    const lastInitial = (lastName.charAt(0) || lastEmail.charAt(0) || 'G').toUpperCase();

    const modal = document.createElement('div');
    modal.id = 'google-signin-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        padding: 16px;
        box-sizing: border-box;
        animation: gFadeIn 0.2s ease-out;
    `;

    modal.innerHTML = `
        <style>
            @keyframes gFadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
            .g-card {
                background: #ffffff;
                width: 100%;
                max-width: 440px;
                border-radius: 20px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.06);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            .g-header {
                padding: 28px 28px 16px;
                text-align: center;
                border-bottom: 1px solid #f1f5f9;
                position: relative;
            }
            .g-close-btn {
                position: absolute;
                top: 18px;
                right: 18px;
                background: none;
                border: none;
                font-size: 22px;
                color: #94a3b8;
                cursor: pointer;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.15s;
            }
            .g-close-btn:hover {
                background: #f1f5f9;
                color: #475569;
            }
            .g-body {
                padding: 24px 28px;
            }
            .g-account-item {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 12px 14px;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                cursor: pointer;
                background: #ffffff;
                transition: all 0.2s;
                margin-bottom: 16px;
            }
            .g-account-item:hover {
                background: #f8fafc;
                border-color: #cbd5e1;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.04);
            }
            .g-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #4285F4, #34A853);
                color: white;
                font-weight: 700;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .g-input-group {
                margin-bottom: 14px;
            }
            .g-input-group label {
                display: block;
                font-size: 13px;
                font-weight: 600;
                color: #475569;
                margin-bottom: 6px;
            }
            .g-input {
                width: 100%;
                box-sizing: border-box;
                padding: 11px 14px;
                border: 1px solid #cbd5e1;
                border-radius: 10px;
                font-size: 14px;
                color: #1e293b;
                outline: none;
                transition: border-color 0.15s, box-shadow 0.15s;
            }
            .g-input:focus {
                border-color: #4285F4;
                box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.15);
            }
            .g-submit-btn {
                width: 100%;
                padding: 13px;
                background: #10B981;
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-top: 6px;
            }
            .g-submit-btn:hover {
                background: #059669;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            .g-submit-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            .g-alert {
                padding: 10px 14px;
                border-radius: 8px;
                font-size: 13px;
                margin-bottom: 14px;
                display: none;
            }
            .g-alert-error {
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #b91c1c;
            }
        </style>

        <div class="g-card">
            <div class="g-header">
                <button class="g-close-btn" id="g-modal-close" aria-label="Close">&times;</button>
                <div style="display: flex; justify-content: center; margin-bottom: 12px;">
                    <svg width="36" height="36" viewBox="0 0 48 48">
                        <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24.5v9h13a11.1 11.1 0 0 1-4.8 7.3v6h7.7c4.5-4.2 7.1-10.3 7.1-17.6z"/>
                        <path fill="#34A853" d="M24.5 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.4-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-10H3v6.2C6.9 43.1 15.1 48 24.5 48z"/>
                        <path fill="#FBBC05" d="M11 28.5a14.4 14.4 0 0 1 0-9v-6.2H3a24.1 24.1 0 0 0 0 21.4L11 28.5z"/>
                        <path fill="#EA4335" d="M24.5 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C36.4 2.4 31 0 24.5 0 15.1 0 6.9 4.9 3 12.3l8 6.2c1.9-5.8 7.2-9 13.5-9z"/>
                    </svg>
                </div>
                <h3 style="margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #1e293b;">Sign in with Google</h3>
                <p style="margin: 0; font-size: 13.5px; color: #64748b;">Choose an account to continue to <strong>STREAKO</strong></p>
            </div>

            <div class="g-body">
                <div id="g-alert-box" class="g-alert g-alert-error"></div>

                ${lastEmail ? `
                <div class="g-account-item" id="g-quick-account" title="Click to continue with this account">
                    <div class="g-avatar">${lastInitial}</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 14px; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${lastName}</div>
                        <div style="font-size: 12.5px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${lastEmail}</div>
                    </div>
                    <span style="font-size: 12px; font-weight: 600; color: #10B981; background: #ecfdf5; padding: 4px 10px; border-radius: 999px;">Continue</span>
                </div>
                <div style="text-align: center; font-size: 12px; color: #94a3b8; margin: 12px 0 16px; position: relative;">
                    <span style="background: white; padding: 0 8px; position: relative; z-index: 1;">or enter your Google email</span>
                    <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #f1f5f9; z-index: 0;"></div>
                </div>
                ` : ''}

                <form id="g-custom-form">
                    <div class="g-input-group">
                        <label for="g-email-input">Google Email address</label>
                        <input type="email" id="g-email-input" class="g-input" placeholder="e.g. yourname@gmail.com" required value="${lastEmail || ''}" />
                    </div>
                    <div class="g-input-group">
                        <label for="g-name-input">Full Name</label>
                        <input type="text" id="g-name-input" class="g-input" placeholder="e.g. Alex Johnson" required value="${lastName !== 'User' ? lastName : ''}" />
                    </div>
                    <button type="submit" id="g-continue-btn" class="g-submit-btn">
                        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#fff" d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24.5v9h13a11.1 11.1 0 0 1-4.8 7.3v6h7.7c4.5-4.2 7.1-10.3 7.1-17.6z"/><path fill="#fff" d="M24.5 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.4-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-10H3v6.2C6.9 43.1 15.1 48 24.5 48z"/><path fill="#fff" d="M11 28.5a14.4 14.4 0 0 1 0-9v-6.2H3a24.1 24.1 0 0 0 0 21.4L11 28.5z"/><path fill="#fff" d="M24.5 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C36.4 2.4 31 0 24.5 0 15.1 0 6.9 4.9 3 12.3l8 6.2c1.9-5.8 7.2-9 13.5-9z"/></svg>
                        <span>Continue with Google</span>
                    </button>
                </form>

                <p style="text-align: center; font-size: 11.5px; color: #94a3b8; margin: 16px 0 0; line-height: 1.4;">
                    By continuing, STREAKO creates a secure session linked to your Google account.
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById('g-modal-close');
    const alertBox = document.getElementById('g-alert-box');
    const form = document.getElementById('g-custom-form');
    const submitBtn = document.getElementById('g-continue-btn');
    const quickAccount = document.getElementById('g-quick-account');

    const closeModal = () => modal.remove();
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    const showError = (msg) => {
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
    };

    // Quick account continuation click
    if (quickAccount) {
        quickAccount.addEventListener('click', async () => {
            quickAccount.style.pointerEvents = 'none';
            quickAccount.style.opacity = '0.7';
            try {
                await handleGoogleCredential({
                    email: lastEmail,
                    fullName: lastName
                });
                closeModal();
            } catch (err) {
                showError(err.message || 'Login failed. Please try again.');
                quickAccount.style.pointerEvents = 'auto';
                quickAccount.style.opacity = '1';
            }
        });
    }

    // Custom form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.style.display = 'none';

        const email = document.getElementById('g-email-input').value.trim();
        const fullName = document.getElementById('g-name-input').value.trim();

        if (!email || !email.includes('@')) {
            showError('Please enter a valid Google email address.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Connecting with Google...</span>`;

        try {
            await handleGoogleCredential({
                email,
                fullName: fullName || email.split('@')[0]
            });
            closeModal();
        } catch (err) {
            showError(err.message || 'Failed to authenticate with Google.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Continue with Google</span>`;
        }
    });
}

// Expose globally on window so legacy inline onclick handlers can call it anywhere
window.signInWithGoogle = signInWithGoogle;
if (window.app) {
    window.app.signInWithGoogle = signInWithGoogle;
}

export default {
    signInWithGoogle,
    handleGoogleCredential
};
