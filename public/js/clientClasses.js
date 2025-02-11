//Dynamically adjust position of things on screen based of things 
const canvas = document.querySelector('canvas')
canvas.width = 1280
canvas.height = 720
const c = canvas.getContext('2d')

//List all audio files here, played within draw loop 
let parry = new Audio("../assets/sounds/fox_parry_1.mp3")
let slash = new Audio("../assets/sounds/fox_slash_1.mp3")
let set = new Audio("../assets/sounds/fox_set_1.mp3")
let dying = new Audio("../assets/sounds/isDying_fox.mp3")
const backgroundWind = new Audio("../assets/sounds/backgroundWind.mp3")
backgroundWind.loop = true

class Camera {
    //TODO: Should all be calculated in backend and return the updated positions in emit to sender 
    //WILL NEED: mapWidth, mapHeight (should both be locally availabposition, fighterID (locally available, unless I decide to update it every update to prevent big bugs)
    constructor(mapWidth, mapHeight, player) {
      this.fighter = player
      this.mapWidth = mapWidth
      this.mapHeight = mapHeight
      this.postStrikeTarget = {
        x:0, 
        y:0
     }

      this.position = {
        x:this.mapWidth/2,
        y:this.mapHeight/2
      }

      this.smoothness = 0.25; // Adjust for desired smoothness
      this.background = new BackMap({x:0,y:0}, '../assets/images/background2.png',1950,1300,4)

      this.mapImage = new Image()
      this.mapImage.src = this.background.mapImage.src
    }
  
