/*global jeffjo*/
jeffjo.utils.namespace("jeffjo.pong").Paddle = (function () {
    "use strict";

    function Paddle(container) {
        //TODO Validate container
        this._container = container;
        this._dom = null;

        this.position = {x: 0, y: 0};
        this.velocity = {x: 0, y: 0};
    }

    Paddle.DEFAULT_WIDTH = 10;
    Paddle.DEFAULT_HEIGHT = 100;

    Paddle.prototype.render = function () {

        this._dom = document.createElement("div");
        this._dom.className = "paddle";
        this._dom.style.width = Paddle.DEFAULT_WIDTH + "px";
        this._dom.style.height = Paddle.DEFAULT_HEIGHT + "px";
        this._dom.style.borderRadius = (Paddle.DEFAULT_WIDTH / 2) + "px";

        this._container.appendChild(this._dom);
    };

    Paddle.prototype.moveTo = function (x, y) {
        //TODO: Validate x, y
        this._dom.style.left = x + "px";
        this._dom.style.top = y + "px";

        this.position.x = x;
        this.position.y = y;
    };

    Paddle.prototype.destroy = function () {
        this._container.removeChild(this._dom);
    };

    return Paddle;


}());