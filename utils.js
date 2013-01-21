
/** TODO: WRITE TESTS **/

var jeffjo = jeffjo || {};
jeffjo.utils = jeffjo.utils || {};

(function () {
    "use strict";

    jeffjo.utils.namespace = function (ns_string) {

        var parts = ns_string.split("."),
            parent = jeffjo,
            i;

        if (parts[0] === "jeffjo") {
            parts = parts.slice(1);
        }

        for (i = 0; i < parts.length; i++) {
            if (typeof parent[parts[i]] === "undefined") {
                parent[parts[i]] = {};
            }
            parent = parent[parts[i]];
        }

        return parent;
    };

}());