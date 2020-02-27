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
    host:'localhost',
    port:3306,
    database:'fivem',
    user:'root',
    password:''
  }, null, 4));
}

module.exports = { exists, read, create }