const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 500;

let pins = [];
let ball = null;
let rows = 8;
let risk = "low";

const gravity = 0.3;

document.getElementById("drop").onclick = () => {
    rows = parseInt(document.getElementById("rows").value);
    risk = document.getElementById("risk").value;

    createPins();
    createMultipliers();

    ball = {
        x: canvas.width / 2,
        y: 20,
        vx: 0,
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
                y: 80 + r * 35
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

function update() {
    if (ball) {
        ball.vy += gravity;
        ball.y += ball.vy;
        ball.x += ball.vx;

        pins.forEach(pin => {
            let dx = ball.x - pin.x;
            let dy = ball.y - pin.y;
            let dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 10) {
                ball.vx += (Math.random() - 0.5) * 4;
                ball.vy *= 0.5;
            }
        });

        if (ball.y > canvas.height - 30) {
            ball = null;
        }
    }
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // pins
    pins.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
        ctx.fillStyle = "white";
        ctx.fill();
    });

    // ball
    if (ball) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
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
