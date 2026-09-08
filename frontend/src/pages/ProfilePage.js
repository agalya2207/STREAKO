export class ProfilePage {
    static render(user = {}) {
        return `
            <div class="page active" id="profile-page">
                <div class="settings-container">
                    <h2>Your Profile</h2>
                    <p>Email: ${user.email || 'user@example.com'}</p>
                </div>
            </div>
        `;
    }

    static mount() {
        console.log('ProfilePage mounted');
    }
}

export default ProfilePage;
