
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




