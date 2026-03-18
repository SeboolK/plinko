let money = 0;
let clickPower = 1;
let autoIncome = 0;

let costClick = 10;
let costAuto = 25;

const moneyDisplay = document.getElementById("money");
const clickBtn = document.getElementById("clickBtn");

const upgradeClick = document.getElementById("upgradeClick");
const upgradeAuto = document.getElementById("upgradeAuto");

const costClickDisplay = document.getElementById("costClick");
const costAutoDisplay = document.getElementById("costAuto");

function updateUI() {
    moneyDisplay.innerText = money + " $";
    costClickDisplay.innerText = costClick;
    costAutoDisplay.innerText = costAuto;
}

function createFloatingText(x, y, value) {
    const text = document.createElement("div");
    text.classList.add("float");
    text.innerText = "+" + value;

    text.style.left = x + "px";
    text.style.top = y + "px";

    document.body.appendChild(text);

    setTimeout(() => text.remove(), 1000);
}

clickBtn.addEventListener("click", (e) => {
    money += clickPower;
    updateUI();

    createFloatingText(e.clientX, e.clientY, clickPower);
});

upgradeClick.addEventListener("click", () => {
    if (money >= costClick) {
        money -= costClick;
        clickPower++;
        costClick = Math.floor(costClick * 1.5);
        updateUI();
    }
});

upgradeAuto.addEventListener("click", () => {
    if (money >= costAuto) {
        money -= costAuto;
        autoIncome++;
        costAuto = Math.floor(costAuto * 1.7);
        updateUI();
    }
});

setInterval(() => {
    money += autoIncome;
    updateUI();
}, 1000);

updateUI();
