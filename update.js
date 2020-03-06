const fs = require('fs');
const nodefetch = require('node-fetch').default;

const find = ['app.js', 'src/vrp.js', 'src/esx.js', 'src/config.js'];


const baseURL = 'https://raw.githubusercontent.com/JesterIruka/fivem-delivery/master/';


find.forEach(async (file) => {
  const res = await nodefetch(baseURL+file);
  const content = await res.text();
  nodefetch(baseURL+file).then(res => fs.writeFileSync('./'+file, content));
  console.log(file+' atualizado com sucesso!');
});