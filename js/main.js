var timerChasy, timerSave, timerRender, timerDostizh, timerEnerg, timerDohod, timerLoty;

function vkDostupen() {
  return typeof vkBridge !== 'undefined' && vkBridge && typeof vkBridge.send === 'function';
}

if (vkDostupen()) {
  vkBridge.send('VKWebAppInit').catch(function() {});
  vkBridge.send('VKWebAppGetUserInfo')
    .then(function(u) { user = u; posleZagruzki(); })
    .catch(function() { user = { id: 0, first_name: 'Гость', last_name: '' }; posleZagruzki(); });
} else {
  user = { id: 0, first_name: 'Гость', last_name: '' };
  posleZagruzki();
}

function proveritEnergiyu() {
  var v = vremyaIgry();
  var tekMin = v.den * 1440 + v.chas * 60 + v.min;
  if (poslEnergMin < 0 || poslEnergMin === -9999) { poslEnergMin = tekMin; return; }
  if (energ >= maxEnerg) { poslEnergMin = tekMin; return; }
  if (tekMin - poslEnergMin >= 30) {
    var skolko = Math.floor((tekMin - poslEnergMin) / 30);
    energ += skolko;
    if (energ > maxEnerg) energ = maxEnerg;
    poslEnergMin = poslEnergMin + skolko * 30;
    render();
  }
}

function proveritLoty() {
  var now = Date.now();
  var perestavit = false;
  for (var i = 0; i < loty.length; i++) {
    var l = loty[i];
    if (l.vremyaAktivnosti && now > l.vremyaAktivnosti) {
      var item = naytiTovar(l.itemId);
      if (item) {
        rasschitatShansICena(l, item);
        perestavit = true;
      }
    }
  }
  if (perestavit) {
    toast('😴 Покупатель ушёл. Ждать заново!', 'err');
    sohranit();
    render();
  }
}

function zapustitTaimery() {
  if (timerChasy) clearInterval(timerChasy);
  if (timerSave) clearInterval(timerSave);
  if (timerRender) clearInterval(timerRender);
  if (timerDostizh) clearInterval(timerDostizh);
  if (timerEnerg) clearInterval(timerEnerg);
  if (timerDohod) clearInterval(timerDohod);
  if (timerLoty) clearInterval(timerLoty);

  timerChasy = setInterval(obnovitChasy, 1000);
  timerSave = setInterval(function() { sohranit(); }, 5000);
  timerRender = setInterval(function() {
    if (tab == 'inventory' || tab == 'market' || tab == 'dom' || tab == 'food') render();
  }, 1500);
  timerDostizh = setInterval(function() { proveritDostizheniya(); }, 5000);
  timerEnerg = setInterval(function() { proveritEnergiyu(); }, 5000);
  timerDohod = setInterval(function() { proveritDohod(); }, 10000);
  timerLoty = setInterval(function() { proveritLoty(); }, 5000);
}

function ostanovitTaimery() {
  if (timerChasy) clearInterval(timerChasy);
  if (timerSave) clearInterval(timerSave);
  if (timerRender) clearInterval(timerRender);
  if (timerDostizh) clearInterval(timerDostizh);
  if (timerEnerg) clearInterval(timerEnerg);
  if (timerDohod) clearInterval(timerDohod);
  if (timerLoty) clearInterval(timerLoty);
}

function posleZagruzki() {
  obnovitChasy();
  render();
  zapustitTaimery();
  setTimeout(proveritObnovlenie, 600);
  setTimeout(proveritModalki, 1500);
  setTimeout(proveritEnergiyu, 1000);
  setTimeout(proveritDohod, 2000);

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      igrovoySdvig = tekuscheeIgrovoeMs();
      vremyaZahoda = Date.now();
      sohranit();
      ostanovitTaimery();
    } else {
      vremyaZahoda = Date.now();
      zapustitTaimery();
      proveritEnergiyu();
      render();
    }
  });

  window.addEventListener('beforeunload', function() {
    igrovoySdvig = tekuscheeIgrovoeMs();
    vremyaZahoda = Date.now();
    sohranit();
  });
}

var vseTaby = document.querySelectorAll('.tab');
for (var i = 0; i < vseTaby.length; i++) {
  vseTaby[i].onclick = function() {
    for (var j = 0; j < vseTaby.length; j++) vseTaby[j].classList.remove('active');
    this.classList.add('active');
    tab = this.getAttribute('data-tab');
    render();
  };
}

function podkluchitKlik() {
  var titul = document.getElementById('titulIgry');
  if (titul && !titul.dataset.klikPodkl) {
    titul.dataset.klikPodkl = '1';
    titul.addEventListener('click', obrabotatKlikTitul);
    titul.addEventListener('touchend', function(e) { e.preventDefault(); obrabotatKlikTitul(); });
  }
  var chasy = document.getElementById('clock');
  if (chasy && !chasy.dataset.klikPodkl) {
    chasy.dataset.klikPodkl = '1';
    chasy.style.cursor = 'pointer';
    chasy.addEventListener('click', obrabotatKlikTitul);
    chasy.addEventListener('touchend', function(e) { e.preventDefault(); obrabotatKlikTitul(); });
  }
}

zagruzit();
maxEnerg = 20 + lvl * 2 + (prestizh * 10);
primenitTemu();
render();

podkluchitKlik();
setTimeout(podkluchitKlik, 300);
setTimeout(podkluchitKlik, 1000);
setTimeout(podkluchitKlik, 3000);
