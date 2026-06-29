// ================================
// قلمروستان
// Render System v1.0
// ================================

import { gameMap } from "./map.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 64;
}

window.addEventListener("resize", resizeCanvas);

export function startRenderer() {

    resizeCanvas();

    requestAnimationFrame(render);

}

function render() {

    // آسمان
    ctx.fillStyle = "#7cc7ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // رسم استان‌ها
    gameMap.provinces.forEach((province) => {

        ctx.fillStyle = province.color;

        ctx.fillRect(
            province.x,
            province.y,
            province.width,
            province.height
        );

        ctx.strokeStyle = "#222";
        ctx.lineWidth = 2;

        ctx.strokeRect(
            province.x,
            province.y,
            province.width,
            province.height
        );

        // نام استان
        ctx.fillStyle = "#ffffff";
        ctx.font = "18px Tahoma";
        ctx.textAlign = "center";

        ctx.fillText(
            province.name,
            province.x + province.width / 2,
            province.y + province.height / 2
        );

    });

    requestAnimationFrame(render);

}
