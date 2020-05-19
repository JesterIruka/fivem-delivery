const config = require("./config");

function twoDigits(n) {
  return n.toString().padStart(2, '0');
}

module.exports.currentDateFormatted = (date = null) => {
  if (typeof date === 'number') date = new Date(date);
  if (!date) date = new Date();

  const day = twoDigits(date.getDate());
  const month = twoDigits(date.getMonth() + 1);
  const year = date.getFullYear();

  const hour = twoDigits(date.getHours());
  const minutes = twoDigits(date.getMinutes());
  const seconds = twoDigits(date.getSeconds());

  return `${day}/${month}/${year} ${hour}:${minutes}:${seconds}`;
}

module.exports.americandreamDate = (date) => {
  const d = twoDigits(date.getDate());
  const M = twoDigits(date.getMonth() + 1);
  const y = date.getFullYear() - 2000;

  const h = twoDigits(date.getHours());
  const m = twoDigits(date.getMinutes());

  return str = `${d}/${M}/${y} ${h}:${m}`;
}

module.exports.hasPlugin = (name) => {
  return config.extras && config.extras.plugins && config.extras.plugins.includes(name);
}