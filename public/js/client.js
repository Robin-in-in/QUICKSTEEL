//MADE IN COLLABORATION WITH TYSON LINE - type out README.MD
//const socket = io(`https://${window.location.hostname}`);
/*
const socket = io({
    transports: ["websocket", "polling"]
  });
  */
const socket = io('http://localhost:3000');
let player = null
let enemy = null
let killMap = new Map()
let nextScoreboardMessage = "Resetting..."
let lastUpdatedCountPlayer = 0

let tooManyPlayersNotified = false
let waitingForPlayersNotified = false
let correctAmountOfPlayersNotified = false

let connectedPlayers = 0
let currentMessageTimeout = null 
/*
const position = {x:0,y:0}
const facing = 'S'
const isRunning = false
const isSetting = false
const isParrying = false
const strikeRecency = 0
let speedDebuff = 0
*/

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;


let rect = canvas.getBoundingClientRect(); // Get canvas position and size
let scaleX = canvas.width / rect.width;  // Fix scaling if the canvas is resized with CSS
let scaleY = canvas.height / rect.height;

let inputData ={
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

let strikeData ={
    mouse: {x:0,y:0}
}

// Track mouse position
window.addEventListener('mousemove', (event) => {
    
    strikeData.mouse.x = (event.clientX - rect.left) * scaleX;
    strikeData.mouse.y = (event.clientY - rect.top) * scaleY;
});

// Detect left-click
window.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // 0 is the code for the left mouse button
        //console.log('left click');
        //console.log(strikeData.mouse.x)
        if (player.animCount > 30) {
            player.animCount = 0;
        }
        socket.emit('strike', strikeData, player?.camera.position)
    }
});

//Tracks which key was last pressed
window.addEventListener('keydown', (event) =>{
    switch (event.key){
        case 'd':
            if(!event.repeat){
                inputData.keys.d.pressed=true
                if(!inputData.keysPressed.includes('d')){
                    inputData.keysPressed.push('d')
                }
                break
            }
        case 'a':
            if(!event.repeat){
                inputData.keys.a.pressed=true
                if(!inputData.keysPressed.includes('a')){
                    inputData.keysPressed.push('a')
                }
                break
            }
        case 'w':
            if(!event.repeat){
                inputData.keys.w.pressed=true
                if(!inputData.keysPressed.includes('w')){
                    inputData.keysPressed.push('w')
                }
                break
            }
            
        case 's':
            if(!event.repeat){
                inputData.keys.s.pressed=true
                if(!inputData.keysPressed.includes('s')){
                    inputData.keysPressed.push('s')
                }
                break
            }
        case 'q':
            if(!event.repeat){
                if(player.animCount>30){
                    player.animCount=0
                }
                socket.emit('strike', strikeData, player?.camera.position)
                break
            }
        case 'e':
            if(!event.repeat){
                player.animCount=0
                socket.emit('parry')
                break
            }
    }
    socket.emit('inputs', inputData)
})

//Tracks when keys are released
window.addEventListener('keyup', (event) =>{
    let upIndex

    switch (event.key){
        case 'd':
            inputData.keys.d.pressed=false
            lastKey='none'
            upIndex=inputData.keysPressed.indexOf('d')
            break
        case 'a':
            inputData.keys.a.pressed=false
            lastKey='none'
            upIndex=inputData.keysPressed.indexOf('a')
            break
        case 'w':
            inputData.keys.w.pressed=false
            lastKey='none'
            upIndex=inputData.keysPressed.indexOf('w')
            //console.log(upIndex)
            break
        case 's':
            inputData.keys.s.pressed=false
            lastKey='none'
            upIndex=inputData.keysPressed.indexOf('s')
            break
    }
    if(upIndex>-1){
        inputData.keysPressed.splice(upIndex, 1);
    }
    //player.move(keys);
    socket.emit('inputs', inputData);
})


socket.on('initial', (mapWidth, mapHeight, playerWidth, playerHeight, fighterID, playerScaling, playerNumber) => {
    //When client connects, the server will send the initial data. This is where we set it up.
    player = new SwordFighterUI(playerWidth, playerHeight, fighterID, mapWidth, mapHeight, playerScaling, playerNumber)
});

