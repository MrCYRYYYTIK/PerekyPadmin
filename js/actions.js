function toast(msg, tip) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show';
  if (tip == 'ok') t.style.background = '#2a5';
  else if (tip == 'err') t.style.background = '#a33';
  else if (tip == 'gold') t.style.background = '#a80';
  else t.style.background = '#444';
  setTimeout(function() { t.className = 'toast'; }, 2200);
}

function otkritModal(id) { document.getElementById(id).classList.add('show'); }
function zakrModal(id) { document.getElementById(id).classList.remove('show'); }

function proveritObnovlenie() {
  if (posledVidenVersiya === TEKUSHCHAYA_VERSIYA) return;
  otkritModal('modalObnovlenie');
}

function zakrObnovlenie() {
  posledVidenVersiya = TEKUSHCHAYA_VERSIYA;
  zakrModal('modalObnovlenie');
  sohranit();
  render();
}

function proveritModalki() {
  if (!pokazyvatModalki) return;
  var now = Date.now();
  var sutki = 24 * 60 * 60 * 1000;
  if ((now - poslBonus) >= sutki) {
    var summy = [300, 500, 800, 1200, 1800, 2500, 5000];
    var sled = seriyaDney + 1;
    if (sled > 7) sled = 7;
    document.getElementById('modalSeriya').textContent = sled;
    document.getElementById('modalPrize').textContent = '+' + formatChislo(summy[sled - 1]) + ' ₽';
    otkritModal('modalBonus');
  }
}

function kupit(itemId) {
  var item = naytiTovar(itemId);
  if (!item) return;
  if (item.lvl > lvl) { toast('🔒 Нужен уровень ' + item.lvl, 'err'); return; }
  var skidka = 1 - (prestizh * 0.05);
  if (skidka < 0.5) skidka = 0.5;
  var cena = Math.floor(randomCena(item.cena) * skidka);
  if (dengi < cena) { toast('💸 Мало денег', 'err'); return; }
  if (energ < 1) { toast('⚡ Нет энергии', 'err'); return; }
  dengi = dengi - cena;
  energ = energ - 1;
  inv.push({ uid: Date.now() + Math.random(), itemId: item.id, kupCena: cena, ap: 0 });
  kupilVsego++;
  dobavitOpyt(Math.floor(cena / EDINIC_OPYT_ZA_POKUPKU));
  proveritDostizheniya();
  toast('✅ Куплено за ' + formatChislo(cena) + '₽', 'ok');
  sohranit();
  render();
}

function apnut(uid) {
  var moy = null;
  for (var i = 0; i < inv.length; i++) if (inv[i].uid == uid) moy = inv[i];
  if (!moy) return;
  var item = naytiTovar(moy.itemId);
  if (moy.ap >= MAX_APGREYD) { toast('🔧 Максимум +' + MAX_APGREYD, 'err'); return; }
  var stoimost = stoimostApa(item, moy.ap);
  var en = energiyaZaAp(item, moy.ap);
  if (dengi < stoimost) { toast('💸 Нужно ' + formatChislo(stoimost) + '₽', 'err'); return; }
  if (energ < en) { toast('⚡ Нужно ' + en + ' энергии', 'err'); return; }
  dengi = dengi - stoimost;
  energ = energ - en;
  moy.ap = moy.ap + 1;
  if (moy.ap === MAX_APGREYD) apnutoDo5++;
  dobavitOpyt(Math.floor(stoimost / EDINIC_OPYT_ZA_APGREYD));
  toast('🔧 Улучшено до +' + moy.ap + ' (−' + en + ' ⚡)', 'ok');
  sohranit();
  render();
}

var lotTekushchiyUid = null;

function otkritModalLota(uid) {
  var idx = -1;
  for (var i = 0; i < inv.length; i++) if (inv[i].uid == uid) idx = i;
  if (idx == -1) return;
  var moy = inv[idx];
  var item = naytiTovar(moy.itemId);
  var minC = minCenaTovara(item, moy.ap);
  var maxC = maxCenaTovara(item, moy.ap);
  lotTekushchiyUid = uid;
  var modal = document.getElementById('modalLota');
  if (!modal) return;
  document.getElementById('lotaItemName').textContent = item.name + (moy.ap > 0 ? ' +' + moy.ap : '');
  document.getElementById('lotaMin').textContent = formatChislo(minC);
  document.getElementById('lotaMax').textContent = formatChislo(maxC);
  document.getElementById('lotaCena').value = Math.floor((minC + maxC) / 2);
  document.getElementById('lotaCena').min = minC;
  document.getElementById('lotaCena').max = maxC;
  document.getElementById('lotaOshibka').style.display = 'none';
  otkritModal('modalLota');
}

