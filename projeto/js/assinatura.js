/* ============================================================
   assinatura.js — tela "Assinatura de E-mail"
   Depende de: assets.js, shared.js (window.App)
   ============================================================ */
(function(){
  "use strict";

  // Atalhos para o que vem do shared.js
  var showToast = App.showToast;
  var setFieldState = App.setFieldState;

  /* ============ Field refs ============ */
  var elNome = document.getElementById('input-nome');
  var elCargo = document.getElementById('input-cargo');
  var elTelefone = document.getElementById('input-telefone');
  var elEmail = document.getElementById('input-email');

  var sigNome = document.getElementById('sig-nome');
  var sigCargo = document.getElementById('sig-cargo');
  var sigTelefone = document.getElementById('sig-telefone');
  var sigEmail = document.getElementById('sig-email');
  var signatureFrame = document.getElementById('signature-frame');

  var btnBaixar = document.getElementById('btn-baixar');

  /* ============ Utils: phone mask ============ */
  // Detects fixed-line (8-digit local number) vs mobile (9-digit local
  // number, starting with 9) automatically as the person types — the "9"
  // is never forced, so older fixed numbers stay valid.
  function formatTelefone(raw){
    var digits = raw.replace(/\D/g, '').slice(0, 11);
    var ddd = digits.slice(0, 2);
    var local = digits.slice(2);

    if (digits.length <= 2) return ddd;

    if (local.length <= 8){
      // Fixed-line shape: DD XXXX-XXXX
      var p1 = local.slice(0, 4);
      var p2 = local.slice(4, 8);
      return ddd + ' ' + p1 + (p2 ? '-' + p2 : '');
    }

    // Mobile shape (9th local digit present): DD 9 XXXX-XXXX
    var nine = local.slice(0, 1);
    var p1m = local.slice(1, 5);
    var p2m = local.slice(5, 9);
    return ddd + ' ' + nine + ' ' + p1m + (p2m ? '-' + p2m : '');
  }
  function isTelefoneValido(raw){
    var digits = raw.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
  }
  function isEmailValido(raw){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
  }

  /* ============ SignatureGenerator: keeps preview in sync ============ */
  // Text column budget inside the locked 533x133 frame (533 - logo col - paddings).
  var TEXT_COLUMN_MAX_WIDTH = 401;

  // Measures text width with canvas instead of the DOM (el.scrollWidth),
  // because name/cargo/contact share one table column: the browser forces
  // every row in that column to the same rendered width, so measuring via
  // scrollWidth made a long e-mail shrink the name too, even though the
  // name text itself was short enough to fit. Canvas measurement is
  // independent of that table layout quirk.
  var measureCanvas = document.createElement('canvas');
  var measureCtx = measureCanvas.getContext('2d');
  function textWidth(text, fontSize, fontFamily){
    measureCtx.font = fontSize + 'px ' + fontFamily;
    return measureCtx.measureText(text).width;
  }

  function shrinkTextToFit(el, fontFamily, maxWidth, maxSize, minSize){
    var size = maxSize;
    while (textWidth(el.textContent, size, fontFamily) > maxWidth && size > minSize){
      size -= 1;
    }
    el.style.fontSize = size + 'px';
    return size;
  }

  // Contact row shrinks telefone + e-mail together (same font-size) so they
  // stay visually matched, leaving room for the two fixed-size icons.
  var CONTACT_ICONS_AND_GAPS = 24 + 6 + 16 + 24 + 6; // icon+gap, gap, icon+gap
  function shrinkContactToFit(maxWidth, maxSize, minSize){
    var size = maxSize;
    var fontFamily = "'Arial Narrow', Arial, sans-serif";
    var budget = maxWidth - CONTACT_ICONS_AND_GAPS;
    while (size > minSize){
      var combined = textWidth(sigTelefone.textContent, size, fontFamily) + textWidth(sigEmail.textContent, size, fontFamily);
      if (combined <= budget) break;
      size -= 1;
    }
    sigTelefone.style.fontSize = size + 'px';
    sigEmail.style.fontSize = size + 'px';
  }

  function updatePreview(){
    sigNome.textContent = (elNome.value.trim() || 'Nome Completo').toUpperCase();
    sigCargo.textContent = elCargo.value.trim() || 'Setor / Cargo';
    sigTelefone.textContent = '+55 ' + (elTelefone.value.trim() || '34 9 9999-9999');
    sigEmail.textContent = elEmail.value.trim() || 'nome@guaranamineiro.com.br';

    // Auto-shrink long names/emails so they stay inside the locked
    // 533x133 frame instead of being abruptly clipped by overflow:hidden.
    // Each element is measured independently (see textWidth above) so a
    // long e-mail no longer shrinks the name.
    shrinkTextToFit(sigNome, "'Haettenschweiler',Impact,'Arial Narrow',sans-serif", TEXT_COLUMN_MAX_WIDTH, 34, 20);
    shrinkTextToFit(sigCargo, "'Arial Narrow', Arial, sans-serif", TEXT_COLUMN_MAX_WIDTH, 19, 13);
    shrinkContactToFit(TEXT_COLUMN_MAX_WIDTH, 18, 12);
  }

  /* ============ Validation ============ */
  function validateAll(showErrors){
    var nomeOk = elNome.value.trim().length >= 3;
    var cargoOk = elCargo.value.trim().length >= 2;
    var telOk = isTelefoneValido(elTelefone.value);
    var emailOk = isEmailValido(elEmail.value);

    if (showErrors){
      setFieldState(elNome, document.getElementById('error-nome'), nomeOk);
      setFieldState(elCargo, document.getElementById('error-cargo'), cargoOk);
      setFieldState(elTelefone, document.getElementById('error-telefone'), telOk);
      setFieldState(elEmail, document.getElementById('error-email'), emailOk);
    }
    return nomeOk && cargoOk && telOk && emailOk;
  }

  /* ============ PNG rendering ============ */
  // Renders at a supersampled scale for crisp, high-resolution output.
  // The file keeps the exact 533x133 aspect ratio (4.008:1) so it can be
  // dropped straight into Outlook and resized to 533x133 there without
  // looking pixelated on modern high-DPI screens.
  var SIGNATURE_WIDTH = 533;
  var SIGNATURE_HEIGHT = 133;
  var EXPORT_SCALE = 3; // 3x pixel density → 1599x399px file

  function renderSignatureCanvas(){
    return App.ensureHtml2Canvas().then(function(){
      return html2canvas(signatureFrame, {
        backgroundColor: '#ffffff',
        scale: EXPORT_SCALE,
        width: SIGNATURE_WIDTH,
        height: SIGNATURE_HEIGHT,
        useCORS: true
      });
    });
  }

  /* ============ DownloadButton ============ */
  // Turns "Pedro Oliveira" into "assinatura-pedro-oliveira.png" so the
  // suggested filename is meaningful instead of a generic "assinatura.png".
  function suggestedFileName(){
    var slug = App.slugify(elNome.value);
    return 'assinatura' + (slug ? '-' + slug : '') + '.png';
  }

  function handleBaixar(){
    if (!validateAll(true)){
      showToast('Preencha todos os campos obrigatórios.', true);
      return;
    }
    btnBaixar.disabled = true;
    var fileName = suggestedFileName();

    renderSignatureCanvas().then(function(canvas){
      return App.saveCanvasAsPng(
        canvas, fileName,
        'Assinatura salva com sucesso!',
        'Assinatura baixada com sucesso!'
      );
    }).catch(App.showExportError).finally(function(){
      btnBaixar.disabled = false;
    });
  }

  /* ============ Wire up events ============ */
  elNome.addEventListener('input', function(){
    updatePreview();
    if (elNome.classList.contains('invalid')) validateAll(true);
  });
  elCargo.addEventListener('input', function(){
    updatePreview();
    if (elCargo.classList.contains('invalid')) validateAll(true);
  });
  elTelefone.addEventListener('input', function(e){
    var pos = e.target.selectionStart;
    var before = e.target.value.length;
    e.target.value = formatTelefone(e.target.value);
    var after = e.target.value.length;
    e.target.selectionStart = e.target.selectionEnd = pos + (after - before);
    updatePreview();
    if (elTelefone.classList.contains('invalid')) validateAll(true);
  });
  elEmail.addEventListener('input', function(){
    updatePreview();
    if (elEmail.classList.contains('invalid')) validateAll(true);
  });

  btnBaixar.addEventListener('click', handleBaixar);

  document.getElementById('signature-form').addEventListener('submit', function(e){
    e.preventDefault();
  });

  /* initial paint */
  updatePreview();
})();
