export const registerSettings = async function () {

  game.settings.register(`${OSRH.moduleName}`, 'timeJournalName', {
    name: "OSRH.settings.timeJournal.name",
    hint: "OSRH.settings.timeJournal.hint",
    scope: 'world',
    type: String,
    default: 'Turn Count',
    config: true
  });

  game.settings.register(`${OSRH.moduleName}`, 'displayControlUi', {
    name: "OSRH.settings.displayUI.name",
    hint: "OSRH.settings.displayUI.hint",
    scope: 'client',
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register(`${OSRH.moduleName}`, 'restMessage', {
    name: "OSRH.settings.restMsg.name",
    hint: "OSRH.settings.restMsg.name",
    scope: 'world',
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register(`${OSRH.moduleName}`, 'whisperRest', {
    name: "OSRH.settings.restMsg.whisper",
    hint: "OSRH.settings.restMsg.whisper",
    scope: 'world',
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register(`${OSRH.moduleName}`, 'tokenLightDefault', {
    name: "OSRH.settings.tokenLightDefault.name",
    hint: "OSRH.settings.tokenLightDefault.hint",
    scope: 'world',
    type: Boolean,
    default: true,
    config: true
  });
  game.settings.register(`${OSRH.moduleName}`, 'combatTimeAdvance', {
    name: "OSRH.settings.combatTime.name",
    hint: "OSRH.settings.combatTime.hint",
    scope: 'world',
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register(`${OSRH.moduleName}`, 'dungeonTurnNotificiation', {
    name: "OSRH.settings.dungeonTurnNotify.name",
    hint: "OSRH.settings.dungeonTurnNotify.hint",
    scope: 'world',
    type: Boolean,
    default: true,
    config: true
  });
  //stores world time after last turn advance
  game.settings.register(`${OSRH.moduleName}`, 'lastTick', {
    name: 'lastTick',
    scope: 'world',
    type: Object,
    default: {
      lastTick: game.time.worldTime
    },
    config: false
  });

  game.settings.register(`${OSRH.moduleName}`, 'userData', {
    name: 'userData',
    scope: 'client',
    type: Object,
    default: {
      actors: {},
      lastTick: game.time.worldTime
    },
    config: false
  });

  //custom effect data obj
  game.settings.register(`${OSRH.moduleName}`, 'customEffects', {
    name: 'effectData',
    scope: 'world',
    type: Object,
    default: {},
    config: false
  });
  game.settings.register(`${OSRH.moduleName}`, 'lightData', {
    name: 'lightData',
    scope: 'world',
    type: Object,
    default: {},
    config: false
  });
  
  game.settings.register(`${OSRH.moduleName}`, 'effectData', {
    name: 'effectData',
    scope: 'world',
    type: Array,
    default: [],
    config: false
  });

  //stores turn count data

  game.settings.register(`${OSRH.moduleName}`, 'turnData', {
    name: 'turnData',
    scope: 'world',
    type: Object,
    default: {
      journalName: game.settings.get(`${OSRH.moduleName}`, 'timeJournalName'),
      dungeon: {  
        eTables: ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'none'],
        rTable: 'none',
        lvl: 1,
        walkCount: 1,
        rSprite: false,
        proc: 0,
        procCount: 0,
        rollEnc: false,
        rollReact: false,
        rollTarget: 0,
        rest: 0,
        restWarnCount: 0,
        session: 0,
        total: 0,
      },
      travel: {
        session: 0,
        total: 0,
        rest: 0,
        rollEnc: false,
        rollReact: false,
        rTable: 'none',
        eTable: 'none',
        proc: 0,
        procCount: 0,
        rollTarget: 2,
        restWarnCount: 0,
        terrain: 'clear',
        duration: 24
      }
      
    },
    config: false
  });
  // stores saved custom effects
  game.settings.register(`${OSRH.moduleName}`, 'savedEffects', {
    name: 'savedEffects',
    scope: 'world',
    type: Object,
    default: {},
    config: false
  });

  //ration settings
  // game.settings.register(`${OSRH.moduleName}`, 'trackRations', {
  //   name: 'Track Rations Use',
  //   hint: 'Track Rations Use',
  //   scope: 'client',
  //   type: Boolean,
  //   default: false,
  //   config: true
  // });
  // hide foreign language packs
  game.settings.register(`${OSRH.moduleName}`, 'hideForeignPacks', {
    name: "OSRH.settings.hideForeignPack.name",
    hint: "OSRH.settings.hideForeignPack.hint",
    scope: 'client',
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register(`${OSRH.moduleName}`, 'rationData', {
    name: 'rationData',
    scope: 'world',
    type: Object,
    default: {
      proc: 0,
      procCount: 0,
      rest: 0,
      restWarnCount: 0,
      session: 0,
      total: 0,
      journalName: game.settings.get(`${OSRH.moduleName}`, 'timeJournalName')
    },
    config: false
  });

  game.settings.register(`${OSRH.moduleName}`, 'centerHotbar', {
    name: "OSRH.settings.centerHotbar.name",
    hint: "OSRH.settings.centerHotbar.hint",
    scope: 'client',
    type: Boolean,
    default: true,
    config: true,
    onChange: () => OSRH.util.centerHotbar()
  });
  //split to ose-helper eventually
  game.settings.register(`${OSRH.moduleName}`, 'classTypeList', {
    name: 'classTypeList',
    scope: 'world',
    type: Array,
    default: [],
    config: false
  });

  game.settings.register(`${OSRH.moduleName}`, 'dungeonTurnData', {
    name: 'dungeonTurnData',
    scope: 'world',
    type: Object,
    default: {
      proc: 0,
      rTable: 'none',
      eTable: 'none',
      rollTarget: 0,
      rollEnc: false,
      rollReact: false
    },
    config: false
  });

  game.settings.register(`${OSRH.moduleName}`, 'enableLightConfig', {
    name: "OSRH.settings.showLightConfig.name",
    hint: "OSRH.settings.showLightConfig.hint",
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });
  game.settings.register(`${OSRH.moduleName}`, 'effectPresets', {
    name: 'effectPresets',
    scope: 'world',
    type: Array,
    default: [],
    config: false
  });

  game.settings.register(`${OSRH.moduleName}`, 'theme', {
    name: "OSRH.settings.theme.name",
    hint: "OSRH.settings.theme.hint",
    type: String,
    choices: {
      0: "OSRH.themes.purpleSlide",//OSRH.data.themeData[0].name,
      1: "OSRH.themes.santaFe",//OSRH.data.themeData[1].name,
      2: "OSRH.themes.deepBlue",//OSRH.data.themeData[2].name,
      3: "OSRH.themes.greenSLime",//OSRH.data.themeData[3].name,
      4: "OSRH.themes.cottonCandy",//OSRH.data.themeData[4].name,
      5: "OSRH.themes.paleSunrise"//OSRH.data.themeData[5].name
    },
    default: 'none',
    scope: 'client',
    config: true,
    onChange: () => {
      OSRH.util.setTheme();
    }
  });

  game.settings.register(`${OSRH.moduleName}`, 'enableEquippableContainers', {
    name: "OSRH.settings.equipContainers.name",
    hint: "OSRH.settings.equipContainers.hint",
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });

  // ---------------remove once ose system fixed to accomodate time advance on game round advance
  game.settings.register(`${OSRH.moduleName}`, 'lastRound', {
    name: 'lastRound',
    scope: 'world',
    type: Number,
    default: 0,
    config: false
  });
  // --------------
};
