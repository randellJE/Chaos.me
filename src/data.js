export const roster = [
  { id: 'c5', name: 'Combatant 01', type: 'Combatant', rarity: 5, role: 'Striker', element: 'Void', color: 'orange', mark: '01' },
  { id: 'c4', name: 'Combatant 02', type: 'Combatant', rarity: 4, role: 'Support', element: 'Order', color: 'purple', mark: '02' },
  { id: 'p5', name: 'Partner 01', type: 'Partner', rarity: 5, role: 'Offense', element: 'Resonance', color: 'orange', mark: 'α' },
  { id: 'p4', name: 'Partner 02', type: 'Partner', rarity: 4, role: 'Defense', element: 'Resonance', color: 'purple', mark: 'β' },
  { id: 'p3', name: 'Partner 03', type: 'Partner', rarity: 3, role: 'Utility', element: 'Resonance', color: 'blue', mark: 'γ' },
];
export const materials = [
  { id: 'credits', name: 'Credits', category: 'Currency', icon: '◈', color: 'gold' },
  { id: 'experience', name: 'Combat records', category: 'Combatant EXP', icon: '▤', color: 'blue' },
  { id: 'prisms', name: 'Chaos prisms', category: 'Ascension', icon: '⬡', color: 'purple' },
  { id: 'memory', name: 'Memory fragments', category: 'Partner EXP', icon: '◇', color: 'green' },
];
export const skillNames = ['Basic skill', 'Special skill', 'Ultimate skill'];
export function requirements(goals) {
  const result = Object.fromEntries(materials.map(m => [m.id, 0]));
  for (const item of roster) {
    const goal = goals[item.id];
    if (!goal?.enabled) continue;
    const delta = Math.max(0, goal.target - goal.current);
    result.credits += delta * item.rarity * 500;
    result[item.type === 'Combatant' ? 'experience' : 'memory'] += delta * 2;
    result.prisms += Math.max(0, (goal.targetAscension ?? 0) - (goal.ascension ?? 0)) * item.rarity;
    for (const skill of goal.skills ?? []) {
      const steps = Math.max(0, skill.target - skill.current);
      result.credits += steps * item.rarity * 1000;
      result.prisms += steps * item.rarity;
    }
    result.prisms += Math.max(0, Math.floor(goal.target / 10) - Math.floor(goal.current / 10)) * item.rarity;
  }
  return result;
}
export function defaultState() {
  return { goals: Object.fromEntries(roster.map(r => [r.id, { enabled: false, current: 1, target: 60, ascension: 0, targetAscension: 0, rank: 0, favorite: false, notes: '', partner: '', skills: skillNames.map(() => ({ current: 1, target: 1 })) }])), inventory: Object.fromEntries(materials.map(m => [m.id, 0])), energy: 120 };
}
export function normalizeState(value) {
  const result = defaultState();
  const clamp = (n, max, fallback) => Number.isFinite(Number(n)) ? Math.max(0, Math.min(max, Math.floor(Number(n)))) : fallback;
  for (const r of roster) {
    const g = value?.goals?.[r.id];
    if (g) result.goals[r.id] = {
      enabled: g.enabled === true, current: Math.max(1, clamp(g.current, 60, 1)), target: Math.max(1, clamp(g.target, 60, 60)),
      ascension: clamp(g.ascension ?? 0, 6, 0), targetAscension: clamp(g.targetAscension ?? 0, 6, 0), rank: clamp(g.rank ?? 0, 6, 0),
      favorite: g.favorite === true, notes: typeof g.notes === 'string' ? g.notes.slice(0, 500) : '',
      partner: roster.some(p => p.type === 'Partner' && p.id === g.partner) ? g.partner : '',
      skills: skillNames.map((_, i) => ({ current: Math.max(1, clamp(g.skills?.[i]?.current ?? 1, 10, 1)), target: Math.max(1, clamp(g.skills?.[i]?.target ?? 1, 10, 1)) })),
    };
  }
  for (const m of materials) result.inventory[m.id] = clamp(value?.inventory?.[m.id] ?? 0, 999999999, 0);
  result.energy = clamp(value?.energy ?? 120, 240, 120);
  return result;
}
