// ============================
// قلمروستان
// Main.js
// نسخه 1.0
// ============================

import { initMap } from "./map.js";
import { startRenderer } from "./render.js";
import { initInput } from "./input.js";

// عناصر صفحه
const loadingScreen = document.getElementById("loading-screen");
const game = document.getElementById("game");

// شروع بازی
window.addEventListener("load", () => {

    // نمایش بازی
    loadingScreen.style.display = "none";
    game.style.display = "block";

    // راه‌اندازی بخش‌ها
    initMap();
    startRenderer();
    initInput();

});
