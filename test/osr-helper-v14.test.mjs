import { test } from 'node:test';
import assert from 'node:assert/strict';

// Set up Foundry V14 globals BEFORE dynamically importing V2 / OSRH modules
class MockDialogV2 {
  static instances = [];
  static confirmCalls = [];

  constructor(options = {}) {
    this.options = options;
    this.rendered = false;
    this.renderOptions = null;
    this.listeners = new Map();
    this.element = {
      querySelector: () => null,
      querySelectorAll: () => []
    };
    MockDialogV2.instances.push(this);
  }

  addEventListener(type, fn) {
    this.listeners.set(type, fn);
  }

  render(opts) {
    this.rendered = true;
    this.renderOptions = opts;
    return this;
  }

  static async confirm(options = {}) {
    MockDialogV2.confirmCalls.push(options);
    return true;
  }
}

class MockApplicationV2 {
  constructor(options = {}) {
    this.options = foundry.utils.mergeObject(this.constructor.DEFAULT_OPTIONS ?? {}, options);
    this.position = { ...(this.options.position ?? { top: 100, left: 100 }) };
    this.tabGroups = {};
    this.rendered = false;
  }

  async _prepareContext() {
    return {};
  }

  render(opts) {
    this.rendered = true;
    this.lastRenderOptions = opts;
    return this;
  }

  close() {
    this.rendered = false;
  }
}

class MockDragDrop {
  constructor(config) {
    this.config = config;
  }
  bind() {}
}

globalThis.foundry = {
  utils: {
    deepClone: (v) => structuredClone(v),
    mergeObject: (target = {}, source = {}) => ({ ...target, ...source }),
    randomID: () => 'abcdef0123456789'
  },
  applications: {
    instances: new Map(),
    api: {
      ApplicationV2: MockApplicationV2,
      HandlebarsApplicationMixin: (Base) => Base,
      DialogV2: MockDialogV2
    },
    ux: {
      DragDrop: { implementation: MockDragDrop },
      TextEditor: {
        implementation: {
          getDragEventData: (ev) => ev._dragData ?? {}
        }
      }
    },
    handlebars: {
      renderTemplate: async (tpl, data) => `<tpl data-path="${tpl}">${JSON.stringify(data)}</tpl>`
    }
  }
};

globalThis.CONFIG = { sounds: { dice: 'sounds/dice.wav' } };
globalThis.Roll = class MockRoll {
  constructor(formula) {
    this.formula = formula;
    this.total = 7;
    this.result = 1;
    this._evaluated = false;
  }
  evaluateSync() {
    this._evaluated = true;
    this.total = 8;
    return this;
  }
  async evaluate() {
    this._evaluated = true;
    this.total = 1;
    this.result = 1;
    return this;
  }
};

const createdMessages = [];
const warnings = [];
const settingsStore = new Map();
const actorMap = new Map();
actorMap.filter = (fn) => [...actorMap.values()].filter(fn);
const uuidMap = new Map();

globalThis.ChatMessage = {
  getSpeaker: () => ({ alias: 'GM' }),
  create: async (data) => {
    createdMessages.push(data);
    return data;
  }
};

globalThis.ui = {
  windows: {},
  sidebar: { render: () => {} },
  notifications: {
    warn: (m) => warnings.push(m),
    error: (m) => warnings.push(m),
    info: () => {},
    notify: () => {}
  }
};

globalThis.canvas = {
  tokens: { controlled: [] }
};

globalThis.Hooks = {
  _once: new Map(),
  on: () => {},
  once: (name, fn) => {
    globalThis.Hooks._once.set(name, fn);
    return fn;
  },
  off: (name) => {
    globalThis.Hooks._once.delete(name);
  },
  call: () => {}
};

globalThis.fromUuid = async (uuid) => uuidMap.get(uuid) ?? null;

