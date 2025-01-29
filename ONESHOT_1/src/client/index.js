const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
//Usually bad practice to have short names but this is so reused


canvas.width = 1024
canvas.height = 576


const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

const canvasOffsetX = (screenWidth-canvas.width)/2
const canvasOffsetY = (screenHeight-canvas.height)/2

c.fillRect(0,0, canvas.width, canvas.height)
//0,0 is topleft


//List all audio files here which 
let parry1 = new Audio("../../../public/assets/sounds/fox_parry_1.mp3")
let parry2 = new Audio("../../../public/assets/sounds/fox_parry_2.mp3")
let parry3 = new Audio("../../../public/assets/sounds/fox_parry_3.mp3")
let slash1 = new Audio("../../../public/assets/sounds/fox_slash_1.mp3")
let slash2 = new Audio("../../../public/assets/sounds/fox_slash_2.mp3")
let slash3 = new Audio("../../../public/assets/sounds/fox_slash_3.mp3")
let set = new Audio("../../../public/assets/sounds/fox_set_1.mp3")
let backgroundWind = new Audio("../../../public/assets/sounds/backgroundWind.mp3")
backgroundWind.loop = true
backgroundWind.play()





const background = new Map({position: {x:0,y:0}, imageSrc:'../../../public/assets/images/background.jpg',width: 1950,height: 1300,upscale:1})
const grassBackground = new Map({position: {x:0,y:0}, imageSrc:'../../../public/assets/images/background2.png',width: 1950,height: 1300,upscale:4})
const stillWaterBackground = new Map({position: {x:0,y:0}, imageSrc:'../../../public/assets/images/background3.png',width: 1950,height: 1300,upscale:4})
const waterBackground = new Map({position: {x:0,y:0}, imageSrc:'../../../public/assets/images/backgroundWater.png',width: 1950,height: 1300,upscale:4})

const player = new SwordFighter({position: {x: 0, y: 0}, velocity: {x:0, y:0}, map: background})

const camera = new Camera({swordFighter: player, mapWidth: background.width, mapHeight: background.height})

//These are all the keys we're tracking
const keys = {
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
}

let keysPressed = []
let lastMovementKey
let speedDebuff = 0;


//Used to detect when the player collides with the StrikePoint radius
function detectCircleFighterCollision(circleCenterX, circleCenterY, circleRadius, fighter) {
    // Circle properties
    const centerX = circleCenterX;
    const centerY = circleCenterY;
    const radius = circleRadius;

    console.log("CenterX",centerX)
    // Fighter properties
    const fx = fighter.position.x;
    const fy = fighter.position.y;
    const fh = fighter.height*fighter.animationScale;
    const fw = fighter.width*fighter.animationScale;

    // Closest point on the fighter to the circle's center
    // Finds the minimum between the distance of the right side from the center vs. the distance of the center from the left side
    // Essentially: What is the shortest distance between one of the player sides and the circle center
    const distanceX = Math.min(Math.abs(centerX-(fx+fw)),Math.abs(fx-centerX))

    //Same for top/bottom
    const distanceY = Math.min(Math.abs(centerY-(fy+fh)),Math.abs(fy-centerY))

    // Check if the distance is less than or equal to the radius
    return (distanceX ** 2 + distanceY ** 2) <= (radius ** 2)
}

//Not using this one as of now
function shortestPathToCircleCenter(circle, rect) {
    // Circle properties
    const cx = circle.x;
    const cy = circle.y;

    // Rectangle properties
    const rx = rect.x;
    const ry = rect.y;
    const rw = rect.width;
    const rh = rect.height;

    // Closest point on the rectangle to the circle's center
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));

    // Shortest path vector
    const vectorX = cx - closestX;
    const vectorY = cy - closestY;

    // Magnitude of the shortest path
    const magnitude = Math.sqrt(vectorX ** 2 + vectorY ** 2);

    return {
        vector: { x: vectorX, y: vectorY },
        magnitude: magnitude, // Length of the path
    };
}

let lastTime = 0;
const targetFPS = 60;
const frameDuration = 1000 / targetFPS;

function animate(timestamp){
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
  
    if (deltaTime >= frameDuration) {
      lastTime = timestamp - (deltaTime % frameDuration);

        c.fillStyle = "black"
        c.fillRect(0,0,canvas.width,canvas.height)
        //background.draw({position: {x:camera.x, y:camera.y}})
        grassBackground.draw({position: {x:camera.x, y:camera.y}})
        //stillWaterBackground.draw({position: {x:camera.x, y:camera.y}})
        //waterBackground.animateMap({position: {x:camera.x, y:camera.y},start:14,max:49,slowdown:7})

        player.move(keys);
        //Update each object
        player.update();
        camera.update();

        if(player.point){
            player.point.update();
        }
    }
    window.requestAnimationFrame(animate);
}


animate()

let mouseX = 0;
let mouseY = 0;

// Track mouse position
window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

// Detect left-click
window.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // 0 is the code for the left mouse button
        console.log('left click');
        if (player.animCount > 30) {
            player.animCount = 0;
        }
        player.setStrikePoint();
    }
});

//Tracks which key was last pressed
window.addEventListener('keydown', (event) =>{
    switch (event.key){
        case 'd':
            if(!event.repeat){
                keys.d.pressed=true
                if(!keysPressed.includes('d')){
                    keysPressed.push('d')
                }
                break
            }
        case 'a':
            if(!event.repeat){
                keys.a.pressed=true
                if(!keysPressed.includes('a')){
                    keysPressed.push('a')
                }
                break
            }
        case 'w':
            if(!event.repeat){
                keys.w.pressed=true
                if(!keysPressed.includes('w')){
                    keysPressed.push('w')
                }
                break
            }
            
        case 's':
            if(!event.repeat){
                keys.s.pressed=true
                if(!keysPressed.includes('s')){
                    keysPressed.push('s')
                }
                break
            }
        case 'q':
            console.log('q')
            if(!event.repeat){
                if(player.animCount>30){
                    player.animCount=0
                }
                player.setStrikePoint()
                break
            }
        case 'e':
            console.log('e')
            if(!event.repeat){
                player.animCount=0
                player.parry()
                break
            }
    }
})

//Tracks when keys are released
window.addEventListener('keyup', (event) =>{
    let upIndex

    switch (event.key){
        case 'd':
            keys.d.pressed=false
            lastKey='none'
            upIndex=keysPressed.indexOf('d')
            break
        case 'a':
            keys.a.pressed=false
            lastKey='none'
            upIndex=keysPressed.indexOf('a')
            break
        case 'w':
            keys.w.pressed=false
            lastKey='none'
            upIndex=keysPressed.indexOf('w')
            //console.log(upIndex)
            break
        case 's':
            keys.s.pressed=false
            lastKey='none'
            upIndex=keysPressed.indexOf('s')
            break
    }
    if(upIndex>-1){
        keysPressed.splice(upIndex, 1);
    }
})