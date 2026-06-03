# Diagonal

App de cultura pessoal (arte, literatura, história, cinema, música) feito para a Mari,
para substituir o scroll das redes sociais por conteúdo curado.

## Stack
- React + Vite
- Deploy: Vercel (deploy automático a cada push na branch main)
- Repositório GitHub: mariaeangela/mari-app

## Rodar localmente
```
npm install
npm run dev
```

## Estrutura
- `src/App.jsx` — telas e navegação (Hoje / Explorar / Salvos / Sobre)
- `src/Login.jsx` — tela de senha sazonal (senha: ts1312)
- `src/ContentCard.jsx` — card de conteúdo; busca imagens de arte na API aberta do Metropolitan Museum
- `src/contentLibrary.js` — todo o conteúdo curado + rotação de edições (6h e 14h)
- `src/config.js` — temas de estação (legado)

## Decisões importantes
- Conteúdo é fixo/curado (sem custo de API). A edição muda às 6h e às 14h.
- Imagens vêm da API aberta do Met Museum (domínio público), por ID com fallback por nome.
- Editar arquivos e dar commit na main republica automaticamente na Vercel.
