const express = require('express');
const http = require('http');
const cors = require('cors')
const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 8200;
const API = '/api/v1';
const colors = ['#03cffc', '#1f8023', '#cf6808', '#940000', '#000000', '#ad02a2'];
const faces = [':D', ':)', ':(', ':O', ':/'];
const redrawRate = 1000 / 30;
const mapSize = {x: 2000, y: 1500};
const moveRate = 10;
const maxGoodies = 10;

app.use(cors());
app.use(express.static('public'));

app.get(`${API}/status`, (req, res) => {
    const json = {status: 'UP'};
    res.send(json);
});

let players = {};
let goodies = {};
let names = {};

io.on('connection', socket => {
    io.emit('user connected', { user: 'a user', message: 'connected' });

    players[socket.id] = {
        x: randomNumber(mapSize.x),
        y: randomNumber(mapSize.y),
        angle: 0,
        color: getColor(),
        face: getFace(),
        name: null,
        score: 0,
        units: 0
    };

    socket.emit('setup', players[socket.id]);

    socket.on('look', msg => {
        players[socket.id].angle = msg.angle;

        movePlayer(socket);

        const collisions = checkGoodyCollisions(socket);
        collisions.forEach(goody => goodyCollide(socket, goody));
    });

    socket.on('user message', (msg) => {
        if (msg[0] === '/') {
            execCommand(socket, msg);
        } else {
            const me = players[socket.id].name ?? 'a user';
            io.emit('user message', {user: me, message: msg});
        }
    });

    socket.on('disconnect', () => {
        const me = players[socket.id].name ?? 'a user';
        delete players[socket.id];
        io.emit('user disconnected', { user: me, message: 'disconnect', id: socket.id });
    });
});

const movePlayer = (socket) => {
    const player = players[socket.id];

    let xMovement = 0;
    let yMovement = 0;

    // 12 o'clock
    if (player.angle === 1) {
        xMovement = 0;
        yMovement = -90;
    }

    // 12.01 to 3 o'clock
    if (player.angle > 1 && player.angle <= 90) {
        xMovement = Math.sqrt(player.angle ** 2);
        yMovement = -Math.sqrt((player.angle - 90) ** 2);
    }

    // 3.01 to 6 o'clock
    if (player.angle > 90 && player.angle <= 180) {
        xMovement = 90 - ((Math.sqrt(player.angle ** 2)) - 90);
        yMovement = Math.sqrt((player.angle - 90) ** 2);
    }

    // 6.01 to 9 o'clock
    if (player.angle > 180 && player.angle <= 270) {
        xMovement = (90 - Math.sqrt((player.angle - 90) ** 2));
        yMovement = 180 - (Math.sqrt((player.angle - 90) ** 2));
    }

    // 9.01 to 11.599 o'clock
    if (player.angle > 270 && player.angle <= 360) {
        xMovement = (90 - (Math.sqrt((player.angle - 90) ** 2) - 180)) * -1;
        yMovement = 180 - (Math.sqrt((player.angle - 90) ** 2));
    }

    player.x += Math.ceil(xMovement / 10);
    player.y += Math.ceil(yMovement / 10);
};

const execCommand = (socket, msg) => {
    const parts = msg.split(' ');
    const command = parts[0];
    const instructionTypeOne = msg.replace(`${command} `, '')

    const targetName = parts[1];
    const instructionTypeTwo = msg.replace(`${command} ${targetName} `, '')

    switch (command) {
        case '/name':
            players[socket.id].name = instructionTypeOne;
            names[instructionTypeOne.toLowerCase()] = {name: instructionTypeOne, id: socket.id};
            break;
        case '/pm':
            const target = names[targetName.toLowerCase()];
            if (target) {
                const me = players[socket.id].name ?? 'a user';
                io.in(target.id).emit('pm received', { user: me, message: instructionTypeTwo});
                socket.emit('pm sent', { user: targetName, message: instructionTypeTwo});
            }
            break;
    }
};

const t = setInterval(() => {
    io.emit('redraw', {players, goodies});
}, redrawRate);

const checkGoodyCollisions = socket => {
    return Object.entries(goodies).filter(goody => {
        const xHit = goody[1].x > players[socket.id].x - 50 && goody[1].x < players[socket.id].x + 50;
        const yHit = goody[1].y > players[socket.id].y - 50 && goody[1].y < players[socket.id].y + 50;
        return xHit && yHit;
    });
}

const goodyCollide = (socket, goody) => {
    players[socket.id].score += goody[1].value;
    delete goodies[goody[0]];

    io.emit('remove goody', {id: goody[0]});

    const latestGoody = generateGoody();
    goodies[latestGoody.id] = latestGoody.position;

    players[socket.id].units = Math.floor(players[socket.id].score / 100);
}

const randomNumber = (max) => {
    return Math.floor(Math.random() * max);
};

const getColor = () => {
    return colors[randomNumber(colors.length)];
};

const getFace = () => {
    return faces[randomNumber(faces.length)];
};

const generateGoody = () => {
    return {
        id: uuidv4(),
        position: {
            x: randomNumber(mapSize.x) + 20,
            y: randomNumber(mapSize.y -60),
            value: (randomNumber(5) + 1) * 10
        }
    };
};


for(i = 0; i < maxGoodies; i++) {
    const initialGoody = generateGoody();
    goodies[initialGoody.id] = initialGoody.position;
}

server.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
