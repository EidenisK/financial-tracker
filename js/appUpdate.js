function checkForUpdate() {
  fetch(`./meta.json`).then((resp) => resp.json())
    .then(function (data) {
      try {
        let currentVersion = $("#versionDiv").text();
        let webVersion = data.version;

        if (!currentVersion || currentVersion != webVersion) {
          alert("There is a new app version. Please force refresh this page");
        }
      } catch (error) {
        alert("Failed to check app version information");
        console.log(error);
      }
    })
    .catch(function (error) {
      alert("Failed to check app version information");
      console.log(error);
    });
}
