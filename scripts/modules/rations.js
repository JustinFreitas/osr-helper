import { isRationItem, parseQuantity } from '../lib/pure-helpers.mjs';

export const registerRations = () => {
  OSRH.ration = OSRH.ration || {};

  OSRH.ration.eat = async function (actorId = null) {
    const tags = OSRH.systemData?.tags;
    const qPath = OSRH.systemData.paths.itemQty;
    let actor;
    if (actorId) {
      actor = game.actors.get(actorId);
    } else if (OSRH.util.singleSelected()) {
      actor = canvas.tokens.controlled[0].actor;
    }
    if (!actor) {
      ui.notifications.error(game.i18n.localize('OSRH.util.notification.singleToken'));
      return;
    }

    let rationOptions = '';
    actor.items.forEach((i) => {
      if (isRationItem(i, tags)) {
        rationOptions += `<option value="${i.id}">${i.name}: ${OSRH.util.getNestedValue(i, qPath)}</option>`;
      }
    });

    if (!rationOptions) {
      ui.notifications.warn(game.i18n.localize('OSRH.report.none'));
      return;
    }

    let dialogTemplate = `
    <h1> ${game.i18n.localize('OSRH.ration.pickType')}</h1>
    <div style="display:flex">
    <div style="flex:1"><select id="ration">${rationOptions}</select></div>
    </div>`;
    new foundry.applications.api.DialogV2({
      window: { title: game.i18n.localize('OSRH.ration.eatRation') },
      classes: ['ose', 'dialog', 'ration-dialog'],
      position: { width: 400, height: 'auto' },
      content: dialogTemplate,
      buttons: [
        {
          action: 'eat',
          label: game.i18n.localize('OSRH.ration.eatRation'),
          callback: async function (ev, btn, obj) {
            const selectedVal = obj.element.querySelector('#ration')?.value;
            let item = actor.items.get(selectedVal) ?? actor.items.getName(selectedVal);
            if (!item) return;
            let rawQty = OSRH.util.getNestedValue(item, qPath);
            let itemQty = parseQuantity(rawQty) - 1;
            if (itemQty <= 0) {
              await item.delete();
            } else {
              await item.update({ [qPath]: itemQty });
            }
          }
        }
      ]
    }).render({ force: true });
  };

  OSRH.ration.handlePartyRations = async function (dur, durType) {
    let sec = Math.floor(dur * OSRH.CONST.timeInc[durType]);
    const party = OSRH.util.getPartyActors()?.party;
    let partyRations = [];
    if (party) {
      for (let p of party) {
        partyRations = partyRations.concat(OSRH.util.getOSRHItems(p, 'ration'));
      }
    }
    if (partyRations.length) {
      await Promise.all(
        partyRations.map(async (r) => {
          let rawFlag = await r.getFlag('osr-helper', 'rationData');
          if (!rawFlag) {
            return;
          }
          let data = foundry.utils.deepClone(rawFlag);
          if (data.trackExpiration && data.duration) {
            let newDur = data.duration.value - sec;
            if (newDur <= 0) {
              const itemName = r.name;
              data.duration.value = 0;
              data.trackExpiration = false;

              await r.setFlag('osr-helper', 'rationData', data);
              await r.update({ name: `${itemName} - Expired` });
            } else {
              data.duration.value = newDur;
              await r.setFlag('osr-helper', 'rationData', data);
            }
          }
        })
      );
    }
  };
};
