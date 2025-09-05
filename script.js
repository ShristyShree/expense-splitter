let people = [];
let expenses = [];

// Add a new person
function addPerson() {
  const input = document.getElementById("personInput");
  const name = input.value.trim();

  if (!name) {
    alert("Please enter a valid name");
    return;
  }

  if (people.includes(name)) {
    alert("Person already exists");
    return;
  }

  people.push(name);
  input.value = "";
  renderPeople();
  saveData();
}

// Render people list with delete buttons & update selects/checkboxes
function renderPeople() {
  const list = document.getElementById("peopleList");
  const paidBy = document.getElementById("paidBy");
  const splitAmong = document.getElementById("splitAmong");

  list.innerHTML = "";
  paidBy.innerHTML = "";
  splitAmong.innerHTML = "";

  people.forEach(person => {
    // Person list with delete button
    const li = document.createElement("li");
    li.textContent = person + " ";

    const delBtn = document.createElement("button");
    delBtn.textContent = "x";
    delBtn.style.marginLeft = "10px";
    delBtn.style.color = "red";
    delBtn.onclick = () => deletePerson(person);

    li.appendChild(delBtn);
    list.appendChild(li);

    // PaidBy dropdown options
    const option = document.createElement("option");
    option.value = person;
    option.textContent = person;
    paidBy.appendChild(option);

    // SplitAmong checkboxes
    const checkboxDiv = document.createElement("div");
    checkboxDiv.innerHTML = `<input type="checkbox" value="${person}" checked> ${person}`;
    splitAmong.appendChild(checkboxDiv);
  });
}

// Delete a person and clean up expenses
function deletePerson(person) {
  people = people.filter(p => p !== person);

  // Remove expenses paid by this person
  expenses = expenses.filter(exp => exp.paidBy !== person);

  // Remove person from splitBetween arrays
  expenses.forEach(exp => {
    exp.splitBetween = exp.splitBetween.filter(p => p !== person);
  });

  saveData();
  renderPeople();
  renderBalances();
  renderExpenses();
  renderChart();
}

// Add an expense
function addExpense() {
  const amountInput = document.getElementById("amountInput");
  const amount = parseFloat(amountInput.value);
  const paidBy = document.getElementById("paidBy").value;
  const splitCheckboxes = document.querySelectorAll("#splitAmong input[type='checkbox']:checked");

  const splitBetween = Array.from(splitCheckboxes).map(cb => cb.value);

  // Validation
  if (!amount || amount <= 0) {
    alert("Enter a valid amount");
    return;
  }
  if (!paidBy) {
    alert("Select who paid");
    return;
  }
  if (splitBetween.length === 0) {
    alert("Select at least one person to split among");
    return;
  }

  expenses.push({ amount, paidBy, splitBetween });
  amountInput.value = "";

  renderBalances();
  renderExpenses();
  saveData();
  renderChart();
}

// Updated renderBalances function with no $ sign and "who pays whom"
function renderBalances() {
  // Calculate net balances for each person
  const balances = {};
  people.forEach(p => balances[p] = 0);

  expenses.forEach(exp => {
    const splitAmount = exp.amount / exp.splitBetween.length;
    exp.splitBetween.forEach(p => {
      if (p !== exp.paidBy) {
        balances[p] -= splitAmount;
        balances[exp.paidBy] += splitAmount;
      }
    });
  });

  const balancesDiv = document.getElementById("balances");
  balancesDiv.innerHTML = "";

  // Show net balances without dollar sign
  for (const [person, balance] of Object.entries(balances)) {
    const p = document.createElement("p");
    p.textContent = `${person}: ${balance.toFixed(2)}`;
    p.style.color = balance < 0 ? "red" : balance > 0 ? "green" : "black";
    balancesDiv.appendChild(p);
  }

  // Now compute who owes whom (settlement instructions)
  const owesList = document.createElement("div");
  owesList.style.marginTop = "15px";

  const debtors = [];
  const creditors = [];

  // Separate debtors and creditors
  for (const [person, balance] of Object.entries(balances)) {
    if (balance < -0.01) {
      debtors.push({ person, amount: -balance }); // amount owed positive
    } else if (balance > 0.01) {
      creditors.push({ person, amount: balance });
    }
  }

  // Match debts to minimize transactions
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const minAmount = Math.min(debtor.amount, creditor.amount);

    const p = document.createElement("p");
    p.textContent = `${debtor.person} pays ${creditor.person}: ${minAmount.toFixed(2)}`;
    owesList.appendChild(p);

    debtor.amount -= minAmount;
    creditor.amount -= minAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  if (owesList.childElementCount > 0) {
    const title = document.createElement("h3");
    title.textContent = "Settlement:";
    balancesDiv.appendChild(title);
    balancesDiv.appendChild(owesList);
  }
}

