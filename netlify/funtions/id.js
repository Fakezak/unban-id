
// netlify/functions/id.js
const VALID_HASH = "d5a89b7c8deb5413cc7d3abec084b113d0b5f367cf84ca68c3a934754a9483f8";
const SUSPENSION_MS = 5 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const BANS = {
  "8749607076": "2026-10-15T00:00:00Z",
};

const MESSAGES = {
  banned:     "You are suspended",
  unbanNotif: "Your suspension has ended — welcome back",
  ok:         "OK",
  invalid:    "Data type error — contact admin",
};

function respond(status, message, extra = {}) {
  return {
    statusCode: 200,
    headers: {
      "content-type": "text/plain",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "x-ban-status": status,
      "x-ban-message": message,
      ...extra,
    },
    body: message,
  };
}

export const handler = async (event) => {
  const params = event.queryStringParameters || {};

  if (params.unban !== VALID_HASH) {
    return respond("invalid", MESSAGES.invalid);
  }

  const playerId = params.id;
  if (!playerId) {
    return respond("ok", MESSAGES.ok);
  }

  const banStart = BANS[playerId];
  if (!banStart) {
    return respond("ok", MESSAGES.ok, { "x-ban-uid": playerId });
  }

  const endTime = Date.parse(banStart) + SUSPENSION_MS;
  const now = Date.now();

  if (now >= endTime) {
    return respond("ok", MESSAGES.unbanNotif, {
      "x-ban-uid": playerId,
      "x-ban-expired": "true",
    });
  }

  const endDate = new Date(endTime).toISOString();
  const daysLeft = Math.max(1, Math.ceil((endTime - now) / DAY_MS));
  const hoursLeft = Math.max(1, Math.ceil((endTime - now) / (60 * 60 * 1000)));

  return respond("suspended", MESSAGES.banned, {
    "x-ban-uid": playerId,
    "x-ban-until": endDate,
    "x-ban-days-left": String(daysLeft),
    "x-ban-hours-left": String(hoursLeft),
    "x-ban-message-detail": `You have been suspended for 5 days (${daysLeft} day(s) left)`,
  });
};
