// Pure, Foundry-independent helper functions.
// Kept free of any references to global Foundry objects (game, canvas, Hooks, ui, ...)
// so they can be unit-tested in plain Node. See test/pure-helpers.test.mjs.

// Time unit -> seconds.
export const TIME_INC = {
  minute: 60,
  turn: 600,
  hour: 3600,
  day: 86400
};

// Safely walk a dot-delimited path on an object, returning undefined if any
// intermediate segment is missing rather than throwing.
export const getNestedValue = (obj, path) => {
  const parts = path.split('.');
  for (let i = 0; i < parts.length; i++) {
    obj = obj?.[parts[i]];
  }
  return obj;
};

// Convert a duration expressed in `unit` to whole seconds.
export const convertToSeconds = (duration, unit) => {
  return Math.round(parseInt(duration) * TIME_INC[unit]);
};

// Convert seconds to a whole count of `unit` (floored).
export const convertFromSeconds = (seconds, unit) => {
  return Math.floor(seconds / TIME_INC[unit]);
};

// Convert a duration (in seconds) to `type` units.
// When `disp` is true, a fractional value greater than 1 is rendered as "N+".
export const convertTime = (duration, type, disp = false) => {
  const val = duration / TIME_INC[type];
  const rem = val % 1 ? true : false;
  if (disp && rem && val > 1) {
    return `${Math.floor(val)}+`;
  }
  return Math.floor(val);
};

// True if the given user id has at least the given permission level on the actor.
export const hasPermission = (actor, uId, pLvl) => {
  return actor.ownership?.[uId] >= pLvl ? true : false;
};
