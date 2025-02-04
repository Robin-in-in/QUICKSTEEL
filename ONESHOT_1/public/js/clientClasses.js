//Dynamically adjustsposition of things on screen based of things 
class Camera {
    //TODO: Should all be calculated in backend and return the updated positions in emit to sender 
    //WILL NEED: mapWidth, mapHeight (should both be locally availabposition, fighterID (locally available, unless I decide to update it every update to prevent big bugs)
    constructor(mapWidth, mapHeight, fighter) {
      this.fighter = fighter
      this.position = ({x:(mapWidth/2),y:(mapHeight/2)})
      this.smoothness = 0.5; // Adjust for desired smoothness

      this.mapImage = new Image()
      this.mapImage.src = background.imageSrc
    }
  
    update() {
      let targetX = -(this.fighter.position.x - (canvas.width / 2));
      let targetY = -(this.fighter.position.y - (canvas.height / 2));

      targetX = Math.min(0, Math.max(targetX, -(mapWidth) + canvas.width));
      targetY = Math.min(0, Math.max(targetY, -(mapHeight) + canvas.height));

      // Smoothly move the camera
      this.x += (targetX - this.position.x) * this.smoothness;
      this.y += (targetY - this.position.y) * this.smoothness;
    }

    mapDraw(){
        c.drawImage(this.mapImage,0,0,this.width/this.upscale,this.height/this.upscale,this.fighter.position.x,this.fighter.position.y,this.width,this.height)
    }

    mapAnimate(){
        if(this.mapAnimCount>=max){
            this.mapAnimCount=start
        }
        this.position=position
        c.drawImage(this.mapImage,488*(Math.floor(this.mapAnimCount/slowdown)),0,this.width/this.upscale,this.height/this.upscale,this.fighter.position.x,this.fighter.position.y,this.width,this.height)
        this.mapAnimCount+=1
    }
}

class SwordFighterUI{
    constructor(width,height,fighterID, mapWidth, mapHeight){
    //Player Animation
    this.animCount=0
    this.animLayer=0
    this.animSlowdown=0
    this.imageFox=new Image()
    this.imageFox.src="../assets/images/IdleFoxS.png"
    this.width=width
    this.height=height

    this.position = {x:0, y:0}

    this.camera = new Camera({mapWidth: mapWidth, mapHeight: mapHeight, player: this})

    //Player attributes
    this.facing = 'S'
    this.isRunning = false
    this.isSetting = false
    this.isParrying = false
    this.strikeRecency = 0
    this.speedDebuff = 0

    //Cloud(Trace) Animation
    this.traceDrawn=false
    this.cloudAnimCount=0
    this.imageCloud=new Image()
    this.imageCloud.src="../assets/images/DashCloud.png"

    //Strike Animation
    this.opacityRemovalRate = 0.1

    //General Animation
    this.animationScale=2.2
    this.preStrikeCamX= this.camera.x
    this.preStrikeCamY= this.camera.y
    this.currentStrikeOpacity = 0;

    this.fighterID = fighterID
    
    }

    refreshAttributes(width,height,fighterID,position, facing, isRunning, isSetting, isParrying, strikeRecency, speedDebuff){
        if(this.fighterID == fighterID){
            this.facing = facing
            this.isRunning = isRunning
            this.isSetting = isSetting
            this.isParrying = isParrying
            this.strikeRecency = strikeRecency
            this.speedDebuff = speedDebuff
            this.width=width
            this.height=height
            this.position = position
        }     
    }

