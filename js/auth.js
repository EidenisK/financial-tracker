function tryLogIn() {
  const email = $("#emailInput").val();
  const password = $("#passwordInput").val();

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(function () {
      userID = firebase.auth().currentUser.uid;

      fetchEntryList();
      loadCurrentBalance(false);

      $("#postLoginDiv").show();
      $("#loginDiv").hide();

      showNotification("logged in", GREEN);
    })
    .catch(function (error) {
      showNotification(error, RED, "tryLogIn");
    });
}

function loginWithEnter(event) {
  if (event.key != "Enter") return;
  if ($("#emailInput").val() == "" || $("#passwordInput").val() == "") return;
  tryLogIn();
}
