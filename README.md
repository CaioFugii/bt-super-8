<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

API do **BT Super 8** — backend em [NestJS](https://github.com/nestjs/nest) para gestão de torneios Super 8 de beach tennis.

## Repositórios

| Projeto | Repositório |
| --- | --- |
| API | [https://github.com/CaioFugii/bt-super-8](https://github.com/CaioFugii/bt-super-8.git) |
| App mobile | [https://github.com/CaioFugii/bt-super-8-mobile](https://github.com/CaioFugii/bt-super-8-mobile.git) |

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deploy na Heroku

### Repositório só da API (`bt-super-8`)

Se o app Heroku aponta para o repositório da API (raiz = pasta `api/`), use o `Procfile` e o `heroku-postbuild` desta pasta. O comando `npm start` executa `node dist/main` (compilado no deploy).

### Monorepo (`bts8`)

Na raiz do monorepo, o `Procfile` executa `cd api && npm run start:prod`.

### Pré-requisitos

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
- Conta Heroku

### Primeiro deploy

```bash
# Na raiz do repositório
heroku login
heroku create seu-app-bts8
heroku addons:create heroku-postgresql:essential-0

heroku config:set \
  APP_BASE_URL=https://seu-app-bts8.herokuapp.com \
  JWT_SECRET="$(openssl rand -hex 32)" \
  JWT_EXPIRES_IN=7d \
  STORAGE_PROVIDER=cloudinary \
  CLOUDINARY_CLOUD_NAME=seu-cloud \
  CLOUDINARY_API_KEY=sua-key \
  CLOUDINARY_API_SECRET=seu-secret \
  CLOUDINARY_FOLDER=bts8

git push heroku main
```

O addon Postgres define `DATABASE_URL` automaticamente. As migrations rodam na subida (`DB_MIGRATIONS_RUN=true`).

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim (Heroku) | Injetada pelo Heroku Postgres |
| `JWT_SECRET` | Sim | Segredo do JWT |
| `APP_BASE_URL` | Sim | URL pública (`https://seu-app.herokuapp.com`) |
| `PORT` | Auto | Definida pela Heroku |
| `CLOUDINARY_*` | Não | Upload de imagens |
| `DB_MIGRATIONS_RUN` | Não | Default `true` |

### Comandos úteis

```bash
heroku logs --tail
heroku run bash -c "cd api && npm run migration:show"
heroku open
```

### Mobile apontando para produção

```env
EXPO_PUBLIC_API_URL=https://seu-app-bts8.herokuapp.com/api
```

### Deploy local (simular build Heroku)

```bash
npm run heroku-postbuild
cd api && npm run start:prod
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
