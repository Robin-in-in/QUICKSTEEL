const express = require('express');
const {SwordFighter, StrikePoint} = require('./classes');
const app = express();

const { createServer } = require('node:http');
const { join } = require('node:path');
const server = createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const fighters = new Map()

// Serve static files from the 'public' directory
app.use(express.static(join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public/index.html'));
});

io.on('connection', (socket) => {
    let playerNumber = 0 
    if(fighters.size==0){
        playerNumber=1
    } else if(fighters.values().next().value.playerNumber==1){
        playerNumber=2
    } else{
        playerNumber=1
    }
    console.log('New connection:', socket.id)
    const fighter = new SwordFighter({fighterID: socket.id, playerNumber: playerNumber})
    fighters.set(socket.id, fighter)
    socket.emit('initial',fighter.mapWidth, fighter.mapHeight, fighter.width, fighter.height, socket.id, fighter.animationScale, fighter.playerNumber)

    let enemyRef = null
    let enemyPosition = null
    const updatesPerSecond = 60
    const updateLoop = setInterval(() => {
        

        
        //Could replace this with a more efficient solution since fighters.size is 2 max
        for(let f of fighters.values()){
            if(f.fighterID != socket.id){
                enemyRef = f
                enemyPosition = f.position
                break
            }
        }
        
        fighter.update(enemyPosition)
        if(fighter.enemyStruck){
            if(enemyRef){
                enemyRef.successfullyStruck=true
                enemyRef.struckBy = fighter.playerNumber
                let enemyParrying = enemyRef.parry.isParrying
                fighter.enemyStrikeSuccessfullySignaled(enemyParrying)
            }
        }

        socket.emit('update', fighter.width, fighter.height, socket.id, fighter.position, fighter.facing, fighter.isRunning, fighter.isSetting, fighter.parry, fighter.strikeRecency, fighter.speedDebuff, fighter.point?.position, fighter.animationScale, fighter.successfullyParried, fighter.isClashing, fighter.isDying, fighter.isRespawning, fighter.struckEnemyParry, fighters.size, fighter.mostRecentDeathTo, fighter.respawnInvincibility )
        socket.broadcast.emit('updateToOthers',fighter.width, fighter.height, socket.id, fighter.position, fighter.facing, fighter.isRunning, fighter.isSetting, fighter.parry, fighter.strikeRecency, fighter.speedDebuff, fighter.point?.position, fighter.animationScale, fighter.playerNumber, fighter.successfullyParried, fighter.isClashing, fighter.isDying, fighter.isRespawning, fighter.struckEnemyParry, fighter.mostRecentDeathTo, fighter.respawnInvincibility )
    }, 1000/updatesPerSecond)

    socket.on('inputs', (inputData) => {
        if (inputData && inputData.keysPressed) {
            fighter.inputData = inputData;
        } else {
            console.warn('Received invalid inputData:', inputData);
            // Optionally, assign an empty array or a default structure
            fighter.inputData.keysPressed = []
        }
    });

    socket.on('strike',(strikeData,cameraPos) => {
        if (strikeData && strikeData.mouse.x && cameraPos) {
            console.log("Is fighter parrying", fighter.successfullyParried)
            if(fighter.successfullyParried){
                fighter.instantStrike(enemyPosition, strikeData, cameraPos)
                fighter.strikeRecency = 1.1;
                //cleanse parry debuff
                fighter.recentParry=false
            } else{
                fighter.setStrikePoint(strikeData,cameraPos)
            }
        } else {
            console.warn('Received invalid strikeData or cameraPos. strikeData:', strikeData);
            console.warn('cameraPos:', cameraPos)
        }
        
    })

    socket.on('parry',()=>{
        fighter.beginParrying()
    })

    socket.on('disconnect', ()=> {
        console.log('A fighter has disconnected:', socket.id)
        socket.broadcast.emit('disconnectToOthers')
        clearInterval(updateLoop)
        fighters.delete(socket.id)
    })

});

server.listen(PORT, () => {
    console.log('Server is running at http://localhost:' + PORT);
});

