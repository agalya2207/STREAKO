import { Router } from './router.js';
import { state } from './state.js';
import { Storage } from './storage.js';

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

        window.markRecovered = () => {
            const card = document.getElementById('recovery-card');
            if (card) {
                card.innerHTML = '<div style="display: flex; gap: 16px; align-items: center;"><div style="font-size: 28px;">✅</div><div class="recovery-text"><strong>Streak Recovered!</strong> "Meditation" is back on track. Your Comeback Rate just went up.</div></div>';
                setTimeout(() => { card.style.display = 'none'; }, 2500);
            }
        };

        window.updateDashboardSubtitle = () => {
            const boxes = document.querySelectorAll('.priority-checkbox');
            const remaining = Array.from(boxes).filter(b => !b.checked).length;
            const subtitle = document.getElementById('dashboard-subtitle');
            if (subtitle) {
                const messages = {
                    3: "3 habits left today — you're closer than you think 🔥",
                    2: "2 habits left today — keep the momentum going 💪",
                    1: "1 habit left today — you're almost there ⚡",
                    0: "All done for today — perfect record! 🎉"
                };
                subtitle.textContent = messages[remaining] || messages[3];
            }
        };

        // Priorities State & Render Logic
        window.prioritiesData = [];
        window.isAddingPriority = false;

        window.renderPriorities = () => {
            const container = document.getElementById('priorities-container');
            if (!container) return;

            const maxPriorities = 3;
            const canAdd = window.prioritiesData.length < maxPriorities;

            let html = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="font-size: 18px; font-weight: 700; margin: 0; color: #ffffff;">Today's Top 3 Priorities</h3>
                    <button onclick="window.startAddingPriority()" style="background: transparent; font-size: 13px; font-weight: 600; padding: 6px 14px; border: 1px dashed rgba(255,255,255,0.3); color: #a0aec0; border-radius: 8px; cursor: pointer; transition: all 0.2s; ${(!canAdd || window.isAddingPriority) ? 'opacity: 0.3; pointer-events: none;' : ''}" onmouseover="this.style.color='#00D9FF'; this.style.borderColor='#00D9FF'" onmouseout="this.style.color='#a0aec0'; this.style.borderColor='rgba(255,255,255,0.3)'">+ Add Priority</button>
                </div>
            `;

            if (window.prioritiesData.length === 0 && !window.isAddingPriority) {
                html += `
                    <div style="text-align: center; padding: 40px 0;">
                        <p style="color: #a0aec0; font-size: 14px; margin-bottom: 16px;">Your day is clear. Add your Top 3 priorities.</p>
                        <button onclick="window.startAddingPriority()" style="background: rgba(0, 217, 255, 0.1); color: #00D9FF; border: 1px solid rgba(0, 217, 255, 0.3); padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(0, 217, 255, 0.2)'" onmouseout="this.style.background='rgba(0, 217, 255, 0.1)'">+ Create Top Priority</button>
                    </div>
                `;
            } else {
                html += `<div style="display: flex; flex-direction: column; gap: 12px;">`;
                window.prioritiesData.forEach((p, index) => {
                    html += `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 14px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s;">
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <span style="color: #a0aec0; font-weight: 700; font-size: 14px; min-width: 16px;">${index + 1}</span>
                                <input type="checkbox" onchange="window.togglePriority(${index})" ${p.completed ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #00D9FF; cursor: pointer;">
                                <span style="font-size: 15px; font-weight: 500; color: ${p.completed ? '#64748b' : '#fff'}; text-decoration: ${p.completed ? 'line-through' : 'none'}; transition: all 0.2s;">${p.text}</span>
                            </div>
                            <button onclick="window.deletePriority(${index})" style="background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 16px; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#64748b'">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    `;
                });

                if (window.isAddingPriority && canAdd) {
                    const nextIndex = window.prioritiesData.length + 1;
                    html += `
                        <div style="display: flex; align-items: center; gap: 16px; background: rgba(0, 217, 255, 0.05); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(0, 217, 255, 0.3);">
                            <span style="color: #00D9FF; font-weight: 700; font-size: 14px; min-width: 16px;">${nextIndex}</span>
                            <input type="checkbox" disabled style="width: 18px; height: 18px; opacity: 0.3;">
                            <input type="text" id="new-priority-input" placeholder="Describe priority..." style="flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 15px;" autocomplete="off">
                            <div style="display: flex; gap: 8px;">
                                <button onclick="window.cancelPriority()" style="background: transparent; border: 1px solid #64748b; color: #a0aec0; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">Cancel</button>
                                <button onclick="window.savePriority()" style="background: #00D9FF; border: none; color: #001428; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 700; transition: all 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Add</button>
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
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') window.savePriority();
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
            if (input && input.value.trim()) {
                window.prioritiesData.push({ text: input.value.trim(), completed: false });
                
                // Keep adding if we haven't hit 3 yet
                if (window.prioritiesData.length >= 3) {
                    window.isAddingPriority = false;
                } else {
                    window.isAddingPriority = true;
                }
                
                window.renderPriorities();
            }
        };

        window.deletePriority = (index) => {
            window.prioritiesData.splice(index, 1);
            window.renderPriorities();
        };

        window.togglePriority = (index) => {
            window.prioritiesData[index].completed = !window.prioritiesData[index].completed;
            window.renderPriorities();
        };

        // Habits Library State & Logic
        window.selectedIcon = '';
        window.selectedColor = '';
        window.selectedFrequency = 'Daily';
        window.selectedWeekdays = [];
        window.editingHabitId = null;

        window.seedHabits = () => {
            if (Storage && Storage.getHabits().length === 0) {
                const defaultHabits = [
                    { name: "Morning Workout", description: "30 min strength training every morning", category: "Fitness", dailyTarget: 1, icon: "💪", accentColor: "#ef4444", frequency: "Daily", streak: 12, bestStreak: 31, frequencyLabel: "Daily", paused: false },
                    { name: "Reading", description: "Read 20 pages daily", category: "Learning", dailyTarget: 1, icon: "📚", accentColor: "#3b82f6", frequency: "Daily", streak: 8, bestStreak: 18, frequencyLabel: "Daily", paused: false },
                    { name: "Meditation", description: "10 min mindfulness practice", category: "Mindfulness", dailyTarget: 1, icon: "🧘", accentColor: "#10b981", frequency: "Daily", streak: 5, bestStreak: 14, frequencyLabel: "Daily", paused: false },
                    { name: "Hydration", description: "Drink 8 glasses of water", category: "Health", dailyTarget: 1, icon: "💧", accentColor: "#0ea5e9", frequency: "Daily", streak: 21, bestStreak: 45, frequencyLabel: "Daily", paused: false },
                    { name: "Sleep 8 Hours", description: "Get quality sleep every night", category: "Health", dailyTarget: 1, icon: "🌙", accentColor: "#8b5cf6", frequency: "Daily", streak: 7, bestStreak: 22, frequencyLabel: "Daily", paused: false },
                    { name: "Journaling", description: "Write daily reflection (5-10 min)", category: "Personal", dailyTarget: 1, icon: "✍️", accentColor: "#f59e0b", frequency: "Daily", streak: 4, bestStreak: 12, frequencyLabel: "Daily", paused: false }
                ];
                defaultHabits.forEach(h => Storage.addHabit(h));
            }
        };

        window.openCreateHabitModal = () => {
            window.editingHabitId = null;
            document.querySelector('#habit-modal h2').textContent = 'Define New Routine';
            document.getElementById('create-habit-btn').textContent = 'Create Routine';
            const overlay = document.getElementById('habit-modal-overlay');
            if (overlay) overlay.style.display = 'flex';
        };

        window.closeHabitModal = () => {
            const overlay = document.getElementById('habit-modal-overlay');
            if (overlay) overlay.style.display = 'none';
            // Reset fields
            const nameEl = document.getElementById('habit-name');
            if(nameEl) nameEl.value = '';
            const descEl = document.getElementById('habit-desc');
            if(descEl) descEl.value = '';
            const catEl = document.getElementById('habit-category');
            if(catEl) catEl.selectedIndex = 0;
            const targetEl = document.getElementById('habit-target');
            if(targetEl) targetEl.value = 1;
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

            const startTime = document.getElementById('habit-start-time');
            const endTime = document.getElementById('habit-end-time');
            if (startTime && startTime.value) habit.startTime = startTime.value;
            if (endTime && endTime.value) habit.endTime = endTime.value;
            
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

        window.renderHabits = () => {
            const grid = document.querySelector('.habits-grid');
            if(!grid) return;
            grid.innerHTML = ''; // Clear current grid
            
            if (Storage && Storage.getHabits) {
                const habits = Storage.getHabits();
                habits.forEach(habit => window.addHabitCard(habit, grid));
            }
        };

        window.addHabitCard = (habit, gridElement) => {
            const card = document.createElement('div');
            card.className = 'habit-card';
            card.style.opacity = habit.paused ? '0.5' : '1';
            
            card.innerHTML = `
                <div class="habit-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="habit-icon" style="background:${habit.accentColor}; padding:8px; border-radius:6px;">${habit.icon}</div>
                    <div class="habit-actions">
                    <button class="habit-action-btn" onclick="window.pauseHabit('${habit.id}')">${habit.paused ? '▶️' : '⏸️'}</button>
                    <button class="habit-action-btn" onclick="window.editHabit('${habit.id}')">✏️</button>
                    <button class="habit-action-btn" onclick="window.promptDeleteHabit('${habit.id}')">🗑️</button>
                    </div>
                </div>
                <div class="habit-name" style="font-weight:700; margin-top:8px;">${habit.name} ${habit.paused ? '<span style="color:#ef4444; font-size:12px; margin-left:4px;">[PAUSED]</span>' : ''}</div>
                <div class="habit-desc" style="color:#a0aec0; font-size:14px; margin-top:4px;">${habit.description}</div>
                <hr style="margin:12px 0; border-color:#555;" />
                <div class="habit-stats" style="display:flex; gap:12px; font-size:14px;">
                    <div class="habit-stat"><strong>🔥 ${habit.streak || 0}</strong></div>
                    <div class="habit-stat"><strong>🏆 ${habit.bestStreak || 0}</strong></div>
                    <div class="habit-stat"><strong>📅 ${habit.frequencyLabel || 'Daily'}</strong></div>
                </div>
                ${habit.startTime && habit.endTime ? `<div style="font-size:13px; color:#a0aec0; margin-top:4px;">${habit.startTime} - ${habit.endTime}</div>` : ''}
                ${habit.frequency === 'Weekdays' && habit.weekdays && habit.weekdays.length ? `<div style="font-size:13px; color:#a0aec0; margin-top:4px;">Days: ${habit.weekdays.join(', ')}</div>` : ''}
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
            document.querySelector('#habit-modal h2').textContent = 'Edit Routine';
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
            
            const startTime = document.getElementById('habit-start-time');
            const endTime = document.getElementById('habit-end-time');
            if(startTime) startTime.value = habit.startTime || '';
            if(endTime) endTime.value = habit.endTime || '';

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

        window.renderDashboardHabits = () => {
            const container = document.getElementById('routine-checklist-container');
            if (!container || !Storage) return;
            
            const habits = Storage.getHabits().filter(h => !h.paused);
            container.innerHTML = '';
            
            if (habits.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 32px 0;">
                        <p style="color: #a0aec0; font-size: 14px; margin-bottom: 0;">No active routines for today.</p>
                    </div>
                `;
                return;
            }

            habits.forEach((habit, index) => {
                const today = new Date().toISOString().split('T')[0];
                const isCompleted = Storage.isCompleted(habit.id, today);
                
                const html = `
                    <div class="habit-card" style="border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px; border-radius: 8px; background: ${isCompleted ? 'rgba(0, 217, 255, 0.05)' : 'rgba(0, 0, 0, 0.2)'}; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s ease; opacity: ${isCompleted ? '0.5' : '1'}; border-color: ${isCompleted ? 'rgba(0, 217, 255, 0.2)' : 'rgba(255,255,255,0.1)'};">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <input type="checkbox" onchange="window.toggleHabitCompletion('${habit.id}')" ${isCompleted ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer; accent-color: #00D9FF;">
                            <div style="display: flex; flex-direction: column;">
                                <span class="habit-name" style="font-size: 15px; font-weight: 600; color: ${isCompleted ? '#a0aec0' : '#ffffff'}; text-decoration: ${isCompleted ? 'line-through' : 'none'}; transition: all 0.3s ease;">${habit.name}</span>
                                <span style="font-size: 13px; color: #a0aec0; margin-top: 4px;">${habit.icon} ${habit.category} • 🔥 ${habit.streak || 0} Streak</span>
                            </div>
                        </div>
                        <span style="font-size: 13px; color: #a0aec0; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; font-weight: 500;">Target: ${habit.dailyTarget || 1}x</span>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', html);
            });
        };

        window.toggleHabitCompletion = (id) => {
            if (!Storage) return;
            const today = new Date().toISOString().split('T')[0];
            if (Storage.isCompleted(id, today)) {
                Storage.unmarkCompleted(id, today);
            } else {
                Storage.markCompleted(id, today);
            }
            window.renderDashboardHabits();
            if (window.updateDashboardSubtitle) window.updateDashboardSubtitle();
        };

        // Page Load Event Listener
        window.addEventListener('page-loaded', (e) => {
            const path = e.detail.path;
            if (path === '/dashboard' || path === '/') {
                window.renderPriorities();
                window.renderDashboardHabits();
            }
            if (path === '/habits-library') {
                window.renderHabits();
            }
        });

        // Initialize default habits if needed
        window.seedHabits();

        // Trigger initial route match based on current path
        const currentPath = window.location.pathname === '/' ? '/landing' : window.location.pathname;
        this.router.handleRoute(currentPath);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
