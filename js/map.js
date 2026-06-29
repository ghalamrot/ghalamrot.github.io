// ================================
// قلمروستان
// Map System v1.0
// ================================

export const gameMap = {
    width: 5000,
    height: 3000,

    provinces: []
};

export function initMap() {

    gameMap.provinces.push({

        id: 1,
        name: "شمال",

        x: 150,
        y: 150,

        width: 250,
        height: 180,

        color: "#2ecc71",

        owner: 1,

        troops: 20

    });

    gameMap.provinces.push({

        id: 2,
        name: "مرکز",

        x: 500,
        y: 180,

        width: 260,
        height: 190,

        color: "#3498db",

        owner: 2,

        troops: 18

    });

    gameMap.provinces.push({

        id: 3,
        name: "جنوب",

        x: 300,
        y: 500,

        width: 300,
        height: 180,

        color: "#e67e22",

        owner: 3,

        troops: 25

    });

}
