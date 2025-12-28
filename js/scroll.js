// musicWebTemplate/js/scroll.js
// Fixed: no double-tap needed, prevents default jump, closes mobile menu cleanly

$(function () {
  var topMenu = $("#scroll");
  var topMenuHeight = $("header").outerHeight() + $(".container").outerHeight() + 5;

  var menuItems = topMenu.find("a[href^='#']");

  function closeMobileMenuIfOpen() {
    var ul = document.getElementById("cfix");
    if (ul && ul.className.indexOf("responsive") !== -1) {
      // close the menu by toggling it once
      if (typeof window.myMenu === "function") window.myMenu();
    }
  }

  menuItems.on("click", function (event) {
    var href = $(this).attr("href");
    var target = $(href);

    if (target.length) {
      event.preventDefault();

      $("html, body").stop().animate(
        { scrollTop: target.offset().top - topMenuHeight },
        650
      );

      closeMobileMenuIfOpen();
    }
  });
});
