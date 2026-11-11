function itemHasTag(item, tagName) {
  const tags = item?.system?.tags;
  if (!Array.isArray(tags)) return false;
  const target = tagName.toLowerCase();
  return tags.some((t) => {
    if (typeof t === 'string') return t.toLowerCase() === target;
    return t?.value?.toLowerCase() === target || t?.title?.toLowerCase() === target;
  });
}

export async function tagMigration() {
  const migrated = await game.settings.get('osr-helper', 'migrationItemTags');
  if (OSRH.systemData.tags && !migrated) {
    for (const item of game.items) {
      await handleTag(item);
      await ratTagOp(item);
    }
    for (const scene of game.scenes) {
      for (const token of scene.tokens) {
        if (token.actorLink) continue;
        const actor = token.actor;
        if (!actor?.items) continue;
        for (const item of actor.items) {
          await handleTag(item);
          await ratTagOp(item);
        }
      }
    }
    for (const actor of game.actors) {
      for (const item of actor.items) {
        await handleTag(item);
        await ratTagOp(item);
      }
    }
    await game.settings.set('osr-helper', 'migrationItemTags', true);
  }
}

async function handleTag(item) {
  if (itemHasTag(item, 'light')) {
    if (!item.getFlag('osr-helper', 'itemType')) {
      await item.setFlag('osr-helper', 'itemType', 'light');
    }
  } else if (itemHasTag(item, 'ration')) {
    if (!item.getFlag('osr-helper', 'itemType')) {
      await item.setFlag('osr-helper', 'itemType', 'ration');
    }
  }
}

async function ratTagOp(item) {
  if (itemHasTag(item, 'ration')) {
    const itemType = item.getFlag('osr-helper', 'itemType');
    if (!itemType) {
      await item.setFlag('osr-helper', 'itemType', 'ration');
    }
    if (!item.flags?.['osr-helper']?.rationData) {
      const defaults = foundry.utils.deepClone(OSRH.data.defaultRationSettings);
      const data = foundry.utils.mergeObject(defaults, { name: item.name });
      await item.setFlag('osr-helper', 'rationData', data);
    }
  }
}
