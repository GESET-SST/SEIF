/* =============================================================
   INTERAÇÕES DO MANUAL
   Mesma base do portfólio: JavaScript puro. Cada bloco abaixo é
   independente: se um elemento não existir na página, o bloco
   simplesmente não faz nada.
   ============================================================= */
(function () {
  'use strict';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  document.documentElement.classList.remove('no-js');

  /* -----------------------------------------------------------
     Um único "relógio" de rolagem: várias animações dependem da
     posição da página, então agrupamos todas em um só
     requestAnimationFrame por quadro (mais leve que N listeners).
     ----------------------------------------------------------- */
  const scrollJobs = [];
  let ticking = false;
  function tick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; scrollJobs.forEach(job => job()); });
  }
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick);

  document.addEventListener('DOMContentLoaded', () => {
    palco();
    aplicarImagens();
    entrada();
    barraSuperior();
    capitulos();
    numerosEmContorno();
    marcasNaBarra();
    topo();
    passos();
    inclinar();
    busca();
    ampliar();
    videos();
    tick();
  });

  /* 0b. PALCO DOS PRINTS (computador)
     Em telas largas, os prints de cada tema ficam num quadro fixo ao lado do texto
     e trocam conforme o passo que está sendo lido. No celular, nada muda. */
  function palco() {
    const largo = matchMedia('(min-width: 981px)');
    $$('.steps').forEach(steps => {
      const itens = $$('.step', steps);
      if (!itens.length) return;
      const col = document.createElement('div');
      col.className = 'stage-col'; col.setAttribute('aria-hidden', 'true');
      const stage = document.createElement('div');
      stage.className = 'stage';
      itens.forEach((li, i) => {
        const fig = li.querySelector(':scope > .shot, :scope > .shots');
        if (!fig) return;
        const q = document.createElement('div');
        q.className = 'stage__item' + (i === 0 ? ' on' : '');
        q.innerHTML = '<p class="stage__tag">Passo ' + li.dataset.code + '</p>';
        const c = fig.cloneNode(true);
        c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
        c.querySelectorAll('button').forEach(b => b.tabIndex = -1);
        q.append(c);
        li._palco = q;
        stage.append(q);
      });
      col.append(stage);
      steps.append(col);
      steps.classList.add('has-stage');
      let atual = itens[0];
      scrollJobs.push(() => {
        if (!largo.matches) return;
        const lim = Math.min(innerHeight * 0.5, (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar')) || 64) + 160);   // linha do topo do print
        let a = itens[0];
        itens.forEach(li => { if (li.getBoundingClientRect().top < lim) a = li; });
        if (steps.getBoundingClientRect().bottom < innerHeight * 0.6) a = itens[itens.length - 1];   // fim do tema: mostra o último print
        if (a !== atual && a._palco) {
          if (atual && atual._palco) atual._palco.classList.remove('on');
          a._palco.classList.add('on'); atual = a;
        }
      });
    });
  }

  /* 0. IMAGENS
     O caminho de cada captura fica em window.IMAGENS (no fim da página),
     para o manual funcionar como um único index.html, até offline.
     Só decodificamos cada imagem quando ela se aproxima da tela.  */
  function aplicarImagens() {
    const mapa = window.IMAGENS || {};
    const imgs = $$('img[data-img]');
    const carregar = img => { if (mapa[img.dataset.img]) img.src = mapa[img.dataset.img]; };
    if (!('IntersectionObserver' in window)) { imgs.forEach(carregar); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { carregar(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '900px 0px' });
    imgs.forEach(img => (img.hasAttribute('data-now') ? carregar(img) : io.observe(img)));
    // Na impressão, todas as imagens precisam estar carregadas
    addEventListener('beforeprint', () => imgs.forEach(carregar));
    // No celular não existe "clicar": a legenda acompanha o aparelho
    if (!finePointer) $$('.shot figcaption').forEach(f => { f.lastChild.textContent = 'Toque para ampliar'; });
  }

  /* 1. ENTRADA DOS ELEMENTOS AO ROLAR */
  function entrada() {
    const els = $$('.up');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el, i) => { el.style.transitionDelay = (0.05 * (i % 4)) + 's'; io.observe(el); });
  }

  /* 2. BARRA SUPERIOR: estado ao rolar, progresso de leitura e menu no celular */
  function barraSuperior() {
    const bar = $('.bar');
    if (!bar) return;
    scrollJobs.push(() => {
      const y = scrollY;
      const total = document.documentElement.scrollHeight - innerHeight;
      bar.classList.toggle('scrolled', y > 40);
      bar.style.setProperty('--p', total > 0 ? (y / total).toFixed(4) : 0);
    });
    const btn = $('.bar__menu'), nav = $('.bar__nav');
    btn.addEventListener('click', () => {
      const aberto = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', aberto);
    });
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* 3. CAPÍTULO ATUAL: marca a seção visível na barra e na lateral */
  function capitulos() {
    const secoes = $$('main > section[id]');
    const links = $$('.chapters a, .bar__nav a');
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const alvo = '#' + e.target.id;
        links.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === alvo ? 'true' : 'false'));
      });
    }, { rootMargin: '-45% 0px -54% 0px' });
    secoes.forEach(s => io.observe(s));
  }

  /* 4. NÚMERO GIGANTE do capítulo, que se preenche com a rolagem */
  function numerosEmContorno() {
    const numeros = $$('.outline-word');
    if (reduce) { numeros.forEach(p => p.style.setProperty('--fill', '100%')); return; }
    scrollJobs.push(() => {
      const vh = innerHeight;
      let m = 1;                                   // quanto as marcas da barra estão cheias
      numeros.forEach(p => {
        const r = p.getBoundingClientRect();
        const progresso = clamp((vh * 0.92 - r.top) / (vh * 0.55));
        p.style.setProperty('--fill', (progresso * 100).toFixed(1) + '%');
        if (r.top > vh * 0.92) m = Math.min(m, clamp((r.top - vh * 0.92) / (vh * 0.16)));   // esvaziam pouco antes de o tema entrar...
        else if (progresso < 1) m = Math.min(m, progresso);                                 // ...e enchem junto com ele
      });
      pintarMarcas(m);
    });
  }

  /* 4b. MARCAS NA BARRA: SEIF, SESI e sesi+saúde
     O desenho de cada marca vem da imagem guardada em window.IMAGENS (usada como máscara).
     pintarMarcas(p) enche as três em sequência, da esquerda para a direita: p = 0 vazias, p = 1 cheias.
     Quem chama é a rolagem dos temas (bloco 4): assim as marcas enchem junto com o número e o título. */
  let marcas = [];
  let marcasAbrindo = false;
  const encherMarcas = p => marcas.forEach((el, i) => el.style.setProperty('--fill', (clamp((p - i * 0.27) / 0.46) * 100).toFixed(1) + '%'));
  function pintarMarcas(p) { if (!marcasAbrindo) encherMarcas(p); }
  function marcasNaBarra() {
    const mapa = window.IMAGENS || {};
    marcas = $$('.marks .lg');
    marcas.forEach(el => {
      const u = mapa[el.dataset.lg];
      if (u) { el.style.setProperty('--m', 'url("' + new URL(u, document.baseURI).href + '")'); el.classList.add('ok'); }
    });
    if (reduce || !marcas.length) return;
    // uma passada ao abrir a página, para a interação se apresentar
    marcasAbrindo = true;
    encherMarcas(0);
    const t0 = performance.now();
    const passo = t => {
      const k = clamp((t - t0 - 300) / 1300);
      encherMarcas(1 - Math.pow(1 - k, 3));
      if (k < 1) requestAnimationFrame(passo); else { marcasAbrindo = false; tick(); }
    };
    requestAnimationFrame(passo);
  }

  /* 5. TOPO: título palavra a palavra + telas com parallax no mouse */
  function topo() {
    const h = $('.hero');
    if (!h) return;
    requestAnimationFrame(() => {
      $$('.rv > span', h).forEach((el, i) => { el.style.transitionDelay = (0.07 * i + 0.15) + 's'; });
      h.classList.add('is-in');
    });
    if (reduce) return;

    const art = $('.art', h);
    if (!art) return;
    const camadas = $$('.layer', art);

    // Rolagem: a arte sobe um pouco mais devagar que a página
    scrollJobs.push(() => {
      const y = scrollY;
      if (y < innerHeight * 1.2) art.style.transform = `translate3d(0, ${(y * 0.1).toFixed(1)}px, 0)`;
    });

    if (!finePointer) return;
    // Mouse: cada camada tem uma "profundidade" (data-depth).
    // Quanto maior, mais ela se desloca -> sensação de 3D.
    let alvoX = 0, alvoY = 0, x = 0, y = 0, raf = 0;
    function passo() {
      x += (alvoX - x) * 0.08;
      y += (alvoY - y) * 0.08;
      camadas.forEach(c => {
        const d = parseFloat(c.dataset.depth || 1);
        c.style.transform = `translate3d(${(x * d * 10).toFixed(1)}px, ${(y * d * 8).toFixed(1)}px, 0)`;
      });
      raf = (Math.abs(alvoX - x) > 0.001 || Math.abs(alvoY - y) > 0.001) ? requestAnimationFrame(passo) : 0;
    }
    h.addEventListener('pointermove', e => {
      const r = h.getBoundingClientRect();
      alvoX = ((e.clientX - r.left) / r.width) * 2 - 1;
      alvoY = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(passo);
    });
    h.addEventListener('pointerleave', () => { alvoX = 0; alvoY = 0; if (!raf) raf = requestAnimationFrame(passo); });
  }

  /* 6. PASSO A PASSO (a linha do tempo do portfólio, uma por capítulo)
     A linha é desenhada conforme a rolagem e cada passo que já
     passou do meio da tela ganha a marca verde.                   */
  function passos() {
    $$('.steps').forEach(lista => {
      const nos = $$('.step', lista), linha = $('.steps__line', lista);
      scrollJobs.push(() => {
        const meio = innerHeight * 0.55;
        const r = lista.getBoundingClientRect();
        if (linha) linha.style.setProperty('--p', clamp((meio - r.top) / r.height).toFixed(4));
        nos.forEach(n => n.classList.toggle('passed', n.getBoundingClientRect().top < meio));
      });
    });
  }

  /* 7. INCLINAÇÃO 3D suave da captura ao passar o mouse */
  function inclinar() {
    if (!finePointer || reduce) return;
    $$('.shot').forEach(m => {
      const t = $('.tilt', m);
      m.addEventListener('pointermove', e => {
        const r = t.getBoundingClientRect();
        const px = clamp((e.clientX - r.left) / r.width), py = clamp((e.clientY - r.top) / r.height);
        t.style.transform = `rotateY(${((px - 0.5) * 6).toFixed(2)}deg) rotateX(${((0.5 - py) * 4).toFixed(2)}deg)`;
        t.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        t.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      m.addEventListener('pointerleave', () => { t.style.transform = ''; });
    });
  }

  /* 8. BUSCA: "o que você precisa fazer?"
     O índice é montado a partir da própria página (título, texto e
     palavras-chave de cada passo). Ignora acentos e maiúsculas:
     "funcionario" encontra "funcionário".                         */
  function busca() {
    const dlg = $('#busca');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    const campo = $('input', dlg), lista = $('.palette__res', dlg);
    const normal = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    const indice = $$('.step').map(s => {
      const titulo = $('h3', s).textContent.trim();
      const cap = s.closest('section').dataset.title;
      return {
        el: s, codigo: s.dataset.code, titulo, cap,
        wTitulo: normal(titulo).split(/[^a-z0-9.]+/).filter(Boolean),
        wTudo: normal(s.dataset.code + ' ' + titulo + ' ' + s.textContent + ' ' + (s.dataset.k || '') + ' ' + cap).split(/[^a-z0-9.]+/).filter(Boolean),
        tTitulo: normal(titulo),
        tTudo: normal(s.dataset.code + ' ' + titulo + ' ' + s.textContent + ' ' + (s.dataset.k || '') + ' ' + cap)
      };
    });

    // busca "por letra de música": aceita a pergunta do jeito que a pessoa escreve
    const PARADAS = new Set('a o as os um uma uns umas de do da dos das no na nos nas em para pra pro por com sem que quando como onde qual quais quem e ou se ao aos meu minha meus minhas seu sua seus suas esse essa isso este esta isto ele ela eles elas eu voce voces tem ter ha esta estao estou foi sao ser fazer faco faz posso pode alguma algum algo nao sim mais muito ja agora aqui ali la entao tipo bom dia tarde noite ola oi boa obrigado obrigada duvida pergunta preciso queria quero gostaria saber ajuda recebe receber'.split(' '));
    const SINONIMOS = [
      ['venc', 'vencer', 'vencimento', 'vencido', 'vencendo', 'validade', 'expira', 'expirar', 'expirado', 'prazo'],
      ['notifica', 'notificacao', 'notificacoes', 'aviso', 'avisos', 'alerta', 'sino', 'email', 'e-mail', 'mensagem'],
      ['trabalhador', 'trabalhadores', 'funcionario', 'funcionarios', 'colaborador', 'colaboradores', 'empregado', 'pessoa'],
      ['visitante', 'visitantes', 'visita', 'convidado'],
      ['document', 'documento', 'documentos', 'arquivo', 'anexo', 'anexar', 'aso', 'pgr', 'pcmso'],
      ['irregular', 'pendencia', 'pendente', 'bloqueado', 'reprovado', 'problema'],
      ['usuario', 'usuarios', 'login', 'senha', 'perfil'],
      ['fornecedor', 'fornecedores', 'terceiro', 'terceiros', 'prestador', 'contratada', 'subcontratada'],
      ['vincular', 'vinculo', 'vincula', 'vinculacao', 'associar', 'liberar', 'liberacao'],
      ['relatorio', 'relatorios', 'painel', 'grafico', 'dashboard', 'exportar', 'planilha']
    ];
    const raiz = t => t.length > 5 ? t.slice(0, 5) : t;
    const grupoDe = new Map();
    SINONIMOS.forEach((g, i) => g.forEach(w => grupoDe.set(raiz(w), i)));
    function expandir(t) {
      const r = raiz(t), g = grupoDe.get(r);
      return g == null ? [r] : [...new Set(SINONIMOS[g].map(raiz))];
    }
    const tokens = t => normal(t).replace(/[^a-z0-9.\- ]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !PARADAS.has(w));

    let achados = [], sel = 0;
    function suporte(texto) {
      const a = document.createElement('a');
      const msg = 'Olá! Vim pelo manual do SEIF e não encontrei a resposta: ' + texto;
      a.href = 'https://wa.me/554833323343?text=' + encodeURIComponent(msg);
      a.target = '_blank'; a.rel = 'noopener';
      a.className = 'palette__sup';
      a.innerHTML = '<span class="code">?</span><strong>Não achou? Fale com o suporte no WhatsApp</strong><small>(48) 3332-3343 · a sua pergunta já vai escrita na mensagem</small>';
      return a;
    }
    function procurar() {
      const texto = campo.value.trim();
      const termos = tokens(texto);
      lista.innerHTML = '';
      if (!texto) { lista.append(sugestoes()); achados = []; return; }
      const grupos = termos.map(expandir);
      achados = indice
        .map(p => {
          let nota = 0, bate = 0;
          grupos.forEach((g, i) => {
            const t = termos[i];
            if (p.codigo === t) { nota += 8; bate++; return; }
            let n = 0;
            g.forEach(r => { if (p.wTitulo.some(w => w.startsWith(r))) n = Math.max(n, 3); else if (p.wTudo.some(w => w.startsWith(r))) n = Math.max(n, 1); });
            if (n) { nota += n; bate++; }
          });
          return { p, nota, bate };
        })
        .filter(x => x.bate && x.bate >= (termos.length <= 2 ? termos.length : Math.ceil(termos.length * 0.6)))
        .sort((a, b) => b.bate - a.bate || b.nota - a.nota);
      const topo = achados.length ? achados[0].nota : 0;
      achados = achados.filter(x => x.nota >= topo * 0.5).slice(0, 6).map(x => x.p);
      if (!achados.length) {
        const vazio = document.createElement('p');
        vazio.className = 'palette__empty';
        vazio.textContent = 'Não encontrei esse assunto no manual.';
        lista.append(vazio, suporte(texto));
        return;
      }
      sel = 0;
      achados.forEach((p, i) => {
        const a = document.createElement('a');
        a.href = '#' + p.el.id;
        a.setAttribute('role', 'option');
        a.innerHTML = '<span class="code"></span><strong></strong><small></small>';
        a.querySelector('.code').textContent = p.codigo;
        a.querySelector('strong').textContent = p.titulo;
        a.querySelector('small').textContent = p.cap;
        a.addEventListener('click', e => { e.preventDefault(); ir(p); });
        a.addEventListener('mousemove', () => marcar(i));
        lista.append(a);
      });
      lista.append(suporte(texto));
      marcar(0);
    }
    function sugestoes() {
      const box = document.createElement('div');
      box.className = 'palette__hints';
      (window.SUGESTOES || ['cadastro', 'trabalhador', 'documentos', 'usuário']).forEach(t => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = t;
        b.addEventListener('click', () => { campo.value = t; procurar(); campo.focus(); });
        box.append(b);
      });
      return box;
    }
    function marcar(i) {
      sel = i;
      $$('a[role=option]', lista).forEach((a, k) => a.setAttribute('aria-selected', String(k === i)));
      const atual = $$('a[role=option]', lista)[i];
      if (atual) atual.scrollIntoView({ block: 'nearest' });
    }
    function ir(p) {
      dlg.close();
      p.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + p.el.id);
      p.el.classList.remove('flash'); void p.el.offsetWidth; p.el.classList.add('flash');
    }
    function abrir() {
      if (dlg.open) return;
      dlg.showModal();
      campo.value = '';
      procurar();
      campo.focus();
    }

    campo.addEventListener('input', procurar);
    campo.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (achados.length) marcar((sel + 1) % achados.length); }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (achados.length) marcar((sel - 1 + achados.length) % achados.length); }
      if (e.key === 'Enter' && achados[sel]) { e.preventDefault(); ir(achados[sel]); }
    });
    $$('[data-busca]').forEach(b => b.addEventListener('click', abrir));
    $('.palette__close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    addEventListener('keydown', e => {
      const digitando = /input|textarea/i.test(document.activeElement.tagName);
      if ((e.key === '/' && !digitando) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        abrir();
      }
    });
  }

  /* 9. AMPLIAR a captura em tela cheia (com opção de tamanho real) */
  function ampliar() {
    const dlg = $('#zoom');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    const img = $('img', dlg), cap = $('.zoom__cap', dlg), modo = $('[data-modo]', dlg);
    function alternar() {
      const cheio = dlg.classList.toggle('full');
      modo.textContent = cheio ? 'Ajustar à tela' : 'Tamanho real';
    }
    $$('[data-zoom]').forEach(el => el.addEventListener('click', () => {
      const alvo = $('img', el);
      if (!alvo.src) return;
      img.src = alvo.src;
      img.alt = alvo.alt;
      cap.textContent = alvo.alt;
      dlg.classList.remove('full');
      modo.textContent = 'Tamanho real';
      dlg.showModal();
    }));
    img.addEventListener('click', alternar);
    modo.addEventListener('click', alternar);
    $('[data-fechar]', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('zoom__stage')) dlg.close(); });
  }

  /* 10. VÍDEOS DOS TEMAS
     Cada vídeo é um arquivo .mp4 em assets/video/ (atributo data-src)
     e só é carregado quando a pessoa aperta o play. A lista ao lado
     e os botões "Ver este passo no vídeo" levam ao ponto certo.   */
  function videos() {
    const blocos = $$('.vid');
    if (!blocos.length) return;
    const urls = {};

    function montar(bloco) {
      let v = $('video', bloco);
      if (v) return v;
      const tela = $('.vid__screen', bloco);
      const rotulo = $('.vid__start', bloco).getAttribute('aria-label');
      v = document.createElement('video');
      v.controls = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.setAttribute('aria-label', rotulo.replace('Assistir ao vídeo', 'Vídeo'));
      v.src = bloco.dataset.src;
      tela.replaceChildren(v);
      // se o navegador não conseguir tocar o vídeo, explica em vez de ficar uma tela preta
      v.addEventListener('error', () => {
        const aviso = document.createElement('p');
        aviso.className = 'vid__erro';
        aviso.textContent = 'Este navegador não conseguiu reproduzir o vídeo. Abra o manual no Chrome, Edge, Firefox ou Safari atualizados.';
        tela.append(aviso);
      }, { once: true });
      // a lista ao lado acompanha o vídeo, marcando o passo atual
      const itens = $$('.vid__steps button', bloco);
      v.addEventListener('timeupdate', () => {
        let atual = null;
        itens.forEach(b => { if (v.currentTime + 0.3 >= parseFloat(b.dataset.t)) atual = b; });
        itens.forEach(b => b.classList.toggle('on', b === atual));
        if (atual && !finePointer) atual.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      return v;
    }

    function tocar(bloco, t) {
      const v = montar(bloco);
      const ir = () => {
        if (t != null && !isNaN(t)) v.currentTime = t;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      };
      if (v.readyState >= 1) ir(); else v.addEventListener('loadedmetadata', ir, { once: true });
    }

    blocos.forEach(bloco => {
      $('.vid__start', bloco).addEventListener('click', () => tocar(bloco, 0));
      $$('.vid__steps button', bloco).forEach(b => b.addEventListener('click', () => tocar(bloco, parseFloat(b.dataset.t))));
    });

    // "Ver este passo no vídeo": sobe até o vídeo do tema e toca daquele ponto
    $$('[data-watch]').forEach(b => b.addEventListener('click', () => {
      const bloco = document.getElementById('video-' + b.dataset.watch);
      if (!bloco) return;
      bloco.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      tocar(bloco, parseFloat(b.dataset.t));
    }));

    // só um vídeo tocando por vez
    document.addEventListener('play', e => {
      $$('.vid video').forEach(v => { if (v !== e.target) v.pause(); });
    }, true);

    // ao sair da tela, o vídeo pausa sozinho
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { const v = $('video', e.target); if (v && !e.isIntersecting && !v.paused) v.pause(); });
      }, { threshold: 0.15 });
      blocos.forEach(b => io.observe(b));
    }
  }
})();
