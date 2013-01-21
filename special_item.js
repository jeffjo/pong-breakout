/*global jeffjo*/
jeffjo.utils.namespace("jeffjo.pong").SpecialItem = (function () {
    "use strict";

    //Ideas:
    /*
        Slow Gun (SG)
        Freeze Gun (FG)
        Reverse Gun (RG)

        Speedup (SU)
        Slowdown (SD)

        Slowball (SB)
        Fastball (FB)
        
        LongPaddle (LP)
        ShortPaddle (SP)



    */

    function SpecialItem(content, className, container, onActivate) {
        this._content = content;
        this._className = className;
        this._container = container;
        this._dom = null;
        this._onActivate = onActivate;
        
        this.position = {x: 0, y: 0};
    }

    SpecialItem.DEFAULT_WIDTH = 40;
    //Includes border
    SpecialItem.DEFAULT_HEIGHT = 40;
    SpecialItem.BORDER_WIDTH = 5;
    


    SpecialItem.prototype.render = function () {
        this._dom = document.createElement("div");
        this._dom.appendChild(document.createTextNode(this._content));
        this._dom.className = "specialItem " + this._className;
        this._dom.style.width = (SpecialItem.DEFAULT_WIDTH - 2 * SpecialItem.BORDER_WIDTH) + "px";
        this._dom.style.height = (SpecialItem.DEFAULT_HEIGHT - 2 * SpecialItem.BORDER_WIDTH) + "px";
        this._dom.style.borderWidth = SpecialItem.BORDER_WIDTH + "px";
        this._dom.style.lineHeight = this._dom.style.height;
    
        this._container.appendChild(this._dom);
    };

    SpecialItem.prototype.moveTo = function (x, y) {

        this._dom.style.left = x + "px";
        this._dom.style.top = y + "px";

        this.position.x = x;
        this.position.y = y;
    };

    SpecialItem.prototype.activate = function(){
        if (typeof this._onActivate === "function"){
            this._onActivate.apply(null, arguments);
        }
    };

    SpecialItem.prototype.destroy = function() {
        this._container.removeChild(this._dom);
    };

    SpecialItem.prototype.clone = function(){
        return new SpecialItem(this._content, this._className, this._container, this._onActivate);
    };

    return SpecialItem;
}());