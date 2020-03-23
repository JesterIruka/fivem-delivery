# fivem-delivery
Aplicativo entregador da five-m.store

### Como utilizar

- Clone o repositório, e execute o arquivo `Updater.bat` para baixar todas as dependências e atualizações.
- Execute `node app.js` ou `Start.bat` pela primeira vez para gerar o arquivo de configuração
- Execute `node app.js` ou `Start.bat` pela segunda vez para deixar o aplicativo rodando

- Sempre execute `Updater.bat` antes de iniciar seu aplicativo, isso pode resolver uma série de erros.

### Webhook discord

**Este webhook manda mensagens informando a situação de alguns pedidos, por isso é importante deixar o canal do webhook com acesso restrito aos administradores do servidor**

- Inisira em sua config o seguinte trecho
```json
{
    //o restante de sua config aqui em cima
    "extras": {
        "webhook": {
            "id": "seu-webhook-id",
            "token": "seu-webhook-token"
        }
    }
}
```
- O id/token são encontrados na URL https://discordapp.com/api/webhooks/ID/TOKEN

*Qualquer sugestão pode ser feita através de pull requests*
