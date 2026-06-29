// ================================
// قلمروستان
// Input System v1.0
// ================================

import { gameMap } from "./map.js";

const canvas = document.getElementById("game-canvas");

// استان انتخاب شده
export let selectedProvince = null;

// کلیک روی نقشه
canvas.addEventListener("click", onCanvasClick);

function onCanvasClick(event) {

    const rect = canvas.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    selectedProvince = null;

    for (const province of gameMap.provinces) {

        if (
            mouseX >= province.x &&
            mouseX <= province.x + province.width &&
            mouseY >= province.y &&
            mouseY <= province.y + province.height
        ) {

            selectedProvince = province;

            console.log("استان انتخاب شد:", province.name);

            break;

        }

    }

}

export function initInput() {

    console.log("Input Ready");

}