    update() {
        if(backgroundWind.paused){
            backgroundWind.play()
        }
        

      let targetX = -(this.fighter.position.x - (canvas.width / 2));
      let targetY = -(this.fighter.position.y - (canvas.height / 2));

      targetX = Math.min(0, Math.max(targetX, -(this.mapWidth) + canvas.width));
      targetY = Math.min(0, Math.max(targetY, -(this.mapHeight) + canvas.height));

      this.postStrikeTarget.x = targetX
      this.postStrikeTarget.y = targetY


      // Smoothly move the camera
      this.position.x += (targetX - this.position.x) * this.smoothness;
      this.position.y += (targetY - this.position.y) * this.smoothness;

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
    constructor(width,height,fighterID, mapWidth, mapHeight, playerScaling, playerNumber){
    //Player Animation
    this.animCount=0
    this.animLayer=0
    this.animSlowdown=0
    this.imageFox=new Image()
    this.playerNumber=playerNumber
    if(this.playerNumber>1){
        this.imageFox.src="../assets/images/IdleFoxS_blue.png"   
    } else{
        this.imageFox.src="../assets/images/IdleFoxS.png"
    }
    this.width=width
    this.height=height
    

    this.position = {x:0, y:0}

    this.initCamera(mapWidth,mapHeight)

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
    this.imageCloud.src="../assets/images/DashCloudS.png"

    //Strike Animation
    this.opacityRemovalRate = 0.1

    //General Animation
    this.animationScale=playerScaling
    this.preStrike = {cam: {x:0,y:0},player:{x:0,y:0}}
    this.postStrike = {cam: {x:0,y:0},player:{x:0,y:0}}
    this.currentStrikeOpacity = 0;

    //States
    this.successfullyParried = false
    this.isClashing = false
    this.isDying = false
    this.isRespawning = false
    this.struckEnemyParry = false

    this.fighterID = fighterID
    this.point = null
    
    }

    initCamera(mapWidth, mapHeight) {
        this.camera = new Camera(mapWidth, mapHeight, this)
    }

    refreshAttributes(width,height,fighterID,position, facing, isRunning, isSetting, isParrying, strikeRecency, speedDebuff, serverPointPosition, successfullyParried, isClashing, isDying, isRespawning, struckEnemyParry){
        if(this.fighterID == fighterID){
            this.facing = facing
            this.isRunning = isRunning
            this.isSetting = isSetting
            this.isParrying = isParrying
            this.strikeRecency = strikeRecency
            this.currentStrikeOpacity=0
            this.speedDebuff = speedDebuff
            this.width=width
            this.height=height
            this.position = position
            this.successfullyParried = successfullyParried
            this.isClashing = isClashing
            this.isDying = isDying
            this.isRespawning = isRespawning
            this.struckEnemyParry = struckEnemyParry
            if(this.constructor === SwordFighterUI){
                if(!this.point && serverPointPosition){
                    //console.log("Server Point Position", serverPointPosition)
                    this.point = new StrikeCircleUI(serverPointPosition, this)            
                } else if (this.point && !serverPointPosition){
                    this.point = null
                } else {
                    this.point.refresh(serverPointPosition)
                }
            }   
        }     
    }

    draw() {
        //If this is the player's character draw the background. This check is in place to make sure the enemy player doesn't draw the background as well.
        if(this.constructor === SwordFighterUI){
            this.camera.background.draw({position:{x:this.camera.position.x, y:this.camera.position.y}})
        }    
        
        //DEBUGGING STATE
        //console.log("Succesful Parry:",this.successfullyParried)
        //console.log("Dying", this.isDying)
        //console.log("Respawning", this.isRespawning)

        if(this.strikeRecency==0.9){
            this.postStrike.cam.x = this.camera.position.x
            this.postStrike.player.x = this.position.x + this.camera.position.x
            this.postStrike.cam.y = this.camera.position.y
            this.postStrike.player.y = this.position.y + this.camera.position.y
            slash.currentTime = 0;
            slash.volume = 0.65;
            let randomOutcome = Math.floor(Math.random()*3)
            if(randomOutcome==0){
                slash.src="../assets/sounds/fox_slash_1.mp3"
            } else if(randomOutcome==1){
                slash.src="../assets/sounds/fox_slash_2.mp3"
            } else if(randomOutcome==2){
                slash.src="../assets/sounds/fox_slash_3.mp3"
            }
            slash.play()
            set.pause()      
            this.drawStrike()
        } else if(this.strikeRecency>0&&this.strikeRecency<0.9){
            this.drawStrike()
        }
        else if(this.strikeRecency<=0){
            //console.log("Type using method:", this.constructor)
            //console.log ("CAMERA VAL", this.camera)
            this.preStrike.cam.x = this.camera.position.x
            this.preStrike.player.x = this.position.x + this.camera.position.x
            this.preStrike.cam.y = this.camera.position.y
            this.preStrike.player.y = this.position.y + this.camera.position.y
        }

        //SECOND These are all the animations related to the actual player, seperated for clarity
        //Hierarchy: Striking > Setting > Running > Idle
        if(this.struckEnemyParry){
            this.imageFox.src="../assets/images/StrikeFoxSanim.png"
            this.animateSwordFighter(21,63,62,this.animationScale)
        } else if(this.strikeRecency>0){
            this.imageFox.src="../assets/images/StrikeFoxSanim.png"
            this.animateSwordFighter(4,12,0,this.animationScale)
        } else{
            if(this.successfullyParried){
                if(this.playerNumber>1){
                    this.imageFox.src="../assets/images/ParryFoxFull_blue.png"
                } else{
                    this.imageFox.src="../assets/images/ParryFoxFull.png"
                }
                this.animateSwordFighter(15,60,59,this.animationScale)
                set.pause();
                set.currentTime = 0;
                if(parry.paused){
                    parry.currentTime = 0;
                    let randomOutcome = Math.floor(Math.random()*3)
                    if(randomOutcome==0){
                        parry.src="../assets/sounds/fox_parry_1.mp3"
                        parry.play()
                    } else if(randomOutcome==1){
                        parry.src="../assets/sounds/fox_parry_2.mp3"
                        parry.play()
                    } else if(randomOutcome==2){
                        parry.src="../assets/sounds/fox_parry_3.mp3"
                        parry.play()
                    }
                }   
            } else if(this.isDying){
                if(this.playerNumber==1){
                    this.imageFox.src="../assets/images/isDying_2.png"
                }else{
                    this.imageFox.src="../assets/images/isDying_2_blue.png"
                }
                this.animateSwordFighter(3,36,30,this.animationScale)
                console.log("is dying paused?", dying.paused)
                console.log("what's dying's currentTime?", dying.currentTime)
                if(dying.paused && dying.currentTime==0){
                    dying.play().catch(error => console.log("Playback error:", error));
                }
            } else if(this.isRespawning){
                dying.pause()
                dying.currentTime=0
                //console.log("(after respawning) is dying paused?", dying.paused)
                //console.log("(after respawning) what's dying's currentTime?", dying.currentTime)
            }else if(this.isParrying){
                this.imageFox.src="../assets/images/parryrednew.png"
                this.animateSwordFighter(2,16,15,this.animationScale)
            } else if(this.isSetting){
                if(this.playerNumber>1){
                    this.imageFox.src="../assets/images/IsSetting_blue.png"
                } else{
                    this.imageFox.src="../assets/images/IsSetting.png"
                }
                if(set.paused){
                    set.currentTime = 0;
                    set.volume = 0.65;
                    let randomOutcome = Math.floor(Math.random()*3)
                    if(randomOutcome==0){
                        set.src="../assets/sounds/fox_set_1.mp3"
                    } else if(randomOutcome==1){
                        set.src="../assets/sounds/fox_set_2.mp3"
                    } else if(randomOutcome==2){
                        set.src="../assets/sounds/fox_set_3.mp3"
                    }
                    set.play()
                }
                this.animateSwordFighter(7,49,0,this.animationScale)
            }else{
                if(this.isRunning){
                    if(this.facing=='S'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/RunFoxS_blue.png"
                        } else{
                           this.imageFox.src="../assets/images/RunFoxS.png" 
                        }
                        
                        this.animateSwordFighter(10,30,0,this.animationScale)   
                    } else if(this.facing=='SW'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/RunFoxSW_blue.png"
                        } else{
                            this.imageFox.src="../assets/images/RunFoxSW.png"
                        }
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    } else if(this.facing=='SE'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/RunFoxSE_blue.png"
                        } else{
                            this.imageFox.src="../assets/images/RunFoxSE.png"
                        }
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    }else if(this.facing=='N'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/RunFoxN_blue.png"
                        } else{
                            this.imageFox.src="../assets/images/RunFoxNsheet.png"
                        }
                        this.animateSwordFighter(10,20,0,this.animationScale)
                        
                    } else if(this.facing=='NE'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/RunFoxNE_blue.png"
                        } else{
                            this.imageFox.src="../assets/images/RunFoxNE.png"
                        }
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    }else if(this.facing=='NW'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/RunFoxNW_blue.png"
                        } else{
                            this.imageFox.src="../assets/images/RunFoxNW.png"
                        }
                        this.animateSwordFighter(10,40,20,this.animationScale)
                    }else if(this.facing=='W'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/RunFoxW_blue.png"
                        } else{
                            this.imageFox.src="../assets/images/RunFoxW.png" 
                        }
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    } else if(this.facing=='E'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/RunFoxE_blue.png"
                        } else{
                            this.imageFox.src="../assets/images/RunFoxE.png"
                        }
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    }
                } else{
                    if(this.facing=='S'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/IdleFoxS_blue.png"
                        } else{
                            this.imageFox.src="../assets/images/IdleFoxS.png"
                        }
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    } else if(this.facing=='N'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/IdleFoxN_blue.png"
                        } else{
                            this.imageFox.src="../assets/images/IdleFoxN.png"
                        }
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    } else if(this.facing=='W'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/IdleFoxW_blue.png"
                        } else{
                            this.imageFox.src="../assets/images/IdleFoxW.png"
                        }
                        this.animateSwordFighter(10,60,0,this.animationScale)
                    } else if(this.facing=='E'){
                        if(this.playerNumber>1){
                            this.imageFox.src="../assets/images/IdleFoxE_blue.png"
                        } else{
                            this.imageFox.src="../assets/images/IdleFoxE.png"
                        }
                        this.animateSwordFighter(10,20,0,this.animationScale)
                    }
                }
            }
        }
    }
    
    drawStrike(){
        c.strokeStyle = 'rgba(216, 229, 234, '+this.strikeRecency+')';
        c.lineWidth = 20;                           
        c.lineCap = 'square';

        //This is the strike trace. If you need to understand this and are confused, ask me to relearn it quickly and ill explain it on discord                      
        c.beginPath();           
        c.moveTo(this.preStrike.player.x+(this.camera.position.x-this.postStrike.cam.x)+(this.postStrike.cam.x-this.preStrike.cam.x)+((this.width/2)*this.animationScale), this.preStrike.player.y+(this.camera.position.y-this.postStrike.cam.y)+(this.postStrike.cam.y-this.preStrike.cam.y)+((this.width/2)*this.animationScale));      
        c.lineTo(this.postStrike.player.x+(this.camera.position.x-this.postStrike.cam.x)+((this.width/2)*this.animationScale), this.postStrike.player.y+(this.camera.position.y-this.postStrike.cam.y)+((this.width/2)*this.animationScale));     
        c.stroke(); 
    }
    //WILL NEED: scaling (Decide if that should be client or server), height (localPlayerWidth(position, camera, facing
    drawCloud(){
        if(this.traceDrawn==false){
            this.traceDrawn=true
            if(this.speedDebuff<3&&this.isRunning&&this.strikeRecency<=0){
                if(this.facing=='S'){
                    this.imageCloud.src="../assets/images/DashTraceS.png"
                    c.drawImage(this.imageCloud,0,0,this.width,this.height,this.position.x + this.camera.position.x,this.position.y + this.camera.position.y - this.height/2,this.width*this.animationScale,this.height*this.animationScale)
                } else if(this.facing=='N'){
                    this.imageCloud.src="../assets/images/DashTraceN.png"
                    c.drawImage(this.imageCloud,0,0,this.width,this.height,this.position.x + this.camera.position.x,this.position.y + this.camera.position.y + this.height, this.width*this.animationScale,this.height*this.animationScale)
                } else if(this.facing=='W'){
                    this.imageCloud.src="../assets/images/DashTraceW.png"
                    c.drawImage(this.imageCloud, 0, 0, this.width, this.height, this.position.x + this.camera.position.x+this.width/2, this.position.y + this.camera.position.y,this.width * this.animationScale,this.height * this.animationScale);
                } else if (this.facing == 'E') {
                    this.imageCloud.src = "../assets/images/DashTraceE.png"
                    c.drawImage(this.imageCloud,0,0,this.width,this.height,this.position.x + this.camera.position.x-this.width/2,this.position.y + this.camera.position.y,this.width*this.animationScale,this.height*this.animationScale)
                } else if (this.facing == 'NE') {
                    this.imageCloud.src = "../assets/images/DashTraceNE.png";
                    c.drawImage(this.imageCloud, 0, 0, this.width, this.height, this.position.x + this.camera.position.x - this.width/2.5, this.position.y + this.camera.position.y + this.height/2, this.width * this.animationScale, this.height * this.animationScale);
                } else if (this.facing == 'NW') {
                    this.imageCloud.src = "../assets/images/DashTraceNW.png";
                    c.drawImage(this.imageCloud, 0, 0, this.width, this.height, this.position.x + this.camera.position.x + this.width/2.5, this.position.y + this.camera.position.y + this.height/2, this.width * this.animationScale, this.height * this.animationScale);
                } else if (this.facing == 'SE') {
                    this.imageCloud.src = "../assets/images/DashTraceSE.png";
                    c.drawImage(this.imageCloud, 0, 0, this.width, this.height, this.position.x + this.camera.position.x - this.width/2.5, this.position.y + this.camera.position.y - this.height/2, this.width * this.animationScale, this.height * this.animationScale);
                } else if (this.facing == 'SW') {
                    this.imageCloud.src = "../assets/images/DashTraceSW.png";
                    c.drawImage(this.imageCloud, 0, 0, this.width, this.height, this.position.x + this.camera.position.x + this.width/2.5, this.position.y + this.camera.position.y - this.height/2, this.width * this.animationScale, this.height * this.animationScale);
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
        
        c.drawImage(this.imageFox,50*(Math.floor(this.animCount/slowdown)),0,this.width,this.height,this.position.x + this.camera.position.x,this.position.y + this.camera.position.y,this.width*this.animationScale,this.height*this.animationScale)
        this.animCount+=1

        //Draw cloud/trace in front of elements (if necessary)
        this.drawCloud(this.animationScale)
        this.traceDrawn=false
    }
}

class EnemySwordFighterUI extends SwordFighterUI{
    constructor(width,height,fighterID, playerScaling, playerNumber, mainFighter){
        //Player Animation
        super(width, height, fighterID, null, null, playerScaling, playerNumber)
        this.mainFighterRef = mainFighter
        this.initToMainCamera()     
    }

    initToMainCamera(){
        this.initCamera()
    }

    initCamera(){
        this.camera = this.mainFighterRef ? this.mainFighterRef.camera : null
    }

    drawCloud(){
        return
    }
}

class StrikeCircleUI {
    constructor(screenPosition, player){
        //Play random set sound

        this.fighter = player
        this.strikeCircle = new Image()
        this.strikeCircle.src = "../assets/images/StrikePoint.png"

        this.scaling=1.2
        this.radius = 175
        this.screenPosition = screenPosition
        //console.log("Type using method in constructor:", this.fighter.constructor)
        //console.log("SCREEN POSITION IN CONSTRUCTOR", this.screenPosition)
        if(this.fighter.constructor === SwordFighterUI){
            this.initialCamX = this.fighter.camera.position.x
            this.initialCamY = this.fighter.camera.position.y
        } else {
            this.initalCamX = 0
            this.initialCamY = 0
        }
        
    }

    draw() {
        c.imageSmoothingEnabled=false;
        //console.log("Type using method in draw:", this.fighter.constructor)
        //console.log("SCREEN POSITION IN DRAW", this.screenPosition)
        c.drawImage(this.strikeCircle,0,0,this.radius*2,this.radius*2,this.screenPosition.x-(this.initialCamX-this.fighter.camera.position.x)-this.scaling*this.radius,this.screenPosition.y-(this.initialCamY-this.fighter.camera.position.y)-this.scaling*this.radius,this.radius*2*this.scaling,this.radius*2*this.scaling)    }

    refresh(serverStrikeCirclePosition){
        this.screenPosition = serverStrikeCirclePosition
    }
}

class BackMap{
    constructor(position, imageSrc, width, height,upscale) {
        this.position = position
        this.mapImage = new Image()
        this.mapImage.src = imageSrc
        this.width = width
        this.height =height
        this.upscale=upscale

        this.animCount=0
    }

    draw() {
        //c.drawImage(this.image, this.position.x, this.position.y)
        
        c.drawImage(this.mapImage,0,0,this.width/this.upscale,this.height/this.upscale,this.position.x,this.position.y,this.width,this.height)

    }

    draw({position}) {
        this.position=position
        c.drawImage(this.mapImage,0,0,this.width/this.upscale,this.height/this.upscale,this.position.x,this.position.y,this.width,this.height)
    }

    animateMap({position,start,max,slowdown}){
        if(this.animCount>=max){
            this.animCount=start
        }
        this.position=position
        c.drawImage(this.mapImage,488*(Math.floor(this.animCount/slowdown)),0,this.width/this.upscale,this.height/this.upscale,this.position.x,this.position.y,this.width,this.height)
        this.animCount+=1
    }


}  
