let goals = [];
let contributions = [];
let selectedGoalId = null;
let goalChart = null;
let availableNetAmount = 0;
let useCurrentAmount = false;

const GOAL_ICONS = {
  Emergency:'🛟', Education:'🎓', Travel:'✈️', Technology:'💻',
  Vehicle:'🚗', Home:'🏠', Investment:'📈', Other:'🎯'
};

async function goalsRequest(action, data = null) {
  const options = data ? {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)
  } : {};
  const response = await fetch(`php/goals.php?action=${action}&_=${Date.now()}`, options);
  const payload = await response.json();
  if (!payload.success) throw new Error(payload.message || 'Request failed');
  return payload;
}

function showGoalsError(message) {
  const alert = document.getElementById('goals-alert');
  alert.textContent = message;
  alert.classList.remove('hidden');
  setTimeout(() => alert.classList.add('hidden'), 5000);
}

async function loadGoals() {
  try {
    const data = await goalsRequest('fetch_all');
    goals = data.goals.map(goal => ({...goal, saved_amount:Number(goal.saved_amount), target_amount:Number(goal.target_amount)}));
    contributions = data.contributions.map(item => ({...item, amount:Number(item.amount)}));
    availableNetAmount = Number(data.available_net_amount || 0);
    updateAvailableNetDisplay();
    renderGoals();
    if (selectedGoalId && goals.some(goal => Number(goal.id) === Number(selectedGoalId))) renderGoalDetail(selectedGoalId);
  } catch (error) {
    showGoalsError(error.message);
  }
}

function goalMetrics(goal) {
  const saved = Math.max(0, Number(goal.saved_amount));
  const remaining = Math.max(0, goal.target_amount - saved);
  const percent = goal.target_amount > 0 ? Math.min(100, (saved / goal.target_amount) * 100) : 0;
  const today = new Date(); today.setHours(0,0,0,0);
  const deadline = new Date(goal.target_date + 'T00:00:00');
  const days = Math.max(0, Math.ceil((deadline - today) / 86400000));
  return {
    saved, remaining, percent, days,
    monthlyNeeded: days > 0 ? remaining / (days / 30.4375) : remaining,
    weeklyNeeded: days > 0 ? remaining / (days / 7) : remaining
  };
}

function savingsRate(goalId) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
  return contributions
    .filter(item => Number(item.goal_id) === Number(goalId) && new Date(item.contribution_date+'T00:00:00') >= cutoff)
    .reduce((sum,item) => sum + (item.type === 'Withdrawal' ? -item.amount : item.amount), 0) / 3;
}

function estimatedCompletion(goal) {
  const metrics = goalMetrics(goal);
  if (metrics.remaining <= 0) return 'Completed';
  const monthlyRate = savingsRate(goal.id) || Number(goal.auto_contribution_amount) || 0;
  if (monthlyRate <= 0) return 'No rate yet';
  const date = new Date();
  date.setMonth(date.getMonth() + Math.ceil(metrics.remaining / monthlyRate));
  return date.toLocaleDateString('en-GB',{month:'short',year:'numeric'});
}

