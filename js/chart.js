$("#loadChartButton").on("click", async () => {
  // replace old chart

  $("#statisticsChart").remove();
  $("<canvas>")
    .attr({
      id: "statisticsChart",
    })
    .appendTo("#statisticsChartDiv");

  // update configuration variables

  ctx = document.getElementById("statisticsChart").getContext("2d");
  includeErrorCorrection = $("#includeBalanceAdjustmentsCheckbox").is(
    ":checked"
  );
  dateStart = new Date($("#inputDateStart").val());
  dateEnd = new Date($("#inputDateEnd").val());
  dateEnd.setDate(dateEnd.getDate() + 1);

  // by default, show the chart (and hide the list)

  $("#statisticsChart").show();
  $("#statisticsChartDiv").show();

  console.log("show stat chart div");
  $("#statisticsEntryListDiv").hide();
  $("#monthTable").hide();

  let chartType = $("#chartTypes option:selected").val();
  switch (chartType) {
    case "income&spending":
      await showByCategory();
      break;
    case "byMonth":
      await showByMonth();
      break;
    case "monthTable":
      await showTable();
      break;
    default:
      await showByTime();
      break;
  }
});

/**
 * Display line chart of balance against time
 */
async function showByTime() {
  try {
    let snap = await getEntriesFromDB(true, true); // ignore date interval

    let dataset = {
      label: "Balance",
      backgroundColor: "transparent",
      borderColor: "rgb(255, 99, 132)",
      data: [],
      showLine: true,
      datalabels: {
        labels: {
          title: null,
        },
      },
    };

    // chronologically get all entries and calculate balance history after each entry
    let dayValues = {};

    let amount = 0;
    for (const entry of snap) {
      amount += entry.amount;
      let docDate = moment(entry.date);
      if (docDate.isBefore(dateEnd) && docDate.isAfter(dateStart)) {
        dayValues[entry.shortDate] = amount;
      }
    }

    for(const day in dayValues) {
      dataset.data.push({
        x: moment(day).startOf("day").add(12, "hour"),
        y: parseFloat(dayValues[day].toFixed(2))
      });
    }

    showChart(
      "scatter",
      { datasets: [dataset] },
      {
        xAxesType: "time",
        xAxesTime: {
          unit: "day",
        },
        lineTension: 0,
      }
    );
  } catch (error) {
    showNotification("cannot display history chart", RED, "showByTime", error);
  }
}

/**
 * Display chart of all entries grouped by category
 */
async function showByCategory() {
  let entries;
  try {
    entries = await getEntriesFromDB();
  } catch (error) {
    console.error(error);
    showNotification(
      "cannot display income and spending chart",
      RED,
      "showByCategory",
      error
    );
  }

  let categoryValues = {};
  entries.forEach(function (entry) {
    let datasetID = entry.amount > 0 ? 0 : 1;

    if (!categoryValues[entry.type])
      categoryValues[entry.type] = [
        { type: entry.type, amount: 0 }, // income
        { type: entry.type, amount: 0 }, // spending
      ];

    categoryValues[entry.type][datasetID].amount += Math.abs(entry.amount);
  });

  let sortedArray = Object.values(categoryValues).sort(
    (a, b) => b[0].amount + b[1].amount - (a[0].amount + a[1].amount)
  );

  let barChartData = {
    labels: ["Income", "Spending"],
    datasets: [],
  };

  let counter = 0;
  for (const entry of sortedArray) {
    barChartData.datasets.push({
      data: [
        Math.abs(entry[0].amount.toFixed(2)),
        Math.abs(entry[1].amount.toFixed(2)),
      ],
      label: entry[0].type,
      backgroundColor: chartColors[counter],
    });
    counter++;
  }

  showChart("bar", barChartData, { stacked: true });

  // at the bottom of the double bar chart, show entry list

  $("#statisticsEntryListDiv").show();

  let entryListContent = {};
  let entryTypeSum = {};
  let selectOptions = "";

  entries.forEach(function (entry) {
    if (!entryListContent[entry.type]) {
      entryListContent[entry.type] = "";
      entryTypeSum[entry.type] = 0;

      selectOptions += `<option value="${entry.type}">${
        entry.amount > 0 ? "+ " : "- "
      } ${entry.type}</option>`;
    }

    entryListContent[entry.type] += `<tr><td>${moment(entry.date).format(
      "MM-DD"
    )}</td><td>${entry.amount}</td><td>${entry.comment}</td></tr>`;
    entryTypeSum[entry.type] += entry.amount;
  });

  $("#statisticsEntryListSelect").html(selectOptions);
  $("#statisticsEntryListSelect").change(function () {
    const selectedType = $("#statisticsEntryListSelect").val();

    $("#statisticsEntryList").html(
      `<tr><th colspan="3">Total:${Math.abs(entryTypeSum[selectedType]).toFixed(
        2
      )}</th></tr>` + entryListContent[selectedType]
    );
  });
  $("#statisticsEntryListSelect").change();
}

