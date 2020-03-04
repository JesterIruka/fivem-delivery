const fs = require('fs');
const axios = require('axios').default;

const find = ['app.js', 'src/vrp.js', 'src/esx.js'];

const api = axios.create({
  baseURL: 'https://raw.githubusercontent.com/JesterIruka/fivem-delivery/master/'
})

find.forEach((file) => {
  api.get(file).then(res => fs.writeFileSync('./'+file, res.data));
  console.log(file+' atualizado com sucesso!');
});