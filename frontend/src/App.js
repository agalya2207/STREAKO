import { Router } from './utils/router.js';
import { state } from './utils/state.js';
import { Storage } from './utils/storage.js';

// Smart API helper that handles both proxied /api and fallback to localhost:5000 in dev
async function authApiRequest(endpoint, options = {}) {
    let res = null;
    let fallbackNeeded = false;
    try {
        res = await fetch(endpoint, options);
        const cType = res.headers.get('content-type') || '';
        if ((!res.ok || cType.includes('text/html')) && endpoint.startsWith('/api')) {
            fallbackNeeded = true;
        }
    } catch (netErr) {
        fallbackNeeded = true;
    }

    if (fallbackNeeded && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        const directUrl = `http://localhost:5000${endpoint}`;
        return await fetch(directUrl, options);
    }
    return res;
}

class App {
    constructor() {
        this.router = new Router();
        this.storage = Storage;
        this.state = state;
    }

    init() {
        // Expose global app instance for legacy inline handlers (onclick)
        window.app = this;

        window.handleForgotPasswordClick = () => {
            const emailInput = document.getElementById('login-email');
            if (emailInput && emailInput.value.trim()) {
                sessionStorage.setItem('streako_forgot_email', emailInput.value.trim());
            }
            if (window.app && window.app.router) {
                window.app.router.navigate('/forgot-password');
            } else {
                window.location.href = '/forgot-password';
            }
        };

        window.goToPage = (pageId) => {
            const routeMap = {
                'landing': '/landing',
                'signup': '/signup',
                'login': '/login',
                'forgot-password': '/forgot-password',
                'reset-password': '/forgot-password',
                'role-selection': '/role-selection',
                'onboarding': '/onboarding',
                'dashboard': '/dashboard',
                'habits-library': '/habits-library',
                'timeline': '/timeline',
                'calendar': '/calendar',
                'goals': '/goals',
                'analytics': '/analytics',
                'journal': '/journal',
                'mentor-dashboard': '/mentor-dashboard',
                'settings': '/settings'
            };
            this.router.navigate(routeMap[pageId] || '/');
        };

        window.selectRole = (element, roleType) => {
            element.parentElement.querySelectorAll('.role-option-card').forEach(card => {
                if (card !== element) card.classList.remove('selected');
            });
            element.classList.add('selected');
        };

        // Global Notification Toast
        window.showNotification = (message, type = 'info') => {
            let toastContainer = document.getElementById('toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'toast-container';
                toastContainer.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
                document.body.appendChild(toastContainer);
            }
            const toast = document.createElement('div');
            toast.style.cssText = `background: ${type === 'success' ? 'rgba(5, 150, 105, 0.95)' : 'rgba(30, 41, 59, 0.95)'}; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s ease; transform: translateY(20px); opacity: 0; pointer-events: auto;`;
            toast.textContent = message;
            toastContainer.appendChild(toast);
            requestAnimationFrame(() => {
                toast.style.transform = 'translateY(0)';
                toast.style.opacity = '1';
            });
            setTimeout(() => {
                toast.style.transform = 'translateY(20px)';
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        };

        // Global logout function
        window.logout = async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            } catch (e) { /* ignore network errors on logout */ }
            localStorage.removeItem('access_token');
            localStorage.removeItem('streako_auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('expires_at');
            localStorage.removeItem('user');
            localStorage.removeItem('streako_user');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_email');
            if (window.app && window.app.router) window.app.router.navigate('/login');
            else window.location.href = '/login';
        };


        // ── Confetti paper blast animation ──────────────────────────────────
        window.launchConfetti = (originX, originY) => {
            const startX = (originX !== undefined && originX !== null) ? originX : window.innerWidth / 2;
            const startY = (originY !== undefined && originY !== null) ? originY : window.innerHeight / 2;

            const colors = [
                '#00D9FF', '#38BDF8', '#0EA5E9',  // Vibrant Cyan & Sky Blue
                '#FF7A00', '#FB923C', '#FF5722',  // Vivid Orange & Amber
                '#FBBF24', '#F59E0B', '#FACC15',  // Bright Golden Yellow
                '#EC4899', '#F43F5E', '#E11D48',  // Hot Pink & Rose
                '#10B981', '#34D399', '#059669',  // Emerald Green
                '#8B5CF6', '#6366F1'               // Purple & Indigo
            ];
            const shapes = ['rect', 'square', 'circle', 'strip', 'diamond'];
            const count = 80;

            for (let i = 0; i < count; i++) {
                const el = document.createElement('div');
                const color = colors[Math.floor(Math.random() * colors.length)];
                const shape = shapes[Math.floor(Math.random() * shapes.length)];
                const size = Math.random() * 8 + 6;

                // Spread upward & outward fan
                const spreadAngle = (Math.random() * 150 - 165) * (Math.PI / 180);
                const velocity = Math.random() * 280 + 110;
                
                const vx = Math.cos(spreadAngle) * velocity;
                const vy = Math.sin(spreadAngle) * velocity;
                
                const rotX = Math.random() * 360;
                const rotY = Math.random() * 360;
                const rotZ = Math.random() * 360;
                const rotSpeedX = (Math.random() - 0.5) * 800;
                const rotSpeedY = (Math.random() - 0.5) * 800;
                const rotSpeedZ = (Math.random() - 0.5) * 400;

                const wobbleSpeed = Math.random() * 8 + 4;
                const wobbleMag = Math.random() * 25 + 8;
                const duration = Math.random() * 700 + 850;
                const delay = Math.random() * 70;

                let width = size;
                let height = size;
                let borderRadius = '2px';
                let clipPath = 'none';

                if (shape === 'rect') {
                    width = size * 1.7;
                    height = size * 0.8;
                } else if (shape === 'strip') {
                    width = Math.max(3, size * 0.45);
                    height = size * 2.8;
                    borderRadius = '1px';
                } else if (shape === 'circle') {
                    borderRadius = '50%';
                } else if (shape === 'diamond') {
                    clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
                }

                el.style.cssText = `
                    position: fixed;
                    left: ${startX}px;
                    top: ${startY}px;
                    width: ${Math.round(width)}px;
                    height: ${Math.round(height)}px;
                    background: ${color};
                    border-radius: ${borderRadius};
                    ${clipPath !== 'none' ? `clip-path: ${clipPath};` : ''}
                    pointer-events: none;
                    z-index: 999999;
                    opacity: 1;
                    transform-origin: center center;
                    will-change: transform, opacity;
                    box-shadow: 0 0 4px ${color}77;
                `;
                document.body.appendChild(el);

                const startTime = performance.now() + delay;
                const animate = (now) => {
                    if (now < startTime) {
                        requestAnimationFrame(animate);
                        return;
                    }
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeOut = 1 - Math.pow(1 - progress, 2.5);
                    
                    const gravity = 340 * progress * progress;
                    const wobble = Math.sin(progress * wobbleSpeed) * wobbleMag;

                    const currentX = startX + vx * easeOut + wobble;
                    const currentY = startY + vy * easeOut + gravity;

                    const rx = rotX + rotSpeedX * progress;
                    const ry = rotY + rotSpeedY * progress;
                    const rz = rotZ + rotSpeedZ * progress;

                    const opacity = progress < 0.65 ? 1 : 1 - ((progress - 0.65) / 0.35);

                    el.style.left = currentX + 'px';
                    el.style.top = currentY + 'px';
                    el.style.opacity = opacity.toFixed(2);
                    el.style.transform = `translate(-50%, -50%) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${1 - progress * 0.15})`;

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        el.remove();
                    }
                };
                requestAnimationFrame(animate);
            }
        };

        window.markRecovered = () => {
            const card = document.getElementById('recovery-card');
            if (!card) return;

            // INCREMENT COMEBACK RATE
            const comebackRateElement = document.querySelector('[data-metric="comeback-rate"]');
            if (comebackRateElement) {
                let currentRate = parseInt(comebackRateElement.textContent) || 80;
                const newRate = Math.min(currentRate + 5, 100);
                comebackRateElement.textContent = newRate + '%';
                
                // Animate the change
                comebackRateElement.style.transition = 'transform 0.3s ease';
                comebackRateElement.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    comebackRateElement.style.transform = 'scale(1)';
                }, 300);
            }

            card.innerHTML = `
                <div class="recovery-success" style="display: flex; gap: 16px; align-items: center;">
                    <div style="font-size: 28px;">✅</div>
                    <div class="recovery-text">
                        <strong>Streak Recovered!</strong>
                        <p style="margin: 4px 0 0 0;">"Meditation" is back on track.</p>
                        <p style="margin: 2px 0 0 0;">Your Comeback Rate just went up to ${
                            document.querySelector('[data-metric="comeback-rate"]')?.textContent || '85%'
                        }.</p>
                    </div>
                </div>
            `;

            // SHOW NOTIFICATION
            if (window.showNotification) {
                window.showNotification('🔥 Streak recovered! Keep it up!', 'success');
            }

            // SAVE RECOVERY STATE
            Storage.set('streakRecovered', true);
            Storage.set('lastRecoveryDate', new Date().toISOString());

