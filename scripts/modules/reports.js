export const registerReports = () => {
  OSRH.report = OSRH.report || {};

  OSRH.report.actorItem = async function (actor = null) {
    let turnData = game.settings.get('osr-helper', 'turnData');
    if (!actor) {
      if (OSRH.util.singleSelected()) {
        actor = canvas.tokens.controlled[0].actor;
      } else {
        return;
      }
    }
    const systemData = OSRH.systemData;
    const lightItems = OSRH.util.getOSRHItems(actor, 'light');
    const rationItems = OSRH.util.getOSRHItems(actor, 'ration');
    let totalRations = 0;

    const msgData = {
      food: '',
      light: ''
    };

    for (let ration of rationItems) {
      let rationData = ration.getFlag('osr-helper', 'rationData') ?? OSRH.data.defaultRationSettings;
      let expText =
        turnData?.global?.trackRationExp && rationData?.duration
          ? `<div>- ${game.i18n.localize('OSRH.report.expires')}: ${OSRH.util.convertTime(rationData.duration.value, rationData.duration.type)} ${rationData.duration.type}</div> `
          : '';

      const rationQty = OSRH.util.parseQuantity(OSRH.util.getNestedValue(ration, systemData.paths.itemQty));
      totalRations += rationQty;
      let style = 'color: green';
      if (rationQty <= 2) style = 'color: orangered';
      if (rationQty <= 1) style = 'color: red';
      msgData.food += `<div>${ration.name}: <span style="${style}">${rationQty}</span></div>${expText}`;
    }

    for (let light of lightItems) {
      if (light) {
        const lightQty = OSRH.util.parseQuantity(OSRH.util.getNestedValue(light, systemData.paths.itemQty));
        let style = 'color: green';
        if (lightQty <= 2) style = 'color: orangered';
        if (lightQty <= 1) style = 'color: red';
        msgData.light += `<div>${light.name}: <span style="${style}">${lightQty}</span></div>`;
      }
    }
    let ratStyle = 'color: green;';
    if (totalRations <= 3) ratStyle = 'color: orangeRed;';
    if (totalRations <= 1) ratStyle = 'color: red;';

    const rationText =
      totalRations <= 0
        ? `<ul><li><span style="color: red;">${game.i18n.localize('OSRH.report.none')}</span></li></ul>`
        : msgData.food;
    const lightText =
      msgData.light == ''
        ? `<ul><li><span style="color: red;">${game.i18n.localize('OSRH.report.none')}</span></li></ul>`
        : msgData.light;
    let contents = `
    <div class="osrh-report-msg">
      <details>
      <summary><strong>${game.i18n.localize('OSRH.report.suppliesReport')}</strong></summary>
      <br>
      <div>
        <br>
        <div style="${ratStyle}">${game.i18n.localize('OSRH.report.daysRations')}: ${totalRations}</div>
        <br>
        <h3>${game.i18n.localize('OSRH.report.charRations')}:</h3>
        <div>
          ${rationText}
        </div>
        <h3>${game.i18n.localize('OSRH.report.charLightSource')}:</h3>
        <div>
          ${lightText}
        </div>
      </div>
      </details>
    </div>
    `;
    ChatMessage.create({ content: contents, whisper: [game.user.id] });
  };

  OSRH.report.ration = async function () {
    let actorObj = OSRH.util.getPartyActors();
    let turnData = game.settings.get('osr-helper', 'turnData');
    const systemData = OSRH.systemData;
    let totalRations = 0;

    const msgData = {
      characters: '',
      retainers: ''
    };
    const style = (qty) => {
      return qty <= 1 ? 'color: red' : qty <= 2 ? 'color: orangered' : 'color: green';
    };

    for (let partyMember of actorObj.party) {
      let type = partyMember?.system?.retainer?.enabled ? 'retainers' : 'characters';
      let actorRations = '';
      let rationItems = OSRH.util.getOSRHItems(partyMember, 'ration');

      for (let ration of rationItems) {
        let rationData = ration.getFlag('osr-helper', 'rationData') ?? OSRH.data.defaultRationSettings;
        let expText =
          turnData?.global?.trackRationExp && rationData?.duration
            ? `<div>${game.i18n.localize('OSRH.report.expires')}: ${OSRH.util.convertTime(rationData.duration.value, rationData.duration.type)} ${rationData.duration.type}</div> `
            : '';
        const qty = OSRH.util.parseQuantity(OSRH.util.getNestedValue(ration, systemData.paths.itemQty));
        const rStyle = style(qty);
        totalRations += qty;
        actorRations += `
          <li style="margin-left:10px;"><div style="${rStyle}">${ration.name}: ${qty} </div>${expText}</li>
          `;
      }

      if (actorRations == '') actorRations = '<span style="color: red">None</span>';

      msgData[type] += `<div style="margin-left: 10px;"><p><b> ${partyMember.name}</b>:</p><ul> ${actorRations} </ul></div>`;
    }
    const daysLeft = actorObj.party.length ? Math.floor(totalRations / actorObj.party.length) : 0;
    let contents = `
    <div class="osrh-report-msg">
  <details>
    <summary><strong>${game.i18n.localize('OSRH.report.rationReport')}</strong></summary>
    <br>
    <div style="border-bottom: 2px solid black; padding-bottom: 10px;"><b>${game.i18n.localize('OSRH.report.totaldaysleft')}</b>: <span style="padding-left: 10px; ${style(
      daysLeft
    )}"><b>${daysLeft}</b></span></div>
    <br>
    <h3><b>${game.i18n.localize('OSRH.report.charRations')}</b></h3>
    <div>
      ${msgData.characters} 
    </div>
    <h3><b>${game.i18n.localize('OSRH.report.retainerRations')}</b></h3>
    <div>
      ${msgData.retainers}
    </div>
  </details>
    </div>
    `;
    ChatMessage.create({ content: contents, whisper: [game.user.id] });
  };

  OSRH.report.travelCalc = function () {
    new OSRH.V2.travelCalc().render({ force: true });
  };
};
