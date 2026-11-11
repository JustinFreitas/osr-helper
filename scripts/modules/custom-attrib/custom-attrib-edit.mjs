import { OSRHApp } from '../v2/base/osr-app.mjs';

export class CustomAttributeEdit extends OSRHApp {
  constructor(attrib, actorId, managerCoord = false) {
    const isOptionsObj = attrib && typeof attrib === 'object' && 'attrib' in attrib;
    const resolvedAttrib = isOptionsObj ? attrib.attrib : attrib;
    const resolvedActorId = isOptionsObj ? attrib.actorId : actorId;
    const resolvedCoord = isOptionsObj ? (attrib.managerCoord ?? false) : managerCoord;
    super(isOptionsObj ? attrib : {});
    this.attrib = resolvedAttrib ?? { id: foundry.utils?.randomID?.() ?? '', name: '', abbr: '', value: 0, items: [] };
    if (!Array.isArray(this.attrib.items)) this.attrib.items = [];
    this.actorId = resolvedActorId;
    this.managerCoord = resolvedCoord;
  }

  static DEFAULT_OPTIONS = {
    id: 'OSRHAttributeConfig',
    position: {
      width: 350,
      height: 165,
      top: 120,
      left: 60
    },
    classes: ['app', 'osrh', 'attribute-config', 'v2'],
    tag: 'osrh-app',
    window: {
      icon: 'fas fa-gear',
      title: 'OSRH.attribConfig.title'
    },
    dragDrop: [
      {
        dragSelector: '.item',
        dropSelector: '.items'
      }
    ],
    actions: {}
  };

  static PARTS = {
    main: {
      template: 'modules/osr-helper/templates/custom-attribute/attribute-config-form.hbs'
    }
  };

  async _prepareContext(options) {
    let context = await super._prepareContext(options);
    const items = [];
    for (let item of this.attrib.items) {
      const obj = await fromUuid(item.uuid);
      if (obj) items.push(obj);
    }
    context.name = this.attrib.name;
    context.abbr = this.attrib.abbr;
    context.items = items;
    context.noItems = items.length === 0;
    return context;
  }

  _onRender(context, options) {
    this.dragDrop.forEach((d) => d.bind(this.element));
    const html = this.element;
    const deleteItemBtns = [...html.querySelectorAll('.delete-item')];
    const abbrInp = html.querySelector('#abbreviation');
    const attribNameInp = html.querySelector('#attrib-name');
    const saveBtn = html.querySelector('#save-btn');

    deleteItemBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const atribEl = e.target.closest('.atrib-item');
        const uuid = atribEl?.id;
        let newList = this.attrib.items.filter((i) => i.uuid != uuid);
        if (newList.length == 1 && newList[0].uuid === uuid) newList = [];
        this.attrib.items = newList;
        this.render({ force: true });
      });
    });

    abbrInp?.addEventListener('change', (e) => {
      e.preventDefault();
      this.attrib.abbr = abbrInp.value.trim().slice(0, 3).toUpperCase();
      abbrInp.value = this.attrib.abbr;
      if (this.attrib.abbr.length !== 3) {
        ui.notifications.warn(game.i18n.localize('OSRH.util.notification.abbrLengthWarn'));
      }
    });

    attribNameInp?.addEventListener('change', (e) => {
      e.preventDefault();
      this.attrib.name = attribNameInp.value.trim();
    });

    saveBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      if (abbrInp) this.attrib.abbr = abbrInp.value.trim().slice(0, 3).toUpperCase();
      if (attribNameInp) this.attrib.name = attribNameInp.value.trim();
      await this._saveAttribute();
    });
  }

  async _onDrop(event) {
    const dragData =
      parseInt(game.version, 10) < 13
        ? TextEditor.getDragEventData(event)
        : foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (dragData?.type != 'Item' || !dragData.uuid) {
      return;
    }
    const item = await fromUuid(dragData.uuid);
    const parentId = item?.parent?.id ?? item?.parent?._id;
    if (
      !item ||
      parentId !== this.actorId ||
      item.type != 'ability' ||
      !item.system?.roll ||
      !item.system.roll.includes('d')
    ) {
      ui.notifications.warn(game.i18n.localize('OSRH.util.notification.itemAbilDropWarn'));
      return;
    }
    const exists = this.attrib.items.find((i) => i.uuid == dragData.uuid);
    if (!exists) {
      this.attrib.items.push({ uuid: dragData.uuid, id: item.id ?? item._id });
      this.render({ force: true });
    }
  }

  async _saveAttribute() {
    const actor = await game.actors.get(this.actorId);
    if (!actor) return;
    let flagData = foundry.utils.deepClone(actor.flags?.[OSRH.moduleName]?.customAttributes) || [];
    const existing = flagData.find((i) => i.id === this.attrib.id);
    if (!this.attrib.name?.length) {
      ui.notifications.warn(game.i18n.localize('OSRH.util.notification.invalidAttribName'));
      return;
    }
    if (this.attrib.abbr?.length !== 3) {
      ui.notifications.warn(game.i18n.localize('OSRH.util.notification.abbrLengthWarn'));
      return;
    }
    if (existing) {
      existing.name = this.attrib.name;
      existing.abbr = this.attrib.abbr;
      existing.items = this.attrib.items;
    } else {
      flagData.push(this.attrib);
    }
    await actor.setFlag(OSRH.moduleName, 'customAttributes', flagData);
    if (actor.sheet?.rendered) {
      actor.sheet.render({ force: true });
    }
    const pos = this.managerCoord
      ? { top: this.managerCoord.top, left: this.managerCoord.left }
      : { top: this.position.top, left: this.position.left };
    new OSRH.ManageCustomAttributes(actor).render({ force: true, position: pos });
    this.close();
  }

  _validateAttribData() {
    if (!this.attrib?.name || this.attrib.name.length < 1) return false;
    if (!this.attrib?.abbr || this.attrib.abbr.length !== 3) return false;
    return true;
  }

  async _showAttribBar() {
    return await game.settings.get(`${OSRH.moduleName}`, 'displaycustomAttrib');
  }
}
