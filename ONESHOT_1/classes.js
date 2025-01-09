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
        this.strikeCircle.src = "Images/StrikePoint.png"
        this.scaling=1
        this.fighter=ownerFighter
    }

    draw() {
        c.imageSmoothingEnabled=false;
        c.drawImage(this.strikeCircle,0,0,this.radius*2,this.radius*2,this.screenPosition.x+(camera.x-this.initialCamX)-this.radius,this.screenPosition.y+(camera.y-this.initialCamY)-this.radius,this.radius*2*this.scaling,this.radius*2*this.scaling)
    }

    update() {
        this.draw()
    }

    //Update owner fighter's position to center of strike point
    strike() {
        this.fighter.position.x = this.truePosX-(this.fighter.width*this.fighter.animationScale/2)
        this.fighter.position.y = this.truePosY-(this.fighter.height*this.fighter.animationScale/2)
    }
}

class Map{
    constructor({position, imageSrc, width, height}) {
        this.position = position
        this.image = new Image()
        this.image.src = imageSrc
        this.width = width
        this.height = height
    }

    draw() {
        c.drawImage(this.image, this.position.x, this.position.y)
    }

    draw({position}) {
        this.position=position
        c.drawImage(this.image, this.position.x, this.position.y)
    }

    update() {
        this.draw()
    }
}


//Dynamically adjusts the position of things on screen based of things 
class Camera {
    constructor({swordFighter, mapWidth, mapHeight}) {
      this.fighter= swordFighter
      this.mapWidth = mapWidth;
      this.mapHeight = mapHeight;
      this.x = (this.mapWidth/2);
      this.y = (this.mapHeight/2);
      this.smoothness = 0.5; // Adjust for desired smoothness
    }
  
    update() {
      // Calculate target position (center player on screen)
      let targetX = -(this.fighter.position.x - (canvas.width / 2));
      let targetY = -(this.fighter.position.y - (canvas.height / 2));

      //Prevent the camera from moving off the map
      targetX = Math.min(0, Math.max(targetX, -(this.mapWidth) + canvas.width));
      targetY = Math.min(0, Math.max(targetY, -(this.mapHeight) + canvas.height));

      // Smoothly move the camera
      this.x += (targetX - this.x) * this.smoothness;
      this.y += (targetY - this.y) * this.smoothness;
    }
}  

