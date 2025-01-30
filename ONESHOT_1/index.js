

//TODO: Update this to create a new instance for each connected player. Will need to add an ID to the player class
//Additionally each instance of camera will need to be coupled to a player instance
const player = new SwordFighter({map: background})
const camera = new Camera({swordFighter: player, mapWidth: background.width, mapHeight: background.height})

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


//TODO: Probably better to make this as a function of StrikePoint
function detectCircleFighterCollision(circleCenterX, circleCenterY, circleRadius, fighter) {
    const centerX = circleCenterX;
    const centerY = circleCenterY;
    const radius = circleRadius;

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
/*
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
*/

let lastTime = 0;
const targetFPS = 60;
const frameDuration = 1000 / targetFPS;

//TODO: Should probably move this to server
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


//TODO: Rest should be moved to client.js, it's all input detection. Biggest issue is figuring out player.animCount interaction. 
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