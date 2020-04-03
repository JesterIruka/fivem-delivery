const Discord = require('discord.js');
const config = require('./config');

let client;

if (config.extras && config.extras.webhook) {
  if (url = config.extras.webhook.url) {
    const [id,token] = url.replace('https://discordapp.com/api/webhooks/', '').split('/');
    client = new Discord.WebhookClient(id, token);
  } else {
    const {id,token} = config.extras.webhook;
    client = new Discord.WebhookClient(id, token);
  }
} else if (config.discord_webhook && config.discord_webhook.includes('discordapp.com')) {
  const [id,token] = config.discord_webhook.replace('https://discordapp.com/api/webhooks/', '').split('/');
  client = new Discord.WebhookClient(id, token);
}

function broadcast(text, error=false) {
  let embed = new Discord.MessageEmbed();
  embed.setDescription(text);
  if (error) embed.setColor('DARK_RED')
  else embed.setColor('GREY')
  embed.setAuthor(dataAtualFormatada());
  client.send(embed);
}

function debug(message, error=false, ignoreable=false) {
  if (client && !ignoreable) broadcast(message, error);
  else if (error) console.error(message);
  else if (config.debug) console.log(message);
}

function dataAtualFormatada(){
  var data = new Date(),
      dia  = data.getDate().toString(),
      diaF = (dia.length == 1) ? '0'+dia : dia,
      mes  = (data.getMonth()+1).toString(),
      mesF = (mes.length == 1) ? '0'+mes : mes,
      anoF = data.getFullYear(),
      hora = data.getHours(),
      horaF = (hora < 10) ? '0'+hora: hora,
      min = data.getMinutes(),
      minF = (min < 10) ? '0'+min: min,
      seg = data.getSeconds(),
      segF = (seg < 10) ? '0'+seg: seg;
  return diaF+"/"+mesF+"/"+anoF+" "+horaF+":"+minF+":"+segF;
}

module.exports = { debug };