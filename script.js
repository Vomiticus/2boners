/* --- CLOCK --- */
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    document.getElementById('clock').textContent = timeString;
}

/* --- COIN FLIP --- */
const coin = document.getElementById('coin');
const coinShadow = document.getElementById('coin-shadow');
const coinContainer = document.getElementById('coin-container');

let rotation = 0;
let flipping = false;

function rand(min, max) { return min + Math.random() * (max - min); }

function easeOutBack(t, strength) {
    const c1 = strength;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function flipCoin() {
    if (flipping) return;
    flipping = true;

    const sound = new Audio('coin.ogg');
    sound.volume = 0.5;
    sound.play().catch(e => console.log("Audio file missing or blocked"));

    const duration = 1800;
    const spinFraction = 0.96;
    const start = performance.now();
    const isHeads = Math.random() < 0.5;
    const spins = Math.round(rand(6, 10));
    const targetMod = isHeads ? 0 : 180;
    const currentMod = rotation % 360;
    let adjustment = targetMod - currentMod;
    if (adjustment < 0) adjustment += 360;
    const totalSpin = spins * 360 + adjustment;
    const startRotation = rotation;
    const wobble = 10;
    const maxScale = 1.7;
    const arcHeight = 90;

    const spinDuration = duration * spinFraction;
    const constantSpeed = totalSpin / spinDuration;

    function frame(now) {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        const height = Math.sin(t * Math.PI) * arcHeight;
        let spinAmount;
        if (elapsed < spinDuration) {
            spinAmount = startRotation + constantSpeed * elapsed;
        } else {
            const settleT = Math.min((elapsed - spinDuration) / (duration - spinDuration), 1);
            const overshoot = wobble * (1 - easeOutBack(settleT, 1.8));
            spinAmount = startRotation + totalSpin + overshoot;
        }
        const scale = 1 + Math.sin(t * Math.PI) * (maxScale - 1);
        coin.style.transform = `translateY(${-height}px) scale(${scale}) rotateX(${spinAmount}deg)`;
        const shadowScale = 1 - Math.sin(t * Math.PI) * 0.55;
        const shadowOpacity = 0.35 - Math.sin(t * Math.PI) * 0.22;
        coinShadow.style.transform = `scaleX(${shadowScale})`;
        coinShadow.style.opacity = shadowOpacity;

        if (t < 1) {
            requestAnimationFrame(frame);
        } else {
            rotation = (startRotation + totalSpin) % 360;
            flipping = false;
        }
    }
    requestAnimationFrame(frame);
}

coinContainer.addEventListener('click', flipCoin);
coinContainer.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        flipCoin();
    }
});

/* --- JELLYFIN PINGER --- */
const jellyfinUrl = 'http://192.168.1.23:8096';
let consecutiveFailures = 0;

async function checkJellyfin() {
    const statusDot = document.getElementById('jellyfin-status');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        await fetch(jellyfinUrl + '/web/index.html', {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        consecutiveFailures = 0;
        statusDot.className = "status-dot status-online";

    } catch (error) {
        consecutiveFailures++;
        if (consecutiveFailures >= 2) {
            statusDot.className = "status-dot status-offline";
        }
    }
}

/* --- BOUNCING LOGO --- */
class HDBCLogo {
    constructor() {
        this.logo = document.getElementById('hdb-logo');
        this.width = this.logo.offsetWidth;
        this.height = this.logo.offsetHeight;
        this.x = Math.random() * (window.innerWidth - this.width);
        this.y = Math.random() * (window.innerHeight - this.height);
        this.vx = (Math.random() > 0.5 ? 1 : -1) * 2.5;
        this.vy = (Math.random() > 0.5 ? 1 : -1) * 2.5;
        this.hues = [0, 45, 90, 135, 180, 225, 270, 315];
        this.currentHueIndex = Math.floor(Math.random() * this.hues.length);
        this.updateColor();
        this.animate();
    }

    updateColor() {
        const hue = this.hues[this.currentHueIndex];
        this.logo.style.filter = `sepia(1) saturate(6) hue-rotate(${hue}deg) brightness(0.95)`;
    }

    animate() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x <= 0 || this.x + this.width >= window.innerWidth) {
            this.vx = -this.vx;
            this.changeColor();
            this.x = this.x <= 0 ? 0 : window.innerWidth - this.width;
        }

        if (this.y <= 0 || this.y + this.height >= window.innerHeight) {
            this.vy = -this.vy;
            this.changeColor();
            this.y = this.y <= 0 ? 0 : window.innerHeight - this.height;
        }

        this.logo.style.left = `${this.x}px`;
        this.logo.style.top = `${this.y}px`;
        requestAnimationFrame(() => this.animate());
    }

    changeColor() {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * this.hues.length); }
        while (newIndex === this.currentHueIndex && this.hues.length > 1);
        this.currentHueIndex = newIndex;
        this.updateColor();
    }

    handleResize() {
        this.width = this.logo.offsetWidth;
        this.height = this.logo.offsetHeight;
        if (this.x > window.innerWidth - this.width) this.x = window.innerWidth - this.width - 10;
        if (this.y > window.innerHeight - this.height) this.y = window.innerHeight - this.height - 10;
    }
}

let hdbLogo;
function initHDBCLogo() { hdbLogo = new HDBCLogo(); }

window.addEventListener('load', () => {
    updateClock();
    checkJellyfin();
    const logoImg = document.getElementById('hdb-logo');
    if (logoImg.complete) { initHDBCLogo(); } else { logoImg.onload = initHDBCLogo; }
});

window.addEventListener('resize', () => { if (hdbLogo) hdbLogo.handleResize(); });
setInterval(updateClock, 1000);
setInterval(checkJellyfin, 30000);
