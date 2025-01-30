const socket = io('http://localhost:3000');

const localMapWidth = 0
const localMapHeight = 0
const localPlayerWidth = 0
const localPlayerHeight = 0
const localFighterID = 0
const localPlayerScaling = 0

const position = {x:0,y:0}
const facing = 'S'
const isRunning = false
const isSetting = false
const isParrying = false
const strikeRecency = 0
const speedDebuff = 0

mapImageSrc = '../assets/images/background1'

socket.on('initial', (mapWidth, mapHeight, playerWidth, playerHeight, fighterID, playerScaling) => {
    //When client connects, the server will send the initial data. This is where we set it up.
    localMapWidth = mapWidth
    localMapHeight = mapHeight
    localPlayerWidth = playerWidth
    localPlayerHeight = playerHeight
    localFighterID = fighterID
    localPlayerScaling = playerScaling
});

socket.on('update', (fighteposition, facing, isRunning, isSetting, isParrying, strikeRecency, speedDebuff) => {
    //Server will send updates to the client, this is where we update the client based on the server's dapositiposition
    facing = facing
    isRunning = isRunning
    isSetting = isSetting
    isParrying = isParrying
    strikeRecency = strikeRecency
    speedDebuff = speedDebuff
    
}


//TODO: Will have to figure out a way to give unique ID's to each player- shouldn't be hard, only 1v1 for now
const player = new SwordFighterUI({playerID: 1})

//TODO: Should supply these random little immutable vars, like the map size, pllocalPlayerWidth/height to the client on connection. See socket.on('connect',...) above
camera = new Camera()


const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
calocalPlayerWidth = 1024
canvas.height = 576

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

//TODO: Updating this every frame within the draw loop would fix a mouse offset bug that happens when the window is resized, I believe
const canvasOffsetX = (screenWidth-calocalPlayerWidth)/2
const canvasOffsetY = (screenHeight-canvas.height)/2

c.fillRect(0,0, calocalPlayerWidth, canvas.height)



//List all audio files here, played within draw loop 
let parry1 = new Audio("../assets/sounds/fox_parry_1.mp3")
let parry2 = new Audio("../assets/sounds/fox_parry_2.mp3")
let parry3 = new Audio("../assets/sounds/fox_parry_3.mp3")
let slash1 = new Audio("../assets/sounds/fox_slash_1.mp3")
let slash2 = new Audio("../assets/sounds/fox_slash_2.mp3")
let slash3 = new Audio("../assets/sounds/fox_slash_3.mp3")
let set = new Audio("../assets/sounds/fox_set_1.mp3")
let backgroundWind = new Audio("../assets/sounds/backgroundWind.mp3")
backgroundWind.loop = true
backgroundWind.play()

//Dynamically adjustsposition of things on screen based of things 
class Camera {
    //TODO: Should all be calculated in backend and return the updated positions in emit to sender 
    //WILL NEED: mapWidth, mapHeight (should both be locally availabposition, fighterID (locally available, unless I decide to update it every update to prevent big bugs)
    constructor() {
      this.fighter=localFighterID
      this.x = (mapWidth/2);
      this.y = (mapHeight/2);
      this.smoothness = 0.5; // Adjust for desired smoothness

      this.mapImage = new Image()
      this.mapImage.src = mapImageSrc
    }
  
    update() {
        this.fighter=localFighterID

      let targetX = -(this.figposition.x - (calocalPlayerWidth / 2));
      let targetY = -(this.figposition.y - (canvas.height / 2));

      targetX = Math.min(0, Math.max(targetX, -(mapWidth) + calocalPlayerWidth));
      targetY = Math.min(0, Math.max(targetY, -(mapHeight) + canvas.height));

      // Smoothly move the camera
      this.x += (targetX - this.x) * this.smoothness;
      this.y += (targetY - this.y) * this.smoothness;
    }

    mapDraw(){
        c.drawImage(this.mapImage,0,0,this.width/this.upscale,this.height/this.upscale,this.position.x,this.position.y,this.width,this.height)
    }

    mapAnimate(){
        if(this.mapAnimCount>=max){
            this.mapAnimCount=start
        }
        this.position=position
        c.drawImage(this.mapImage,488*(Math.floor(this.mapAnimCount/slowdown)),0,this.width/this.upscale,this.height/this.upscale,this.position.x,this.position.y,this.width,this.height)
        this.mapAnimCount+=1
    }
}

class SwordFighterUI{
    constructor(playerID){
    //Player Animation
    this.animCount=0
    this.animLayer=0
    this.animSlowdown=0
    this.imageFox=new Image()
    this.imageFox.src="../assets/images/IdleFoxS.png"
    
    //Cloud(Trace) Animation
    this.traceDrawn=false
    this.cloudAnimCount=0
    this.imageCloud=new Image()
    this.imageCloud.src="../assets/images/DashCloud.png"

    //Strike Animation
    this.opacityRemovalRate = 0.1

    //General Animation
    this.animationScale=2.5
    this.preStrikeCamX= camera.x
    this.preStrikeCamY= camera.y
    this.playerID = playerID

    this.currentStrikeOpacity = 0;

    
    }

    //Turn this from a method into a socket on recieve event
    //Will need camera, strikeRecency, id  preStrikeCamX, preStrikeCamY (<-I can get those two natively from client I think?)
    draw() {
        //FIRST Draw the strike trace if there should be one. Do this first so that anything else is drawn over it




        /*This is really not my favourite way to do this, but it's the only way I can think of right now. postStrikeCamX and postStrikeCamY should only be updated once per strike, 
         I don't know if frame skipping might have a chance to break this though. I'm leaving a bit of margin of error to update between 1.1 ad 0.9, so that it doesn't break if it's not exactly 1.0
         This should theoretically prevent the strike trace from going scitzo on most setups, but it's a possibility for sure.*/
        if(this.strikeRecency>0.9){
            this.postStrikeCamX=camera.x
            this.postStrikeCamY=camera.y
            drawStrike()
        } else if(this.strikeRecency>0){
            drawStrike()
        }
        else{
            this.preStrikeX=position.x+camera.x
            this.preStrikeY=position.y+camera.y
            this.preStrikeCamX=camera.x
            this.preStrikeCamY=camera.y
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
    drawCloud(scaling){
        if(this.traceDrawn==false){
            this.traceDrawn=true
            if(speedDebuff<3&&this.isRunning&&this.strikeRecency<=0){
                if(this.facing=='S'){
                    this.imageCloud.src="../assets/images/DashTraceS.png"
                    c.drawImage(this.imageCloud,0,0,localPlayerWidth,localPlayerHeight,position.x + camera.x,position.y + camera.y - localPlayerHeight/2,localPlayerWidth*scaling,localPlayerHeight*scaling)
                } else if(this.facing=='N'){
                    this.imageCloud.src="../assets/images/DashTraceN.png"
                    c.drawImage(this.imageCloud,0,0,localPlayerWidth,localPlayerHeight,position.x + camera.x,position.y + camera.y + localPlayerHeight, localPlayerWidth*scaling,localPlayerHeight*scaling)
                } else if(this.facing=='W'){
                    this.imageCloud.src="../assets/images/DashTraceW.png"
                    c.drawImage(this.imageCloud, 0, 0, localPlayerWidth, localPlayerHeight, position.x + camera.x+localPlayerWidth/2, position.y + camera.y,localPlayerWidth * scaling,localPlayerHeight * scaling);
                } else if (this.facing == 'E') {
                    this.imageCloud.src = "../assets/images/DashTraceE.png"
                    c.drawImage(this.imageCloud,0,0,localPlayerWidth,localPlayerHeight,position.x + camera.x-localPlayerWidth/2,position.y + camera.y,localPlayerWidth*scaling,localPlayerHeight*scaling)
                } else if (this.facing == 'NE') {
                    this.imageCloud.src = "../assets/images/DashTraceNE.png";
                    c.drawImage(this.imageCloud, 0, 0, localPlayerWidth, localPlayerHeight, position.x + camera.x - localPlayerWidth/2.5, position.y + camera.y + localPlayerHeight/2, localPlayerWidth * scaling, localPlayerHeight * scaling);
                } else if (this.facing == 'NW') {
                    this.imageCloud.src = "../assets/images/DashTraceNW.png";
                    c.drawImage(this.imageCloud, 0, 0, localPlayerWidth, localPlayerHeight, position.x + camera.x + localPlayerWidth/2.5, position.y + camera.y + localPlayerHeight/2, localPlayerWidth * scaling, localPlayerHeight * scaling);
                } else if (this.facing == 'SE') {
                    this.imageCloud.src = "../assets/images/DashTraceSE.png";
                    c.drawImage(this.imageCloud, 0, 0, localPlayerWidth, localPlayerHeight, position.x + camera.x - localPlayerWidth/2.5, position.y + camera.y - localPlayerHeight/2, localPlayerWidth * scaling, localPlayerHeight * scaling);
                } else if (this.facing == 'SW') {
                    this.imageCloud.src = "../assets/images/DashTraceSW.png";
                    c.drawImage(this.imageCloud, 0, 0, localPlayerWidth, localPlayerHeight, position.x + camera.x + localPlayerWidth/2.5, position.y + camera.y - localPlayerHeight/2, localPlayerWidth * scaling, localPlayerHeight * scaling);
                }
            }
        }
    }

    //WILL NEED: animCount (I think that's client now), 
    animateSwordFighter(slowdown,max,start,scaling){

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
        
        c.drawImage(this.imageFox,50*(Math.floor(this.animCount/slowdown)),0,localPlayerWidth,localPlayerHeight,position.x + camera.x,position.y + camera.y,localPlayerWidth*scaling,localPlayerHeight*scaling)
        this.animCount+=1

        //Draw cloud/trace in front of elements (if necessary)
        this.drawCloud(this.animationScale)
        this.traceDrawn=false
    }
}