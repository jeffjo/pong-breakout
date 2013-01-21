/*global jeffjo*/
jeffjo.utils.namespace("jeffjo.pong").Player = (function () {
    function Player() {
        this.paddle = null;
        this.score = 0;
        this.specialItems = [];
        this.keys = {up: false, down: false, special: false};
    }

    Player.MAX_SPECIAL_ITEMS = 2;

    Player.prototype.useSpecialItem = function () {
        if (this.specialItems.length > 0){
            var special = this.specialItems.pop();
            special.activate(this);
            special.destroy();
            special = null;
        }
    };

    return Player;
}());