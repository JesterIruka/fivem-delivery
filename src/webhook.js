const Discord = require('discord.js');
const config = require('./config');
const { currentDateFormatted } = require('./utils');

let client;

if (config.extras && config.extras.webhook) {
  if (url = config.extras.webhook.url) {
    const [id, token] = url.replace('https://discordapp.com/api/webhooks/', '').split('/');
    client = new Discord.WebhookClient(id, token);
  } else {
    const { id, token } = config.extras.webhook;
    client = new Discord.WebhookClient(id, token);
  }
} else if (config.discord_webhook && config.discord_webhook.includes('discordapp.com')) {
  const [id, token] = config.discord_webhook.replace('https://discordapp.com/api/webhooks/', '').split('/');
  client = new Discord.WebhookClient(id, token);
}

function broadcast(text, error = false) {
  let embed = new Discord.MessageEmbed();
  embed.setDescription(text);
  if (error) embed.setColor('DARK_RED')
  else embed.setColor('GREY')
  embed.setAuthor(currentDateFormatted());
  client.send(embed);
}

function debug(message, error = false, ignoreable = false) {
  if (client && !ignoreable) broadcast(message, error);
  else if (error) console.error(message);
  else if (config.debug) console.log(message);
}

module.exports = { debug };