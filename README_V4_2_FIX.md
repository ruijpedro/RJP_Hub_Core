# RJP Hub Core V4.2

Correção da página em branco no GitHub Pages.

## Causa
A V4.1 carregava `src/App.jsx` diretamente no `index.html`, mas não existia um ponto de entrada React que executasse `ReactDOM.createRoot(...).render(<App />)`. O bundle era publicado, mas a interface nunca era montada.

## Correção
- criado `src/main.jsx`;
- `index.html` passa a carregar `src/main.jsx`;
- caminhos compatíveis com GitHub Pages / subpasta;
- favicon relativo;
- mantém Node 22 e Capacitor 6.2.0.

Depois de substituir o projeto no GitHub, execute novamente **Build WebApp**.
