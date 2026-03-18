const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 500;

let pins = [];
let ball = null;
let rows = 10;
let risk = "medium";

const gravity = 0.25;
const friction = 0.999;
const bounce = 0.6;

document.getElementById("drop").onclick = () => {
    rows = parseInt(document.getElementById("rows").value);
    risk = document.getElementById("risk").value;

    createPins();
    createMultipliers();

    ball = {
        x: canvas.width / 2 + (Math.random() - 0.5) * 20,
        y: 20,
        vx: (Math.random() - 0.5) * 1,
        vy: 0,
        radius: 6
    };
};

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

function getMultipliers() {
    if (risk === "low") return [2,1.5,1.2,1,0.8,1,1.2,1.5,2];
    if (risk === "medium") return [5,2,1.5,1,0.5,1,1.5,2,5];
    return [22,5,2,1.4,0.4,1.4,2,5,22];
}

function createMultipliers() {
    const container = document.getElementById("multipliers");
    container.innerHTML = "";

    let mults = getMultipliers();

    mults.forEach(m => {
        let div = document.createElement("div");
        div.classList.add("multi");
        div.innerText = m + "x";
        container.appendChild(div);
    });
}

// 🔥 LEPSZA FIZYKA
function resolveCollision(ball, pin) {
    let dx = ball.x - pin.x;
    let dy = ball.y - pin.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    let minDist = ball.radius + pin.radius;

    if (dist < minDist) {
        // normal vector
        let nx = dx / dist;
        let ny = dy / dist;

        // push ball out
        let overlap = minDist - dist;
        ball.x += nx * overlap;
        ball.y += ny * overlap;

        // velocity dot normal
        let dot = ball.vx * nx + ball.vy * ny;

        // reflect velocity
        ball.vx -= 2 * dot * nx;
        ball.vy -= 2 * dot * ny;

        // energy loss
        ball.vx *= bounce;
        ball.vy *= bounce;

        // slight randomness (natural feel)
        ball.vx += (Math.random() - 0.5) * 0.2;
    }
}

function update() {
    if (!ball) return;

    // gravity
    ball.vy += gravity;

    // movement
    ball.x += ball.vx;
    ball.y += ball.vy;

    // friction
    ball.vx *= friction;

    // collisions with pins
    pins.forEach(pin => {
        resolveCollision(ball, pin);
    });

    // walls
    if (ball.x < ball.radius) {
        ball.x = ball.radius;
        ball.vx *= -bounce;
    }
    if (ball.x > canvas.width - ball.radius) {
        ball.x = canvas.width - ball.radius;
        ball.vx *= -bounce;
    }

    // bottom (landing)
    if (ball.y > canvas.height - 20) {
        ball = null;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // pins
    pins.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
    });

    // ball glow
    if (ball) {
        let gradient = ctx.createRadialGradient(
            ball.x, ball.y, 0,
            ball.x, ball.y, 20
        );
        gradient.addColorStop(0, "#00ff99");
        gradient.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#00ff99";
        ctx.fill();
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

createPins();
createMultipliers();
loop();
