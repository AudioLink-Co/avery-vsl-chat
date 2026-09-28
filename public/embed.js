(function () {
  var script = document.currentScript;
  if (!script) return;

  var origin = new URL(script.src).origin;
  var height = script.getAttribute("data-height") || "620";
  var maxWidth = script.getAttribute("data-max-width") || "760px";
  var target = script.getAttribute("data-booking-target") === "self" ? "self" : "blank";
  var src = origin + "/embed";
  if (target === "self") {
    src += "?bookingTarget=self";
  }

  var iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.title = "Chat with Avery from AudioLink";
  iframe.loading = "lazy";
  iframe.style.width = "100%";
  iframe.style.maxWidth = maxWidth;
  iframe.style.height = /(px|%|vh|vw|rem|em)$/.test(String(height)) ? String(height) : height + "px";
  iframe.style.border = "0";
  iframe.style.borderRadius = "20px";
  iframe.style.display = "block";
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

  script.insertAdjacentElement("afterend", iframe);
})();
