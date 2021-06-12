//---------- config & login globals -----------------
// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyB_qorIJpxTgoOVCDRlbSvTHkY7DO28770",
    authDomain: "financial-tracker-b3c68.firebaseapp.com",
    databaseURL: "https://financial-tracker-b3c68.firebaseio.com",
    projectId: "financial-tracker-b3c68",
    storageBucket: "financial-tracker-b3c68.appspot.com",
    messagingSenderId: "583889517786",
    appId: "1:583889517786:web:92bd4ddf7824f183aa39e3"
  };

firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();
let userID = "";
//---------------------------------------------------

//--------- balance globals --------------------------
let currentBalance = 0;
//----------------------------------------------------

//----------------- entry list globals -----------------
const entryTypes = {
	// income
	"Family": {
		icon: "fas fa-users",
		entryClass: "greenAmount",
		entryIconId: "incomeEntryType",
		title: "Family"
	},
	"University": {
		icon: "fas fa-graduation-cap",
		entryClass: "greenAmount",
		entryIconId: "incomeEntryType",
		title: "University"
	},
	"Job": {
		icon: "fas fa-briefcase",
		entryClass: "greenAmount",
		entryIconId: "incomeEntryType",
		title: "Job"
	},
	"Other income": {
		icon: "fas fa-question",
		entryClass: "greenAmount",
		entryIconId: "incomeEntryType",
		title: "Other"
	},
	// spendings
	"Food": {
		icon: "fas fa-utensils",
		entryClass: "redAmount",
		entryIconId: "spendingEntryType",
		title: "Food"
	},
	"Transportation": {
		icon: "fas fa-car",
		entryClass: "redAmount",
		entryIconId: "spendingEntryType",
		title: "Transportation"
	},
	"Leisure": {
		icon: "fas fa-cocktail",
		entryClass: "redAmount",
		entryIconId: "spendingEntryType",
		title: "Leisure"
	},
	"Rent": {
		icon: "fas fa-home",
		entryClass: "redAmount",
		entryIconId: "spendingEntryType",
		title: "Rent & Bills"
	},
	"Into savings": {
		icon: "fas fa-piggy-bank",
		entryClass: "redAmount",
		entryIconId: "spendingEntryType",
		title: "Into savings"
	},
	"Gift": {
		icon: "fas fa-gift",
		entryClass: "redAmount",
		entryIconId: "spendingEntryType",
		title: "Gift"
	},
	"University items": {
		icon: "fas fa-graduation-cap",
		entryClass: "redAmount",
		entryIconId: "spendingEntryType",
		title: "University items"
	},
	"Household": {
		icon: "fas fa-shopping-basket",
		entryClass: "redAmount",
		entryIconId: "spendingEntryType",
		title: "Household items"
	},
	"Other spending": {
		icon: "fas fa-question",
		entryClass: "redAmount",
		entryIconId: "spendingEntryType",
		title: "Other"
	},
	// error correction
	"Error correction": {
		icon: "fas fa-exclamation-triangle",
		entryClass: "grayAmount",
		entryIconId: "errorEntryType",
		title: "Error correction"
	},
	// fallback
	"Default": {
		icon: "fas fa-question",
		entryClass: "redAmount",
		entryIconId: "spendingEntryType",
		title: "Default"
	}
};

let entries = {};

const entryList = $("#entryTable");
let selectedTypeString = "";

let positiveSum = 0;
let negativeSum = 0;
//------------------------------------------------------

//----------------- chart globals ----------------------
const chartColors = [
	'#9de92c',
	'#890a77',
	'#4940c1',
	'#296c05',
	'#fb4748',
	'#4d274b',
	'#2b8cd2',
	'#f7b323',
	'#91f05f',
	'#73665e',
	'#508eae',
	'#d0f1d0',
	'#d2b87e',
	'#da902a',
	'#11e658'
];
let chart = null;
const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
let ctx = null;
let onlyNecessary = false;
let includeErrorCorrection = false;
//------------------------------------------------------

//----------------- UI setup tasks ---------------------
let entriesDateEnd = moment();
let entriesDateStart = moment().subtract(1, "week");
$("#entriesDateStart").val(entriesDateStart.format("YYYY-MM-DD"));
$("#entriesDateEnd").val(entriesDateEnd.format("YYYY-MM-DD"));
$("#entrySelectDate").val(entriesDateEnd.format("YYYY-MM-DD"));

let dateEnd = moment();
let dateStart = moment().subtract(1, "months");
$("#inputDateEnd").val(dateEnd.format("YYYY-MM-DD"));
$("#inputDateStart").val(dateStart.format("YYYY-MM-DD"));

$("#includeBalanceAdjustmentsCheckbox").prop("checked", false);
$("#showErrorEntriesCheckbox").prop("checked", false);
$("#entrySelectDate").val(0);

// populate new entry type list
let incomeTypeListHtml = "";
let spendingTypeListHtml = "";
for(const typeName in entryTypes) {
	let type = entryTypes[typeName];
	if(type.entryIconId == "incomeEntryType") {
		incomeTypeListHtml += `<li class="entryType" onClick='selectType("${typeName}")'><i class="${type.icon}"></i> ${type.title}</li>`;
	} else if(type.entryIconId == "spendingEntryType" && typeName != "Default") {
		spendingTypeListHtml += `<li class="entryType" onClick='selectType("${typeName}")'><i class="${type.icon}"></i> ${type.title}</li>`;
	}
}
$("#incomeTypeList").html(incomeTypeListHtml);
$("#spendingTypeList").html(spendingTypeListHtml);

// populate edit entry type list
let editTypeListHtml = "";
for(const typeName in entryTypes) {
	if(typeName == "Default") continue;
	editTypeListHtml += `<option value="${typeName}">${entryTypes[typeName].title}</option>`;
}
$("#editEntryType").html(editTypeListHtml);

checkForUpdate();
//------------------------------------------------------

//---------------- notification globals ----------------
const GREEN = "#9BF19F";
const RED = "#E57C7C";
const NOTIFICATION_INTERVAL = 5000; 
//------------------------------------------------------

//----------------- edit entry globals -----------------
let currentEntryID = null;
//------------------------------------------------------