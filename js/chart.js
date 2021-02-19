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
  onlyNecessary = $("#showOnlyNecessaryCheckbox").is(":checked");
  includeErrorCorrection = $("#includeBalanceAdjustmentsCheckbox").is(
    ":checked"
  );
  dateStart = new Date($("#inputDateStart").val());
  dateEnd = new Date($("#inputDateEnd").val());
  dateEnd.setDate(dateEnd.getDate() + 1);

  // by default, show the chart (and hide the list)

  $("#statisticsChart").show();
  $("#statisticsEntryListDiv").hide();

  let chartType = $("#chartTypes option:selected").val();
  switch (chartType) {
    case "income&spending":
      await showByCategory();
      break;
    case "byMonth":
      await showByMonth();
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
      parseFloat(Math.abs(monthValues[monthNum][0]), 2)
    );
    barChartData.datasets[1].data.push(
      parseFloat(Math.abs(monthValues[monthNum][1]), 2)
    );
  }

  showChart("bar", barChartData);
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
      ((!doc.data().necessary && onlyNecessary) ||
        (doc.data().errorCorrection && !includeErrorCorrection))
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
