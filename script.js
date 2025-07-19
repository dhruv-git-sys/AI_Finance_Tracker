const API_KEY = "YOUR_OPENAI_API_KEY"; // Replace with your actual OpenAI API key
const expenses = [];
const expenseList = document.getElementById("expense-list");
const alertsDiv = document.getElementById("alerts");
const chartCanvas = document.getElementById("spendingChart");
let ctx = null;
let spendingChartInstance = null;

if (chartCanvas && chartCanvas.getContext) {
    ctx = chartCanvas.getContext("2d");
}

const addExpenseBtn = document.getElementById("add-expense");
if (addExpenseBtn) {
    addExpenseBtn.addEventListener("click", async () => {
        const nameInput = document.getElementById("expense-name");
        const amountInput = document.getElementById("expense-amount");
        if (!nameInput || !amountInput) {
            alert("Expense name or amount input not found!");
            return;
        }
        const name = nameInput.value.trim();
        const amount = parseFloat(amountInput.value);
        if (!name || isNaN(amount) || amount <= 0) {
            alert("⚠️ Please enter valid expense details!");
            return;
        }
        let category = "Uncategorized";
        try {
            category = await categorizeExpense(name);
        } catch (e) {
            alert("Failed to categorize expense. Please check your API key or network.");
        }
        expenses.push({ name, amount, category });
        updateUI();
        checkOverspending();
        updateChart();
        // Clear input fields after adding
        nameInput.value = "";
        amountInput.value = "";
    });
}

async function categorizeExpense(expense) {
    // If API key is not set, return Uncategorized
    if (!API_KEY || API_KEY === "YOUR_OPENAI_API_KEY") {
        return "Uncategorized";
    }
    try {
        const response = await fetch("https://api.openai.com/v1/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "text-davinci-003",
                prompt: `Categorize this expense: ${expense}. Possible categories: Food, Transport, Shopping, Bills, Entertainment.`,
                max_tokens: 10
            })
        });
        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        if (data && data.choices && data.choices[0] && data.choices[0].text) {
            return data.choices[0].text.trim();
        }
        return "Uncategorized";
    } catch (err) {
        return "Uncategorized";
    }
}

function updateUI() {
    if (!expenseList) return;
    expenseList.innerHTML = "";
    expenses.forEach(exp => {
        const listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
        listItem.innerHTML = `${exp.name} <span class="badge bg-primary">$${exp.amount} - ${exp.category}</span>`;
        expenseList.appendChild(listItem);
    });
}

function checkOverspending() {
    if (!alertsDiv) return;
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    alertsDiv.textContent = totalSpent > 500 ? "⚠️ Warning: You are overspending!" : "";
}

function updateChart() {
    if (!ctx || typeof Chart === "undefined") return;
    const categories = [...new Set(expenses.map(exp => exp.category))];
    const data = categories.map(cat => expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0));
    // Destroy previous chart instance if exists
    if (spendingChartInstance) {
        spendingChartInstance.destroy();
    }
    spendingChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: categories,
            datasets: [{
                data,
                backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0", "#9966ff"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}
