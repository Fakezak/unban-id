// api/id.js — Vercel
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

export default function handler(req, res) {
  res.setHeader("content-type", "text/plain");
  res.setHeader("cache-control", "no-store");
  res.setHeader("access-control-allow-origin", "*");

  const hash = req.query.unban;
  const playerId = req.query.id;

  // ---- Invalid hash ----
  if (hash !== VALID_HASH) {
    res.setHeader("x-ban-status", "invalid");
    res.setHeader("x-ban-color", "orange");
    res.setHeader("x-ban-message", MESSAGES.invalid);
    return res.status(200).send(MESSAGES.invalid);
  }

  // ---- No UID → OK ----
  if (!playerId) {
    res.setHeader("x-ban-status", "ok");
    res.setHeader("x-ban-color", "green");
    res.setHeader("x-ban-message", MESSAGES.ok);
    return res.status(200).send(MESSAGES.ok);
  }

  // ---- UID not banned → OK ----
  const banStart = BANS[playerId];
  if (!banStart) {
    res.setHeader("x-ban-status", "ok");
    res.setHeader("x-ban-color", "green");
    res.setHeader("x-ban-message", MESSAGES.ok);
    res.setHeader("x-ban-uid", playerId);
    return res.status(200).send(MESSAGES.ok);
  }

  // ---- Check 5-day window ----
  const endTime = Date.parse(banStart) + SUSPENSION_MS;
  const now = Date.now();

  if (now >= endTime) {
    res.setHeader("x-ban-status", "ok");
    res.setHeader("x-ban-color", "green");
    res.setHeader("x-ban-message", MESSAGES.unbanNotif);
    res.setHeader("x-ban-uid", playerId);
    res.setHeader("x-ban-expired", "true");
    return res.status(200).send(MESSAGES.unbanNotif);
  }

  // ---- Still suspended → red ----
  const endDate = new Date(endTime).toISOString();
  const daysLeft = Math.max(1, Math.ceil((endTime - now) / DAY_MS));
  const hoursLeft = Math.max(1, Math.ceil((endTime - now) / (60 * 60 * 1000)));
  const detail = `You have been suspended for 5 days (${daysLeft} day(s) left)`;

  res.setHeader("x-ban-status", "suspended");
  res.setHeader("x-ban-color", "red");
  res.setHeader("x-ban-message", detail);
  res.setHeader("x-ban-uid", playerId);
  res.setHeader("x-ban-until", endDate);
  res.setHeader("x-ban-days-left", String(daysLeft));
  res.setHeader("x-ban-hours-left", String(hoursLeft));
  return res.status(200).send(detail);
}
