export class HabitCard {
    static render(habit) {
        return `
            <div class="habit-card" data-id="${habit.id}">
                <div class="habit-header">
                    <h3 class="habit-title">${habit.title}</h3>
                    <span class="habit-streak-badge">🔥 ${habit.streak || 0}d</span>
                </div>
                <div class="habit-body">
                    <p class="habit-category">${habit.category || 'General'}</p>
                    <div class="habit-progress">
                        <div class="habit-progress-bar" style="width: ${Math.min(100, (habit.streak || 0) * 10)}%"></div>
                    </div>
                </div>
            </div>
        `;
    }
}

export default HabitCard;