function renderGoals() {
  const search = document.getElementById('goal-search').value.toLowerCase();
  const status = document.getElementById('goal-status-filter').value;
  const priority = document.getElementById('goal-priority-filter').value;
  const filtered = goals.filter(goal =>
    (status === 'all' || goal.status === status) &&
    (priority === 'all' || goal.priority === priority) &&
    `${goal.name} ${goal.category} ${goal.description || ''}`.toLowerCase().includes(search)
  );

  const active = goals.filter(goal => goal.status === 'Active');
  const totalSaved = goals.reduce((sum,goal) => sum + Math.max(0,goal.saved_amount),0);
  const totalRemaining = active.reduce((sum,goal) => sum + goalMetrics(goal).remaining,0);
  document.getElementById('goals-active-count').textContent = active.length;
  document.getElementById('goals-total-saved').textContent = formatRs(totalSaved);
  document.getElementById('goals-total-remaining').textContent = formatRs(totalRemaining);
  document.getElementById('goals-completed-count').textContent = goals.filter(goal => goal.status === 'Completed').length;

  const grid = document.getElementById('goals-grid');
  if (!filtered.length) {
    grid.innerHTML = `<div class="card card--flat goals-empty"><h3>No matching goals</h3><p>Create a goal or adjust the filters.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(goal => {
    const m = goalMetrics(goal);
    const statusClass = goal.status.toLowerCase();
    return `<article class="card goal-card goal-card--${statusClass}">
      <div class="goal-card__top">
        <div class="goal-card__icon">${GOAL_ICONS[goal.category] || '🎯'}</div>
        <div class="goal-card__title"><h3 title="${escapeHtml(goal.name)}">${escapeHtml(goal.name)}</h3>
          <div class="goal-card__meta"><span class="badge badge--primary">${goal.category}</span><span class="badge badge--${statusBadge(goal.status)}">${goal.status}</span><span class="badge priority-${goal.priority.toLowerCase()}">${goal.priority}</span></div>
        </div>
      </div>
      <div class="goal-card__amounts"><span>Saved <strong>${formatRs(m.saved)}</strong></span><span>Target <strong>${formatRs(goal.target_amount)}</strong></span></div>
      <div class="progress-bar goal-card__progress"><div class="progress-bar__fill" style="width:${m.percent}%"></div></div>
      <div class="goal-card__percentage">${m.percent.toFixed(1)}% complete</div>
      <div class="goal-card__analysis"><div><span>Remaining</span><strong>${formatRs(m.remaining)}</strong></div><div><span>Monthly needed</span><strong>${formatRs(m.monthlyNeeded)}</strong></div></div>
      <div class="goal-card__footer"><span>Deadline ${formatDate(goal.target_date)}</span><span>${m.days} days left</span></div>
      <div class="goal-card__actions mt-md">
        <button class="btn btn--accent btn--sm" onclick="openContributionModal(${goal.id})">+ Add / Withdraw</button>
        <button class="btn btn--ghost btn--sm" onclick="openGoalDetail(${goal.id})">Analysis</button>
        <button class="btn btn--ghost btn--sm" onclick="editGoal(${goal.id})">Edit</button>
        <button class="btn btn--danger btn--sm" onclick="deleteGoal(${goal.id})">Delete</button>
      </div>
    </article>`;
  }).join('');
}

function statusBadge(status) {
  return status === 'Completed' ? 'success' : status === 'Active' ? 'primary' : status === 'Paused' ? 'warning' : 'danger';
}

function escapeHtml(value='') {
  const div = document.createElement('div'); div.textContent = value; return div.innerHTML;
}

function openGoalDetail(id) {
  selectedGoalId = Number(id);
  renderGoalDetail(id);
  const detail = document.getElementById('goal-detail');
  detail.classList.remove('hidden');
  detail.scrollIntoView({behavior:'smooth',block:'start'});
}

function renderGoalDetail(id) {
  const goal = goals.find(item => Number(item.id) === Number(id));
  if (!goal) return;
  const m = goalMetrics(goal);
  document.getElementById('detail-goal-name').textContent = goal.name;
  document.getElementById('detail-days').textContent = `${m.days} days`;
  document.getElementById('detail-monthly-needed').textContent = formatRs(m.monthlyNeeded);
  document.getElementById('detail-weekly-needed').textContent = formatRs(m.weeklyNeeded);
  document.getElementById('detail-estimated-date').textContent = estimatedCompletion(goal);
  document.getElementById('detail-add-contribution').onclick = () => openContributionModal(goal.id);

  const history = contributions.filter(item => Number(item.goal_id) === Number(id));
  const tbody = document.getElementById('contribution-table-body');
  tbody.innerHTML = history.length ? history.map(item => {
    const withdrawal = item.type === 'Withdrawal';
    const automatic = item.type === 'Automatic';
    const typeLabel = contributionTypeLabel(item.type);
    return `<tr><td>${formatDate(item.contribution_date)}</td><td><span class="badge badge--${withdrawal?'danger':'success'}">${typeLabel}</span></td>
      <td class="text-muted">${escapeHtml(item.notes || '—')}</td>
      <td class="text-right ${withdrawal?'contribution-withdrawal':'contribution-deposit'}">${withdrawal?'−':'+'}${formatRs(item.amount)}</td>
      <td>${automatic ? '<span class="text-muted">Scheduled</span>' : `<button class="btn btn--ghost btn--icon" onclick="editContribution(${item.id})">Edit</button> <button class="btn btn--danger btn--icon" onclick="deleteContribution(${item.id})">Delete</button>`}</td></tr>`;
  }).join('') : `<tr><td colspan="5" class="text-center text-muted" style="padding:28px">No contributions yet.</td></tr>`;
  renderProgressChart(goal, history);
}

function renderProgressChart(goal, history) {
  const ordered = [...history].sort((a,b) => new Date(a.contribution_date)-new Date(b.contribution_date));
  let running = 0;
  const points = ordered.map(item => {
    running += item.type === 'Withdrawal' ? -item.amount : item.amount;
    return {x:item.contribution_date,y:Math.max(0,running)};
  });
  if (!points.length) points.push({x:new Date().toISOString().slice(0,10),y:0});
  if (goalChart) goalChart.destroy();
  goalChart = new Chart(document.getElementById('goal-progress-chart'), {
    type:'line',
    data:{datasets:[
      {label:'Saved',data:points,borderColor:'#00D4AA',backgroundColor:'rgba(0,212,170,.12)',fill:true,tension:.3},
      {label:'Target',data:points.map(point => ({x:point.x,y:goal.target_amount})),borderColor:'#6C63FF',borderDash:[6,5],pointRadius:0}
    ]},
    options:{responsive:true,maintainAspectRatio:false,parsing:false,plugins:{legend:{labels:{color:'#8B90B8'}},tooltip:{callbacks:{label:ctx=>formatRs(ctx.parsed.y)}}},scales:{x:{type:'category',ticks:{color:'#8B90B8'},grid:{color:'rgba(255,255,255,.04)'}},y:{beginAtZero:true,ticks:{color:'#8B90B8',callback:value=>'Rs.'+Number(value).toLocaleString()},grid:{color:'rgba(255,255,255,.06)'}}}}
  });
}

function resetGoalForm() {
  document.getElementById('goal-form').reset();
  document.getElementById('goal-id').value = '';
  document.getElementById('goal-modal-title').textContent = 'Create Savings Goal';
  document.getElementById('initial-saved-group').classList.remove('hidden');
  document.getElementById('goal-auto-day').value = 1;
  document.getElementById('goal-initial-saved').value = 0;
  const minDate = new Date(); minDate.setDate(minDate.getDate()+1);
  document.getElementById('goal-target-date').min = minDate.toISOString().slice(0,10);
}

function editGoal(id) {
  const goal = goals.find(item => Number(item.id) === Number(id)); if (!goal) return;
  resetGoalForm();
  document.getElementById('goal-target-date').min = '';
  document.getElementById('goal-modal-title').textContent = 'Edit Savings Goal';
  document.getElementById('initial-saved-group').classList.add('hidden');
  document.getElementById('goal-id').value = goal.id;
  ['name','category','priority','target-date','status','description'].forEach(() => {});
  document.getElementById('goal-name').value = goal.name;
  document.getElementById('goal-category').value = goal.category;
  document.getElementById('goal-priority').value = goal.priority;
  document.getElementById('goal-target-amount').value = goal.target_amount;
  document.getElementById('goal-target-date').value = goal.target_date;
  document.getElementById('goal-status').value = goal.status;
  document.getElementById('goal-auto-amount').value = goal.auto_contribution_amount;
  document.getElementById('goal-auto-day').value = goal.auto_contribution_day;
  document.getElementById('goal-description').value = goal.description || '';
  openModal('goal-modal');
}

async function deleteGoal(id) {
  if (!confirm('Delete this goal and all of its contribution history?')) return;
  try { await goalsRequest('delete_goal',{id}); if (selectedGoalId === Number(id)) document.getElementById('goal-detail').classList.add('hidden'); await loadGoals(); }
  catch(error){ showGoalsError(error.message); }
}

function openContributionModal(goalId, contribution=null) {
  document.getElementById('contribution-form').reset();
  document.getElementById('contribution-id').value = contribution?.id || '';
  document.getElementById('contribution-goal-id').value = goalId;
  document.getElementById('contribution-modal-title').textContent = contribution ? 'Edit Contribution' : 'Add or Withdraw Savings';
  useCurrentAmount = contribution?.type === 'NetTransfer';
  document.getElementById('contribution-type').value = contribution?.type === 'Withdrawal' ? 'Withdrawal' : 'Deposit';
  document.getElementById('contribution-amount').value = contribution?.amount || '';
  document.getElementById('contribution-date').value = contribution?.contribution_date || new Date().toISOString().slice(0,10);
  document.getElementById('contribution-notes').value = contribution?.notes || '';
  updateAvailableNetDisplay(contribution?.type === 'NetTransfer' ? contribution.amount : 0);
  updateContributionTypeUI();
  openModal('contribution-modal');
}

function contributionTypeLabel(type) {
  if (type === 'NetTransfer') return 'Contribution · Amount in Hand';
  if (type === 'Deposit') return 'Contribution';
  return type;
}

function updateAvailableNetDisplay(restoredAmount = 0) {
  const el = document.getElementById('available-net-amount');
  if (el) el.textContent = formatRs(availableNetAmount + Number(restoredAmount || 0));
}

function updateContributionTypeUI() {
  const type = document.getElementById('contribution-type')?.value;
  const panel = document.getElementById('net-amount-panel');
  const help = document.getElementById('net-amount-help');
  const toggle = document.getElementById('net-source-toggle');
  if (!panel || !help || !toggle) return;

  if (type === 'Withdrawal') useCurrentAmount = false;
  toggle.disabled = type === 'Withdrawal';
  toggle.classList.toggle('is-selected', useCurrentAmount);
  toggle.setAttribute('aria-pressed', String(useCurrentAmount));
  panel.classList.toggle('is-active', useCurrentAmount);
  help.textContent = type === 'Withdrawal'
    ? 'Withdrawal reduces the goal balance and returns the money to your amount in hand.'
    : useCurrentAmount
      ? 'This contribution will be deducted from your current amount in hand.'
      : 'Optional: deduct this contribution from your current amount in hand.';
}

function editContribution(id) {
  const item = contributions.find(row => Number(row.id) === Number(id));
  if (item) openContributionModal(item.goal_id,item);
}

async function deleteContribution(id) {
  if (!confirm('Delete this contribution?')) return;
  try { await goalsRequest('delete_contribution',{id}); await loadGoals(); }
  catch(error){ showGoalsError(error.message); }
}

document.addEventListener('DOMContentLoaded', () => {
  resetGoalForm();
  loadGoals();
  ['goal-search','goal-status-filter','goal-priority-filter'].forEach(id => {
    document.getElementById(id).addEventListener(id === 'goal-search' ? 'input' : 'change', renderGoals);
  });
  document.getElementById('open-goal-modal').addEventListener('click', () => { resetGoalForm(); openModal('goal-modal'); });
  document.getElementById('contribution-type').addEventListener('change', updateContributionTypeUI);
  document.getElementById('net-source-toggle').addEventListener('click', () => {
    if (document.getElementById('contribution-type').value === 'Withdrawal') return;
    useCurrentAmount = !useCurrentAmount;
    updateContributionTypeUI();
  });
  document.getElementById('close-goal-detail').addEventListener('click', () => document.getElementById('goal-detail').classList.add('hidden'));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.close)));
  document.querySelectorAll('.modal-overlay').forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModal(modal.id); }));

  document.getElementById('goal-form').addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('goal-id').value;
    const data = {
      id,
      name:document.getElementById('goal-name').value.trim(),
      category:document.getElementById('goal-category').value,
      priority:document.getElementById('goal-priority').value,
      target_amount:Number(document.getElementById('goal-target-amount').value),
      target_date:document.getElementById('goal-target-date').value,
      status:document.getElementById('goal-status').value,
      description:document.getElementById('goal-description').value.trim(),
      auto_contribution_amount:Number(document.getElementById('goal-auto-amount').value || 0),
      auto_contribution_day:Number(document.getElementById('goal-auto-day').value || 1)
    };
    try {
      const result = await goalsRequest(id ? 'update_goal' : 'create_goal',data);
      if (!id) {
        const initial = Number(document.getElementById('goal-initial-saved').value || 0);
        if (initial > 0) await goalsRequest('add_contribution',{goal_id:result.id,type:'Deposit',amount:initial,contribution_date:new Date().toISOString().slice(0,10),notes:'Initial saved amount'});
      }
      closeModal('goal-modal'); await loadGoals();
    } catch(error){ showGoalsError(error.message); }
  });

  document.getElementById('contribution-form').addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('contribution-id').value;
    const data = {
      id,
      goal_id:Number(document.getElementById('contribution-goal-id').value),
      type:document.getElementById('contribution-type').value === 'Deposit' && useCurrentAmount
        ? 'NetTransfer'
        : document.getElementById('contribution-type').value,
      amount:Number(document.getElementById('contribution-amount').value),
      contribution_date:document.getElementById('contribution-date').value,
      notes:document.getElementById('contribution-notes').value.trim()
    };
    try { await goalsRequest(id ? 'update_contribution' : 'add_contribution',data); closeModal('contribution-modal'); selectedGoalId=data.goal_id; await loadGoals(); }
    catch(error){ showGoalsError(error.message); }
  });
});
