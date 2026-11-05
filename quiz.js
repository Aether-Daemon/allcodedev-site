/* quiz.js — self-contained practice-quiz renderer.
   Reads /questions/fal-free.json. No backend, no tracking, no cookies.
   Mount with: <div class="quiz" data-exam="TFM12" data-count="20"></div> */
(function () {
  var PLAY = 'https://play.google.com/store/apps/details?id=com.allcodedev.tx_fal_prep';
  var LETTERS = 'ABCDEFGH';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Shuffle the options too, tracking where the key moved. Learning the
     material, not the position of the answer. */
  function prep(q) {
    var pairs = q.options.map(function (text, i) { return { text: text, key: i === q.correct }; });
    shuffle(pairs);
    return {
      cat: q.category, text: q.question, expl: q.explanation, ref: q.reference,
      options: pairs.map(function (p) { return p.text; }),
      correct: pairs.findIndex(function (p) { return p.key; })
    };
  }

  function mount(el, bank) {
    /* data-exam accepts one exam or a comma-separated mix ("TFM11,TFM12") */
    var pool = [];
    el.dataset.exam.split(',').forEach(function (name) {
      pool = pool.concat(bank[name.trim()] || []);
    });
    if (!pool.length) { el.innerHTML = '<p>Questions unavailable.</p>'; return; }

    var n = Math.min(parseInt(el.dataset.count, 10) || pool.length, pool.length);
    var qs = shuffle(pool).slice(0, n).map(prep);
    var at = 0, right = 0, answered = false;

    function render() {
      var q = qs[at];
      el.innerHTML =
        '<div class="quiz-bar"><span>Question ' + (at + 1) + ' of ' + qs.length + '</span>' +
        '<span>' + right + ' correct</span></div>' +
        '<div class="quiz-prog"><i style="width:' + (at / qs.length * 100) + '%"></i></div>' +
        '<div class="q-cat">' + esc(q.cat) + '</div>' +
        '<div class="q-text">' + esc(q.text) + '</div>' +
        '<div class="opts">' + q.options.map(function (o, i) {
          return '<button class="opt" data-i="' + i + '"><b>' + LETTERS[i] + '</b><span>' + esc(o) + '</span></button>';
        }).join('') + '</div><div class="slot"></div>';

      answered = false;
      el.querySelectorAll('.opt').forEach(function (b) {
        b.addEventListener('click', function () { choose(parseInt(b.dataset.i, 10)); });
      });
    }

    function choose(i) {
      if (answered) return;
      answered = true;
      var q = qs[at], ok = i === q.correct;
      if (ok) right++;

      el.querySelectorAll('.opt').forEach(function (b, bi) {
        b.disabled = true;
        if (bi === q.correct) b.classList.add('right');
        else if (bi === i) b.classList.add('wrong');
      });

      var last = at === qs.length - 1;
      el.querySelector('.slot').innerHTML =
        '<div class="expl"><div class="verdict ' + (ok ? 'y">Correct' : 'n">Not quite') + '</div>' +
        '<p>' + esc(q.expl) + '</p>' +
        (q.ref ? '<span class="ref">Reference: ' + esc(q.ref) + '</span>' : '') + '</div>' +
        '<div class="quiz-nav"><button class="btn btn-primary next">' +
        (last ? 'See my score' : 'Next question') + ' &rarr;</button></div>';

      el.querySelector('.next').addEventListener('click', function () {
        if (last) return done();
        at++; render();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    function done() {
      var pct = Math.round(right / qs.length * 100), pass = pct >= 70;
      el.innerHTML =
        '<div class="score"><div class="big ' + (pass ? 'pass' : 'fail') + '">' + pct + '%</div>' +
        '<div class="sub">' + right + ' of ' + qs.length + ' correct &middot; ' +
        (pass ? 'above the 70% passing score' : 'the real exam needs 70%') + '</div>' +
        '<div class="cta">' +
        '<a class="btn btn-primary" href="' + PLAY + '" target="_blank" rel="noopener">Get all 305 questions &rarr;</a>' +
        '<button class="btn btn-outline again">Retake with shuffled questions</button>' +
        '</div></div>';
      el.querySelector('.again').addEventListener('click', function () {
        qs = shuffle(pool).slice(0, n).map(prep); at = 0; right = 0; render();
      });
    }

    render();
  }

  var nodes = document.querySelectorAll('.quiz[data-exam]');
  if (!nodes.length) return;
  fetch('/questions/fal-free.json')
    .then(function (r) { return r.json(); })
    .then(function (bank) { nodes.forEach(function (el) { mount(el, bank); }); })
    .catch(function () {
      nodes.forEach(function (el) {
        el.innerHTML = '<p>Could not load the question bank. Please refresh.</p>';
      });
    });
})();
