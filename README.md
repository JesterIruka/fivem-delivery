# fivem-delivery
Aplicativo entregador da five-m.store

### Como utilizar

- Clone o repositório, e execute o arquivo `Instalar Node.bat` caso você não tenha o NodeJS.
- Execute o arquivo `Start.bat` para baixar todas as dependências, atualizações e iniciar o aplicativo.

### Webhook discord

**Este webhook manda mensagens informando a situação de alguns pedidos, por isso é importante deixar o canal do webhook com acesso restrito aos administradores do servidor**

Exemplo na config.json

```json
    "discord_webhook": "https://discordapp.com/api/webhooks/........."
```

### Vrp

** Altamente recomendados o uso conjunto do nosso script vrp, pois nem sempre é possível checar se o jogador está online pelo players.json **

https://github.com/JesterIruka/fivem-delivery-vrp

1. Instale o script (configure o config.json do script se necessário)
2. Insira na sua config.json do aplicativo

```json
    "fstore_online": true
```


*Qualquer sugestão pode ser feita através de pull requests*
*Qualquer dúvida pode ser esclarecida em nossa discord através de um ticket*

https://discord.gg/FUcKDQw
