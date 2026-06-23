# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.4-gygax75.3] 2026-06-23
### changed
- Removed orphaned legacy turn-tracker styles from `turn-tracker.scss` (and compiled `main.css`) that were only used by the deleted ApplicationV1 tracker: `.dark-icon`, the bare `.config-tab` rules (v2 uses `.dungeon-config-tab`/`.travel-config-tab`), `.half-row`, `h2.terrain-spacer`, and `.party-list.lg-list`. The rest of the stylesheet remains in use — it is scoped under `.app.osrh.turn-tracker`, which still matches the v2 tracker.

## [0.8.4-gygax75.2] 2026-06-23
### fixes
- Restored the gygax75 Turn Tracker customizations in the new v0.8.4 **v2** (ApplicationV2) turn tracker. They were not lost in the merge — v0.8.4 switched the module to a new v2 tracker that did not carry them, while the underlying data and `OSRH.turn.*` logic remained intact. Re-added to the v2 UI:
  - Dungeon/Travel **notes** textareas (persist on change; accept dropped Journal entries/pages as `@UUID` links and RollTables by name).
  - **Undo/Redo** buttons on both tabs.
  - The dungeon **Output Time** button (turn/notes report to chat).
  - The **rest-needed red warning** on the "since rest" rows (turns red at rest ≥ 5).
  - The **"Current Turn:"** counter row at the top of the dungeon tab.
### changed
- Removed the orphaned legacy ApplicationV1 turn tracker now that the v2 tracker is the active UI: deleted the `OSRHTurnTracker` class and `templates/turn-tracker.hbs`. `scripts/modules/turn-tracker.mjs` now contains only `registerTravelConstants`/`terrainData` (still consumed by the v2 tracker via `OSRH.CONST`).

## [0.8.4-gygax75.1] 2026-06-23
### changed
- Merged upstream RabidOwlbear/osr-helper **v0.8.4** into the gygax75 fork. Brings in the v2 (ApplicationV2) apps — turn tracker, party sheet, travel calculator, ammo config, item config, light config, and active-effects rework — plus the new doc images and language string additions.
- Rebased the gygax75 customizations onto the v0.8.4 base. Preserved: the Turn Tracker undo/redo + notes/turn-report features, the wandering/rest fixes, the "rest needed" red warning styling, the active-effects missing-icon crash guard, the OSE Ranged Damage Mod effect option, and the pure-helpers extraction (with tests).
- Adopted upstream's `evaluateSync()` for the reaction roll in `turn.js`, superseding the gygax75 `evaluate({ async: true })` V14-compat change.
- Kept fork manifest identity (JustinFreitas URLs, release-stamped manifest/download, `README.md`).

## [0.7.8-gygax75.3] 2026-06-21
### added
- OSE: "Ranged Damage Mod" effect option (`system.damage.mod.missile`), exposing the gygax75 OSE missile bonus-damage lever in the effect builder. Requires ose-foundry-core-gygax75 >= 2.2.2-gygax75.11 (older systems ignore the unknown path).

## [0.7.8-gygax75.2] 2026-06-14
### fixes
- Fixed a crash in the `updateCombat` hook that threw for every connected client when no GM was active.
- Fixed `OSRH.ration.eat` failing when called with an actor id (inverted actor lookup left the actor unresolved).
- Fixed the center-hotbar version check, which used incorrect operator precedence and never engaged on the intended Foundry versions.
- Fixed the active effects app crashing on render when a preset referenced a removed/renamed icon; it now falls back gracefully.
- Made `getNestedValue` null-safe so a missing intermediate property no longer throws.
- Hardened `resetMonsterAttacks` against no active combat, orphaned combatant actors, and items lacking a `counter` (non-OSE systems).
- Fixed the ration config name field always rendering blank (`namel` typo).
- Removed a redundant `unsetFlag`/`setFlag` write race when clearing light flags.

### changed
- Removed phantom Chinese (`cn`) compendium entries from `packFolders` that referenced unregistered packs.
- Removed dead code: the unused `socket.mjs` stub and the legacy `osrLightTick`/`osrEffectTick` functions.
- Removed the stale duplicate `REAMDE.md` and pointed the manifest `readme` at `README.md`.
- Removed orphaned legacy NeDB (`.db`) pack files superseded by the LevelDB compendium directories.

## [0.4.26]
### changes
- Rations are now identified by a Ration tag. This allow any item with a "Ration" tag to be used by the eat ration feature. Ration items require a quantity of at least one "1/1".
- Added a macro to migrate existing ration items in a game world to the new system. If an item on a character sheet is not appering in the use ration popup, make sure that the item has a "Ration" tag.

## [0.4.25]
### changes
- Fixed issue preventing light item config menu from opening.
- Fixed an issue preventing macros in the macro bar from being deleted.

## [0.4.24]
### changes
- fixed error with light alpha input displaying an incorrect value if the value is set to 0.
- renamed the "alpha" input on the light item config menu to "Color Itensity" to better indicate setting the input is for.

## [0.4.22] 2023-6-22
### changes
- module now creates folder to organize included compendiums on intial world load.
- added setting for compendium folder name.
- added setting to control whether included compendium packs are grouped into a folder. Defaults to true.
- added support for the Hyperborea game system for fvtt.

### fixes
- fixed some irregularities with the hide foreign language packs feature. Hidden packs should now remain hidden after the compendium tab is refreshed.

## [0.4.19] 2023-6-22
### fixes
- Fixed template errors resulting in broken localization on the new active effect form.

## [0.4.15] 2023-6-19
### fixes
- Fixed error with currency converter
- Fixed bug preventing light item quantities from being decremented correctly when the light expired.
### added
- finalized Spanish localization. Ammunition tracking should now work with localized items from item shop. Thanks again patron Malecho for providing translations.

## [0.4.15] 2023-6-6
### added
- improved Spanish language localization courtesy of patron Malecho. Thank you very much for the assistance.

## [0.3.8] 2022-4-12
### added
- Infinite light item duration. To set a light item's duration to infinite set the durtation value to 'inf'.

## [0.3.8] 2022-4-12
### added
- Custom Effect Preset management.
- world Custom Effect Preset import/export 

### changed
- updated the custom effects preset data model. This change requires the one time use of the provided "Update Saved Effects" macro to update existing saved custom effects.


## [0.3.7] 2022-4-9
### added
- added support for equipable container items in character actor inventories.

### changed
- updated compatible version to reflect latest foundry version.

## [0.3.6] 2022-4-7
### added

- Aded changelog.
- Added custom effect presets.
- Added color themes for active effects forms

### changed
- Changed center hotbar to work better with other modules that change visual appearance.
- Updated Readme.md with updated documentation.
- Udated module version compatability in module.json.
