/**
 * charts.js — Chart.js setup for dashboard visualizations
 */

const CHART_COLORS = [
  '#6C63FF','#00D4AA','#F59E0B','#EF4444',
  '#10B981','#63B3ED','#A78BFA','#F97316',
];

let pieChart = null;
let barChart = null;

function initCharts() {
  // ── Pie Chart: Spending by Category ────────────────────────
  const pieCtx = document.getElementById('pie-chart');
  if (!pieCtx) return;

  const catSpend  = expensesByCategory(true);
  const labels    = Object.keys(catSpend);
  const data      = Object.values(catSpend);

  const pieData = {
    labels: labels.length ? labels.map(l => `${CAT_EMOJI[l] || ''} ${l}`) : ['No data'],
    datasets: [{
      data:            labels.length ? data : [1],
      backgroundColor: CHART_COLORS,
      borderWidth: 2,
      borderColor: '#1A1E33',
    }],
  };

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: pieData,
    options: {
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#8B90B8', font: { size: 12 }, padding: 16 },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${formatRs(ctx.parsed)}`,
          },
        },
      },
    },
  });

  // ── Bar Chart: Last 6 Months Income vs Expenses ─────────────
  const barCtx = document.getElementById('bar-chart');
  if (!barCtx) return;

  const months = [];
  const incomeData   = [];
  const expenseData  = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push(monthStr);

    const m = d.getMonth(), y = d.getFullYear();
    const inc = getIncome()
      .filter(it => { const dd = new Date(it.date+'T00:00:00'); return dd.getMonth()===m && dd.getFullYear()===y; })
      .reduce((s, it) => s + parseFloat(it.amount), 0);
    const exp = getExpenses()
      .filter(it => { const dd = new Date(it.date+'T00:00:00'); return dd.getMonth()===m && dd.getFullYear()===y; })
      .reduce((s, it) => s + parseFloat(it.amount), 0);

    incomeData.push(inc);
    expenseData.push(exp);
  }

  if (barChart) barChart.destroy();
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Income',   data: incomeData,  backgroundColor: 'rgba(16,185,129,0.75)',  borderRadius: 6 },
        { label: 'Expenses', data: expenseData, backgroundColor: 'rgba(239,68,68,0.75)',   borderRadius: 6 },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: '#8B90B8', font: { size: 12 } } },
        tooltip: {
          callbacks: { label: ctx => ` ${formatRs(ctx.parsed.y)}` },
        },
      },
      scales: {
        x: { ticks: { color: '#8B90B8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#8B90B8', callback: v => 'Rs.' + v.toLocaleString() }, grid: { color: 'rgba(255,255,255,0.06)' } },
      },
    },
  });
}
