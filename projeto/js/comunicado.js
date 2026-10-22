/* ============================================================
   comunicado.js — tela "Comunicado"
   Depende de: assets.js, shared.js (window.App)
   ============================================================ */
(function(){
  "use strict";

  // Atalhos para o que vem do shared.js
  var showToast = App.showToast;
  var setFieldState = App.setFieldState;

  /* ============ Comunicado: field refs ============ */
  var elComTipo = document.getElementById('input-com-tipo');
  var elComTitulo = document.getElementById('input-com-titulo');
  var elComCorpo = document.getElementById('input-com-corpo');
  var elComDepto = document.getElementById('input-com-depto');
  var btnFmtBold = document.getElementById('btn-fmt-bold');
  var btnFmtRed = document.getElementById('btn-fmt-red');
  var btnFmtCenter = document.getElementById('btn-fmt-center');

  var comTipoEl = document.getElementById('com-tipo');
  var comTituloEl = document.getElementById('com-titulo');
  var comCorpoEl = document.getElementById('com-corpo');
  var comDeptoEl = document.getElementById('com-depto');
  var comunicadoFrame = document.getElementById('comunicado-frame');
  var comunicadoScaleOuter = document.getElementById('comunicado-scale-outer');

  var btnBaixarComunicado = document.getElementById('btn-baixar-comunicado');

  /* ============ Comunicado: text parsing ============ */
  // User-typed text is escaped first (so stray < > & can never break the
  // markup), then a tiny markdown-like syntax is applied on top:
  // blank line = new paragraph, "**text**" = bold, "%%text%%" = red,
  // "- " = bullet list, "> " = centered paragraph.
  function escapeHtml(str){
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function formatInline(text){
    text = text.replace(/%%(.+?)%%/g, '<span class="com-red">$1</span>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return text;
  }
  function parseComBody(raw){
    var blocks = raw.split(/\n\s*\n/);
    var html = '';
    blocks.forEach(function(block){
      var lines = block.split('\n').map(function(l){ return l.trim(); }).filter(function(l){ return l.length > 0; });
      if (lines.length === 0) return;
      var isList = lines.every(function(l){ return /^[-•]\s+/.test(l); });
      var isCenter = !isList && lines.every(function(l){ return /^>\s+/.test(l); });
      if (isList){
        html += '<ul>' + lines.map(function(l){
          return '<li>' + formatInline(escapeHtml(l.replace(/^[-•]\s+/, ''))) + '</li>';
        }).join('') + '</ul>';
      } else if (isCenter){
        // Each Enter is a real line break here too — only a blank line
        // starts a new paragraph block.
        html += '<p class="com-body--center">' + lines.map(function(l){
          return formatInline(escapeHtml(l.replace(/^>\s+/, '')));
        }).join('<br>') + '</p>';
      } else {
        // Single Enter = visible line break (like Word's Shift+Enter);
        // a blank line is what actually starts a new paragraph block.
        html += '<p>' + lines.map(function(l){
          return formatInline(escapeHtml(l));
        }).join('<br>') + '</p>';
      }
    });
    return html || '<p></p>';
  }

  /* ============ Comunicado: formatting toolbar ============ */
  // Wraps (or unwraps, toggle-style) the current textarea selection with
  // marker characters, then re-fires 'input' so the preview updates via
  // the normal parseComBody() path — the toolbar is just a friendlier
  // way to produce the same **bold** / %%red%% markers a person could
  // still type by hand.
  function wrapSelection(el, before, after, placeholder){
    var start = el.selectionStart;
    var end = el.selectionEnd;
    var value = el.value;
    var selected = value.slice(start, end);
    var newValue, newStart, newEnd;

    var isWrapped = selected.length > before.length + after.length &&
      selected.slice(0, before.length) === before &&
      selected.slice(selected.length - after.length) === after;

    if (selected.length === 0){
      newValue = value.slice(0, start) + before + placeholder + after + value.slice(end);
      newStart = start + before.length;
      newEnd = newStart + placeholder.length;
    } else if (isWrapped){
      var inner = selected.slice(before.length, selected.length - after.length);
      newValue = value.slice(0, start) + inner + value.slice(end);
      newStart = start;
      newEnd = start + inner.length;
    } else {
      newValue = value.slice(0, start) + before + selected + after + value.slice(end);
      newStart = start + before.length;
      newEnd = newStart + selected.length;
    }

    el.value = newValue;
    el.focus();
    el.setSelectionRange(newStart, newEnd);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function toggleCenterLines(el){
    var start = el.selectionStart;
    var end = el.selectionEnd;
    var value = el.value;
    var lineStart = value.lastIndexOf('\n', start - 1) + 1;
    var lineEnd = value.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = value.length;

    var block = value.slice(lineStart, lineEnd);
    var lines = block.split('\n');
    var contentLines = lines.filter(function(l){ return l.trim() !== ''; });
    var alreadyCentered = contentLines.length > 0 && contentLines.every(function(l){ return /^>\s+/.test(l); });

    var newLines = lines.map(function(l){
      if (l.trim() === '') return l;
      return alreadyCentered ? l.replace(/^>\s+/, '') : (/^>\s+/.test(l) ? l : '> ' + l);
    });
    var newBlock = newLines.join('\n');
    var newValue = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);

    el.value = newValue;
    el.focus();
    el.setSelectionRange(lineStart, lineStart + newBlock.length);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  btnFmtBold.addEventListener('mousedown', function(e){ e.preventDefault(); });
  btnFmtRed.addEventListener('mousedown', function(e){ e.preventDefault(); });
  btnFmtCenter.addEventListener('mousedown', function(e){ e.preventDefault(); });
  btnFmtBold.addEventListener('click', function(){
    wrapSelection(elComCorpo, '**', '**', 'texto em negrito');
  });
  btnFmtRed.addEventListener('click', function(){
    wrapSelection(elComCorpo, '%%', '%%', 'texto em vermelho');
  });
  btnFmtCenter.addEventListener('click', function(){
    toggleCenterLines(elComCorpo);
  });

  /* ============ Comunicado: scale-to-fit preview ============ */
  // #comunicado-frame is always rendered at its natural 1100px width so
  // html2canvas exports a crisp, consistent file; on screen it's visually
  // shrunk with a CSS transform to fit the panel, using a wrapper sized to
  // match the scaled box so no blank space is left behind by the transform.
  function rescaleComunicado(){
    if (!comunicadoFrame || !comunicadoScaleOuter) return;
    var shell = comunicadoScaleOuter.parentElement;
    var availWidth = shell.clientWidth;
    if (availWidth <= 0) return; // panel has no layout yet — skip
    comunicadoFrame.style.transform = 'none';
    var naturalWidth = comunicadoFrame.offsetWidth || 1100;
    var naturalHeight = comunicadoFrame.offsetHeight;
    var scale = Math.min(1, availWidth / naturalWidth);
    comunicadoFrame.style.transform = 'scale(' + scale + ')';
    comunicadoScaleOuter.style.width = Math.round(naturalWidth * scale) + 'px';
    comunicadoScaleOuter.style.height = Math.round(naturalHeight * scale) + 'px';
  }
  window.addEventListener('resize', rescaleComunicado);
  // Imagens/fontes podem mudar a altura depois do primeiro desenho
  window.addEventListener('load', rescaleComunicado);

  /* ============ Comunicado: live preview ============ */
  function updateComunicadoPreview(){
    comTipoEl.textContent = (elComTipo.value.trim() || 'AVISO').toUpperCase();
    comTituloEl.textContent = (elComTitulo.value.trim() || 'Título do Comunicado').toUpperCase();
    comCorpoEl.innerHTML = parseComBody(
      elComCorpo.value.trim() || 'Escreva o corpo do comunicado ao lado — ele aparece aqui em tempo real.'
    );
    comDeptoEl.textContent = (elComDepto.value.trim() || 'Departamento').toUpperCase();
    rescaleComunicado();
  }

  /* ============ Comunicado: validation ============ */
  function validateComunicado(showErrors){
    var tipoOk = elComTipo.value.trim().length >= 2;
    var tituloOk = elComTitulo.value.trim().length >= 3;
    var corpoOk = elComCorpo.value.trim().length >= 10;
    var deptoOk = elComDepto.value.trim().length >= 2;
    if (showErrors){
      setFieldState(elComTipo, document.getElementById('error-com-tipo'), tipoOk);
      setFieldState(elComTitulo, document.getElementById('error-com-titulo'), tituloOk);
      setFieldState(elComCorpo, document.getElementById('error-com-corpo'), corpoOk);
      setFieldState(elComDepto, document.getElementById('error-com-depto'), deptoOk);
    }
    return tipoOk && tituloOk && corpoOk && deptoOk;
  }

  /* ============ Comunicado: download ============ */
  function suggestedComunicadoFileName(){
    var slug = App.slugify(elComTitulo.value);
    return 'comunicado' + (slug ? '-' + slug : '') + '.png';
  }

  function renderComunicadoCanvas(){
    // Always capture at natural (unscaled) size, regardless of how small
    // the on-screen preview is currently shrunk to fit the panel.
    var prevTransform = comunicadoFrame.style.transform;
    comunicadoFrame.style.transform = 'none';
    return App.ensureHtml2Canvas().then(function(){
      return html2canvas(comunicadoFrame, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });
    }).then(function(canvas){
      comunicadoFrame.style.transform = prevTransform;
      return canvas;
    }).catch(function(err){
      comunicadoFrame.style.transform = prevTransform;
      throw err;
    });
  }

  function handleBaixarComunicado(){
    if (!validateComunicado(true)){
      showToast('Preencha todos os campos obrigatórios.', true);
      return;
    }
    btnBaixarComunicado.disabled = true;
    var fileName = suggestedComunicadoFileName();

    renderComunicadoCanvas().then(function(canvas){
      return App.saveCanvasAsPng(
        canvas, fileName,
        'Comunicado salvo com sucesso!',
        'Comunicado baixado com sucesso!'
      );
    }).catch(App.showExportError).finally(function(){
      btnBaixarComunicado.disabled = false;
    });
  }

  /* ============ Comunicado: wire up events ============ */
  elComTipo.addEventListener('input', function(){
    updateComunicadoPreview();
    if (elComTipo.classList.contains('invalid')) validateComunicado(true);
  });
  elComTitulo.addEventListener('input', function(){
    updateComunicadoPreview();
    if (elComTitulo.classList.contains('invalid')) validateComunicado(true);
  });
  elComCorpo.addEventListener('input', function(){
    updateComunicadoPreview();
    if (elComCorpo.classList.contains('invalid')) validateComunicado(true);
  });
  elComDepto.addEventListener('input', function(){
    updateComunicadoPreview();
    if (elComDepto.classList.contains('invalid')) validateComunicado(true);
  });
  btnBaixarComunicado.addEventListener('click', handleBaixarComunicado);
  document.getElementById('comunicado-form').addEventListener('submit', function(e){
    e.preventDefault();
  });

  /* initial paint */
  updateComunicadoPreview();
})();
