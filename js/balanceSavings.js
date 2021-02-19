/**
 * Fetches and displays current balance from Firebase API
 */
function loadCurrentBalance() {
  firestore
    .doc(`${userID}/data`)
    .get()
    .then(function (doc) {
      $("#balanceField").html(doc.data().balance.toFixed(2));
      $("#adjustedBalanceInput").val(doc.data().balance.toFixed(2));
      $("#savingsField").val(doc.data().savings.toFixed(0));
      $("#adjustedSavingsInput").val(doc.data().savings.toFixed(0));
      currentBalance = parseFloat(doc.data().balance.toFixed(2));
    });
}

/**
 * Updates balance in Firebase API by specified amount (INTERNAL FUNCTION)
 * @param {*} amount
 */
function increaseBalance(amount) {
  if (isNaN(amount)) {
    showNotification(
      "balance NOT updated",
      RED,
      "increaseBalance",
      "amount is not a numeric value"
    );
  }

  // round to 2 digits
  amount = parseFloat(amount.toFixed(2));

  firestore
    .doc(`${userID}/data`)
    .update({
      balance: firebase.firestore.FieldValue.increment(amount),
    })
    .then(function () {
      showNotification("balance updated", GREEN);
      loadCurrentBalance();
    })
    .catch(function (error) {
      showNotification("balance NOT updated", RED, "increaseBalance", error);
    });
}

/**
 * Updates savings in Firebase API to a specified value in entry box
 */
function updateSavings() {
  if (
    !confirm(
      `Do you want to adjust savings from ${
        $("#savingsField").val()
      } to ${
        parseFloat($("#adjustedSavingsInput").val())
      }?`
    )
  )
    return;

  firestore
    .doc(`${userID}/data`)
    .update({
      savings: parseFloat($("#adjustedSavingsInput").val()),
    })
    .then(function () {
      showNotification("savings updated", GREEN);
      loadCurrentBalance();
    })
    .catch(function (error) {
      showNotification("savings NOT updated", RED, "updateSavings", error);
    });
}

/**
 * Updates balance in Firebase API to a specified value in entry box
 */
function adjustBalance() {
  if (
    !confirm(
      `Do you want to adjust balance from ${currentBalance} to ${newBalance} ?`
    )
  )
    return;

  // update balance
  firestore
    .doc(`${userID}/data`)
    .update({
      balance: parseFloat($("#adjustedBalanceInput").val()),
    })
    .then(function () {
      showNotification("balance updated", GREEN);
      loadCurrentBalance();
    })
    .catch(function (error) {
      showNotification("balance NOT updated", RED, "adjustBalance", error);
    });

  // record error correction entry
  firestore
    .collection(userID)
    .doc()
    .set({
      amount: Number((newBalance - currentBalance).toFixed(2)),
      comment: "Error correction",
      type: "Error correction",
      date: firebase.firestore.Timestamp.fromDate(new Date()),
    })
    .then(function () {
      showNotification("uploaded succesfully", GREEN);
      fetchEntryList();
    })
    .catch(function (error) {
      showNotification("error uploading", RED, "submitEntry", error);
    });
}

/**
 * Try to make amount numbers suitable for Firebase API
 */
function tryFixAmount() {
  const valueString = $("#amountInput").val();
  const replString = valueString.replace(",", ".");

  if (!isNaN(replString)) $("#amountInput").val(replString);
}
