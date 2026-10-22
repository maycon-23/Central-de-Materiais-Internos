/* ============================================================
   foto-whatsapp.js — tela "Foto do WhatsApp"
   Coloca a foto da pessoa dentro do template da empresa.
   Depende de: assets.js (template), shared.js (window.App)
   ============================================================ */
(function(){
  "use strict";

  var showToast = App.showToast;

  /* ============ Medidas ============ */
  var OUTPUT_SIZE = 1080;      // lado da foto final, em px (quadrada)
  var TEMPLATE_SIZE = 1667;    // lado do template original
  // Círculo transparente do template, medido no PNG original (1667px)
  var HOLE = { cx: 833.5, cy: 833.5, r: 649.5 };
  var BLEED = 3;               // a foto passa 3px do círculo (evita fresta na borda)
  var ZOOM_MIN = 1, ZOOM_MAX = 4;

  var K = OUTPUT_SIZE / TEMPLATE_SIZE;   // template original -> canvas
  var holeX = HOLE.cx * K, holeY = HOLE.cy * K;
  var holeR = HOLE.r * K;
  var coverR = (HOLE.r + BLEED) * K;     // raio que a foto precisa cobrir

  /* ============ Elementos ============ */
  var canvas = document.getElementById('foto-canvas');
  var ctx = canvas.getContext('2d');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  var shell = document.getElementById('foto-shell');
  var inputFoto = document.getElementById('input-foto');
  var btnEscolher = document.getElementById('btn-escolher');
  var btnEscolherText = document.getElementById('btn-escolher-text');
  var btnRemover = document.getElementById('btn-remover');
  var btnBaixar = document.getElementById('btn-baixar-foto');
  var zoomWrap = document.getElementById('zoom-wrap');
  var inputZoom = document.getElementById('input-zoom');
  var zoomValue = document.getElementById('zoom-value');

  /* ============ Estado ============ */
  // x, y = quanto o centro da foto está deslocado do centro do círculo (px do canvas)
  var state = { img: null, fileName: '', zoom: 1, x: 0, y: 0 };

  var templateImg = new Image();
  var templateReady = false;
  templateImg.onload = function(){ templateReady = true; draw(); };
  templateImg.src = window.ASSETS.template;

  /* ============ Desenho ============ */
  function coverScale(){
    // escala em que a foto cobre exatamente o círculo (zoom = 100%)
    var d = coverR * 2;
    return Math.max(d / state.img.naturalWidth, d / state.img.naturalHeight);
  }

  // Impede de arrastar a foto até aparecer fundo dentro do círculo
  function clampPan(){
    var s = coverScale() * state.zoom;
    var maxX = Math.max(0, state.img.naturalWidth * s / 2 - coverR);
    var maxY = Math.max(0, state.img.naturalHeight * s / 2 - coverR);
    state.x = Math.min(maxX, Math.max(-maxX, state.x));
    state.y = Math.min(maxY, Math.max(-maxY, state.y));
  }

  function drawPlaceholder(){
    ctx.fillStyle = '#ece8e3';
    ctx.beginPath();
    ctx.arc(holeX, holeY, holeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b6764';
    ctx.textAlign = 'center';
    ctx.font = '600 34px -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.fillText('Arraste uma foto aqui', holeX, holeY - 6);
    ctx.fillStyle = '#9c9894';
    ctx.font = '400 26px -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.fillText('ou clique para escolher', holeX, holeY + 36);
  }

  function draw(){
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    if (state.img){
      var s = coverScale() * state.zoom;
      var w = state.img.naturalWidth * s;
      var h = state.img.naturalHeight * s;
      ctx.drawImage(state.img, holeX + state.x - w / 2, holeY + state.y - h / 2, w, h);
    } else {
      drawPlaceholder();
    }

    // O template vai por cima: o círculo dele é transparente e mostra a foto
    if (templateReady) ctx.drawImage(templateImg, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  }

  // Durante o arraste, desenha no máximo uma vez por quadro
  var rafId = 0;
  function requestDraw(){
    if (rafId) return;
    rafId = requestAnimationFrame(function(){ rafId = 0; draw(); });
  }

  /* ============ Interface ============ */
  function updateUI(){
    var has = !!state.img;
    canvas.classList.toggle('has-photo', has);
    canvas.setAttribute('role', has ? 'img' : 'button');
    canvas.setAttribute('aria-label', has
      ? 'Foto dentro do template. Arraste ou use as setas para enquadrar, mais e menos para o zoom.'
      : 'Escolher uma foto');
    btnEscolherText.textContent = has ? 'Trocar foto' : 'Escolher foto';
    btnRemover.hidden = !has;
    inputZoom.disabled = !has;
    zoomWrap.classList.toggle('is-disabled', !has);
    inputZoom.value = Math.round(state.zoom * 100);
    zoomValue.textContent = Math.round(state.zoom * 100) + '%';
  }

  function setZoom(value){
    if (!state.img) return;
    var next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
    var ratio = next / state.zoom;
    // mantém o ponto que está no centro do círculo parado enquanto dá zoom
    state.x *= ratio;
    state.y *= ratio;
    state.zoom = next;
    clampPan();
    updateUI();
    requestDraw();
  }

  /* ============ Carregar foto ============ */
  function loadFile(file){
    if (!file) return;
    if (!/^image\//.test(file.type)){
      showToast('Escolha um arquivo de imagem (JPG ou PNG).', true);
      return;
    }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function(){
      URL.revokeObjectURL(url);
      state.img = img;
      state.fileName = file.name;
      state.zoom = 1;
      state.x = 0;
      state.y = 0;
      updateUI();
      draw();
    };
    img.onerror = function(){
      URL.revokeObjectURL(url);
      // ex.: HEIC do iPhone, que o navegador não abre
      showToast('Não foi possível abrir essa imagem. Tente um arquivo JPG ou PNG.', true);
    };
    img.src = url;
  }

  function removePhoto(){
    state.img = null;
    state.fileName = '';
    state.zoom = 1;
    state.x = 0;
    state.y = 0;
    updateUI();
    draw();
  }

  btnEscolher.addEventListener('click', function(){ inputFoto.click(); });
  btnRemover.addEventListener('click', removePhoto);
  inputFoto.addEventListener('change', function(){
    loadFile(inputFoto.files[0]);
    inputFoto.value = ''; // permite escolher o mesmo arquivo de novo
  });

  /* ============ Arrastar e soltar um arquivo na pré-visualização ============ */
  ['dragenter', 'dragover'].forEach(function(type){
    shell.addEventListener(type, function(e){
      e.preventDefault();
      shell.classList.add('is-dragover');
    });
  });
  shell.addEventListener('dragleave', function(e){
    if (!shell.contains(e.relatedTarget)) shell.classList.remove('is-dragover');
  });
  shell.addEventListener('drop', function(e){
    e.preventDefault();
    shell.classList.remove('is-dragover');
    loadFile(e.dataTransfer.files[0]);
  });

  /* ============ Enquadrar: arrastar, roda do mouse, teclado, slider ============ */
  var drag = null;
  canvas.addEventListener('pointerdown', function(e){
    if (!state.img) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove', function(e){
    if (!drag || e.pointerId !== drag.id) return;
    var toCanvas = canvas.width / canvas.getBoundingClientRect().width;
    state.x += (e.clientX - drag.x) * toCanvas;
    state.y += (e.clientY - drag.y) * toCanvas;
    drag.x = e.clientX;
    drag.y = e.clientY;
    clampPan();
    requestDraw();
  });
  function endDrag(e){
    if (drag && e.pointerId === drag.id){
      drag = null;
      canvas.classList.remove('dragging');
    }
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('click', function(){
    if (!state.img) inputFoto.click();
  });

  canvas.addEventListener('wheel', function(e){
    if (!state.img) return;
    e.preventDefault();
    setZoom(state.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
  }, { passive: false });

  canvas.addEventListener('keydown', function(e){
    if (!state.img){
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); inputFoto.click(); }
      return;
    }
    var step = 14;
    var handled = true;
    if (e.key === 'ArrowLeft') state.x -= step;
    else if (e.key === 'ArrowRight') state.x += step;
    else if (e.key === 'ArrowUp') state.y -= step;
    else if (e.key === 'ArrowDown') state.y += step;
    else if (e.key === '+' || e.key === '=') setZoom(state.zoom + 0.1);
    else if (e.key === '-') setZoom(state.zoom - 0.1);
    else handled = false;
    if (!handled) return;
    e.preventDefault();
    clampPan();
    requestDraw();
  });

  inputZoom.addEventListener('input', function(){
    setZoom(inputZoom.value / 100);
  });

  /* ============ Baixar ============ */
  // "IMG_2034.JPG" -> "foto-whatsapp-img-2034.png"
  function suggestedFileName(){
    var base = state.fileName.replace(/\.[^.]+$/, '');
    var slug = App.slugify(base);
    return 'foto-whatsapp' + (slug ? '-' + slug : '') + '.png';
  }

  btnBaixar.addEventListener('click', function(){
    if (!state.img){
      showToast('Escolha uma foto antes de baixar.', true);
      return;
    }
    btnBaixar.disabled = true;
    draw(); // garante o quadro mais recente antes de exportar
    App.saveCanvasAsPng(
      canvas, suggestedFileName(),
      'Foto salva com sucesso!',
      'Foto baixada com sucesso!'
    ).catch(App.showExportError).finally(function(){
      btnBaixar.disabled = false;
    });
  });

  /* initial paint */
  updateUI();
  draw();
})();
