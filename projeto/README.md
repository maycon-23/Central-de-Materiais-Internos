# Central de Materiais Internos

Abra `index.html` com duplo clique (não precisa de servidor).

```
index.html          tela: Assinatura de E-mail
comunicado.html     tela: Comunicado
css/
  base.css          variáveis, header, abas, painéis, formulário, botões, toast
  assinatura.css    só da tela de assinatura
  comunicado.css    só da tela de comunicado
js/
  assets.js         imagens em base64 (logo e ícones)
  shared.js         toast, validação, exportação PNG (window.App)
  assinatura.js     lógica da tela de assinatura
  comunicado.js     lógica da tela de comunicado
```

## Criar uma nova tela
1. Copie `comunicado.html` -> `nova.html` e troque o conteúdo do `.tab-grid`.
2. Crie `css/nova.css` e `js/nova.js` (use `App.showToast`, `App.saveCanvasAsPng`...).
3. Adicione um `<a class="tab-link" href="nova.html">` no `<nav>` das páginas.