socket.on('update', (playerWidth, playerHeight, fighterID, playerPosition, facing, isRunning, isSetting, parry, strikeRecency, speedDebuff, serverPointPosition, playerScaling, successfullyParried, isClashing, isDying, isRespawning, struckEnemyParry,amountOfPlayers,mostRecentDeathTo, respawnInvincibility) => {

    connectedPlayers = amountOfPlayers
    
    if(connectedPlayers==1 && !waitingForPlayersNotified){
        correctAmountOfPlayersNotified = false
        tooManyPlayersNotified = false
        nextScoreboardMessage = "Waiting for another player to join..."
        updateScoreboard(10000)
        waitingForPlayersNotified = true
        /*
        waitingMessage.style.display = "block";
        overcrowdMessage.style.display = "none"; // Show the message
        */
    } else if(connectedPlayers==2 && !correctAmountOfPlayersNotified){
        waitingForPlayersNotified = false
        tooManyPlayersNotified = false
        nextScoreboardMessage = "FIGHT!"
        updateScoreboard(500)
        correctAmountOfPlayersNotified = true
    } else if(connectedPlayers>2 && !tooManyPlayersNotified){
        correctAmountOfPlayersNotified = false
        waitingForPlayersNotified = false
        nextScoreboardMessage = "Too many players! Server doesn't handle this yet :^3"
        updateScoreboard(10000)
        tooManyPlayersNotified = true
        /*
        waitingMessage.style.display = "none";
        overcrowdMessage.style.display = "block"; 
        */
    }



    player.refreshAttributes(playerWidth, playerHeight, fighterID, playerPosition, facing, isRunning, isSetting, parry.isParrying, strikeRecency, speedDebuff, serverPointPosition, successfullyParried, isClashing, isDying, isRespawning, struckEnemyParry, respawnInvincibility)

    if(isDying){
        let now=Date.now()
        let previousData = killMap.get(mostRecentDeathTo) || { lastTime: 0, killCount: 0 };

        let randomOutcome = Math.floor(Math.random() * 3)

        if(enemy.isDying){
            nextScoreboardMessage = "DOUBLE KO!!!!!"
            scoreboardTitle.animation="glitchblue 1s ease infinite"
        }
        

        if(now-previousData.lastTime>5000){ //ensure kill is not counted twice, since isDying is active for 4 seconds
            //will need to update when I eventually make a map to track all players
            nextScoreboardMessage = (randomOutcome==0) ? "DEATH IS NOT THE END" : (randomOutcome==1) ? "FOXES HAVE ∞ LIVES" : (randomOutcome==2) ? "...ONE MORE TIME" : "...ONE MORE TIME"
            scoreboardTitle.animation="none"
            killMap.set(mostRecentDeathTo, {lastTime: now, killCount: previousData.killCount+1})
            console.log(`Kill registered for Player ${mostRecentDeathTo}. Total kills: ${previousData.killCount + 1}`);
            updateScoreboard()
        } 
    }
})

socket.on('updateToOthers', (playerWidth, playerHeight, fighterID, playerPosition, facing, isRunning, isSetting, parry, strikeRecency, speedDebuff, serverPointPosition, playerScaling, playerNumber, successfullyParried, isClashing, isDying, isRespawning, struckEnemyParry, mostRecentDeathTo, respawnInvincibility) => {
    //Updates recieved from other players. As there is only one other player right now I'm implementing it as such
    if(!enemy&&!player){
        //do nothing if neither exist yet, should never happen
    }else if(!enemy&&player){
        enemy = new EnemySwordFighterUI(playerWidth, playerHeight, fighterID, playerScaling, playerNumber, player)
    } else{
        enemy.refreshAttributes(playerWidth, playerHeight, fighterID, playerPosition, facing, isRunning, isSetting, parry.isParrying, strikeRecency, speedDebuff, serverPointPosition, successfullyParried, isClashing, isDying, isRespawning, struckEnemyParry, respawnInvincibility)
    }

    if(isDying){
        let now=Date.now()
        let previousData = killMap.get(mostRecentDeathTo) || { lastTime: 0, killCount: 0 };

        if(player.isDying){
            nextScoreboardMessage = "DOUBLE KO!!!!!"
            scoreboardTitle.animation="glitch 1s linear infinite"
            updateScoreboard()
        }

        if(now-previousData.lastTime>5000){ //ensure kill is not counted twice, since isDying is active for 4 seconds
            //will need to update when I eventually make a map to track all players
            nextScoreboardMessage = ""
            killMap.set(mostRecentDeathTo, {lastTime: now, killCount: previousData.killCount+1})
            console.log(`Kill registered for Player ${mostRecentDeathTo}. Total kills: ${previousData.killCount + 1}`);
            updateScoreboard()
        } 
    }
})

