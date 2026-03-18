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
let balls = []; // teraz kilka piłek
let rows = 10;
let risk = "medium";

let balance = 1000;
let bet = 10;
let multipliers = [];

const gravity = 0.35;
const friction = 0.998;
const bounce = 0.75;

// delta time (płynność)
let lastTime = 0;

// ==========================
// UI
// ==========================
const balanceEl = document.getElementById("balance");
const betInput = document.getElementById("bet");
const resultEl = document.getElementById("result"); // nowy element na wyniki

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
// RESULT
// ==========================
function getSlotIndex(x) {
    const slotWidth = canvas.width / multipliers.length;
    return Math.floor(x / slotWidth);
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

        // trail
        ball.trail.push({x: ball.x, y: ball.y});
        if (ball.trail.length > 25) ball.trail.shift();

        // koniec piłki
        if (ball.y > canvas.height - 20) {
            const index = getSlotIndex(ball.x);
            const multiplier = multipliers[index] || 0;
            const win = bet * multiplier;
            balance += win;

            if (resultEl) resultEl.innerText += `Wygrana: ${win.toFixed(2)} $\n`;

            balls.splice(idx, 1);
        }
    });

    saveGame();
}

// ==========================
// DRAW
// ==========================
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

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

    if(balanceEl) balanceEl.innerText = `Balance: ${balance.toFixed(2)} $`;
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
// DROP BALL EVENT
// ==========================
function dropBall() {
    bet = parseFloat(betInput?.value || 10);

    const maxBalls = 3; // ile piłek puszczamy naraz
    if(balance < bet * maxBalls){
        alert("Brak kasy na tyle piłek!");
        return;
    }

    balance -= bet * maxBalls;

    rows = parseInt(document.getElementById("rows").value);
    risk = document.getElementById("risk").value;

    createPins();
    createMultipliers();

    balls = [];
    for(let i=0; i<maxBalls; i++){
        balls.push(createBall());
    }

    if(resultEl) resultEl.innerText = "";
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
