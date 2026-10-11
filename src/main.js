import './style.css';
import { roster, materials, requirements, defaultState, normalizeState, skillNames } from './data.js';
const key = 'chaos-planner-v1';
let state;
try { state = normalizeState(JSON.parse(localStorage.getItem(key))); } catch { state = defaultState(); }
let editorId = null, editorTab = 'Level', draft = null, returnFocus = null;
let page = 'Combatants', filter = 'All', query = '';
const icons = { Combatants: '▦', Partners: '◇', Materials: '⬡', Overview: '◉', Settings: '⚙' };
const app = document.querySelector('#app');
const save = () => { localStorage.setItem(key, JSON.stringify(state)); };
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stars = n => '★'.repeat(n);
const active = () => roster.filter(r => state.goals[r.id].enabled);
function summary() {
  const needed = requirements(state.goals);
  const total = Object.values(needed).reduce((a,b) => a+b,0);
  const owned = materials.reduce((a,m) => a+Math.min(needed[m.id], state.inventory[m.id]),0);
  return { needed, percent: total ? Math.round(owned / total * 100) : 0 };
}
function card(r) {
  const g = state.goals[r.id];
  return `<article class="roster-card ${r.color} ${g.enabled ? 'selected' : ''}"><button class="unit-open" data-edit="${r.id}" aria-label="Edit ${r.name}">
    <div class="portrait"><span class="portrait-grid"></span><div class="orbit"></div><div class="silhouette ${r.type === 'Partner' ? 'partner-shape' : ''}"><span></span></div><div class="rarity-strip"><span>${stars(r.rarity)}</span><span>${g.rank ? 'R'+g.rank : r.mark}</span></div></div>
    <div class="unit-name">${g.favorite ? '★ ' : ''}${r.name}</div></button><div class="unit-status"><span title="Level goal">${g.enabled ? '✓' : '○'} Lv.</span>${r.type === 'Combatant' ? `<span title="Skill goals">${g.skills.some(s=>s.target>s.current) ? '+' : '○'} Skills</span>` : ''}<button data-toggle="${r.id}" aria-label="${g.enabled ? 'Remove' : 'Add'} ${r.name} goal">${g.enabled ? '✓' : '+'}</button></div></article>`;
}
function rosterPage() {
  const type = page === 'Combatants' ? 'Combatant' : 'Partner';
  const items = roster.filter(r => r.type === type && (filter === 'All' || r.rarity === Number(filter)) && r.name.toLowerCase().includes(query.toLowerCase()));
  return `<div class="roster-actions"><button class="primary" id="add-unit">+ Add</button><button class="secondary" data-page="Overview">View planner</button><span>Click a portrait to edit goals</span></div><div class="toolbar"><div class="filters">${['All', ...(type === 'Combatant' ? [5,4] : [5,4,3])].map(f => `<button data-filter="${f}" class="${String(filter) === String(f) ? 'active' : ''}">${f === 'All' ? 'All '+page.toLowerCase() : f+' ★'}</button>`).join('')}</div><label class="search"><span>⌕</span><input id="search" aria-label="Search ${page.toLowerCase()}" placeholder="Search ${page.toLowerCase()}..." value="${escape(query)}"></label></div><div class="section-label"><span>${items.length} ${page.toUpperCase()}</span><span>Sort: Rarity ↓</span></div><div class="roster-grid">${items.map(card).join('') || '<div class="empty">No matches. Try another search or rarity.</div>'}</div><div class="info-strip"><span>ⓘ</span><p>A starting point for your next expedition.<br><small>This roster uses placeholder units. Upgrade costs are illustrative, not verified game data.</small></p><span class="demo-badge">DEMO ROSTER</span></div>`;
}
function materialRows(edit = false) {
  const { needed } = summary();
  return materials.map(m => { const have = state.inventory[m.id], remaining = Math.max(0, needed[m.id]-have); return `<div class="material-row"><span class="material-icon ${m.color}">${m.icon}</span><div class="material-name"><b>${m.name}</b><small>${m.category}</small></div>${edit ? `<label class="inventory-field">Owned<input aria-label="${m.name} owned" type="number" min="0" max="999999999" value="${have}" data-inventory="${m.id}"></label>` : `<span class="material-have">${have.toLocaleString()} / ${needed[m.id].toLocaleString()}</span>`}<span class="needed ${remaining ? '' : 'complete'}">${remaining ? remaining.toLocaleString()+' needed' : '✓ Ready'}</span></div>`; }).join('');
}
function overview() {
  return `<div class="overview-grid"><section class="panel"><div class="panel-title"><h3>Your upgrade goals</h3><span>${active().length} ACTIVE</span></div>${active().map(r => `<div class="goal-row"><button class="goal-edit" data-edit="${r.id}" aria-label="Edit ${r.name}">Edit</button><span class="goal-avatar ${r.color}">${r.mark}</span><div><b>${r.name}</b><small>${r.type} · ${r.rarity}★</small></div><span>Lv. ${state.goals[r.id].current} → ${state.goals[r.id].target}</span><button class="remove" data-toggle="${r.id}" aria-label="Remove ${r.name}">×</button></div>`).join('') || '<div class="empty">Your next goal starts here.<br><small>Add a combatant or partner to start planning.</small></div>'}</section><section class="panel"><div class="panel-title"><h3>Materials checklist</h3><span>ALL GOALS</span></div>${materialRows()}</section></div>`;
}
function settings() {
  return `<section class="panel settings-panel"><h3>Your planner, your progress</h3><p>Progress is saved automatically in this browser. Export a backup to keep it safe or move to another device.</p><div class="settings-actions"><button class="primary" id="export">↓ Export progress</button><label class="secondary import">↑ Import progress<input type="file" id="import" accept="application/json,.json"></label></div><hr><h3>Expedition energy</h3><p>Track your current energy manually. No game account connection is required.</p><label class="energy-label">Current energy <input id="energy" type="number" min="0" max="240" value="${state.energy}"></label><hr><h3>Start fresh</h3><p>Remove all goals and inventory from this browser.</p><button class="danger" id="reset">Reset planner</button></section>`;
}
function render() {
  const { percent } = summary();
  const subtitles = { Combatants: 'Every expedition starts with a plan. Build yours.', Partners: 'Find your synergy. Plan your next partnership.', Materials: 'Know what you have. See what you still need.', Overview: 'Your next breakthrough, all in one place.', Settings: 'Make this planner yours.' };
  app.innerHTML = `<aside class="sidebar"><a class="brand" href="#"><span class="brand-symbol">✳</span><div>CHAOS<span>ZERO NIGHTMARE</span></div></a><div class="workspace-label">YOUR WORKSPACE</div><nav>${Object.keys(icons).map(p => `<button data-page="${p}" class="${page === p ? 'active' : ''}"><span>${icons[p]}</span>${p}${p === 'Overview' && active().length ? `<em>${active().length}</em>` : ''}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="local-status"><span></span> Saved on this device</div><div class="version">CHAOS PLANNER <span>v0.1</span></div></div></aside>
  <div class="workspace"><header><div class="breadcrumb">Workspace <span>/</span> <b>${page}</b></div><div class="header-right"><span class="energy-dot">ϟ</span><label for="header-energy">Energy</label><input id="header-energy" aria-label="Current energy" type="number" min="0" max="240" value="${state.energy}"><span class="energy-max">/ 240</span><span class="header-divider"></span><span class="profile">C</span></div></header>
  <main><div class="page-heading"><div><div class="eyebrow">PROGRESSION PLANNER</div><h1>${page}<span>.</span></h1><p>${subtitles[page]}</p></div><button class="primary" data-page="${page === 'Overview' ? 'Combatants' : 'Overview'}">${page === 'Overview' ? '+ Add a goal' : 'View planner ↗'}</button></div>
  <div class="stats"><div class="stat"><span class="stat-icon orange">▦</span><div><span>Combatant goals</span><b>${active().filter(r=>r.type==='Combatant').length}<small> / 2 available</small></b></div></div><div class="stat"><span class="stat-icon purple">◇</span><div><span>Partner goals</span><b>${active().filter(r=>r.type==='Partner').length}<small> / 3 available</small></b></div></div><div class="stat progress-stat"><span class="stat-icon green">↗</span><div><span>Material readiness</span><b>${percent}<small>% collected</small></b></div><div class="mini-progress"><i style="width:${percent}%"></i></div></div></div>
  ${['Combatants','Partners'].includes(page) ? rosterPage() : page === 'Overview' ? overview() : page === 'Materials' ? `<section class="panel"><div class="panel-title"><h3>Inventory</h3><span>EDIT YOUR OWNED MATERIALS</span></div>${materialRows(true)}<p class="panel-note">Requirements combine all active goals. Demo costs are estimates for testing this planner.</p></section>` : settings()}
  <footer><span><i></i> All progress saved locally</span><span>Unofficial fan project <b>·</b> Not affiliated with the game publisher</span></footer></main></div><div id="toast" role="status"></div>`;
  app.innerHTML = app.innerHTML.replaceAll('↗', '<svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>').replace('✳', '<svg class="brand-icon" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3v34M3 20h34M8 8l24 24M8 32 32 8"/></svg>');
  bind();
  if(editorId) mountEditor();
}
function updateNumber(input) {
  if (input.dataset.goal) state.goals[input.dataset.goal][input.dataset.field] = input.value;
  if (input.dataset.inventory) state.inventory[input.dataset.inventory] = input.value;
  if (['energy','header-energy'].includes(input.id)) state.energy = input.value;
  state = normalizeState(state); save(); render();
}
function toast(message) { const t = document.querySelector('#toast'); t.textContent = message; t.classList.add('visible'); setTimeout(()=>t.classList.remove('visible'),3000); }
function bind() {
  document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openEditor(b.dataset.edit));
  const add = document.querySelector('#add-unit'); if(add) add.onclick = showAdd;
  document.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { page=b.dataset.page;filter='All';query='';render(); });
  document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => {filter=b.dataset.filter;render();});
  document.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {state.goals[b.dataset.toggle].enabled=!state.goals[b.dataset.toggle].enabled;save();render();});
  document.querySelectorAll('input[type="number"]').forEach(i => i.onchange = () => updateNumber(i));
  const search = document.querySelector('#search');
  if(search) search.oninput = () => { const pos = search.selectionStart; query=search.value;render();const next=document.querySelector('#search');next.focus();next.setSelectionRange(pos,pos); };
  const exp=document.querySelector('#export');
  if(exp) exp.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='chaos-planner.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Progress exported');};
  const imp=document.querySelector('#import');
  if(imp) imp.onchange=async()=>{try{const file=imp.files[0];if(!file)return;if(file.size>1000000)throw Error();const parsed=JSON.parse(await file.text());if(!parsed || typeof parsed !== 'object' || !parsed.goals || !parsed.inventory)throw Error();state=normalizeState(parsed);save();render();toast('Progress imported');}catch{toast('Unable to import. Choose a valid planner backup.');}};
  const reset=document.querySelector('#reset');if(reset)reset.onclick=()=>{if(confirm('Reset all goals and inventory? This cannot be undone.')){state=defaultState();save();render();toast('Planner reset');}};
}
function openEditor(id) {
  returnFocus = document.activeElement;
  editorId = id; editorTab = 'Level';
  draft = structuredClone(state.goals[id]);
  mountEditor();
}
function closeEditor() {
  document.querySelector('#unit-editor')?.close();
  document.querySelector('#unit-editor')?.remove();
  editorId = null; draft = null;
  if(returnFocus?.isConnected) returnFocus.focus();
}
function stepper(label, field, value, max=60, min=1) {
  return `<label class="step-label">${label}<span class="stepper"><button data-step="${field}" data-delta="-1" aria-label="Decrease ${label}">‹</button><input type="number" aria-label="${label}" data-draft="${field}" value="${value}" min="${min}" max="${max}"><button data-step="${field}" data-delta="1" aria-label="Increase ${label}">›</button></span></label>`;
}
function editorCosts() {
  const id = editorTab === 'Partner' ? draft.partner : editorId;
  if(!id) return '<p class="editor-hint">Select a partner to plan its progression.</p>';
  const goal = editorTab === 'Partner' ? state.goals[id] : draft;
  const costGoal = editorTab === 'Skills'
    ? {...goal, current: goal.target, ascension: goal.targetAscension}
    : {...goal, skills: []};
  const needed = requirements({[id]: {...costGoal, enabled:true}});
  return `<div class="cost-heading">GOAL COST <span>DEMO ESTIMATE</span></div><div class="cost-grid">${materials.filter(m=>needed[m.id]>0).map(m=>`<div class="cost-item"><div class="cost-art ${m.color}" title="${m.name}"><span>${m.icon}</span><b>${needed[m.id].toLocaleString()}</b></div><small>${m.name}</small><em class="${state.inventory[m.id]>=needed[m.id]?'ready':''}">${state.inventory[m.id]>=needed[m.id]?'✓ Ready':Math.max(0,needed[m.id]-state.inventory[m.id]).toLocaleString()+' needed'}</em></div>`).join('') || '<p class="editor-hint">No upgrades needed for these goals.</p>'}</div>`;
}
function editorBody() {
  if(editorTab==='Skills') return `<div class="skill-list">${skillNames.map((name,i)=>`<div class="skill-row"><span class="skill-symbol">${['◈','✧','◎'][i]}</span><div><b>${name}</b><div class="skill-controls">${stepper(name+' current','skill'+i+'current',draft.skills[i].current,10)}<span>»</span>${stepper(name+' target','skill'+i+'target',draft.skills[i].target,10)}</div></div></div>`).join('')}</div><p class="editor-hint">Placeholder skill tracks · levels 1–10. Game-specific names and unlock rules are not configured.</p>`;
  if(editorTab==='Partner') return `<label class="partner-select">Assigned partner<select id="assigned-partner"><option value="">No partner assigned</option>${roster.filter(r=>r.type==='Partner').map(r=>`<option value="${r.id}" ${draft.partner===r.id?'selected':''}>${r.name} · ${r.rarity}★</option>`).join('')}</select></label>${draft.partner ? `<div class="partner-preview"><span class="goal-avatar">◇</span><b>${roster.find(r=>r.id===draft.partner).name}</b><button id="edit-partner" class="secondary">Save &amp; edit partner</button></div>` : ''}<p class="editor-hint">Assignment is saved with this combatant. Partner costs count once when its own planner goal is enabled.</p>`;
  const r=roster.find(r=>r.id===editorId);
  return `<div class="level-pair">${stepper(r.name+' current level','current',draft.current)}<span>»</span>${stepper(r.name+' target level','target',draft.target)}</div><div class="ascension-pair">${stepper('Current ascension','ascension',draft.ascension,6,0)}<span>»</span>${stepper('Target ascension','targetAscension',draft.targetAscension,6,0)}</div><p class="editor-hint">Ascension stages 0–6 are demo values.</p>`;
}
function mountEditor() {
  let dialog=document.querySelector('#unit-editor');
  const wasOpen=!!dialog;
  if(!dialog){dialog=document.createElement('dialog');dialog.id='unit-editor';dialog.className='unit-editor';app.append(dialog);}
  const r=roster.find(r=>r.id===editorId);
  dialog.innerHTML=`<div class="editor-header"><span class="editor-avatar ${r.color}">${r.mark}</span><h2 id="editor-title">${r.name}</h2><label class="enable-goal"><input id="editor-enabled" type="checkbox" ${draft.enabled?'checked':''}> Plan</label><button id="close-editor" aria-label="Close editor">×</button></div><div class="editor-content"><div class="editor-tools"><input id="editor-notes" aria-label="Combatant or partner notes" placeholder="Notes for this unit" maxlength="500" value="${escape(draft.notes)}"><label class="rank-select">Rank <select id="editor-rank">${Array.from({length:7},(_,i)=>`<option ${draft.rank===i?'selected':''}>${i}</option>`).join('')}</select></label><button id="editor-favorite" aria-label="Favorite unit" aria-pressed="${draft.favorite}" class="${draft.favorite?'is-favorite':''}">★</button></div><div class="editor-tabs" role="tablist">${(r.type==='Combatant'?['Level','Skills','Partner']:['Level']).map(t=>`<button role="tab" aria-selected="${editorTab===t}" aria-controls="editor-tabpanel" data-tab="${t}" class="${editorTab===t?'active':''}">${t.toUpperCase()}</button>`).join('')}</div><section id="editor-tabpanel" role="tabpanel"><h3 class="editor-section-title">${editorTab.toUpperCase()}</h3>${editorBody()}</section><div id="editor-costs">${editorCosts()}</div></div><div class="editor-footer"><span>Illustrative costs · not verified game data</span><button class="secondary" id="cancel-editor">Cancel</button><button class="primary" id="save-editor">Save</button></div>`;
  dialog.setAttribute('aria-labelledby','editor-title');
  if(!wasOpen)dialog.showModal();
  dialog.oncancel=e=>{e.preventDefault();closeEditor();};
  dialog.onclick=e=>{if(e.target===dialog){const box=dialog.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)closeEditor();}};
  dialog.querySelector('#close-editor').onclick=closeEditor;dialog.querySelector('#cancel-editor').onclick=closeEditor;
  dialog.querySelector('#save-editor').onclick=()=>{state.goals[editorId]=draft;state=normalizeState(state);save();const id=editorId;closeEditor();render();document.querySelector(`[data-edit="${id}"]`)?.focus();toast('Unit goals saved');};
  dialog.querySelector('#editor-notes').oninput=e=>draft.notes=e.target.value;
  dialog.querySelector('#editor-rank').onchange=e=>draft.rank=Number(e.target.value);
  dialog.querySelector('#editor-enabled').onchange=e=>draft.enabled=e.target.checked;
  dialog.querySelector('#editor-favorite').onclick=()=>{draft.favorite=!draft.favorite;mountEditor();};
  dialog.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{editorTab=b.dataset.tab;mountEditor();dialog.querySelector(`[data-tab="${editorTab}"]`).focus();});
  function setField(field,value){const match=field.match(/^skill(\d)(current|target)$/);const max=match?10:['ascension','targetAscension'].includes(field)?6:60;const min=max===6?0:1;const n=Math.max(min,Math.min(max,Number.isFinite(Number(value))?Math.floor(Number(value)):min));if(match)draft.skills[Number(match[1])][match[2]]=n;else draft[field]=n;dialog.querySelector(`[data-draft="${field}"]`).value=n;dialog.querySelector('#editor-costs').innerHTML=editorCosts();}
  dialog.querySelectorAll('[data-draft]').forEach(i=>i.onchange=()=>setField(i.dataset.draft,i.value));
  dialog.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{const i=dialog.querySelector(`[data-draft="${b.dataset.step}"]`);setField(b.dataset.step,Number(i.value)+Number(b.dataset.delta));});
  const select=dialog.querySelector('#assigned-partner');if(select)select.onchange=()=>{draft.partner=select.value;mountEditor();};
  const partner=dialog.querySelector('#edit-partner');if(partner)partner.onclick=()=>{const id=draft.partner;state.goals[editorId]=draft;state=normalizeState(state);save();closeEditor();render();openEditor(id);};
}
function showAdd(){
  const dialog=document.createElement('dialog');dialog.className='add-dialog';dialog.setAttribute('aria-label','Add a planner goal');
  dialog.innerHTML=`<h2>Add ${page==='Combatants'?'a combatant':'a partner'}</h2><p>Choose a placeholder to set its goals.</p>${roster.filter(r=>r.type===(page==='Combatants'?'Combatant':'Partner')).map(r=>`<button class="add-option" data-add="${r.id}">${r.name}<span>${stars(r.rarity)}</span></button>`).join('')}<button class="secondary" id="close-add">Cancel</button>`;
  app.append(dialog);dialog.showModal();dialog.onclose=()=>dialog.remove();dialog.querySelector('#close-add').onclick=()=>dialog.close();dialog.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const id=b.dataset.add;dialog.close();openEditor(id);draft.enabled=true;mountEditor();});
}
render();