function podtverdLota() {
  if (lotTekushchiyUid === null) return;
  var idx = -1;
  for (var i = 0; i < inv.length; i++) if (inv[i].uid == lotTekushchiyUid) idx = i;
  if (idx == -1) { zakrModal('modalLota'); return; }
  var moy = inv[idx];
  var item = naytiTovar(moy.itemId);
  var minC = minCenaTovara(item, moy.ap);
  var maxC = maxCenaTovara(item, moy.ap);
  var moyaCena = parseInt(document.getElementById('lotaCena').value);
  var osh = document.getElementById('lotaOshibka');
  osh.style.display = 'none';
  if (isNaN(moyaCena)) { osh.textContent = '❌ Введи число!'; osh.style.display = 'block'; return; }
  if (moyaCena < minC) { osh.textContent = '📉 Минимум ' + formatChislo(minC) + '₽'; osh.style.display = 'block'; return; }
  if (moyaCena > maxC) { osh.textContent = '📈 Максимум ' + formatChislo(maxC) + '₽'; osh.style.display = 'block'; return; }
  inv.splice(idx, 1);
  var lot = {
    uid: Date.now() + Math.random(),
    itemId: moy.itemId,
    kupCena: moy.kupCena,
    ap: moy.ap,
    moyaCena: moyaCena,
    vremyaStart: Date.now(),
    vremyaAktivnosti: Date.now() + 5000 + 30000,
    srokDo: Date.now() + SROK_LOTA_MS
  };
  rasschitatShansICena(lot, item);
  loty.push(lot);
  vystavlenoLotov++;
  toast('🏷️ Лот за ' + formatChislo(moyaCena) + '₽', 'ok');
  lotTekushchiyUid = null;
  zakrModal('modalLota');
  sohranit();
  render();
}

function zabratLot(uid) {
  var idx = -1;
  for (var i = 0; i < loty.length; i++) if (loty[i].uid == uid) idx = i;
  if (idx == -1) return;
  var l = loty[idx];
  inv.push({ uid: Date.now() + Math.random(), itemId: l.itemId, kupCena: l.kupCena, ap: l.ap });
  loty.splice(idx, 1);
  toast('↩️ Лот снят', 'ok');
  sohranit();
  render();
}

function prodatLot(uid) {
  var idx = -1;
  for (var i = 0; i < loty.length; i++) if (loty[i].uid == uid) idx = i;
  if (idx == -1) return;
  var l = loty[idx];
  if (energ < 1) { toast('⚡ Нет энергии', 'err'); return; }
  if (l.vremyaAktivnosti && Date.now() > l.vremyaAktivnosti) {
    var item2 = naytiTovar(l.itemId);
    rasschitatShansICena(l, item2);
    toast('😴 Покупатель ушёл. Ждать заново: ' + Math.round(l.vremyaOzhidaniya / 1000) + ' сек', 'err');
    sohranit();
    render();
    return;
  }
  var shans = l.shansProdagy || 50;
  var prodano = Math.random() * 100 < shans;
  energ = energ - 1;
  if (prodano) {
    var bonus = 1 + (prestizh * 0.05);
    var itog = Math.floor(l.moyaCena * bonus);
    dengi = dengi + itog;
    loty.splice(idx, 1);
    prodalVsego++;
    dobavitOpyt(Math.floor(l.moyaCena / EDINIC_OPYT_ZA_POKUPKU));
    proveritDostizheniya();
    toast('💰 Продано! ' + formatChislo(itog) + '₽', 'ok');
  } else {
    var item = naytiTovar(l.itemId);
    rasschitatShansICena(l, item);
    toast('😕 Не купили! Ждать заново: ' + Math.round(l.vremyaOzhidaniya / 1000) + ' сек', 'err');
  }
  sohranit();
  render();
}

function prodatMgnovenno(uid) {
  var idx = -1;
  for (var i = 0; i < inv.length; i++) if (inv[i].uid == uid) idx = i;
  if (idx == -1) return;
  var moy = inv[idx];
  if (energ < 1) { toast('⚡ Нет энергии', 'err'); return; }
  var item = naytiTovar(moy.itemId);
  var maxC = maxCenaTovara(item, moy.ap);
  var cenaProd = Math.floor(maxC * 0.75);
  var bonus = 1 + (prestizh * 0.05);
  cenaProd = Math.floor(cenaProd * bonus);
  var prof = cenaProd - moy.kupCena;
  dengi = dengi + cenaProd;
  energ = energ - 1;
  inv.splice(idx, 1);
  prodalVsego++;
  dobavitOpyt(Math.floor(cenaProd / EDINIC_OPYT_ZA_APGREYD));
  proveritDostizheniya();
  toast('⚡ Срочно: ' + formatChislo(cenaProd) + '₽', prof >= 0 ? 'ok' : 'err');
  sohranit();
  render();
}

