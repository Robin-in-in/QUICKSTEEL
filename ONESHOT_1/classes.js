class StrikePoint{
    constructor({position, ownerFighter, color = 'blue'}){
        this.self = this
        this.screenPosition = position
        this.truePosX = position.x + Math.abs(camera.x)
        this.truePosY = position.y + Math.abs(camera.y)
        this.radius = 175
        this.color = color
        this.initialCamX=camera.x
        this.initialCamY=camera.y
        this.strikeCircle = new Image()
        this.strikeCircle.src = "public/assets/images/StrikePoint.png"
        this.scaling=1.2
        this.fighter=ownerFighter
    }

    update() {
        this.draw()
    }

    //Update owner fighter's position to center of strike point
    strike() {
        this.fighter.position.x = this.truePosX-(this.fighter.width*this.fighter.animationScale/2)
        this.fighter.position.y = this.truePosY-(this.fighter.height*this.fighter.animationScale/2)
        let randomOutcome = Math.floor(Math.random()*3)
        if(randomOutcome==0){
            slash1.volume=0.7
            slash1.currentTime = 0;
            slash1.play()
        } else if(randomOutcome==1){
            slash2.volume=0.7
            slash2.currentTime = 0;
            slash2.play()
        } else if(randomOutcome==2){
            slash3.volume=0.7
            slash3.currentTime = 0;
            slash3.play()
        }
    }
}



class SwordFighter{
    constructor({fighterID}) {
        //TODO: Player animation and opacity stuff needs to be moved to some frontend swordfighter thing
        //I think some opacity stuff is directly related to game logic so need to figure that out
        //Need to move calculation of position velocity to this version of swordfighter, only need facing and input key list from client
        this.self=this
        this.fighterID = fighterID

        this.position = {x:0,y:0}
        this.velocity = {x:0,y:0}

        //Map attributes needed so player doesn't leave boundaries
        this.mapWidth=1950
        this.mapHeight=1300

        //Dimensions of original sprite
        this.height=50
        this.width=50
        this.animationScale=2.2
        
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

        //All of these are to create the vectors necessary to adjust the position of the strike trace thing on screen
        this.preStrikeX = 0
        this.preStrikeCamX = 0
        this.preStrikeY = 0
        this.preStrikeCamY = 0
        this.postStrikeX = 0
        this.postStrikeCamX = 0
        this.postStrikeY = 0
        this.postStrikeCamY = 0

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

    refreshAttributes(){

    }

    update() {
        this.updateVelocity()

        if(this.strikeRecency>0){
            this.strikeRecency-=0.1
        }
        
        //Set velocity to 0 if player would be passed boundary on next frame, or if the player is in lag for something
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

        //add velocity to the position
        this.position.y += this.velocity.y
        this.position.x += this.velocity.x

        //Update "Facing" direction and running tag based on velocity.
        //Will need to update this if there's an action other than running that gives velocity
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
            if(detectCircleFighterCollision(this.point.truePosX,this.point.truePosY,this.point.radius, this)&&!this.isSetting){


                console.log("IN CIRCLE", true)
                this.point.strike()
                this.postStrikeX=this.position.x +camera.x
                this.postStrikeY=this.position.y +camera.y
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
            player.velocity.x = -diagonalSpeed;
        }
        if (this.inputData.keys.d.pressed) {
            player.velocity.x = diagonalSpeed;
        }
        if (this.inputData.keys.w.pressed) {
            player.velocity.y = -diagonalSpeed;
        }
        if (this.inputData.keys.s.pressed) {
            player.velocity.y = diagonalSpeed;
        }

        this.previousFacing = this.facing;  // Update the lastMovementKey for next frame comparison
        this.previousMovementKey = this.currentMovementKey
    }


    setStrikePoint(strikeData) {
        //Make sure he isin't already setting, so you can't cancel one set with another.
        //The animation isin't very long to begin with but it's just a small delay so you can't instantly readjust
        if(!this.isSetting&&!this.parry.isParrying){
            this.isSetting = true

            

            //the "-7s" here are to offset the top corner of the screen, which is just occupied by whitespace. I might need to actually deal with this in HTML/CSS later, make the game fullscreen offrip or something, since that white space may or may not be different            this.point = new StrikePoint({position: {x: mouseX -7, y: mouseY-7},ownerFighter:this.self})
            this.point = new StrikePoint({position: {x: strikeData.mouse.x -strikeData.canvasOffset.x, y: strikeData.mouse.y-strikeData.canvasOffset.y},ownerFighter:this.self})
            //This is the delay, 0.5 seconds before the tag (this.isSetting) becomes false
            setTimeout(()=>{
                this.isSetting=false
            }, 500)
        }
    }

    parry() {
        //If the player is in a strike recency, they can't parry
        if(!this.isSetting&&!this.recentParry){
            this.parry.isParrying = true
            this.parry.recentParry = true;
            //logic for parrying
            setTimeout(()=>{
                this.parry.isParrying=false
            }, 250)
            setTimeout(()=>{
                this.parry.recentParry=false
            }, 2000)
        }
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