globalThis.game = {
  version: '14.370.0',
  system: { id: 'ose' },
  user: { id: 'gmUserId12345678', uuid: 'User.gmUserId12345678', isGM: true, role: 4, targets: new Set() },
  users: {
    contents: [{ id: 'gmUserId12345678', role: 4 }],
    filter: (fn) => [{ id: 'gmUserId12345678', role: 4 }].filter(fn)
  },
  i18n: {
    lang: 'en',
    localize: (k) => {
      const dict = {
        'OSRH.curency.gp': 'GP',
        'OSRH.curency.sp': 'SP',
        'OSRH.turn.react.monster.c': 'Uncertain: Monster confused or hesitant'
      };
      return dict[k] ?? k;
    }
  },
  time: {
    worldTime: 1000,
    advance: (sec) => {
      globalThis.game.time.worldTime += sec;
    }
  },
  settings: {
    get: (scope, key) => settingsStore.get(`${scope}.${key}`),
    set: async (scope, key, val) => {
      settingsStore.set(`${scope}.${key}`, structuredClone(val));
      return val;
    }
  },
  tables: {
    contents: [],
    getName: () => null
  },
  journal: {
    getName: () => ({
      pages: [{ name: 'Time', update: async () => {} }]
    })
  },
  packs: new Map(),
  actors: actorMap,
  scenes: []
};

globalThis.OSRH = {
  moduleName: 'osr-helper',
  lang: ['en', 'es', 'pt-BR'],
  CONST: {
    terrainMod: { clear: 1, forest: 0.66 },
    lostMod: { clear: 1 },
    timeInc: { minute: 60, turn: 600, hour: 3600, day: 86400 }
  },
  data: {
    defaultLightSettings: {
      dim: 30,
      bright: 10,
      color: '#ff7b24',
      alpha: 0.5,
      angle: 360,
      warn: 3,
      duration: 60,
      animation: 'flame',
      speed: 3,
      intensity: 5,
      luminosity: 0.4,
      bgSat: 0,
      bgCont: 0,
      bgShadow: 0
    },
    defaultRationSettings: {
      name: 'Rations',
      trackExpiration: false,
      duration: { type: 'day', value: 604800 }
    },
    effectIcons: [{ name: 'Shield', color: '#ffffff', textColor: '#000000', path: 'icons/svg/shield.svg' }]
  },
  systemData: {
    id: 'ose',
    partySheet: true,
    partyTypes: ['character'],
    baseMovMod: 1,
    tags: true,
    lightItemTypes: ['item'],
    paths: {
      itemQty: 'system.quantity.value',
      encMov: 'system.movement.encounter',
      hp: { val: 'system.hp.value', max: 'system.hp.max' },
      ac: 'system.aac.value',
      weaponDamage: 'system.damage'
    }
  },
  ration: {
    handlePartyRations: async () => {}
  },
  socket: {
    executeForEveryone: () => {},
    executeAsGM: async () => {}
  },
  util: {},
  turn: {},
  light: {},
  report: {},
  party: {},
  V2: {}
};

const { registerUtil, renderTemplateHandler } = await import('../scripts/modules/util.js');
const { registerTurn } = await import('../scripts/modules/turn.js');
const { registerLightModule } = await import('../scripts/modules/lightModule.js');
const { registerReports } = await import('../scripts/modules/reports.js');
const { OSRHPartySheetV2 } = await import('../scripts/modules/v2/party-sheet.mjs');
const { OSRHTurnTrackerV2 } = await import('../scripts/modules/v2/turn-tracker.mjs');
const { OSRActiveEffectsAppV2 } = await import('../scripts/modules/v2/active-effects.mjs');
const { ManageCustomAttributes } = await import('../scripts/modules/custom-attrib/manage-attributes.mjs');
const { CustomAttributeEdit } = await import('../scripts/modules/custom-attrib/custom-attrib-edit.mjs');
const { decrementAttribute } = await import('../scripts/modules/custom-attrib/custom-attrib-util.mjs');

OSRH.ManageCustomAttributes = ManageCustomAttributes;
OSRH.CustomAttributeEdit = CustomAttributeEdit;

registerUtil();
registerTurn();
registerLightModule();
registerReports();

test('util.js: handles 3-segment Foundry V14 semver ("14.370.0") in dragDropHandler and renderTemplateHandler', async () => {
  const dd = OSRH.util.dragDropHandler({ dragSelector: '.item' });
  assert.ok(dd instanceof MockDragDrop);
  const rendered = await renderTemplateHandler('modules/osr-helper/templates/test.hbs', { ok: true });
  assert.match(rendered, /data-path="modules\/osr-helper\/templates\/test\.hbs"/);
});

