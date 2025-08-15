const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const exportBtn = document.getElementById('exportBtn');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

let categoryChart, monthlyChart;

function updateValues() {
  const amounts = transactions.map((t) => t.amount);
  const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
  const income = amounts
    .filter((item) => item > 0)
    .reduce((acc, item) => acc + item, 0)
    .toFixed(2);
  const expense = (
    amounts.filter((item) => item < 0).reduce((acc, item) => acc + item, 0) * -1
  ).toFixed(2);

  balance.innerText = `₹${total}`;
  money_plus.innerText = `+₹${income}`;
  money_minus.innerText = `-₹${expense}`;

  updateCategoryChart();
  updateMonthlyChart();
}

function addTransaction(e) {
  e.preventDefault();

  const transaction = {
    id: Date.now(),
    text: text.value.trim(),
    amount: +amount.value,
    category: category.value,
    date: new Date().toISOString(),
  };

  transactions.push(transaction);
  addTransactionDOM(transaction);
  updateValues();
  updateLocalStorage();

  text.value = '';
  amount.value = '';
  category.value = '';
}

function addTransactionDOM(transaction) {
  const sign = transaction.amount > 0 ? '+' : '-';
  const li = document.createElement('li');

  li.innerHTML = `
    <span>${transaction.text} <small>(${transaction.category})</small></span>
    <span>${sign}₹${Math.abs(transaction.amount)}</span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;

  list.appendChild(li);
}

function removeTransaction(id) {
  transactions = transactions.filter((transaction) => transaction.id !== id);
  updateLocalStorage();
  init();
}

function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function updateCategoryChart() {
  const categoryTotals = {};
  transactions
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(document.getElementById('categoryChart'), {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          label: 'Expenses by Category',
          data,
          backgroundColor: ['#ff6384', '#36a2eb', '#ffcd56', '#4caf50', '#9966ff'],
        },
      ],
    },
  });
}

function updateMonthlyChart() {
  const monthlyTotals = {};
  transactions.forEach((t) => {
    const d = new Date(t.date);
    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyTotals[key] = (monthlyTotals[key] || 0) + Math.abs(t.amount);
  });

  const labels = Object.keys(monthlyTotals);
  const data = Object.values(monthlyTotals);

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(document.getElementById('monthlyChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Spending',
          data,
          backgroundColor: '#36a2eb',
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// ===== Excel Export =====
function exportToExcel() {
  if (!transactions.length) {
    alert('No transactions to export.');
    return;
  }

  // Prepare clean rows for Excel
  const rows = transactions.map((t) => ({
    Date: new Date(t.date).toLocaleString(),
    Description: t.text,
    Category: t.category,
    Amount: t.amount,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  // Auto-size columns (simple heuristic)
  const colWidths = Object.keys(rows[0]).map((key) => ({ wch: Math.max(key.length, 12) }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, 'expenses.xlsx');
}

exportBtn.addEventListener('click', exportToExcel);

function init() {
  list.innerHTML = '';
  transactions.forEach(addTransactionDOM);
  updateValues();
}

init();
form.addEventListener('submit', addTransaction);