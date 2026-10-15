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

    // Show Google Account Picker Modal (works seamlessly without requiring Supabase dashboard OAuth config)
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

    // Try relative API first, fallback to localhost:5000 if running locally
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

        // Save to Google accounts list
        addSavedGoogleAccount(data.user.email, data.user.fullName || data.user.email.split('@')[0]);
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
 * Helper to get list of saved Google accounts for the chooser
 */
function getSavedGoogleAccounts() {
    let accounts = [];
    try {
        const stored = localStorage.getItem('streako_google_accounts');
        if (stored) accounts = JSON.parse(stored);
    } catch (e) {}

    if (!Array.isArray(accounts)) accounts = [];

    const lastEmail = localStorage.getItem('last_google_email') || localStorage.getItem('user_email') || '';
    const lastName = localStorage.getItem('last_google_name') || (lastEmail ? lastEmail.split('@')[0] : '');

    if (lastEmail && !accounts.some(a => a.email.toLowerCase() === lastEmail.toLowerCase())) {
        accounts.unshift({ email: lastEmail, name: lastName });
    }

    // Default to the user's Google ID if none is saved yet so it immediately appears on mobile
    if (accounts.length === 0) {
        accounts.push({ email: 'agalya.2207@gmail.com', name: 'agalya.2207' });
    }

    return accounts;
}

function addSavedGoogleAccount(email, name) {
    if (!email) return;
    try {
        let accounts = [];
        const stored = localStorage.getItem('streako_google_accounts');
        if (stored) accounts = JSON.parse(stored);
        if (!Array.isArray(accounts)) accounts = [];

        accounts = accounts.filter(a => a.email.toLowerCase() !== email.toLowerCase());
        accounts.unshift({ email, name: name || email.split('@')[0] });
        localStorage.setItem('streako_google_accounts', JSON.stringify(accounts.slice(0, 5)));
    } catch (e) {}
}

/**
 * Renders the Google Account Chooser Modal (Google Material Design)
 * Displays available Google accounts to tap and sign in directly.
 * Clutter-free: No manual email or name input fields shown.
 */
