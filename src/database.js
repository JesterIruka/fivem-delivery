const mysql = require('mysql');
const config = require('./config');
const webhook = require('./webhook');

const link = mysql.createConnection({...config, debug: false});

async function sql(sql, values=[], ignoreError=false) {
  return await new Promise((resolve,reject) => {
    webhook.debug(`Executando SQL\n${sql}\n[${values.join(",")}]`)
    link.query(sql, values, (err,results) => {
      if (err) {
        webhook.debug('Erro em '+sql+(ignoreError?' (Ignorado)':'')+'\n'+err, true);
        if (ignoreError) resolve([]);
        else reject(err);
      } else resolve(results);
    });
  });
}

let tables = [];

async function queryTables() {
  const res = await sql("SELECT table_name FROM information_schema.tables WHERE table_schema=?", [config.database]);
  res.forEach(t => tables.push(t.table_name));
}

const getTables = () => tables;

module.exports = {sql, link, queryTables, getTables};