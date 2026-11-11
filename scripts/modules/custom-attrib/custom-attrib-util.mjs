export function addSheetUi(sheetEl) {
  const exists = sheetEl.querySelector('#osrh-sheet-ui-cont');
  if (!exists) {
    const uiEl = document.createElement('div');
    uiEl.id = 'osrh-sheet-ui-cont';
    uiEl.classList.add('osrh-sheet-ui-cont');
    sheetEl.prepend(uiEl);
    return uiEl;
  }
  return 'skip';
}

export async function addcustomAttribElement(sheetEl, actor) {
  const actorId = actor?.id ?? actor?._id;
  const actorDoc = (actorId && game.actors?.get?.(actorId)) || actor;
  const isOwner = Boolean(actor?.owner || actor?.isOwner || actorDoc?.isOwner);
  if (!isOwner) return;

  const showBar = await game.settings.get(`${OSRH.moduleName}`, 'displaycustomAttrib');
  const customAttributes = actorDoc?.flags?.[OSRH.moduleName]?.customAttributes ?? actor?.flags?.[OSRH.moduleName]?.customAttributes;
  if (showBar && customAttributes?.length > 0) {
    const exists = sheetEl.querySelector('#osrh-custom-attrib-cont');
    if (exists) exists.remove();
    const uiEl = document.createElement('div');
    uiEl.id = 'osrh-custom-attrib-cont';
    uiEl.classList.add('osrh-custom-attrib-cont');

    for (let attrib of customAttributes) {
      const div = document.createElement('div');
      div.classList.add('attrib-cont');
      div.id = attrib.id;
      const label = document.createElement('div');
      label.classList.add('custom-attrib-label');
      label.innerText = attrib.abbr;
      label.title = attrib.name;
      div.appendChild(label);
      const inp = document.createElement('input');
      inp.classList.add('custom-attrib-input');
      inp.value = attrib.value;
      inp.id = attrib.id;
      inp.addEventListener('change', async (e) => {
        e.preventDefault();
        const id = e.target.closest('.attrib-cont')?.id;
        const actorObj = (actorId && game.actors?.get?.(actorId)) || actorDoc;
        if (!actorObj) return;
        const attributes = foundry.utils.deepClone(actorObj.flags?.[OSRH.moduleName]?.customAttributes ?? []);
        const targetAttrib = attributes.find((i) => i.id == id);
        if (targetAttrib) targetAttrib.value = parseInt(inp.value) || 0;
        await actorObj.setFlag(`${OSRH.moduleName}`, 'customAttributes', attributes);
        if (actorObj.sheet?.rendered) {
          actorObj.sheet.render({ force: true });
        }
      });
      div.appendChild(inp);
      uiEl.appendChild(div);
    }

    sheetEl.prepend(uiEl);
    return uiEl;
  }
}

export async function addAttribListeners(html, actorObj) {
  const actorId = actorObj?.id ?? actorObj?._id;
  const actorDoc = (actorId && game.actors?.get?.(actorId)) || actorObj;
  const data = actorDoc?.flags?.[OSRH.moduleName]?.customAttributes ?? actorObj?.flags?.[OSRH.moduleName]?.customAttributes;
  const htmlEl = html instanceof HTMLElement ? html : html?.[0];
  const containerEl = htmlEl?.querySelector?.('div[data-tab="abilities"]') ?? htmlEl;
  if (data && containerEl) {
    for (let attrib of data) {
      (attrib?.items ?? []).forEach((i) => {
        const el = containerEl.querySelector(`li[data-item-id="${i.id}"] .item-image`);
        el?.addEventListener('click', (e) => {
          e.preventDefault();
          decrementAttribute(actorId, attrib.id);
        });
      });
    }
  }
}

export async function decrementAttribute(actorId, attribId) {
  const actor = game.actors.get(actorId);
  if (!actor) return;
  const flag = foundry.utils.deepClone(actor.flags?.[OSRH.moduleName]?.customAttributes ?? []);
  const attribute = flag.find((i) => i.id == attribId);
  if (!attribute || !(attribute.value >= 1)) {
    ui.notifications.warn(`${attribute?.name ?? ''} ${game.i18n.localize('OSRH.util.notification.hasNoCharges')}`.trim());
    return;
  }
  attribute.value -= 1;
  if (attribute.value < 0) attribute.value = 0;
  await actor.setFlag(OSRH.moduleName, 'customAttributes', flag);
  if (actor.sheet?.rendered) {
    actor.sheet.render({ force: true });
  }
}