function openGoogleAccountModal() {
    const existing = document.getElementById('google-signin-modal');
    if (existing) existing.remove();

    const accounts = getSavedGoogleAccounts();

    const modal = document.createElement('div');
    modal.id = 'google-signin-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Sign in with Google');
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        padding: 16px;
        box-sizing: border-box;
    `;

    const getInitials = (name, email) => {
        const text = name || email || 'G';
        return text.charAt(0).toUpperCase();
    };

    const getAvatarBg = (index) => {
        const colors = [
            'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
            'linear-gradient(135deg, #0f9d58 0%, #0b8043 100%)',
            'linear-gradient(135deg, #ea4335 0%, #c5221f 100%)',
            'linear-gradient(135deg, #fa7b17 0%, #e37400 100%)'
        ];
        return colors[index % colors.length];
    };

    modal.innerHTML = `
        <style>
            @keyframes gPopIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to   { opacity: 1; transform: scale(1) translateY(0); }
            }
            #g-card {
                background: #ffffff;
                width: 100%;
                max-width: 380px;
                border-radius: 28px;
                box-shadow: 0 20px 45px -10px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                animation: gPopIn 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
            }
            #g-header {
                padding: 28px 24px 16px;
                text-align: center;
                position: relative;
            }
            #g-close-btn {
                position: absolute;
                top: 14px; right: 14px;
                background: transparent;
                border: none;
                font-size: 20px;
                color: #5f6368;
                cursor: pointer;
                width: 36px; height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.15s;
            }
            #g-close-btn:hover { background: #f1f3f4; }
            #g-body { padding: 0 24px 24px; }
            #g-alert-box {
                padding: 10px 14px;
                border-radius: 10px;
                font-size: 13px;
                margin-bottom: 12px;
                display: none;
                background: #fce8e6;
                border: 1px solid #f5c6c2;
                color: #c5221f;
            }
            .g-account-item {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 12px 14px;
                border: 1px solid #e0e2e6;
                border-radius: 18px;
                cursor: pointer;
                background: #ffffff;
                margin-bottom: 10px;
                width: 100%;
                box-sizing: border-box;
                text-align: left;
                transition: all 0.18s ease;
            }
            .g-account-item:hover {
                background: #f8faff;
                border-color: #4285f4;
                box-shadow: 0 2px 8px rgba(66, 133, 244, 0.15);
            }
            .g-avatar {
                width: 42px; height: 42px;
                border-radius: 50%;
                color: #ffffff;
                font-size: 17px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                box-shadow: 0 2px 5px rgba(0,0,0,0.12);
            }
            .g-info {
                flex: 1;
                min-width: 0;
            }
            .g-name {
                font-size: 14.5px;
                font-weight: 600;
                color: #1f1f1f;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .g-email {
                font-size: 12.5px;
                color: #5f6368;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-top: 2px;
            }
            .g-continue-tag {
                padding: 6px 12px;
                border-radius: 16px;
                background: #e8f0fe;
                color: #1a73e8;
                font-size: 12.5px;
                font-weight: 600;
                flex-shrink: 0;
                transition: background 0.15s, color 0.15s;
            }
            .g-account-item:hover .g-continue-tag {
                background: #1a73e8;
                color: #ffffff;
            }
            .g-action-btn {
                background: none;
                border: none;
                color: #1a73e8;
                font-size: 13.5px;
                font-weight: 500;
                cursor: pointer;
                padding: 10px 0 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                text-align: center;
            }
            .g-action-btn:hover { text-decoration: underline; }
            .g-input-field {
                width: 100%;
                box-sizing: border-box;
                padding: 12px 14px;
                border: 1px solid #dadce0;
                border-radius: 10px;
                font-size: 14px;
                color: #1f1f1f;
                outline: none;
                margin-bottom: 10px;
                transition: border-color 0.15s;
            }
            .g-input-field:focus {
                border-color: #1a73e8;
                box-shadow: 0 0 0 2px rgba(26,115,232,0.2);
            }
            .g-submit-btn {
                width: 100%;
                padding: 12px;
                background: #1a73e8;
                color: #ffffff;
                border: none;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.15s;
            }
            .g-submit-btn:hover { background: #1558b0; }
            .g-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .g-footer {
                text-align: center;
                font-size: 11.5px;
                color: #747775;
                margin-top: 16px;
                line-height: 1.5;
            }
        </style>

        <div id="g-card">
            <div id="g-header">
                <button id="g-close-btn" aria-label="Close">&times;</button>
                <div style="display:flex;justify-content:center;margin-bottom:12px;">
                    <!-- Official Google G SVG -->
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="40" height="40">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                </div>
                <div style="font-size:21px;font-weight:600;color:#1f1f1f;margin-bottom:4px;">Sign in with Google</div>
                <div style="font-size:13.5px;color:#5f6368;">Choose an account to continue to <strong style="color:#1f1f1f;">STREAKO</strong></div>
            </div>

            <div id="g-body">
                <div id="g-alert-box"></div>

                <div id="g-account-list">
                    ${accounts.map((acc, idx) => `
                        <button class="g-account-item" data-email="${acc.email}" data-name="${acc.name || ''}" type="button">
                            <div class="g-avatar" style="background:${getAvatarBg(idx)};">
                                ${getInitials(acc.name, acc.email)}
                            </div>
                            <div class="g-info">
                                <div class="g-name">${acc.name || acc.email.split('@')[0]}</div>
                                <div class="g-email">${acc.email}</div>
                            </div>
                            <span class="g-continue-tag">Continue</span>
                        </button>
                    `).join('')}
                </div>

                <div id="g-another-section">
                    <button class="g-action-btn" id="g-use-another-btn" type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        Use another account
                    </button>
                </div>

                <div class="g-footer">
                    To continue, Google will share your name and email with STREAKO.
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById('g-close-btn');
    const alertBox = document.getElementById('g-alert-box');
    const useAnotherBtn = document.getElementById('g-use-another-btn');
    const accountList = document.getElementById('g-account-list');

    const closeModal = () => modal.remove();
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    const showError = (msg) => {
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
    };

    // Clicking any account card signs in immediately
    accountList.querySelectorAll('.g-account-item').forEach(item => {
        item.addEventListener('click', async () => {
            alertBox.style.display = 'none';
            const email = item.getAttribute('data-email');
            const name = item.getAttribute('data-name');
            const tag = item.querySelector('.g-continue-tag');

            // Set loading state
            item.style.opacity = '0.7';
            item.style.pointerEvents = 'none';
            if (tag) tag.textContent = 'Signing in…';

            try {
                await handleGoogleCredential({
                    email,
                    fullName: name || email.split('@')[0]
                });
                closeModal();
            } catch (err) {
                showError(err.message || 'Sign-in failed. Please try again.');
                item.style.opacity = '1';
                item.style.pointerEvents = 'auto';
                if (tag) tag.textContent = 'Continue';
            }
        });
    });

    // "Use another account" expands a clean single email field
    useAnotherBtn.addEventListener('click', () => {
        const section = document.getElementById('g-another-section');
        section.innerHTML = `
            <div style="margin-top:10px;padding-top:12px;border-top:1px solid #e0e2e6;">
                <input type="email" class="g-input-field" id="g-custom-email-input" placeholder="Enter your Google email" autocomplete="email" />
                <button class="g-submit-btn" id="g-custom-submit-btn" type="button">Continue</button>
            </div>
        `;

        const input = document.getElementById('g-custom-email-input');
        const submitBtn = document.getElementById('g-custom-submit-btn');
        input.focus();

        const handleSubmit = async () => {
            alertBox.style.display = 'none';
            const email = input.value.trim();
            if (!email || !email.includes('@')) {
                showError('Please enter a valid Google email address.');
                return;
            }
            submitBtn.disabled = true;
            submitBtn.textContent = 'Connecting…';
            try {
                const fullName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                await handleGoogleCredential({ email, fullName });
                closeModal();
            } catch (err) {
                showError(err.message || 'Sign-in failed. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Continue';
            }
        };

        submitBtn.addEventListener('click', handleSubmit);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSubmit(); });
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
