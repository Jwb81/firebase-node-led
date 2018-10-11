module.exports = {
    node_count: 2,
    lights: [{
            id: 0,
            roomName: `Baby's room 16ft`,
            red: 0,
            green: 0,
            blue: 0,
            active: false
        },
        {
            id: 1,
            roomName: `Baby's room 5ft`,
            red: 0,
            green: 0,
            blue: 0,
            active: false
        }
    ],
    scenes: [
        {
            id: 0,
            sceneName: `Bon Matin`,
            lights: [{
                    id: 0,
                    red: 172,
                    green: 142,
                    blue: 100
                },
                {
                    id: 1,
                    red: 172,
                    green: 142,
                    blue: 100
                }
            ]
        },{
        id: 1,
        sceneName: `Bonne Nuit`,
        lights: [{
                id: 0,
                red: 2,
                green: 4,
                blue: 6
            },
            {
                id: 1,
                red: 2,
                green: 4,
                blue: 6
            }
        ]
    },
    
    {
        id: 2,
        sceneName: `Pink for Babe :)`,
        lights: [{
                id: 0,
                red: 126,
                green: 0,
                blue: 126
            },
            {
                id: 1,
                red: 126,
                green: 0,
                blue: 126
            }
        ]
    }]
}