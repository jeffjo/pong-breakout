/*global jeffjo*/
jeffjo.utils.namespace("jeffjo.pong").Ball = (function () {
    "use strict";

    function Ball(container) {
        //TODO Validate container
        this._container = container;
        this._dom = null;

        /* public */
        this.position = {x: 0, y: 0};
        this.velocity = {x: 0, y: 0};
    }

    
    Ball.DEFAULT_BALL_RADIUS = 20;
    Ball.DEFAULT_BALL_DIAMETER = 2 * Ball.DEFAULT_BALL_RADIUS;

    Ball.prototype.render = function () {

        this._dom = document.createElement("div");

        this._dom.className = "ball";
        this._dom.style.width = (Ball.DEFAULT_BALL_RADIUS * 2) + "px";
        this._dom.style.height = (Ball.DEFAULT_BALL_RADIUS * 2) + "px";

        this._container.appendChild(this._dom);
    };

    Ball.prototype.moveTo = function (x, y) {
        //TODO: Validate x, y

        this._dom.style.left = x + "px";
        this._dom.style.top = y + "px";
        this.position.x = x;
        this.position.y = y;
    };

    Ball.prototype.destroy = function () {
        this._container.removeChild(this._dom);
    };


    return Ball;

}());