function prodatVseSrochno() {
  if (inv.length === 0) { toast('📦 Сумка пуста', 'err'); return; }
  if (energ < 1) { toast('⚡ Нет энергии', 'err'); return; }
  var summa = 0;
  var kolvo = inv.length;
  var bonus = 1 + (prestizh * 0.05);
  for (var i = 0; i < inv.length; i++) {
    var m = inv[i];
    var tovar = naytiTovar(m.itemId);
    if (!tovar) continue;
    var maxC = maxCenaTovara(tovar, m.ap);
    summa += Math.floor(Math.floor(maxC * 0.75) * bonus);
  }
  dengi += summa;
  energ -= 1;
  inv = [];
  prodalVsego += kolvo;
  dobavitOpyt(Math.floor(summa / EDINIC_OPYT_ZA_POKUPKU));
  proveritDostizheniya();
  toast('⚡ Продано ' + kolvo + ' товаров за ' + formatChislo(summa) + '₽', 'gold');
  sohranit();
  render();
}

function sest() {
  var v = vremyaIgry();
  if (poslSonDen === v.den) { toast('😴 Ты уже спал сегодня', 'err'); return; }
  if (v.chas >= SON_DO_CHASA && v.chas < SON_S) { toast('😴 Спать можно только ночью (22:00–09:00)', 'err'); return; }
  var chasSpal;
  if (v.chas >= SON_S) chasSpal = (24 - v.chas) + SON_DO_CHASA;
  else chasSpal = SON_DO_CHASA - v.chas;
  if (chasSpal > SON_CHASOV_NORMA) chasSpal = SON_CHASOV_NORMA;
  var dom = naytiDom(moeDom);
  var sonMax = sonDomaSUp(dom, domUp);
  var dobavka = Math.floor(sonMax * (chasSpal / SON_CHASOV_NORMA));
  if (dobavka < 1) dobavka = 1;
  energ = energ + dobavka;
  if (energ > maxEnerg) energ = maxEnerg;
  var minSpal = chasSpal * 60;
  igrovoySdvig += minSpal * 60 * 1000;
  vremyaZahoda = Date.now();
  var novoeVremya = vremyaIgry();
  poslSonDen = novoeVremya.den;
  pospalRaz++;
  dobavitOpyt(EDINIC_OPYT_ZA_SON);
  toast('😴 Спал ' + chasSpal + ' ч. +' + dobavka + ' ⚡', 'ok');
  sohranit();
  render();
  obnovitChasy();
}

function kupitEdu(id) {
  var e = null;
  for (var i = 0; i < eda.length; i++) if (eda[i].id == id) e = eda[i];
  if (!e) return;
  var v = vremyaIgry();
  var tekMin = v.den * 1440 + v.chas * 60 + v.min;
  if (tekMin - poslEdaMin < EDA_KULDAUN_MIN) {
    var ostalos = EDA_KULDAUN_MIN - (tekMin - poslEdaMin);
    toast('🍽️ Сытый! Через ' + ostalos + ' игровых мин.', 'err');
    return;
  }
  if (dengi < e.cena) { toast('💸 Мало денег', 'err'); return; }
  if (energ >= maxEnerg) { toast('⚡ Энергия полная', 'err'); return; }
  dengi = dengi - e.cena;
  energ = energ + e.energ;
  if (energ > maxEnerg) energ = maxEnerg;
  poslEdaMin = tekMin;
  sEdeno++;
  if (e.id === 'rest') sEdenoRestoran++;
  toast('🍽️ ' + e.name + ': +' + e.energ + ' ⚡', 'ok');
  sohranit();
  render();
}

function kupitDom(id) {
  var d = naytiDom(id);
  if (!d) return;
  if (moeDom == id) { toast('🏠 Уже живёшь тут', 'err'); return; }
  if (dengi < d.cena) { toast('💸 Мало денег', 'err'); return; }
  if (moeDom != 'street') {
    var staryyDom = naytiDom(moeDom);
    var vozvrat = Math.floor(staryyDom.cena * 0.5);
    dengi += vozvrat;
    toast('💸 Старый дом продан за ' + formatChislo(vozvrat) + '₽', 'ok');
  }
  dengi -= d.cena;
  moeDom = id;
  domUp = 0;
  dobavitOpyt(Math.floor(d.cena / 1000));
  proveritDostizheniya();
  toast('🏠 Новый дом: ' + d.name, 'gold');
  sohranit();
  render();
}

