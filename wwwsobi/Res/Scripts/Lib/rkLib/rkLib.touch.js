rkLib("rkLib.touch", function(ns, $, undefined) {
  var body = $("body");
  
  var touches = {},
    touchLogs = {};

  touches.down = {};
  touchLogs.down = {};

  $(function() {
    var body = $("body");
    $(document).on("touchstart", function(evt) {
      evt.preventDefault();

      $.each($.toArray(evt.changedTouches), function(el) {
        touches[el.identifier] = el;
        touches.down[el.identifier] = $.extend({}, el);
        body.append(touchLogs[el.identifier] = $('<div class="touch-log">')
          .text(el.identifier)
          .css("left", el.pageX)
          .css("top", el.pageY))
        .append(touchLogs.down[el.identifier] = $('<div class="touch-log touch-down">')
          .text(el.identifier)
          .css("left", el.pageX)
          .css("top", el.pageY));
      });
    }).on("touchmove", function(evt) {
      evt.preventDefault();

      $.each($.toArray(evt.changedTouches), function(el) {
        touchLogs[el.identifier].css("left", el.pageX)
          .css("top", el.pageY);
      });
    }).on("touchend touchcancel", function(evt) {
      console.log("hi!");
      evt.preventDefault();

      $.each($.toArray(evt.changedTouches), function(el) {
        delete touches[el.identifier];
        delete touches.down[el.identifier];
        touchLogs[el.identifier].remove();
        touchLogs.down[el.identifier].remove();
      });
    });
  });
});