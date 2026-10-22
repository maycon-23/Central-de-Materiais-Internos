/* ============================================================
   shared.js — código usado por TODAS as telas
   Tudo que for compartilhado fica pendurado em window.App.
   Carregue depois de assets.js e antes do script da tela.
   ============================================================ */
(function(){
  "use strict";
  var App = window.App = window.App || {};

  /* ============ html2canvas (CDN com fallback) ============ */
  // Primary CDN, with a fallback to a second CDN in case cdnjs.cloudflare.com
  // specifically is blocked by a network/firewall (common on some corporate
  // networks) but other CDNs are reachable.
  // Só as telas que geram imagem via html2canvas chamam App.loadHtml2Canvas()
  // (assinatura e comunicado). Telas que não usam a biblioteca nem a baixam.
  var html2canvasRequested = false;
  App.loadHtml2Canvas = function(){
    if (html2canvasRequested || typeof html2canvas !== 'undefined') return;
    html2canvasRequested = true;
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onerror = function(){
      var fallback = document.createElement('script');
      fallback.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      document.head.appendChild(fallback);
    };
    document.head.appendChild(s);
  };

  /* ============ Imagens embutidas ============ */
  // <img data-asset="logo"> recebe o base64 definido em assets.js
  Array.prototype.forEach.call(document.querySelectorAll('img[data-asset]'), function(img){
    var src = window.ASSETS && window.ASSETS[img.getAttribute('data-asset')];
    if (src) img.src = src;
  });

  /* ============ Toast ============ */
  var toast = document.getElementById('toast');
  var toastText = document.getElementById('toast-text');
  var toastTimer = null;
  App.showToast = function(message, isError){
    toastText.textContent = message;
    toast.classList.toggle('error', !!isError);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){
      toast.classList.remove('show');
    }, 2600);
  };

  /* ============ Validação: marca/desmarca campo inválido ============ */
  App.setFieldState = function(input, errorEl, valid){
    input.classList.toggle('invalid', !valid);
    errorEl.classList.toggle('show', !valid);
  };

  /* ============ Nome de arquivo ============ */
  // "Pedro Oliveira" -> "pedro-oliveira" (sem acentos, só a-z, 0-9 e hífen)
  App.slugify = function(text){
    return text.trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  /* ============ Exportação em PNG ============ */
  // html2canvas loads from a CDN (see the loader above), so on
  // first click it may not be ready yet — or, on a restrictive network, it
  // may never load. This waits briefly for it before giving up, so the
  // person gets one clear, actionable error instead of a silent failure.
  App.ensureHtml2Canvas = function(){
    App.loadHtml2Canvas();
    if (typeof html2canvas !== 'undefined') return Promise.resolve();
    return new Promise(function(resolve, reject){
      var attempts = 0;
      var check = setInterval(function(){
        attempts++;
        if (typeof html2canvas !== 'undefined'){
          clearInterval(check);
          resolve();
        } else if (attempts > 25){ // ~5s
          clearInterval(check);
          reject(new Error('HTML2CANVAS_UNAVAILABLE'));
        }
      }, 200);
    });
  };

  App.canvasToBlob = function(canvas){
    return new Promise(function(resolve){
      canvas.toBlob(function(blob){ resolve(blob); }, 'image/png');
    });
  };

  // Plain-anchor download — used directly on browsers without the File
  // System Access API, and as a fallback when showSaveFilePicker exists
  // but can't actually be used (e.g. blocked inside a cross-origin iframe
  // preview, which throws a SecurityError rather than just being undefined).
  App.downloadViaAnchor = function(canvas, fileName, successMessage){
    var link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    App.showToast(successMessage);
  };

  // Salva o canvas como PNG.
  // Chrome/Edge: abre o "Salvar como" nativo (a pessoa escolhe nome e pasta).
  // Outros navegadores (ou se o picker não puder ser usado): download direto.
  App.saveCanvasAsPng = function(canvas, fileName, savedMessage, downloadedMessage){
    if (window.showSaveFilePicker){
      return App.canvasToBlob(canvas).then(function(blob){
        return window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Imagem PNG', accept: { 'image/png': ['.png'] } }]
        }).then(function(handle){
          return handle.createWritable().then(function(writable){
            return writable.write(blob).then(function(){ return writable.close(); });
          });
        }).then(function(){
          App.showToast(savedMessage);
        }).catch(function(err){
          if (err && err.name === 'AbortError') return; // person cancelled the dialog
          // Picker exists but couldn't actually be used (e.g. this page is
          // embedded in a cross-origin preview iframe) — don't fail, just
          // fall back to a plain download instead.
          console.warn('showSaveFilePicker unavailable, falling back:', err);
          App.downloadViaAnchor(canvas, fileName, downloadedMessage);
        });
      });
    }
    App.downloadViaAnchor(canvas, fileName, downloadedMessage);
    return Promise.resolve();
  };

  // Mensagem de erro padrão para qualquer falha na geração do PNG
  App.showExportError = function(err){
    console.error(err);
    if (err && err.message === 'HTML2CANVAS_UNAVAILABLE'){
      App.showToast('Não foi possível carregar a ferramenta de geração de imagem. Verifique sua conexão ou se a rede bloqueia cdnjs.cloudflare.com / cdn.jsdelivr.net.', true);
    } else {
      App.showToast('Não foi possível gerar o arquivo.', true);
    }
  };
})();
