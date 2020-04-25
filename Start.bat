@ECHO OFF
call npm install
title FIVEM.Store Updater
call node update.js
cls
title FIVEM.Store Delivery
call node index.js
PAUSE