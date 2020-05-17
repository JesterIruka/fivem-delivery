const fs = require('fs');
const webhook = require('./webhook');
const path = __dirname+'/../scheduled.json';

let schedules = [];

if (!fs.existsSync(path)) {
  fs.writeFileSync(path, '[]');
} else schedules = JSON.parse(fs.readFileSync(path));

function setSchedules(list) {
  schedules = list;
  fs.writeFileSync(path, JSON.stringify(schedules, null, 4));
}

const getSchedules = () => schedules;

const DAY_MILLIS = 86400000;

function after(days, eval) {
  if (eval instanceof Function) eval = eatArrow(eval.toString());
  const now = Date.now();
  const expires = (86400000)*days;
  if (task = schedules.find(task=>task.eval==eval)) {
    const diff = task.date - now;
    if (diff <= DAY_MILLIS*7) {
      task.date = task.date + expires;
    } else {
      task.date = now + expires;
    }
  } else {
    schedules.push({uid:uuidv4(),date:(now+expires),eval});
  }
  setSchedules(schedules);
  webhook.debug('Foi agendado um comando para '+days+' dia'+(days>1?'s':'')+'\n'+eval);
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function eatArrow(obj) {
  if (obj instanceof Function) obj = obj.toString();
  return obj.replace('(','').replace(')', '').replace('=>', '').trimStart();
}

module.exports = {getSchedules, setSchedules, after}