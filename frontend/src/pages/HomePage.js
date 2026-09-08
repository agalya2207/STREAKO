export class HomePage {
    static render() {
        return `
            <div class="page active" id="home-page">
                <div class="landing-page">
                    <h1 class="hero-headline">Build habits that fit your <span class="hero-highlight">real life.</span></h1>
                </div>
            </div>
        `;
    }

    static mount() {
        console.log('HomePage mounted');
    }
}

export default HomePage;
