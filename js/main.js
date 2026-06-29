// عناصر صفحه
const loading = document.getElementById("loading");
const game = document.getElementById("game");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// تنظیم اندازه Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// پایان بارگذاری
setTimeout(() => {
    loading.style.display = "none";
    game.style.display = "block";

    drawMap();
}, 1200);

// رسم اولین نقشه
function drawMap() {

    // آسمان
    ctx.fillStyle = "#4fa8ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // زمین
    ctx.fillStyle = "#3fa34d";
    ctx.fillRect(0, canvas.height - 120, canvas.width, 120);

    // عنوان
    ctx.fillStyle = "white";
    ctx.font = "bold 40px Tahoma";
    ctx.textAlign = "center";
    ctx.fillText("قلمروستان", canvas.width / 2, 80);

}
