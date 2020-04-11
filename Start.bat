@ECHO OFF
call npm install
title FIVEM.Store Updater
node update.js
cls
title FIVEM.Store Delivery
node index.js
PAUSE