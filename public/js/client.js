//MADE IN COLLABORATION WITH TYSON LINE - type out README.MD
//const socket = io(`https://${window.location.hostname}`);
/*
const socket = io({
    transports: ["websocket", "polling"]
  });
  */
const socket = io('http://localhost:3000');
let player = null
let enemy = null

/*
const position = {x:0,y:0}
const facing = 'S'
const isRunning = false
const isSetting = false
const isParrying = false
const strikeRecency = 0
let speedDebuff = 0
*/

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;


let rect = canvas.getBoundingClientRect(); // Get canvas position and size
let scaleX = canvas.width / rect.width;  // Fix scaling if the canvas is resized with CSS
let scaleY = canvas.height / rect.height;

let inputData ={
    keys : {
        a: {
            pressed: false
        },
        d: {
            pressed: false
        },
        w: {
            pressed: false
        },
        s: {
            pressed: false
        },
        none: {
            pressed: false
        }
    },
    keysPressed : []
}

let strikeData ={
    mouse: {x:0,y:0}
}

// Track mouse position
window.addEventListener('mousemove', (event) => {
    
    strikeData.mouse.x = (event.clientX - rect.left) * scaleX;
    strikeData.mouse.y = (event.clientY - rect.top) * scaleY;
});

// Detect left-click
window.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // 0 is the code for the left mouse button
        //console.log('left click');
        //console.log(strikeData.mouse.x)
        if (player.animCount > 30) {
            player.animCount = 0;
        }
        socket.emit('strike', strikeData, player?.camera.position)
    }
});

//Tracks which key was last pressed
window.addEventListener('keydown', (event) =>{
    switch (event.key){
        case 'd':
            if(!event.repeat){
                inputData.keys.d.pressed=true
                if(!inputData.keysPressed.includes('d')){
                    inputData.keysPressed.push('d')
                }
                break
            }
        case 'a':
            if(!event.repeat){
                inputData.keys.a.pressed=true
                if(!inputData.keysPressed.includes('a')){
                    inputData.keysPressed.push('a')
                }
                break
            }
        case 'w':
            if(!event.repeat){
                inputData.keys.w.pressed=true
                if(!inputData.keysPressed.includes('w')){
                    inputData.keysPressed.push('w')
                }
                break
            }
            
        case 's':
            if(!event.repeat){
                inputData.keys.s.pressed=true
                if(!inputData.keysPressed.includes('s')){
                    inputData.keysPressed.push('s')
                }
                break
            }
        case 'q':
            if(!event.repeat){
                if(player.animCount>30){
                    player.animCount=0
                }
                socket.emit('strike', strikeData, player?.camera.position)
                break
            }
        case 'e':
            if(!event.repeat){
                player.animCount=0
                socket.emit('parry')
                break
            }
    }
    socket.emit('inputs', inputData)
})

//Tracks when keys are released
window.addEventListener('keyup', (event) =>{
    let upIndex

    switch (event.key){
        case 'd':
            inputData.keys.d.pressed=false
            lastKey='none'
            upIndex=inputData.keysPressed.indexOf('d')
            break
        case 'a':
            inputData.keys.a.pressed=false
            lastKey='none'
            upIndex=inputData.keysPressed.indexOf('a')
            break
        case 'w':
            inputData.keys.w.pressed=false
            lastKey='none'
            upIndex=inputData.keysPressed.indexOf('w')
            //console.log(upIndex)
            break
        case 's':
            inputData.keys.s.pressed=false
            lastKey='none'
            upIndex=inputData.keysPressed.indexOf('s')
            break
    }
    if(upIndex>-1){
        inputData.keysPressed.splice(upIndex, 1);
    }
    //player.move(keys);
    socket.emit('inputs', inputData);
})


socket.on('initial', (mapWidth, mapHeight, playerWidth, playerHeight, fighterID, playerScaling, playerNumber) => {
    //When client connects, the server will send the initial data. This is where we set it up.
    player = new SwordFighterUI(playerWidth, playerHeight, fighterID, mapWidth, mapHeight, playerScaling, playerNumber)
});

socket.on('update', (playerWidth, playerHeight, fighterID, playerPosition, facing, isRunning, isSetting, parry, strikeRecency, speedDebuff, serverPointPosition, playerScaling, successfullyParried, isClashing, isDying, isRespawning, struckEnemyParry, amountOfPlayers) => {
    if(amountOfPlayers==1){
        waitingMessage.style.display = "block";
        overcrowdMessage.style.display = "none"; // Show the message
    } else if(amountOfPlayers==2){
        waitingMessage.style.display = "none";
        overcrowdMessage.style.display = "none";
    } else if(amountOfPlayers>2){
        waitingMessage.style.display = "none";
        overcrowdMessage.style.display = "block"; 
    }

    player.refreshAttributes(playerWidth, playerHeight, fighterID, playerPosition, facing, isRunning, isSetting, parry.isParrying, strikeRecency, speedDebuff, serverPointPosition, successfullyParried, isClashing, isDying, isRespawning, struckEnemyParry)
})

socket.on('updateToOthers', (playerWidth, playerHeight, fighterID, playerPosition, facing, isRunning, isSetting, parry, strikeRecency, speedDebuff, serverPointPosition, playerScaling, playerNumber, successfullyParried, isClashing, isDying, isRespawning, struckEnemyParry) => {
    //Updates recieved from other players. As there is only one other player right now I'm implementing it as such
    if(!enemy&&!player){

    }else if(!enemy&&player){
        enemy = new EnemySwordFighterUI(playerWidth, playerHeight, fighterID, playerScaling, playerNumber, player)
    } else{
        enemy.refreshAttributes(playerWidth, playerHeight, fighterID, playerPosition, facing, isRunning, isSetting, parry.isParrying, strikeRecency, speedDebuff, serverPointPosition, successfullyParried, isClashing, isDying, isRespawning, struckEnemyParry)
    }
})

socket.on('disconnectToOthers', () => {
    enemy = null
})

let lastTime = 0;
const targetFPS = 60;
const frameDuration = 1000 / targetFPS;

//TODO: Should probably move this to server
function animate(timestamp){
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
  
    if (deltaTime >= frameDuration) {
      lastTime = timestamp - (deltaTime % frameDuration);

        screenWidth = window.innerWidth;
        screenHeight = window.innerHeight;
        rect = canvas.getBoundingClientRect(); // Get canvas position and size
        scaleX = canvas.width / rect.width;  // Fix scaling if the canvas is resized with CSS
        scaleY = canvas.height / rect.height;

        c.fillStyle = "black"
        c.fillRect(0,0,canvas.width,canvas.height)
        if(player!=null){     

            //Update each object
            player.draw();
            player.camera.update();
    
            if(player.point){
                //console.log("Player point created, drawing.")
                player.point.draw();
            }
        } 
        if(enemy){
            enemy.draw()
            if(enemy.point){
                enemy.point.draw()
            }
        }
    }
    window.requestAnimationFrame(animate);
}

animate()



