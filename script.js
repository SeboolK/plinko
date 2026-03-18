// ==========================
// SETUP
// ==========================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    const size = Math.min(window.innerWidth - 20, 500);
    canvas.width = size;
    canvas.height = size * 1.2;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ==========================
// GAME STATE
// ==========================
let pins = [];
let balls = [];
let rows = 10;
let risk = "medium";

let balance = 1000;
let bet = 10;
let multipliers = [];

const gravity = 0.35;
const friction = 0.998;
const bounce = 0.75;

let lastTime = 0;

// ==========================
// UI
// ==========================
const balanceEl = document.getElementById("balance");
const betInput = document.getElementById("bet");
const resultEl = document.getElementById("result");

// ==========================
// SAVE / LOAD
// ==========================
function saveGame() {
    localStorage.setItem("plinko_balance", balance);
}

function loadGame() {
    const saved = localStorage.getItem("plinko_balance");
    if (saved) balance = parseFloat(saved);
}

// ==========================
// MULTIPLIERS (FIX)
// ==========================
function getMultipliers() {
    let size = rows + 1;

    if (risk === "low") {
        return Array.from({length: size}, (_, i) => {
            let center = (size - 1) / 2;
            let dist = Math.abs(i - center);
            return (1.2 - dist * 0.1).toFixed(2);
        });
    }

    if (risk === "medium") {
        return Array.from({length: size}, (_, i) => {
            let center = (size - 1) / 2;
            let dist = Math.abs(i - center);
            return (1 + dist * 0.4).toFixed(2);
        });
    }

    return Array.from({length: size}, (_, i) => {
        let center = (size - 1) / 2;
        let dist = Math.abs(i - center);
        return (1 + dist * 1.2).toFixed(2);
    });
}

function createMultipliers() {
    const container = document.getElementById("multipliers");
    container.innerHTML = "";

    multipliers = getMultipliers();

    multipliers.forEach(m => {
        let div = document.createElement("div");
        div.classList.add("multi");
        div.innerText = m + "x";
        container.appendChild(div);
    });
}

// ==========================
// PINS
// ==========================
function createPins() {
    pins = [];
    let spacing = canvas.width / (rows + 1);

    for (let r = 0; r < rows; r++) {
        for (let i = 0; i <= r; i++) {
            pins.push({
                x: canvas.width / 2 - (r * spacing)/2 + i * spacing,
                y: 80 + r * 35,
                radius: 4
            });
        }
    }
}

// ==========================
// BALL
// ==========================
function createBall() {
    const startPositions = [
        canvas.width / 2,
        canvas.width / 2 - 25,
        canvas.width / 2 + 25
    ];

    const startX = startPositions[Math.floor(Math.random() * startPositions.length)];

    return {
        x: startX,
        y: 20,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0,
        radius: 7,
        trail: []
    };
}

// ==========================
// COLLISION
// ==========================
function resolveCollision(ball, pin) {
    let dx = ball.x - pin.x;
    let dy = ball.y - pin.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    let minDist = ball.radius + pin.radius;

    if (dist < minDist) {
        let nx = dx / dist;
        let ny = dy / dist;
        let overlap = minDist - dist;

        ball.x += nx * overlap;
        ball.y += ny * overlap;

        let dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 2 * dot * nx;
        ball.vy -= 2 * dot * ny;

        ball.vx *= bounce;
        ball.vy *= bounce;

        ball.vx += (Math.random() - 0.5) * 0.03;
    }
}

// ==========================
// SLOT INDEX (FIX)
// ==========================
function getSlotIndex(x) {
    const slotWidth = canvas.width / multipliers.length;
    let index = Math.floor(x / slotWidth);

    if (index < 0) index = 0;
    if (index >= multipliers.length) index = multipliers.length - 1;

    return index;
}

// ==========================
// UPDATE
// ==========================
function update(delta) {
    balls.forEach((ball, idx) => {

        ball.vy += gravity * delta;
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;

        ball.vx *= friction;

        pins.forEach(pin => resolveCollision(ball, pin));

        // ściany
        if (ball.x < ball.radius) {
            ball.x = ball.radius;
            ball.vx *= -bounce;
        }

        if (ball.x > canvas.width - ball.radius) {
            ball.x = canvas.width - ball.radius;
            ball.vx *= -bounce;
        }

        // sufit
        if (ball.y < ball.radius) {
            ball.y = ball.radius;
            ball.vy = 0;
        }

        // dół (blokada)
        if (ball.y > canvas.height - ball.radius) {
            ball.y = canvas.height - ball.radius;
        }

        // trail
        ball.trail.push({x: ball.x, y: ball.y});
        if (ball.trail.length > 25) ball.trail.shift();

        // koniec
        if (ball.y >= canvas.height - 25) {
            const index = getSlotIndex(ball.x);
            const multiplier = multipliers[index] || 0;

            const win = bet * multiplier;
            balance += win;

            if (resultEl) {
                resultEl.innerText = `+${win.toFixed(2)} $`;
                resultEl.style.opacity = 1;

                setTimeout(() => {
                    resultEl.style.opacity = 0.5;
                }, 800);
            }

            balls.splice(idx, 1);
        }
    });

    saveGame();
}

// ==========================
// DRAW SLOTY
// ==========================
function drawSlots() {
    const slotWidth = canvas.width / multipliers.length;

    multipliers.forEach((m, i) => {
        let x = i * slotWidth;

        ctx.fillStyle = "rgba(120,0,255,0.25)";
        ctx.fillRect(x, canvas.height - 30, slotWidth, 30);

        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(m + "x", x + slotWidth / 2, canvas.height - 10);
    });
}

// ==========================
// DRAW
// ==========================
function draw() {

    // tło (vibe)
    let bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#020617");
    bg.addColorStop(1, "#020617");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // pins
    pins.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#00ffcc";
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // balls
    balls.forEach(ball => {

        ball.trail.forEach((t,i) => {
            ctx.beginPath();
            ctx.arc(t.x, t.y, 3, 0, Math.PI*2);
            ctx.fillStyle = `rgba(0,255,150,${i/ball.trail.length})`;
            ctx.fill();
        });

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
        ctx.fillStyle = "#00ff99";
        ctx.shadowColor = "#00ff99";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    drawSlots();

    if(balanceEl) {
        balanceEl.innerText = `💰 ${balance.toFixed(2)} $`;
    }
}

// ==========================
// LOOP
// ==========================
function loop(time=0){
    let delta = (time - lastTime)/16;
    lastTime = time;

    update(delta);
    draw();

    requestAnimationFrame(loop);
}

// ==========================
// DROP
// ==========================
function dropBall() {
    bet = parseFloat(betInput?.value || 10);

    const maxBalls = 3;

    if(balance < bet * maxBalls) return;

    balance -= bet * maxBalls;

    for(let i=0; i<maxBalls; i++){
        balls.push(createBall());
    }
}

document.getElementById("drop").onclick = dropBall;
canvas.addEventListener("touchstart", dropBall);

// ==========================
// INIT
// ==========================
loadGame();
createPins();
createMultipliers();
loop();