class SwordFighter{
    constructor({position, velocity, map}) {
        this.self=this

        this.position = position
        this.velocity = velocity

        //Map attributes needed so player doesn't leave boundaries
        this.mapHeight=map.width
        this.mapWidth=map.height

        //Dimensions of original sprite
        this.height=50
        this.width=50
        
        //Attributes
        this.isSetting = false
        this.point = null;
        this.isRunning = false
        this.facing = 'S'

        //Animation
        this.animCount=0
        this.animLayer=0
        this.animSlowdown=0
        this.imageFox=new Image()
        this.imageFox.src="Images/IdleFoxS.png"
        this.animationScale=2.5

        //Strike Attributes
        this.strikeRecency = 0
        this.strikeLag = 0.5
        this.opacityRemovalRate = 0.1

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

    draw() {
        //FIRST Draw the strike trace if there should be one. Do this first so that anything else is drawn over it
        console.log("recency", this.strikeRecency)
        if(this.strikeRecency>0){
            const currentOpacity = this.strikeRecency
            if(currentOpacity>1){
                const currentOpacity = 1 
            }
            this.postStrikeCamX=camera.x
            this.postStrikeCamY=camera.y
            c.strokeStyle = 'rgba(216, 229, 234, '+currentOpacity+')';
            c.lineWidth = 20;                           
            c.lineCap = 'butt';
            //This is the strike trace. If you need to understand this and are confused, ask me to relearn it quickly and ill explain it on discord                      
            c.beginPath();           
            c.moveTo(this.preStrikeX+(this.postStrikeCamX-this.preStrikeCamX)+((this.width/2)*this.animationScale), this.preStrikeY+(this.postStrikeCamY-this.preStrikeCamY)+((this.width/2)*this.animationScale));      
            c.lineTo(this.postStrikeX+(this.postStrikeCamX-this.preStrikeCamX)+((this.width/2)*this.animationScale), this.postStrikeY+(this.postStrikeCamY-this.preStrikeCamY)+((this.width/2)*this.animationScale));     
            c.stroke(); 
        }

        //SECOND These are all the animations related to the actual player
        //Hierarchy: Striking > Setting > Running > Idle
        if(this.strikeRecency>0){
            this.imageFox.src="Images/StrikeFoxSanim.png"
            this.animateSwordFighter(4,12,0,this.animationScale)
        } else{
            if(this.isSetting){
                this.imageFox.src="Images/IsSetting.png"
                this.animateSwordFighter(7,49,0,this.animationScale)
            }else{
                if(this.isRunning){
                    if(this.facing=='S'){
                        this.imageFox.src="Images/RunFoxS.png"
                        this.animateSwordFighter(10,30,0,this.animationScale)
                    } else if(this.facing=='SW'){
                        this.imageFox.src="Images/RunFoxSW.png"
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    } else if(this.facing=='SE'){
                        this.imageFox.src="Images/RunFoxSE.png"
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    }else if(this.facing=='N'){
                        this.imageFox.src="Images/RunFoxNsheet.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                        
                    } else if(this.facing=='NE'){
                        this.imageFox.src="Images/RunFoxNE.png"
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    }else if(this.facing=='NW'){
                        this.imageFox.src="Images/RunFoxNW.png"
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    }else if(this.facing=='W'){
                        this.imageFox.src="Images/RunFoxW.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    } else if(this.facing=='E'){
                        this.imageFox.src="Images/RunFoxE.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    }
                } else{
                    if(this.facing=='S'){
                        this.imageFox.src="Images/IdleFoxS.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    } else if(this.facing=='N'){
                        this.imageFox.src="Images/IdleFoxN.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    } else if(this.facing=='W'){
                        this.imageFox.src="Images/IdleFoxW.png"
                        this.animateSwordFighter(10,60,0,this.animationScale)
                    } else if(this.facing=='E'){
                        this.imageFox.src="Images/IdleFoxE.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    }
                }
            }
        }
        //FOR TESTING: Outlines where the players hurtbox would be.
        //c.fillRect(this.position.x+camera.x,this.position.y+camera.y, this.width*this.animationScale, this.height*this.animationScale)
    }

    animateSwordFighter(slowdown,max,start,scaling){
        if(this.animCount>=max){
            this.animCount=start
        }
        c.imageSmoothingEnabled=false;

        //This works by adjusting the sprite relative to the camera's postion. 
        // 
        // Say you're at the leftmost part of the map, and move your character right. The camera moves to the right to follow your character, but he also moves right on your screen.
        // 
        //  In this sense he moves right "twice". 
        // 
        // The camera corrects for this- if he moved right on the map, and the camera moved with it, this offset puts him back in the center of the screen.
        // 
        // If he moved right and the camera did NOT move with him, he moves right on your screen as normal.
        // 
        // 
        // The camera is acting as an offset to keep him on the center of your screen, as he moves across the map.

        c.drawImage(this.imageFox,50*(Math.floor(this.animCount/slowdown)),0,this.width,this.height,this.position.x + camera.x,this.position.y + camera.y,this.width*scaling,this.height*scaling)
        this.animCount+=1
    }

    update() {
        this.draw()
        if(this.strikeRecency>0){
            this.strikeRecency-=0.1
        }

        //Set velocity to 0 if player would be passed boundary on next frame, or if the player is in lag for something
        //THIS IS WHERE THE INVISIBLE WALL BUG IS, i couldn't figure it out yet though
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
                this.preStrikeX=this.position.x+camera.x
                this.preStrikeY=this.position.y+camera.y
                this.preStrikeCamX=camera.x
                this.preStrikeCamY=camera.y
                this.point.strike()
                this.postStrikeX=this.position.x +camera.x
                this.postStrikeY=this.position.y +camera.y
                this.point = null
                this.strikeRecency = 1.1;
                this.animCount=0
            }

        }
    }

    move(keys){
        //Logic for decreasing speed of player after initial movement 
        // Get the currentMovementKey from the last of the pressed keys array
        this.currentMovementKey = keysPressed[keysPressed.length - 1]
        
        if((this.previousFacing === this.facing) && (speedDebuff < 7.5)){
            speedDebuff += 0.6
        } else if(this.previousFacing == this.facing&&this.previousMovementKey!=this.currentMovementKey){
            speedDebuff = 0
        } else if(this.previousFacing != this.facing){
            speedDebuff = 0
        }
        
        /*
        //Something about this feels off- like too fast to me. 
        // I'm leaving it here though since we might think this version is sluggish. I think it will feel better when I add animations though
        // Definitely open to speeding up diagonal movement if animation doesn't fix it though - making debuff ceiling lower for diagonal or something like that.
        if((this.previousMovementKey == this.currentMovementKey) && (speedDebuff < 7.5)){
            speedDebuff += 0.6
        } else if(this.previousMovementKey != this.currentMovementKey){
            speedDebuff = 0
        }
        */
        //console.log("SpeedDebuff:", speedDebuff) 
        
        

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
        if(!this.isSetting){
            this.isSetting = true
            //the "-7s" here are to offset the top corner of the screen, which is just occupied by whitespace. I might need to actually deal with this in HTML/CSS later, make the game fullscreen offrip or something, since that white space may or may not be different            this.point = new StrikePoint({position: {x: mouseX -7, y: mouseY-7},ownerFighter:this.self})
            this.point = new StrikePoint({position: {x: mouseX -canvasOffsetX, y: mouseY-64},ownerFighter:this.self})
            //This is the delay, 0.5 seconds before the tag (this.isSetting) becomes false
            setTimeout(()=>{
                this.isSetting=false
            }, 500)
        }
    }
}