export const registerLightModule = async function () {
  OSRH.light.lightToggle = async function (uuid = null, tokenId) {
    if (!uuid) {
      if (OSRH.util.singleSelected()) {
        uuid = canvas.tokens.controlled[0]?.actor.uuid;
      } else {
        return;
      }
    }

    let actor = await fromUuid(uuid);
    actor = actor?.collectionName === 'tokens' ? actor.actor : actor;
    if (!actor) return;

    let lightItems = await OSRH.light.getLightItems(actor.id);
    const lightData = foundry.utils.deepClone(await game.settings.get(`${OSRH.moduleName}`, 'lightData'));
    let actorLightData = lightData[actor.id];

    // check for light already lit
    if (actorLightData?.lightLit) {
      let activeLight = actorLightData.lights.find((i) => i.isOn);
      if (activeLight) {
        activeLight.isOn = false;
        actorLightData.lightLit = false;
        let elapsed = game.time.worldTime - activeLight.start;
        if (activeLight.duration === 'inf') {
          actorLightData.lights = actorLightData.lights.filter((i) => i.id != activeLight.id);
        } else {
          activeLight.duration = Math.max(0, activeLight.duration - elapsed);
        }
        await OSRH.socket.executeAsGM('setting', 'lightData', lightData, 'set');
        await OSRH.light.updateTokens(actor.uuid, {
          dim: 0,
          bright: 0,
          color: activeLight.color ?? activeLight.data?.color,
          alpha: activeLight.alpha ?? activeLight.data?.alpha
        });
      }
      return;
    }

    // get path to quantity value
    let qtyPath = OSRH.systemData?.paths?.itemQty;
    let lightOptions = '';
    for (let light of lightItems ?? []) {
      let qty = OSRH.util.getNestedValue(light, qtyPath);
      lightOptions += `<option value="${light.id}">${light.name}: ${qty}</option>`;
    }
    if (lightOptions == '') {
      ui.notifications.error('No Light Items Found');
      return;
    }
    let dialogTemplate = `
    <h1> Pick a Light Type </h1>
    <div style="display:flex">
      <div style="flex:1"><select id="lightType">${lightOptions}</select></div>
    </div>`;

    new foundry.applications.api.DialogV2({
      window: { title: 'Light on' },
      classes: ['ose', 'dialog', 'light-dialog'],
      position: { width: 400, height: 'auto' },
      content: dialogTemplate,
      buttons: [
        {
          action: 'lightOn',
          label: 'Light On',
          callback: async (ev, btn, obj) => {
            const itemID = obj.element.querySelector('#lightType')?.value;
            const item = actor.items.get(itemID);
            if (!item) return;
            const lightItemData =
              item.getFlag(`${OSRH.moduleName}`, 'lightItemData') ??
              foundry.utils.deepClone(OSRH.data.defaultLightSettings);
            //if no actorId found, create actor id and light type
            if (!actorLightData) {
              lightData[actor.id] = {
                lightLit: true,
                id: actor.id,
                uuid: actor.uuid,
                lights: [
                  {
                    id: foundry.utils.randomID(16),
                    name: item.name,
                    actorId: actor.id,
                    itemId: item.id,
                    tokenId: tokenId,
                    isOn: true,
                    warned: false,
                    start: game.time.worldTime,
                    duration: lightItemData.duration === 'inf' ? 'inf' : lightItemData.duration * 60,
                    data: lightItemData
                  }
                ]
              };
              actorLightData = lightData[actor.id];
              await OSRH.socket.executeAsGM('setting', 'lightData', lightData, 'set');
              await OSRH.socket.executeAsGM('updateTokens', actor.uuid, lightItemData);
              return;
            }

            if (!actorLightData.lightLit && actorLightData?.lights.find((i) => i.itemId == item.id)) {
              let itemObj = actorLightData.lights.find((i) => i.itemId == item.id);
              itemObj.isOn = true;
              actorLightData.lightLit = true;
              itemObj.start = game.time.worldTime;
              await OSRH.socket.executeAsGM('setting', 'lightData', lightData, 'set');
              await OSRH.socket.executeAsGM('updateTokens', actor.uuid, lightItemData);
              return;
            }

            if (!actorLightData?.lights.find((i) => i.itemId == item.id)) {
              actorLightData.lightLit = true;
              actorLightData.lights.push({
                id: foundry.utils.randomID(16),
                name: item.name,
                actorId: actor.id,
                itemId: item.id,
                tokenId: tokenId,
                isOn: true,
                warned: false,
                start: game.time.worldTime,
                duration: lightItemData.duration === 'inf' ? 'inf' : lightItemData.duration * 60,
                data: lightItemData
              });
              await OSRH.socket.executeAsGM('setting', 'lightData', lightData, 'set');
              await OSRH.socket.executeAsGM('updateTokens', actor.uuid, lightItemData);
            }
          }
        }
      ]
    }).render({ force: true });
  };

  OSRH.light.lightCheck = async function () {
    let lightData = foundry.utils.deepClone(await game.settings.get(`${OSRH.moduleName}`, 'lightData'));
    let curTime = game.time.worldTime;
    for (let actorId in lightData) {
      let dataObj = lightData[actorId];
      if (!dataObj?.lights) continue;
      let lights = dataObj.lights.filter((i) => i.isOn);
      for (let light of lights) {
        let { start, duration, data } = light;
        if (duration === 'inf' || !data) {
          continue;
        }
        start = curTime < start ? curTime : start;
        let elapsed = curTime - start;
        const remaining = duration - elapsed;
        const warnThreshold = 600 * (data.warn ?? 3);
        if (remaining > 0 && remaining <= warnThreshold && !light.warned) {
          light.warned = true;
          let lData = {
            dim: data.dim * 0.7,
            bright: data.bright,
            color: data.color,
            alpha: data.alpha,
            animation: data.animation,
            bgCont: data.bgCont,
            bgSat: data.bgSat,
            bgShadow: data.bgShadow,
            coloration: data.coloration,
            intensity: data.intensity,
            luminosity: data.luminosity,
            speed: data.speed
          };
          await OSRH.light.updateTokens(dataObj.uuid, lData);
        }
        if (elapsed >= duration) {
          dataObj.lightLit = false;
          dataObj.lights = dataObj.lights.filter((i) => i.id != light.id);
          let lData = {
            dim: 0,
            bright: 0,
            color: data.color,
            alpha: data.alpha,
            animation: data.animation,
            bgCont: data.bgCont,
            bgSat: data.bgSat,
            bgShadow: data.bgShadow,
            coloration: data.coloration,
            intensity: data.intensity,
            luminosity: data.luminosity,
            speed: data.speed
          };
          await OSRH.light.updateTokens(dataObj.uuid, lData);
          await OSRH.light.decrementLightItem(dataObj.uuid, light.itemId);
          if (!dataObj.lights.length) delete lightData[actorId];
        }
      }
    }
    await game.settings.set(`${OSRH.moduleName}`, 'lightData', lightData);
  };

  OSRH.light.decrementLightItem = async function (uuid, itemId) {
    let actor = await fromUuid(uuid);
    let qtyPath = OSRH.systemData.paths.itemQty;
    actor = actor?.collectionName === 'tokens' ? actor.actor : actor;
    let item = actor?.items?.get(itemId);
    if (!item) return;
    let itemQty = OSRH.util.parseQuantity(OSRH.util.getNestedValue(item, qtyPath));
    if (itemQty > 1) {
      itemQty = itemQty - 1;
      await item.update({ [qtyPath]: itemQty });
    } else {
      await actor.deleteEmbeddedDocuments('Item', [itemId]);
    }
  };

  OSRH.light.updateTokens = async function (uuid, lightData) {
    for (let s of game.scenes) {
      if (s.tokens.size) {
        for (let t of s.tokens) {
          if (t.actor && t.actor.uuid == uuid) {
            let data = {
              light: {
                bright: lightData.bright,
                dim: lightData.dim,
                angle: lightData.angle ? lightData.angle : 360,
                color: lightData.color,
                alpha: lightData.alpha,
                gradual: true,
                animation: {
                  type: lightData.animation === null ? null : (lightData.animation || 'flame'),
                  speed: lightData.speed,
                  intensity: lightData.intensity
                },
                coloration: lightData.coloration,
                contrast: lightData.bgCont,
                luminosity: lightData.luminosity,
                attenuation: lightData.attenuation || 0.5,
                saturation: lightData.bgSat ?? lightData.saturation ?? 0,
                shadows: lightData.bgShadow
              }
            };
            await t.update(data);
          }
        }
      }
    }
  };

  OSRH.light.turnsRemaining = async function (actorId) {
    if (!actorId) {
      if (OSRH.util.singleSelected()) {
        actorId = canvas.tokens.controlled[0]?.actor.id;
      } else {
        return;
      }
    }
    const allLightData = await game.settings.get(`${OSRH.moduleName}`, 'lightData');
    let lightData = allLightData?.[actorId]?.lights?.filter((i) => i.isOn)?.[0];
    if (lightData) {
      let elapsed = game.time.worldTime - lightData.start;
      let tRem;
      let color;
      let turn;
      if (lightData.duration == 'inf') {
        tRem = game.i18n.localize('OSRH.effect.infinite');
        color = 'green';
        turn = game.i18n.localize('OSRH.light.chat.turns');
      } else {
        let warnVal = lightData.data.warn <= 0 ? lightData.data.alert + 2 : lightData.data.warn;
        let remaining = lightData.duration - elapsed;
        tRem = Math.floor(remaining / 600);
        color = tRem <= lightData.data.alert ? 'red' : tRem <= warnVal ? 'orangeRed' : 'green';
        turn = tRem == 1 ? game.i18n.localize('OSRH.light.chat.turn') : game.i18n.localize('OSRH.light.chat.turns');
      }
      let chatData = {
        content: `<div class="osrh-report-msg"><h3>${lightData.name} ${game.i18n.localize('OSRH.light.chat.turnsLeft')}</h3>
      <p style="color: ${color}">${game.i18n.localize('OSRH.light.chat.the')} ${lightData.name} ${game.i18n.localize('OSRH.light.chat.has')} ${tRem} ${turn} ${game.i18n.localize('OSRH.light.chat.remaining')}</p></div>`,
        whisper: [game.user.id]
      };
      ChatMessage.create(chatData);
      return;
    }

    ui.notifications.warn(game.i18n.localize('OSRH.util.notification.noLightLit'));
  };

  OSRH.light.osrLightOff = async function (actorId) {
    const data = {
      brightLight: 0,
      dimLight: 0,
      lightAlpha: 0.5
    };
    OSRH.util.updateTokens(actorId, data);
  };

  OSRH.light.getLightItems = async function (actorId) {
    let actor = game.actors.get(actorId);
    if (actor && !actor.prototypeToken?.actorLink && canvas.tokens?.controlled?.[0]?.document?.actor) {
      actor = canvas.tokens.controlled[0].document.actor;
    }
    if (!actor) {
      return [];
    }
    return OSRH.util.getOSRHItems(actor, 'light');
  };
};
