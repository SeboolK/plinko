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

const RTP = 0.95; // 🔥 TU DODAJ

const gravity = 0.2;
const friction = 0.995;
const bounce = 0.6;
      // 🔥 mniej odbicia

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
// MULTIPLIERS
// ==========================
function getMultipliers() {
    let size = rows + 1;
    let center = (size - 1) / 2;

    if (risk === "low") {
        return Array.from({length: size}, (_, i) => {
            let dist = Math.abs(i - center);
            return (0.8 + dist * 0.1).toFixed(2); // 🔥 środek < 1
        });
    }

    if (risk === "medium") {
        return Array.from({length: size}, (_, i) => {
            let dist = Math.abs(i - center);
            return (0.6 + dist * 0.5).toFixed(2); // 🔥 środek ~0.6x
        });
    }

    // high risk
    return Array.from({length: size}, (_, i) => {
        let dist = Math.abs(i - center);
        return (0.4 + dist * 1.4).toFixed(2); // 🔥 środek ~0.4x
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



function getRandomSlot() {
    const weights = multipliers.map(m => {
        const val = parseFloat(m);
        return (1 / val) * (1 / RTP);
    });

    const sum = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * sum;

    for (let i = 0; i < weights.length; i++) {
        if (rand < weights[i]) return i;
        rand -= weights[i];
    }

    return 0;
}





function createBall(targetIndex) {

    const bottomWidth = canvas.width - 40;
    const startX = (canvas.width - bottomWidth) / 2;
    const slotWidth = bottomWidth / multipliers.length;

    const targetX = startX + targetIndex * slotWidth + slotWidth / 2;

    return {
        x: canvas.width / 2,
        y: 20,
        vx: (targetX - canvas.width / 2) * 0.02,
        vy: 0,
        radius: 7,
        targetX: targetX,
        trail: []
    };
}


// ==========================
// COLLISION + EFFECT
// ==========================
function resolveCollision(ball, pin) {
    let dx = ball.x - pin.x;
    let dy = ball.y - pin.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    let minDist = ball.radius + pin.radius;

    if (dist < minDist) {

        // 🔥 HIT FLASH
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, 8, 0, Math.PI*2);
        ctx.fillStyle = "rgba(0,255,200,0.3)";
        ctx.fill();

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

        // 🔥 większy random
        ball.vx += (Math.random() - 0.5) * 0.1;
    }
}

// ==========================
// SLOT INDEX
// ==========================
function getSlotIndex(x) {
    const count = multipliers.length;

    const bottomWidth = canvas.width - 40;
    const startX = (canvas.width - bottomWidth) / 2;
    const slotWidth = bottomWidth / count;

    let index = Math.floor((x - startX) / slotWidth);

    if (index < 0) index = 0;
    if (index >= count) index = count - 1;

    return index;
}



// ==========================
// UPDATE
// ==========================
function update(delta) {
    balls.forEach((ball, idx) => {

        ball.vy += gravity * delta;
        ball.vy *= 0.99;
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;

        ball.vx *= friction;

        pins.forEach(pin => resolveCollision(ball, pin));

        let dx = ball.targetX - ball.x;
        ball.vx += dx * 0.0005;

        clampBallToTriangle(ball);


        // ściany
        if (ball.x < ball.radius) {
            ball.x = ball.radius;
            ball.vx *= -bounce;
        }

        if (ball.x > canvas.width - ball.radius) {
            ball.x = canvas.width - ball.radius;
            ball.vx *= -bounce;
        }

        // dół
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

            resultEl.innerText = `+${win.toFixed(2)} $`;
            resultEl.style.opacity = 1;

            setTimeout(() => {
                resultEl.style.opacity = 0.5;
            }, 800);

            balls.splice(idx, 1);
        }
    });

    saveGame();
}




function clampBallToTriangle(ball) {

    const topY = 20;
    const bottomY = canvas.height - 20;

    const progress = (ball.y - topY) / (bottomY - topY);
    const t = Math.max(0, Math.min(1, progress));

    const centerX = canvas.width / 2;
    const halfWidth = (canvas.width / 2 - 20) * t;

    const left = centerX - halfWidth;
    const right = centerX + halfWidth;

    if (ball.x < left) {
        ball.x = left;
        ball.vx = Math.abs(ball.vx) * 0.6;
    }

    if (ball.x > right) {
        ball.x = right;
        ball.vx = -Math.abs(ball.vx) * 0.6;
    }
}







// ==========================
// DRAW SLOTY (🔥 KOLORY)
// ==========================
function drawSlots() {
    const count = multipliers.length;

    const topY = 20;
    const bottomY = canvas.height - 25;

    // szerokość trójkąta na dole
    const bottomWidth = canvas.width - 40;
    const startX = (canvas.width - bottomWidth) / 2;

    const slotWidth = bottomWidth / count;

    multipliers.forEach((m, i) => {
        let x = startX + i * slotWidth;
        let value = parseFloat(m);

        let color = "#00ff99";
        if (value >= 3) color = "#ff0055";
        else if (value >= 2) color = "#ff9900";
        else if (value >= 1.5) color = "#00ccff";

        // tło slotu
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(x, bottomY, slotWidth, 25);
        ctx.globalAlpha = 1;

        // tekst
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(m + "x", x + slotWidth / 2, bottomY + 17);
    });
}


// ==========================
// DRAW
// ==========================
function draw() {

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 🔥 global glow
    ctx.shadowColor = "#00ffcc";
    ctx.shadowBlur = 20;

    // pins
    pins.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    });

    ctx.shadowBlur = 0;

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

    balanceEl.innerText = `💰 ${balance.toFixed(2)} $`;
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
    bet = parseFloat(betInput.value || 10);

    if (balance < bet) return;

    balance -= bet;

    const target = getRandomSlot(); // 🔥 LOSOWANIE
    balls.push(createBall(target));
}



document.getElementById("drop").onclick = dropBall;
canvas.addEventListener("touchstart", dropBall);





const riskSelect = document.getElementById("risk");
const rowsSelect = document.getElementById("rows");

// zmiana risk
riskSelect.addEventListener("change", () => {
    risk = riskSelect.value;

    createMultipliers(); // 🔥 odśwież mnożniki
});

// zmiana rows
rowsSelect.addEventListener("change", () => {
    rows = parseInt(rowsSelect.value);

    createPins();         // 🔥 nowa plansza
    createMultipliers();  // 🔥 nowe sloty
});

// ==========================
// INIT
// ==========================
loadGame();
createPins();
createMultipliers();
loop();








const cookieBanner = document.getElementById("cookieBanner");
const acceptBtn = document.getElementById("acceptCookies");
const declineBtn = document.getElementById("declineCookies");

// sprawdź czy użytkownik już wybrał
if (!localStorage.getItem("cookies_choice")) {
    cookieBanner.style.display = "block";
}

// akceptacja
acceptBtn.onclick = () => {
    localStorage.setItem("cookies_choice", "accepted");
    cookieBanner.style.display = "none";

    // 🔥 tutaj możesz odpalić np. Google Analytics / Ads
    console.log("Cookies accepted");
};

// odrzucenie
declineBtn.onclick = () => {
    localStorage.setItem("cookies_choice", "declined");
    cookieBanner.style.display = "none";

    console.log("Cookies declined");
};
