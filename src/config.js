const fs = require('fs');

const path = __dirname + '/../config.json';

const defaultConfig = {
  token: 'seu-token-da-loja',
  checkForOnlinePlayers: true,
  playersJsonUrl: 'http://127.0.0.1:30120/players.json',
  debug: false,
  host: 'localhost',
  port: 3306,
  database: 'fivem',
  user: 'root',
  password: '',
  extras: {},
  discord_webhook: 'link-do-webhook-discord'
}

if (!fs.existsSync(path)) {
  fs.writeFileSync(path, JSON.stringify(defaultConfig, null, 4));
  console.log('Preencha a config.json e inicie o aplicativo novamente!');
  process.exit(0);
}

module.exports = JSON.parse(fs.readFileSync(path));