/**
 * JS <--> Firestore
 */
var entryConverter = {
  toFirestore: function (entry) {
    return {
      date: firebase.firestore.Timestamp.fromDate(entry.date),
      amount: entry.amount,
      type: entry.type,
      comment: entry.comment,
      necessary: entry.necessary,
    };
  },
  fromFirestore: function (snapshot, options) {
    const data = snapshot.data(options);
    date = data.date.toDate();
    return {
      // base properties
      date: date,
      amount: parseFloat(data.amount),
      type: data.type,
      comment: data.comment,
      necessary: data.necessary ?? true,
      // derivated properties
      formattedDate: moment(date).format("YYYY-MM-DD HH:mm:ss"),
      shortDate: moment(date).format("YYYY-MM-DD"),
      dateMMDD: moment(date).format("MM-DD"),
      errorCorrection: data.type === "Error correction",
      // visual properties
      entryIcon: `<i class="${
        entryTypes[data.type]?.icon ?? entryTypes["Default"].icon
      }"></i>`,
      iconClass: data.necessary ? "borderedIcon" : "",
      entryClass:
        entryTypes[data.type]?.entryClass ?? entryTypes["Default"].entryClass,
      entryIconId:
        entryTypes[data.type]?.entryIconId ?? entryTypes["Default"].entryIconId,
    };
  },
};

/**
 * Downloads entry list from Firebase API
 */
function fetchEntryList() {
  const intervalEnd = new Date($("#entriesDateEnd").val());
  const intervalStart = new Date($("#entriesDateStart").val());
  intervalEnd.setDate(intervalEnd.getDate() + 1); // include current day

  entries = {};

  firestore
    .collection(userID)
    .withConverter(entryConverter)
    .where("date", ">", intervalStart)
    .where("date", "<", intervalEnd)
    .orderBy("date", "desc")
    .get()
    .then(function (snap) {
      snap.forEach(function (doc) {
        if (doc.exists) entries[doc.id] = doc.data();
      });
      loadEntryList();
    });
}

/**
 * Loads entry list data into the UI
 */
function loadEntryList() {
  let untrackedAmount = 0;
  positiveSum = 0;
  negativeSum = 0;

  const showErrorEntries = $("#showErrorEntriesCheckbox").prop("checked");

  // add headers
  if (Object.keys(entries).length > 0)
    entryList.html(
      '<th>Date</th><th>Type</th><th>Amount</th><th>Comment</th><th class="hideOnMobile">Actions</th>'
    );

  for (const entryID in entries) {
    const entry = entries[entryID];

    // track sum of +/-/? groups
    if (entry.type == "Error correction") {
      untrackedAmount += entry.amount;
      if (!showErrorEntries) continue;
    } else {
      if (entry.amount < 0) negativeSum += entry.amount;
      else positiveSum += entry.amount;
    }

    // format data into table row
    entryList.append(
      `<tr id="tableRow${$("#entryTable tr").length}">` +
      `<td>${entry.dateMMDD}</td>` +
      `<td><li class="${entry.iconClass}" id="${entry.entryIconId}">${entry.entryIcon}</li></td>` +
      `<td class="${entry.entryClass}">${entry.amount} €</td>` +
      `<td>${entry.comment}</td>` +
      `<td class="hideOnMobile"><button onClick="showEditEntry('${entryID}')">Edit</button></td>` +
      "</tr>"
    );

    // open edit from context menu (mobile only)
    $("#tableRow" + ($("#entryTable tr").length - 1)).contextmenu(function () {
      showEditEntry(entryID);
    });
  }

  // update sum counters
  $("#positiveSumField").html(positiveSum.toFixed(2));
  $("#negativeSumField").html(negativeSum.toFixed(2));
  $("#sumField").html((positiveSum + negativeSum).toFixed(2));
  $("#untrackedField").html(untrackedAmount.toFixed(2));
}

/**
 * Delete currently open entry from Firebase API
 * @param {*} silentRemoval - if true, does not change the balance after deleting
 */
function deleteEntry(silentRemoval) {
  firestore.doc(userID + "/" + currentEntryID).delete();
  showNotification("deleted entry", GREEN);
  if (!silentRemoval)
    increaseBalance(-parseFloat(entries[currentEntryID].amount.toFixed(2)));
  fetchEntryList();
  $("#editEntryModal").modal("hide");
}

/**
 * Uploads entry to Firebase API
 */
function submitEntry() {
  // get and validate entry amount
  const valueInputString = $("#amountInput").val();
  if (isNaN(valueInputString)) {
    showNotification(
      "error reading entry amount",
      RED,
      "submitEntry",
      "cannot parse float from amount field"
    );
    return;
  }

  if (isNaN($("#entrySelectDate").val())) {
    $("#entrySelectDate").val(0);
  }

  // form new entry
  const daysToSubtract = parseInt($("#entrySelectDate").val());
  let newEntry = {
    amount: parseFloat(valueInputString),
    date: moment().subtract(-daysToSubtract, "days").toDate(),
    comment: $("#commentInput").val(),
    type: selectedTypeString,
    necessary: !$("#notNecessaryCheckbox").prop("checked"),
  };

  // upload
  const docRef = firestore.collection(userID).doc();
  docRef
    .set(newEntry)
    .then(function () {
      showNotification("uploaded succesfully", GREEN);
      fetchEntryList();
    })
    .catch(function (error) {
      showNotification("error uploading", RED, "submitEntry", error);
    });

  increaseBalance(newEntry.amount);
}

/**
 * Updates currently opened entry in Firebase API
 */
$("#editEntrySaveButton").on("click", async () => {
  let updatedEntry = {
    date: new Date($("#editEntryDate").val()),
    amount: parseFloat($("#editEntryAmount").val()),
    comment: $("#editEntryComment").val(),
    type: $("#editEntryType").val(),
    necessary: $("#editEntryNecessary").prop("checked"),
  };

  try {
    await firestore
      .doc(userID + "/" + currentEntryID)
      .withConverter(entryConverter)
      .set(updatedEntry);
    showNotification("Updated entry", GREEN, "updateEntry");
  } catch (error) {
    showNotification("error updating entry", RED, "updateEntry");
  }

  // update balance: old sum | remove old entry amount | add new entry amount
  increaseBalance(-entries[currentEntryID].amount + updatedEntry.amount);

  $("#editEntryModal").modal("hide");
  fetchEntryList();
});
