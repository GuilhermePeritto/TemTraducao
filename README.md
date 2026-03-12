# TemTradução

Extensão Chrome com `React + Vite + Tailwind + componentes no estilo shadcn` para traduzir texto selecionado diretamente na página.

## O que ela faz

- Abre um popup ao clicar no ícone da extensão.
- Permite habilitar ou desabilitar a tradução inline.
- Permite escolher o idioma de destino.
- Ao selecionar um texto ou dar duplo clique, mostra um balão abaixo da seleção com a tradução.
- Usa o endpoint público do Google Translate para obter a tradução automaticamente.

## Desenvolvimento

```bash
npm install
npm run build
```

## Como carregar no Chrome

1. Abra `chrome://extensions`.
2. Ative o modo desenvolvedor.
3. Clique em `Load unpacked`.
4. Selecione a pasta `dist`.

## Observação

O projeto usa o endpoint público `translate.googleapis.com`, sem chave. Se você quiser trocar para a API oficial do Google Cloud Translation depois, a lógica central está em `src/lib/translate.ts`.
