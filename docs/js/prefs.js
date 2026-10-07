/**
 * prefs.js
 * Applies saved theme and view preferences before first paint.
 * Loaded as a classic script in <head>; dark theme is the default.
 */


(function () {
    var root = document.documentElement;
    var theme = "dark";
    var view = "standard";

    try {
        if (localStorage.getItem("bp-theme") === "light") theme = "light";
        if (localStorage.getItem("bp-view") === "clear") view = "clear";
    } catch (e) {}

    root.dataset.theme = theme;
    root.dataset.view = view;
})();
