const mysql = require('mysql');
const config = require('./config');
const webhook = require('./webhook');

const link = mysql.createConnection({ ...config, debug: false });

async function sql(sql, values = [], ignoreError = false, debug = true) {
  return await new Promise((resolve, reject) => {
    const body = "```sql\n" + sql + "\n``` ```\n[" + values.join(', ') + "]\n```";
    if (debug) webhook.debug(body);
    link.query(sql, values, (err, results) => {
      if (err) {
        webhook.debug('Erro em ' + sql + (ignoreError ? ' (Ignorado)' : '') + '\n' + err, true);
        if (ignoreError) resolve([]);
        else reject(err);
      } else resolve(results);
    });
  });
}

async function insert(table, data, ignore = false, debug = true) {
  const keys = Object.keys(data).map(s => '`' + s + '`').join(',');
  const values = Object.values(data);
  const marks = values.map(s => '?').join(',');

  const cmd = `INSERT INTO \`${table}\` (${keys}) VALUES (${marks})`;

  return await sql(cmd, values, ignore, debug);
}

function firstTable(tables) {
  if (!Array.isArray(tables)) tables = arguments;
  for (let table of tables) {
    if (getTables().find(s => s.toLowerCase() === table.toLowerCase()))
      return table;
  }
  return null;
}

let tables = [];

async function queryTables() {
  const res = await sql("SELECT table_name FROM information_schema.tables WHERE table_schema=?", [config.database], false, false);
  res.forEach(t => tables.push(t.table_name));
}

const getTables = () => tables;

module.exports = { sql, insert, link, queryTables, getTables, firstTable };