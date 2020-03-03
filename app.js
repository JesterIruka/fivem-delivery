const fs = require('fs');
const mysql = require('mysql');
const axios = require('axios').default;
const config = require('./src/config');
let scheduled = JSON.parse(fs.readFileSync('./scheduled.json'));
let playerList = [];

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
    if (config.data.checkForOnlinePlayers)
      playerList = (await axios.get('http://127.0.0.1:30120/players.json')).data;
    search(api, ['/packages', '/delivery'], 'Aprovado');
    search(api, ['/refunds', '/punish'], 'Chargeback');

    await readSchedules();
    saveSchedules();
  };

  check();
  setInterval(check, 60000);
}

function search(api, paths, type) {
  api.get(paths[0]).then(res => {
    const sales = res.data.filter(sale => !isOnline(sale.player));
    if (sales.length > 0) {
      sales.forEach(sale => processSale(sale, type));
      const ids = sales.map(s => s.id).join(',');
      api.get(paths[1]+'?ids='+ids).then(res => {
        if (res.data.error) {
          console.error(res.data.error);
        } else {
          console.info(res.data.sucesso);
        }
      });
    }
  }).catch(err => console.error("Falha ao consultar API: "+err));
}

function processSale(sale, type) {
  if (sale.commands.length > 0) {
    sale.commands.forEach(cmd => {
      const runner = cmd.replace('?', sale.player);
      try {
        eval(runner);
      } catch (ex) {
        console.error(ex, sale.id);
      }
    })
  } else {
    console.info("O pedido "+sale.id+" não possui comandos para serem executados ("+type+")");
  }
}

function isOnline(id) {
  const hex = 'steam:'+id;
  for (let x = 0; x < playerList.length; x++) {
    const player = playerList[x];
    if (player.id == id || player.identifiers.includes(hex) || player.identifiers.includes(id)) {
      return true;
    }
  }
  return false;
}

function after(days, eval) {
  const date = new Date().getTime() + (86400000 * days);
  const uid = uuidv4();
  scheduled.push({uid,date,eval});
  saveSchedules();
  console.log('Foi agendado um comando para '+days+' dia'+(days>1?'s':''));
  console.log('    > '+eval);
}

async function addGroupVRP(id, group) {
  if (isOnline(id)) return false;
  const res = await sql("SELECT dvalue FROM vrp_user_data WHERE user_id='"+id+"' AND dkey='vRP:datatable'");
  if (res.length > 0) {
    const data = JSON.parse(results[0]);
    data.groups[group] = true;
    sql("UPDATE vrp_user_data SET dvalue=? WHERE user_id=?", [JSON.stringify(data), id]);
    return true;
  } else {
    console.log('Não foi encontrado nenhum dvalue para '+id);
    return false;
  }
}

async function removeGroupVRP(id, group) {
  if (isOnline(id)) return false;
  const res = await sql("SELECT dvalue FROM vrp_user_data WHERE user_id='"+id+"' AND dkey='vRP:datatable'");
  if (res.length > 0) {
    const data = JSON.parse(results[0]);
    delete data.groups[group];
    sql("UPDATE vrp_user_data SET dvalue=? WHERE user_id=?", [JSON.stringify(data), id]);
    return true;
  } else {
    console.log('Não foi encontrado nenhum dvalue para '+id);
    return false;
  }
}

async function addHouseVRP(id, house) {
  if (isOnline(id)) return false;
  const highest = await sql('SELECT MAX(number) AS `high` FROM vrp_user_homes WHERE home=?', [house]);
  let number = 1;
  if (highest.length > 0) number=highest[0].high+1;
  await sql('INSERT INTO vrp_user_homes (user_id,home,number) VALUES (?,?,?)', [id,house,number]);
  return true;
}

async function sql(sql, values=[]) {
  return await new Promise((resolve,reject) => {
    console.log('Executando SQL')
    console.log(`    > ${sql}`);
    console.log(`    > [${values.join(',')}]`);
    link.query(sql, values, (err,results) => {
      if (err) {
        console.error('Error in '+sql);
        console.error(err);
        reject(err);
      }
      else resolve(results);
    });
  });
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
    if (remove.find(o=>o.uid==s.uid)) return false;
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