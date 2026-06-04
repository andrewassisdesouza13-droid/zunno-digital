# Clientes da Zunno.Digital

Cada cliente tem sua própria pasta isolada aqui dentro. O contexto estratégico de
marketing de cada um fica em `clientes/<cliente>/.agents/product-marketing.md` —
é o arquivo que as skills de marketing (ads, copy, social, etc.) leem automaticamente.

As skills ficam instaladas na raiz do repo (`zunno/.claude/skills` e
`zunno/.agents/skills`) e são compartilhadas por todos os clientes.

## Estrutura

```
clientes/
  personal-car/
    .agents/
      product-marketing.md   <- base estratégica deste cliente
  <proximo-cliente>/
    .agents/
      product-marketing.md
```

## Como adicionar um novo cliente

1. Abra o Claude Code com a pasta do cliente como diretório de trabalho:
   `clientes/<novo-cliente>/`
2. Rode `/product-marketing` — como não existe `product-marketing.md` ali,
   a skill cria um novo do zero (sem mexer nos outros clientes).
3. Para tarefas desse cliente (ads, social, copy...), trabalhe sempre a partir
   da pasta dele, para que o contexto certo seja carregado.

## Clientes ativos

- **personal-car** — loja de veículos seminovos em Ribeirão Preto/SP. (personalcarsrp.com.br · @personalcars_)