    //Turn this from a method into a socket on recieve event
    //Will need camera, strikeRecency, id  preStrikeCamX, preStrikeCamY (<-I can get those two natively from client I think?)
    draw() {
        //FIRST Draw the strike trace if there should be one. Do this first so that anything else is drawn over it




        /*This is really not my favourite way to do this, but it's the only way I can think of right now. postStrikeCamX and postStrikeCamY should only be updated once per strike, 
         I don't know if frame skipping might have a chance to break this though. I'm leaving a bit of margin of error to update between 1.1 ad 0.9, so that it doesn't break if it's not exactly 1.0
         This should theoretically prevent the strike trace from going scitzo on most setups, but it's a possibility for sure.*/
        if(this.strikeRecency>0.9){
            this.postStrikeCamX=this.camera.position.x
            this.postStrikeCamY=this.camera.position.y
            drawStrike()
        } else if(this.strikeRecency>0){
            drawStrike()
        }
        else{
            this.preStrikeX=this.position.x+this.camera.position.x
            this.preStrikeY=this.position.y+this.camera.position.y
            this.preStrikeCamX=this.camera.position.x
            this.preStrikeCamY=this.camera.position.y
        }

        //SECOND These are all the animations related to the actual player, seperated for clarity
        //Hierarchy: Striking > Setting > Running > Idle
        if(this.strikeRecency>0){
            this.imageFox.src="../assets/images/StrikeFoxSanim.png"
            this.animateSwordFighter(4,12,0,this.animationScale)
        } else{
            if(this.isParrying){
                console.log("PARRY")
                this.imageFox.src="../assets/images/ParryFoxFull.png"
                this.animateSwordFighter(4,16,0,this.animationScale)
                set.pause();
                set.currentTime = 0;
                parry1.pause();
                parry1.currentTime = 0;
                parry2.pause();
                parry2.currentTime = 0;
                parry3.pause();
                parry3.currentTime = 0;

                
                let randomOutcome = Math.floor(Math.random()*3)
                if(randomOutcome==0){
                    parry1.play()
                } else if(randomOutcome==1){
                    parry2.play()
                } else if(randomOutcome==2){
                    parry3.play()
                }
            }
            else if(this.isSetting){
                this.imageFox.src="../assets/images/IsSetting.png"
                this.animateSwordFighter(7,49,0,this.animationScale)
            }else{
                if(this.isRunning){
                    if(this.facing=='S'){
                        this.imageFox.src="../assets/images/RunFoxS.png"
                        this.animateSwordFighter(10,30,0,this.animationScale)   
                    } else if(this.facing=='SW'){
                        this.imageFox.src="../assets/images/RunFoxSW.png"
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    } else if(this.facing=='SE'){
                        this.imageFox.src="../assets/images/RunFoxSE.png"
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    }else if(this.facing=='N'){
                        this.imageFox.src="../assets/images/RunFoxNsheet.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                        
                    } else if(this.facing=='NE'){
                        this.imageFox.src="../assets/images/RunFoxNE.png"
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    }else if(this.facing=='NW'){
                        this.imageFox.src="../assets/images/RunFoxNW.png"
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    }else if(this.facing=='W'){
                        this.imageFox.src="../assets/images/RunFoxW.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    } else if(this.facing=='E'){
                        this.imageFox.src="../assets/images/RunFoxE.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    }
                } else{
                    if(this.facing=='S'){
                        this.imageFox.src="../assets/images/IdleFoxS.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    } else if(this.facing=='N'){
                        this.imageFox.src="../assets/images/IdleFoxN.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    } else if(this.facing=='W'){
                        this.imageFox.src="../assets/images/IdleFoxW.png"
                        this.animateSwordFighter(10,60,0,this.animationScale)
                    } else if(this.facing=='E'){
                        this.imageFox.src="../assets/images/IdleFoxE.png"
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    }
                }
            }
        }
    }
    
    drawStrike(){
        this.currentStrikeOpacity = this.strikeRecency
        c.strokeStyle = 'rgba(216, 229, 234, '+this.currentStrikeOpacity+')';
        c.lineWidth = 20;                           
        c.lineCap = 'butt';
        //This is the strike trace. If you need to understand this and are confused, ask me to relearn it quickly and ill explain it on discord                      
        c.beginPath();           
        c.moveTo(this.preStrikeX+(this.postStrikeCamX-this.preStrikeCamX)+((localPlayerWidth/2)*this.animationScale), this.preStrikeY+(this.postStrikeCamY-this.preStrikeCamY)+((localPlayerWidth/2)*this.animationScale));      
        c.lineTo(this.postStrikeX+(this.postStrikeCamX-this.preStrikeCamX)+((localPlayerWidth/2)*this.animationScale), this.postStrikeY+(this.postStrikeCamY-this.preStrikeCamY)+((localPlayerWidth/2)*this.animationScale));     
        c.stroke(); 
    }
    //WILL NEED: scaling (Decide if that should be client or server), height (localPlayerWidth(position, camera, facing
    drawCloud(){
        if(this.traceDrawn==false){
            this.traceDrawn=true
            if(speedDebuff<3&&this.isRunning&&this.strikeRecency<=0){
                if(this.facing=='S'){
                    this.imageCloud.src="../assets/images/DashTraceS.png"
                    c.drawImage(this.imageCloud,0,0,localPlayerWidth,localPlayerHeight,this.position.x + this.camera.position.x,this.position.y + this.camera.position.y - localPlayerHeight/2,localPlayerWidth*this.animationScale,localPlayerHeight*this.animationScale)
                } else if(this.facing=='N'){
                    this.imageCloud.src="../assets/images/DashTraceN.png"
                    c.drawImage(this.imageCloud,0,0,localPlayerWidth,localPlayerHeight,this.position.x + this.camera.position.x,this.position.y + this.camera.position.y + localPlayerHeight, localPlayerWidth*this.animationScale,localPlayerHeight*this.animationScale)
                } else if(this.facing=='W'){
                    this.imageCloud.src="../assets/images/DashTraceW.png"
                    c.drawImage(this.imageCloud, 0, 0, localPlayerWidth, localPlayerHeight, this.position.x + this.camera.position.x+localPlayerWidth/2, this.position.y + this.camera.position.y,localPlayerWidth * this.animationScale,localPlayerHeight * this.animationScale);
                } else if (this.facing == 'E') {
                    this.imageCloud.src = "../assets/images/DashTraceE.png"
                    c.drawImage(this.imageCloud,0,0,localPlayerWidth,localPlayerHeight,this.position.x + this.camera.position.x-localPlayerWidth/2,this.position.y + this.camera.position.y,localPlayerWidth*this.animationScale,localPlayerHeight*this.animationScale)
                } else if (this.facing == 'NE') {
                    this.imageCloud.src = "../assets/images/DashTraceNE.png";
                    c.drawImage(this.imageCloud, 0, 0, localPlayerWidth, localPlayerHeight, this.position.x + this.camera.position.x - localPlayerWidth/2.5, this.position.y + this.camera.position.y + localPlayerHeight/2, localPlayerWidth * this.animationScale, localPlayerHeight * this.animationScale);
                } else if (this.facing == 'NW') {
                    this.imageCloud.src = "../assets/images/DashTraceNW.png";
                    c.drawImage(this.imageCloud, 0, 0, localPlayerWidth, localPlayerHeight, this.position.x + this.camera.position.x + localPlayerWidth/2.5, this.position.y + this.camera.position.y + localPlayerHeight/2, localPlayerWidth * this.animationScale, localPlayerHeight * this.animationScale);
                } else if (this.facing == 'SE') {
                    this.imageCloud.src = "../assets/images/DashTraceSE.png";
                    c.drawImage(this.imageCloud, 0, 0, localPlayerWidth, localPlayerHeight, this.position.x + this.camera.position.x - localPlayerWidth/2.5, this.position.y + this.camera.position.y - localPlayerHeight/2, localPlayerWidth * this.animationScale, localPlayerHeight * this.animationScale);
                } else if (this.facing == 'SW') {
                    this.imageCloud.src = "../assets/images/DashTraceSW.png";
                    c.drawImage(this.imageCloud, 0, 0, localPlayerWidth, localPlayerHeight, this.position.x + this.camera.position.x + localPlayerWidth/2.5, this.position.y + this.camera.position.y - localPlayerHeight/2, localPlayerWidth * this.animationScale, localPlayerHeight * this.animationScale);
                }
            }
        }
    }

    //WILL NEED: animCount (I think that's client now), 
    animateSwordFighter(slowdown,max,start){

        //Draw cloud/trace behind elements
        this.drawCloud(this.animationScale)

        if(this.animCount>=max){
            this.animCount=start
        }
        //Might be able to move this line to reduce operations
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
        
        c.drawImage(this.imageFox,50*(Math.floor(this.animCount/slowdown)),0,localPlayerWidth,localPlayerHeight,this.position.x + this.camera.position.x,position.y + this.camera.position.y,localPlayerWidth*this.animationScale,localPlayerHeight*this.animationScale)
        this.animCount+=1

        //Draw cloud/trace in front of elements (if necessary)
        this.drawCloud(this.animationScale)
        this.traceDrawn=false
    }
}

class StrikeCircleUI {
    constructor(radius, screenPosition){
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

        this.radius = radius
        this.screenPosition = screenPosition
    }

    draw() {
        c.imageSmoothingEnabled=false;
        c.drawImage(this.strikeCircle,0,0,this.radius*2,this.radius*2,this.screenPosition.x+(this.camera.position.x-this.initialCamX)-this.scaling*this.radius,this.screenPosition.y+(this.camera.position.y-this.initialCamY)-this.scaling*this.radius,this.radius*2*this.scaling,this.radius*2*this.scaling)
    }
}

class BackMap{
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
