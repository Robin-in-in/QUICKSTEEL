class StrikePoint{
    constructor({position, ownerFighter,cameraPos}){
        this.self = this
        this.position = {x:position.x,y:position.y}
        //Need to implement checks such that even if client edits camera, this can never end up outside of canvas
        this.truePosX = position.x + Math.abs(cameraPos.x)
        this.truePosY = position.y + Math.abs(cameraPos.y) 
        
        this.fighter=ownerFighter
        this.radius=175
        this.strikeStart = {x:0,y:0}
        this.strikeEnd = {x:0,y:0}
    }

    //Update owner fighter's position to center of strike point
    strike(enemyPosition) {
        this.strikeStart.x = this.fighter.position.x
        this.strikeStart.y = this.fighter.position.y
        this.fighter.position.x = this.truePosX-(this.fighter.width*this.fighter.animationScale/2)
        this.fighter.position.y = this.truePosY-(this.fighter.height*this.fighter.animationScale/2)
        this.strikeEnd.x = this.fighter.position.x
        this.strikeEnd.y = this.fighter.position.y
        console.log("Strike Start:", this.strikeStart)
        console.log("Strike End:", this.strikeEnd)
        console.log("Enemy Postiion:", enemyPosition)
        if(enemyPosition){
            if(this.pointLineCollision(enemyPosition.x,enemyPosition.y, this.strikeStart.x, this.strikeStart.y, this.strikeEnd.x, this.strikeEnd.y)){
                this.fighter.enemyStruck=true
                //console.log("Enemy struck")
            }
        }
    }

    pointLineCollision(px, py, x1, y1, x2, y2, threshold = 40, extensionFactor = 1.3) {
        // Compute the original segment vector
        let dx = x2 - x1;
        let dy = y2 - y1;
        let segmentLength = Math.hypot(dx, dy);
    
        if (segmentLength === 0) {
            // The segment is actually just a point
            return Math.hypot(px - x1, py - y1) <= threshold;
        }
    
        // Normalize direction vector
        let ux = dx / segmentLength;
        let uy = dy / segmentLength;
    
        // Extend each endpoint
        let extension = (extensionFactor - 1) * segmentLength;
        x1 -= ux * extension;
        y1 -= uy * extension;
        x2 += ux * extension;
        y2 += uy * extension;
    
        // Compute projection factor
        let segmentLengthSq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / segmentLengthSq;
    
        if (t < 0) {
            return Math.hypot(px - x1, py - y1) <= threshold;
        } else if (t > 1) {
            return Math.hypot(px - x2, py - y2) <= threshold;
        } else {
            let closestX = x1 + t * (x2 - x1);
            let closestY = y1 + t * (y2 - y1);
            return Math.hypot(px - closestX, py - closestY) <= threshold;
        }
    }
}



