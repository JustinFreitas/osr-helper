import { OSRHApp } from '../v2/base/osr-app.mjs';

export class ManageCustomAttributes extends OSRHApp {
  constructor(actorOrOptions, options = {}) {
    const isOptionsObj = actorOrOptions && typeof actorOrOptions === 'object' && 'actor' in actorOrOptions;
    const actor = isOptionsObj ? actorOrOptions.actor : actorOrOptions;
    const appOptions = isOptionsObj ? actorOrOptions : options;
    super(appOptions);
    this.actor = actor;
    this.attributes = actor?.flags?.[OSRH.moduleName]?.customAttributes ?? [];
  }

  static DEFAULT_OPTIONS = {
    id: 'OSRHManageAttributes',
    position: {
      width: 350,
      height: 165,
      top: 120,
      left: 60
    },
    classes: ['app', 'osrh', 'manage-attributes', 'v2'],
    tag: 'osrh-app',
    window: {
      icon: 'fas fa-gear',
      title: 'OSRH.manageAttributes.title'
    },
    dragDrop: [],
    actions: {}
  };

  static PARTS = {
    main: {
      template: 'modules/osr-helper/templates/custom-attribute/manage-attributes-form.hbs'
    }
  };

  async _prepareContext(options) {
    let context = await super._prepareContext(options);
    const actorId = this.actor?.id ?? this.actor?._id;
    const liveActor = (actorId && game.actors?.get?.(actorId)) || this.actor;
    if (liveActor) this.actor = liveActor;
    const attributes = this.actor?.flags?.[OSRH.moduleName]?.customAttributes ?? [];
    this.attributes = attributes;
    context.maxAttrib = attributes.length >= 6;
    context.attributes = attributes;
    context.hasAttrib = attributes.length > 0;
    return context;
  }

  _onRender(context, options) {
    const html = this.element;
    const nameEls = [...html.querySelectorAll('.name')];
    const addBtn = html.querySelector('.add-btn');
    const delBtns = [...html.querySelectorAll('.delete-btn')];
    const actorId = this.actor?.id ?? this.actor?._id;

    addBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.attributes?.length >= 6) return;
      const coord = { top: this.position.top, left: this.position.left };
      const blankAttrib = {
        id: foundry.utils.randomID(),
        name: '',
        abbr: '',
        value: 0,
        items: []
      };

      new OSRH.CustomAttributeEdit(blankAttrib, actorId, coord).render({
        force: true,
        position: coord
      });
      this.close();
    });

    nameEls.forEach((name) => {
      name.addEventListener('click', (e) => {
        e.preventDefault();
        const coord = { top: this.position.top, left: this.position.left };
        const attrib = (this.attributes ?? []).find((i) => i.id == e.target.dataset.id);
        if (!attrib) return;
        new OSRH.CustomAttributeEdit(foundry.utils.deepClone(attrib), actorId, coord).render({
          force: true,
          position: coord
        });
        this.close();
      });
    });

    delBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const coord = { top: this.position.top, left: this.position.left };
        const actor = game.actors?.get?.(actorId) ?? this.actor;
        if (!actor) return;
        const itemId = e.target.closest('.attrib-cont')?.dataset?.id;
        let newList = foundry.utils.deepClone(this.attributes ?? []).filter((i) => i.id !== itemId);
        if (newList.length === 1 && newList[0].id === itemId) newList = [];
        await actor.setFlag(OSRH.moduleName, 'customAttributes', newList);
        this.actor = actor;
        this.attributes = newList;
        if (actor.sheet?.rendered) {
          actor.sheet.render({ force: true });
        }
        this.render({ force: true, position: coord });
      });
    });
  }

  _addAttribute(event) {
    const actorId = this.actor?.id ?? this.actor?._id;
    const attrib = {
      id: foundry.utils.randomID(),
      name: '',
      abbr: '',
      value: 0,
      items: []
    };
    new OSRH.CustomAttributeEdit(attrib, actorId).render({
      force: true,
      position: { top: (event?.y ?? 45) + 75, left: event?.x ?? 60 }
    });
    this.close();
  }

  _deleteAttribute() {}
}
