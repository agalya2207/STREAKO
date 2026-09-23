import { Router } from './utils/router.js';
import { Storage } from './utils/storage.js';

class App {
    constructor() {
        this.router = new Router();
        this.storage = Storage;
    }

    init() {
        window.app = this;

        // Global Page Navigation
        window.goToPage = (pageId) => {
            const routeMap = {
                'landing': '/landing',
                'signup': '/signup',
                'login': '/login',
                'role-selection': '/role-selection',
                'onboarding': '/onboarding',
                'dashboard': '/dashboard',
                'today': '/dashboard',
                'habits-library': '/habits-library',
                'habits': '/habits-library',
                'timeline': '/timeline',
                'planner': '/timeline',
                'calendar': '/calendar',
                'goals': '/goals',
                'analytics': '/analytics',
                'journal': '/journal',
                'mentor-dashboard': '/mentor-dashboard',
                'settings': '/settings'
            };
            const target = routeMap[pageId] || '/dashboard';
            this.router.navigate(target);
        };

        // Global Notification Toast
        window.showNotification = (message, type = 'info') => {
            let toast = document.getElementById('dailyos-global-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'dailyos-global-toast';
                toast.className = 'dailyos-toast';
                document.body.appendChild(toast);
            }
            const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '⚡';
            toast.innerHTML = `<span style="font-size: 16px;">${icon}</span> <span>${message}</span>`;
            toast.classList.add('show');
            clearTimeout(window._toastTimeout);
            window._toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        };

        // Global Logout Function
        window.logout = async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            } catch (e) { /* ignore */ }
            localStorage.removeItem('access_token');
            localStorage.removeItem('streako_auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('expires_at');
            localStorage.removeItem('user');
            localStorage.removeItem('streako_user');
            window.showNotification('Logged out successfully', 'info');
            setTimeout(() => {
                this.router.navigate('/login');
            }, 300);
        };

        // ═══════════════════════════════════════════════════════
        // 1. TODAY / DASHBOARD VIEW CONTROLLER
        // ═══════════════════════════════════════════════════════
        window.currentDashboardFilter = 'all';

        window.filterDashboardHabits = (category, btn) => {
            window.currentDashboardFilter = category;
            const container = document.getElementById('dashboard-habit-filters');
            if (container) {
                container.querySelectorAll('button').forEach(b => {
                    b.style.background = '#18181b';
                    b.style.color = 'var(--text-secondary)';
                    b.style.borderColor = '#27272a';
                });
                if (btn) {
                    btn.style.background = 'rgba(132, 204, 22, 0.12)';
                    btn.style.color = 'var(--primary-bright)';
                    btn.style.borderColor = 'rgba(132, 204, 22, 0.3)';
                }
            }
            window.renderTodayHabits();
        };

        window.renderTodayDashboard = () => {
            const todayStr = new Date().toISOString().split('T')[0];
            const habits = Storage.getHabits().filter(h => !h.paused);
            const completedToday = habits.filter(h => Storage.isCompleted(h.id, todayStr));
            const tasks = Storage.getTasks().filter(t => t.due_date === todayStr);
            const tasksCompleted = tasks.filter(t => t.status === 'completed');

            // Today's Progress Percentage
            const totalCount = habits.length;
            const doneCount = completedToday.length;
            const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100;

            // Update Header Date & Greeting
            const dateBadge = document.getElementById('today-date-badge');
            if (dateBadge) {
                const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
                dateBadge.textContent = new Date().toLocaleDateString('en-US', options);
            }

            const user = Storage.getUser();
            const greetingEl = document.getElementById('today-greeting-text');
            if (greetingEl) {
                const hour = new Date().getHours();
                const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
                greetingEl.textContent = `${timeGreeting}, ${user.name.split(' ')[0]}`;
            }

            // Circular Progress Ring & Numbers
            const circleFill = document.getElementById('progress-circle-fill');
            const pctLabel = document.getElementById('progress-percent-label');
            const habitsDoneCount = document.getElementById('habits-done-count');
            const tasksDoneCount = document.getElementById('tasks-done-count');
            if (circleFill) circleFill.setAttribute('stroke-dasharray', `${pct}, 100`);
            if (pctLabel) pctLabel.textContent = `${pct}%`;
            if (habitsDoneCount) habitsDoneCount.textContent = `${doneCount}/${totalCount} Habits`;
            if (tasksDoneCount) tasksDoneCount.textContent = `${tasksCompleted.length}/${tasks.length || 3} Tasks done`;

            // Streaks & Productivity Score
            const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
            const streakVal = document.getElementById('dashboard-streak-val');
            const scoreVal = document.getElementById('dashboard-score-val');
            const sidebarBadge = document.getElementById('sidebar-streak-badge');
            if (streakVal) streakVal.textContent = `${maxStreak || 14} Days`;
            if (sidebarBadge) sidebarBadge.textContent = `🔥 ${maxStreak || 14}`;
            if (scoreVal) {
                const baseScore = Math.min(100, Math.round(pct * 0.7 + (maxStreak > 5 ? 30 : 20)));
                scoreVal.textContent = `${baseScore} / 100`;
            }

            // Reflections Line
            const journal = Storage.getJournalForDate(todayStr);
            const morningDone = !!(journal && journal.morning_reflection && journal.morning_reflection.accomplish);
            const eveningDone = !!(journal && journal.evening_reflection && journal.evening_reflection.accomplishments);
            const refStatus = document.getElementById('reflections-status-line');
            const refEve = document.getElementById('reflections-evening-line');
            if (refStatus) refStatus.textContent = morningDone ? 'Morning: ✅ Complete' : 'Morning: ⏳ Pending';
            if (refEve) refEve.textContent = eveningDone ? 'Evening: ✅ Complete' : 'Evening: ⏳ Pending';

            window.renderTodayHabits();
            window.renderPriorities();
            window.renderTodaySchedule();
        };

        window.renderTodayHabits = () => {
            const container = document.getElementById('today-habits-container');
            if (!container) return;

            const todayStr = new Date().toISOString().split('T')[0];
            let habits = Storage.getHabits().filter(h => !h.paused);

            if (window.currentDashboardFilter && window.currentDashboardFilter !== 'all') {
                habits = habits.filter(h => h.category === window.currentDashboardFilter);
            }

            if (habits.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 36px 0; color: var(--text-tertiary);">
                        <p style="font-size: 14px;">No active routines found for this filter.</p>
                        <button onclick="window.openCreateHabitModal()" class="btn btn-accent-glow btn-sm">+ Add New Routine</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = habits.map(h => {
                const isDone = Storage.isCompleted(h.id, todayStr);
                const timeSlot = h.startTime && h.endTime ? `${h.startTime} - ${h.endTime}` : 'Daily Schedule';
                return `
                    <div class="habit-row-item ${isDone ? 'completed' : ''}" style="opacity: ${isDone ? '0.7' : '1'};">
                        <div style="display: flex; align-items: center; gap: 14px; flex: 1;">
                            <div class="custom-checkbox ${isDone ? 'checked' : ''}" onclick="window.toggleTodayHabit('${h.id}')">
                                ${isDone ? '✓' : ''}
                            </div>
                            <div style="width: 36px; height: 36px; border-radius: 8px; background: ${h.accentColor}20; color: ${h.accentColor}; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
                                ${h.icon || '⚡'}
                            </div>
                            <div>
                                <div style="font-size: 14px; font-weight: 700; color: ${isDone ? 'var(--text-secondary)' : '#ffffff'}; text-decoration: ${isDone ? 'line-through' : 'none'};">
                                    ${h.name}
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-top: 3px; font-size: 12px; color: var(--text-tertiary);">
                                    <span>${h.category}</span>
                                    <span>•</span>
                                    <span>⏰ ${timeSlot}</span>
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="badge badge-orange" style="font-size: 11px;">🔥 ${h.streak || 0}d</span>
                            <button onclick="window.editHabit('${h.id}')" class="btn btn-ghost btn-sm" style="padding: 4px 8px; font-size: 12px; color: var(--text-tertiary);">✏️</button>
                        </div>
                    </div>
                `;
            }).join('');
        };

        window.toggleTodayHabit = (habitId) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const isDone = Storage.isCompleted(habitId, todayStr);
            if (isDone) {
                Storage.unmarkCompleted(habitId, todayStr);
                window.showNotification('Habit unchecked', 'info');
            } else {
                Storage.markCompleted(habitId, todayStr);
                window.showNotification('🔥 Routine completed! Momentum locked in.', 'success');
            }
            window.renderTodayDashboard();
        };

