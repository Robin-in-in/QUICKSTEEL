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





const background = new Map({position: {x:0,y:0}, imageSrc:'Images/background.jpg',width: 1950,height: 1300})

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

//THIS METHOD IN INDEX DOES A BUNCH OF SHIT. ONE OF THOSE THINGS IS ADJUST THE VELOCITY OF THE PLAYER
//BASED ON THE LAST PRESSED KEY.
function animate(){
    c.fillStyle = "black"
    c.fillRect(0,0,canvas.width,canvas.height)
    background.draw({position: {x:camera.x, y:camera.y}})

    player.move(keys);
    //Update each object
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
            if(!event.repeat){
                player.setStrikePoint()
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