class SwordFighter{
    constructor({fighterID, playerNumber}) {
        //TODO: Player animation and opacity stuff needs to be moved to some frontend swordfighter thing
        //I think some opacity stuff is directly related to game logic so need to figure that out
        //Need to move calculation of position velocity to this version of swordfighter, only need facing and input key list from client
        this.self=this
        this.fighterID = fighterID
        this.playerNumber = playerNumber

        this.position = {x:0,y:0}
        this.velocity = {x:0,y:0}

        //Map attributes needed so player doesn't leave boundaries
        this.mapWidth=1950
        this.mapHeight=1300

        //Dimensions of original sprite
        this.height=50
        this.width=50
        this.animationScale=2.5
        
        //Attributes
        this.isSetting = false
        this.parry= {isParrying: false, recentParry: false}
        this.point = null;
        this.isRunning = false
        this.facing = 'S'
        this.speedDebuff = 0


        //Strike Attributes
        this.strikeRecency = 0
        this.strikeLag = 0.7

        this.successfullyStruck = false
        this.successfullyParried= false
        this.isDying=false
        this.isClashing=false
        this.isRespawning=false
        this.enemyStruck=false
        this.struckEnemyParry=false

        this.inputData = {
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

        this.currentMovementKey
        this.previousMovementKey
        this.previousFacing
    }

    enemyStrikeSuccessfullySignaled(enemyParrying){
        this.enemyStruck=false
        if(enemyParrying){
            this.struckEnemyParry = true
        }
        setTimeout(()=>{
            this.struckEnemyParry=false
        }, 1000)
    }

    update(enemyPosition) {
        this.updateVelocity()

        //DEBUGGING BLOCK PLAYER 1 STATES
        /*
        if(this.playerNumber==1){
            //console.log("Dying:", this.isDying)
            //console.log("Respawning, this.isRespawning")
        }
            */
        //PLAYER STATE CHECKS
        //ignores succesfullyStruck if any of these are met. I don't think this check order causes any bugs (none of the first conditions should coexist) but this would be a place to look if weird behaviour happens
        if(this.successfullyParried){
            this.velocity={x:0,y:0}
            this.facing='S'
            //succesful parry logic
        } else if(this.isClashing){
            this.velocity={x:0,y:0}
            this.successfullyStruck=false
        } else if(this.isDying){
            this.velocity={x:0,y:0}
            this.successfullyStruck=false
            //console.log("DYING PLAYER:", this.playerNumber)
        } else if(this.isRespawning){
            this.position={x:100,y:100}
            this.respawn()
        }else if(this.successfullyStruck){
            //console.log("SuccesfullyStruck block entered. Is he parying?", this.parry.isParrying)
            if(this.isRespawning){
                //console.log("respawning block entered")
                this.successfullyStruck=false
            } else if(this.parry.isParrying){
                //console.log("succesfulyParry block entered")
                this.successfulParry()
            } else if(this.strikeRecency>0.6){
                this.clash()
            }else{
                this.die()
            }
        }

        
        //Count down strikeRecency, used for determining behaviour right after a strike
        if(this.strikeRecency>0){
            this.strikeRecency-=0.1
        }
        
        //Set velocity to 0 if player would be passed boundary on next frame
        //Update velocity/speedDebuff if the player is supposed to be in lag for something
        if(this.struckEnemyParry){
            this.velocity = {x:0,y:0}
        }
        if(this.position.y + this.height*this.animationScale+this.velocity.y >= this.mapHeight||(this.position.y+this.velocity.y<= 0)){
            this.velocity.y=0
        }
        if(this.position.x +this.width*this.animationScale +this.velocity.x>= this.mapWidth||(this.position.x+this.velocity.x<0)){
            this.velocity.x=0
        }
        if(this.strikeRecency>this.strikeLag){
            this.velocity.x=0
            this.velocity.y=0
        }
        if(this.parry.isParrying){
            this.speedDebuff=10
        } else if(this.parry.recentParry){
            if(this.speedDebuff<4){
                this.speedDebuff=4
            }
        }

        //All velocity calculations complete, add to position
        this.position.y += this.velocity.y
        this.position.x += this.velocity.x

        //Update "Facing" direction and running tag based on velocity.
        if(this.velocity.x>0&&this.velocity.y==0){
            this.facing='E'
            this.isRunning=true
        } else if(this.velocity.x>0&&this.velocity.y>0){
            this.facing='SE'
            this.isRunning=true
        } else if(this.velocity.x>0&&this.velocity.y<0){
            this.facing='NE'
            this.isRunning=true
        } else if(this.velocity.x<0&&this.velocity.y==0){
            this.facing='W'
            this.isRunning=true
        } else if(this.velocity.x<0&&this.velocity.y>0){
            this.facing='SW'
            this.isRunning=true
        } else if(this.velocity.x<0&&this.velocity.y<0){
            this.facing='NW'
            this.isRunning=true
        } 
        if(this.velocity.y>0 && this.velocity.x==0){
            this.facing='S'
            this.isRunning=true
        } else if(this.velocity.y<0 && this.velocity.x==0){
            this.facing='N'
            this.isRunning=true
        }
        if(this.velocity.x==0&&this.velocity.y==0){
            if(this.facing=='SW'||this.facing=='NW'){
                this.facing='W'
            }
            if(this.facing=='SE'||this.facing=='NE'){
                this.facing='E'
            }
            this.isRunning=false
        }
        
        //If the strikepoint connected to the player is placed, detect if he is in it's radius.
        //If he is then strike. (See the method for comments on what it does)
        if(this.point){
            if(this.detectCircleFighterCollision(this.point.truePosX,this.point.truePosY,this.point.radius, this)&&!this.isSetting){


                //console.log("IN CIRCLE", true)
                this.point.strike(enemyPosition)
                this.point = null
                this.strikeRecency = 1.1;
                this.animCount=0
                //cleanse parry debuff
                this.recentParry=false
            }

        }
        //TODO: Replace this with socket method that sends necessary attributes to SwordFighterUI in client so that it can draw
        //this.draw()
    }

    updateVelocity(){
        //Logic for decreasing speed of player after initial movement 
        // Get the currentMovementKey from the last of the pressed keys array
        this.currentMovementKey = this.inputData.keysPressed[this.inputData.keysPressed.length - 1]
        if(this.strikeRecency>0){
            this.speedDebuff=-(this.strikeRecency)*10
        }
        else{
            if((this.previousFacing === this.facing) && (this.speedDebuff < 7.5)){
                this.speedDebuff += 0.6
            } else if(this.previousFacing == this.facing&&this.previousMovementKey!=this.currentMovementKey){
                this.speedDebuff = 0
            } else if(this.previousFacing != this.facing){
                this.speedDebuff = 0
            }
        }
        

        

        this.velocity.x = 0
        this.velocity.y = 0

        const speed = 15 - this.speedDebuff;
        const isMovingVertically = this.inputData.keys.w.pressed || this.inputData.keys.s.pressed;
        const isMovingHorizontally = this.inputData.keys.a.pressed || this.inputData.keys.d.pressed;

        // Normalize diagonal speed to prevent faster movement
        const diagonalSpeed = isMovingVertically && isMovingHorizontally ? speed / Math.sqrt(2) : speed;

        if (this.inputData.keys.a.pressed) {
            this.velocity.x = -diagonalSpeed;
        }
        if (this.inputData.keys.d.pressed) {
            this.velocity.x = diagonalSpeed;
        }
        if (this.inputData.keys.w.pressed) {
            this.velocity.y = -diagonalSpeed;
        }
        if (this.inputData.keys.s.pressed) {
            this.velocity.y = diagonalSpeed;
        }

        this.previousFacing = this.facing;  // Update the lastMovementKey for next frame comparison
        this.previousMovementKey = this.currentMovementKey
    }


    setStrikePoint(strikeData, cameraPos) {
        //Make sure he isin't already setting, so you can't cancel one set with another.
        //The animation isin't very long to begin with but it's just a small delay so you can't instantly readjust
        if(!this.isSetting&&!this.parry.isParrying&&!this.isDying&&!this.successfullyParried&&!this.struckEnemyParry){
            this.isSetting = true

            
            //the "-7s" here are to offset the top corner of the screen, which is just occupied by whitespace. I might need to actually deal with this in HTML/CSS later, make the game fullscreen offrip or something, since that white space may or may not be different            this.point = new StrikePoint({position: {x: mouseX -7, y: mouseY-7},ownerFighter:this.self})
            this.point = new StrikePoint({position: {x: strikeData.mouse.x, y: strikeData.mouse.y},ownerFighter:this.self,cameraPos:cameraPos})
            //This is the delay, 0.5 seconds before the tag (this.isSetting) becomes false
            //console.log("B. Set point with following data:", this.point)
            setTimeout(()=>{
                this.isSetting=false
            }, 500)
        }
    }

    beginParrying() {
        //If the player is in a strike recency, they can't parry
        if(!this.isSetting&&!this.recentParry&&!this.isDying&&!this.successfullyParried){
            this.parry.isParrying = true
            this.parry.recentParry = true;
            //console.log("Parrying Player", this.playerNumber)
            //logic for parrying
            setTimeout(()=>{
                this.parry.isParrying=false
                //console.log("Parry complete")
            }, 900)
            setTimeout(()=>{
                //console.log("Recent parry elapsed")
                this.parry.recentParry=false
            }, 2000)
        }
    }

    successfulParry(){
        //console.log("Successfully Parried!", this.playerNumber)
        this.successfullyParried=true
        this.successfullyStruck=false
        setTimeout(()=>{
            this.successfullyParried=false
            
        },1000)
    }
    die(){
        //console.log("Killing player " + this.playerNumber)
        this.isDying=true
        this.successfullyStruck=false
        setTimeout(()=>{
            this.isDying=false
            this.isRespawning=true
        },4000)
    }
    clash(){
        this.isClashing=true
        this.successfullyStruck=false
        setTimeout(()=>{
            this.isClashing=false
        }, 250)
    }
    respawn(){
        //console.log("Respawning player...")
        /* I want to say these cause no issues... but I really don't know. Should test
        this.isClashing = false
        this.isDying = false
        this.isSetting = false
        this.struckEnemyParry = false
        */
        setTimeout(()=>{
            //console.log("Player " + this.playerNumber + " respawned")
            this.isRespawning=false
        },1000)
    }

    detectCircleFighterCollision(circleCenterX, circleCenterY, circleRadius, fighter) {
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
}



module.exports = {SwordFighter, StrikePoint}