            setTimeout(() => {
                card.style.display = 'none';
            }, 2500);
        };

        // Check if already recovered today
        window.checkRecoveryStatus = () => {
            const lastRecoveryDate = Storage.get('lastRecoveryDate');
            const today = new Date().toISOString().split('T')[0];
            const lastRecoveryDay = lastRecoveryDate ? lastRecoveryDate.split('T')[0] : null;

            // If recovered today, hide the card
            if (lastRecoveryDay === today) {
                const card = document.getElementById('recovery-card');
                if (card) {
                    card.style.display = 'none';
                }
            }
        };

        window.updateDashboardSubtitle = () => {
            const boxes = document.querySelectorAll('.habit-checkbox');
            const remaining = Array.from(boxes).filter(b => !b.checked).length;
            const subtitle = document.getElementById('dashboard-subtitle');
            if (subtitle) {
                const messages = {
                    3: "3 habits left today — you're closer than you think 🔥",
                    2: "2 habits left today — keep the momentum going 💪",
                    1: "1 habit left today — you're almost there ⚡",
                    0: "All done for today — perfect record! 🎉"
                };
                subtitle.textContent = messages[remaining] !== undefined ? messages[remaining] : `${remaining} habits left today — keep it up! 🔥`;
            }
        };

        // Priorities State & Render Logic (Loaded from Storage)
        window.prioritiesData = Storage.get('priorities', []);
        window.isAddingPriority = false;

        window.renderPriorities = () => {
            const container = document.getElementById('priorities-container');
            if (!container) return;

            const maxPriorities = 3;
            const canAdd = window.prioritiesData.length < maxPriorities;
            const addBtn = document.getElementById('btn-top-add-priority');
            if (addBtn) {
                addBtn.style.display = canAdd ? 'inline-block' : 'none';
            }

            let html = '';
            if (window.prioritiesData.length === 0 && !window.isAddingPriority) {
                html = `
                    <div class="empty-state-box">
                        <p class="empty-state-text">Your day is clear. Add your Top 3 priorities.</p>
                        <button onclick="window.startAddingPriority()" class="btn-subtle-create">+ Create Top Priority</button>
                    </div>
                `;
            } else {
                html = `<div style="display: flex; flex-direction: column; gap: 10px;">`;
                window.prioritiesData.forEach((p, index) => {
                    html += `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.95); padding: 13px 16px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2); box-shadow: 0 2px 8px rgba(6, 78, 59, 0.04); transition: all 0.2s;">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <span style="color: #64748b; font-weight: 700; font-size: 13.5px; min-width: 16px;">${index + 1}</span>
                                <input type="checkbox" onchange="window.togglePriority(${index}, event)" ${p.completed ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #6366f1; cursor: pointer; border-radius: 4px;">
                                <span style="font-size: 14px; font-weight: 500; color: ${p.completed ? '#64748b' : '#142a1d'}; text-decoration: ${p.completed ? 'line-through' : 'none'}; transition: all 0.2s;">${p.text}</span>
                            </div>
                            <button onclick="window.deletePriority(${index})" style="background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 14px; padding: 4px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#64748b'">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    `;
                });

                if (window.isAddingPriority && canAdd) {
                    const nextIndex = window.prioritiesData.length + 1;
                    html += `
                        <div style="display: flex; align-items: center; gap: 12px; background: rgba(16, 185, 129, 0.1); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.3);">
                            <span style="color: #059669; font-weight: 700; font-size: 13.5px; min-width: 16px;">${nextIndex}</span>
                            <input type="text" id="new-priority-input" placeholder="Type your priority..." style="flex: 1; background: transparent; border: none; outline: none; color: #142a1d; font-size: 14px;" autocomplete="off">
                            <div style="display: flex; gap: 8px;">
                                <button onclick="window.cancelPriority()" style="background: transparent; border: 1px solid rgba(16, 185, 129, 0.25); color: #4b6d5b; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">Cancel</button>
                                <button onclick="window.savePriority()" style="background: linear-gradient(90deg, #059669, #10b981); border: none; color: #ffffff; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; box-shadow: 0 2px 8px rgba(16,185,129,0.3);">Add</button>
                            </div>
                        </div>
                    `;
                }
                html += `</div>`;
            }

            container.innerHTML = html;
            
            if (window.isAddingPriority) {
                const input = document.getElementById('new-priority-input');
                if (input) {
                    input.focus();
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            window.savePriority();
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            window.cancelPriority();
                        }
                    });
                }
            }
        };

        window.startAddingPriority = () => {
            window.isAddingPriority = true;
            window.renderPriorities();
        };

        window.cancelPriority = () => {
            window.isAddingPriority = false;
            window.renderPriorities();
        };

        window.savePriority = () => {
            const input = document.getElementById('new-priority-input');
            const text = input ? input.value.trim() : '';
            if (text) {
                window.prioritiesData.push({
                    id: Date.now(),
                    text,
                    completed: false
                });
                Storage.set('priorities', window.prioritiesData);
                window.isAddingPriority = false;
                window.renderPriorities();
            }
        };

        window.deletePriority = (index) => {
            window.prioritiesData.splice(index, 1);
            Storage.set('priorities', window.prioritiesData);
            window.renderPriorities();
        };

        window.togglePriority = (index, event) => {
            const willComplete = !window.prioritiesData[index].completed;
            window.prioritiesData[index].completed = willComplete;
            Storage.set('priorities', window.prioritiesData);
            if (willComplete && window.launchConfetti) {
                const checkbox = event && event.target ? event.target : document.querySelector(`[onchange="window.togglePriority(${index})"]`);
                if (checkbox) {
                    const rect = checkbox.getBoundingClientRect();
                    window.launchConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
                }
            }
            window.renderPriorities();
        };

        // Reflections Modal Handlers
        window.currentReflectionType = 'morning';
        window.openReflectionModal = (type) => {
            window.currentReflectionType = type;
            const modal = document.getElementById('dashboard-reflection-modal');
            const title = document.getElementById('ref-modal-title');
            const desc = document.getElementById('ref-modal-desc');
            const textarea = document.getElementById('ref-modal-text');
            if (!modal) return;

            const today = new Date().toISOString().split('T')[0];
            const stored = Storage.get(`daily_reflections_${today}`, { morning: '', evening: '' });

            if (type === 'morning') {
                if (title) title.textContent = 'Morning Focus';
                if (desc) desc.textContent = 'Write down your primary focus and intentions to start the day with clarity.';
                if (textarea) textarea.value = stored.morning || '';
            } else {
                if (title) title.textContent = 'Evening Review';
                if (desc) desc.textContent = 'Reflect on your accomplishments, learnings, and practice gratitude.';
                if (textarea) textarea.value = stored.evening || '';
            }

            modal.style.display = 'flex';
            if (textarea) textarea.focus();
        };

        window.closeReflectionModal = () => {
            const modal = document.getElementById('dashboard-reflection-modal');
            if (modal) modal.style.display = 'none';
        };

        window.saveReflection = () => {
            const textarea = document.getElementById('ref-modal-text');
            const val = textarea ? textarea.value.trim() : '';
            const today = new Date().toISOString().split('T')[0];
            const stored = Storage.get(`daily_reflections_${today}`, { morning: '', evening: '' });
            
            stored[window.currentReflectionType] = val;
            Storage.set(`daily_reflections_${today}`, stored);
            
            window.closeReflectionModal();
            window.updateReflectionUI();
            if (window.showNotification) {
                window.showNotification('Reflection saved!', 'success');
            }
        };

        window.updateReflectionUI = () => {
            const today = new Date().toISOString().split('T')[0];
            const stored = Storage.get(`daily_reflections_${today}`, { morning: '', evening: '' });
            
            const morningStatus = document.getElementById('ref-status-morning');
            const eveningStatus = document.getElementById('ref-status-evening');
            const morningBtn = document.getElementById('btn-morning-ref');
            const eveningBtn = document.getElementById('btn-evening-ref');

            const hasMorning = !!(stored.morning && stored.morning.trim());
            const hasEvening = !!(stored.evening && stored.evening.trim());

            if (morningStatus) {
                if (hasMorning) {
                    morningStatus.textContent = '✅ Done';
                    morningStatus.style.color = '#34d399';
                    if (morningBtn) {
                        morningBtn.textContent = 'Edit Reflection';
                        morningBtn.classList.add('done');
                    }
                } else {
                    morningStatus.textContent = '⏳ Pending';
                    morningStatus.style.color = '#94a3b8';
                    if (morningBtn) {
                        morningBtn.textContent = 'Start Reflection';
                        morningBtn.classList.remove('done');
                    }
                }
            }

            if (eveningStatus) {
                if (hasEvening) {
                    eveningStatus.textContent = '✅ Done';
                    eveningStatus.style.color = '#34d399';
                    if (eveningBtn) {
                        eveningBtn.textContent = 'Edit Evening';
                        eveningBtn.classList.add('done');
                    }
                } else {
                    eveningStatus.textContent = '⏳ Pending';
                    eveningStatus.style.color = '#64748b';
                    if (eveningBtn) {
                        eveningBtn.textContent = 'Record Evening';
                        eveningBtn.classList.remove('done');
                    }
                }
            }

            // Dynamic Daily Insight banner handling
            const insightBanner = document.getElementById('today-insight-banner') || document.querySelector('.today-insight-banner');
            const insightText = document.getElementById('daily-insight-text') || (insightBanner ? insightBanner.querySelector('.insight-text') : null);

            if (insightBanner) {
                if (hasMorning && hasEvening) {
                    insightBanner.style.display = 'none';
                } else if (hasMorning && !hasEvening) {
                    insightBanner.style.display = 'flex';
                    if (insightText) {
                        insightText.textContent = 'Plan your evening: Writing down reflections increases habit completion rate by 22%.';
                    }
                } else if (!hasMorning && hasEvening) {
                    insightBanner.style.display = 'flex';
                    if (insightText) {
                        insightText.textContent = 'Plan your morning: Writing down reflections increases habit completion rate by 22%.';
                    }
                } else {
                    insightBanner.style.display = 'flex';
                    if (insightText) {
                        insightText.textContent = 'Plan your morning: Writing down reflections increases habit completion rate by 22%.';
                    }
                }
            }
        };

        
        // Color Wheel & Emoji Helper Functions (Photo 1 matching)
        window.hslToHex = (h, s, l) => {
            l /= 100;
            const a = s * Math.min(l, 1 - l) / 100;
            const f = n => {
                const k = (n + h / 30) % 12;
                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color).toString(16).padStart(2, '0');
            };
            return `#${f(0)}${f(8)}${f(4)}`;
        };

        window.colorToHue = (hex) => {
            if (!hex) return 180;
            let c = hex.replace('#', '');
            if (c.length === 3) c = c.split('').map(x => x + x).join('');
            const num = parseInt(c, 16);
            if (isNaN(num)) return 180;
            const r = (num >> 16) / 255;
            const g = ((num >> 8) & 0xff) / 255;
            const b = (num & 0xff) / 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h = 0;
            if (max === min) h = 0;
            else if (max === r) h = (60 * ((g - b) / (max - min)) + 360) % 360;
            else if (max === g) h = (60 * ((b - r) / (max - min)) + 120) % 360;
            else if (max === b) h = (60 * ((r - g) / (max - min)) + 240) % 360;
            return Math.round(h);
        };

        window.initColorWheel = () => {
            const wrapper = document.getElementById('color-wheel-wrapper');
            const thumb = document.getElementById('wheel-thumb');
            const centerBtn = document.getElementById('wheel-center-emoji-btn');
            const emojiText = document.getElementById('wheel-current-emoji');
            const quickEmojiRow = document.getElementById('quick-emoji-row');
            if (!wrapper || !thumb || !centerBtn) return;

            const quickEmojis = ['🔥', '💪', '📚', '🏃', '💧', '🧘', '🎯', '☀️', '✍️', '☕', '🌙', '🥑', '🚀', '💻', '🎨', '🎵', '🚴', '🥗', '🧠', '⚡', '🍎', '💤', '📖', '🏆'];

            if (quickEmojiRow) {
                quickEmojiRow.innerHTML = quickEmojis.map(emoji => `
                    <button type="button" class="quick-emoji-btn" data-emoji="${emoji}" style="font-size: 28px; width: 46px; height: 46px; border: none; background: transparent; cursor: pointer; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1); user-select: none; flex-shrink: 0;" onmouseover="this.style.transform='scale(1.25)'" onmouseout="this.style.transform='scale(1)'">${emoji}</button>
                `).join('');

                quickEmojiRow.querySelectorAll('.quick-emoji-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const emoji = btn.getAttribute('data-emoji');
                        window.setHabitEmoji(emoji);
                    };
                });
            }

            const centerX = 105;
            const centerY = 105;
            const ringRadius = 87; // middle of the 70px - 104px ring

            function setWheelColorByAngle(angleDeg, triggerChange = true) {
                const rad = (angleDeg - 90) * Math.PI / 180;
                const x = centerX + ringRadius * Math.cos(rad);
                const y = centerY + ringRadius * Math.sin(rad);

                thumb.style.left = `${x}px`;
                thumb.style.top = `${y}px`;

                // Calculate matching color
                // Conic gradient start (0deg) has hue 340 (pink-red)
                const hue = Math.round((angleDeg + 340) % 360);
                const hslColor = `hsl(${hue}, 95%, 50%)`;
                const hslBg = `hsla(${hue}, 95%, 50%, 0.14)`;
                const hex = window.hslToHex(hue, 95, 50);

                thumb.style.background = hslColor;
                centerBtn.style.borderColor = hslColor;
                centerBtn.style.backgroundColor = hslBg;
                centerBtn.style.boxShadow = `0 6px 22px hsla(${hue}, 95%, 50%, 0.3)`;

                if (triggerChange) {
                    window.selectedColor = hex;
                }
            }

            function handlePointer(e) {
                const rect = wrapper.getBoundingClientRect();
                const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
                const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

                const dx = clientX - (rect.left + rect.width / 2);
                const dy = clientY - (rect.top + rect.height / 2);

                const cartesianAngle = Math.atan2(dy, dx) * 180 / Math.PI;
                const conicAngle = (cartesianAngle + 90 + 360) % 360;

                setWheelColorByAngle(conicAngle, true);
            }

            let isDragging = false;

            wrapper.onpointerdown = (e) => {
                if (e.target.closest('#wheel-center-emoji-btn')) return;
                isDragging = true;
                wrapper.setPointerCapture(e.pointerId);
                handlePointer(e);
            };

            wrapper.onpointermove = (e) => {
                if (isDragging) {
                    handlePointer(e);
                }
            };

            wrapper.onpointerup = (e) => {
                if (isDragging) {
                    isDragging = false;
                    try { wrapper.releasePointerCapture(e.pointerId); } catch(_) {}
                }
            };

            wrapper.onpointercancel = () => {
                isDragging = false;
            };

            window.setHabitEmoji = (emoji) => {
                if (!emoji) return;
                window.selectedIcon = emoji;
                if (emojiText) {
                    emojiText.textContent = emoji;
                    emojiText.style.transform = 'scale(1.25)';
                    setTimeout(() => {
                        if (emojiText) emojiText.style.transform = 'scale(1)';
                    }, 180);
                }
            };

            window.triggerEmojiSelector = () => {
                const customWrap = document.getElementById('custom-emoji-input-wrap');
                const customInput = document.getElementById('custom-emoji-input');
                if (customWrap && customInput) {
                    customWrap.style.display = customWrap.style.display === 'none' ? 'flex' : 'none';
                    if (customWrap.style.display === 'flex') {
                        customInput.focus();
                    }
                }
            };

            window.syncWheelToColorAndEmoji = (color, emoji) => {
                const activeEmoji = emoji || '🔥';
                window.setHabitEmoji(activeEmoji);

                let angle = 180; // default cyan / emerald
                if (color) {
                    const hue = window.colorToHue(color);
                    angle = (hue - 340 + 360) % 360;
                }
                setWheelColorByAngle(angle, false);
                window.selectedColor = color || window.hslToHex((angle + 340) % 360, 95, 50);
            };
        };


        // Habits Library State & Logic
        window.selectedIcon = '';
        window.selectedColor = '';
        window.selectedFrequency = 'Daily';
        window.selectedWeekdays = [];
        window.editingHabitId = null;

        window.seedHabits = () => {
            if (Storage) {
                const defaultHabits = [
                    { id: "habit_wakeup", name: "Wake up early (6:00 AM)", description: "Start the day productively", category: "Health", dailyTarget: 1, icon: "☀️", accentColor: "#f59e0b", frequency: "Daily", streak: 0, bestStreak: 15, frequencyLabel: "Daily", paused: false },
                    { id: "habit_cardio", name: "Cardio / Weight Training", description: "30-45 minutes workout session", category: "Fitness", dailyTarget: 1, icon: "💪", accentColor: "#ef4444", frequency: "Daily", streak: 3, bestStreak: 12, frequencyLabel: "Daily", paused: false },
                    { id: "habit_reading", name: "Read 15 Pages", description: "Non-fiction or professional development", category: "Learning", dailyTarget: 1, icon: "📚", accentColor: "#3b82f6", frequency: "Daily", streak: 9, bestStreak: 21, frequencyLabel: "Daily", paused: false },
                    { id: "habit_meditation", name: "Meditation & Breathwork", description: "10 minutes mindfulness session", category: "Mindfulness", dailyTarget: 1, icon: "🧘", accentColor: "#8b5cf6", frequency: "Daily", streak: 5, bestStreak: 8, frequencyLabel: "Daily", paused: false },
                    { id: "habit_hydration", name: "Drink 3L Water", description: "Stay hydrated throughout the day", category: "Health", dailyTarget: 1, icon: "💧", accentColor: "#0ea5e9", frequency: "Daily", streak: 14, bestStreak: 22, frequencyLabel: "Daily", paused: false },
                    { id: "habit_deepwork", name: "Deep Work (2 Hours)", description: "Focus on primary project without distractions", category: "Career", dailyTarget: 1, icon: "💼", accentColor: "#6366f1", frequency: "Daily", streak: 4, bestStreak: 9, frequencyLabel: "Daily", paused: false },
                    { id: "habit_reflection", name: "Reflective Journaling", description: "Morning and evening thoughts log", category: "Personal", dailyTarget: 1, icon: "✍️", accentColor: "#ec4899", frequency: "Daily", streak: 6, bestStreak: 10, frequencyLabel: "Daily", paused: false }
                ];
                const habits = Storage.getHabits();
                if (habits.length === 0 || (habits.length === 6 && habits[0].name === "Morning Workout")) {
                    localStorage.removeItem('streako_habits');
                    defaultHabits.forEach(h => Storage.addHabit(h));
                }
            }
        };

        window.openCreateHabitModal = () => {
            window.editingHabitId = null;
            const titleEl = document.getElementById('habit-modal-title') || document.querySelector('#habit-modal h2');
            if (titleEl) titleEl.textContent = 'Define New Routine';
            const createBtn = document.getElementById('create-habit-btn');
            if (createBtn) createBtn.textContent = 'Create Routine';
            const targetEl = document.getElementById('habit-target');
            if (targetEl) targetEl.value = 1;
            
            // Attach the input listener now that the page is in the DOM (SPA load).
            window._attachHabitTargetListener();
            if (window.renderSessionFields) window.renderSessionFields();
            
            // Initialize Interactive Color Wheel & Default Emoji (🔥, #00e5ff)
            if (window.initColorWheel) {
                window.initColorWheel();
                window.syncWheelToColorAndEmoji('#00e5ff', '🔥');
            }
            
            window.selectedFrequency = 'Daily';
            window.updateFrequencyButtons();

            const overlay = document.getElementById('habit-modal-overlay');
            if (overlay) overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        };

        window.closeHabitModal = () => {
            const overlay = document.getElementById('habit-modal-overlay');
            if (overlay) overlay.style.display = 'none';
            // Restore background scroll
            document.body.style.overflow = '';
            // Reset fields
            const nameEl = document.getElementById('habit-name');
            if(nameEl) nameEl.value = '';
            const descEl = document.getElementById('habit-desc');
            if(descEl) descEl.value = '';
            const catEl = document.getElementById('habit-category');
            if(catEl) catEl.selectedIndex = 0;
            const targetEl = document.getElementById('habit-target');
            if(targetEl) targetEl.value = 1;
            if (window.renderSessionFields) window.renderSessionFields();
            window.selectedIcon = '';
            window.selectedColor = '';
            window.selectedFrequency = 'Daily';
            window.updateFrequencyButtons();
            window.clearSelections();
        };

        window.clearSelections = () => {
            document.querySelectorAll('.icon-btn').forEach(btn => btn.style.background = 'transparent');
            document.querySelectorAll('.color-swatch').forEach(swatch => swatch.style.outline = 'none');
        };

        window.updateFrequencyButtons = () => {
            const everyday = document.getElementById('freq-everyday');
            const weekdays = document.getElementById('freq-weekdays');
            if (everyday) {
                const isEveryday = window.selectedFrequency === 'Daily';
                everyday.style.borderColor = isEveryday ? '#059669' : 'rgba(16, 185, 129, 0.25)';
                everyday.style.background = isEveryday ? 'rgba(16, 185, 129, 0.12)' : '#ffffff';
                everyday.style.color = isEveryday ? '#065f46' : '#142a1d';
                everyday.style.fontWeight = isEveryday ? '700' : '600';
            }
            if (weekdays) {
                const isWeekdays = window.selectedFrequency === 'Weekdays';
                weekdays.style.borderColor = isWeekdays ? '#059669' : 'rgba(16, 185, 129, 0.25)';
                weekdays.style.background = isWeekdays ? 'rgba(16, 185, 129, 0.12)' : '#ffffff';
                weekdays.style.color = isWeekdays ? '#065f46' : '#142a1d';
                weekdays.style.fontWeight = isWeekdays ? '700' : '600';
            }
        };

        // Delegated events for habit modal
        document.addEventListener('click', function(e) {
            if (e.target.matches('.icon-btn')) {
                window.clearSelections();
                window.selectedIcon = e.target.getAttribute('data-icon');
                e.target.style.background = 'rgba(0,217,255,0.2)';
            }
            if (e.target.matches('.color-swatch')) {
                document.querySelectorAll('.color-swatch').forEach(s => s.style.outline = 'none');
                window.selectedColor = e.target.getAttribute('data-color');
                e.target.style.outline = '2px solid #00D9FF';
            }
            if (e.target.matches('.freq-btn')) {
                window.selectedFrequency = e.target.getAttribute('data-value');
                window.updateFrequencyButtons();
                const weekdayContainer = document.getElementById('weekday-container');
                if(weekdayContainer) {
                    if (window.selectedFrequency === 'Weekdays') {
                        weekdayContainer.style.display = 'flex';
                    } else {
                        weekdayContainer.style.display = 'none';
                        window.selectedWeekdays = [];
                        document.querySelectorAll('.weekday-btn').forEach(btn => {
                            btn.style.background = '#111';
                            btn.style.color = '#fff';
                        });
                    }
                }
            }
            if (e.target.matches('.weekday-btn')) {
                const day = e.target.getAttribute('data-day');
                const idx = window.selectedWeekdays.indexOf(day);
                if (idx === -1) {
                    window.selectedWeekdays.push(day);
                    e.target.style.background = '#00D9FF';
                    e.target.style.color = '#001428';
                } else {
                    window.selectedWeekdays.splice(idx, 1);
                    e.target.style.background = '#111';
                    e.target.style.color = '#fff';
                }
            }
        });

        // ─────────────────────────────────────────────────────────────────────
        // Session fields rendering
        // ─────────────────────────────────────────────────────────────────────

        // Helper: convert 24-hour "HH:MM" string to 12-hour "h:MM AM/PM" string.
        // Returns the placeholder "-- : --" when the value is empty/unset.
        // Examples:  "00:00" → "12:00 AM"
        //            "09:30" → "9:30 AM"
        //            "13:45" → "1:45 PM"
        //            "23:59" → "11:59 PM"
        window.to12h = (val) => {
            if (!val) return '-- : --';
            const [hStr, mStr] = val.split(':');
            let h = parseInt(hStr, 10);
            const m = mStr || '00';
            const period = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;   // 0  → 12 (midnight), 12 → 12 (noon), 13 → 1, etc.
            return `${h}:${m} ${period}`;
        };

        // Renders exactly `target` session rows.  Always clears the container
        // first (innerHTML = '') to prevent stale rows from accumulating.
        // Inclusive loop (i = 1 … target) avoids off-by-one errors.
        // Does NOT write back to targetInput.value — that would fight mid-type edits.
        window.renderSessionFields = (forceTarget = null, prefilledSessions = null) => {
            const container = document.getElementById('habit-sessions-container');
            const targetInput = document.getElementById('habit-target');
            if (!container || !targetInput) return;

            // Snapshot existing values so they survive a re-render triggered
            // when the user changes the target count.
            const existing = [];
            container.querySelectorAll('.session-row').forEach(row => {
                existing.push({
                    startTime: row.querySelector('.start-time').value,
                    endTime:   row.querySelector('.end-time').value
                });
            });

            // prefilledSessions (edit mode) takes priority over live snapshot.
            const sourceData = prefilledSessions || existing;

            let target = forceTarget !== null
                ? parseInt(forceTarget, 10)
                : (parseInt(targetInput.value, 10) || 1);
            if (isNaN(target) || target < 1) target = 1;

            // Always clear before re-populating to prevent row accumulation.
            container.innerHTML = '';

            // Build exactly `target` rows.
            // Each time column has:
            //   <input type="time" class="start-time|end-time" />  ← native picker (stores 24h value)
            //   <span class="time-display">                         ← live 12h text shown below
            for (let i = 1; i <= target; i++) {
                const data = sourceData[i - 1] || { startTime: '', endTime: '' };
                const html = `
                    <div class="session-row" style="display:flex; align-items:flex-start; gap:12px; background:rgba(255,255,255,0.92); padding:12px 14px; border-radius:10px; border:1.5px solid rgba(16, 185, 129, 0.22); box-shadow: 0 2px 8px rgba(6,78,59,0.04);">
                        <div style="font-size:13px; font-weight:700; min-width:70px; color:#142a1d; padding-top:20px;">Session ${i}</div>
                        <div style="flex:1;">
                            <label style="display:block; font-size:11px; margin-bottom:4px; color:#4b6d5b; text-transform:uppercase; letter-spacing:0.05em; font-weight:600;">Start Time</label>
                            <input type="time" class="start-time" value="${data.startTime}"
                                style="width:100%; padding:8px 10px; border-radius:8px; border:1.5px solid rgba(16, 185, 129, 0.3); background:#ffffff; color:#142a1d; font-size:13px; box-sizing:border-box; outline:none;" />
                            <span class="time-display" style="display:block; margin-top:4px; font-size:12px; font-weight:700; color:#059669; letter-spacing:0.04em;">${window.to12h(data.startTime)}</span>
                        </div>
                        <div style="flex:1;">
                            <label style="display:block; font-size:11px; margin-bottom:4px; color:#4b6d5b; text-transform:uppercase; letter-spacing:0.05em; font-weight:600;">End Time</label>
                            <input type="time" class="end-time" value="${data.endTime}"
                                style="width:100%; padding:8px 10px; border-radius:8px; border:1.5px solid rgba(16, 185, 129, 0.3); background:#ffffff; color:#142a1d; font-size:13px; box-sizing:border-box; outline:none;" />
                            <span class="time-display" style="display:block; margin-top:4px; font-size:12px; font-weight:700; color:#059669; letter-spacing:0.04em;">${window.to12h(data.endTime)}</span>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', html);
            }
        };

        // Delegated input & change listener for time displays.
        // One listener on `document` covers every session row (including rows added
        // after the initial render). Guarded by a flag so it is registered only once,
        // regardless of how many times the modal is opened and closed.
        if (!window._sessionTimeListenerAttached) {
            const updateDisplay = (e) => {
                const isSessionTime = e.target.matches(
                    '#habit-sessions-container .start-time, #habit-sessions-container .end-time'
                );
                if (!isSessionTime) return;
                // The .time-display <span> is the immediately next sibling of the input.
                const display = e.target.nextElementSibling;
                if (display && display.classList.contains('time-display')) {
                    display.textContent = window.to12h(e.target.value);
                }
            };
            document.addEventListener('input', updateDisplay);
            document.addEventListener('change', updateDisplay);
            window._sessionTimeListenerAttached = true;
        }

        // ----- Helper: attach the Daily Target listener exactly once -----
        // Called by openCreateHabitModal() and editHabit() AFTER the SPA router
        // has loaded the habits-library page into the DOM.  Calling at init()
        // time is too early — the element doesn't exist yet.
        window._attachHabitTargetListener = () => {
            if (window._habitTargetListenerAttached) return; // already attached
            const targetInput = document.getElementById('habit-target');
            if (!targetInput) return; // element not in DOM yet — skip silently
            const handler = () => {
                if (window.renderSessionFields) window.renderSessionFields();
            };
            targetInput.addEventListener('input',  handler);
            targetInput.addEventListener('change', handler);
            window._habitTargetListenerAttached = true;
        };

        // (listener attachment moved to window._attachHabitTargetListener,
        //  called from openCreateHabitModal / editHabit after the page loads)

        window.createHabit = () => {
            const nameInput = document.getElementById('habit-name');
            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) {
                if(nameInput) {
                    nameInput.style.border = '1px solid #EF4444';
                    setTimeout(() => nameInput.style.border = '1px solid #555', 500);
                }
                return;
            }
            
            const habit = {
                name,
                description: document.getElementById('habit-desc').value.trim(),
                category: document.getElementById('habit-category').value,
                dailyTarget: parseInt(document.getElementById('habit-target').value) || 1,
                icon: window.selectedIcon || '✅',
                accentColor: window.selectedColor || '#4F46E5',
                frequency: window.selectedFrequency,
                streak: 0, // Will be ignored if updating
                bestStreak: 0,
                frequencyLabel: window.selectedFrequency,
                paused: false
            };

            const container = document.getElementById('habit-sessions-container');
            const sessions = [];
            if (container) {
                const rows = container.querySelectorAll('.session-row');
                rows.forEach(row => {
                    sessions.push({
                        startTime: row.querySelector('.start-time').value,
                        endTime: row.querySelector('.end-time').value
                    });
                });
            }
            habit.sessions = sessions;
            
            // For backward compatibility / display on cards without full sessions logic
            if (sessions.length > 0) {
                if (sessions[0].startTime) habit.startTime = sessions[0].startTime;
                if (sessions[0].endTime) habit.endTime = sessions[0].endTime;
            }
            
            if (window.selectedFrequency === 'Weekdays') {
                habit.weekdays = [...window.selectedWeekdays];
            }

            if (Storage) {
                if (window.editingHabitId) {
                    delete habit.streak; // Don't reset streak on edit
                    delete habit.bestStreak;
                    Storage.updateHabit(window.editingHabitId, habit);
                } else {
                    Storage.addHabit(habit);
                }
            }
            window.renderHabits();
            window.closeHabitModal();
        };

        window.activeHabitsCategory = 'All';

        window.filterHabitsCategory = (cat, el) => {
            window.activeHabitsCategory = cat;
            const container = document.getElementById('habit-category-tabs');
            if (container) {
                container.querySelectorAll('.habit-tab').forEach(t => t.classList.remove('active'));
            }
            if (el) el.classList.add('active');
            window.renderHabits();
        };

        window.renderHabits = () => {
            const grid = document.querySelector('.habits-grid') || document.getElementById('habits-grid');
            if (!grid) return;
            grid.innerHTML = ''; // Clear current grid
            
            if (Storage && Storage.getHabits) {
                let habits = Storage.getHabits();
                const filter = window.activeHabitsCategory || 'All';
                if (filter !== 'All') {
                    habits = habits.filter(h => (h.category || '').toLowerCase() === filter.toLowerCase());
                }

                if (habits.length === 0) {
                    grid.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: rgba(255, 255, 255, 0.85); border-radius: 16px; border: 1.5px dashed rgba(16, 185, 129, 0.3); box-shadow: 0 4px 16px rgba(6, 78, 59, 0.04);">
                            <p style="color: #64748b; font-size: 15px; margin-bottom: 12px;">No routines found for category "${filter}".</p>
                            <button onclick="window.openCreateHabitModal()" style="background: linear-gradient(90deg, #059669, #10b981); color: #fff; border: none; padding: 9px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">+ Create Routine</button>
                        </div>
                    `;
                } else {
                    habits.forEach(habit => window.addHabitCard(habit, grid));
                }
            }
        };

        window.addHabitCard = (habit, gridElement) => {
            const card = document.createElement('div');
            card.className = 'habit-card';
            card.setAttribute('data-habit-id', habit.id);
            card.style.cssText = `
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(16, 185, 129, 0.24);
                border-radius: 16px;
                padding: 20px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                box-shadow: 0 4px 18px rgba(6, 78, 59, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03);
                transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
                opacity: ${habit.paused ? '0.65' : '1'};
            `;

            const accentColor = habit.accentColor || '#6366f1';
            const icon = habit.icon || '🎯';

            card.innerHTML = `
                <div>
                    <!-- Top row: Icon badge & Action buttons -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div style="width: 42px; height: 42px; border-radius: 10px; background: ${accentColor}1f; border: 1px solid ${accentColor}33; display: flex; align-items: center; justify-content: center; font-size: 20px; color: ${accentColor};">
                            ${icon}
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <button onclick="window.pauseHabit('${habit.id}')" title="${habit.paused ? 'Resume Habit' : 'Pause Habit'}" style="width: 32px; height: 32px; border-radius: 8px; background: transparent; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(16,185,129,0.12)'; this.style.color='#047857';" onmouseout="this.style.background='transparent'; this.style.color='#537562';">
                                ${habit.paused ? `
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                ` : `
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                `}
                            </button>
                            <button onclick="window.editHabit('${habit.id}')" title="Edit Habit" style="width: 32px; height: 32px; border-radius: 8px; background: transparent; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(16,185,129,0.12)'; this.style.color='#047857';" onmouseout="this.style.background='transparent'; this.style.color='#537562';">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button onclick="window.promptDeleteHabit('${habit.id}')" title="Delete Habit" style="width: 32px; height: 32px; border-radius: 8px; background: transparent; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.15)'; this.style.color='#ef4444';" onmouseout="this.style.background='transparent'; this.style.color='#64748b';">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Title & Description -->
                    <div style="font-size: 16px; font-weight: 700; color: #142a1d; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                        <span>${habit.name}</span>
                        ${habit.paused ? '<span style="font-size: 11px; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.12); padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">Paused</span>' : ''}
                    </div>
                    <div style="font-size: 13.5px; color: #4b6d5b; line-height: 1.4; margin-bottom: 20px; min-height: 38px;">
                        ${habit.description || 'No description provided'}
                    </div>
                </div>

                <!-- Footer / Metrics Bar matching reference screenshot -->
                <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(16, 185, 129, 0.16); padding-top: 14px; font-size: 12px; font-weight: 600; color: #4b6d5b;">
                    <div>
                        <span style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-right: 4px;">STREAK</span>
                        <span style="color: #142a1d; font-weight: 700;">🔥 ${habit.streak || 0}</span>
                    </div>
                    <div>
                        <span style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-right: 4px;">BEST</span>
                        <span style="color: #142a1d; font-weight: 700;">${habit.bestStreak || habit.streak || 0}d</span>
                    </div>
                    <div>
                        <span style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-right: 4px;">SCHEDULE</span>
                        <span style="color: #142a1d; font-weight: 700;">${habit.frequencyLabel || habit.frequency || 'Daily'}</span>
                    </div>
                </div>
            `;

            gridElement.appendChild(card);
        };

        window.pauseHabit = (id) => {
            if (Storage) {
                const habit = Storage.getHabit(id);
                if (habit) {
                    Storage.updateHabit(id, { paused: !habit.paused });
                    window.renderHabits();
                }
            }
        };

        window.editHabit = (id) => {
            if (!Storage) return;
            const habit = Storage.getHabit(id);
            if (!habit) return;

            window.editingHabitId = id;
            const titleEl = document.getElementById('habit-modal-title') || document.querySelector('#habit-modal h2');
            if (titleEl) titleEl.textContent = 'Edit Routine';
            document.getElementById('create-habit-btn').textContent = 'Save Changes';
            
            document.getElementById('habit-name').value = habit.name || '';
            document.getElementById('habit-desc').value = habit.description || '';
            
            const catEl = document.getElementById('habit-category');
            if (catEl && habit.category) {
                for (let i = 0; i < catEl.options.length; i++) {
                    if (catEl.options[i].value === habit.category) catEl.selectedIndex = i;
                }
            }
            
            const targetEl = document.getElementById('habit-target');
            if(targetEl) targetEl.value = habit.dailyTarget || 1;
            
            window.selectedIcon = habit.icon || '';
            window.selectedColor = habit.accentColor || '';
            window.selectedFrequency = habit.frequency || 'Daily';
            window.selectedWeekdays = habit.weekdays ? [...habit.weekdays] : [];
            
            const prefilledSessions = habit.sessions || [];
            if (prefilledSessions.length === 0 && (habit.startTime || habit.endTime)) {
                prefilledSessions.push({ startTime: habit.startTime || '', endTime: habit.endTime || '' });
            }
            
            // Attach the input listener now that the page is in the DOM (SPA load).
            window._attachHabitTargetListener();
            if (window.renderSessionFields) {
                window.renderSessionFields(habit.dailyTarget || 1, prefilledSessions);
            }

            window.updateFrequencyButtons();
            
            // Initialize interactive color wheel with habit's accent color & icon
            if (window.initColorWheel) {
                window.initColorWheel();
                window.syncWheelToColorAndEmoji(habit.accentColor || '#00e5ff', habit.icon || '🔥');
            }
            
            const weekdayContainer = document.getElementById('weekday-container');
            if (weekdayContainer) {
                if (window.selectedFrequency === 'Weekdays') {
                    weekdayContainer.style.display = 'flex';
                    document.querySelectorAll('.weekday-btn').forEach(btn => {
                        const day = btn.getAttribute('data-day');
                        if (window.selectedWeekdays.includes(day)) {
                            btn.style.background = '#00D9FF';
                            btn.style.color = '#001428';
                        } else {
                            btn.style.background = '#111';
                            btn.style.color = '#fff';
                        }
                    });
                } else {
                    weekdayContainer.style.display = 'none';
                }
            }
            
            const overlay = document.getElementById('habit-modal-overlay');
            if (overlay) overlay.style.display = 'flex';
            // Lock background scroll while modal is open
            document.body.style.overflow = 'hidden';
        };

        window.promptDeleteHabit = (id) => {
            if (!Storage) return;
            const habit = Storage.getHabit(id);
            if (habit) {
                if (confirm(`Are you sure you want to delete '${habit.name}'? This action cannot be undone.`)) {
                    Storage.deleteHabit(id);
                    window.renderHabits();
                }
            }
        };

        // ─────────────────────────────────────────────────────────────────────
        // PLANNER & TIMELINE PAGE LOGIC
        // ─────────────────────────────────────────────────────────────────────

        window.isAddingPlannerTask = false;

        window.startAddingTask = () => {
            window.isAddingPlannerTask = true;
            window.renderPlannerTasks();
        };

        window.cancelAddingTask = () => {
            window.isAddingPlannerTask = false;
            window.renderPlannerTasks();
        };

        window.savePlannerTask = () => {
            const input = document.getElementById('planner-task-input');
            const prioritySel = document.getElementById('planner-task-priority');
            const text = input ? input.value.trim() : '';
            const priority = prioritySel ? prioritySel.value : 'MEDIUM';

            if (text) {
                const tasks = Storage.get('planner_tasks', []);
                tasks.push({
                    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    text,
                    priority,
                    completed: false,
                    createdAt: new Date().toISOString()
                });
                Storage.set('planner_tasks', tasks);
                window.isAddingPlannerTask = false;
                window.renderPlannerTasks();
            }
        };

        window.togglePlannerTask = (taskId, event) => {
            const tasks = Storage.get('planner_tasks', []);
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                Storage.set('planner_tasks', tasks);
                if (task.completed && window.launchConfetti) {
                    const el = event && event.target ? event.target : document.getElementById(`task-cb-${taskId}`);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        window.launchConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
                    }
                }
                window.renderPlannerTasks();
            }
        };

        window.deletePlannerTask = (taskId) => {
            let tasks = Storage.get('planner_tasks', []);
            tasks = tasks.filter(t => t.id !== taskId);
            Storage.set('planner_tasks', tasks);
            window.renderPlannerTasks();
        };

        window.renderPlannerTasks = () => {
            const container = document.getElementById('planner-tasks-container');
            if (!container) return;

            let tasks = Storage.get('planner_tasks', []);

            // Migrate legacy priorities if no planner_tasks exist
            if (tasks.length === 0) {
                const priorities = Storage.get('priorities', []);
                if (priorities.length > 0) {
                    tasks = priorities.map((p, idx) => ({
                        id: 'task_legacy_' + idx,
                        text: p.text,
                        priority: idx === 0 ? 'HIGH' : idx === 1 ? 'MEDIUM' : 'LOW',
                        completed: !!p.completed,
                        createdAt: new Date().toISOString()
                    }));
                    Storage.set('planner_tasks', tasks);
                }
            }

            let html = '';

            if (tasks.length === 0 && !window.isAddingPlannerTask) {
                // Exact empty state matching reference screenshot
                html = `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 48px 20px;">
                        <div style="width: 56px; height: 56px; border-radius: 14px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #059669;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg>
                        </div>
                        <p style="color: #4b6d5b; font-size: 14px; margin: 0 0 20px 0; font-weight: 500;">Your day is clear. Add your Top 3 priorities.</p>
                        <button onclick="window.startAddingTask()" style="background: linear-gradient(90deg, #059669, #10b981); color: #ffffff; border: none; padding: 9px 22px; border-radius: 8px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='none'">+ Create Task</button>
                    </div>
                `;
            } else {
                html += `<div style="display: flex; flex-direction: column; gap: 12px; flex: 1;">`;

                tasks.forEach(t => {
                    const badgeColor = t.priority === 'HIGH' ? '#ef4444' : t.priority === 'MEDIUM' ? '#6366f1' : '#10b981';
                    const badgeBg = t.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : t.priority === 'MEDIUM' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)';

                    html += `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.95); padding: 14px 18px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2); box-shadow: 0 2px 8px rgba(6, 78, 59, 0.04); transition: all 0.2s;">
                            <div style="display: flex; align-items: center; gap: 14px; flex: 1;">
                                <input type="checkbox" onchange="window.togglePlannerTask('${t.id}')" ${t.completed ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #6366f1; cursor: pointer; border-radius: 4px;">
                                <span style="font-size: 14.5px; font-weight: 600; color: ${t.completed ? '#64748b' : '#142a1d'}; text-decoration: ${t.completed ? 'line-through' : 'none'}; transition: all 0.2s;">${t.text}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 11px; font-weight: 700; color: ${badgeColor}; background: ${badgeBg}; padding: 3px 10px; border-radius: 6px; letter-spacing: 0.04em;">${t.priority || 'MEDIUM'}</span>
                                <button onclick="window.deletePlannerTask('${t.id}')" title="Delete Task" style="background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 14px; padding: 4px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#64748b'">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    `;
                });

                if (window.isAddingPlannerTask) {
                    html += `
                        <div style="display: flex; flex-direction: column; gap: 10px; background: rgba(99, 102, 241, 0.08); padding: 14px 18px; border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.3);">
                            <input type="text" id="planner-task-input" placeholder="Enter task title..." style="width: 100%; background: transparent; border: none; outline: none; color: #142a1d; font-size: 14.5px; font-weight: 500;" autocomplete="off">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">Priority:</span>
                                    <select id="planner-task-priority" style="background: #ffffff; color: #142a1d; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 12px; outline: none;">
                                        <option value="HIGH">HIGH</option>
                                        <option value="MEDIUM" selected>MEDIUM</option>
                                        <option value="LOW">LOW</option>
                                    </select>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button onclick="window.cancelAddingTask()" style="background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #94a3b8; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 500;">Cancel</button>
                                    <button onclick="window.savePlannerTask()" style="background: linear-gradient(90deg, #059669, #10b981); border: none; color: #ffffff; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);">Add Task</button>
                                </div>
                            </div>
                        </div>
                    `;
                }

                html += `</div>`;
            }

            container.innerHTML = html;

            if (window.isAddingPlannerTask) {
                const input = document.getElementById('planner-task-input');
                if (input) {
                    input.focus();
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            window.savePlannerTask();
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            window.cancelAddingTask();
                        }
                    });
                }
            }
        };

        // Time Blocking Timeline Logic
        window.openTimeBlockModal = () => {
            const modal = document.getElementById('timeblock-modal-overlay');
            if (modal) modal.style.display = 'flex';
        };

        window.closeTimeBlockModal = () => {
            const modal = document.getElementById('timeblock-modal-overlay');
            if (modal) modal.style.display = 'none';
            const titleInput = document.getElementById('tb-title');
            if (titleInput) titleInput.value = '';
        };

        window.getPlannerBlocks = () => {
            let blocks = Storage.get('planner_blocks', null);
            if (!blocks) {
                blocks = [
                    { id: 'tb_1', title: '🧘 Meditation', startTime: '05:00', endTime: '05:30', color: '#10b981', completed: false },
                    { id: 'tb_2', title: '💪 Workout Session', startTime: '06:00', endTime: '07:00', color: '#ef4444', completed: false },
                    { id: 'tb_3', title: '💼 Deep Work Session', startTime: '09:00', endTime: '11:30', color: '#6366f1', completed: false },
                    { id: 'tb_4', title: '📚 Reading & Study', startTime: '14:00', endTime: '15:00', color: '#3b82f6', completed: false },
                    { id: 'tb_5', title: '✍️ Evening Reflection', startTime: '19:00', endTime: '19:30', color: '#ec4899', completed: false }
                ];
                Storage.set('planner_blocks', blocks);
            }
            return blocks;
        };

        window.saveTimeBlock = () => {
            const titleInput = document.getElementById('tb-title');
            const startInput = document.getElementById('tb-start');
            const endInput = document.getElementById('tb-end');
            const catInput = document.getElementById('tb-category');

            const title = titleInput ? titleInput.value.trim() : '';
            const startTime = startInput ? startInput.value : '09:00';
            const endTime = endInput ? endInput.value : '10:00';
            const color = catInput ? catInput.value : '#6366f1';

            if (title) {
                let blocks = window.getPlannerBlocks();
                blocks.push({
                    id: 'tb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    title,
                    startTime,
                    endTime,
                    color,
                    completed: false
                });
                Storage.set('planner_blocks', blocks);
                window.closeTimeBlockModal();
                if (window.renderTimelineGrid) window.renderTimelineGrid();
                if (window.renderTodaySchedule) window.renderTodaySchedule();
                if (window.renderDashboardHabits) window.renderDashboardHabits();
                if (window.showNotification) {
                    window.showNotification('Time block added to your schedule!', 'success');
                }
            }
        };

        window.deleteTimeBlock = (id) => {
            let blocks = window.getPlannerBlocks();
            blocks = blocks.filter(b => b.id !== id);
            Storage.set('planner_blocks', blocks);
            if (window.renderTimelineGrid) window.renderTimelineGrid();
            if (window.renderTodaySchedule) window.renderTodaySchedule();
            if (window.renderDashboardHabits) window.renderDashboardHabits();
            if (window.showNotification) {
                window.showNotification('Time block removed.', 'info');
            }
        };

        window.togglePlannerBlockCompletion = (id, event) => {
            let blocks = window.getPlannerBlocks();
            const block = blocks.find(b => b.id === id);
            if (block) {
                block.completed = !block.completed;
                Storage.set('planner_blocks', blocks);
                if (block.completed && window.launchConfetti) {
                    const el = event && event.target ? event.target : null;
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        window.launchConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
                    } else {
                        window.launchConfetti(window.innerWidth / 2, window.innerHeight / 2);
                    }
                }
                if (window.renderTodaySchedule) window.renderTodaySchedule();
                if (window.renderDashboardHabits) window.renderDashboardHabits();
                if (window.renderTimelineGrid) window.renderTimelineGrid();
                if (window.showNotification && block.completed) {
                    window.showNotification('Time block completed! 🎉', 'success');
                }
            }
        };

        window.renderTodaySchedule = () => {
            const container = document.getElementById('schedule-container');
            if (!container || !Storage) return;

            const blocks = window.getPlannerBlocks();
            container.innerHTML = '';

            if (!blocks || blocks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-box">
                        <p class="empty-state-text">No time blocks scheduled for today.</p>
                        <button type="button" class="btn-subtle-create" onclick="app.router.navigate('/timeline')">+ Add Time Block</button>
                    </div>
                `;
                return;
            }

            // Sort chronologically by start time
            const sorted = [...blocks].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

            const listWrapper = document.createElement('div');
            listWrapper.className = 'schedule-list';
            listWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px; max-height: 480px; overflow-y: auto; padding-right: 4px;';

            sorted.forEach(block => {
                const isCompleted = !!block.completed;

                let durationText = '';
                if (block.startTime && block.endTime) {
                    const [sH, sM] = block.startTime.split(':').map(Number);
                    const [eH, eM] = block.endTime.split(':').map(Number);
                    const mins = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
                    if (mins >= 60) {
                        const hrs = Math.floor(mins / 60);
                        const remMins = mins % 60;
                        durationText = remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs} hr`;
                    } else if (mins > 0) {
                        durationText = `${mins} min`;
                    }
                }

                const item = document.createElement('div');
                item.className = `schedule-item ${isCompleted ? 'completed' : ''}`;
                item.style.cssText = `
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    box-shadow: 0 2px 8px rgba(6, 78, 59, 0.04);
                    border-left: 3.5px solid ${block.color || '#6366f1'};
                    border-radius: 10px;
                    padding: 12px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.25s ease;
                    opacity: ${isCompleted ? '0.5' : '1'};
                `;

                item.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <input type="checkbox" class="custom-check" ${isCompleted ? 'checked' : ''} onchange="window.togglePlannerBlockCompletion('${block.id}', event)" title="Mark completed" style="cursor: pointer;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 14px; font-weight: 600; color: ${isCompleted ? '#64748b' : '#142a1d'}; text-decoration: ${isCompleted ? 'line-through' : 'none'}; transition: all 0.2s;">${block.title}</span>
                            <span style="font-size: 12px; color: #059669; font-weight: 500; margin-top: 3px; display: flex; align-items: center; gap: 5px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                ${window.to12h(block.startTime)} – ${window.to12h(block.endTime)}
                            </span>
                        </div>
                    </div>
                    ${durationText ? `<span style="font-size: 11px; font-weight: 600; color: ${block.color || '#818cf8'}; background: ${block.color || '#818cf8'}1a; border: 1px solid ${block.color || '#818cf8'}33; padding: 4px 10px; border-radius: 6px; white-space: nowrap;">${durationText}</span>` : ''}
                `;

                listWrapper.appendChild(item);
            });

            container.appendChild(listWrapper);
        };

        window.renderTimelineGrid = () => {
            const container = document.getElementById('timeline-grid-container');
            if (!container) return;

            const blocks = window.getPlannerBlocks();

            const hours = [
                '05:00', '06:00', '07:00', '08:00', '09:00', '10:00',
                '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
                '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
            ];

            let gridHtml = `<div style="display: flex; flex-direction: column; gap: 0; position: relative;">`;

            hours.forEach(hour => {
                gridHtml += `
                    <div style="display: flex; align-items: flex-start; height: 56px; border-bottom: 1px solid rgba(16, 185, 129, 0.12); position: relative;">
                        <span style="font-size: 12px; font-weight: 600; color: #4b6d5b; width: 60px; flex-shrink: 0; margin-top: -6px;">${hour}</span>
                        <div style="flex: 1; height: 100%; border-left: 1px solid rgba(16, 185, 129, 0.16); position: relative;"></div>
                    </div>
                `;
            });

            gridHtml += `</div>`;
            container.innerHTML = gridHtml;

            // Overlay blocks on top of timeline container
            const gridWrapper = container.firstElementChild;
            if (!gridWrapper) return;

            blocks.forEach(block => {
                // Calculate position relative to 05:00 start (300 mins)
                const [sH, sM] = block.startTime.split(':').map(Number);
                const [eH, eM] = block.endTime.split(':').map(Number);
                
                const startMins = sH * 60 + (sM || 0);
                const endMins = eH * 60 + (eM || 0);
                const baseMins = 5 * 60; // 05:00 AM

                const topOffset = Math.max(0, ((startMins - baseMins) / 60) * 56);
                const durationMins = Math.max(20, endMins - startMins);
                const height = Math.max(36, (durationMins / 60) * 56);

                const isCompleted = !!block.completed;
                const blockEl = document.createElement('div');
                blockEl.style.cssText = `
                    position: absolute;
                    top: ${topOffset}px;
                    left: 70px;
                    right: 8px;
                    height: ${height - 4}px;
                    background: ${block.color || '#6366f1'}1f;
                    border-left: 4px solid ${block.color || '#6366f1'};
                    border-radius: 8px;
                    padding: 6px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #ffffff;
                    font-size: 13px;
                    font-weight: 600;
                    box-sizing: border-box;
                    z-index: 10;
                    -webkit-backdrop-filter: blur(4px);
                    backdrop-filter: blur(4px);
                    transition: transform 0.2s, box-shadow 0.2s;
                    cursor: pointer;
                    opacity: ${isCompleted ? '0.6' : '1'};
                `;

                blockEl.innerHTML = `
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${window.to12h(block.startTime)} - ${window.to12h(block.endTime)}</span>
                        <span style="font-size: 13.5px; font-weight: 700; color: #ffffff; text-decoration: ${isCompleted ? 'line-through' : 'none'};">${block.title} ${isCompleted ? '✓' : ''}</span>
                    </div>
                    <button onclick="event.stopPropagation(); window.deleteTimeBlock('${block.id}')" title="Delete Block" style="background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 13px; opacity: 0.7; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'; this.style.color='#ef4444';" onmouseout="this.style.opacity='0.7'; this.style.color='#64748b';">✕</button>
                `;

                gridWrapper.appendChild(blockEl);
            });
        };

        // ─────────────────────────────────────────────────────────────────────
        // PRODUCTIVITY CALENDAR PAGE LOGIC
        // ─────────────────────────────────────────────────────────────────────

        window.calendarCurrentDate = new Date();
        window.calendarSelectedDate = new Date().toISOString().split('T')[0];

        window.prevCalendarMonth = () => {
            window.calendarCurrentDate.setMonth(window.calendarCurrentDate.getMonth() - 1);
            window.renderCalendar();
        };

        window.nextCalendarMonth = () => {
            window.calendarCurrentDate.setMonth(window.calendarCurrentDate.getMonth() + 1);
            window.renderCalendar();
        };

        window.selectCalendarDate = (dateStr) => {
            window.calendarSelectedDate = dateStr;
            window.renderCalendar();
        };

        window.renderCalendar = () => {
            const container = document.getElementById('calendar-days-grid');
            const monthYearEl = document.getElementById('calendar-month-year');
            if (!container || !Storage) return;

            const curr = window.calendarCurrentDate;
            const year = curr.getFullYear();
            const month = curr.getMonth();

            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            if (monthYearEl) {
                monthYearEl.textContent = `${monthNames[month]} ${year}`;
            }

            const firstDayIndex = new Date(year, month, 1).getDay(); // 0-6 Sun-Sat
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let html = '';

            // Leading empty padding cells for previous month
            for (let i = 0; i < firstDayIndex; i++) {
                html += `<div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); border-radius: 12px; min-height: 94px; opacity: 0.3;"></div>`;
            }

            const habits = Storage.getHabits();
            const totalActiveHabits = habits.filter(h => !h.paused).length || habits.length || 1;

            // Render day cells
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isSelected = dateStr === window.calendarSelectedDate;

                // Compute completions for dateStr
                const completedCount = habits.filter(h => Storage.isCompleted(h.id, dateStr)).length;
                const pct = Math.round((completedCount / totalActiveHabits) * 100);

                const borderStyle = isSelected
                    ? 'border: 2px solid #059669; background: rgba(16, 185, 129, 0.14); box-shadow: 0 0 16px rgba(16, 185, 129, 0.25);'
                    : 'border: 1px solid rgba(16, 185, 129, 0.2); background: rgba(255, 255, 255, 0.92); box-shadow: 0 2px 8px rgba(6, 78, 59, 0.04);';

                html += `
                    <div onclick="window.selectCalendarDate('${dateStr}')" style="${borderStyle} border-radius: 12px; padding: 12px; min-height: 94px; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: all 0.2s;" onmouseover="if('${dateStr}' !== '${window.calendarSelectedDate}') this.style.background='rgba(255,255,255,0.04)';" onmouseout="if('${dateStr}' !== '${window.calendarSelectedDate}') this.style.background='rgba(255, 255, 255, 0.92)';">
                        <div style="font-size: 14px; font-weight: 700; color: #142a1d;">${d}</div>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            ${completedCount > 0 ? `
                                <div style="font-size: 13px; font-weight: 800; color: #059669;">${pct}%</div>
                                <div style="font-size: 11px; font-weight: 600; color: #4b6d5b;">✓ ${completedCount}</div>
                            ` : `
                                <div style="font-size: 11px; color: rgba(255,255,255,0.15);">-</div>
                            `}
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;
            window.renderDailySummary(window.calendarSelectedDate);
        };

        window.renderDailySummary = (dateStr) => {
            const summaryContainer = document.getElementById('calendar-daily-summary-content');
            const dateLabel = document.getElementById('summary-date-label');
            if (!summaryContainer || !Storage) return;

            // Format date label e.g. "Wednesday, 5 Aug 2026"
            const dateObj = new Date(dateStr + 'T00:00:00');
            const dateFormatted = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(dateObj);
            if (dateLabel) dateLabel.textContent = dateFormatted;

            const habits = Storage.getHabits();
            const totalActiveHabits = habits.filter(h => !h.paused).length || habits.length || 1;
            const completedCount = habits.filter(h => Storage.isCompleted(h.id, dateStr)).length;
            const score = totalActiveHabits > 0 ? Math.round((completedCount / totalActiveHabits) * 100) : 0;

            let html = `
                <!-- Productivity Score Box matching reference screenshot -->
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 16px;">
                    <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.35); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #047857;">
                        🎖️
                    </div>
                    <div>
                        <div style="font-size: 10.5px; font-weight: 700; color: #059669; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 2px;">PRODUCTIVITY SCORE</div>
                        <div style="font-size: 22px; font-weight: 800; color: #142a1d;">${score} <span style="font-size: 14px; font-weight: 600; color: #4b6d5b;">/ 100</span></div>
                    </div>
                </div>

                <!-- Habit Checklist -->
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                        HABIT CHECKLIST
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 4px; scrollbar-width: thin;">
            `;

            if (habits.length === 0) {
                html += `<div style="font-size: 13px; color: #64748b; text-align: center; padding: 12px 0;">No habits configured yet.</div>`;
            } else {
                habits.forEach(h => {
                    const isComp = Storage.isCompleted(h.id, dateStr);
                    html += `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.95); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.18); box-shadow: 0 2px 6px rgba(6, 78, 59, 0.03);">
                            <span style="font-size: 13.5px; font-weight: 600; color: ${isComp ? '#64748b' : '#142a1d'}; text-decoration: ${isComp ? 'line-through' : 'none'};">${h.name}</span>
                            <span style="font-size: 11px; font-weight: 700; color: ${isComp ? '#059669' : '#64748b'}; letter-spacing: 0.04em;">${isComp ? '✓ COMPLETED' : '⏳ MISSED'}</span>
                        </div>
                    `;
                });
            }

            html += `
                    </div>
                </div>

                <!-- Planner Tasks -->
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #4b6d5b; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg>
                        PLANNER TASKS
                    </div>
            `;

            const tasks = Storage.get('planner_tasks', []);
            if (tasks.length === 0) {
                html += `<div style="font-size: 13px; color: #4b6d5b;">No tasks planned on this date.</div>`;
            } else {
                html += `<div style="display: flex; flex-direction: column; gap: 8px;">`;
                tasks.forEach(t => {
                    html += `
                        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.95); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.18); box-shadow: 0 2px 6px rgba(6, 78, 59, 0.03);">
                            <span style="font-size: 13.5px; font-weight: 600; color: ${t.completed ? '#64748b' : '#142a1d'}; text-decoration: ${t.completed ? 'line-through' : 'none'};">${t.text}</span>
                            <span style="font-size: 11px; font-weight: 700; color: ${t.completed ? '#10b981' : '#059669'};">${t.completed ? 'DONE' : t.priority || 'TASK'}</span>
                        </div>
                    `;
                });
                html += `</div>`;
            }

            html += `
                </div>

                <!-- Journal Reflections -->
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #4b6d5b; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        JOURNAL REFLECTIONS
                    </div>
            `;

            const reflections = Storage.get(`daily_reflections_${dateStr}`, { morning: '', evening: '' });
            if (!reflections.morning && !reflections.evening) {
                html += `<div style="font-size: 13px; color: #4b6d5b;">No journal logs recorded on this date.</div>`;
            } else {
                html += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
                if (reflections.morning) {
                    html += `
                        <div style="background: rgba(255, 255, 255, 0.95); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.18); border-left: 3.5px solid #f59e0b;">
                            <div style="font-size: 11px; font-weight: 700; color: #f59e0b; margin-bottom: 2px;">☀️ MORNING FOCUS</div>
                            <div style="font-size: 13px; color: #142a1d; line-height: 1.4;">${reflections.morning}</div>
                        </div>
                    `;
                }
                if (reflections.evening) {
                    html += `
                        <div style="background: rgba(255, 255, 255, 0.95); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.18); border-left: 3.5px solid #059669;">
                            <div style="font-size: 11px; font-weight: 700; color: #059669; margin-bottom: 2px;">🌙 EVENING REVIEW</div>
                            <div style="font-size: 13px; color: #142a1d; line-height: 1.4;">${reflections.evening}</div>
                        </div>
                    `;
                }
                html += `</div>`;
            }

            html += `</div>`;

            summaryContainer.innerHTML = html;
        };

        window.renderDashboardHabits = () => {
            const container = document.getElementById('routine-checklist-container');
            if (!container || !Storage) return;
            
            const habits = Storage.getHabits().filter(h => !h.paused);
            container.innerHTML = '';
            
            if (habits.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 32px 0;">
                        <p style="color: #64748b; font-size: 13.5px; margin-bottom: 0;">No active routines for today.</p>
                    </div>
                `;
            } else {
                habits.forEach((habit) => {
                    const today = new Date().toISOString().split('T')[0];
                    const isCompleted = Storage.isCompleted(habit.id, today);
                    
                    const html = `
                        <div class="routine-item ${isCompleted ? 'completed' : ''}" data-habit-id="${habit.id}">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <input type="checkbox" class="custom-check habit-checkbox" data-habit-id="${habit.id}" onchange="window.toggleHabitCompletion('${habit.id}', event)" ${isCompleted ? 'checked' : ''}>
                                <div style="display: flex; flex-direction: column;">
                                    <span class="routine-name" style="font-size: 14px; font-weight: 600; color: ${isCompleted ? '#64748b' : '#142a1d'}; transition: all 0.2s ease;">${habit.name}</span>
                                    <span style="font-size: 12px; color: #64748b; margin-top: 3px;">${habit.category}</span>
                                </div>
                            </div>
                            <span class="routine-target-badge">Target: ${habit.dailyTarget || 1}x</span>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', html);
                });
            }

            // Update top 4 metric cards
            const today = new Date().toISOString().split('T')[0];
            const completedCount = habits.filter(h => Storage.isCompleted(h.id, today)).length;
            const totalCount = habits.length;
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            const donutPct = document.getElementById('metric-progress-pct');
            if (donutPct) donutPct.textContent = `${pct}%`;

            const donutCircle = document.getElementById('metric-progress-donut');
            if (donutCircle) {
                const circumference = 113.1;
                const offset = circumference - (pct / 100) * circumference;
                donutCircle.style.strokeDashoffset = offset;
            }

            const habitsVal = document.getElementById('metric-habits-val');
            if (habitsVal) habitsVal.textContent = `${completedCount}/${totalCount} Habits`;

            const tasksVal = document.getElementById('metric-tasks-val');
            if (tasksVal) {
                const plannerBlocks = window.getPlannerBlocks ? window.getPlannerBlocks() : Storage.get('planner_blocks', []);
                const compTasks = plannerBlocks.filter(t => t.completed).length;
                tasksVal.textContent = `${compTasks}/${plannerBlocks.length} Planner Tasks`;
            }

            // ── Daily Streak: real consecutive-day count ──────────────────────
            // A "daily streak" adds 1 fire each day ALL habits were completed.
            // Missing a day resets it back to 0.

            window.getDailyStreak = () => Storage.get('daily_full_streak', { count: 0, lastDate: '' });

            const streakCount = document.getElementById('metric-streak-count');
            const streakLevel = document.getElementById('metric-streak-level');

            const streakData = window.getDailyStreak();

            // Check whether yesterday was a break (if so, reset streak)
            const yesterday = (() => {
                const d = new Date(today);
                d.setDate(d.getDate() - 1);
                return d.toISOString().split('T')[0];
            })();

            const allDoneToday = totalCount > 0 && completedCount === totalCount;

            if (allDoneToday) {
                // Only record once per day
                if (streakData.lastDate !== today) {
                    // Did they complete yesterday? If not, reset streak
                    const newCount = (streakData.lastDate === yesterday)
                        ? streakData.count + 1
                        : 1;
                    const updated = { count: newCount, lastDate: today };
                    Storage.set('daily_full_streak', updated);
                    streakData.count = newCount;
                    streakData.lastDate = today;
                }
            } else {
                // Not all done yet today – if last recorded day was before yesterday, streak is broken
                if (streakData.lastDate && streakData.lastDate < yesterday) {
                    Storage.set('daily_full_streak', { count: 0, lastDate: streakData.lastDate });
                    streakData.count = 0;
                }
            }

            if (streakCount) {
                streakCount.textContent = streakData.count;
            }

            const levelMap = [
                [0,  'Just Started 🌱'],
                [3,  'Building Up 💪'],
                [7,  'On Fire 🔥'],
                [14, 'Unstoppable ⚡'],
                [30, 'Legendary 🏆'],
                [60, 'Elite 💎']
            ];
            let levelLabel = 'Just Started 🌱';
            for (const [threshold, label] of levelMap) {
                if (streakData.count >= threshold) levelLabel = label;
            }
            if (streakLevel) streakLevel.textContent = levelLabel;

            const prodScore = document.getElementById('metric-productivity-score');
            if (prodScore) {
                prodScore.textContent = pct;
            }

            const legacyMetric = document.querySelector('[data-metric="completion"]');
            if (legacyMetric) legacyMetric.textContent = `${pct}%`;
        };

        window.initTodayDashboard = () => {
            // Formatted date (matching Thursday, 24 September 2026)
            const dateEl = document.getElementById('dashboard-date');
            if (dateEl) {
                const now = new Date();
                const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
                dateEl.textContent = new Intl.DateTimeFormat('en-US', options).format(now);
            }

            // User info
            const userEmail = localStorage.getItem('user_email') || '';
            const userJson = localStorage.getItem('user') || localStorage.getItem('streako_user') || '{}';
            let userName = '';
            try {
                const userObj = JSON.parse(userJson);
                userName = userObj.fullName || userObj.full_name || userObj.name || '';
            } catch (e) { }

            if (!userName && userEmail) {
                const prefix = userEmail.split('@')[0];
                userName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            }
            if (!userName) userName = 'Jack';

            const greetingEl = document.getElementById('dashboard-greeting');
            if (greetingEl) {
                const hour = new Date().getHours();
                const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
                greetingEl.textContent = `${timeGreeting}, ${userName} 👋`;
            }

            const sidebarName = document.getElementById('sidebar-name');
            const sidebarEmail = document.getElementById('sidebar-email');
            if (sidebarName) sidebarName.textContent = userName;
            if (sidebarEmail) sidebarEmail.textContent = userEmail || 'jack@dailyos.io';

            window.renderPriorities();
            window.renderDashboardHabits();
            if (window.renderTodaySchedule) window.renderTodaySchedule();
            if (window.updateReflectionUI) window.updateReflectionUI();
        };

        window.toggleHabitCompletion = (id, event) => {
            if (!Storage) return;
            const today = new Date().toISOString().split('T')[0];
            const willBeCompleted = !Storage.isCompleted(id, today);
            if (willBeCompleted) {
                Storage.markCompleted(id, today);
                if (window.showNotification) {
                    window.showNotification('✅ Great job! Keep going!', 'success');
                }
                if (window.launchConfetti) {
                    let originX = window.innerWidth / 2;
                    let originY = window.innerHeight / 2;
                    if (event && (event.target || event.currentTarget)) {
                        const el = event.target || event.currentTarget;
                        const rect = el.getBoundingClientRect();
                        originX = rect.left + rect.width / 2;
                        originY = rect.top + rect.height / 2;
                    }
                    window.launchConfetti(originX, originY);
                }
            } else {
                Storage.unmarkCompleted(id, today);
            }

            // Check if ALL habits are now complete – if so, celebrate!
            const allHabits = Storage.getHabits().filter(h => !h.paused);
            const allDoneNow = allHabits.length > 0 &&
                allHabits.every(h => Storage.isCompleted(h.id, today));

            window.renderDashboardHabits();

            if (allDoneNow && willBeCompleted) {
                // Only fire confetti once per day (check if streak was already recorded today)
                const streakData = window.getDailyStreak ? window.getDailyStreak() : Storage.get('daily_full_streak', { count: 0, lastDate: '' });
                const alreadyCelebrated = streakData.lastDate === today && streakData.count > 0;

                if (!alreadyCelebrated && window.launchConfetti) {
                    // Big burst from centre of screen
                    window.launchConfetti(window.innerWidth / 2, window.innerHeight * 0.35);
                    setTimeout(() => window.launchConfetti(window.innerWidth * 0.25, window.innerHeight * 0.4), 120);
                    setTimeout(() => window.launchConfetti(window.innerWidth * 0.75, window.innerHeight * 0.4), 240);
                }

                if (window.showNotification) {
                    window.showNotification('🎉 All habits complete! Amazing streak!', 'success');
                }
            }
        };

        // Page Load Event Listener
        window.addEventListener('page-loaded', (e) => {
            const path = e.detail.path;

            if (path === '/' || path === '/landing') {
                if (typeof window.initLandingCarousel === 'function') {
                    window.initLandingCarousel();
                }
            }
            
            if (path === '/login') {
                const forgotLink = document.getElementById('forgot-password-link');
                if (forgotLink) {
                    forgotLink.onclick = (e) => {
                        e.preventDefault();
                        window.handleForgotPasswordClick();
                    };
                }

                const loginForm = document.getElementById('login-form');
                if (loginForm) {
                    loginForm.onsubmit = async (e) => {
                        e.preventDefault();
                        const email = document.getElementById('login-email').value.trim();
                        const password = document.getElementById('login-password').value;
                        const errorDiv = document.getElementById('login-error');
                        const loginBtn = document.getElementById('login-btn');
                        
                        errorDiv.style.display = 'none';
                        errorDiv.textContent = '';

                        if (!email || !password) {
                            errorDiv.textContent = 'Please enter both email and password';
                            errorDiv.style.display = 'block';
                            return;
                        }

                        loginBtn.disabled = true;
                        loginBtn.textContent = 'Logging in...';

                        try {
                            const response = await authApiRequest('/api/auth/login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email, password }),
                            });

                            const responseText = await response.text();
                            let data = {};
                            try {
                                data = JSON.parse(responseText);
                            } catch (jsonErr) {
                                // Backend returned HTML (proxy/deployment error)
                                if (response.status === 502 || response.status === 503 || response.status === 504) {
                                    throw new Error('❌ Cannot reach server. Please try again in a moment.');
                                }
                                if (response.status >= 500) {
                                    throw new Error('❌ Server error (' + response.status + '). Please try again in a moment.');
                                }
                                throw new Error('❌ Unexpected server response. Please try again.');
                            }

                            if (!response.ok) {
                                let errMsg = data.error || 'Login failed. Please check your credentials.';
                                if (errMsg.includes('Invalid login credentials') || errMsg.includes('invalid_credentials')) {
                                    errMsg = '❌ Incorrect email or password. Please try again.';
                                } else if (errMsg.includes('Email not confirmed')) {
                                    errMsg = '❌ Email not confirmed. Please check your inbox.';
                                } else if (errMsg.includes('Backend service unavailable') || errMsg.includes('unavailable')) {
                                    errMsg = '❌ Server is temporarily unavailable. Please try again in a moment.';
                                }
                                throw new Error(errMsg);
                            }
                            
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
                            }
                            
                            errorDiv.style.display = 'none';
                            loginBtn.textContent = '✓ Login successful';
                            setTimeout(() => {
                                if (window.app && window.app.router) window.app.router.navigate('/dashboard');
                                else window.location.href = '/dashboard';
                            }, 400);
                        } catch (error) {
                            console.error('Login error:', error);
                            errorDiv.textContent = error.message || 'Login failed. Please try again.';
                            errorDiv.style.display = 'block';
                            loginBtn.disabled = false;
                            loginBtn.textContent = 'Log In';
                        }
                    };
                }
            }

            if (path === '/forgot-password' || path === '/reset-password') {
                const step1Form = document.getElementById('forgot-step1-form');
                const step2Form = document.getElementById('forgot-step2-form');
                const emailInput = document.getElementById('forgot-email');
                const sendBtn = document.getElementById('forgot-send-btn');
                const errorDiv = document.getElementById('forgot-error');
                const successDiv = document.getElementById('forgot-success');
                const otpCard = document.getElementById('otp-info-card');
                const displayOtp = document.getElementById('display-otp-code');
                const codeInput = document.getElementById('forgot-code');
                const newPassInput = document.getElementById('forgot-new-password');
                const confirmPassInput = document.getElementById('forgot-confirm-password');
                const submitBtn = document.getElementById('forgot-submit-btn');
                const resendBtn = document.getElementById('forgot-resend-btn');

                const showError = (msg) => {
                    if (successDiv) successDiv.style.display = 'none';
                    if (errorDiv) {
                        errorDiv.textContent = msg;
                        errorDiv.style.display = 'block';
                    }
                };

                const showSuccess = (msg) => {
                    if (errorDiv) errorDiv.style.display = 'none';
                    if (successDiv) {
                        successDiv.textContent = msg;
                        successDiv.style.display = 'block';
                    }
                };

                const hideMessages = () => {
                    if (errorDiv) errorDiv.style.display = 'none';
                    if (successDiv) successDiv.style.display = 'none';
                };

                // Preset email if user previously typed it on login page
                const presetEmail = sessionStorage.getItem('streako_forgot_email');
                if (presetEmail && emailInput) {
                    emailInput.value = presetEmail;
                }

                // Check for Supabase recovery link in URL hash
                const hash = window.location.hash;
                if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
                    if (step1Form && step2Form) {
                        step1Form.style.display = 'none';
                        step2Form.style.display = 'block';
                        if (otpCard) otpCard.style.display = 'none';
                        if (codeInput) {
                            codeInput.value = 'VERIFIED_LINK';
                            codeInput.parentElement.style.display = 'none';
                        }
                        showSuccess('✅ Email recovery link verified! Please enter your new password below.');
                    }
                }

                // Step 1: Send Reset Code
                if (step1Form) {
                    step1Form.onsubmit = async (evt) => {
                        evt.preventDefault();
                        const email = emailInput ? emailInput.value.trim() : '';

                        if (!email) {
                            showError('Please enter your email address');
                            return;
                        }

                        hideMessages();
                        if (sendBtn) {
                            sendBtn.disabled = true;
                            sendBtn.textContent = 'Verifying account...';
                        }

                        try {
                            const response = await authApiRequest('/api/auth/forgot-password', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email })
                            });

                            const data = await response.json().catch(() => ({}));

                            if (!response.ok) {
                                throw new Error(data.error || 'Failed to process password reset request');
                            }

                            // Show Step 2
                            step1Form.style.display = 'none';
                            step2Form.style.display = 'block';

                            // Keep verification code field blank for user to enter from email
                            if (codeInput) {
                                codeInput.value = '';
                                codeInput.focus();
                            }

                            showSuccess(`✉️ Verification code sent to ${data.email || email}! Check your inbox (or spam) and enter the code below.`);
                            if (codeInput) codeInput.focus();
                        } catch (err) {
                            showError(err.message || 'Error requesting password reset');
                        } finally {
                            if (sendBtn) {
                                sendBtn.disabled = false;
                                sendBtn.textContent = 'Send Reset Code';
                            }
                        }
                    };
                }

                // Step 2: Reset Password
                if (step2Form) {
                    step2Form.onsubmit = async (evt) => {
                        evt.preventDefault();
                        const email = emailInput ? emailInput.value.trim() : '';
                        const code = codeInput ? codeInput.value.trim() : '';
                        const newPassword = newPassInput ? newPassInput.value : '';
                        const confirmPassword = confirmPassInput ? confirmPassInput.value : '';

                        hideMessages();

                        if (!code) {
                            showError('Please enter the verification code');
                            return;
                        }

                        if (newPassword.length < 6) {
                            showError('Password must be at least 6 characters long');
                            return;
                        }

                        if (newPassword !== confirmPassword) {
                            showError('Passwords do not match. Please verify and try again.');
                            return;
                        }

                        if (submitBtn) {
                            submitBtn.disabled = true;
                            submitBtn.textContent = 'Updating password...';
                        }

                        try {
                            const response = await authApiRequest('/api/auth/reset-password', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email, code, newPassword })
                            });

                            const data = await response.json().catch(() => ({}));

                            if (!response.ok) {
                                throw new Error(data.error || 'Failed to reset password');
                            }

                            sessionStorage.removeItem('streako_forgot_email');
                            step2Form.style.display = 'none';
                            showSuccess('🎉 Password reset successfully! Redirecting to login...');

                            if (window.showNotification) {
                                window.showNotification('Password updated successfully!', 'success');
                            }

                            setTimeout(() => {
                                if (window.app && window.app.router) {
                                    window.app.router.navigate('/login');
                                } else {
                                    window.location.href = '/login';
                                }
                            }, 1200);
                        } catch (err) {
                            showError(err.message || 'Failed to reset password');
                            if (submitBtn) {
                                submitBtn.disabled = false;
                                submitBtn.textContent = 'Update Password';
                            }
                        }
                    };
                }

                // Resend or switch back to Step 1
                if (resendBtn) {
                    resendBtn.onclick = () => {
                        hideMessages();
                        step2Form.style.display = 'none';
                        step1Form.style.display = 'block';
                        if (emailInput) emailInput.focus();
                    };
                }
            }

            if (path === '/signup') {
                const signupForm = document.getElementById('signup-form');
                if (signupForm) {
                    signupForm.onsubmit = async (e) => {
                        e.preventDefault();
                        const fullName = document.getElementById('signup-fullname').value.trim();
                        const email = document.getElementById('signup-email').value.trim();
                        const password = document.getElementById('signup-password').value;
                        const confirmPassword = document.getElementById('signup-confirm-password').value;
                        const errorDiv = document.getElementById('signup-error');
                        const successDiv = document.getElementById('signup-success');
                        const signupBtn = document.getElementById('signup-btn');
                        
                        errorDiv.style.display = 'none';
                        successDiv.style.display = 'none';
                        errorDiv.textContent = '';
                        successDiv.textContent = '';
                        
                        if (!fullName || !email || !password || !confirmPassword) {
                            errorDiv.textContent = 'All fields are required';
                            errorDiv.style.display = 'block';
                            return;
                        }
                        if (password.length < 6) {
                            errorDiv.textContent = 'Password must be at least 6 characters';
                            errorDiv.style.display = 'block';
                            return;
                        }
                        if (password !== confirmPassword) {
                            errorDiv.textContent = 'Passwords do not match';
                            errorDiv.style.display = 'block';
                            return;
                        }
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(email)) {
                            errorDiv.textContent = 'Invalid email format';
                            errorDiv.style.display = 'block';
                            return;
                        }
                        
                        signupBtn.disabled = true;
                        signupBtn.textContent = 'Creating account...';
                        
                        try {
                            const response = await authApiRequest('/api/auth/signup', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email, password, fullName }),
                            });
                            const responseText = await response.text();
                            let data = {};
                            try {
                                data = JSON.parse(responseText);
                            } catch (jsonErr) {
                                data = { error: 'Server error. Please try again.' };
                            }
                            if (!response.ok) throw new Error(data.error || 'Signup failed');
                            
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
                            }

                            successDiv.textContent = '✓ Account created! Redirecting...';
                            successDiv.style.display = 'block';
                            signupBtn.textContent = '✓ Account Created';
                            document.getElementById('signup-form').reset();
                            
                            setTimeout(() => {
                                if (window.app && window.app.router) window.app.router.navigate('/dashboard');
                                else window.location.href = '/dashboard';
                            }, 500);
                        } catch (error) {
                            console.error('Signup error:', error);
                            errorDiv.textContent = error.message || 'Signup failed. Please try again.';
                            errorDiv.style.display = 'block';
                            signupBtn.disabled = false;
                            signupBtn.textContent = 'Create Account';
                        }
                    };
                }
            }


            if (path === '/dashboard' || path === '/') {
                if (window.initTodayDashboard) {
                    window.initTodayDashboard();
                } else {
                    window.renderPriorities();
                    window.renderDashboardHabits();
                    if (window.renderTodaySchedule) window.renderTodaySchedule();
                }

            }
            if (path === '/habits-library') {
                window.renderHabits();
            }
            if (path === '/timeline') {
                if (window.renderPlannerTasks) window.renderPlannerTasks();
                if (window.renderTimelineGrid) window.renderTimelineGrid();
            }
            if (path === '/calendar') {
                if (window.renderCalendar) window.renderCalendar();
            }
            if (path === '/analytics') {
                // Re-render analytics on navigation (slight delay lets the page HTML render first)
                setTimeout(() => {
                    if (window.renderAnalytics) window.renderAnalytics();
                }, 80);
            }

            // Setup mobile sidebar toggle & overlay for all pages
            const hamburger = document.getElementById('hamburger-toggle');
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (hamburger && sidebar && overlay) {
                hamburger.onclick = () => {
                    sidebar.classList.toggle('open');
                    overlay.classList.toggle('show');
                };
                overlay.onclick = () => {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('show');
                };
                document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
                    item.addEventListener('click', () => {
                        sidebar.classList.remove('open');
                        overlay.classList.remove('show');
                    });
                });
            }

            // Dynamically update active nav item in sidebar matching current route
            const currentPath = path === '/' ? '/dashboard' : path;
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
                const onclickAttr = item.getAttribute('onclick') || '';
                if (onclickAttr.includes(`'${currentPath}'`)) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Populate sidebar profile and settings page from localStorage
            const userEmail = localStorage.getItem('user_email') || '';
            const userJson = localStorage.getItem('user') || localStorage.getItem('streako_user') || '{}';
            let userName = '';
            try {
                const userObj = JSON.parse(userJson);
                userName = userObj.fullName || userObj.full_name || userObj.name || '';
            } catch (e) { /* ignore */ }

            if (!userName && userEmail) {
                const prefix = userEmail.split('@')[0];
                userName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            }

            // Sidebar profile elements (present on dashboard, settings, etc.)
            const sidebarName = document.getElementById('sidebar-name');
            const sidebarEmail = document.getElementById('sidebar-email');
            const sidebarAvatar = document.getElementById('sidebar-avatar');
            if (sidebarName && userName) sidebarName.textContent = userName;
            if (sidebarEmail && userEmail) sidebarEmail.textContent = userEmail;
            if (sidebarAvatar && userName) {
                const initials = userName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
                sidebarAvatar.textContent = initials || 'ST';
            }

            // Dashboard greeting
            const greetingEl = document.getElementById('dashboard-greeting');
            if (greetingEl) {
                const hour = new Date().getHours();
                const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
                greetingEl.textContent = userName ? `${timeGreeting}, ${userName} 👋` : `${timeGreeting} 👋`;
            }

            // Settings page fields
            if (path === '/settings') {
                if (window.syncSettingsDisplay) window.syncSettingsDisplay();
            }
        });

        // ─────────────────────────────────────────────────────────────────────
        // SYSTEM SETTINGS & MODALS LOGIC
        // ─────────────────────────────────────────────────────────────────────

        window.syncSettingsDisplay = () => {
            const userEmail = localStorage.getItem('user_email') || '';
            const userJson = localStorage.getItem('user') || localStorage.getItem('streako_user') || '{}';
            let userName = '';
            let userObj = null;
            try {
                userObj = JSON.parse(userJson);
                userName = userObj.fullName || userObj.full_name || userObj.name || '';
            } catch (e) { /* ignore */ }

            if (!userName && userEmail) {
                const prefix = userEmail.split('@')[0];
                userName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            }

            const displayName = userName || 'Agalya G';
            const displayEmail = userEmail || 'agalya@gmail.com';
            const displayAvatar = (userObj && userObj.avatar) ? userObj.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';

            // Card Header UI
            const cardName = document.getElementById('settings-card-name');
            const cardAvatar = document.getElementById('settings-card-avatar');
            if (cardName) cardName.innerHTML = `<span>${displayName}</span>`;
            if (cardAvatar) cardAvatar.src = displayAvatar;

            // Form inputs
            const nameInput = document.getElementById('settings-fullname');
            const emailInput = document.getElementById('settings-email');
            const tzSelect = document.getElementById('settings-timezone');

            if (nameInput) nameInput.value = displayName;
            if (emailInput) emailInput.value = displayEmail;
            if (tzSelect && userObj && userObj.timezone) tzSelect.value = userObj.timezone;
        };

        window.openSettingsModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('active');
        };

        window.closeSettingsModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('active');
        };

        window.recommendToFriends = () => {
            const shareData = {
                title: 'STREAKO - Habit Tracker',
                text: 'Track your daily streaks and level up with STREAKO!',
                url: window.location.origin
            };
            if (navigator.share) {
                navigator.share(shareData).catch(() => {});
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                if (window.showNotification) window.showNotification('🔗 Link copied to clipboard! Share it with your friends.', 'success');
            } else {
                if (window.showNotification) window.showNotification('🎉 Share STREAKO with your friends at ' + window.location.origin, 'info');
            }
        };

        window.submitFeedback = () => {
            const msg = document.getElementById('feedback-message');
            if (msg) msg.value = '';
            window.closeSettingsModal('helpModal');
            if (window.showNotification) window.showNotification('💌 Thank you! Your feedback has been sent.', 'success');
        };

        window.saveNotificationPreferences = () => {
            window.closeSettingsModal('notificationModal');
            if (window.showNotification) window.showNotification('🔔 Alarm & notification preferences updated!', 'success');
        };

        window.saveSettings = async () => {
            const nameInput = document.getElementById('settings-fullname');
            const emailInput = document.getElementById('settings-email');
            const avatarInput = document.getElementById('settings-avatar');
            const tzSelect = document.getElementById('settings-timezone');

            const fullName = nameInput ? nameInput.value.trim() : 'User';
            const email = emailInput ? emailInput.value.trim() : 'user@email.com';
            const timezone = tzSelect ? tzSelect.value : 'Asia/Kolkata';

            let avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';
            try {
                const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
                if (existingUser.avatar) avatar = existingUser.avatar;
            } catch(e) {}

            if (avatarInput && avatarInput.files && avatarInput.files[0]) {
                const file = avatarInput.files[0];
                avatar = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
            }

            const userObj = {
                fullName,
                full_name: fullName,
                name: fullName,
                email,
                avatar,
                timezone
            };

            localStorage.setItem('user', JSON.stringify(userObj));
            localStorage.setItem('streako_user', JSON.stringify(userObj));
            localStorage.setItem('user_email', email);

            // Update backend database and Supabase profile
            const token = localStorage.getItem('access_token') || localStorage.getItem('streako_auth_token');
            if (token) {
                try {
                    await fetch('/api/auth/profile', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ fullName, email })
                    });
                } catch (err) {
                    console.warn('Backend profile sync warning:', err.message);
                }
            }

            // Sync card UI
            if (window.syncSettingsDisplay) window.syncSettingsDisplay();

            // Update sidebar user profile elements instantly across current DOM
            const sidebarName = document.getElementById('sidebar-name');
            const sidebarEmail = document.getElementById('sidebar-email');
            const sidebarAvatar = document.getElementById('sidebar-avatar');

            if (sidebarName) sidebarName.textContent = fullName;
            if (sidebarEmail) sidebarEmail.textContent = email;
            if (sidebarAvatar) {
                const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
                sidebarAvatar.textContent = initials || 'ST';
            }

            // Close open modals
            window.closeSettingsModal('profileModal');
            window.closeSettingsModal('dateTimeModal');

            if (window.showNotification) {
                window.showNotification('✅ Settings saved successfully!', 'success');
            }
        };

        window.logout = () => {
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('streako_auth_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                localStorage.removeItem('streako_user');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_id');
                if (window.showNotification) {
                    window.showNotification('👋 Logged out successfully.', 'info');
                }
                setTimeout(() => {
                    if (window.app && window.app.router) window.app.router.navigate('/login');
                    else window.location.href = '/login';
                }, 300);
            }
        };

        window.resetAllData = () => {
            if (confirm('⚠️ Are you sure you want to reset all data? All habits, tasks, and journals will be permanently erased.')) {
                localStorage.clear();
                if (window.showNotification) {
                    window.showNotification('Data reset completed.', 'info');
                }
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        };

        // Initialize default habits if needed
        window.seedHabits();

        // Smart auth-aware routing on initial load
        const currentPath = window.location.pathname === '/' ? '/landing' : window.location.pathname;
        const token = localStorage.getItem('access_token');
        const protectedRoutes = ['/dashboard', '/habits-library', '/timeline', '/calendar', '/goals', '/analytics', '/journal', '/settings', '/mentor-dashboard'];

        if (!token && protectedRoutes.includes(currentPath)) {
            // Not logged in — redirect protected pages to login
            window.history.replaceState({}, '', '/login');
            this.router.handleRoute('/login');
        } else {
            // Open the requested route (/login, /signup, /landing, /dashboard, etc.)
            this.router.handleRoute(currentPath);
        }
    }
}

export { App };
export default App;

