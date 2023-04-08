export class OSRHTurnTracker extends FormApplication {
  constructor() {
    super();
    this.turnData = deepClone(game.settings.get('osr-helper', 'turnData'));
    this.tableNames = game.tables.contents.map((i) => i.name);
    // this.dungeonTurnData = game.settings.get('osr-helper', 'dungeonTurnData');
    this.isGM = game.user.isGM;
    this.settingsChanged = false;
    this.terrainMod = OSRH.CONST.terrainMod;
    this.lostMod = OSRH.CONST.lostMod;
    // if(!this.dungeonTurnData.lvl)this.dungeonTurnData.lvl = 1;
  }
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['osrh', 'turn-tracker'],
      template: `modules/${OSRH.moduleName}/templates/turn-tracker.hbs`,
      id: `turn-tracker`,
      title: `Turn Tracker`,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.tab-content', initial: 'travel' }],
      width: 300,
      height: 470
    });
  }
  getData() {
    const context = super.getData();
    const partyObj = OSRH.util.getPartyActors();
    
    const tMod = this.terrainMod[this.turnData.travel.terrain]; 
    context.baseRate = Math.floor(this.getBaseRate(partyObj) * tMod);
    context.characters = this.partyData(partyObj.characters, tMod);
    context.retainers = this.partyData(partyObj.retainers, tMod);
    context.isGM = this.isGM;
    context.turnData = this.turnData;
    context.tableNames = this.tableNames;
    context.DTData = this.dungeonTurnData;
    return context;
  }
 
  // dungeon turn
  activateListeners(html) {
    const advanceDungeonTurn = html.find('#dungeon-turn-advance-btn')[0];
    const advanceTravelTurn = html.find('#travel-turn-advance-btn')[0];
    const terrainSelect = html.find('#terrain')[0];
    const dRestBtn = html.find('#d-rest-btn')[0];
    const tRestBtn = html.find('#t-rest-btn')[0];
    const forageCheck = html.find('#forage-check')[0];
    const navCheck = html.find('#navigation-check')[0];
    const encSelectEls = html.find('.d-enc-select');
    const saveSettings = html.find('.save-settings');
    const dEncRoll = html.find('#d-encounter-roll')[0];
    const dReactRoll = html.find('#d-react-roll')[0];
    const dReactTable = html.find('#d-react-table')[0];
    const dEncFreq = html.find('#d-encounter-freq')[0];
    const dRollTarget = html.find('#d-encounter-target')[0];
    const tEncFreq = html.find('#t-encounter-freq')[0];
    const tRollTarget = html.find('#t-encounter-target')[0];
    const tReactTable = html.find('#travel-react-table')[0];
    const tEncTable = html.find('#travel-enc-table')[0];
    const dungeonLvl = html.find('#d-level')[0];
    const resetSession = html.find('#reset-session-btn')[0];
    const resetTotal = html.find('#reset-total-btn')[0];
    const dLvlUp = html.find('#d-lvl-up')[0];
    const dLvlDn = html.find('#d-lvl-dn')[0];
    // gm only controls
    if (this.isGM) {
      terrainSelect.value = this.turnData.travel.terrain;
      // this.updatePartyDist(html, this.terrainMod[terrainSelect.value]);
      
      for (let i = 0; i < encSelectEls.length; i++) {
        const el = encSelectEls[i];
        el.value = this.turnData.dungeon.eTables[i];
        el.addEventListener('change', (e) => {
          this.settingsChanged = true;
          this.turnData.dungeon.eTables = this.getEncounterTables(html);
          this.showSaveBtn(saveSettings);
        });
      }
      terrainSelect.addEventListener('change', (e) => {
        this.updatePartyDist(html, this.terrainMod[e.target.value]);
        const chance = this.getTerrainChance(html);
        this.turnData.travel.rollTarget = chance;
        tRollTarget.value = chance;
        
        this.showSaveBtn(saveSettings);
      });
      dEncRoll.addEventListener('change', (e) => {
        this.showSaveBtn(saveSettings);
      });
      dReactRoll.addEventListener('change', (e) => {
        this.showSaveBtn(saveSettings);
      });
      dReactTable.value = this.turnData.dungeon.rTable;
      tReactTable.value = this.turnData.travel.rTable;
      tEncTable.value = this.turnData.travel.eTable
      dReactTable.addEventListener('change', (e) => {
        this.showSaveBtn(saveSettings);
      });
      tReactTable.addEventListener('change', (e) => {
        this.showSaveBtn(saveSettings);
      });
      tEncTable.addEventListener('change', (e) => {
        this.showSaveBtn(saveSettings);
      });
      dEncFreq.addEventListener('change', (e) => {
        this.showSaveBtn(saveSettings);
      });
      dRollTarget.addEventListener('change', (e) => {
        this.showSaveBtn(saveSettings);
      });
      tEncFreq.addEventListener('change', (e) => {
        this.showSaveBtn(saveSettings);
      });
      tRollTarget.addEventListener('change', (e) => {
        this.showSaveBtn(saveSettings);
      });
      dungeonLvl.addEventListener('change', (e) => {
        this.showSaveBtn(saveSettings);
      });
      dRestBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await OSRH.turn.rest('dungeon');
        OSRH.socket.executeForEveryone('refreshTurnTracker');
      });
      tRestBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await OSRH.turn.rest('travel');
        OSRH.socket.executeForEveryone('refreshTurnTracker');
      });
      dLvlUp.addEventListener('click', (e) => {
        this.turnData.dungeon.lvl++;
        dungeonLvl.value = this.turnData.dungeon.lvl;
        this.showSaveBtn(saveSettings);
      });
      dLvlDn.addEventListener('click', (e) => {
        this.turnData.dungeon.lvl--;
        if (this.turnData.dungeon.lvl <= 0) this.turnData.dungeon.lvl = 1;
        dungeonLvl.value = this.turnData.dungeon.lvl;
        this.showSaveBtn(saveSettings);
      });
      advanceDungeonTurn.addEventListener('click', async (e) => {
        e.preventDefault();
        await OSRH.turn.dungeonTurn();
        this.turnData = await game.settings.get('osr-helper', 'turnData');
        this.render(true);
        OSRH.socket.executeForEveryone('refreshTurnTracker');
      });
      advanceTravelTurn.addEventListener('click', async e=>{
        await OSRH.turn.travelTurn();
        this.turnData = await game.settings.get('osr-helper', 'turnData');
        this.render(true);
        OSRH.socket.executeForEveryone('refreshTurnTracker');
      })
      resetSession.addEventListener('click', async (e) => {
        let tab = this.getActiveTab(html);

        if (tab === 'dungeon') await OSRH.turn.resetSessionCount('dungeon');
        if (tab === 'travel')await OSRH.turn.resetSessionCount('travel');
        
        this.turnData = await game.settings.get('osr-helper', 'turnData');
        OSRH.socket.executeForEveryone('refreshTurnTracker');
      });
      for (let btn of saveSettings) {
        btn.addEventListener('click', async (e) => {
          await this.updateTurnData(html);
          OSRH.socket.executeForEveryone('refreshTurnTracker');
          ui.notifications.notify('Dungeon Turn Settings Updated.');
        });
      }
      // saveSettings.addEventListener('click', async (e) => {
      //   await this.updateTurnData(html);
      //   OSRH.socket.executeForEveryone('refreshTurnTracker');
      //   ui.notifications.notify('Dungeon Turn Settings Updated.');
      // });
      resetTotal.addEventListener('click', (e) => {
        let tab = this.getActiveTab(html);
        let app = new Dialog({
          title: 'WARNING',
          content: '<p>WARNING! This will reset all turn counts. This action cannot be undone.</p>',
          buttons: {
            one: {
              icon: '<i class=`fas fa-check`></i>',
              label: 'Reset',
              callback: async () => {
                await OSRH.turn.resetAllCounts(tab);
                OSRH.socket.executeForEveryone('refreshTurnTracker');
              }
            },
            two: {
              icon: '<i class=`fas fa-times`></i>',
              label: 'Close',
              callback: function () {
                app.close();
              }
            }
          },
          default: 'two'
        }).render(true);
      });

      forageCheck.addEventListener('click', (e) => {
        this.forageCheck(html);
      });
      navCheck.addEventListener('click', (e) => {
        this.lostRoll(html);
      });
    }

    // handle tracker animation
    if (this.turnData.dungeon.rSprite) {
      this.handleRestAnimation(this.turnData.dungeon.walkCount, html);
    } else {
      this.updateAnimation(this.turnData.dungeon.walkCount, html);
    }
  }

  getTerrainChance(html){
    const terrain = html.find('#terrain')[0].value;
    const terrainEls = [...html.find('option.terrainOpt')]
    const data = terrainEls.find(i=>i.value === terrain).dataset;
    
    return parseInt(data.target)
  }
  getActiveTab(html) {
    let a = html.find('.nav-tab.active')[0];
    return a?.dataset.tab;
  }
  showSaveBtn(btnArr) {
    this.settingsChanged = true;
    for (let btn of btnArr) {
      if (btn.classList.contains('hidden')) btn.classList.remove('hidden');
    }
  }
  hideSaveBtn(btnArr) {
    this.settingsChanged = false;
    for (let btn of btnArr) {
      if (!btn.classList.contains('hidden')) btn.classList.add('hidden');
    }
  }
  async refreshCounts(refresh = false) {
    this.turnData = deepClone(await game.settings.get('osr-helper', 'turnData'));
    // this.dungeonTurnData = await game.settings.get('osr-helper', 'dungeonTurnData');
    if (refresh) this.render(true);
  }
  getEncounterTables(html) {
    let selectEls = [...html.find('.d-enc-select')];
    return selectEls.map((el) => el.value).map((i) => (i == '' ? null : i));
  }
  async updateTurnData(html) {
    const dEncRoll = html.find('#d-encounter-roll')[0];
    const dReactRoll = html.find('#d-react-roll')[0];
    const tEncRoll = html.find('#d-encounter-roll')[0];
    const tReactRoll = html.find('#d-react-roll')[0];
    const tEncTable = html.find('#travel-enc-table')[0];
    const tReactTable = html.find('#travel-react-table')[0];
    const dReactTable = html.find('#d-react-table')[0];
    const dEncFreq = html.find('#d-encounter-freq')[0];
    const tEncFreq = html.find('#t-encounter-freq')[0];
    const tRollTarget = html.find('#t-encounter-target')[0];
    const dRollTarget = html.find('#d-encounter-target')[0];
    const dungeonLvl = html.find('#d-level')[0];
    const encTables = this.getEncounterTables(html);
    const saveSettings = html.find('.save-settings');
    const terrainSelect = html.find('#terrain')[0];

    this.turnData.travel.terrain = terrainSelect.value;
    this.turnData.travel.eTable = tEncTable.value;
    this.turnData.travel.rollEnc = tEncRoll.checked;
    this.turnData.travel.rollReact = tReactRoll.checked;
    this.turnData.travel.rTable = tReactTable.value;
    this.turnData.travel.proc = parseInt(tEncFreq.value);
    this.turnData.travel.rollTarget = parseInt(tRollTarget.value);

    this.turnData.dungeon.eTables = encTables;
    this.turnData.dungeon.rollEnc = dEncRoll.checked;
    this.turnData.dungeon.rollReact = dReactRoll.checked;
    this.turnData.dungeon.rTable = dReactTable.value;
    this.turnData.dungeon.proc = parseInt(dEncFreq.value);
    this.turnData.dungeon.rollTarget = parseInt(dRollTarget.value);
    this.turnData.dungeon.lvl = parseInt(dungeonLvl.value);

    await game.settings.set('osr-helper', 'turnData', this.turnData);
    this.hideSaveBtn(saveSettings);
  }
  // animation
  updateAnimation(frame, html) {
    const frames = [...html.find('.sprite')];
    frames.map((i) => i.classList.add('hidden'));

    let lastIdx = frame - 1 == 0 ? 5 : frame - 1;
    let curFrame = frames.find((f) => f.id === `bg-${frame}`);
    let lastFrame = frames.find((j) => j.id === `bg-${lastIdx}`);

    lastFrame?.classList?.add('hidden');
    curFrame?.classList?.remove('hidden');
  }
  handleRestAnimation(frame, html) {
    const restFrame = html.find(`#bg-0`)[0];
    const lastFrame = html.find(`#bg-${frame}`)[0];
    const coords = [
      [0, 55],
      [150, 5],
      [260, 100],
      [100, 210],
      [0, 140]
    ];
    restFrame.style.top = `${coords[frame - 1][0]}px` || coords[0][0];
    restFrame.style.left = `${coords[frame - 1][1]}px` || coords[0][1];
    restFrame.classList.remove('hidden');
    lastFrame.classList.add('hidden');
  }
  // travel turn
  getBaseRate(partyObj) {
    let slowest;
    if (partyObj.party.length) {
      slowest = partyObj.party[0].system.movement.base;
      partyObj.party.forEach((a) => {
        let rate = a.system.movement.base;
        
        if (slowest > rate) slowest = rate;
      });
    }
    
    return Math.floor(slowest / 5);
  }
  partyData(actorObj, mod = 1) {
    let data = [];
    for (let actor of actorObj) {
      data.push({
        name: actor.name.length >= 35 ? actor.name.slice(0, 30) + `...` : actor.name,
        distance: Math.floor((actor.system.movement.base / 5) * mod),
        img: actor.img
        // controlled: actor.ownership[game.user.id] >= 3,
      });
    }
    return data;
  }
  async lostRoll(html) {
    const terrain = html.find(`#terrain`)[0].value;
    const bonus = html.find(`#nav-bonus`)[0];
    const gm = game.users.contents.filter((u) => u.role == 4).map((u) => u.id);
    if (terrain == 'road' || terrain == 'trail') {
      ui.notifications.warn('Cannot get lost on roads or trails');
      return;
    }
    let roll = await new Roll(`1d6 + ${bonus.value}`).evaluate({ async: true });
    let target = this.lostMod[terrain] || 2;

    if (roll.total <= target) {
      let data = {
        whisper: [game.user],
        flavor: `
        <h3>Navigation Check: ${terrain}</h3>
        <span style="color: red">The party got lost.</span>`
      };
      await game?.dice3d?.showForRoll(roll, game.user, false, gm, false);
      ChatMessage.create(data);
    } else {
      let data = {
        whisper: [game.user],
        flavor: `
        <h3>Navigation Check: ${terrain}</h3>
        The party found their way.
        `
      };
      await game?.dice3d?.showForRoll(roll, game.user, false, gm, false);
      ChatMessage.create(data);
    }

    bonus.value = 0;
  }
  async forageCheck(html) {
    const modEl = html.find('#forage-bonus')[0];
    const mod = parseInt(modEl.value);
    const terrain = html.find(`#terrain`)[0].value;
    const gm = game.users.contents.filter((u) => u.role == 4).map((u) => u.id);
    let roll = await new Roll(`1d6 + ${mod}`).roll({ async: true });
    if (roll.total <= 3) {
      let cData = {
        user: game.user.id,
        whisper: gm,
        roll: roll,
        flavor: `
        <h3>Forage check: ${terrain}</h3>
        <div><span style="color: red"><b>Foraging unsuccessful.</b></span></div>
        `
      };
      await game?.dice3d?.showForRoll(roll, game.user, false, gm, false);
      ChatMessage.create(cData);
    } else {
      let cData = {
        user: game.user.id,
        whisper: gm,
        roll: roll,
        flavor: `
        <h3>Forage check: ${terrain}</h3>
        <div><span style="color: green"><b>Foraging successful.</b></span></div>
        `
      };
      await game?.dice3d?.showForRoll(roll, game.user, false, gm, false);
      ChatMessage.create(cData);
    }
    modEl.value = 0;
  }
  async updatePartyDist(html, mod) {
    const rateEl = html.find('#base-travel-rate')[0];
    const charEl = html.find('#character-list')[0];
    const retEl = html.find('#retainer-list')[0];
    const upData = await this.getTravelData(mod);

    rateEl.innerText = `${upData.baseRate} mi`;
    charEl.innerHTML = upData.html.characters;
    retEl.innerHTML = upData.html.retainers;
  }
  async getTravelData(mod) {
    const partyObj = OSRH.util.getPartyActors();
    let slowest = this.getBaseRate(partyObj);
    //convert to miles
    const convertedRate = Math.floor(slowest * mod);
    let retData = {
      baseRate: convertedRate,
      data: {
        characters: this.partyData(partyObj.characters, mod),
        retainers: this.partyData(partyObj.retainers, mod)
      },
      html: {}
    };
    retData.html.characters = await renderTemplate('modules/osr-helper/templates/travel-turn-actor-list.hbs', {
      header: 'Characters',
      actors: retData.data.characters
    });
    retData.html.retainers = await renderTemplate('modules/osr-helper/templates/travel-turn-actor-list.hbs', {
      header: 'Retainers',
      actors: retData.data.retainers
    });
    return retData;
  }
}
export function registerTravelConstants() {
  OSRH.CONST.terrainMod = {
    trail: 1.5,
    road: 1.5,
    clear: 1,
    city: 1,
    grassland: 1,
    forest: 0.6,
    mud: 0.6,
    snow: 0.6,
    hill: 0.6,
    desert: 0.6,
    brokenLand: 0.6,
    mountain: 0.5,
    swamp: 0.5,
    jungle: 0.5,
    ice: 0.5,
    glacier: 0.5
  };
  OSRH.CONST.lostMod = {
    grassland: 1,
    clear: 1,
    swamp: 3,
    jungle: 3,
    desert: 3,
    allElse: 2
  };
}