/**
 * Display chart of spending sum / income sum each calendar month
 */
async function showByMonth() {
  let monthValues = {};

  let entries;
  try {
    entries = await getEntriesFromDB();
  } catch (error) {
    console.error(error);
    showNotification(
      "cannot display income and spending by month chart",
      RED,
      "showByMonth",
      error
    );
  }

  entries.forEach(function (entry) {
    let monthID = moment(entry.date).startOf("month").format("YYYY-MM");
    let datasetID = entry.amount > 0 ? 0 : 1;

    if (!monthValues[monthID]) monthValues[monthID] = [0, 0];
    monthValues[monthID][datasetID] += entry.amount;
  });

  let barChartData = {
    labels: [],
    datasets: [
      {
        label: "Income",
        backgroundColor: "#00ff0080",
        data: [],
      },
      {
        label: "Spending",
        backgroundColor: "#ff000080",
        data: [],
      },
    ],
  };

  for (const monthNum in monthValues) {
    barChartData.labels.push(monthNum);

    barChartData.datasets[0].data.push(
      parseFloat(
        (Math.abs(monthValues[monthNum][0])).toFixed(2)
      )
    );
    barChartData.datasets[1].data.push(
      parseFloat(
        (Math.abs(monthValues[monthNum][1])).toFixed(2)
      )
    );
  }

  showChart("bar", barChartData);
}