test('util.js: curConDiag uses DialogV2 with classes ["ose", "dialog"], position, and force render; curConvert resolves osr-helper-items-en pack', async () => {
  MockDialogV2.instances.length = 0;

  let gpQty = 5;
  let spQty = 0;
  const gpItem = {
    name: 'GP',
    system: { cost: 1, quantity: { value: gpQty } },
    update: async (patch) => {
      gpQty = patch.system.quantity.value;
      gpItem.system.quantity.value = gpQty;
    }
  };
  let spItem = null;
  const actor = {
    id: 'actor12345678901',
    uuid: 'Actor.actor12345678901',
    items: {
      getName: (n) => (n === 'GP' ? gpItem : n === 'SP' ? spItem : null)
    },
    createEmbeddedDocuments: async (_type, docs) => {
      spItem = {
        ...docs[0],
        update: async (patch) => {
          spQty = patch.system.quantity.value;
          spItem.system.quantity.value = spQty;
        }
      };
      return [spItem];
    }
  };
  uuidMap.set(actor.uuid, actor);

  game.packs.set('osr-helper.osr-helper-items-en', {
    getIndex: async () => [{ _id: 'spCompId12345678', name: 'SP' }],
    getDocument: async (id) => {
      assert.equal(id, 'spCompId12345678');
      return {
        toObject: () => ({ name: 'SP', type: 'item', system: { cost: 0.1, quantity: { value: 1 } } })
      };
    }
  });

  await OSRH.util.curConDiag(actor, actor.uuid, 2);
  assert.equal(MockDialogV2.instances.length, 1);
  const dlg = MockDialogV2.instances[0];
  assert.deepEqual(dlg.options.classes, ['ose', 'dialog']);
  assert.deepEqual(dlg.options.position, { width: 400, height: 'auto' });
  assert.deepEqual(dlg.renderOptions, { force: true });

  await OSRH.util.curConvert(2, 'GP', 'SP', actor.uuid);
  assert.equal(gpQty, 3);
  assert.equal(spQty, 20);
});

test('turn.js: rollReact outputs localized reaction text (not undefined), dungeonTurn clamps Level 9+ eTables and formats V14 documentUuid', async () => {
  createdMessages.length = 0;

  await OSRH.turn.rollReact('monster');
  assert.equal(createdMessages.length, 1);
  assert.equal(createdMessages[0].user, 'gmUserId12345678');
  assert.equal(Array.isArray(createdMessages[0].rolls), true);
  assert.match(createdMessages[0].content, /Uncertain: Monster confused or hesitant/);
  assert.doesNotMatch(createdMessages[0].content, /undefined/);

  // Dungeon turn at Level 9 (> 8 eTables) with rest = 5 (rest warning threshold)
  createdMessages.length = 0;
  settingsStore.set('osr-helper.dungeonTurnNotificiation', false);
  settingsStore.set('osr-helper.restMessage', true);
  settingsStore.set('osr-helper.timeJournalName', 'Time');
  settingsStore.set('osr-helper.turnData', {
    journalName: 'Time',
    dungeon: {
      eTables: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'DeepestTable'],
      rTable: 'none',
      lvl: 9,
      walkCount: 1,
      rSprite: false,
      proc: 1,
      procCount: 0,
      rollEnc: true,
      rollReact: false,
      rollTarget: 2,
      rest: 5,
      restWarnCount: 0,
      session: 0,
      total: 0,
      notes: 'Checking room 12',
      noteHistory: []
    },
    travel: {
      session: 0,
      total: 0,
      rest: 0,
      rollEnc: true,
      rollReact: false,
      rTable: 'none',
      eTable: 'WildTable',
      proc: 1,
      procCount: 0,
      rollTarget: 2,
      restWarnCount: 0,
      terrain: 'clear',
      duration: 24,
      notes: '',
      noteHistory: []
    }
  });

  game.tables.getName = (name) => {
    if (name === 'DeepestTable') {
      return {
        roll: async () => ({
          roll: { _evaluated: true },
          results: [{ documentUuid: 'Actor.goblin1234567890', name: 'Goblin Scout' }]
        })
      };
    }
    if (name === 'WildTable') {
      return {
        roll: async () => ({
          roll: { _evaluated: true },
          results: [{ documentUuid: 'Compendium.ose.monsters.Actor.wolf123456789012', name: 'Dire Wolf' }]
        })
      };
    }
    return null;
  };

  const ok = await OSRH.turn.dungeonTurn();
  assert.equal(ok, true);
  const savedTurnData = settingsStore.get('osr-helper.turnData');
  assert.equal(savedTurnData.dungeon.total, 1);
  assert.equal(savedTurnData.dungeon.rest, 6);
  assert.equal(savedTurnData.dungeon.restWarnCount, 1);
  assert.deepEqual(savedTurnData.dungeon.noteHistory, ['Checking room 12']);
  const encMsg = createdMessages.find((m) => m.content?.includes('@UUID[Actor.goblin1234567890]{Goblin Scout}'));
  assert.ok(encMsg, 'Expected V14 @UUID[Actor...] link in dungeon encounter chat message');

  createdMessages.length = 0;
  await OSRH.turn.travelTurn();
  const wildMsg = createdMessages.find((m) =>
    m.content?.includes('@UUID[Compendium.ose.monsters.Actor.wolf123456789012]{Dire Wolf}')
  );
  assert.ok(wildMsg, 'Expected V14 @UUID[Compendium...] link in travel encounter chat message');
});

