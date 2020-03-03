const fs = require('fs');
const axios = require('axios').default;

axios.get('https://raw.githubusercontent.com/JesterIruka/fivem-delivery/master/app.js').then(res => {
  fs.writeFileSync('./app.js', res.data);
  console.log('Aplicativo atualizado!');
});