const Discord = require('discord.js');

let debugNotify;

function runApp(config) {
  const data = config.extras.webhook;
  const client = new Discord.WebhookClient(data.id, data.token);

  debugNotify = (text, error=false) => {
    let embed = new Discord.MessageEmbed(text);
    if (error) embed.setColor('RED')
    else embed.setColor('GREY')
    embed.setAuthor(new Date().toUTCString());
    client.send(embed);
  }
}

function debug(message, error=false) {
  if (debugNotify) debugNotify(message, error);
  else if (error) console.error(message);
  else console.log(message);
}

module.exports = { runApp, debug };