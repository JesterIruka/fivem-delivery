const fs = require('fs');
const unzip = require('unzip');

fs.createReadStream('https://github.com/JesterIruka/fivem-delivery/archive/master.zip').pipe(unzip.Extract({ path: '.' }));