// Render expense list with delete buttons
function renderExpenses() {
  const expensesList = document.getElementById("expensesList");
  expensesList.innerHTML = "";

  expenses.forEach((exp, index) => {
    const li = document.createElement("li");
    li.textContent = `${exp.paidBy} paid ${exp.amount.toFixed(2)} for ${exp.splitBetween.join(", ")}`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.marginLeft = "10px";
    delBtn.style.color = "red";
    delBtn.onclick = () => deleteExpense(index);

    li.appendChild(delBtn);
    expensesList.appendChild(li);
  });
}

// Delete expense by index
function deleteExpense(index) {
  expenses.splice(index, 1);
  saveData();
  renderExpenses();
  renderBalances();
  renderChart();
}

// Save data to localStorage
function saveData() {
  localStorage.setItem('people', JSON.stringify(people));
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Load data from localStorage
function loadData() {
  const savedPeople = JSON.parse(localStorage.getItem('people'));
  const savedExpenses = JSON.parse(localStorage.getItem('expenses'));

  if (savedPeople) people = savedPeople;
  if (savedExpenses) expenses = savedExpenses;
}

// Export balances to .txt file (no dollar signs)
function exportBalances() {
  let text = "Balances:\n";
  const balances = {};

  people.forEach(p => balances[p] = 0);

  expenses.forEach(exp => {
    const splitAmount = exp.amount / exp.splitBetween.length;
    exp.splitBetween.forEach(p => {
      if (p !== exp.paidBy) {
        balances[p] -= splitAmount;
        balances[exp.paidBy] += splitAmount;
      }
    });
  });

  for (const [person, balance] of Object.entries(balances)) {
    text += `${person}: ${balance.toFixed(2)}\n`;
  }

  // Also export settlement instructions
  text += "\nSettlement:\n";

  const debtors = [];
  const creditors = [];

  for (const [person, balance] of Object.entries(balances)) {
    if (balance < -0.01) {
      debtors.push({ person, amount: -balance });
    } else if (balance > 0.01) {
      creditors.push({ person, amount: balance });
    }
  }

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const minAmount = Math.min(debtor.amount, creditor.amount);

    text += `${debtor.person} pays ${creditor.person}: ${minAmount.toFixed(2)}\n`;

    debtor.amount -= minAmount;
    creditor.amount -= minAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'balances.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// Render chart using Chart.js (no $ sign needed here)
function renderChart() {
  const ctx = document.getElementById('balanceChart').getContext('2d');

  const balances = {};
  people.forEach(p => balances[p] = 0);

  expenses.forEach(exp => {
    const splitAmount = exp.amount / exp.splitBetween.length;
    exp.splitBetween.forEach(p => {
      if (p !== exp.paidBy) {
        balances[p] -= splitAmount;
        balances[exp.paidBy] += splitAmount;
      }
    });
  });

  const labels = Object.keys(balances);
  const data = Object.values(balances);

  if (window.myChart) {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Balance',
        data: data,
        backgroundColor: data.map(v => v < 0 ? 'rgba(255, 99, 132, 0.6)' : 'rgba(75, 192, 192, 0.6)')
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Initialize app on window load
window.onload = () => {
  loadData();
  renderPeople();
  renderBalances();
  renderExpenses();
  renderChart();
};
