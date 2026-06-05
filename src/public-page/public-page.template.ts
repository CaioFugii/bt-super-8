export function renderSpectatorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Super 8 Beach Tennis</title>
    <link rel="stylesheet" href="/spectator/style.css" />
  </head>
  <body>
    <div id="app"><div class="loading">Carregando torneio...</div></div>
    <script src="/spectator/app.js"></script>
  </body>
</html>`;
}

export function renderSpectatorErrorPage(message: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Super 8 Beach Tennis</title>
    <link rel="stylesheet" href="/spectator/style.css" />
  </head>
  <body>
    <div id="app"><div class="error-box">${message.replace(/\n/g, '<br>')}</div></div>
  </body>
</html>`;
}