function upDom() {
  var d = naytiDom(moeDom);
  if (domUp >= MAX_DOM_UP) { toast('🏗️ Максимум +' + MAX_DOM_UP, 'err'); return; }
  var stoimost = stoimostUpDoma(d, domUp);
  if (dengi < stoimost) { toast('💸 Нужно ' + formatChislo(stoimost) + '₽', 'err'); return; }
  dengi -= stoimost;
  domUp++;
  toast('🏗️ Дом улучшен до +' + domUp, 'gold');
  sohranit();
  render();
}

function kupitMesto() {
  if (vtoroyDom) { toast('❌ Место уже куплено', 'err'); return; }
  var d = naytiDom(moeDom);
  if (d.cena == 0) { toast('❌ Сначала купи дом', 'err'); return; }
  if (dengi < d.cena) { toast('💸 Нужно ' + formatChislo(d.cena) + '₽', 'err'); return; }
  dengi -= d.cena;
  vtoroyDom = 'mesto';
  toast('🏗️ Место куплено!', 'gold');
  proveritDostizheniya();
  sohranit();
  render();
}

function kupitVtoroyDom(id) {
  if (vtoroyDom !== 'mesto') { toast('❌ Сначала купи место', 'err'); return; }
  if (vtoroyDomId) { toast('❌ Второй дом уже куплен', 'err'); return; }
  var d = naytiDom(id);
  if (!d) return;
  if (dengi < d.cena) { toast('💸 Мало денег', 'err'); return; }
  dengi -= d.cena;
  vtoroyDomId = id;
  vtoroyDomUp = 0;
  toast('🏠 Второй дом: ' + d.name, 'gold');
  sohranit();
  render();
}

function upVtoroyDom() {
  if (!vtoroyDomId) { toast('❌ Сначала купи второй дом', 'err'); return; }
  var d = naytiDom(vtoroyDomId);
  if (vtoroyDomUp >= MAX_DOM_UP) { toast('🏗️ Максимум', 'err'); return; }
  var stoimost = stoimostUpDoma(d, vtoroyDomUp);
  if (dengi < stoimost) { toast('💸 Нужно ' + formatChislo(stoimost) + '₽', 'err'); return; }
  dengi -= stoimost;
  vtoroyDomUp++;
  toast('🏗️ Второй дом улучшен до +' + vtoroyDomUp, 'gold');
  sohranit();
  render();
}

function proveritDohod() {
  var v = vremyaIgry();
  if (v.chas < 12) return;
  if (poslDohodDen === v.den) return;
  var totalDohod = 0;
  var d1 = naytiDom(moeDom);
  totalDohod += dohodDomaSUp(d1, domUp);
  if (vtoroyDomId) {
    var d2 = naytiDom(vtoroyDomId);
    totalDohod += Math.floor(d2.cena * ARENDA_PROCENT) + dohodDomaSUp(d2, vtoroyDomUp);
  }
  if (totalDohod > 0) {
    dengi += totalDohod;
    poslDohodDen = v.den;
    toast('🏠 Доход домов: +' + formatChislo(totalDohod) + '₽', 'gold');
  } else {
    poslDohodDen = v.den;
  }
  sohranit();
  render();
}

function propustitVremya(uid) {
  var rnd = Math.random();
  var realSek, opisanie;
  if (rnd < 0.60) { realSek = 10; opisanie = '10 сек'; }
  else if (rnd < 0.90) { realSek = 30; opisanie = '30 сек'; }
  else { realSek = 60; opisanie = '60 сек (1 час)'; }
  igrovoySdvig += realSek * 60 * 1000;
  vremyaZahoda = Date.now();
  var l = null;
  for (var i = 0; i < loty.length; i++) if (loty[i].uid == uid) l = loty[i];
  if (l) {
    l.vremyaStart -= realSek * 1000;
    l.vremyaAktivnosti -= realSek * 1000;
    if (Date.now() > l.vremyaAktivnosti) {
      var item = naytiTovar(l.itemId);
      if (item) {
        rasschitatShansICena(l, item);
        toast('😴 Покупатель ушёл! Ждать заново', 'err');
      }
    }
  }
  toast('⏩ Пропущено: ' + opisanie, 'gold');
  sohranit();
  render();
  obnovitChasy();
}

