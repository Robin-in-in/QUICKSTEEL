const express = require('express');
const {SwordFighter, StrikePoint} = require('./classes');
const app = express();
const port = 3001;

const { createServer } = require('node:http');
const { join } = require('node:path');
const server = createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const fighters = new Map()

// Serve static files from the 'public' directory
app.use(express.static(join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public/index.html'));
});

io.on('connection', (socket) => {
    console.log('New connection:', socket.id)
    const fighter = new SwordFighter({fighterID: socket.id})
    fighters.set(socket.id, fighter)
    socket.emit('initial',fighter.mapWidth, fighter.mapHeight, fighter.width, fighter.height, socket.id, fighter.animationScale)

    const updatesPerSecond = 60
    const updateLoop = setInterval(() => {
        fighter.update()
        socket.emit('update', fighter.width, fighter.height, socket.id, fighter.position, fighter.facing, fighter.isRunning, fighter.isSetting, fighter.parry, fighter.strikeRecency, fighter.speedDebuff )
    }, 1000/updatesPerSecond)

    socket.on('inputs', (inputData) => {
        fighter.inputData = inputData

    });

    socket.on('strike',(strikeData) => {
        fighter.setStrikePoint(strikeData)
    })

    socket.on('parry',()=>{
        fighter.parry()
    })

    socket.on('disconnect', ()=> {
        console.log('A fighter has disconnected:', socket.id)

        clearInterval(updateLoop)
        fighters.delete(socket.id)
    })

});

server.listen(port, () => {
    console.log('Server is running at http://localhost:' + port);
});

