@ECHO OFF
title FIVEM.Store Delivery
call npm install
node update.js
cls
node index.js
PAUSE