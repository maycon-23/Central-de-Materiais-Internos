# Central de Materiais Internos

Abra `index.html` com duplo clique (não precisa de servidor).

```
index.html          tela: Assinatura de E-mail
comunicado.html     tela: Comunicado
foto-whatsapp.html  tela: Foto do WhatsApp (foto dentro do template da empresa)
css/
  base.css          variáveis, header, abas, painéis, formulário, botões, toast
  assinatura.css    só da tela de assinatura
  comunicado.css    só da tela de comunicado
  foto-whatsapp.css só da tela de foto
js/
  assets.js         imagens em base64 (logo, ícones e template da foto)
  shared.js         toast, validação, exportação PNG (window.App)
  assinatura.js     lógica da tela de assinatura
  comunicado.js     lógica da tela de comunicado
  foto-whatsapp.js  lógica da tela de foto (canvas, arrastar, zoom)
```

## Criar uma nova tela
1. Copie `comunicado.html` -> `nova.html` e troque o conteúdo do `.tab-grid`.
2. Crie `css/nova.css` e `js/nova.js` (use `App.showToast`, `App.saveCanvasAsPng`...).
3. Adicione um `<a class="tab-link" href="nova.html">` no `<nav>` das páginas.

## Trocar o template da foto do WhatsApp
O template é um PNG quadrado com um círculo **transparente** no meio (a foto aparece por trás).
Se o novo template tiver outro tamanho ou círculo em outra posição, ajuste no topo de
`js/foto-whatsapp.js`: `TEMPLATE_SIZE` e `HOLE` (centro e raio do círculo, em pixels do PNG original),
e substitua `template` em `js/assets.js` pelo novo PNG em base64.
