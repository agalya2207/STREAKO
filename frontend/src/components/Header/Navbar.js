export class NavbarComponent {
    static init() {
        console.log('Navbar component initialized');
    }

    static render() {
        return `
            <header class="header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="menu-toggle" id="sidebarToggle" aria-label="Toggle sidebar">
                            <span class="menu-icon"></span>
                        </button>
                    </div>
                </div>
            </header>
        `;
    }
}

export default NavbarComponent;
