/**
 * Enables 'add days' section (mobile only)
 */
function showAddDays() {
    $("#selectDateCol").show();
    $("#showAddDaysCol").remove();
}

/**
 * Enables one selected entry type
 * @param {*} typeString 
 */
function selectType(typeString) {
    $("#selectedType").removeAttr("id");
    $("[onClick='selectType(" + '"' + typeString + '"' + ")']").attr("id", "selectedType");
    selectedTypeString = typeString;
  
    tryFixAmount();
  
    if($("[onClick='selectType(" + '"' + typeString + '"' + ")']").parent().attr("id") == "spendingTypeList")
      $("#amountInput").val(-Math.abs($("#amountInput").val()));
    else 
      $("#amountInput").val(Math.abs($("#amountInput").val()));
}

/**
 * Displays 'edit entry' dialog/modal
 * @param {*} entryID 
 */
function showEditEntry(entryID) {
    currentEntryID = entryID; // record for further updates
  
    $("#editEntryDate").val(entries[currentEntryID].shortDate);
    $("#editEntryAmount").val(entries[currentEntryID].amount);
    $("#editEntryComment").val(entries[currentEntryID].comment);
    $("#editEntryType").val(entries[currentEntryID].type);
    $("#editEntryNecessary").prop("checked", entries[currentEntryID].necessary);
    
    $("#editEntryModal").modal(); // show dialog
  }