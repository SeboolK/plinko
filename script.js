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
let ball = null;
let rows = 10;
let risk = "medium";

let balance = 1000;
let bet = 10;
let multipliers = [];

const gravity = 0.25;
const friction = 0.995;
const bounce = 0.6;

// trail
let trail = [];

// ==========================
// UI ELEMENTS
// ==========================
const balanceEl = document.getElementById("balance");
const betInput = document.getElementById("bet");

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
// MULTIPLIERS
// ==========================
function getMultipliers() {
    if (risk === "low") return [2,1.5,1.2,1,0.8,1,1.2,1.5,2];
    if (risk === "medium") return [5,2,1.5,1,0.5,1,1.5,2,5];
    return [22,5,2,1.4,0.4,1.4,2,5,22];
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
        canvas.width / 2 - 20,
        canvas.width / 2 + 20
    ];

    const startX = startPositions[Math.floor(Math.random() * startPositions.length)];

    return {
        x: startX,
        y: 20,
        vx: 0,
        vy: 0,
        radius: 6
    };
}

// ==========================
// COLLISION
// ==========================
function resolveCollision(ball, pin) {
    let dx = ball.x - pin.x;
    let dy = ball.y - pin.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

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

        ball.vx += (Math.random() - 0.5) * 0.05;
    }
}

// ==========================
// RESULT
// ==========================
function getSlotIndex(x) {
    const slotWidth = canvas.width / multipliers.length;
    return Math.floor(x / slotWidth);
}

function handleResult() {
    let index = getSlotIndex(ball.x);
    let multiplier = multipliers[index] || 0;

    let win = bet * multiplier;
    balance += win;

    saveGame();

    alert("Wygrałeś: " + win.toFixed(2) + " $");
}

// ==========================
// UPDATE
// ==========================
function update() {
    if (!ball) return;

    ball.vy += gravity;

    ball.x += ball.vx;
    ball.y += ball.vy;

    ball.vx *= friction;

    pins.forEach(pin => {
        resolveCollision(ball, pin);
    });

    if (ball.x < ball.radius) {
        ball.x = ball.radius;
        ball.vx *= -bounce;
    }

    if (ball.x > canvas.width - ball.radius) {
        ball.x = canvas.width - ball.radius;
        ball.vx *= -bounce;
    }

    ball.vx *= 0.98;

    // trail
    trail.push({x: ball.x, y: ball.y});
    if (trail.length > 20) trail.shift();

    if (ball.y > canvas.height - 20) {
        handleResult();
        ball = null;
        trail = [];
    }
}

// ==========================
// DRAW
// ==========================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // pins
    pins.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
    });

    // trail
    trail.forEach((t, i) => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,255,150," + (i / trail.length) + ")";
        ctx.fill();
    });

    // ball
    if (ball) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#00ff99";
        ctx.fill();
    }

    // balance UI
    if (balanceEl) {
        balanceEl.innerText = "Balance: " + balance.toFixed(2) + " $";
    }
}

// ==========================
// LOOP
// ==========================
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// ==========================
// EVENTS
// ==========================
document.getElementById("drop").onclick = () => {
    bet = parseFloat(betInput?.value || 10);

    if (balance < bet) {
        alert("Brak kasy!");
        return;
    }

    balance -= bet;

    rows = parseInt(document.getElementById("rows").value);
    risk = document.getElementById("risk").value;

    createPins();
    createMultipliers();

    ball = createBall();
};

// ==========================
// INIT
// ==========================
loadGame();
createPins();
createMultipliers();
loop();