test('lightModule.js & reports.js: 10s combat tick triggers dimming threshold, maps bgSat->saturation, and ration report handles qty colors + empty party', async () => {
  const tokenUpdates = [];
  game.scenes = [
    {
      tokens: new Set([
        {
          actor: { uuid: 'Actor.torchBearer12345' },
          update: async (u) => tokenUpdates.push(u)
        }
      ])
    }
  ];

  // Torch started at t=0, duration=60 min (3600s), warn=3 turns (1800s).
  // At worldTime=1810 (10s combat tick past 1800s), remaining=1790 <= 1800: must still warn & dim!
  game.time.worldTime = 1810;
  settingsStore.set('osr-helper.lightData', {
    torchBearer12345: {
      name: 'Torchbearer',
      uuid: 'Actor.torchBearer12345',
      lightLit: true,
      lights: [
        {
          id: 'light1',
          itemId: 'item1',
          start: 0,
          duration: 3600,
          isOn: true,
          warned: false,
          data: {
            dim: 30,
            bright: 10,
            warn: 3,
            color: '#ff7b24',
            alpha: 0.5,
            bgSat: 0.25,
            bgCont: 0,
            bgShadow: 0
          }
        }
      ]
    }
  });

  await OSRH.light.lightCheck();
  assert.equal(tokenUpdates.length, 1);
  assert.equal(tokenUpdates[0].light.bright, 10);
  assert.equal(tokenUpdates[0].light.dim, 21);
  assert.equal(tokenUpdates[0].light.saturation, 0.25);
  const updatedLight = settingsStore.get('osr-helper.lightData').torchBearer12345.lights[0];
  assert.equal(updatedLight.warned, true);

  createdMessages.length = 0;
  settingsStore.set('osr-helper.whisperLightCheck', true);
  await OSRH.light.turnsRemaining('torchBearer12345');
  assert.equal(createdMessages.length, 1);
  assert.deepEqual(createdMessages[0].whisper, ['gmUserId12345678']);

  // Empty party ration report should output 0 days left (not NaN)
  actorMap.clear();
  createdMessages.length = 0;
  await OSRH.report.ration();
  assert.equal(createdMessages.length, 1);
  assert.doesNotMatch(createdMessages[0].content, /NaN/);
  assert.match(createdMessages[0].content, /<b>0<\/b>/);
});