        window.renderTodaySchedule = () => {
            const container = document.getElementById('dashboard-schedule-container');
            if (!container) return;

            const todayStr = new Date().toISOString().split('T')[0];
            const tasks = Storage.getTasks().filter(t => t.due_date === todayStr);

            if (tasks.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px 0; color: var(--text-tertiary); font-size: 13px;">
                        No tasks scheduled for today.
                        <div style="margin-top: 8px;">
                            <button onclick="window.openCreateTaskModal()" class="btn btn-ghost btn-sm" style="color: var(--primary-bright);">+ Add Task</button>
                        </div>
                    </div>
                `;
                return;
            }

            container.innerHTML = tasks.slice(0, 4).map(t => {
                const isDone = t.status === 'completed';
                const badgeClass = t.priority === 'high' ? 'badge-orange' : t.priority === 'low' ? 'badge-gray' : 'badge-cyan';
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #141417; border: 1px solid #27272a; padding: 10px 14px; border-radius: 10px; opacity: ${isDone ? '0.6' : '1'};">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" onchange="window.togglePlannerTask('${t.id}')" ${isDone ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer;" />
                            <div>
                                <div style="font-size: 13px; font-weight: 600; color: ${isDone ? 'var(--text-tertiary)' : '#ffffff'}; text-decoration: ${isDone ? 'line-through' : 'none'};">${t.title}</div>
                                <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 2px;">⏰ ${t.due_time || '09:00'} • ${t.duration || 45}m</div>
                            </div>
                        </div>
                        <span class="badge ${badgeClass}" style="font-size: 10px;">${t.priority}</span>
                    </div>
                `;
            }).join('');
        };

        // Priorities State
        window.prioritiesData = Storage.getPriorities();
        window.isAddingPriority = false;

        window.renderPriorities = () => {
            const container = document.getElementById('priorities-container');
            if (!container) return;

            window.prioritiesData = Storage.getPriorities();
            const maxPriorities = 3;
            const canAdd = window.prioritiesData.length < maxPriorities;

            let html = '';
            if (window.prioritiesData.length === 0 && !window.isAddingPriority) {
                html = `
                    <div style="text-align: center; padding: 20px 0;">
                        <p style="color: var(--text-tertiary); font-size: 13px; margin: 0 0 10px 0;">No top priorities set for today.</p>
                        <button onclick="window.startAddingPriority()" class="btn btn-accent-glow btn-sm">+ Define Top Anchor</button>
                    </div>
                `;
            } else {
                html += window.prioritiesData.map((p, idx) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #141417; padding: 10px 14px; border-radius: 10px; border: 1px solid #27272a;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 12px; font-weight: 800; color: var(--primary-bright); min-width: 16px;">#${idx + 1}</span>
                            <input type="checkbox" onchange="window.togglePriority(${idx})" ${p.completed ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer;" />
                            <span style="font-size: 13px; font-weight: 600; color: ${p.completed ? 'var(--text-tertiary)' : '#ffffff'}; text-decoration: ${p.completed ? 'line-through' : 'none'};">${p.text}</span>
                        </div>
                        <button onclick="window.deletePriority(${idx})" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-muted)'">✕</button>
                    </div>
                `).join('');

                if (window.isAddingPriority && canAdd) {
                    html += `
                        <div style="display: flex; align-items: center; gap: 10px; background: rgba(132, 204, 22, 0.05); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(132, 204, 22, 0.3);">
                            <span style="font-size: 12px; font-weight: 800; color: var(--primary-bright);">#${window.prioritiesData.length + 1}</span>
                            <input type="text" id="new-priority-input" placeholder="Define critical priority..." style="flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 13px;" />
                            <button onclick="window.savePriority()" class="btn btn-primary btn-sm" style="padding: 4px 10px;">Add</button>
                            <button onclick="window.cancelPriority()" class="btn btn-ghost btn-sm" style="padding: 4px 8px;">✕</button>
                        </div>
                    `;
                }
            }

            container.innerHTML = html;
            if (window.isAddingPriority) {
                const input = document.getElementById('new-priority-input');
                if (input) {
                    input.focus();
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') window.savePriority();
                        if (e.key === 'Escape') window.cancelPriority();
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
                window.prioritiesData.push({ id: Date.now(), text, completed: false });
                Storage.setPriorities(window.prioritiesData);
                window.isAddingPriority = window.prioritiesData.length < 3;
                window.renderPriorities();
                window.showNotification('Top priority added', 'success');
            }
        };

        window.togglePriority = (idx) => {
            window.prioritiesData[idx].completed = !window.prioritiesData[idx].completed;
            Storage.setPriorities(window.prioritiesData);
            window.renderPriorities();
        };

        window.deletePriority = (idx) => {
            window.prioritiesData.splice(idx, 1);
            Storage.setPriorities(window.prioritiesData);
            window.renderPriorities();
        };

        // ═══════════════════════════════════════════════════════
        // 2. HABITS LIBRARY VIEW CONTROLLER
        // ═══════════════════════════════════════════════════════
        window.currentHabitFilter = 'all';
        window.currentHabitSearch = '';
        window.editingHabitId = null;

        window.filterHabitsList = (cat, btn) => {
            window.currentHabitFilter = cat;
            const container = document.getElementById('habit-category-filters');
            if (container) {
                container.querySelectorAll('button').forEach(b => {
                    b.style.background = '#18181b';
                    b.style.color = 'var(--text-secondary)';
                    b.style.borderColor = '#27272a';
                });
                if (btn) {
                    btn.style.background = 'rgba(132, 204, 22, 0.12)';
                    btn.style.color = 'var(--primary-bright)';
                    btn.style.borderColor = 'rgba(132, 204, 22, 0.3)';
                }
            }
            window.renderHabitsLibrary();
        };

        window.searchHabits = (val) => {
            window.currentHabitSearch = (val || '').toLowerCase().trim();
            window.renderHabitsLibrary();
        };

        window.renderHabitsLibrary = () => {
            const grid = document.getElementById('habits-library-grid');
            if (!grid) return;

            let habits = Storage.getHabits();

            // Stats Update
            const totalCountEl = document.getElementById('habits-total-count');
            const todayPctEl = document.getElementById('habits-today-pct');
            const avgStreakEl = document.getElementById('habits-avg-streak');

            const todayStr = new Date().toISOString().split('T')[0];
            const activeHabits = habits.filter(h => !h.paused);
            const doneToday = activeHabits.filter(h => Storage.isCompleted(h.id, todayStr)).length;
            const pct = activeHabits.length > 0 ? Math.round((doneToday / activeHabits.length) * 100) : 0;
            const avgStreak = activeHabits.length > 0 ? (activeHabits.reduce((sum, h) => sum + (h.streak || 0), 0) / activeHabits.length).toFixed(1) : 0;

            if (totalCountEl) totalCountEl.textContent = `${activeHabits.length} Active`;
            if (todayPctEl) todayPctEl.textContent = `${pct}%`;
            if (avgStreakEl) avgStreakEl.textContent = `${avgStreak} Days`;

            // Filter & Search
            if (window.currentHabitFilter && window.currentHabitFilter !== 'all') {
                habits = habits.filter(h => h.category === window.currentHabitFilter);
            }
            if (window.currentHabitSearch) {
                habits = habits.filter(h => h.name.toLowerCase().includes(window.currentHabitSearch) || (h.description && h.description.toLowerCase().includes(window.currentHabitSearch)));
            }

            if (habits.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 48px 0; color: var(--text-tertiary);">
                        <p style="font-size: 15px;">No routines match your current search or filter.</p>
                        <button onclick="window.openCreateHabitModal()" class="btn btn-primary btn-sm">+ Create New Routine</button>
                    </div>
                `;
                return;
            }

            // Render Habit Cards with 7-Day History Dots
            grid.innerHTML = habits.map(h => {
                const isPaused = h.paused === true;
                const isCompletedToday = Storage.isCompleted(h.id, todayStr);
                const timeStr = h.startTime && h.endTime ? `${h.startTime} - ${h.endTime}` : 'Daily Flexible';

                // Build 7-day dot matrix
                const dots = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dStr = d.toISOString().split('T')[0];
                    const dayLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
                    const done = Storage.isCompleted(h.id, dStr);
                    dots.push(`
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                            <div style="width: 14px; height: 14px; border-radius: 4px; background: ${done ? (h.accentColor || '#84cc16') : '#27272a'}; box-shadow: ${done ? `0 0 6px ${h.accentColor || '#84cc16'}50` : 'none'};"></div>
                            <span style="font-size: 9px; color: var(--text-muted); font-weight: 700;">${dayLetter}</span>
                        </div>
                    `);
                }

                return `
                    <div class="dailyos-card" style="opacity: ${isPaused ? '0.5' : '1'}; border-color: ${isCompletedToday ? `${h.accentColor || '#84cc16'}40` : 'var(--border-dark)'};">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 40px; height: 40px; border-radius: 10px; background: ${h.accentColor || '#84cc16'}20; color: ${h.accentColor || '#84cc16'}; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                    ${h.icon || '⚡'}
                                </div>
                                <div>
                                    <h3 style="font-size: 15px; font-weight: 800; color: #ffffff; margin: 0;">${h.name}</h3>
                                    <span class="badge badge-gray" style="font-size: 10px; margin-top: 3px;">${h.category}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 4px;">
                                <button onclick="window.pauseHabit('${h.id}')" title="${isPaused ? 'Resume' : 'Pause'}" class="btn btn-ghost btn-sm" style="padding: 4px 6px;">${isPaused ? '▶️' : '⏸️'}</button>
                                <button onclick="window.editHabit('${h.id}')" title="Edit" class="btn btn-ghost btn-sm" style="padding: 4px 6px;">✏️</button>
                                <button onclick="window.deleteHabit('${h.id}')" title="Delete" class="btn btn-ghost btn-sm" style="padding: 4px 6px; color: #ef4444;">🗑️</button>
                            </div>
                        </div>

                        <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 16px 0; min-height: 36px; line-height: 1.4;">${h.description || 'Consistent daily execution.'}</p>

                        <!-- 7-Day Dot Matrix -->
                        <div style="background: #141417; border: 1px solid #27272a; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase;">7-Day History</span>
                            <div style="display: flex; gap: 8px;">
                                ${dots.join('')}
                            </div>
                        </div>

                        <!-- Stats & Quick Check -->
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #1f1f23; padding-top: 12px;">
                            <div style="display: flex; gap: 12px; font-size: 13px;">
                                <span style="font-weight: 700; color: #fb923c;">🔥 ${h.streak || 0}d</span>
                                <span style="color: var(--text-tertiary);">🏆 Best: ${h.bestStreak || h.streak || 0}d</span>
                            </div>
                            <button onclick="window.toggleTodayHabit('${h.id}')" class="btn btn-sm ${isCompletedToday ? 'btn-accent-glow' : 'btn-primary'}" style="font-size: 12px; padding: 4px 10px;">
                                ${isCompletedToday ? '✓ Done Today' : '+ Complete'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        };

        window.openCreateHabitModal = () => {
            window.editingHabitId = null;
            const titleEl = document.getElementById('habit-modal-title');
            const submitBtn = document.getElementById('create-habit-btn');
            if (titleEl) titleEl.textContent = 'Define New Routine';
            if (submitBtn) submitBtn.textContent = 'Create Routine';

            const nameEl = document.getElementById('habit-name');
            const descEl = document.getElementById('habit-desc');
            const targetEl = document.getElementById('habit-target');
            if (nameEl) nameEl.value = '';
            if (descEl) descEl.value = '';
            if (targetEl) targetEl.value = '1';

            window.renderSessionFields(1);
            const overlay = document.getElementById('habit-modal-overlay');
            if (overlay) overlay.style.display = 'flex';
        };

        window.closeHabitModal = () => {
            const overlay = document.getElementById('habit-modal-overlay');
            if (overlay) overlay.style.display = 'none';
        };

        window.renderSessionFields = (count = 1, prefilled = []) => {
            const container = document.getElementById('habit-sessions-container');
            if (!container) return;
            container.innerHTML = '';
            for (let i = 1; i <= count; i++) {
                const s = prefilled[i - 1] || { startTime: '08:00', endTime: '08:30' };
                container.innerHTML += `
                    <div class="session-row" style="display: flex; gap: 10px; align-items: center; background: #141417; padding: 8px 12px; border-radius: 8px; border: 1px solid #27272a;">
                        <span style="font-size: 12px; font-weight: 700; color: var(--text-tertiary); min-width: 65px;">Session ${i}</span>
                        <input type="time" class="session-start form-control" value="${s.startTime || '08:00'}" style="padding: 4px 8px; font-size: 12px;" />
                        <span style="color: var(--text-tertiary);">to</span>
                        <input type="time" class="session-end form-control" value="${s.endTime || '08:30'}" style="padding: 4px 8px; font-size: 12px;" />
                    </div>
                `;
            }
        };

        window.createHabit = () => {
            const nameEl = document.getElementById('habit-name');
            const name = nameEl ? nameEl.value.trim() : '';
            if (!name) {
                window.showNotification('Please enter a routine name', 'warning');
                return;
            }

            const desc = document.getElementById('habit-desc')?.value.trim() || '';
            const category = document.getElementById('habit-category')?.value || 'Productivity';
            const target = parseInt(document.getElementById('habit-target')?.value || 1, 10);
            const icon = window.selectedIcon || '⚡';
            const color = window.selectedColor || '#84cc16';

            const sessions = [];
            document.querySelectorAll('#habit-sessions-container .session-row').forEach(row => {
                const start = row.querySelector('.session-start')?.value || '08:00';
                const end = row.querySelector('.session-end')?.value || '08:30';
                sessions.push({ startTime: start, endTime: end });
            });

            if (window.editingHabitId) {
                Storage.updateHabit(window.editingHabitId, {
                    name,
                    description: desc,
                    category,
                    dailyTarget: target,
                    icon,
                    accentColor: color,
                    color,
                    sessions,
                    startTime: sessions[0]?.startTime || '08:00',
                    endTime: sessions[0]?.endTime || '08:30'
                });
                window.showNotification('Routine updated successfully', 'success');
            } else {
                Storage.addHabit({
                    name,
                    description: desc,
                    category,
                    dailyTarget: target,
                    icon,
                    accentColor: color,
                    color,
                    sessions,
                    startTime: sessions[0]?.startTime || '08:00',
                    endTime: sessions[0]?.endTime || '08:30'
                });
                window.showNotification('New routine created! 🚀', 'success');
            }

            window.closeHabitModal();
            window.renderHabitsLibrary();
            window.renderTodayDashboard();
        };

        window.editHabit = (id) => {
            const habit = Storage.getHabit(id);
            if (!habit) return;
            window.editingHabitId = id;

            const titleEl = document.getElementById('habit-modal-title');
            const submitBtn = document.getElementById('create-habit-btn');
            if (titleEl) titleEl.textContent = 'Edit Routine';
            if (submitBtn) submitBtn.textContent = 'Save Changes';

            document.getElementById('habit-name').value = habit.name || '';
            document.getElementById('habit-desc').value = habit.description || '';
            document.getElementById('habit-category').value = habit.category || 'Productivity';
            document.getElementById('habit-target').value = habit.dailyTarget || 1;

            window.selectedIcon = habit.icon || '⚡';
            window.selectedColor = habit.accentColor || habit.color || '#84cc16';

            window.renderSessionFields(habit.dailyTarget || 1, habit.sessions || [{ startTime: habit.startTime, endTime: habit.endTime }]);
            const overlay = document.getElementById('habit-modal-overlay');
            if (overlay) overlay.style.display = 'flex';
        };

        window.pauseHabit = (id) => {
            const habit = Storage.getHabit(id);
            if (habit) {
                Storage.updateHabit(id, { paused: !habit.paused });
                window.showNotification(habit.paused ? 'Routine resumed' : 'Routine paused', 'info');
                window.renderHabitsLibrary();
                window.renderTodayDashboard();
            }
        };

        window.deleteHabit = (id) => {
            if (confirm('Are you sure you want to delete this routine?')) {
                Storage.deleteHabit(id);
                window.showNotification('Routine deleted', 'info');
                window.renderHabitsLibrary();
                window.renderTodayDashboard();
            }
        };

        // Icon & Color Click Handlers
        document.addEventListener('click', (e) => {
            if (e.target.matches('.icon-btn') || e.target.closest('.icon-btn')) {
                const btn = e.target.matches('.icon-btn') ? e.target : e.target.closest('.icon-btn');
                document.querySelectorAll('.icon-btn').forEach(b => b.style.background = '#18181b');
                btn.style.background = 'rgba(132, 204, 22, 0.2)';
                window.selectedIcon = btn.getAttribute('data-icon');
            }
            if (e.target.matches('.color-swatch')) {
                document.querySelectorAll('.color-swatch').forEach(s => s.style.outline = 'none');
                e.target.style.outline = '2px solid #ffffff';
                window.selectedColor = e.target.getAttribute('data-color');
            }
        });

        // ═══════════════════════════════════════════════════════
        // 3. PLANNER & TIMELINE VIEW CONTROLLER
        // ═══════════════════════════════════════════════════════
        window.plannerDateOffset = 0;
        window.timerDuration = 25 * 60; // 25 min default
        window.timerRemaining = 25 * 60;
        window.timerRunning = false;
        window.timerInterval = null;

        window.getPlannerActiveDate = () => {
            const d = new Date();
            d.setDate(d.getDate() + window.plannerDateOffset);
            return d.toISOString().split('T')[0];
        };

        window.changePlannerDate = (delta) => {
            window.plannerDateOffset += delta;
            window.renderPlannerView();
        };

        window.setPlannerToday = () => {
            window.plannerDateOffset = 0;
            window.renderPlannerView();
        };

        window.renderPlannerView = () => {
            const activeDate = window.getPlannerActiveDate();
            const dateLabel = document.getElementById('planner-current-date-label');
            if (dateLabel) {
                const d = new Date();
                d.setDate(d.getDate() + window.plannerDateOffset);
                const options = { weekday: 'short', month: 'short', day: 'numeric' };
                const prefix = window.plannerDateOffset === 0 ? 'Today, ' : window.plannerDateOffset === 1 ? 'Tomorrow, ' : window.plannerDateOffset === -1 ? 'Yesterday, ' : '';
                dateLabel.textContent = `${prefix}${d.toLocaleDateString('en-US', options)}`;
            }

            window.renderPlannerHourlyGrid();
            window.renderPlannerTaskList();
            window.renderPriorities();
        };

        window.renderPlannerHourlyGrid = () => {
            const grid = document.getElementById('planner-hourly-grid');
            if (!grid) return;

            const activeDate = window.getPlannerActiveDate();
            const tasks = Storage.getTasks().filter(t => t.due_date === activeDate);
            const habits = Storage.getHabits().filter(h => !h.paused);

            let html = '';
            for (let hour = 6; hour <= 23; hour++) {
                const hourStr = (hour < 10 ? '0' : '') + hour + ':00';
                const hourTasks = tasks.filter(t => t.due_time && t.due_time.startsWith((hour < 10 ? '0' : '') + hour));
                const hourHabits = habits.filter(h => h.startTime && h.startTime.startsWith((hour < 10 ? '0' : '') + hour));

                html += `
                    <div style="display: flex; gap: 14px; align-items: flex-start; min-height: 48px; border-bottom: 1px solid #1f1f23; padding: 6px 0;">
                        <span style="font-size: 12px; font-weight: 700; color: var(--text-tertiary); font-family: var(--font-mono); width: 48px; padding-top: 4px;">${hourStr}</span>
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                            ${hourTasks.map(t => {
                                const isDone = t.status === 'completed';
                                const color = t.priority === 'high' ? '#f97316' : t.priority === 'low' ? '#71717a' : '#84cc16';
                                return `
                                    <div style="background: ${color}15; border-left: 3px solid ${color}; border-radius: 6px; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <span style="font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: ${isDone ? 'line-through' : 'none'};">${t.title}</span>
                                            <span style="font-size: 11px; color: var(--text-tertiary); margin-left: 8px;">${t.duration || 45} mins</span>
                                        </div>
                                        <button onclick="window.togglePlannerTask('${t.id}')" class="btn btn-ghost btn-sm" style="padding: 2px 6px; font-size: 11px; color: ${color};">
                                            ${isDone ? '✓ Completed' : 'Mark Done'}
                                        </button>
                                    </div>
                                `;
                            }).join('')}

                            ${hourHabits.map(h => `
                                <div style="background: rgba(132, 204, 22, 0.08); border-left: 3px solid #84cc16; border-radius: 6px; padding: 4px 10px; display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 12px;">${h.icon}</span>
                                    <span style="font-size: 12px; font-weight: 600; color: #ffffff;">${h.name}</span>
                                    <span class="badge badge-lime" style="font-size: 9px; margin-left: auto;">Routine</span>
                                </div>
                            `).join('')}

                            ${hourTasks.length === 0 && hourHabits.length === 0 ? `
                                <div onclick="window.openCreateTaskModal('${hourStr}')" style="height: 24px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; padding-left: 8px; font-size: 11px; color: transparent; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'; this.style.color='var(--text-muted)'" onmouseout="this.style.background='transparent'; this.style.color='transparent'">
                                    + Schedule task at ${hourStr}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
            grid.innerHTML = html;
        };

        window.renderPlannerTaskList = () => {
            const container = document.getElementById('planner-task-list-container');
            if (!container) return;

            const activeDate = window.getPlannerActiveDate();
            const tasks = Storage.getTasks().filter(t => t.due_date === activeDate);

            if (tasks.length === 0) {
                container.innerHTML = `<div style="text-align: center; padding: 16px 0; color: var(--text-tertiary); font-size: 13px;">No tasks for this day.</div>`;
                return;
            }

            container.innerHTML = tasks.map(t => {
                const isDone = t.status === 'completed';
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #141417; border: 1px solid #27272a; padding: 8px 12px; border-radius: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" onchange="window.togglePlannerTask('${t.id}')" ${isDone ? 'checked' : ''} style="width: 15px; height: 15px; accent-color: var(--primary); cursor: pointer;" />
                            <div>
                                <div style="font-size: 13px; font-weight: 600; color: ${isDone ? 'var(--text-tertiary)' : '#fff'}; text-decoration: ${isDone ? 'line-through' : 'none'};">${t.title}</div>
                                <div style="font-size: 11px; color: var(--text-tertiary);">⏰ ${t.due_time} • ${t.category}</div>
                            </div>
                        </div>
                        <button onclick="window.deletePlannerTask('${t.id}')" class="btn btn-ghost btn-sm" style="padding: 2px 6px; color: var(--text-muted);">🗑️</button>
                    </div>
                `;
            }).join('');
        };

        window.openCreateTaskModal = (defaultTime = '09:00') => {
            const timeInput = document.getElementById('task-time-input');
            const titleInput = document.getElementById('task-title-input');
            if (timeInput) timeInput.value = defaultTime;
            if (titleInput) titleInput.value = '';
            const overlay = document.getElementById('task-modal-overlay');
            if (overlay) overlay.style.display = 'flex';
        };

        window.closeTaskModal = () => {
            const overlay = document.getElementById('task-modal-overlay');
            if (overlay) overlay.style.display = 'none';
        };

        window.savePlannerTask = () => {
            const title = document.getElementById('task-title-input')?.value.trim();
            if (!title) {
                window.showNotification('Please provide a task title', 'warning');
                return;
            }
            const notes = document.getElementById('task-notes-input')?.value.trim() || '';
            const due_time = document.getElementById('task-time-input')?.value || '09:00';
            const duration = parseInt(document.getElementById('task-duration-input')?.value || 45, 10);
            const category = document.getElementById('task-category-input')?.value || 'Productivity';
            const priority = document.getElementById('task-priority-input')?.value || 'medium';
            const activeDate = window.getPlannerActiveDate();

            Storage.addTask({
                title,
                notes,
                due_date: activeDate,
                due_time,
                duration,
                category,
                priority,
                is_top_3: priority === 'high'
            });

            window.showNotification('Task scheduled on planner! 📅', 'success');
            window.closeTaskModal();
            window.renderPlannerView();
            window.renderTodayDashboard();
        };

        window.togglePlannerTask = (id) => {
            Storage.toggleTaskStatus(id);
            window.renderPlannerView();
            window.renderTodayDashboard();
        };

        window.deletePlannerTask = (id) => {
            Storage.deleteTask(id);
            window.showNotification('Task removed', 'info');
            window.renderPlannerView();
            window.renderTodayDashboard();
        };

        // Pomodoro Focus Timer Logic
        window.setTimerMode = (minutes) => {
            window.timerDuration = minutes * 60;
            window.timerRemaining = minutes * 60;
            window.timerRunning = false;
            clearInterval(window.timerInterval);
            const btn = document.getElementById('timer-toggle-btn');
            if (btn) btn.textContent = '▶ Start Sprint';
            window.updateTimerDisplay();
        };

        window.toggleFocusTimer = () => {
            const btn = document.getElementById('timer-toggle-btn');
            if (window.timerRunning) {
                window.timerRunning = false;
                clearInterval(window.timerInterval);
                if (btn) btn.textContent = '▶ Resume';
            } else {
                window.timerRunning = true;
                if (btn) btn.textContent = '⏸ Pause';
                window.timerInterval = setInterval(() => {
                    if (window.timerRemaining > 0) {
                        window.timerRemaining--;
                        window.updateTimerDisplay();
                    } else {
                        clearInterval(window.timerInterval);
                        window.timerRunning = false;
                        if (btn) btn.textContent = '▶ Start Sprint';
                        window.showNotification('🔔 Deep work sprint completed! Great job.', 'success');
                    }
                }, 1000);
            }
        };

        window.resetFocusTimer = () => {
            window.timerRemaining = window.timerDuration;
            window.timerRunning = false;
            clearInterval(window.timerInterval);
            const btn = document.getElementById('timer-toggle-btn');
            if (btn) btn.textContent = '▶ Start Sprint';
            window.updateTimerDisplay();
        };

        window.updateTimerDisplay = () => {
            const display = document.getElementById('focus-timer-display');
            if (display) {
                const mins = Math.floor(window.timerRemaining / 60);
                const secs = window.timerRemaining % 60;
                display.textContent = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
            }
        };

        // ═══════════════════════════════════════════════════════
        // 4. CALENDAR VIEW CONTROLLER
        // ═══════════════════════════════════════════════════════
        window.calendarDate = new Date();

        window.changeCalendarMonth = (delta) => {
            window.calendarDate.setMonth(window.calendarDate.getMonth() + delta);
            window.renderCalendarView();
        };

        window.resetCalendarToCurrentMonth = () => {
            window.calendarDate = new Date();
            window.renderCalendarView();
        };

        window.renderCalendarView = () => {
            const monthLabel = document.getElementById('calendar-month-year-label');
            if (monthLabel) {
                const options = { month: 'long', year: 'numeric' };
                monthLabel.textContent = window.calendarDate.toLocaleDateString('en-US', options);
            }

            const grid = document.getElementById('calendar-days-grid');
            if (!grid) return;

            const year = window.calendarDate.getFullYear();
            const month = window.calendarDate.getMonth();
            const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Adjust first day for Monday start (0 = Mon, 6 = Sun)
            const startOffset = (firstDayIndex + 6) % 7;

            const habits = Storage.getHabits().filter(h => !h.paused);
            const todayStr = new Date().toISOString().split('T')[0];

            let html = '';
            // Empty placeholder cells before 1st of month
            for (let i = 0; i < startOffset; i++) {
                html += `<div style="min-height: 80px; background: transparent; border-radius: 8px;"></div>`;
            }

            let totalActiveDays = 0;
            let perfectDays = 0;
            let totalCompletions = 0;

            for (let day = 1; day <= daysInMonth; day++) {
                const dateObj = new Date(year, month, day);
                const dateStr = dateObj.toISOString().split('T')[0];
                const isToday = dateStr === todayStr;

                const dayLogs = habits.filter(h => Storage.isCompleted(h.id, dateStr));
                const completedCount = dayLogs.length;
                const totalHabitsCount = habits.length || 1;
                const pct = Math.round((completedCount / totalHabitsCount) * 100);

                if (completedCount > 0) totalActiveDays++;
                if (pct === 100) perfectDays++;
                totalCompletions += completedCount;

                const bgGlow = pct >= 80 ? 'rgba(132, 204, 22, 0.15)' : pct > 0 ? 'rgba(132, 204, 22, 0.06)' : '#141417';
                const borderColor = isToday ? 'var(--primary-bright)' : pct >= 80 ? 'rgba(132, 204, 22, 0.3)' : '#27272a';

                html += `
                    <div onclick="window.inspectDay('${dateStr}')" style="min-height: 85px; background: ${bgGlow}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 13px; font-weight: 800; color: ${isToday ? 'var(--primary-bright)' : '#ffffff'};">${day}</span>
                            ${pct > 0 ? `<span style="font-size: 10px; font-weight: 700; color: var(--primary-bright);">${pct}%</span>` : ''}
                        </div>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px;">
                            ${dayLogs.slice(0, 4).map(h => `<span style="font-size: 11px;">${h.icon || '⚡'}</span>`).join('')}
                        </div>
                    </div>
                `;
            }

            grid.innerHTML = html;

            // Update stats bar
            const activeDaysEl = document.getElementById('cal-stat-active-days');
            const perfectDaysEl = document.getElementById('cal-stat-perfect-days');
            const consistencyEl = document.getElementById('cal-stat-consistency');
            const totalLoggedEl = document.getElementById('cal-stat-total-logged');

            if (activeDaysEl) activeDaysEl.textContent = `${totalActiveDays} / ${daysInMonth} Days`;
            if (perfectDaysEl) perfectDaysEl.textContent = `${perfectDays} Days`;
            if (consistencyEl) consistencyEl.textContent = `${Math.round((totalActiveDays / daysInMonth) * 100)}%`;
            if (totalLoggedEl) totalLoggedEl.textContent = `${totalCompletions}`;
        };

        window.inspectDay = (dateStr) => {
            const modal = document.getElementById('day-inspector-modal');
            if (!modal) return;

            const habits = Storage.getHabits().filter(h => !h.paused);
            const dayHabits = habits.filter(h => Storage.isCompleted(h.id, dateStr));
            const journal = Storage.getJournalForDate(dateStr);

            const badgeEl = document.getElementById('inspector-date-badge');
            const pctEl = document.getElementById('inspector-completion-pct');
            const scoreEl = document.getElementById('inspector-score-val');
            const listEl = document.getElementById('inspector-habits-list');
            const refText = document.getElementById('inspector-reflection-text');
            const moodBadge = document.getElementById('inspector-mood-badge');

            if (badgeEl) {
                const d = new Date(dateStr);
                badgeEl.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
            }

            const pct = Math.round((dayHabits.length / (habits.length || 1)) * 100);
            if (pctEl) pctEl.textContent = `${pct}% (${dayHabits.length}/${habits.length} Habits)`;
            if (scoreEl) scoreEl.textContent = `${Math.min(100, Math.round(pct * 0.9 + 10))} / 100`;

            if (listEl) {
                if (dayHabits.length === 0) {
                    listEl.innerHTML = `<p style="font-size: 13px; color: var(--text-tertiary);">No routines completed on this day.</p>`;
                } else {
                    listEl.innerHTML = dayHabits.map(h => `
                        <div style="display: flex; align-items: center; gap: 10px; background: #141417; border: 1px solid #27272a; padding: 8px 12px; border-radius: 8px;">
                            <span style="font-size: 16px;">${h.icon}</span>
                            <span style="font-size: 13px; font-weight: 600; color: #ffffff;">${h.name}</span>
                            <span class="badge badge-lime" style="margin-left: auto; font-size: 10px;">✓ Done</span>
                        </div>
                    `).join('');
                }
            }

            if (journal) {
                if (moodBadge) moodBadge.textContent = journal.mood ? `😄 ${journal.mood}` : '😄 Focused';
                if (refText) {
                    const text = (journal.morning_reflection && journal.morning_reflection.accomplish) || (journal.evening_reflection && journal.evening_reflection.accomplishments) || journal.notes || 'No notes logged for this day.';
                    refText.textContent = text;
                }
            } else {
                if (moodBadge) moodBadge.textContent = 'Neutral';
                if (refText) refText.textContent = 'No reflection entry recorded on this date.';
            }

            modal.style.display = 'flex';
        };

        window.closeDayInspector = () => {
            const modal = document.getElementById('day-inspector-modal');
            if (modal) modal.style.display = 'none';
        };

        // ═══════════════════════════════════════════════════════
        // 5. GOALS VIEW CONTROLLER
        // ═══════════════════════════════════════════════════════
        window.currentGoalFilter = 'all';

        window.filterGoalsList = (cat, btn) => {
            window.currentGoalFilter = cat;
            const container = document.getElementById('goal-category-filters');
            if (container) {
                container.querySelectorAll('button').forEach(b => {
                    b.style.background = '#18181b';
                    b.style.color = 'var(--text-secondary)';
                    b.style.borderColor = '#27272a';
                });
                if (btn) {
                    btn.style.background = 'rgba(132, 204, 22, 0.12)';
                    btn.style.color = 'var(--primary-bright)';
                    btn.style.borderColor = 'rgba(132, 204, 22, 0.3)';
                }
            }
            window.renderGoalsView();
        };

        window.renderGoalsView = () => {
            const container = document.getElementById('goals-list-container');
            if (!container) return;

            let goals = Storage.getGoals();

            // Stats Update
            const countEl = document.getElementById('goals-count-val');
            const msEl = document.getElementById('milestones-completed-val');
            const avgEl = document.getElementById('goals-avg-progress-val');

            const totalMilestones = goals.reduce((sum, g) => sum + (g.milestones ? g.milestones.length : 0), 0);
            const doneMilestones = goals.reduce((sum, g) => sum + (g.milestones ? g.milestones.filter(m => m.completed).length : 0), 0);
            const avgProg = goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length) : 0;

            if (countEl) countEl.textContent = `${goals.length} Strategic`;
            if (msEl) msEl.textContent = `${doneMilestones} / ${totalMilestones}`;
            if (avgEl) avgEl.textContent = `${avgProg}%`;

            if (window.currentGoalFilter && window.currentGoalFilter !== 'all') {
                goals = goals.filter(g => g.category === window.currentGoalFilter);
            }

            if (goals.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 48px 0; color: var(--text-tertiary);">
                        <p style="font-size: 15px;">No goals found in this category.</p>
                        <button onclick="window.openCreateGoalModal()" class="btn btn-primary btn-sm">+ Define New Goal</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = goals.map(g => {
                const milestones = g.milestones || [];
                const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

                return `
                    <div class="dailyos-card" style="padding: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                    <span class="badge badge-lime">${g.category}</span>
                                    <span style="font-size: 12px; color: var(--text-tertiary);">⏳ ${daysLeft} Days Remaining</span>
                                </div>
                                <h3 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0;">${g.title}</h3>
                            </div>
                            <button onclick="window.deleteGoal('${g.id}')" class="btn btn-ghost btn-sm" style="color: var(--text-muted);">🗑️</button>
                        </div>

                        <p style="font-size: 14px; color: var(--text-secondary); margin: 0 0 16px 0; line-height: 1.5;">${g.description || ''}</p>

                        <!-- Progress Bar -->
                        <div style="margin-bottom: 18px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 6px;">
                                <span style="color: var(--text-tertiary); text-transform: uppercase;">Execution Progress</span>
                                <span style="color: var(--primary-bright);">${g.progress || 0}%</span>
                            </div>
                            <div class="progress-track">
                                <div class="progress-fill" style="width: ${g.progress || 0}%;"></div>
                            </div>
                        </div>

                        <!-- Milestones Checklist -->
                        <div style="background: #141417; border: 1px solid #27272a; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px;">
                            <div style="font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 10px;">Actionable Milestones</div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${milestones.map(m => `
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <input type="checkbox" onchange="window.toggleGoalMilestone('${g.id}', '${m.id}')" ${m.completed ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer;" />
                                        <span style="font-size: 13px; color: ${m.completed ? 'var(--text-tertiary)' : '#ffffff'}; text-decoration: ${m.completed ? 'line-through' : 'none'}; font-weight: 500;">${m.title}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        };

        window.toggleGoalMilestone = (goalId, milestoneId) => {
            Storage.toggleMilestone(goalId, milestoneId);
            window.showNotification('Milestone updated', 'success');
            window.renderGoalsView();
        };

        window.openCreateGoalModal = () => {
            const overlay = document.getElementById('goal-modal-overlay');
            const titleInput = document.getElementById('goal-title-input');
            const descInput = document.getElementById('goal-desc-input');
            const builder = document.getElementById('goal-milestones-builder');
            if (titleInput) titleInput.value = '';
            if (descInput) descInput.value = '';
            if (builder) {
                builder.innerHTML = '';
                window.addGoalMilestoneInput('Milestone #1 target');
                window.addGoalMilestoneInput('Milestone #2 target');
            }
            if (overlay) overlay.style.display = 'flex';
        };

        window.closeGoalModal = () => {
            const overlay = document.getElementById('goal-modal-overlay');
            if (overlay) overlay.style.display = 'none';
        };

        window.addGoalMilestoneInput = (placeholder = 'New milestone target...') => {
            const builder = document.getElementById('goal-milestones-builder');
            if (!builder) return;
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.gap = '8px';
            div.innerHTML = `
                <input type="text" class="goal-ms-item form-control" placeholder="${placeholder}" style="padding: 6px 10px; font-size: 13px;" />
                <button type="button" onclick="this.parentElement.remove()" class="btn btn-ghost btn-sm" style="color: #ef4444;">✕</button>
            `;
            builder.appendChild(div);
        };

        window.saveGoal = () => {
            const title = document.getElementById('goal-title-input')?.value.trim();
            if (!title) {
                window.showNotification('Please enter a goal title', 'warning');
                return;
            }
            const description = document.getElementById('goal-desc-input')?.value.trim() || '';
            const category = document.getElementById('goal-category-input')?.value || 'Fitness';
            const deadline = document.getElementById('goal-deadline-input')?.value || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];

            const milestones = [];
            document.querySelectorAll('.goal-ms-item').forEach((input, i) => {
                const val = input.value.trim();
                if (val) {
                    milestones.push({ id: 'm-' + Date.now() + '-' + i, title: val, completed: false });
                }
            });

            Storage.addGoal({ title, description, category, deadline, milestones });
            window.showNotification('Strategic goal created! 🎯', 'success');
            window.closeGoalModal();
            window.renderGoalsView();
        };

        window.deleteGoal = (id) => {
            if (confirm('Delete this goal and its milestones?')) {
                Storage.deleteGoal(id);
                window.showNotification('Goal deleted', 'info');
                window.renderGoalsView();
            }
        };

        // ═══════════════════════════════════════════════════════
        // 6. ANALYTICS VIEW CONTROLLER
        // ═══════════════════════════════════════════════════════
        window.analyticsRangeDays = 7;

        window.toggleAnalyticsRange = (days) => {
            window.analyticsRangeDays = days;
            const btn7 = document.getElementById('range-btn-7');
            const btn30 = document.getElementById('range-btn-30');
            if (btn7 && btn30) {
                if (days === 7) {
                    btn7.style.background = 'rgba(132, 204, 22, 0.12)';
                    btn7.style.color = 'var(--primary-bright)';
                    btn7.style.borderColor = 'rgba(132, 204, 22, 0.3)';
                    btn30.style.background = '#18181b';
                    btn30.style.color = 'var(--text-primary)';
                    btn30.style.borderColor = '#27272a';
                } else {
                    btn30.style.background = 'rgba(132, 204, 22, 0.12)';
                    btn30.style.color = 'var(--primary-bright)';
                    btn30.style.borderColor = 'rgba(132, 204, 22, 0.3)';
                    btn7.style.background = '#18181b';
                    btn7.style.color = 'var(--text-primary)';
                    btn7.style.borderColor = '#27272a';
                }
            }
            window.renderAnalyticsView();
        };

        window.renderAnalyticsView = () => {
            const habits = Storage.getHabits().filter(h => !h.paused);
            const tasks = Storage.getTasks();

            // Calculate Metrics
            const currentStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
            const longestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || h.streak || 0), 0);
            const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

            const currStrEl = document.getElementById('analytics-current-streak');
            const longStrEl = document.getElementById('analytics-longest-streak');
            const tasksEl = document.getElementById('analytics-tasks-completed');

            if (currStrEl) currStrEl.textContent = `${currentStreak} Days`;
            if (longStrEl) longStrEl.textContent = `${longestStreak} Days`;
            if (tasksEl) tasksEl.textContent = `${completedTasksCount} Tasks`;

            window.renderAnalyticsTrendChart();
            window.renderAnalyticsCategoryBreakdown();
            window.renderAnalyticsDayOfWeekMatrix();
            window.renderAnalyticsLeaderboard();
        };

        window.renderAnalyticsTrendChart = () => {
            const container = document.getElementById('analytics-trend-chart-container');
            if (!container) return;

            const habits = Storage.getHabits().filter(h => !h.paused);
            const daysCount = window.analyticsRangeDays || 7;
            const points = [];

            for (let i = daysCount - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dStr = d.toISOString().split('T')[0];
                const done = habits.filter(h => Storage.isCompleted(h.id, dStr)).length;
                const pct = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;
                points.push({ date: d.toLocaleDateString('en-US', { weekday: 'narrow', month: 'numeric', day: 'numeric' }), pct });
            }

            const avgPct = Math.round(points.reduce((sum, p) => sum + p.pct, 0) / points.length);
            const avgBadge = document.getElementById('chart-avg-badge');
            if (avgBadge) avgBadge.textContent = `Avg: ${avgPct}%`;

            // Build SVG Chart
            const width = 800;
            const height = 180;
            const stepX = width / (points.length - 1 || 1);

            const pathCoords = points.map((p, idx) => {
                const x = idx * stepX;
                const y = height - (p.pct / 100) * (height - 30) - 15;
                return `${x},${y}`;
            });

            const polylineD = pathCoords.join(' ');
            const areaD = `0,${height} ${polylineD} ${width},${height}`;

            let dotsHtml = points.map((p, idx) => {
                const x = idx * stepX;
                const y = height - (p.pct / 100) * (height - 30) - 15;
                return `
                    <circle cx="${x}" cy="${y}" r="4" fill="#84cc16" stroke="#09090b" stroke-width="2" />
                    <text x="${x}" y="${y - 8}" fill="#a1a1aa" font-size="10" font-weight="700" text-anchor="middle">${p.pct}%</text>
                    <text x="${x}" y="${height - 2}" fill="#71717a" font-size="9" text-anchor="middle">${p.date}</text>
                `;
            }).join('');

            container.innerHTML = `
                <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;">
                    <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#84cc16" stop-opacity="0.3" />
                            <stop offset="100%" stop-color="#84cc16" stop-opacity="0.0" />
                        </linearGradient>
                    </defs>
                    <line x1="0" y1="${height - 20}" x2="${width}" y2="${height - 20}" stroke="#27272a" stroke-dasharray="4,4" />
                    <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="#27272a" stroke-dasharray="4,4" />
                    <polygon points="${areaD}" fill="url(#chartGrad)" />
                    <polyline points="${polylineD}" fill="none" stroke="#84cc16" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    ${dotsHtml}
                </svg>
            `;
        };

        window.renderAnalyticsCategoryBreakdown = () => {
            const container = document.getElementById('analytics-category-bars');
            if (!container) return;

            const habits = Storage.getHabits().filter(h => !h.paused);
            const categories = {};
            habits.forEach(h => {
                categories[h.category] = (categories[h.category] || 0) + 1;
            });

            container.innerHTML = Object.entries(categories).map(([cat, count]) => {
                const pct = Math.round((count / habits.length) * 100);
                return `
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 5px;">
                            <span style="color: #ffffff;">${cat}</span>
                            <span style="color: var(--primary-bright);">${count} Routines (${pct}%)</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${pct}%;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        };

        window.renderAnalyticsDayOfWeekMatrix = () => {
            const matrixEl = document.getElementById('analytics-dow-matrix');
            if (!matrixEl) return;

            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const scores = [92, 88, 95, 84, 90, 78, 85];

            matrixEl.innerHTML = days.map((day, idx) => `
                <div style="background: #141417; border: 1px solid #27272a; border-radius: 10px; padding: 12px 6px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--text-tertiary);">${day}</div>
                    <div style="font-size: 16px; font-weight: 900; color: var(--primary-bright); margin: 6px 0 2px 0;">${scores[idx]}%</div>
                    <div style="font-size: 9px; color: var(--text-muted);">Score</div>
                </div>
            `).join('');
        };

        window.renderAnalyticsLeaderboard = () => {
            const container = document.getElementById('analytics-leaderboard-container');
            if (!container) return;

            const habits = Storage.getHabits().slice().sort((a, b) => (b.streak || 0) - (a.streak || 0));

            container.innerHTML = habits.map((h, idx) => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #141417; border: 1px solid #27272a; padding: 12px 16px; border-radius: 10px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 14px; font-weight: 800; color: ${idx === 0 ? '#fbbf24' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#fb923c' : 'var(--text-tertiary)'}; min-width: 20px;">#${idx + 1}</span>
                        <span style="font-size: 18px;">${h.icon || '⚡'}</span>
                        <div>
                            <div style="font-size: 14px; font-weight: 700; color: #ffffff;">${h.name}</div>
                            <div style="font-size: 12px; color: var(--text-tertiary);">${h.category}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <span class="badge badge-orange">🔥 ${h.streak || 0}d streak</span>
                        <span class="badge badge-lime">🏆 Best: ${h.bestStreak || h.streak || 0}d</span>
                    </div>
                </div>
            `).join('');
        };

        // ═══════════════════════════════════════════════════════
        // 7. JOURNAL VIEW CONTROLLER
        // ═══════════════════════════════════════════════════════
        window.activeJournalMood = 'awesome';

        window.setJournalMood = (mood, btn) => {
            window.activeJournalMood = mood;
            const container = document.getElementById('journal-mood-selector');
            if (container) {
                container.querySelectorAll('button').forEach(b => {
                    b.style.background = '#18181b';
                    b.style.borderColor = '#27272a';
                    b.style.color = 'var(--text-primary)';
                });
                if (btn) {
                    btn.style.background = 'rgba(132, 204, 22, 0.15)';
                    btn.style.borderColor = 'rgba(132, 204, 22, 0.4)';
                    btn.style.color = 'var(--primary-bright)';
                }
            }
        };

        window.changeJournalDate = (delta) => {
            const input = document.getElementById('journal-date-input');
            if (input) {
                const d = new Date(input.value || new Date());
                d.setDate(d.getDate() + delta);
                input.value = d.toISOString().split('T')[0];
                window.loadJournalForDate(input.value);
            }
        };

        window.loadJournalForDate = (dateStr) => {
            const entry = Storage.getJournalForDate(dateStr);
            const mAcc = document.getElementById('journal-morning-accomplish');
            const mFeel = document.getElementById('journal-morning-feel');
            const mGrate = document.getElementById('journal-morning-grateful');
            const eAcc = document.getElementById('journal-evening-accomplishments');
            const eWent = document.getElementById('journal-evening-went-well');
            const eImp = document.getElementById('journal-evening-improvements');
            const notes = document.getElementById('journal-freeform-notes');

            if (entry) {
                if (mAcc) mAcc.value = entry.morning_reflection?.accomplish || '';
                if (mFeel) mFeel.value = entry.morning_reflection?.feel || '';
                if (mGrate) mGrate.value = entry.morning_reflection?.grateful || '';
                if (eAcc) eAcc.value = entry.evening_reflection?.accomplishments || '';
                if (eWent) eWent.value = entry.evening_reflection?.went_well || '';
                if (eImp) eImp.value = entry.evening_reflection?.improvements || '';
                if (notes) notes.value = entry.notes || '';
                if (entry.mood) window.setJournalMood(entry.mood);
            } else {
                if (mAcc) mAcc.value = '';
                if (mFeel) mFeel.value = '';
                if (mGrate) mGrate.value = '';
                if (eAcc) eAcc.value = '';
                if (eWent) eWent.value = '';
                if (eImp) eImp.value = '';
                if (notes) notes.value = '';
            }
        };

        window.saveCurrentJournal = () => {
            const dateInput = document.getElementById('journal-date-input');
            const dateStr = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];

            const morning = {
                accomplish: document.getElementById('journal-morning-accomplish')?.value || '',
                feel: document.getElementById('journal-morning-feel')?.value || '',
                grateful: document.getElementById('journal-morning-grateful')?.value || ''
            };

            const evening = {
                accomplishments: document.getElementById('journal-evening-accomplishments')?.value || '',
                went_well: document.getElementById('journal-evening-went-well')?.value || '',
                improvements: document.getElementById('journal-evening-improvements')?.value || ''
            };

            const notes = document.getElementById('journal-freeform-notes')?.value || '';

            Storage.saveJournal(dateStr, {
                mood: window.activeJournalMood || 'awesome',
                morning,
                evening,
                notes
            });

            window.showNotification('Journal reflection saved! ✍️', 'success');
            window.renderJournalHistoryFeed();
        };

        window.renderJournalHistoryFeed = () => {
            const container = document.getElementById('journal-history-container');
            if (!container) return;

            const journals = Storage.getJournals();
            if (journals.length === 0) {
                container.innerHTML = `<div style="text-align: center; padding: 24px 0; color: var(--text-tertiary);">No previous journal entries found.</div>`;
                return;
            }

            container.innerHTML = journals.slice().reverse().map(j => `
                <div style="background: #141417; border: 1px solid #27272a; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="badge badge-purple">${j.date}</span>
                        <span style="font-size: 13px;">😄 ${j.mood || 'Focused'}</span>
                    </div>
                    <p style="font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5;">${(j.morning_reflection && j.morning_reflection.accomplish) || (j.evening_reflection && j.evening_reflection.accomplishments) || j.notes || 'Recorded entry.'}</p>
                </div>
            `).join('');
        };

        // ═══════════════════════════════════════════════════════
        // 8. SETTINGS VIEW CONTROLLER
        // ═══════════════════════════════════════════════════════
        window.setAccentColor = (color) => {
            const colorMap = {
                'lime': '#84cc16',
                'cyan': '#06b6d4',
                'purple': '#a855f7',
                'amber': '#f59e0b',
                'rose': '#f43f5e'
            };
            const hex = colorMap[color] || '#84cc16';
            document.documentElement.style.setProperty('--primary', hex);
            document.documentElement.style.setProperty('--primary-bright', hex);
            Storage.updateProfile({ accentColor: color });
            window.showNotification(`Accent color updated to ${color}`, 'success');
        };

        window.saveSettingsForm = () => {
            const name = document.getElementById('settings-name')?.value || 'Alex Vance';
            const email = document.getElementById('settings-email')?.value || 'alex@dailyos.app';
            const role = document.getElementById('settings-role')?.value || 'Product Designer';
            const timezone = document.getElementById('settings-timezone')?.value || 'Asia/Kolkata';
            const weekStart = document.getElementById('settings-weekstart')?.value || 'Monday';

            Storage.updateProfile({ name, email, role, timezone, weekStart });
            window.showNotification('System settings saved successfully! ⚙️', 'success');
            window.syncSidebarProfile();
        };

        window.exportDailyOSData = () => {
            Storage.exportAllData();
            window.showNotification('Data exported as JSON file 📥', 'success');
        };

        window.importDailyOSData = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const success = Storage.importData(e.target.result);
                if (success) {
                    window.showNotification('Backup imported successfully! 🚀', 'success');
                    window.location.reload();
                } else {
                    window.showNotification('Failed to parse backup JSON', 'warning');
                }
            };
            reader.readAsText(file);
        };

        window.resetDailyOSDemoData = () => {
            if (confirm('Reset to the rich default DailyOS demo dataset?')) {
                Storage.resetToDefault();
                window.showNotification('Demo dataset reloaded!', 'success');
                window.location.reload();
            }
        };

        window.clearAllDailyOSData = () => {
            if (confirm('Are you sure you want to clear ALL user data? This cannot be undone.')) {
                localStorage.clear();
                window.showNotification('All data cleared', 'info');
                window.location.reload();
            }
        };

        window.syncSidebarProfile = () => {
            const user = Storage.getUser();
            const nameEl = document.getElementById('sidebar-name');
            const roleEl = document.getElementById('sidebar-role');
            const avatarEl = document.getElementById('sidebar-avatar');

            if (nameEl) nameEl.textContent = user.name || 'Alex Vance';
            if (roleEl) roleEl.textContent = user.role || 'Consistency: Elite';
            if (avatarEl) {
                const initials = (user.name || 'Alex Vance').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                avatarEl.textContent = initials;
            }
        };

        // ═══════════════════════════════════════════════════════
        // PAGE LOAD EVENT DISPATCHER
        // ═══════════════════════════════════════════════════════
        window.addEventListener('page-loaded', (e) => {
            const path = e.detail.path;
            window.syncSidebarProfile();

            if (path === '/dashboard' || path === '/today' || path === '/') {
                window.renderTodayDashboard();
            } else if (path === '/habits-library' || path === '/habits') {
                window.renderHabitsLibrary();
            } else if (path === '/timeline' || path === '/planner') {
                window.renderPlannerView();
            } else if (path === '/calendar') {
                window.renderCalendarView();
            } else if (path === '/goals') {
                window.renderGoalsView();
            } else if (path === '/analytics') {
                window.renderAnalyticsView();
            } else if (path === '/journal') {
                const dateInput = document.getElementById('journal-date-input');
                if (dateInput) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                    window.loadJournalForDate(dateInput.value);
                }
                window.renderJournalHistoryFeed();
            } else if (path === '/settings') {
                const user = Storage.getUser();
                const nameInput = document.getElementById('settings-name');
                const emailInput = document.getElementById('settings-email');
                const roleInput = document.getElementById('settings-role');
                if (nameInput) nameInput.value = user.name || '';
                if (emailInput) emailInput.value = user.email || '';
                if (roleInput) roleInput.value = user.role || '';
            }
        });

        // Initialize routing on first load
        const initialPath = window.location.pathname === '/' ? '/dashboard' : window.location.pathname;
        const token = localStorage.getItem('access_token');
        const protectedRoutes = ['/dashboard', '/today', '/habits-library', '/habits', '/timeline', '/planner', '/calendar', '/goals', '/analytics', '/journal', '/settings'];

        if (!token && protectedRoutes.includes(initialPath)) {
            // For convenience, if no token, user can still see dashboard demo or login
            this.router.handleRoute(initialPath);
        } else {
            this.router.handleRoute(initialPath);
        }
    }
}

export { App };
export default App;
