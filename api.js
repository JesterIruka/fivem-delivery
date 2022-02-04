const axios = require('axios').default;
const config = require('./src/config');
const { sql, getTables } = require('./src/database');
const webhook = require('./src/webhook');
const { hasPlugin } = require('./src/utils');

let playerList = [];

/* is online */
async function getIdentifier(id) {
  let pattern = 'license:%';
  if (hasPlugin('vrp/steam'))
    pattern = 'steam:%';
  const rows = await sql("SELECT identifier FROM vrp_user_ids WHERE user_id=? AND identifier LIKE ?", [id, pattern]);
  if (rows.length) return rows[0].identifier;
  else return null;
}

async function inPlayerList(id) {
  if (!config.checkForOnlinePlayers) return false;
  let identifier = 'steam:' + id;
  /* VRP */
  if (typeof id === 'number' || id.match(/^[0-9]+$/g)) {
    if (config.extras && config.extras.vrp_users_online) {
      const res = await sql("SELECT * FROM vrp_users_online WHERE user_id=?", [id], false, false);
      return res.length > 0;
    }
    identifier = await getIdentifier(id);
    if (!identifier) {
      webhook.debug(`Não foi possível encontrar o identifier de ${id}`);
      return true;
    }
  }
  /* END VRP */
  for (let player of playerList) {
    if (player.identifiers.includes(identifier) || player.identifiers.includes(id)) {
      return true;
    }
  }
  return false;
}
/* end is online */


/* cache */
const online_cache = {};

function saveToCache(id, online) {
  online_cache[id] = {
    expires: Date.now() + 1000,
    online
  }
}
function clearOnlineCache() {
  for (let id in online_cache) {
    if (online_cache[id].expires < Date.now()) {
      delete online_cache[id];
    }
  }
}
/* end cache */

class API {

  constructor(token) {
    this.api = axios.create({
      baseURL: 'https://api.five-m.store/api/' + token
    });
  }

  async queryPlayers() {
    clearOnlineCache();
    try {
      if (config.checkForOnlinePlayers) {
        this.players().then(response => {
          playerList = response.data;
          this.setPlayers(playerList.length);
        }).catch(_ => {
          console.error('Falha ao consultar players.json, verifique se o seu servidor está aberto.');
        });
      } else {
        playerList = [];
        this.setPlayers(0);
      }
    } catch (err) {
      webhook.debug('Falha ao consultar players.json (Servidor fechado?)', true);
      return false;
    }
    return true;
  }

  players = async () => axios.get(config.playersJsonUrl);

  packages = async () => (await this.api.get('/packages')).data;
  refunds = async () => (await this.api.get('/refunds')).data;
  delivery = async (ids) => (await this.api.get('/delivery?ids=' + ids.join(','))).data
  punish = async (ids) => (await this.api.get('/punish?ids=' + ids.join(','))).data;

  setPlayers = async (online) => this.api.patch('/players', { online });

  async isOnline(id) {
    if (online_cache[id] && online_cache[id].expires > Date.now()) {
      return online_cache[id].online;
    }
    const online = await inPlayerList(id);
    saveToCache(id, online);
    webhook.debug(`${id} is ${online ? 'online' : 'offline'}`, false, true);
    return online;
  }
}

module.exports = new API(config.token);
