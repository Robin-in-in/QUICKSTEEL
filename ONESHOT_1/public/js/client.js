const socket = io('http://localhost:3001');
let player = null

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


const canvas = document.querySelector('canvas')
canvas.width = 1024
canvas.height = 576
const c = canvas.getContext('2d')

const canvasOffsetX = (screenWidth-canvas.width)/2
const canvasOffsetY = (screenHeight-canvas.height)/2




c.fillRect(0,0, canvas.width, canvas.height)

//List all audio files here, played within draw loop 
const parry1 = new Audio("../assets/sounds/fox_parry_1.mp3")
const parry2 = new Audio("../assets/sounds/fox_parry_2.mp3")
const parry3 = new Audio("../assets/sounds/fox_parry_3.mp3")
const slash1 = new Audio("../assets/sounds/fox_slash_1.mp3")
const slash2 = new Audio("../assets/sounds/fox_slash_2.mp3")
const slash3 = new Audio("../assets/sounds/fox_slash_3.mp3")
const set = new Audio("../assets/sounds/fox_set_1.mp3")
const background = new BackMap({position: {x:0,y:0}, imageSrc:'../assets/images/background2.png',width: 1950,height: 1300,upscale:1})
const backgroundWind = new Audio("../assets/sounds/backgroundWind.mp3")
backgroundWind.loop = true
backgroundWind.play()

const inputData ={
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
    keysPressed : [],
    
    parry: false,
}

let strikeData ={
    canvasOffset: {x:0,y:0},
    mouse: {x:0,y:0}
}

// Track mouse position
window.addEventListener('mousemove', (event) => {
    strikeData.mouse.x = event.clientX;
    strikeData.mouse.y = event.clientY;
});

// Detect left-click
window.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // 0 is the code for the left mouse button
        console.log('left click');
        if (player.animCount > 30) {
            player.animCount = 0;
        }
        socket.emit('strike', {strikeData})
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
            console.log('q')
            if(!event.repeat){
                if(player.animCount>30){
                    player.animCount=0
                }
                inputData.strike = true
                break
            }
        case 'e':
            console.log('e')
            if(!event.repeat){
                player.animCount=0
                socket.emit('parry')
                break
            }
    }
    socket.emit('inputs', inputData);
    inputData.strike = false
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
    socket.emit('inputs', inputData.keysPressed);
})


socket.on('initial', (mapWidth, mapHeight, playerWidth, playerHeight, fighterID, playerScaling) => {
    //When client connects, the server will send the initial data. This is where we set it up.
    player = new SwordFighterUI({width: playerWidth, height: playerHeight, fighterID: fighterID, localScaling: playerScaling, mapWidth: mapWidth, mapHeight: mapHeight})
});

socket.on('update', (playerWidth, playerHeight, fighterID, playerPosition, facing, isRunning, isSetting, parry, strikeRecency, speedDebuff) => {
    //Server will send updates to the client, this is where we update the client based on the server's dapositiposition
    
    //TODO: Will have to figure out a way to give unique ID's to each player- shouldn't be hard, only 1v1 for now
    player.refreshAttributes(playerWidth, playerHeight, fighterID, playerPosition, facing, isRunning, isSetting, parry.isParrying, strikeRecency, speedDebuff)
    
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
        strikeData.canvasOffset.x = (screenWidth-canvas.width)/2
        strikeData.canvasOffset.y = (screenHeight-canvas.height)/2

        c.fillStyle = "black"
        c.fillRect(0,0,canvas.width,canvas.height)
        if(player!=null){
            background.draw({position: {x:player.camera.x, y:player.camera.y}})

        
            //Update each object
            player.draw();
            player.camera.update();
    
            if(player.point){
                player.point.update();
            }
        } 
    }
    window.requestAnimationFrame(animate);
}


animate()



