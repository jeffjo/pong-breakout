/*global jeffjo*/

jeffjo.utils.namespace("jeffjo.pong").pong = (function () {
    "use strict";

        //Convenience
    var Ball = jeffjo.pong.Ball;
    var Paddle = jeffjo.pong.Paddle;
    var SpecialItem = jeffjo.pong.SpecialItem;
    var Player = jeffjo.pong.Player;

    var GAME_BOARD_WIDTH = 750;
    var GAME_BOARD_HEIGHT = 500;
    //# of pixels from edge
    var PADDLE_MARGIN = 10;

    var PADDLE_ONE_X = PADDLE_MARGIN;
    var PADDLE_TWO_X = GAME_BOARD_WIDTH - PADDLE_MARGIN - Paddle.DEFAULT_WIDTH;
    
    //Game elements
    var player1 = null, player2 = null;

    var ball = null, specialItem = null;
    
    var INITIAL_PADDLE_VELOCITY = {x: 0, y: 550};
    var INITIAL_BALL_VELOCITY = { x: 350, y: 50 };
    
    var BALL_BOUNCE_VELOCITY_STEP = 10;
    
    var MIN_BALL_X_VELOCITY = 120;
    var MAX_BALL_X_VELOCITY = 800;
    var MIN_BALL_Y_VELOCITY = 30;
    var MAX_BALL_Y_VELOCITY = 400;

    //If paddle velocity is not equal to INITIAL_PADDLE_VELOCITY, then
    //add/subtract this amount to current velocity to slowly
    //"recover" to initial velocity
    var PADDLE_VELOCITY_RECOVERY_STEP = 0.20;

    //Time between special item appearances
    var SPECIAL_ITEM_INTERVAL = 2000;
    var nextSpecialItemAppearanceTime;
    var specialItemRepository = [];

    //Keeps track of last time animation frame was rendered
    var lastTime = null;

    //Game controls
    var gamePlaying = false;
    var gameAboutToEnd = false;

    function _setupKeyEventListeners() {
        window.addEventListener("keydown", function (ev) {
            switch (ev.keyCode) {
            //38 = up, 40 = down
            case 38:
                player2.keys.up = true;
                ev.preventDefault();
                break;
            case 40:
                player2.keys.down = true;
                ev.preventDefault();
                break;
            case 191:
                player2.keys.special = true;
                ev.preventDefault(); //Search in firefox
                break;
            //65 = a, 90 = z
            case 65:
                player1.keys.up = true;
                break;
            case 90:
                player1.keys.down = true;
                break;
            case 88:
                player1.keys.special = true;
                break;
            case 32:
                ev.preventDefault();
                break;
            }
            
        }, false);

        window.addEventListener("keyup", function (ev) {
            
            switch (ev.keyCode) {
            //38 = up, 40 = down
            case 38:
                player2.keys.up = false;
                break;
            case 40:
                player2.keys.down = false;
                break;
            //65 = a, 90 = z
            case 65:
                player1.keys.up = false;
                break;
            case 90:
                player1.keys.down = false;
                break;
            case 32:
                if (gamePlaying === false) {
                    _startGame();
                }
                break;
            }
            ev.preventDefault();
        }, false);
    }

    function _pickRandomSpecialItem() {
        var randomIndex = Math.floor(Math.random() * specialItemRepository.length);

        return specialItemRepository[randomIndex].clone();
    }

    function _moveSpecialItemToRandomLocation(specialItem) {
        //TODO: Constansize
        var x = (Math.random() * 500);
        var y = (Math.random() * 300);

        specialItem.moveTo(x + 50, y + 50);
    }

    function _calculateBounceVector(incoming, normal) {
        // v' = w - u where
        // u = (incoming . normal) * normal
        // w = incoming - u
        // assuming n is unit vector that is normal to surface
        var dotProduct, ux, uy;
        dotProduct = (incoming.x * normal.x) + (incoming.y * normal.y);
        ux = dotProduct * normal.x;
        uy = dotProduct * normal.y;

        var retVal = {};
        retVal.x = incoming.x - ux * 2;
        retVal.y = incoming.y - uy * 2;

        return retVal;
    }

    function _processPlayerMovement(player, delta, xPosition) {
        var moveTo = 0;

        if (player.paddle.velocity.y < INITIAL_PADDLE_VELOCITY.y) {
            player.paddle.velocity.y += PADDLE_VELOCITY_RECOVERY_STEP;
        }
        else if (player.paddle.velocity.y > INITIAL_PADDLE_VELOCITY.y) {
            player.paddle.velocity.y -= PADDLE_VELOCITY_RECOVERY_STEP;
        }
        //Move paddles
        if (player.keys.up) {
            //Yes yes, we're not using velocity properly right now, but we will once we introduce slowdowns
            moveTo = player.paddle.position.y - (delta * player.paddle.velocity.y);
        }
        else if (player.keys.down) {
            moveTo = player.paddle.position.y + (delta * player.paddle.velocity.y);
        }
        if (player.keys.up || player.keys.down) {
            moveTo = Math.round(Math.max(0, Math.min(moveTo, GAME_BOARD_HEIGHT - Paddle.DEFAULT_HEIGHT)));
            player.paddle.moveTo(xPosition, moveTo);
        }
        if (player.keys.special) {
            player.keys.special = false;
            player.useSpecialItem();
        }
    }

    function _step() {

        //*****TODO: OPTIMIZE BY PRECOMPUTING CONSTANTS!!*********
        var timestamp = Date.now();
        var delta = (timestamp - lastTime) / 1000;

        var originalBallPosition = {x: ball.position.x, y: ball.position.y};

        var newX = ball.position.x + (ball.velocity.x * delta);
        var newY = ball.position.y + (ball.velocity.y * delta);
        
        newX = Math.round(Math.max(-Ball.DEFAULT_BALL_DIAMETER, Math.min(newX, GAME_BOARD_WIDTH)));
        newY = Math.round(Math.max(0, Math.min(newY, GAME_BOARD_HEIGHT - Ball.DEFAULT_BALL_DIAMETER)));

        ball.moveTo(newX, newY);

        lastTime = timestamp;

        //only allow movement while the point is alive
        if (!gameAboutToEnd) {
            var originalPaddle1Position = {x: player1.paddle.position.x, y: player1.paddle.position.y};
            var originalPaddle2Position = {x: player2.paddle.position.x, y: player2.paddle.position.y};
            _processPlayerMovement(player1, delta, PADDLE_ONE_X);
            _processPlayerMovement(player2, delta, PADDLE_TWO_X);

            //check if special item has been collided
            if (specialItem !== null) {
                if (((ball.position.x + Ball.DEFAULT_BALL_DIAMETER) >= specialItem.position.x) &&
                    (ball.position.x <= (specialItem.position.x + SpecialItem.DEFAULT_WIDTH)) &&
                    ((ball.position.y + Ball.DEFAULT_BALL_DIAMETER) >= specialItem.position.y) &&
                    (ball.position.y <= (specialItem.position.y + SpecialItem.DEFAULT_HEIGHT))) {

                    var xPosition;

                    if (ball.velocity.x > 0) {
                        //player 1 hit it last
                        if (player1.specialItems.length < Player.MAX_SPECIAL_ITEMS) {

                            xPosition = player1.specialItems.length * SpecialItem.DEFAULT_WIDTH;
                            specialItem.moveTo(xPosition, GAME_BOARD_HEIGHT - SpecialItem.DEFAULT_HEIGHT);

                            player1.specialItems.push(specialItem);
                            specialItem = null;
                            nextSpecialItemAppearanceTime = timestamp + SPECIAL_ITEM_INTERVAL;
                        }
                    }
                    else {
                        //player 2 hit it last
                        if (player2.specialItems.length < Player.MAX_SPECIAL_ITEMS) {
                            xPosition = GAME_BOARD_WIDTH - ((player2.specialItems.length + 1) * SpecialItem.DEFAULT_WIDTH);
                            specialItem.moveTo(xPosition, GAME_BOARD_HEIGHT - SpecialItem.DEFAULT_HEIGHT);

                            player2.specialItems.push(specialItem);
                            specialItem = null;
                            nextSpecialItemAppearanceTime = timestamp + SPECIAL_ITEM_INTERVAL;
                        }
                    }
                }
            }
            else {
                if (timestamp > nextSpecialItemAppearanceTime) {
                    specialItem = _pickRandomSpecialItem();
                    specialItem.render();
                    _moveSpecialItemToRandomLocation(specialItem);
                }
            }

            //TODO: ANYWAY TO GENERICIZE THE FOLLOWING?
            //TODO: allow save by hitting top of paddle

            var ballCenterX = ball.position.x + Ball.DEFAULT_BALL_RADIUS;
            var ballCenterY = ball.position.y + Ball.DEFAULT_BALL_RADIUS;

            //Moving in direction of player 2
            if (ball.velocity.x > 0) {
                //Check for collision
                if ((ballCenterY > player2.paddle.position.y - Ball.DEFAULT_BALL_RADIUS) &&
                    (ballCenterY < player2.paddle.position.y + Paddle.DEFAULT_HEIGHT + Ball.DEFAULT_BALL_RADIUS) &&
                    (ballCenterX > player2.paddle.position.x - Ball.DEFAULT_BALL_RADIUS) &&
                    (ballCenterX <= player2.paddle.position.x + Paddle.DEFAULT_WIDTH / 2)) {

                    if ((ballCenterY >= (player2.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.2)) &&
                        (ballCenterY <= (player2.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.4))) {
                        //8deg
                        //x = -.99, y = .14107
                        ball.velocity = _calculateBounceVector(ball.velocity, {x: -0.99, y: -0.14107});
                        
                    }
                    else if ((ballCenterY >= (player2.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.4)) &&
                        (ballCenterY <= (player2.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.6))) {
                        ball.velocity.x = -(ball.velocity.x);
                        
                    }
                    else if ((ballCenterY >= (player2.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.6)) &&
                        (ballCenterY <= (player2.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.8))) {
                        //-8deg
                        //x = -.99, y = .14107
                        ball.velocity = _calculateBounceVector(ball.velocity, {x: -0.99, y: 0.14107});
                        
                    }
                    else if (ballCenterY <= (player2.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.2)) {
                        //12.8deg
                        //x = -.975, y = .2222
                        ball.velocity = _calculateBounceVector(ball.velocity, {x: -0.975, y: -0.2222});
                    }
                    else if (ballCenterY >= (player2.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.8)) {
                        //-12.8deg
                        //x = -.975, y = -.2222
                        ball.velocity = _calculateBounceVector(ball.velocity, {x: -0.975, y: 0.2222});
                    }
                    else {
                        console.log("invalid ball position: " + ballCenterY + "// paddle2: " + player2.paddle.position.y);
                    }

                    ball.velocity.x -= BALL_BOUNCE_VELOCITY_STEP;
                    
                }
                else if (ballCenterX > player2.paddle.position.x + Paddle.DEFAULT_WIDTH / 2) {
                    console.log("Delta: " + delta);
                    console.log("Original: " + originalBallPosition.x + " // " + originalBallPosition.y);
                    console.log("Current: " + ball.position.x + " // " + ball.position.y);
                    console.log("Original Paddle" + originalPaddle2Position.x + " // " + originalPaddle2Position.y);
                    console.log("Paddle: " + player2.paddle.position.x + " // " + player2.paddle.position.y);
                    console.log("DIAMETER: " + Ball.DEFAULT_BALL_DIAMETER);
                    if ((player2.paddle.position.y > ball.position.y) && (player2.paddle.position.y < (ball.position.y + Ball.DEFAULT_BALL_DIAMETER))) {
                        console.log("bazinga 1");
                        if (ball.velocity.y < 0) {
                            ball.velocity.y *= 100;
                        }
                        else {
                            ball.velocity.y = -(ball.velocity.y * 100);
                        }
                    }
                    else if (((player2.paddle.position.y + Paddle.DEFAULT_HEIGHT) > ball.position.y) && ((player2.paddle.position.y + Paddle.DEFAULT_HEIGHT) < (ball.position.y + Ball.DEFAULT_BALL_DIAMETER))) {
                        console.log("bazinga 2");
                        if (ball.velocity.y > 0) {
                            ball.velocity.y *= 100;
                        }
                        else {
                            ball.velocity.y = -(ball.velocity.y * 100);
                        }
                    }
                    console.log("Game about to end: " + Date.now());
                    gameAboutToEnd = true;
                    player1.score += 1;
                }
            }
            //Moving in direction of player 1
            else {
                if ((ballCenterY > player1.paddle.position.y - Ball.DEFAULT_BALL_RADIUS) &&
                    (ballCenterY < player1.paddle.position.y + Paddle.DEFAULT_HEIGHT + Ball.DEFAULT_BALL_RADIUS) &&
                    (ballCenterX < player1.paddle.position.x + Paddle.DEFAULT_WIDTH + Ball.DEFAULT_BALL_RADIUS) &&
                    (ballCenterX >= player1.paddle.position.x + Paddle.DEFAULT_WIDTH / 2)) {

                    
                    
                    if ((ballCenterY >= (player1.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.2)) &&
                        (ballCenterY <= (player1.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.4))) {
                        //8deg
                        //x = -.99, y = .14107
                        ball.velocity = _calculateBounceVector(ball.velocity, {x: 0.99, y: -0.14107});
                        
                    }
                    else if ((ballCenterY >= (player1.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.4)) &&
                        (ballCenterY <= (player1.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.6))) {
                        ball.velocity.x = -ball.velocity.x;
                        
                    }
                    else if ((ballCenterY >= (player1.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.6)) &&
                        (ballCenterY <= (player1.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.8))) {
                        //-8deg
                        //x = -.99, y = .14107
                        ball.velocity = _calculateBounceVector(ball.velocity, {x: 0.99, y: 0.14107});
                        
                    }
                    else if (ballCenterY <= (player1.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.2)) {
                        //12.8deg
                        //x = -.975, y = .2222
                        ball.velocity = _calculateBounceVector(ball.velocity, {x: 0.975, y: -0.2222});
                    }
                    else if (ballCenterY >= (player1.paddle.position.y + Paddle.DEFAULT_HEIGHT * 0.8)) {
                        //-12.8deg
                        //x = -.975, y = -.2222
                        ball.velocity = _calculateBounceVector(ball.velocity, {x: 0.975, y: 0.2222});
                    }
                    else {
                        console.log("invalid ball position: " + ballCenterY + "// paddle1: " + player1.paddle.position.y);
                    }

                    ball.velocity.x += BALL_BOUNCE_VELOCITY_STEP;
                    
                }
                else if (ballCenterX < player1.paddle.position.x + Paddle.DEFAULT_WIDTH / 2) {
                    console.log("bazinga 0.0");
                    console.log("Delta: " + delta);
                    console.log("Original: " + originalBallPosition.x + " // " + originalBallPosition.y);
                    console.log("Current: " + ball.position.x + " // " + ball.position.y);
                    console.log("Original Paddle" + originalPaddle1Position.x + " // " + originalPaddle1Position.y);
                    console.log("Paddle: " + player1.paddle.position.x + " // " + player1.paddle.position.y);

                    if ((player1.paddle.position.y > ball.position.y) && (player1.paddle.position.y < (ball.position.y + Ball.DEFAULT_BALL_DIAMETER))) {
                        if (ball.velocity.y < 0) {
                            ball.velocity.y *= 100;
                        }
                        else {
                            ball.velocity.y = -(ball.velocity.y * 100);
                        }
                        console.log("bazinga 3")
                    }
                    else if (((player1.paddle.position.y + Paddle.DEFAULT_HEIGHT) > ball.position.y) && ((player1.paddle.position.y + Paddle.DEFAULT_HEIGHT) < (ball.position.y + Ball.DEFAULT_BALL_DIAMETER))) {
                        if (ball.velocity.y > 0) {
                            ball.velocity.y *= 100;
                        }
                        else {
                            ball.velocity.y = -(ball.velocity.y * 100);
                        }
                        console.log("bazinga 4");
                    }

                    console.log("Game about to end: " + Date.now());
                    gameAboutToEnd = true;
                    player2.score += 1;
                }

            }


            //Only care about bouncing off top and bottom if the game is not about to end
            if (!gameAboutToEnd) {
                //If the ball hits the top or bottom walls, bounce
                if ((newY === (GAME_BOARD_HEIGHT - Ball.DEFAULT_BALL_DIAMETER)) || (newY === 0)) {
                    ball.velocity.y = -ball.velocity.y;
                }
            }

            ball.velocity.x = Math.max(MIN_BALL_X_VELOCITY, Math.min(MAX_BALL_X_VELOCITY, Math.abs(ball.velocity.x))) * ((ball.velocity.x < 0) ? -1:1);
            ball.velocity.y = Math.max(MIN_BALL_Y_VELOCITY, Math.min(MAX_BALL_Y_VELOCITY, Math.abs(ball.velocity.y))) * ((ball.velocity.y < 0) ? -1:1);
        }
        else {
            //The point is over, once the ball has left the visible game board, reset the board
            //and update the scores
            console.log("Waiting for game to end: " + Date.now());
            if ((newX >= GAME_BOARD_WIDTH) || (newX <= -Ball.DEFAULT_BALL_DIAMETER)) {
                console.log("Game over: " + Date.now());
                gamePlaying = false;
                _resetPositions();
                _updateScores();
                _resetSpecialItem();
                
            }

        }
        // var debugText = "x : " + ball.velocity.x + " // y : " + ball.velocity.y + "<br/>" +
        //                 "paddle1 v: " + player1.paddle.velocity.y + "<br/>" +
        //                 "paddle2 v: " + player2.paddle.velocity.y + "<br/>";
        // document.getElementById("debug").innerHTML = debugText;
        

        if (gamePlaying) {
            window.requestAnimationFrame(_step);
        }
    }

    function _startGame() {
        _resetVelocities();

        gamePlaying = true;
        gameAboutToEnd = false;

        lastTime = Date.now();
        nextSpecialItemAppearanceTime = lastTime + SPECIAL_ITEM_INTERVAL;
        
        window.requestAnimationFrame(_step);
    }

    function _updateScores() {
        document.getElementById("playerOneScore").innerHTML = player1.score;
        document.getElementById("playerTwoScore").innerHTML = player2.score;
    }

    function _resetPositions() {
        //Center ball and paddles
        ball.moveTo(GAME_BOARD_WIDTH / 2 - Ball.DEFAULT_BALL_RADIUS, GAME_BOARD_HEIGHT / 2 - Ball.DEFAULT_BALL_RADIUS);
        player1.paddle.moveTo(PADDLE_ONE_X, (GAME_BOARD_HEIGHT - Paddle.DEFAULT_HEIGHT) / 2);
        player2.paddle.moveTo(PADDLE_TWO_X, (GAME_BOARD_HEIGHT - Paddle.DEFAULT_HEIGHT) / 2);
    }

    function _resetVelocities() {
        //TODO: do this better
        ball.velocity.y = (Math.random() * 2 * INITIAL_BALL_VELOCITY.y) - INITIAL_BALL_VELOCITY.y;
        //Keep the ball moving in the same direction as when it died
        ball.velocity.x = INITIAL_BALL_VELOCITY.x * (ball.velocity.x / Math.abs(ball.velocity.x)) + (Math.random() * 100);
        if (isNaN(ball.velocity.x)) {
            ball.velocity.x = INITIAL_BALL_VELOCITY.x;
        }

        player1.paddle.velocity.y = INITIAL_PADDLE_VELOCITY.y;
        player2.paddle.velocity.y = INITIAL_PADDLE_VELOCITY.y;

    }

    function _resetSpecialItem() {
        if (specialItem !== null) {
            specialItem.destroy();
            specialItem = null;
        }
    }

    function _setupBoard(id, container) {
        var gameSurface = document.createElement("div");
        gameSurface.className = "gameSurface";
        gameSurface.style.width = GAME_BOARD_WIDTH + "px";
        gameSurface.style.height = GAME_BOARD_HEIGHT + "px";

        var scoreboard = document.createElement("div");
        scoreboard.className = "scoreboard";
        scoreboard.innerHTML += "<div class='playerOne' id='playerOneScore'></div><div class='playerTwo' id='playerTwoScore'></div>";

        // var debug = document.createElement("div");
        // debug.className = "debug";
        // debug.id = "debug";

        container.appendChild(gameSurface);
        container.appendChild(scoreboard);
        // container.appendChild(debug);

        ball = new jeffjo.pong.Ball(gameSurface);
        ball.render();
        
        player1 = new jeffjo.pong.Player();
        player1.paddle = new jeffjo.pong.Paddle(gameSurface);
        player1.paddle.render();

        player2 = new jeffjo.pong.Player();
        player2.paddle = new jeffjo.pong.Paddle(gameSurface);
        player2.paddle.render();

        specialItemRepository.push(new jeffjo.pong.SpecialItem("FB", "specialItem_fastball", gameSurface, function () {

            ball.velocity.x = Math.max(MIN_BALL_X_VELOCITY, Math.min(MAX_BALL_X_VELOCITY, Math.abs(ball.velocity.x * 1.4))) * ((ball.velocity.x < 0) ? -1:1);
            ball.velocity.y = Math.max(MIN_BALL_Y_VELOCITY, Math.min(MAX_BALL_Y_VELOCITY, Math.abs(ball.velocity.y * 1.4))) * ((ball.velocity.y < 0) ? -1:1);
        }));
        specialItemRepository.push(new jeffjo.pong.SpecialItem("SB", "specialItem_slowball", gameSurface, function () {
            
            ball.velocity.x = Math.max(MIN_BALL_X_VELOCITY, Math.min(MAX_BALL_X_VELOCITY, Math.abs(ball.velocity.x / 1.1))) * ((ball.velocity.x < 0) ? -1:1);
            ball.velocity.y = Math.max(MIN_BALL_Y_VELOCITY, Math.min(MAX_BALL_Y_VELOCITY, Math.abs(ball.velocity.y / 1.1))) * ((ball.velocity.y < 0) ? -1:1);

        }));

        var slowPaddle = new jeffjo.pong.SpecialItem("SP", "specialItem_slowpaddle", gameSurface, function (player) {
            var velocityReductionFactor = 2;
            if (player === player1) {
                player2.paddle.velocity.y /= velocityReductionFactor;
            }
            else if (player === player2) {
                player1.paddle.velocity.y /= velocityReductionFactor;
            }
            
        });

        specialItemRepository.push(slowPaddle);
        specialItemRepository.push(slowPaddle);

        var crazyBall = new jeffjo.pong.SpecialItem("CB", "specialItem_crazyball", gameSurface, function () {
            var randX = Math.random() * 400 - 200;
            var randY = Math.random() * 600 - 300;

            var newX = ball.velocity.x + ((ball.velocity.x > 0) ? randX : -randX);
            var newY = ball.velocity.y + ((ball.velocity.y > 0) ? randY : -randY);

            ball.velocity.x = Math.max(MIN_BALL_X_VELOCITY, Math.min(MAX_BALL_X_VELOCITY, Math.abs(newX))) * ((newX < 0) ? -1:1);
            ball.velocity.y = Math.max(MIN_BALL_Y_VELOCITY, Math.min(MAX_BALL_Y_VELOCITY, Math.abs(newY))) * ((newY < 0) ? -1:1);
            
        });
        specialItemRepository.push(crazyBall);
        specialItemRepository.push(crazyBall);
        

        _resetPositions();
        _updateScores();
        _setupKeyEventListeners();

    }
    return {
        setupBoard: _setupBoard,
        startGame: _startGame
    };

}());