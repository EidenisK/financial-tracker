function showNotification(
  text,
  color,
  notificationOrigin = null,
  error = null
) {
  if (notificationOrigin != null) console.log(notificationOrigin + ": " + text);
  if (error != null) console.error(error);

  const identifier = "notification" + $("#notificationList li").length;
  $("#notificationList").append(
    `<li id="${identifier}" class="notification" style="background:${color}">${text}</li>`
  );
  $("#" + identifier).bind("click", function () {
    $("#" + identifier).remove();
  });
  setTimeout(function () {
    $("#" + identifier).remove();
  }, NOTIFICATION_INTERVAL);
}