function vzyatBonus() {
  var now = Date.now();
  var sutki = 24 * 60 * 60 * 1000;
  if (now - poslBonus < sutki) { zakrModal('modalBonus'); return; }
  if (poslBonus > 0 && now - poslBonus > sutki * 2) seriyaDney = 0;
  seriyaDney++;
  if (seriyaDney > 7) seriyaDney = 7;
  var summy = [300, 500, 800, 1200, 1800, 2500, 5000];
  var bonus = summy[seriyaDney - 1];
  dengi += bonus;
  poslBonus = now;
  dobavitOpyt(EDINIC_OPYT_ZA_BONUS);
  toast('🎁 День ' + seriyaDney + ': +' + formatChislo(bonus) + '₽!', 'gold');
  zakrModal('modalBonus');
  sohranit();
  render();
}

function vzyatKredit(summy) {
  if (dolg > 0) { toast('❌ Уже есть долг', 'err'); return; }
  var maxK = 5000 + lvl * 3000;
  if (summy > maxK) { toast('❌ Максимум ' + formatChislo(maxK), 'err'); return; }
  dengi += summy;
  dolg = Math.floor(summy * 1.3);
  bralKredit = true;
  toast('🏦 Взял ' + formatChislo(summy) + '₽. Вернуть: ' + formatChislo(dolg) + '₽', 'ok');
  sohranit();
  render();
}

function oplatitDolg() {
  if (dolg <= 0) return;
  if (dengi < dolg) { toast('💸 Не хватает ' + formatChislo(dolg - dengi), 'err'); return; }
  dengi -= dolg;
  toast('✅ Долг погашен: ' + formatChislo(dolg), 'ok');
  dolg = 0;
  platilDolg = true;
  proveritDostizheniya();
  sohranit();
  render();
}

function kupitSkin(id) {
  var sk = null;
  for (var i = 0; i < skiny.length; i++) if (skiny[i].id == id) sk = skiny[i];
  if (!sk) return;
  if (dengi < sk.price) { toast('💸 Мало денег', 'err'); return; }
  if (sk.price > 0) {
    dengi -= sk.price;
    if (sk.id === '👑') skinKingKupil = true;
    if (sk.id === '🐲') skinDragonKupil = true;
    toast('💼 Куплен: ' + sk.name, 'gold');
  }
  activeSkin = sk.id;
  proveritDostizheniya();
  sohranit();
  render();
}

function pereklTemu() { tema = (tema == 'dark') ? 'light' : 'dark'; primenitTemu(); sohranit(); render(); setTimeout(primenitTemu, 100); }
function pereklModalki() { pokazyvatModalki = !pokazyvatModalki; sohranit(); render(); }

function setCvet(c) {
  cvet = c;
  primenitTemu();
  sohranit();
  render();
  setTimeout(function() { primenitTemu(); }, 100);
  setTimeout(function() { primenitTemu(); }, 300);
}

function sdelatPrestizh() {
  if (lvl < 20) { toast('🔒 Нужен 20 уровень', 'err'); return; }
  if (moeDom !== 'mansion') { toast('🏛️ Нужен Особняк', 'err'); return; }
  if (dengi < 10000000) { toast('💸 Нужно 10 000 000₽', 'err'); return; }
  if (!confirm('⚠️ ПРЕСТИЖ!\n\nСбросится: деньги, уровень, сумка, дома, достижения.\n\nОстанется: скины, настройки.\n\nБонус: +1 уровень престижа.\n\nПродолжить?')) return;
  if (!confirm('⚠️ ТОЧНО? Это нельзя отменить!')) return;
  prestizh++;
  dengi = 1000;
  lvl = 1;
  opyt = 0;
  maxEnerg = 20 + lvl * 2 + (prestizh * 10);
  energ = maxEnerg;
  inv = [];
  loty = [];
  dolg = 0;
  poslBonus = 0;
  seriyaDney = 0;
  poslSonDen = 0;
  poslEdaMin = -9999;
  poslEnergMin = -9999;
  kupilVsego = 0;
  prodalVsego = 0;
  apnutoDo5 = 0;
  vystavlenoLotov = 0;
  sEdeno = 0;
  sEdenoRestoran = 0;
  pospalRaz = 0;
  moeDom = 'street';
  vtoroyDom = null;
  domUp = 0;
  vtoroyDomId = null;
  vtoroyDomUp = 0;
  poslDohodDen = 0;
  for (var i = 0; i < dostizheniya.length; i++) dostizheniya[i].done = false;
  toast('⭐ ПРЕСТИЖ! Уровень ' + prestizh + '!', 'gold');
  sohranit();
  render();
}
// ... (остальные функции казино, кейсов, рулетки, админки остаются без изменений из предыдущей версии)
