import { Router } from './utils/router.js';
import { state } from './utils/state.js';
import { Storage } from './utils/storage.js';

class App {
    constructor() {
        this.router = new Router();
        this.storage = Storage;
        this.state = state;
    }

    init() {
        // Expose global app instance for legacy inline handlers (onclick)
        window.app = this;
        window.goToPage = (pageId) => {
            const routeMap = {
                'landing': '/landing',
                'signup': '/signup',
                'login': '/login',
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
                        <div style="display: flex; justify-content: space-between; align-items: center; background: #0c0d11; padding: 13px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s;">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <span style="color: #64748b; font-weight: 700; font-size: 13.5px; min-width: 16px;">${index + 1}</span>
                                <input type="checkbox" onchange="window.togglePriority(${index})" ${p.completed ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #6366f1; cursor: pointer; border-radius: 4px;">
                                <span style="font-size: 14px; font-weight: 500; color: ${p.completed ? '#64748b' : '#ffffff'}; text-decoration: ${p.completed ? 'line-through' : 'none'}; transition: all 0.2s;">${p.text}</span>
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
                        <div style="display: flex; align-items: center; gap: 12px; background: rgba(99, 102, 241, 0.08); padding: 12px 16px; border-radius: 10px; border: 1px solid rgba(99, 102, 241, 0.3);">
                            <span style="color: #818cf8; font-weight: 700; font-size: 13.5px; min-width: 16px;">${nextIndex}</span>
                            <input type="text" id="new-priority-input" placeholder="Type your priority..." style="flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 14px;" autocomplete="off">
                            <div style="display: flex; gap: 8px;">
                                <button onclick="window.cancelPriority()" style="background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #94a3b8; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">Cancel</button>
                                <button onclick="window.savePriority()" style="background: #4f46e5; border: none; color: #ffffff; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">Add</button>
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

        window.togglePriority = (index) => {
            window.prioritiesData[index].completed = !window.prioritiesData[index].completed;
            Storage.set('priorities', window.prioritiesData);
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

            if (morningStatus) {
                if (stored.morning && stored.morning.trim()) {
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
                if (stored.evening && stored.evening.trim()) {
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
            const overlay = document.getElementById('habit-modal-overlay');
            if (overlay) overlay.style.display = 'flex';
            // Lock background scroll while modal is open
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
            if(everyday) everyday.style.borderColor = window.selectedFrequency === 'Daily' ? '#00D9FF' : '#555';
            if(weekdays) weekdays.style.borderColor = window.selectedFrequency === 'Weekdays' ? '#00D9FF' : '#555';
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
                    <div class="session-row" style="display:flex; align-items:flex-start; gap:12px; background:rgba(255,255,255,0.05); padding:10px 12px; border-radius:8px; border:1px solid #374151;">
                        <div style="font-size:13px; font-weight:600; min-width:70px; color:#a0aec0; padding-top:20px;">Session ${i}</div>
                        <div style="flex:1;">
                            <label style="display:block; font-size:11px; margin-bottom:3px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Start Time</label>
                            <input type="time" class="start-time" value="${data.startTime}"
                                style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid #374151; background:#0d1117; color:#fff; font-size:13px; box-sizing:border-box;" />
                            <span class="time-display" style="display:block; margin-top:4px; font-size:12px; font-weight:700; color:#00D9FF; letter-spacing:0.04em;">${window.to12h(data.startTime)}</span>
                        </div>
                        <div style="flex:1;">
                            <label style="display:block; font-size:11px; margin-bottom:3px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">End Time</label>
                            <input type="time" class="end-time" value="${data.endTime}"
                                style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid #374151; background:#0d1117; color:#fff; font-size:13px; box-sizing:border-box;" />
                            <span class="time-display" style="display:block; margin-top:4px; font-size:12px; font-weight:700; color:#00D9FF; letter-spacing:0.04em;">${window.to12h(data.endTime)}</span>
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
                        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #0c0d12; border-radius: 14px; border: 1px dashed rgba(255,255,255,0.1);">
                            <p style="color: #64748b; font-size: 15px; margin-bottom: 12px;">No routines found for category "${filter}".</p>
                            <button onclick="window.openCreateHabitModal()" style="background: #4f46e5; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; cursor: pointer;">+ Create Routine</button>
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
                background: #0d0e14;
                border: 1px solid rgba(255, 255, 255, 0.07);
                border-radius: 14px;
                padding: 20px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
                opacity: ${habit.paused ? '0.6' : '1'};
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
                            <button onclick="window.pauseHabit('${habit.id}')" title="${habit.paused ? 'Resume Habit' : 'Pause Habit'}" style="width: 32px; height: 32px; border-radius: 8px; background: transparent; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'; this.style.color='#ffffff';" onmouseout="this.style.background='transparent'; this.style.color='#64748b';">
                                ${habit.paused ? `
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                ` : `
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                `}
                            </button>
                            <button onclick="window.editHabit('${habit.id}')" title="Edit Habit" style="width: 32px; height: 32px; border-radius: 8px; background: transparent; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'; this.style.color='#ffffff';" onmouseout="this.style.background='transparent'; this.style.color='#64748b';">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button onclick="window.promptDeleteHabit('${habit.id}')" title="Delete Habit" style="width: 32px; height: 32px; border-radius: 8px; background: transparent; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.15)'; this.style.color='#ef4444';" onmouseout="this.style.background='transparent'; this.style.color='#64748b';">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Title & Description -->
                    <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                        <span>${habit.name}</span>
                        ${habit.paused ? '<span style="font-size: 11px; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.12); padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">Paused</span>' : ''}
                    </div>
                    <div style="font-size: 13.5px; color: #94a3b8; line-height: 1.4; margin-bottom: 20px; min-height: 38px;">
                        ${habit.description || 'No description provided'}
                    </div>
                </div>

                <!-- Footer / Metrics Bar matching reference screenshot -->
                <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 14px; font-size: 12px; font-weight: 600; color: #64748b;">
                    <div>
                        <span style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-right: 4px;">STREAK</span>
                        <span style="color: #ffffff; font-weight: 700;">🔥 ${habit.streak || 0}</span>
                    </div>
                    <div>
                        <span style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-right: 4px;">BEST</span>
                        <span style="color: #ffffff; font-weight: 700;">${habit.bestStreak || habit.streak || 0}d</span>
                    </div>
                    <div>
                        <span style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-right: 4px;">SCHEDULE</span>
                        <span style="color: #ffffff; font-weight: 700;">${habit.frequencyLabel || habit.frequency || 'Daily'}</span>
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
            
            // Re-render visual selections
            window.clearSelections();
            document.querySelectorAll('.icon-btn').forEach(btn => {
                if (btn.getAttribute('data-icon') === window.selectedIcon) btn.style.background = 'rgba(0,217,255,0.2)';
            });
            document.querySelectorAll('.color-swatch').forEach(swatch => {
                if (swatch.getAttribute('data-color') === window.selectedColor) swatch.style.outline = '2px solid #00D9FF';
            });
            
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

        window.togglePlannerTask = (taskId) => {
            const tasks = Storage.get('planner_tasks', []);
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                Storage.set('planner_tasks', tasks);
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
                        <div style="width: 56px; height: 56px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #475569;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg>
                        </div>
                        <p style="color: #64748b; font-size: 14px; margin: 0 0 20px 0; font-weight: 500;">Your day is clear. Add your Top 3 priorities.</p>
                        <button onclick="window.startAddingTask()" style="background: rgba(255,255,255,0.06); color: #ffffff; border: 1px solid rgba(255,255,255,0.15); padding: 9px 22px; border-radius: 8px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">+ Create Task</button>
                    </div>
                `;
            } else {
                html += `<div style="display: flex; flex-direction: column; gap: 12px; flex: 1;">`;

                tasks.forEach(t => {
                    const badgeColor = t.priority === 'HIGH' ? '#ef4444' : t.priority === 'MEDIUM' ? '#6366f1' : '#10b981';
                    const badgeBg = t.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : t.priority === 'MEDIUM' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)';

                    html += `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: #07080a; padding: 14px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); transition: all 0.2s;">
                            <div style="display: flex; align-items: center; gap: 14px; flex: 1;">
                                <input type="checkbox" onchange="window.togglePlannerTask('${t.id}')" ${t.completed ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #6366f1; cursor: pointer; border-radius: 4px;">
                                <span style="font-size: 14.5px; font-weight: 600; color: ${t.completed ? '#64748b' : '#ffffff'}; text-decoration: ${t.completed ? 'line-through' : 'none'}; transition: all 0.2s;">${t.text}</span>
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
                            <input type="text" id="planner-task-input" placeholder="Enter task title..." style="width: 100%; background: transparent; border: none; outline: none; color: #fff; font-size: 14.5px; font-weight: 500;" autocomplete="off">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">Priority:</span>
                                    <select id="planner-task-priority" style="background: #0c0d12; color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 6px; font-size: 12px; outline: none;">
                                        <option value="HIGH">HIGH</option>
                                        <option value="MEDIUM" selected>MEDIUM</option>
                                        <option value="LOW">LOW</option>
                                    </select>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button onclick="window.cancelAddingTask()" style="background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #94a3b8; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 500;">Cancel</button>
                                    <button onclick="window.savePlannerTask()" style="background: #4f46e5; border: none; color: #ffffff; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 600;">Add Task</button>
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
                let blocks = Storage.get('planner_blocks', []);
                blocks.push({
                    id: 'tb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    title,
                    startTime,
                    endTime,
                    color
                });
                Storage.set('planner_blocks', blocks);
                window.closeTimeBlockModal();
                window.renderTimelineGrid();
            }
        };

        window.deleteTimeBlock = (id) => {
            let blocks = Storage.get('planner_blocks', []);
            blocks = blocks.filter(b => b.id !== id);
            Storage.set('planner_blocks', blocks);
            window.renderTimelineGrid();
        };

        window.renderTimelineGrid = () => {
            const container = document.getElementById('timeline-grid-container');
            if (!container) return;

            let blocks = Storage.get('planner_blocks', null);

            // Default initial time blocks if none exist
            if (!blocks) {
                blocks = [
                    { id: 'tb_1', title: '🧘 Meditation', startTime: '05:00', endTime: '05:30', color: '#10b981' },
                    { id: 'tb_2', title: '💪 Workout Session', startTime: '06:00', endTime: '07:00', color: '#ef4444' },
                    { id: 'tb_3', title: '💼 Deep Work Session', startTime: '09:00', endTime: '11:30', color: '#6366f1' },
                    { id: 'tb_4', title: '📚 Reading & Study', startTime: '14:00', endTime: '15:00', color: '#3b82f6' },
                    { id: 'tb_5', title: '✍️ Evening Reflection', startTime: '19:00', endTime: '19:30', color: '#ec4899' }
                ];
                Storage.set('planner_blocks', blocks);
            }

            const hours = [
                '05:00', '06:00', '07:00', '08:00', '09:00', '10:00',
                '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
                '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
            ];

            let gridHtml = `<div style="display: flex; flex-direction: column; gap: 0; position: relative;">`;

            hours.forEach(hour => {
                gridHtml += `
                    <div style="display: flex; align-items: flex-start; height: 56px; border-bottom: 1px solid rgba(255,255,255,0.04); position: relative;">
                        <span style="font-size: 12px; font-weight: 600; color: #64748b; width: 60px; flex-shrink: 0; margin-top: -6px;">${hour}</span>
                        <div style="flex: 1; height: 100%; border-left: 1px solid rgba(255,255,255,0.06); position: relative;"></div>
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
                    backdrop-filter: blur(4px);
                    transition: transform 0.2s, box-shadow 0.2s;
                    cursor: pointer;
                `;

                blockEl.innerHTML = `
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${window.to12h(block.startTime)} - ${window.to12h(block.endTime)}</span>
                        <span style="font-size: 13.5px; font-weight: 700; color: #ffffff;">${block.title}</span>
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
                    ? 'border: 2px solid #818cf8; background: rgba(99, 102, 241, 0.08); box-shadow: 0 0 16px rgba(99, 102, 241, 0.2);'
                    : 'border: 1px solid rgba(255,255,255,0.07); background: #07080a;';

                html += `
                    <div onclick="window.selectCalendarDate('${dateStr}')" style="${borderStyle} border-radius: 12px; padding: 12px; min-height: 94px; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: all 0.2s;" onmouseover="if('${dateStr}' !== '${window.calendarSelectedDate}') this.style.background='rgba(255,255,255,0.04)';" onmouseout="if('${dateStr}' !== '${window.calendarSelectedDate}') this.style.background='#07080a';">
                        <div style="font-size: 14px; font-weight: 700; color: #ffffff;">${d}</div>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            ${completedCount > 0 ? `
                                <div style="font-size: 13px; font-weight: 800; color: #818cf8;">${pct}%</div>
                                <div style="font-size: 11px; font-weight: 600; color: #64748b;">✓ ${completedCount}</div>
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
                <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 16px;">
                    <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.3); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #818cf8;">
                        🎖️
                    </div>
                    <div>
                        <div style="font-size: 10.5px; font-weight: 700; color: #818cf8; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 2px;">PRODUCTIVITY SCORE</div>
                        <div style="font-size: 22px; font-weight: 800; color: #ffffff;">${score} <span style="font-size: 14px; font-weight: 600; color: #64748b;">/ 100</span></div>
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
                        <div style="display: flex; justify-content: space-between; align-items: center; background: #07080a; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <span style="font-size: 13.5px; font-weight: 600; color: ${isComp ? '#64748b' : '#ffffff'}; text-decoration: ${isComp ? 'line-through' : 'none'};">${h.name}</span>
                            <span style="font-size: 11px; font-weight: 700; color: ${isComp ? '#818cf8' : '#64748b'}; letter-spacing: 0.04em;">${isComp ? '✓ COMPLETED' : '⏳ MISSED'}</span>
                        </div>
                    `;
                });
            }

            html += `
                    </div>
                </div>

                <!-- Planner Tasks -->
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg>
                        PLANNER TASKS
                    </div>
            `;

            const tasks = Storage.get('planner_tasks', []);
            if (tasks.length === 0) {
                html += `<div style="font-size: 13px; color: #64748b;">No tasks planned on this date.</div>`;
            } else {
                html += `<div style="display: flex; flex-direction: column; gap: 8px;">`;
                tasks.forEach(t => {
                    html += `
                        <div style="display: flex; align-items: center; justify-content: space-between; background: #07080a; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <span style="font-size: 13.5px; font-weight: 600; color: ${t.completed ? '#64748b' : '#ffffff'}; text-decoration: ${t.completed ? 'line-through' : 'none'};">${t.text}</span>
                            <span style="font-size: 11px; font-weight: 700; color: ${t.completed ? '#10b981' : '#6366f1'};">${t.completed ? 'DONE' : t.priority || 'TASK'}</span>
                        </div>
                    `;
                });
                html += `</div>`;
            }

            html += `
                </div>

                <!-- Journal Reflections -->
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        JOURNAL REFLECTIONS
                    </div>
            `;

            const reflections = Storage.get(`daily_reflections_${dateStr}`, { morning: '', evening: '' });
            if (!reflections.morning && !reflections.evening) {
                html += `<div style="font-size: 13px; color: #64748b;">No journal logs recorded on this date.</div>`;
            } else {
                html += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
                if (reflections.morning) {
                    html += `
                        <div style="background: #07080a; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #f59e0b;">
                            <div style="font-size: 11px; font-weight: 700; color: #f59e0b; margin-bottom: 2px;">☀️ MORNING FOCUS</div>
                            <div style="font-size: 13px; color: #cbd5e1; line-height: 1.4;">${reflections.morning}</div>
                        </div>
                    `;
                }
                if (reflections.evening) {
                    html += `
                        <div style="background: #07080a; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #6366f1;">
                            <div style="font-size: 11px; font-weight: 700; color: #818cf8; margin-bottom: 2px;">🌙 EVENING REVIEW</div>
                            <div style="font-size: 13px; color: #cbd5e1; line-height: 1.4;">${reflections.evening}</div>
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
                                <input type="checkbox" class="custom-check habit-checkbox" data-habit-id="${habit.id}" onchange="window.toggleHabitCompletion('${habit.id}')" ${isCompleted ? 'checked' : ''}>
                                <div style="display: flex; flex-direction: column;">
                                    <span class="routine-name" style="font-size: 14px; font-weight: 600; color: ${isCompleted ? '#64748b' : '#ffffff'}; transition: all 0.2s ease;">${habit.name}</span>
                                    <span style="font-size: 12px; color: #64748b; margin-top: 3px;">${habit.category} • Streak: 🔥 ${habit.streak || 0}</span>
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
                const plannerTasks = Storage.get('planner_tasks', []);
                const compTasks = plannerTasks.filter(t => t.completed).length;
                tasksVal.textContent = `${compTasks}/${plannerTasks.length} Planner Tasks`;
            }

            const streakCount = document.getElementById('metric-streak-count');
            if (streakCount) {
                const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
                streakCount.textContent = completedCount > 0 ? (maxStreak > 0 ? maxStreak : 1) : 0;
            }

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
            if (window.updateReflectionUI) window.updateReflectionUI();
        };

        window.toggleHabitCompletion = (id) => {
            if (!Storage) return;
            const today = new Date().toISOString().split('T')[0];
            const willBeCompleted = !Storage.isCompleted(id, today);
            if (willBeCompleted) {
                Storage.markCompleted(id, today);
                if (window.showNotification) {
                    window.showNotification('✅ Great job! Keep going!', 'success');
                }
            } else {
                Storage.unmarkCompleted(id, today);
            }
            window.renderDashboardHabits();
        };

        // Page Load Event Listener
        window.addEventListener('page-loaded', (e) => {
            const path = e.detail.path;
            
            if (path === '/login') {
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
                            const response = await fetch('/api/auth/login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email, password }),
                            });

                            const responseText = await response.text();
                            let data = {};
                            try {
                                data = JSON.parse(responseText);
                            } catch (jsonErr) {
                                data = { error: 'Server error. Please try again.' };
                            }

                            if (!response.ok) {
                                let errMsg = data.error || 'Login failed. Please check your credentials.';
                                if (errMsg.includes('Invalid login credentials')) {
                                    errMsg = '❌ Incorrect email or password. Please try again.';
                                } else if (errMsg.includes('Email not confirmed')) {
                                    errMsg = '❌ Email not confirmed. Please check your inbox.';
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
                            const response = await fetch('/api/auth/signup', {
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
                }

                // Setup mobile sidebar toggle & overlay
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
                const nameInput = document.getElementById('settings-fullname');
                const emailInput = document.getElementById('settings-email');
                const avatarInput = document.getElementById('settings-avatar');
                const tzSelect = document.getElementById('settings-timezone');

                let userObj = null;
                try { userObj = JSON.parse(userJson); } catch(e){}

                if (nameInput) nameInput.value = userName || 'Jack';
                if (emailInput) emailInput.value = userEmail || 'jack@dailyos.io';
                if (avatarInput) avatarInput.value = (userObj && userObj.avatar) ? userObj.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';
                if (tzSelect && userObj && userObj.timezone) tzSelect.value = userObj.timezone;
            }
        });

        // ─────────────────────────────────────────────────────────────────────
        // SYSTEM SETTINGS & LOGOUT LOGIC
        // ─────────────────────────────────────────────────────────────────────

        window.saveSettings = async () => {
            const nameInput = document.getElementById('settings-fullname');
            const emailInput = document.getElementById('settings-email');
            const avatarInput = document.getElementById('settings-avatar');
            const tzSelect = document.getElementById('settings-timezone');

            const fullName = nameInput ? nameInput.value.trim() : 'User';
            const email = emailInput ? emailInput.value.trim() : 'user@email.com';
            const avatar = avatarInput ? avatarInput.value.trim() : '';
            const timezone = tzSelect ? tzSelect.value : 'UTC';

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

