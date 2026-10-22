# Central de Materiais Internos

Aplicação web que gera **assinaturas de e-mail** e **comunicados** padronizados
em PNG, prontos para usar no Outlook ou compartilhar. Desenvolvida para
padronizar a comunicação interna e eliminar a edição manual de imagens.

## Funcionalidades

- Assinatura de e-mail com preview em tempo real e dimensões fixas (533×133 px)
- Ajuste automático do tamanho da fonte para nomes e e-mails longos
- Máscara de telefone que aceita fixo e celular
- Comunicado com editor simples (negrito, vermelho, centralizado, listas)
- Exportação em PNG em alta resolução (3x na assinatura, 2x no comunicado)
- Funciona 100% no navegador: nenhum dado é enviado a servidor

## Como usar

Não precisa instalar nada. Baixe o repositório e abra o `index.html`
no navegador.

## Estrutura

```
index.html          tela de assinatura
comunicado.html     tela de comunicado
css/                base.css + um CSS por tela
js/                 shared.js + um JS por tela
```

## Tecnologias

- HTML, CSS e JavaScript puros (sem frameworks)
- [html2canvas](https://html2canvas.hertzen.com/) para gerar o PNG

## Decisões técnicas

- **Imagens em base64:** o html2canvas ignora imagens de arquivo quando a
  página é aberta via `file://`, então o logo fica embutido em `assets.js`.
- **Medição de texto via canvas:** evita que um e-mail longo reduza a fonte
  do nome, já que ambos compartilham a mesma coluna da tabela.
- **Código compartilhado em `window.App`:** toast, validação e exportação
  ficam em um só lugar, usados pelas duas telas.

## Autor

Maycon · [LinkedIn](https://www.linkedin.com/in/maycon-fernandes/) · [GitHub](https://github.com/maycon-23)
