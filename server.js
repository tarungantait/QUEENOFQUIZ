const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wssDisplay1 = new WebSocket.Server({ noServer: true });
const wssDisplay2 = new WebSocket.Server({ noServer: true });

let displaySockets = {
    display1: null,
    display2: null,
};

app.use(express.static('public'));
app.use(express.json());

// Serve images from the 'images' folder
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

server.on('upgrade', (request, socket, head) => {
    const pathname = request.url;

    if (pathname === '/display1') {
        wssDisplay1.handleUpgrade(request, socket, head, (ws) => {
            wssDisplay1.emit('connection', ws, request);
        });
    } else if (pathname === '/display2') {
        wssDisplay2.handleUpgrade(request, socket, head, (ws) => {
            wssDisplay2.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

wssDisplay1.on('connection', (socket) => {
    displaySockets.display1 = socket;
    socket.send('Welcome, Display 1!');
});

wssDisplay2.on('connection', (socket) => {
    displaySockets.display2 = socket;
    socket.send('Welcome, Display 2!');
});

app.post('/sendMessage', (req, res) => {
    const message = req.body.message;
    const [image1, image2] = message.split(',');

    if (displaySockets.display1 && displaySockets.display1.readyState === WebSocket.OPEN) {
        displaySockets.display1.send(image1);
    }

    if (displaySockets.display2 && displaySockets.display2.readyState === WebSocket.OPEN) {
        displaySockets.display2.send(image2);
    }

    res.status(200).send('Message received successfully');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
