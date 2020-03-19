const fs = require('fs');
const mysql = require('mysql');
const nodefetch = require('node-fetch').default;
const config = require('./src/config');
const webhook = require('./src/webhook');
let scheduled = JSON.parse(fs.readFileSync('./scheduled.json'));
let playerList = [];

let link;
let api;

let mod = { isOnline, sql, config };

const vrp = require('./src/vrp')(mod);
const esx = require('./src/esx')(mod);

if (config.exists()) {
  config.data = config.read();
  api = 'https://five-m.store/api/'+config.data.token;
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
  webhook.debug("Preencha a config.json e inicie novamente o aplicativo!");
}

function runApp() {
  webhook.debug("> FIVE-M.STORE");
  webhook.debug("> TOKEN: "+config.data.token);

  if (config.data.extras && config.data.extras.webhook) {
    webhook.runApp(config.data);
  }

  const check = () => {
    link.ping(async (error) => {
      if (error) webhook.debug(error);
      else {
        playerList = await queryPlayers();
        if (Array.isArray(playerList)) {
          await search(['/packages', '/delivery'], 'Aprovado');
          await search(['/refunds', '/punish'], 'Chargeback');

          await readSchedules();
          saveSchedules();
        } else {
          console.error('Falha ao consultar players.json (Servidor fechado?)');
          console.error(playerList);
        }
      }
    });
  };

  check();
  setInterval(check, 60000);
}

async function search(paths, type) {
  nodefetch(api+paths[0]).then(async res => {
    const json = await res.json();
    webhook.debug(json);
    const sales = await asyncOnlineFilter(json);
    if (sales.length > 0) {
      sales.forEach(sale => processSale(sale, type));
      const ids = sales.map(s => s.id).join(',');
      nodefetch(api+paths[1]+'?ids='+ids).then(async res => {
        body = await res.json();
        if (body.error) {
          console.error(body.error);
        } else {
          console.info(body.sucesso);
        }
      });
    } else webhook.debug('Sem vendas para processar ('+type+')');
  }).catch(err => console.error("Falha ao consultar API: "+err));
}

function processSale(sale, type) {
  if (sale.commands.length > 0) {
    sale.commands.forEach(cmd => {
      const runner = cmd.replace('?', sale.player);
      try {
        webhook.debug('EVAL > '+runner);
        eval(runner);
      } catch (ex) {
        console.error(ex, sale.id);
      }
    })
  } else {
    console.info("O pedido "+sale.id+" não possui comandos para serem executados ("+type+")");
  }
}

async function isOnline(id) {
  let identifier = 'steam:'+id;
  if (parseInt(id) > 0) {
    if (config.data.extras && config.data.extras.vrp_users_online) {
      res = await sql("SELECT * FROM vrp_users_online WHERE user_id=?", [id]);
      return res.length > 0;
    }
    res = await sql("SELECT `identifier` FROM vrp_user_ids WHERE user_id=? AND identifier LIKE 'license:%'", [id])
    if (res.length == 0) {
      webhook.debug('Não foi possível encontrar o identifier de '+id);
      return true;
    } else identifier = res[0].identifier;
  }
  for (let x = 0; x < playerList.length; x++) {
    const player = playerList[x];
    if (player.identifiers.includes(identifier) || player.identifiers.includes(id)) {
      webhook.debug(id+' is online!');
      return true;
    }
  }
  webhook.debug(id+' is offline');
  return false;
}

function after(days, eval) {
  if (eval instanceof Function) eval = eatArrow(eval.toString());
  const now = new Date().getTime();
  const expires = (86400000)*days;
  if (task = scheduled.find(task=>task.eval==eval)) {
    task.date = now + expires;
  } else {
    scheduled.push({uid:uuidv4(),date:(now+expires),eval});
  }
  saveSchedules();
  webhook.debug('Foi agendado um comando para '+days+' dia'+(days>1?'s':''));
  webhook.debug('    > '+eval);
}

this.sql = sql;
async function sql(sql, values=[], ignoreError=false) {
  return await new Promise((resolve,reject) => {
    webhook.debug('Executando SQL')
    webhook.debug(`    > ${sql}`);
    webhook.debug(`    > [${values.join(',')}]`);
    link.query(sql, values, (err,results) => {
      if (err) {
        console.error('Erro em'+sql+(ignoreError?' (Ignorado)':''));
        console.error(err);
        if (ignoreError) resolve([]);
        else reject(err);
      } else resolve(results);
    });
  });
}

async function asyncOnlineFilter(sales) {
  for (let x = 0; x < sales.length; x++) {
    const online = await isOnline(sales[x].player);
    if (online) sales[x] = null;
  }
  return sales.filter(e => e != null);
}

async function readSchedules() {
  const now = new Date().getTime();
  const remove = [];
  for (i = 0; i < scheduled.length; i++) {
    const s = scheduled[i];
    if (s.date <= now) {
      const ok = await eval(s.eval);
      if (ok) {
        remove.push(s.uid);
      }
    }
  }
  scheduled = scheduled.filter(s => {
    if (remove.includes(s.uid)) return false;
    return true;
  });
}

function saveSchedules() {
  fs.writeFileSync('./scheduled.json', JSON.stringify(scheduled, null, 4));
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function eatArrow(obj) {
  if (obj instanceof Function) obj = obj.toString();
  return obj.replace('(','').replace(')', '').replace('=>', '').trimStart();
}

async function queryPlayers() {
  if (config.data.checkForOnlinePlayers) {
    return await new Promise((resolve,reject) => {
      nodefetch(config.data.playersJsonUrl).then(res => {
        res.json().then(arr => {
          resolve(arr);
        }).catch(err => resolve(false));
      }).catch(err => resolve(false));
    });
  } else return [];
}