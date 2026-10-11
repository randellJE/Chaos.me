import test from 'node:test';
import assert from 'node:assert/strict';
import { roster, requirements, defaultState, normalizeState } from '../src/data.js';
test('roster contains precisely the requested five rarity placeholders', () => {
  assert.deepEqual(roster.map(r => [r.type,r.rarity]), [['Combatant',5],['Combatant',4],['Partner',5],['Partner',4],['Partner',3]]);
});
test('goals aggregate costs and ignore disabled or completed progression', () => {
  const state=defaultState();
  assert.deepEqual(requirements(state.goals),{credits:0,experience:0,prisms:0,memory:0});
  state.goals.c5={enabled:true,current:1,target:20};
  state.goals.p3={enabled:true,current:10,target:20};
  assert.deepEqual(requirements(state.goals),{credits:62500,experience:38,prisms:13,memory:20});
  state.goals.c5.current=30;
  assert.equal(requirements(state.goals).experience,0);
});
test('imported data is bounded and unknown fields are dropped', () => {
  const state=normalizeState({goals:{c5:{enabled:true,current:-5,target:999}},inventory:{credits:-1,prisms:'garbage'},energy:999});
  assert.equal(state.goals.c5.enabled,true);assert.equal(state.goals.c5.current,1);assert.equal(state.goals.c5.target,60);
  assert.equal(state.inventory.credits,0);assert.equal(state.inventory.prisms,0);assert.equal(state.energy,240);
});

test('skill and ascension costs contribute to active goals', () => {
  const state=defaultState();state.goals.c5.enabled=true;state.goals.c5.target=1;
  state.goals.c5.skills[0].target=3;state.goals.c5.targetAscension=2;
  assert.deepEqual(requirements(state.goals),{credits:10000,experience:0,prisms:20,memory:0});
});
