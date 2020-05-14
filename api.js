const axios = require('axios').default;
const config = require('./src/config');
const { sql, getTables } = require('./src/database');
const webhook = require('./src/webhook');

let playerList = [];

class API {

  constructor(token) {
    this.api = axios.create({
      baseURL: 'https://five-m.store/api/'+token
    });
  }

  async queryPlayers() {
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
  delivery = async (ids) => (await this.api.get('/delivery?ids='+ids.join(','))).data
  punish = async (ids) => (await this.api.get('/punish?ids='+ids.join(','))).data;

  setPlayers = async (online) => this.api.patch('/players', {online});

  async isOnline(id) {
    if (!config.checkForOnlinePlayers) return false;
    let identifier = 'steam:'+id;
    /* VRP */
    if (typeof id === 'number' || id.match(/^[0-9]+$/g)) {
      if (config.extras && config.extras.vrp_users_online) {
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