socket.on('disconnectToOthers', () => {
    nextScoreboardMessage = "Player disconnected. Updating..."
    killMap.delete(enemy.playerNumber)
    killMap.delete(player.playerNumber)
    enemy = null
    updateScoreboard()
    setTimeout(()=>{ //Allow time for disconnect message
        tooManyPlayersNotified = false
        waitingForPlayersNotified = false
        correctAmountOfPlayersNotified = false
    }, 750)
    
})

let lastTime = 0;
const targetFPS = 60;
const frameDuration = 1000 / targetFPS;

//TODO: Should probably move this to server
function animate(timestamp){
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
  
    if (deltaTime >= frameDuration) {
      lastTime = timestamp - (deltaTime % frameDuration);

        screenWidth = window.innerWidth;
        screenHeight = window.innerHeight;
        rect = canvas.getBoundingClientRect(); // Get canvas position and size
        scaleX = canvas.width / rect.width;  // Fix scaling if the canvas is resized with CSS
        scaleY = canvas.height / rect.height;

        c.fillStyle = "black"
        c.fillRect(0,0,canvas.width,canvas.height)
        if(player!=null){     

            //Update each object
            player.draw();
            player.camera.update();
    
            if(player.point){
                //console.log("Player point created, drawing.")
                player.point.draw();
            }
        } 
        if(enemy){
            enemy.draw()
            if(enemy.point){
                enemy.point.draw()
            }
        }
    }
    window.requestAnimationFrame(animate);
}

animate()

function updateScoreboard(waitingInterval = 2000) {

    const scoreList = document.getElementById("scoreList");
    scoreList.innerHTML = ""; // Clear old entries
    scoreboardTitle.innerHTML = nextScoreboardMessage;
    if(scoreboardTitle.innerHTML=="FIGHT!"){
        scoreboardTitle.style.fontSize = "50px";
        scoreboardTitle.style.fontFamily = "Merriweather, serif";
        scoreboardTitle.style.transform = "scaleY(3) translateY(-50px) translateX(-50px)";
        //scoreboardTitle.style.transform = "translateY(-75px)"
        scoreboardTitle.style.animation = "glitchblue 1s ease infinite";
    } else{
        scoreboardTitle.style.fontSize = "16px";
        scoreboardTitle.style.transform = "scaleY(2) translateY(0px) translateX(0px)"
        scoreboardTitle.style.animation = "none";
    }

    console.log("killMap.size", killMap.size)  
    if(connectedPlayers==2){
        [...killMap.entries()]
            .sort((a, b) => b[1].killCount - a[1].killCount) // Sort by kills
            .forEach(([player, data], index) => {
                const li = document.createElement("li");
                let pname = (player==1) ? "GREEN" : (player==2) ? "BLUE" : "UNKNOWN PLAYER"
                li.innerHTML = `<span class=pname style='font-weight:7a00; font-size:35px'>${pname} : <span class=killCount style='color: white;text-align: right'>${data.killCount}</span>`;
                li.style.color = (pname === "GREEN") ? "rgb(5, 79, 14)" : (pname === "BLUE") ? "rgb(12, 8, 117)" : "white";
                scoreList.appendChild(li);
                const killCountSpan = li.querySelector('.killCount');
                (pname=="GREEN") ? killCountSpan.style.animation = "glitchgreen 1s ease infinite" : (pname=="BLUE") ? killCountSpan.style.animation = "glitchblue 1s ease infinite" : killCountSpan.style.animation = "glitchgreen 1s ease infinite"; // Trigger the animation
            });
    }
    showScoreboard(waitingInterval);
}

function showScoreboard(waitingInterval = 2000) {

    const scoreboard = document.getElementById("scoreboard");
    scoreboard.classList.add("show");

    console.log("titleinnerhtml", scoreboardTitle.innerHTML);
    console.log("waitingInterval", waitingInterval);
    console.log("classlist??", scoreboard.classList);

    (currentMessageTimeout !== null) ? clearTimeout(currentMessageTimeout) : null;

    currentMessageTimeout = setTimeout(() => {
        scoreboard.classList.remove("show");

    }, waitingInterval);
}