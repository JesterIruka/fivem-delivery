const config = require("./config");

module.exports.americandreamDate = (date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const M = (date.getMonth()+1).toString().padStart(2, '0');
  const y = date.getFullYear()-2000;

  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');

  return str = `${d}/${M}/${y} ${h}:${m}`;
}
module.exports.hasPlugin = (name) => {
  return config.extras && config.extras.plugins && config.extras.plugins.includes(name);
}