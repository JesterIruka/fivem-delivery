const fs = require('fs');
const mysql = require('mysql');
const nodefetch = require('node-fetch').default;
const config = require('./src/config');
let scheduled = JSON.parse(fs.readFileSync('./scheduled.json'));
let playerList = [];

const vrp = require('./src/vrp')({sql,isOnline});
const esx = require('./src/esx')({sql,isOnline});

let DEBUG = false;

let link;
let api;

if (config.exists()) {
  config.data = config.read();
  api = 'https://five-m.store/api/'+config.data.token;
  DEBUG = config.data.debug || false;
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
  console.log("> FIVE-M.STORE");
  console.log("> TOKEN: "+config.data.token);

  const check = async () => {
    if (config.data.checkForOnlinePlayers)
      playerList = await (await nodefetch(config.data.playersJsonUrl)).json();
    await search(['/packages', '/delivery'], 'Aprovado');
    await search(['/refunds', '/punish'], 'Chargeback');

    await readSchedules();
    saveSchedules();
  };

  check();
  setInterval(check, 60000);
}

async function search(paths, type) {
  nodefetch(api+paths[0]).then(async res => {
    const json = await res.json();
    console.log(json);
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
    } else if (DEBUG) console.log('Sem vendas para processar ('+type+')');
  }).catch(err => console.error("Falha ao consultar API: "+err));
}

function processSale(sale, type) {
  if (sale.commands.length > 0) {
    sale.commands.forEach(cmd => {
      const runner = cmd.replace('?', sale.player);
      try {
        if (DEBUG) console.debug('EVAL > '+runner);
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
    res = await sql("SELECT `identifier` FROM vrp_user_ids WHERE user_id=? AND identifier LIKE 'license:%'", [id])
    if (res.length == 0) {
      if (DEBUG) console.log('Não foi possível encontrar o identifier de '+id);
      return true;
    } else identifier = res[0].identifier;
  }
  for (let x = 0; x < playerList.length; x++) {
    const player = playerList[x];
    if (player.identifiers.includes(identifier) || player.identifiers.includes(id)) {
      if (DEBUG) console.log(id+' is online!');
      return true;
    }
  }
  console.log(id+' is offline');
  return false;
}

function after(days, eval) {
  if (eval instanceof Function) eval = eatArrow(eval.toString());
  const now = new Date().getTime();
  const expires = (86400000*days);
  if (task = scheduled.find(task=>task.eval==eval)) {
    if (task.date > now) { //acumular tempo de vip e outras coisas
      task.date = task.date + expires;
    } else {
      task.date = now + expires;
    }
  } else {
    scheduled.push({uid:uuidv4(),date:(now+expires),eval});
  }
  saveSchedules();
  if (DEBUG) {
    console.log('Foi agendado um comando para '+days+' dia'+(days>1?'s':''));
    console.log('    > '+eval);
  }
}

this.sql = sql;
async function sql(sql, values=[]) {
  return await new Promise((resolve,reject) => {
    if (DEBUG) {
      console.log('Executando SQL')
      console.log(`    > ${sql}`);
      console.log(`    > [${values.join(',')}]`);
    }
    link.query(sql, values, (err,results) => {
      if (err) {
        console.error('Erro em'+sql);
        console.error(err);
        reject(err);
      } else resolve(results);
    });
  });
}

async function asyncOnlineFilter(sales) {
  for (let x = 0; x < sales.length; x++) {
    const online = await isOnline(sales[x].player);
    if (online) sales[x] = null;
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