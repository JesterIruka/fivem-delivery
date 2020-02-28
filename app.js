const fs = require('fs');
const mysql = require('mysql');
const axios = require('axios').default;
const config = require('./src/config');

let link;

if (config.exists()) {
  config.data = config.read();
  const { host,port,database,user,password } = config.data;
  link = mysql.createConnection({host, port, database, user, password});
  link.connect(err => {
    if (err) {
      console.error('> Falha ao conectar no banco de dados!');
    } else {
      console.info("> Conexão ao banco de dados realizada com sucesso!");
      runApp();
    }
  });
} else {
  config.create();
  console.log("Preencha a config.json e inicie novamente o aplicativo!");
}

function runApp() {
  const api = axios.create({
    baseURL: 'https://five-m.store/api/'+config.data.token
  });

  console.log("> FIVE-M.STORE");
  console.log("> TOKEN: "+config.data.token);

  const check = async () => {
    let playerList = config.data.checkForOnlinePlayers ?
      (await axios.get('http://127.0.0.1:30120/players.json')).data : [];
    search(playerList, api, link, ['/packages', '/delivery'], 'Aprovado');
    search(playerList, api, link, ['/refunds', '/punish'], 'Chargeback');
  };

  check();
  setInterval(check, 60000);
}

function search(players, api, link, paths, type) {
  api.get(paths[0]).then(res => {
    const sales = res.data.filter(sale => !isOnline(players, sale.player));
    if (sales.length > 0) {
      sales.forEach(sale => processSale(sale, link, type));
      const ids = sales.map(s => s.id).join(',');
      api.get(paths[1]+'?ids='+ids).then(res => {
        if (res.data.error) {
          console.error(res.data.error);
        } else {
          console.info(res.data.sucesso);
        }
      });
    }
  }).catch(err => console.error("Falha ao consultar API: "+err.errno));
}

function processSale(sale, link, type) {
  if (sale.commands.length > 0) {
    sale.commands.forEach(cmd => {
      const sql = cmd.replace('?', sale.player);
      console.debug("Executando "+sql+" do pedido "+sale.id+" ("+type+")");
      link.query(sql);
    })
  } else {
    console.info("O pedido "+sale.id+" não possui comandos para serem executados ("+type+")");
  }
}

function isOnline(playerList, id) {
  const hex = id.startWith("steam:") ? id : 'steam:'+id;
  for (let x = 0; x < playerList.length; x++) {
    const player = playerList[x];
    if (player.id == id || player.identifiers.includes(hex) || player.identifiers.includes(id)) {
      return true;
    }
  }
  return false;
}