const {link, sql, getTables} = require('./src/database');
const config = require('./src/config');

const api = require('./api');
const webhook = require('./src/webhook');

const {getSchedules, setSchedules, after} = require('./src/scheduler');

const vrp = require('./src/vrp');
const esx = require('./src/esx');
const my = require('./src/my');

function run() {
  console.log("> FIVE-M.STORE");
  console.log("> TOKEN: "+config.token.replace(/./g, '*'));

  const check = () => {
    link.ping(async (error) => {
      if (error) webhook.debug(error.code, true);
      else {
        if (await api.queryPlayers()) {
          const packages = await asyncOnlineFilter(await api.packages());
          const refunds = await asyncOnlineFilter(await api.refunds());
          
          for (let pkg of packages)
            await processSale(pkg, 'Aprovado');
          for (let pkg of refunds)
            await processSale(pkg, 'Reembolso');

          if (packages.length) await api.delivery(packages.map(s=>s.id));
          if (refunds.length) await api.punish(refunds.map(s=>s.id));

          await readSchedules();
        }
      }
    });
  };

  check();
  setInterval(check, 60000);
}

async function processSale(sale, type) {
  if (sale.commands.length > 0) {
    let msg = `VENDA: ${sale.id}, PLAYER:${sale.player} (${type})`;
    for (let cmd of sale.commands) {
      const runner = cmd.replace(/\?/g, sale.player);
      try {
        msg+= '\n > '+runner;
        await eval(runner);
      } catch (ex) {
        console.error(ex, sale.id);
      }
    }
    webhook.debug(msg);
  } else {
    webhook.debug("O pedido "+sale.id+" não possui comandos para serem executados ("+type+")");
  }
}

async function asyncOnlineFilter(sales) {
  if (sales.erro) {
    console.error(sales.erro);
    return [];
  }
  for (let x = 0; x < sales.length; x++) {
    const online = await api.isOnline(sales[x].player);
    if (online) sales[x] = null;
  }
  return sales.filter(e => e != null);
}

async function readSchedules() {
  const now = new Date().getTime();
  const remove = [];
  for (let s of getSchedules()) {
    if (s.date <= now && (await eval(s.eval))) {
      remove.push(s.uid);
    }
  }
  setSchedules(getSchedules().filter(s => !remove.includes(s.uid)));
}

module.exports = { run }