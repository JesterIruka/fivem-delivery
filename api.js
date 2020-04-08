const nodefetch = require('node-fetch').default;
const config = require('./src/config');
const { sql, getTables } = require('./src/database');
const webhook = require('./src/webhook');

let playerList = [];

class API {

  constructor(token) {
    this.url = 'https://five-m.store/api/'+token+'/';
  }

  async getJson(path) {
    return (await nodefetch(this.url+path)).json();
  }

  async queryPlayers() {
    try {
      playerList = config.checkForOnlinePlayers ? await this.players() : [];
    } catch (err) {
      webhook.debug('Falha ao consultar players.json (Servidor fechado?)', true);
      return false;
    }
    return true;
  }

  players = async () => await (await nodefetch(config.playersJsonUrl)).json();

  packages = async () => this.getJson('packages');
  refunds = async () => await this.getJson('refunds');
  delivery = async (ids) => await this.getJson('delivery?ids='+ids.join(','));
  punish = async (ids) => await this.getJson('punish?ids='+ids.join(','));

  async isOnline(id) {
    if (!config.checkForOnlinePlayers) return false;
    let identifier = 'steam:'+id;
    /* VRP */
    if (typeof id === 'number' || id.match(/^[0-9]+$/g)) {
      if (getTables().includes('fstore_online')) {
        const res = await sql("SELECT id FROM fstore_online WHERE id=?", [id]);
        return res.length > 0;
      } else if (config.extras && config.extras.vrp_users_online) {
        const res = await sql("SELECT * FROM vrp_users_online WHERE user_id=?", [id]);
        return res.length > 0;
      }
      const res = await sql("SELECT `identifier` FROM vrp_user_ids WHERE user_id=? AND identifier LIKE 'license:%'", [id])
      if (res.length == 0) {
        webhook.debug('Não foi possível encontrar o identifier de '+id);
        return true;
      } else identifier = res[0].identifier;
    }
    /* END VRP */
    for (let player of playerList) {
      if (player.identifiers.includes(identifier) || player.identifiers.includes(id)) {
        webhook.debug(id+' is online!');
        return true;
      }
    }
    webhook.debug(id+' is offline');
    return false;
  }
}

module.exports = new API(config.token);