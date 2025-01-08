const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
//Usually bad practice to have short names but this is so reused


canvas.width = 1024
canvas.height = 576

const canvasOffset = 7

c.fillRect(0,0, canvas.width, canvas.height)
//0,0 is topleft





const background = new Map({position: {x:0,y:0}, imageSrc:'Images/background.jpg',width: 1950,height: 1300})

const player = new SwordFighter({position: {x: 0, y: 0}, velocity: {x:0, y:0}})

const camera = new Camera({swordFighter: player, mapWidth: background.width, mapHeight: background.height})

//const enemy = new SwordFighter({position: {x: 504, y: 275}, velocity: {x:0, y:0}})


//console.log(player)
//console.log(enemy)

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



function detectCircleFighterCollision(circleCenterX, circleCenterY, circleRadius, fighter) {
    // Circle properties
    const centerX = circleCenterX;
    const centerY = circleCenterY;
    const radius = circleRadius;

    console.log("CenterX",centerX)
    // Rectangle properties
    const fx = fighter.position.x;
    const fy = fighter.position.y;
    const fh = fighter.height*fighter.animationScale;
    const fw = fighter.width*fighter.animationScale;

    // Closest point on the rectangle to the circle's center
    // Finds the minimum between the distance of the right side from the center vs. the distance of the center from the left side
    const distanceX = Math.min(Math.abs(centerX-(fx+fw)),Math.abs(fx-centerX))
    //console.log("ClosestX", closestX)

    //Same for top/bottom
    const distanceY = Math.min(Math.abs(centerY-(fy+fh)),Math.abs(fy-centerY))


    //const distanceX = centerX - closestX;
    //const distanceY = centerY - closestY;

    
    console.log("closest distance",distanceX)
    //
    //console.log("BETWEEN FOX AND POINT (X)", Math.abs(distanceX))
    //console.log("BETWEEN FOX AND POINT (Y)", Math.abs(distanceY))

    // Check if the distance is less than or equal to the radius

    //console.log("POINT(X)", centerX)
    //console.log("POINT(Y)", centerY)
    //console.log("CLOSEST POINT(X)",closestX)
    //console.log("CLOSEST POINT(Y)",closestY)
    //console.log("a^2+b^2", closestX**2 + closestY**2)
    //console.log("c^2", radius**2)
    return (distanceX ** 2 + distanceY ** 2) <= (radius ** 2)
}


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

//THIS METHOD IN INDEX DOES A BUNCH OF SHIT. ONE OF THOSE THINGS IS ADJUST THE VELOCITY OF THE PLAYER
//BASED ON THE LAST PRESSED KEY.
function animate(){
    c.fillStyle = "black"
    c.fillRect(0,0,canvas.width,canvas.height)
    background.draw({position: {x:camera.x, y:camera.y}})

    // Get the currentMovementKey from the last of the pressed keys array
    let currentMovementKey = keysPressed[keysPressed.length - 1]

    if((lastMovementKey === currentMovementKey) && (speedDebuff < 7.5)){
        speedDebuff += 0.6
    } else if(lastMovementKey != currentMovementKey){
        speedDebuff = 0
    }
    //console.log(speedDebuff)
    //Logic for decreasing speed of player after dash 

    player.velocity.x = 0
    player.velocity.y = 0

    const speed = 15 - speedDebuff;
    const isMovingVertically = keys.w.pressed || keys.s.pressed;
    const isMovingHorizontally = keys.a.pressed || keys.d.pressed;

    // Normalize diagonal speed to prevent faster movement
    const diagonalSpeed = isMovingVertically && isMovingHorizontally ? speed / Math.sqrt(2) : speed;

    if (keys.a.pressed) {
        player.velocity.x = -diagonalSpeed;
    }
    if (keys.d.pressed) {
        player.velocity.x = diagonalSpeed;
    }
    if (keys.w.pressed) {
        player.velocity.y = -diagonalSpeed;
    }
    if (keys.s.pressed) {
        player.velocity.y = diagonalSpeed;
    }

    lastMovementKey = currentMovementKey;  // Update the lastMovementKey for next frame comparison

    player.update();
    camera.update();

    if(player.point){
        player.point.update();
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


//THIS LISTENER IN INDEX  DETECTS WHICH KEY WAS LAST PRESSED
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
            if(!event.repeat){
                
                //point = new StrikePoint({position: {x: mouseX, y: mouseY}})
                player.setStrikePoint()
                break
            }
    }
    //console.log(event.key)
})

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