test('PartySheetV2, TurnTrackerV2, ActiveEffectsV2 & CustomAttributes V14 behavior', async () => {
  // 1. PartySheetV2._onDrop: dropping pool actor onto occupied cell returns displaced actor to pool
  const fighter = { uuid: 'Actor.fighter123456789', img: 'f.webp', name: 'Fighter', type: 'character', flags: { ose: { party: true } } };
  const cleric = { uuid: 'Actor.cleric1234567890', img: 'c.webp', name: 'Cleric', type: 'character', flags: { ose: { party: true } } };
  uuidMap.set(fighter.uuid, fighter);
  uuidMap.set(cleric.uuid, cleric);
  actorMap.set('fighter', fighter);
  actorMap.set('cleric', cleric);

  const formation = {
    lead: [1, 1],
    pool: [{ uuid: cleric.uuid, img: cleric.img, name: cleric.name }],
    grid: [
      [{ uuid: null, img: null, name: null }, { uuid: null, img: null, name: null }, { uuid: null, img: null, name: null }],
      [{ uuid: null, img: null, name: null }, { uuid: fighter.uuid, img: fighter.img, name: fighter.name }, { uuid: null, img: null, name: null }],
      [{ uuid: null, img: null, name: null }, { uuid: null, img: null, name: null }, { uuid: null, img: null, name: null }]
    ]
  };
  const sheet = new OSRHPartySheetV2({ party: [fighter, cleric], formation, gridSize: 3 });
  const cellTarget = {
    dataset: { type: 'grid-cell', row: '1', cell: '1' },
    closest: () => cellTarget
  };
  await sheet._onDrop({
    target: cellTarget,
    _dragData: { type: 'Actor', uuid: cleric.uuid }
  });
  assert.equal(sheet.formation.grid[1][1].uuid, cleric.uuid);
  assert.equal(
    sheet.formation.pool.some((p) => p.uuid === fighter.uuid),
    true,
    'Displaced leader should be returned to formation.pool rather than lost'
  );

  // 2. TurnTrackerV2.handleRestAnimation(0, html) (upstream #46) + empty party getBaseRate
  const tracker = new OSRHTurnTrackerV2();
  assert.equal(tracker.getBaseRate({ party: [] }), 0);
  const bg0 = { style: {}, classList: { hidden: true, remove() { this.hidden = false; }, add() { this.hidden = true; } } };
  assert.doesNotThrow(() =>
    tracker.handleRestAnimation(0, {
      querySelector: (sel) => (sel === '#bg-0' ? bg0 : null)
    })
  );
  assert.equal(bg0.style.top, '0px');
  assert.equal(bg0.style.left, '55px');
  assert.equal(bg0.classList.hidden, false);

  // 3. OSRActiveEffectsAppV2.validateEffectObject supports both active effects and presets
  const fxApp = new OSRActiveEffectsAppV2({ displayAll: true });
  assert.equal(
    fxApp.validateEffectObject({
      name: 'Bless',
      icon: 'Shield',
      duration: 6,
      interval: 'minutes',
      changes: [{ path: 'system.thac0.mod.melee', label: 'Melee Bonus', value: 1 }]
    }),
    true
  );
  assert.equal(
    fxApp.validateEffectObject({
      name: 'Bless',
      icon: 'icons/svg/shield.svg',
      iconName: 'Shield',
      duration: { seconds: 360 },
      flags: { data: { isInf: false } },
      changes: [{ key: 'system.thac0.mod.melee', value: 1 }]
    }),
    true
  );

  // 4. Custom Attributes: ApplicationV2 inheritance, 3-char abbr validation, and charge decrement
  let savedCustomAttribs = [{ id: 'attr1', name: 'Faith', abbr: 'FTH', value: 1, items: [] }];
  const caActor = {
    id: 'caActor123456789',
    _id: 'caActor123456789',
    flags: { 'osr-helper': { customAttributes: savedCustomAttribs } },
    setFlag: async (_scope, _key, val) => {
      savedCustomAttribs = structuredClone(val);
      caActor.flags['osr-helper'].customAttributes = savedCustomAttribs;
    },
    sheet: { rendered: false, render: () => {} }
  };
  actorMap.set(caActor.id, caActor);

  const mgr = new ManageCustomAttributes(caActor);
  assert.ok(mgr instanceof MockApplicationV2);

  const editor = new CustomAttributeEdit({ id: 'attr2', name: 'Luck', abbr: 'LK', value: 3, items: [] }, caActor.id);
  assert.ok(editor instanceof MockApplicationV2);
  assert.equal(editor._validateAttribData(), false);
  editor.attrib.abbr = 'LCK';
  assert.equal(editor._validateAttribData(), true);

  await decrementAttribute(caActor.id, 'attr1');
  assert.equal(savedCustomAttribs[0].value, 0);
  warnings.length = 0;
  await decrementAttribute(caActor.id, 'attr1');
  assert.equal(savedCustomAttribs[0].value, 0);
  assert.equal(warnings.length, 1);
});