async function showTable() {
  let monthValues = {};

  let entries;
  try {
    entries = await getEntriesFromDB();
  } catch (error) {
    console.error(error);
    showNotification(
      "cannot display income and spending table",
      RED,
      "showTable",
      error
    );
  }

  let categories = {
    family: {},
    university_and_work: {},
    rent: {},
    necessary_expenses: {},
    unnecessary_expenses: {},
    savings: {}
  };

  entries.forEach(function (entry) {
    let monthID = moment(entry.date).startOf("month").format("YYYY-MM");

    if(!categories.family[monthID]) categories.family[monthID] = 0;
    if(!categories.university_and_work[monthID]) categories.university_and_work[monthID] = 0;
    if(!categories.rent[monthID]) categories.rent[monthID] = 0;
    if(!categories.necessary_expenses[monthID]) categories.necessary_expenses[monthID] = 0;
    if(!categories.unnecessary_expenses[monthID]) categories.unnecessary_expenses[monthID] = 0;
    if(!categories.savings[monthID]) categories.savings[monthID] = 0;

    switch(entry.type) {
      case "Family":            categories.family[monthID] += entry.amount; break;
      case "University":        categories.university_and_work[monthID] += entry.amount; break;
      case "Job":               categories.university_and_work[monthID] += entry.amount; break;
      case "Other income":      categories.family[monthID] += entry.amount; break;
      case "Food":              categories.necessary_expenses[monthID] += entry.amount; break;
      case "Transportation":    categories.necessary_expenses[monthID] += entry.amount; break;
      case "Leisure":           categories.unnecessary_expenses[monthID] += entry.amount; break;
      case "Rent":              categories.rent[monthID] += entry.amount; break;
      case "Into savings":      categories.savings[monthID] += entry.amount; break;
      case "Gift":              categories.unnecessary_expenses[monthID] += entry.amount; break;
      case "University items":  categories.necessary_expenses[monthID] += entry.amount; break;
      case "Household":         categories.necessary_expenses[monthID] += entry.amount; break;
      case "Other spending":    categories.unnecessary_expenses[monthID] += entry.amount; break;
      case "Error correction":  entry.amount > 0 
        ? categories.family[monthID] += entry.amount 
        : categories.necessary_expenses[monthID] += entry.amount; 
        break;
      case "Default":           entry.amount > 0
        ? categories.family[monthID] += entry.amount
        : categories.necessary_expenses[monthID] += entry.amount;
        break;
    }

    monthValues[monthID] = true;
  });

  let tableString = `<tr><th></th>
    <th>University & Job</th>
    <th>Family & Other</th>
    <th>Rent & Bills</th>
    <th>Necessary expenses</th>
    <th>Unnecessary expenses</th>
    <th>Into savings</th>
    <th>INCOME</th>
    <th>EXPENSES</th>
    <th>DIFFERENCE</th></tr>`;  

  for(const monthID in monthValues) {
    let incomeSum = categories.family[monthID] + categories.university_and_work[monthID];
    let expenseSum = categories.rent[monthID] + categories.necessary_expenses[monthID] + categories.unnecessary_expenses[monthID];

    tableString += `<tr><td>${monthID}</td>
    <td>${categories.university_and_work[monthID].toFixed(2)}</td>
    <td>${categories.family[monthID].toFixed(2)}</td>
    <td>${categories.rent[monthID].toFixed(2)}</td>
    <td>${categories.necessary_expenses[monthID].toFixed(2)}</td>
    <td>${categories.unnecessary_expenses[monthID].toFixed(2)}</td>
    <td>${categories.savings[monthID].toFixed(2)}</td>
    <td>${incomeSum.toFixed(2)}</td>
    <td>${expenseSum.toFixed(2)}</td>
    <td>${(incomeSum + expenseSum).toFixed(2)}</td></tr>`;
  }

  $("#monthTable").html(tableString);
  $("#monthTable").show();
  $("#statisticsChartDiv").hide();
}

/**
 * Generic purpose function to fetch entries from Firebase API
 * @param {*} ignoreDateInterval 
 * @param {*} ignoreCheckboxes 
 */
async function getEntriesFromDB(ignoreDateInterval, ignoreCheckboxes) {
  // get collection
  let snap;
  if (ignoreDateInterval)
    snap = await firestore
      .collection(userID)
      .where("date", "<=", dateEnd)
      .withConverter(entryConverter)
      .get();
  else
    snap = await firestore
      .collection(userID)
      .withConverter(entryConverter)
      .where("date", ">=", dateStart)
      .where("date", "<=", dateEnd)
      .get();

  let entriesToDisplay = [];

  // check if each entry should be included
  snap.forEach(function (doc) {
    if (
      !ignoreCheckboxes &&
      doc.data().errorCorrection && !includeErrorCorrection
    ) {
      return;
    }
    entriesToDisplay.push(doc.data());
  });

  return entriesToDisplay;
}

/**
 * General function to display a chart using chart.js (applies new chart to pre-setupped canvas context)
 * @param {*} type
 * @param {*} data
 * @param {*} params might want to include `stacked`, `x[y]AxesType`, `x[y]AxesTime`, `lineTension`
 */
function showChart(type, data, params) {
  chart = new Chart(ctx, {
    type: type,
    data: data,
    options: {
      scales: {
        yAxes: [
          {
            stacked: params?.stacked,
            type: params?.yAxesType,
            time: params?.yAxesTime,
          },
        ],
        xAxes: [
          {
            stacked: params?.stacked,
            type: params?.xAxesType,
            time: params?.xAxesTime,
          },
        ],
      },
      elements: {
        line: {
          tension: params?.lineTension,
        },
      },
      plugins: {
        datalabels: {
          display: function (context) {
            return context.dataset.data[context.dataIndex] != 0;
          },
        },
      },
    },
  });
}
