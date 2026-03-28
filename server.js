const express = require('express');
const WebSocket = require('ws');

const app = express();
const PORT = 8080;

app.use(express.static('public'));

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 WebSocket Game Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

let players = new Map();
let gameState = { clicks: 0, topPlayer: null };

wss.on('connection', (ws) => {
    const playerId = Math.random().toString(36).substr(2, 9);
    
    players.set(playerId, {
        id: playerId,
        clicks: 0,
        ws: ws
    });

    console.log(`✅ Player ${playerId} connected. Total: ${players.size}`);

    ws.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        playerCount: players.size
    }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'click') {
            const player = players.get(playerId);
            player.clicks++;
            gameState.clicks++;
            
            let topClicks = 0;
            players.forEach(p => {
                if (p.clicks > topClicks) {
                    topClicks = p.clicks;
                    gameState.topPlayer = p.id;
                }
            });

            const update = {
                type: 'update',
                totalClicks: gameState.clicks,
                playerCount: players.size,
                yourClicks: player.clicks,
                topPlayer: gameState.topPlayer,
                isTop: gameState.topPlayer === playerId
            };

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(update));
                }
            });
        }
    });

    ws.on('close', () => {
        players.delete(playerId);
        console.log(`❌ Player ${playerId} disconnected. Total: ${players.size}`);
    });
});
