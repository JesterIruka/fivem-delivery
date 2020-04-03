const db = require('./src/database');
const app = require('./app');

db.link.connect((err) => {
  if (err) {
    console.error('Não foi possível se conectar ao banco de dados');
    console.error(err.code);
  } else {
    app.run();
  }
});