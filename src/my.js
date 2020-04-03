const { sql } = require('./database');
const { isOnline } = require('../api');
const { after } = require('./scheduler');

/**
 * Aqui você poderá criar seus próprios métodos e usar na loja pelo atalho
 * my.seuMetodo('?', ...)
 */

class MY {

  async seuMetodo(player, parametro) {
    if (await isOnline(player)) return false;
    console.log('Executando meu método em '+player);
    return true;
  }

}

module.exports = new MY();