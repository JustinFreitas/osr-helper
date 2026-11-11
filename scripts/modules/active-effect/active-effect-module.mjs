export function registerOsrActiveEffectModule() {
  OSRH.effect.app = OSRH.V2?.effectsApp;

  OSRH.effect.renderEffectApp = (actor, displayAll = false) => {
    let open = fxOpen();
    if (open) {
      open.actor = actor ?? null;
      open.displayAll = displayAll;
      open.render({ force: true });
    } else {
      new OSRH.V2.effectsApp({ actor, displayAll }).render({ force: true });
    }
  };

  OSRH.effect.handleEffectPreset = async (type, data) => {
    const presets = foundry.utils.deepClone(await game.settings.get('osr-helper', 'effectPresets'));
    if (type == 'add') {
      presets.push(data);
      await game.settings.set('osr-helper', 'effectPresets', presets);
    }
    if (type == 'delete') {
      let id = data;
      const newPresets = presets.filter((i) => i.id !== id);
      await game.settings.set('osr-helper', 'effectPresets', newPresets);
    }
  };

  OSRH.effect.renderGlobalEffectApp = function () {
    if (game.user.isGM) {
      OSRH.effect.renderEffectApp(null, true);
    }
  };

  OSRH.effect.delete = async function (effectId) {
    let allEffects = foundry.utils.deepClone(await game.settings.get(`${OSRH.moduleName}`, 'effectData'));
    let effectData = allEffects.find((e) => e.effectId == effectId);
    if (effectData?.target) {
      let actor = await fromUuid(effectData.target);
      if (actor?.collectionName == 'tokens') actor = actor.actor;
      let effect = actor?.effects?.get?.(effectId);
      await effect?.delete();
    }
    let activeEffectData = allEffects.filter((e) => e.effectId != effectId);
    await game.settings.set(`${OSRH.moduleName}`, 'effectData', activeEffectData);
    OSRH.socket.executeForEveryone('refreshEffectLists');
  };

  OSRH.effect.housekeeping = async function () {
    let effectData = foundry.utils.deepClone(await game.settings.get(`${OSRH.moduleName}`, 'effectData'));

    for (let effect of effectData) {
      if (!effect?.isInf) {
        let actor = await fromUuid(effect.target);
        if (!actor) {
          console.log(
            `Actor not found for effect target '${effect?.target}' from effect name '${effect?.name}'.  Continuing with next effect.`
          );
          effectData = effectData.filter((e) => e.effectId != effect.effectId);
          continue;
        }

        if (actor.collectionName == 'tokens') actor = actor.actor;
        let activeEffect = await actor?.getEmbeddedDocument?.('ActiveEffect', effect.effectId);
        if (!activeEffect) {
          effectData = effectData.filter((e) => e.effectId != effect.effectId);
          continue;
        }
        if (activeEffect.duration.remaining <= 0) {
          effectData = effectData.filter((e) => e.effectId != activeEffect.id);
          await actor.deleteEmbeddedDocuments('ActiveEffect', [effect.effectId]);
        }
      }
    }
    await game.settings.set(`${OSRH.moduleName}`, 'effectData', effectData);
    OSRH.socket.executeForEveryone('refreshEffectLists');
  };

  OSRH.effect.gmCreateEffect = async function (target, effectData, creatorId) {
    let actor = await fromUuid(target);
    if (!actor) return false;
    let e = await ActiveEffect.create(effectData, { parent: actor });
    let activeEffectData = foundry.utils.deepClone(await game.settings.get(`${OSRH.moduleName}`, 'effectData'));
    activeEffectData.push({
      isInf: effectData.flags['data'].isInf,
      effectId: e.id,
      targetActor: actor,
      createdBy: creatorId,
      target: target
    });
    await game.settings.set(`${OSRH.moduleName}`, 'effectData', activeEffectData);
    OSRH.socket.executeForEveryone('refreshEffectLists');
    return true;
  };

  OSRH.effect.refreshEffectLists = async function () {
    const v2App = fxOpen();
    if (v2App) {
      v2App.render({ force: true });
    }
    let openLegacy = Object.values(ui?.windows ?? {}).filter((i) => i.id?.includes?.('OSRH-active-effect-app'));
    openLegacy.forEach((e) => {
      if (e !== v2App) e.render({ force: true });
    });
  };

  OSRH.effect.deleteAll = async function (type) {
    if (type === 'effects') {
      await game.settings.set('osr-helper', 'effectData', []);
    }
    if (type === 'presets') {
      await game.settings.set('osr-helper', 'effectPresets', []);
    }
  };
}

function fxOpen() {
  const byId = OSRH.util?.getApp?.('OSRH-active-effect-app');
  if (byId) return byId;
  const instances = foundry.applications?.instances;
  if (instances?.values) {
    for (const inst of instances.values()) {
      if (inst.options?.classes?.includes?.('osr-active-effects')) return inst;
    }
  }
  for (const win of Object.values(ui?.windows ?? {})) {
    if (win.options?.classes?.includes?.('osr-active-effects')) return win;
  }
  return false;
}
