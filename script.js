const API_KEY = "YOUR_OPENAI_API_KEY";
const expenses = [];
const expenseList = document.getElementById("expense-list");
const alertsDiv = document.getElementById("alerts");
const ctx = document.getElementById("spendingChart").getContext("2d");
document.getElementById("add-expense").addEventListener("click", async () => {
    const name = document.getElementById("expense-name").value;
    const amount = parseFloat(document.getElementById("expense-amount").value);
    
    if (!name || isNaN(amount) || amount <= 0) {
        alert("⚠️ Please enter valid expense details!");
        return;
    }

    const category = await categorizeExpense(name);
    expenses.push({ name, amount, category });

    updateUI();
    checkOverspending();
    updateChart();
});
async function categorizeExpense(expense) {
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

    const data = await response.json();
    return data.choices[0].text.trim();
}
function updateUI() {
    expenseList.innerHTML = "";
    expenses.forEach(exp => {
        const listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
        listItem.innerHTML = `${exp.name} <span class="badge bg-primary">$${exp.amount} - ${exp.category}</span>`;
        expenseList.appendChild(listItem);
    });
}
function checkOverspending() {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    alertsDiv.textContent = totalSpent > 500 ? "⚠️ Warning: You are overspending!" : "";
}
function updateChart() {
    const categories = [...new Set(expenses.map(exp => exp.category))];
    const data = categories.map(cat => expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0));
    new Chart(ctx, {
        type: "pie",
        data: {
            labels: categories,
            datasets: [{
                data,
                backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0", "#9966ff"]
            }]
        }
    });
}
