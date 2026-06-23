// Travel constants for the Turn Tracker. The legacy ApplicationV1 turn tracker
// that used to live here was removed once the v0.8.4 v2 tracker
// (scripts/modules/v2/turn-tracker.mjs) became the active UI; these constants
// are still consumed by the v2 tracker (OSRH.CONST.terrainMod / lostMod).
export function registerTravelConstants() {
  const hasSystem = terrainData.systems.includes(game.system.id);
  OSRH.CONST.terrainMod = terrainData[hasSystem ? game.system.id: 'ose'];
  OSRH.CONST.lostMod = {
    grassland: 1,
    clear: 1,
    swamp: 3,
    jungle: 3,
    desert: 3,
    allElse: 2
  };
  OSRH.CONST.timeInc = {
    minute: 60,
    turn: 600,
    hour: 3600,
    day: 86400
  };
}
const terrainData = {
  systems:['ose','basicfantasyrpg'],
  ose: {
    trail: 1.5,
    road: 1.5,
    clear: 1,
    city: 1,
    grassland: 1,
    forest: 0.66,
    mud: 0.66,
    snow: 0.66,
    hill: 0.66,
    desert: 0.66,
    brokenLand: 0.66,
    mountain: 0.5,
    swamp: 0.5,
    jungle: 0.5,
    ice: 0.5,
    glacier: 0.5
  },
  'basicfantasyrpg': {
    trail: 1,
    road: 1.33,
    clear: 1,
    city: 1,
    grassland: 1,
    forest: 0.66,
    mud: 0.66,
    snow: 0.66,
    hill: 0.66,
    desert: 0.66,
    brokenLand: 0.66,
    mountain: 0.33,
    swamp: 0.33,
    jungle: 0.33,
    ice: 0.33,
    glacier: 0.33
  }
}
