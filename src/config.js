const fs = require('fs');

function exists() {
  return fs.existsSync(__dirname+'/../config.json');
}

function read() {
  return JSON.parse(fs.readFileSync(__dirname+'/../config.json'));
}

function create() {
  fs.writeFileSync(__dirname+'/../config.json', JSON.stringify({
    token:'seu-token-da-loja',
    checkForOnlinePlayers:true,
    playersJsonUrl:'http://127.0.0.1:30120/players.json',
    debug:false,
    host:'localhost',
    port:3306,
    database:'fivem',
    user:'root',
    password:'',
    extras:{}
  }, null, 4));
}

module.exports = { exists, read, create }