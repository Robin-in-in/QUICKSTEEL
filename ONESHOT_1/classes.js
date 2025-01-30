const index = require('index.js');

//List all background images here, drawn within draw loop
const background = new Map({position: {x:0,y:0}, imageSrc:'../assets/images/background1',width: 1950,height: 1300,upscale:1})

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

    draw() {
        c.imageSmoothingEnabled=false;
        c.drawImage(this.strikeCircle,0,0,this.radius*2,this.radius*2,this.screenPosition.x+(camera.x-this.initialCamX)-this.scaling*this.radius,this.screenPosition.y+(camera.y-this.initialCamY)-this.scaling*this.radius,this.radius*2*this.scaling,this.radius*2*this.scaling)
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

class Map{
    constructor({position, imageSrc, width, height,upscale}) {
        this.position = position
        this.mapImage = new Image()
        this.mapImage.src = imageSrc
        this.width = width
        this.height = height
        this.upscale=upscale

        this.animCount=0
    }

    draw() {
        //c.drawImage(this.image, this.position.x, this.position.y)
        c.drawImage(this.mapImage,0,0,this.width/this.upscale,this.height/this.upscale,this.position.x,this.position.y,this.width,this.height)

    }

    draw({position}) {
        this.position=position
        //c.drawImage(this.mapImage, this.position.x, this.position.y)
        c.drawImage(this.mapImage,0,0,this.width/this.upscale,this.height/this.upscale,this.position.x,this.position.y,this.width,this.height)

    }

    animateMap({position,start,max,slowdown}){
        if(this.animCount>=max){
            this.animCount=start
        }
        //console.log("max", max)
        //console.log("start", start)
        //console.log("mapAnimCount:", this.animCount)
        //console.log("Map positionX", position.x)
        this.position=position
        c.drawImage(this.mapImage,488*(Math.floor(this.animCount/slowdown)),0,this.width/this.upscale,this.height/this.upscale,this.position.x,this.position.y,this.width,this.height)
        this.animCount+=1
    }

    update() {
        this.draw()
    }
}  

class SwordFighter{
    constructor({playerID}) {
        //TODO: Player animation and opacity stuff needs to be moved to some frontend swordfighter thing
        //I think some opacity stuff is directly related to game logic so need to figure that out
        //Need to move calculation of position velocity to this version of swordfighter, only need facing and input key list from client
        this.self=this

        this.position = 0
        this.velocity = 0

        //Map attributes needed so player doesn't leave boundaries
        this.mapWidth=map.width
        this.mapHeight=map.height

        //Dimensions of original sprite
        this.height=50
        this.width=50
        
        //Attributes
        this.isSetting = false
        this.isParrying = false
        this.point = null;
        this.isRunning = false
        this.facing = 'S'


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

        this.currentMovementKey
        this.previousMovementKey
        this.previousFacing
    }

    update() {
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
        if(this.isParrying){
            speedDebuff=10
        } else if(this.recentParry){
            if(speedDebuff<4){
                speedDebuff=4
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
        console.log("Facing:", this.facing)
        
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

    move(keys){
        //Logic for decreasing speed of player after initial movement 
        // Get the currentMovementKey from the last of the pressed keys array
        this.currentMovementKey = keysPressed[keysPressed.length - 1]
        if(this.strikeRecency>0){
            speedDebuff=-(this.strikeRecency)*10
        }
        else{
            if((this.previousFacing === this.facing) && (speedDebuff < 7.5)){
                speedDebuff += 0.6
            } else if(this.previousFacing == this.facing&&this.previousMovementKey!=this.currentMovementKey){
                speedDebuff = 0
            } else if(this.previousFacing != this.facing){
                speedDebuff = 0
            }
        }
        

        

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

        this.previousFacing = this.facing;  // Update the lastMovementKey for next frame comparison
        this.previousMovementKey = this.currentMovementKey
    }


    setStrikePoint() {
        //Make sure he isin't already setting, so you can't cancel one set with another.
        //The animation isin't very long to begin with but it's just a small delay so you can't instantly readjust
        if(!this.isSetting&&!this.isParrying){
            this.isSetting = true

            //Play random set sound
            set.currentTime = 0;
            set.volume = 0.65;
            let randomOutcome = Math.floor(Math.random()*3)
            if(randomOutcome==0){
                set.src="public/assets/sounds/fox_set_1.mp3"
            } else if(randomOutcome==1){
                set.src="public/assets/sounds/fox_set_2.mp3"
            } else if(randomOutcome==2){
                set.src="public/assets/sounds/fox_set_3.mp3"
            }
            set.play()

            //the "-7s" here are to offset the top corner of the screen, which is just occupied by whitespace. I might need to actually deal with this in HTML/CSS later, make the game fullscreen offrip or something, since that white space may or may not be different            this.point = new StrikePoint({position: {x: mouseX -7, y: mouseY-7},ownerFighter:this.self})
            this.point = new StrikePoint({position: {x: mouseX -canvasOffsetX, y: mouseY-64},ownerFighter:this.self})
            //This is the delay, 0.5 seconds before the tag (this.isSetting) becomes false
            setTimeout(()=>{
                this.isSetting=false
            }, 500)
        }
    }

    parry() {
        //If the player is in a strike recency, they can't parry
        if(!this.isSetting&&!this.recentParry){
            console.log("PARRYING", this.recentParry)
            set.pause();
            set.currentTime = 0;
            parry1.pause();
            parry1.currentTime = 0;
            parry2.pause();
            parry2.currentTime = 0;
            parry3.pause();
            parry3.currentTime = 0;

            this.isParrying = true
            this.recentParry = true;
            let randomOutcome = Math.floor(Math.random()*3)
            if(randomOutcome==0){
                parry1.play()
            } else if(randomOutcome==1){
                parry2.play()
            } else if(randomOutcome==2){
                parry3.play()
            }
            //logic for parrying
            setTimeout(()=>{
                this.isParrying=false
            }, 250)
            setTimeout(()=>{
                this.recentParry=false
            }, 2000)
        }
    }
}