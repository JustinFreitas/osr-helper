export async function migrateAmmoFlag() {
  const migrated = await game.settings.get('osr-helper', 'migrationAmmoFlags');
  if (migrated) return null;

  const ammoData = OSRH.data.ammoData;
  const list = [
    'Shortbow',
    'Longbow',
    'Crossbow',
    'Sling',
    'Matchlock blunderbuss',
    'Matchlock heavy musket',
    'Matchlock musket',
    'Matchlock pistol',
    'Wheellock blunderbuss',
    'Wheellock heavy musket',
    'Wheellock pistol',
    'Wheellock musket'
  ];
  const data = {
    weapItems: game.items.filter((i) => i.type === 'weapon' && list.includes(i.name)),
    sceneActorItems: [],
    actorItems: []
  };
  for (const actor of game.actors) {
    if (actor.type === 'character') {
      const aWeapons = actor.items.filter((i) => i.type == 'weapon' && list.includes(i.name));
      if (aWeapons.length) {
        data.actorItems.push({
          id: actor.id,
          name: actor.name,
          weapons: aWeapons
        });
        await Promise.all(
          aWeapons.map(async (i) => {
            const ammoType = ammoData.find((a) => a.name === i.name)?.ammoType;
            if (ammoType && !i.getFlag('osr-helper', 'ammunition')) {
              await i.setFlag('osr-helper', 'ammunition', {
                trackAmmo: true,
                items: [ammoType]
              });
            }
          })
        );
      }
    }
  }
  for (const scene of game.scenes) {
    const sData = {
      id: scene.id,
      name: scene.name,
      actors: []
    };
    const actors = [];
    for (const t of scene.tokens) {
      if (!t.actorLink && t.actor && t.actor.type === 'character') {
        actors.push(t.actor);
      }
    }
    for (const actor of actors) {
      const aWeapons = actor?.items?.filter((i) => i.type == 'weapon' && list.includes(i.name)) ?? [];
      if (aWeapons.length > 0) {
        sData.actors.push({
          id: actor.id,
          name: actor.name,
          weapons: aWeapons
        });
        await Promise.all(
          aWeapons.map(async (i) => {
            const ammoType = ammoData.find((a) => a.name === i.name)?.ammoType;
            if (ammoType && !i.getFlag('osr-helper', 'ammunition')) {
              await i.setFlag('osr-helper', 'ammunition', {
                trackAmmo: true,
                items: [ammoType]
              });
            }
          })
        );
      }
    }
    if (sData.actors.length > 0) {
      data.sceneActorItems.push(sData);
    }
  }
  await Promise.all(
    data.weapItems.map(async (i) => {
      const ammoType = ammoData.find((a) => a.name === i.name)?.ammoType;
      if (ammoType && !i.getFlag('osr-helper', 'ammunition')) {
        await i.setFlag('osr-helper', 'ammunition', {
          trackAmmo: true,
          items: [ammoType]
        });
      }
    })
  );
  await game.settings.set('osr-helper', 'migrationAmmoFlags', true);
  return data;
}
