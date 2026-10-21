function obnovitChasy() {
  var v = vremyaIgry();
  var el = document.getElementById('clock');
  if (el) el.textContent = '🕐 День ' + v.den + ', ' + formatTime(v.chas, v.min);
}

function obnovitLvlBar() {
  var bar = document.getElementById('lvlBar');
  var info = document.getElementById('lvlInfo');
  if (!bar || !info) return;
  var tek = opyt - trebOpyt(lvl);
  var nuzhno = trebOpyt(lvl + 1) - trebOpyt(lvl);
  var p = 0;
  if (nuzhno > 0) p = tek / nuzhno * 100;
  if (p < 0) p = 0;
  if (p > 100) p = 100;
  bar.style.width = p + '%';
  info.textContent = 'Ур. ' + lvl + ' · ' + formatChislo(opyt) + ' / ' + formatChislo(trebOpyt(lvl + 1)) + ' опыта';
}

function renderBezopasno(funkciya, c, v) {
  try { funkciya(c, v); }
  catch(e) { console.error('Ошибка:', e); c.innerHTML = '<div class="empty">⚠️ Ошибка<br>Обнови игру</div>'; }
}

function render() {
  primenitTemu();
  document.getElementById('balance').textContent = formatChislo(dengi) + ' ₽';
  document.getElementById('level').textContent = lvl;
  document.getElementById('energy').textContent = energ + '/' + maxEnerg;
  obnovitLvlBar();

  var c = document.getElementById('content');
  var v = vremyaIgry();

  if (tab == 'market') renderBezopasno(renderMarket, c, v);
  else if (tab == 'inventory') renderBezopasno(renderInventory, c, v);
  else if (tab == 'casino') renderBezopasno(renderCasino, c, v);
  else if (tab == 'food') renderBezopasno(renderFood, c, v);
  else if (tab == 'dom') renderBezopasno(renderDom, c, v);
  else if (tab == 'bank') renderBezopasno(renderBank, c, v);
  else if (tab == 'ach') renderBezopasno(renderAch, c, v);
  else if (tab == 'skins') renderBezopasno(renderSkins, c, v);
  else if (tab == 'settings') renderBezopasno(renderSettings, c, v);
}

function renderMarket(c, v) {
  var html = '';
  if (dolg > 0) html += '<div class="banner" style="background:linear-gradient(135deg,#4a0000,#6a0000);border-color:#ff6666">🏦 Долг: ' + formatChislo(dolg) + '₽</div>';

  var categories = [
    { id: 'all', name: '📋 Все' }, { id: 'tech', name: '📱 Техника' },
    { id: 'clothes', name: '👟 Одежда' }, { id: 'music', name: '🎸 Музыка' },
    { id: 'auto', name: '🚗 Авто' }, { id: 'realty', name: '🏠 Недвижимость' }
  ];
  html += '<div class="cats">';
  for (var ci = 0; ci < categories.length; ci++) {
    var cat = categories[ci];
    html += '<div class="cat' + (rynokCateg == cat.id ? ' active' : '') + '" onclick="setRynokCateg(\'' + cat.id + '\')">' + cat.name + '</div>';
  }
  html += '</div>';

  var sorted = tovari.slice().sort(function(a, b) { return a.lvl - b.lvl; });
  for (var i = 0; i < sorted.length; i++) {
    var it = sorted[i];
    if (rynokCateg !== 'all' && it.category !== rynokCateg) continue;
    var zakr = it.lvl > lvl;
    var cena = randomCena(it.cena);
    var knopka = zakr || dengi < cena ? '<button class="btn" disabled>Купить</button>' : '<button class="btn" onclick="kupit(\'' + it.id + '\')">Купить</button>';
    html += '<div class="card"><div class="card-row">';
    html += '<div class="card-info"><div class="card-name">' + it.name + (zakr ? ' 🔒' : '') + '</div>';
    html += '<div class="card-meta">Ур. ' + it.lvl + ' · База: ' + formatChislo(it.cena) + '₽</div></div>';
    html += '<div class="card-price">~' + formatChislo(cena) + ' ₽</div>';
    html += knopka;
    html += '</div></div>';
  }
  c.innerHTML = html;
}

function setRynokCateg(id) { rynokCateg = id; render(); }

function renderInventory(c) {
  var h = '';
  if (loty.length === 0 && inv.length === 0) { c.innerHTML = '<div class="empty">📦 Пусто. Купи что-нибудь!</div>'; return; }

  for (var w = 0; w < loty.length; w++) {
    var l = loty[w];
    var t2 = naytiTovar(l.itemId);
    if (!t2) continue;
    var sek = sekDoProdazhi(l);
    var gotov = sek <= 0;
    var shans = l.shansProdagy || 50;
    var progress = 0;
    if (l.vremyaOzhidaniya > 0) {
      progress = 100 - (sek * 1000 / l.vremyaOzhidaniya) * 100;
      if (progress < 0) progress = 0;
      if (progress > 100) progress = 100;
    }
    var sekAktiv = 999;
    if (l.vremyaAktivnosti) {
      sekAktiv = Math.ceil((l.vremyaAktivnosti - Date.now()) / 1000);
      if (sekAktiv < 0) sekAktiv = 0;
    }
    h += '<div class="card"><div class="card-row">';
    h += '<div class="card-info"><div class="card-name">🏷️ ' + t2.name + (l.ap > 0 ? ' +' + l.ap : '') + '</div>';
    h += '<div class="card-meta">Куплено: ' + formatChislo(l.kupCena) + '₽</div>';
    if (gotov && sekAktiv > 0) h += '<div class="lot-chance">✅ Шанс ' + shans + '% · успей за ' + sekAktiv + 'с</div>';
    else h += '<div class="lot-timer">⏳ ' + sek + ' сек · шанс ' + shans + '%</div>';
    h += '</div><div class="card-price">' + formatChislo(l.moyaCena) + ' ₽</div>';
    h += '</div><div class="lot-bar"><div class="lot-bar-in" style="width:' + progress + '%"></div></div>';
    h += '<div class="card-row" style="margin-top:8px">';
    if (gotov && sekAktiv > 0) h += '<button class="btn small green" onclick="prodatLot(' + l.uid + ')">💰 Продать</button>';
    else h += '<button class="btn small" disabled>⏳ ' + sek + 'с</button>';
    h += '<button class="btn small purple" onclick="propustitVremya(' + l.uid + ')">⏩</button>';
    h += '<button class="btn small red" onclick="zabratLot(' + l.uid + ')">↩️ Снять</button>';
    h += '</div></div>';
  }

  for (var m2 = 0; m2 < inv.length; m2++) {
    var m = inv[m2];
    var tovar = naytiTovar(m.itemId);
    if (!tovar) continue;
    var apStoim = stoimostApa(tovar, m.ap);
    var apEn = energiyaZaAp(tovar, m.ap);
    var minC = minCenaTovara(tovar, m.ap);
    var maxC = maxCenaTovara(tovar, m.ap);
    var maxAp = m.ap >= MAX_APGREYD;
    h += '<div class="card"><div class="card-row">';
    h += '<div class="card-info"><div class="card-name">' + tovar.name + (m.ap > 0 ? ' +' + m.ap : '') + '</div>';
    h += '<div class="card-meta">Куплено: ' + formatChislo(m.kupCena) + '₽</div>';
    h += '<div class="card-meta">Цена: ' + formatChislo(minC) + '–' + formatChislo(maxC) + '₽</div>';
    h += '</div></div><div class="card-row" style="margin-top:8px">';
    if (maxAp) h += '<button class="btn small" disabled>✅ Макс ап</button>';
    else if (dengi >= apStoim && energ >= apEn) h += '<button class="btn small" onclick="apnut(' + m.uid + ')">🔧 ' + formatChislo(apStoim) + '₽ / ' + apEn + '⚡</button>';
    else h += '<button class="btn small" disabled>🔧 ' + formatChislo(apStoim) + '₽ / ' + apEn + '⚡</button>';
    h += '<button class="btn small green" onclick="otkritModalLota(' + m.uid + ')">🏷️ Выставить</button>';
    h += '<button class="btn small" onclick="prodatMgnovenno(' + m.uid + ')">⚡ Срочно</button>';
    h += '</div></div>';
  }
  c.innerHTML = h;
}

function renderCasino(c, v) {
  var h = '<div class="casino-tabs">';
  h += '<div class="casino-tab' + (casinoTab == 'keysy' ? ' active' : '') + '" onclick="setCasinoTab(\'keysy\')">🎁 Кейсы</div>';
  h += '<div class="casino-tab' + (casinoTab == 'roulette' ? ' active' : '') + '" onclick="setCasinoTab(\'roulette\')">🎰 Рулетка</div>';
  h += '<div class="casino-tab' + (casinoTab == 'upgrade' ? ' active' : '') + '" onclick="setCasinoTab(\'upgrade\')">🎲 Апгрейд</div>';
  h += '</div>';

  if (casinoTab == 'keysy') h += renderKeysyHtml();
  else if (casinoTab == 'roulette') h += renderRouletteHtml();
  else if (casinoTab == 'upgrade') h += renderUpgradeHtml();

  c.innerHTML = h;
}

function setCasinoTab(t) { casinoTab = t; render(); }

function renderKeysyHtml() {
  var h = '<div class="lot-hint" style="margin-bottom:10px;">🎁 Открывай кейсы — получай случайные призы!</div>';
  for (var i = 0; i < keysy.length; i++) {
    var k = keysy[i];
    var mozhno = dengi >= k.cena;
    h += '<div class="card"><div class="card-row">';
    h += '<div class="card-info"><div class="card-name">' + k.name + '</div><div class="card-meta">' + k.desc + '</div></div>';
    h += '<div class="card-price">' + formatChislo(k.cena) + ' ₽</div>';
    if (mozhno) h += '<button class="btn gold" onclick="otkritKeys(\'' + k.id + '\')">🎁 Открыть</button>';
    else h += '<button class="btn" disabled>Нет денег</button>';
    h += '</div><div class="card-meta" style="margin-top:6px;">Возможные призы:</div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">';
    for (var j = 0; j < k.prizes.length; j++) {
      h += '<span style="background:#222;padding:4px 8px;border-radius:6px;font-size:10px;">' + k.prizes[j].icon + ' ' + k.prizes[j].name + '</span>';
    }
    h += '</div></div>';
  }
  return h;
}

function renderRouletteHtml() {
  var h = '';
  h += '<div class="card gold">';
  h += '<div class="card-name" style="margin-bottom:8px">🎰 Рулетка</div>';
  h += '<div class="card-meta">Выбери цвет и сумму ставки</div>';
  h += '</div>';
  h += '<div class="card">';
  h += '<div class="card-name" style="margin-bottom:6px">💰 Сумма ставки:</div>';
  h += '<input type="number" id="rulStavka" placeholder="Введи ставку" value="500" style="width:100%;padding:12px;border-radius:8px;border:2px solid #66ccff;background:#222;color:white;font-size:16px;text-align:center;">';
  h += '</div>';
  h += '<div class="card red" style="cursor:pointer;" onclick="krutitRul(\'red\')">';
  h += '<div class="card-name">🔴 Красное — ×2</div>';
  h += '<div class="card-meta">Шанс 48.6%</div>';
  h += '</div>';
  h += '<div class="card" style="cursor:pointer;background:#222;" onclick="krutitRul(\'black\')">';
  h += '<div class="card-name">⚫ Чёрное — ×2</div>';
  h += '<div class="card-meta">Шанс 48.6%</div>';
  h += '</div>';
  h += '<div class="card green" style="cursor:pointer;" onclick="krutitRul(\'green\')">';
  h += '<div class="card-name">🟢 Зелёное (0) — ×14</div>';
  h += '<div class="card-meta">Шанс 2.7%</div>';
  h += '</div>';
  if (rulPoslRezultat) {
    h += '<div class="card gold"><div style="text-align:center;font-size:16px;font-weight:bold;">' + rulPoslRezultat + '</div></div>';
  }
  return h;
}

function renderUpgradeHtml() {
  var h = '<div class="lot-hint" style="margin-bottom:10px;">🎲 Улучши предмет ×2, ×3, ×5 или ×10 — или потеряй его!</div>';
  if (upgradeResult) {
    h += '<div class="card ' + (upgradeResult.indexOf('🎉') === 0 ? 'green' : 'red') + '">';
    h += '<div style="text-align:center;font-size:16px;font-weight:bold;">' + upgradeResult + '</div>';
    h += '</div>';
    h += '<button class="btn full" onclick="upgradeResult = \'\'; render();">OK</button>';
    return h;
  }
  if (inv.length === 0) return h + '<div class="empty">📦 Сумка пуста. Купи что-нибудь!</div>';
  h += '<div class="card purple">';
  h += '<div class="card-name">Выбери предмет:</div>';
  h += '<select id="upgradeSelect" style="width:100%;padding:10px;border-radius:6px;border:2px solid #555;background:#222;color:white;margin-top:6px;" onchange="vybratUpgrade(this.value)">';
  h += '<option value="">— Выбери —</option>';
  for (var i = 0; i < inv.length; i++) {
    var m = inv[i];
    var t = naytiTovar(m.itemId);
    if (!t) continue;
    var sel = (upgradeVybranUid == m.uid) ? ' selected' : '';
    h += '<option value="' + m.uid + '"' + sel + '>' + t.name + (m.ap > 0 ? ' +' + m.ap : '') + ' — ' + formatChislo(m.kupCena) + '₽</option>';
  }
  h += '</select></div>';
  if (upgradeVybranUid) {
    var vybran = null;
    for (var k = 0; k < inv.length; k++) if (inv[k].uid == upgradeVybranUid) vybran = inv[k];
    if (vybran) {
      var tovar = naytiTovar(vybran.itemId);
      h += '<div class="card"><div class="card-name">' + tovar.name + '</div>';
      h += '<div class="card-meta">Текущая цена: ' + formatChislo(vybran.kupCena) + '₽</div></div>';
      h += '<div class="card gold"><div class="card-name" style="margin-bottom:8px">Выбери множитель:</div>';
      h += '<button class="btn green full" onclick="sdelatUpgrade(2)">×2 — 50% шанс → ' + formatChislo(vybran.kupCena * 2) + '₽</button>';
      h += '<button class="btn gold full" onclick="sdelatUpgrade(3)">×3 — 30% шанс → ' + formatChislo(vybran.kupCena * 3) + '₽</button>';
      h += '<button class="btn purple full" onclick="sdelatUpgrade(5)">×5 — 15% шанс → ' + formatChislo(vybran.kupCena * 5) + '₽</button>';
      h += '<button class="btn red full" onclick="sdelatUpgrade(10)">×10 — 5% шанс → ' + formatChislo(vybran.kupCena * 10) + '₽</button>';
      h += '</div>';
    }
  }
  return h;
}

function renderFood(c, v) {
  var tekMin = v.den * 1440 + v.chas * 60 + v.min;
  var mojno = (tekMin - poslEdaMin) >= EDA_KULDAUN_MIN;
  var hf = '';
  if (!mojno) hf += '<div class="banner">🍽️ Следующий приём через ' + (EDA_KULDAUN_MIN - (tekMin - poslEdaMin)) + ' игровых мин.</div>';
  for (var e = 0; e < eda.length; e++) {
    var ee = eda[e];
    hf += '<div class="food-row"><div class="food-info">';
    hf += '<div class="food-name">' + ee.name + '</div><div class="food-desc">' + ee.desc + '</div></div>';
    hf += '<div style="text-align:right"><div class="food-bonus">+' + ee.energ + ' ⚡</div><div class="card-meta">' + formatChislo(ee.cena) + '₽</div></div>';
    if (!mojno || dengi < ee.cena || energ >= maxEnerg) hf += '<button class="btn small" disabled>Купить</button>';
    else hf += '<button class="btn small green" onclick="kupitEdu(\'' + ee.id + '\')">Купить</button>';
    hf += '</div>';
  }
  c.innerHTML = hf;
}

function renderDom(c, v) {
  var hd = '';
  var tekushchiy = naytiDom(moeDom);
  var sonTek = sonDomaSUp(tekushchiy, domUp);
  var dohodTek = dohodDomaSUp(tekushchiy, domUp);
  hd += '<div class="dom-card"><div class="dom-emoji">' + tekushchiy.icon + '</div>';
  hd += '<div class="dom-name">' + tekushchiy.name + (domUp > 0 ? ' +' + domUp : '') + '</div>';
  hd += '<div class="dom-desc">Сон: +' + sonTek + ' ⚡</div>';
  hd += '<div class="dom-desc">Доход: +' + formatChislo(dohodTek) + '₽/день</div></div>';
  var mojSon2 = (poslSonDen !== v.den) && (v.chas >= SON_S || v.chas < SON_DO_CHASA);
  hd += '<div class="card purple">';
  if (mojSon2 && energ < maxEnerg) hd += '<button class="btn purple full" onclick="sest()">😴 Поспать</button>';
  else if (energ >= maxEnerg) hd += '<button class="btn full" disabled>⚡ Энергия полная</button>';
  else if (poslSonDen === v.den) hd += '<button class="btn full" disabled>✅ Уже спал</button>';
  else hd += '<button class="btn full" disabled>⏳ Спать с 22:00</button>';
  hd += '</div>';
  if (domUp < MAX_DOM_UP && tekushchiy.cena > 0) {
    var upStoim = stoimostUpDoma(tekushchiy, domUp);
    hd += '<div class="card purple"><div class="card-name" style="margin-bottom:6px">🏗️ Прокачка дома</div>';
    hd += '<div class="card-meta">Уровень: +' + domUp + ' / +' + MAX_DOM_UP + '</div>';
    hd += '<div class="card-meta">Следующий: +50% к сну и доходу</div>';
    if (dengi >= upStoim) hd += '<button class="btn purple full" onclick="upDom()">🏗️ Прокачать за ' + formatChislo(upStoim) + '₽</button>';
    else hd += '<button class="btn full" disabled>Нужно ' + formatChislo(upStoim) + '₽</button>';
    hd += '</div>';
  }
  hd += '<div class="lot-refresh" style="margin:10px 0;text-align:center;font-size:12px;color:#888">🏠 Все дома</div>';
  for (var dd = 0; dd < doma.length; dd++) {
    var d2 = doma[dd];
    if (d2.id == 'street') continue;
    var aktivnyy = (moeDom == d2.id);
    hd += '<div class="card' + (aktivnyy ? ' green' : '') + '"><div class="card-row">';
    hd += '<div class="card-info"><div class="card-name">' + d2.icon + ' ' + d2.name + '</div>';
    hd += '<div class="card-meta">Сон: +' + d2.son + ' ⚡ · Доход: ' + formatChislo(d2.dohod) + '₽/день</div>';
    hd += '<div class="card-meta">' + (aktivnyy ? '✅ Живёшь тут' : formatChislo(d2.cena) + '₽') + '</div></div>';
    if (aktivnyy) hd += '<div class="ach-reward">✅</div>';
    else if (dengi >= d2.cena) hd += '<button class="btn small" onclick="kupitDom(\'' + d2.id + '\')">Купить</button>';
    else hd += '<button class="btn small" disabled>Нет</button>';
    hd += '</div></div>';
  }
  hd += '<div class="lot-refresh" style="margin:16px 0 8px;text-align:center;font-size:12px;color:#888">🏗️ Второй дом</div>';
  if (!vtoroyDom) {
    var cenaMesta = tekushchiy.cena;
    if (cenaMesta > 0) {
      hd += '<div class="card purple"><div class="card-name" style="margin-bottom:6px">Место под 2-й дом</div>';
      hd += '<div class="card-meta">Цена: ' + formatChislo(cenaMesta) + '₽</div>';
      if (dengi >= cenaMesta) hd += '<button class="btn purple full" onclick="kupitMesto()">🏗️ Купить место</button>';
      else hd += '<button class="btn full" disabled>Нужно ' + formatChislo(cenaMesta) + '₽</button>';
      hd += '</div>';
    }
  } else if (!vtoroyDomId) {
    hd += '<div class="card green"><div class="card-name" style="margin-bottom:8px">✅ Место куплено</div>';
    hd += '<div class="card-meta">Выбери второй дом:</div>';
    for (var di = 0; di < doma.length; di++) {
      var d3 = doma[di];
      if (d3.id == 'street') continue;
      var mozhno = dengi >= d3.cena;
      hd += '<div class="card-row" style="margin-top:6px">';
      hd += '<div class="card-info"><div class="card-name">' + d3.icon + ' ' + d3.name + '</div><div class="card-meta">' + formatChislo(d3.cena) + '₽</div></div>';
      if (mozhno) hd += '<button class="btn small" onclick="kupitVtoroyDom(\'' + d3.id + '\')">Купить</button>';
      else hd += '<button class="btn small" disabled>Нет</button>';
      hd += '</div>';
    }
    hd += '</div>';
  } else {
    var vd = naytiDom(vtoroyDomId);
    var vDohod = dohodDomaSUp(vd, vtoroyDomUp);
    var arenda = Math.floor(vd.cena * ARENDA_PROCENT);
    hd += '<div class="card purple"><div class="card-name">' + vd.icon + ' ' + vd.name + (vtoroyDomUp > 0 ? ' +' + vtoroyDomUp : '') + '</div>';
    hd += '<div class="card-meta">Доход: +' + formatChislo(vDohod) + '₽/день</div>';
    hd += '<div class="card-meta">Аренда: +' + formatChislo(arenda) + '₽/день</div>';
    if (vtoroyDomUp < MAX_DOM_UP) {
      var upVtor = stoimostUpDoma(vd, vtoroyDomUp);
      if (dengi >= upVtor) hd += '<button class="btn purple full" onclick="upVtoroyDom()">🏗️ Прокачать за ' + formatChislo(upVtor) + '₽</button>';
      else hd += '<button class="btn full" disabled>Нужно ' + formatChislo(upVtor) + '₽</button>';
    }
    hd += '</div>';
  }
  c.innerHTML = hd;
}

function renderBank(c) {
  var maxK = 5000 + lvl * 3000;
  var hb = '<div class="card"><div class="card-name" style="margin-bottom:8px">🏦 Банк</div>';
  hb += '<div class="card-meta">Возврат: +30%</div>';
  if (dolg > 0) {
    hb += '<div class="card-meta" style="color:#ff6666">💸 Долг: ' + formatChislo(dolg) + '₽</div>';
    hb += '<button class="btn green full" onclick="oplatitDolg()">✅ Погасить</button>';
  } else {
    hb += '<div class="card-meta">Макс: ' + formatChislo(maxK) + '₽</div>';
  }
  hb += '</div>';
  if (dolg == 0) {
    var summy = [1000, 5000, 20000, 50000, maxK];
    for (var s2 = 0; s2 < summy.length; s2++) {
      var sm = summy[s2];
      if (sm > maxK) continue;
      hb += '<div class="card"><div class="card-row">';
      hb += '<div class="card-info"><div class="card-name">Взять ' + formatChislo(sm) + '₽</div>';
      hb += '<div class="card-meta">Вернуть: ' + formatChislo(Math.floor(sm * 1.3)) + '₽</div></div>';
      hb += '<button class="btn" onclick="vzyatKredit(' + sm + ')">Взять</button>';
      hb += '</div></div>';
    }
  }
  c.innerHTML = hb;
}

function renderAch(c) {
  var ha = '';
  var vyp = 0;
  for (var a = 0; a < dostizheniya.length; a++) {
    var d3 = dostizheniya[a];
    if (d3.done) vyp++;
    ha += '<div class="ach' + (d3.done ? ' done' : '') + '">';
    ha += '<div class="ach-icon">' + d3.icon + '</div>';
    ha += '<div class="ach-info"><div class="ach-name">' + d3.name + '</div>';
    ha += '<div class="ach-desc">' + d3.desc + '</div></div>';
    ha += '<div class="ach-reward">' + (d3.done ? '✅ +' : '+') + formatChislo(d3.reward) + '₽</div>';
    ha += '</div>';
  }
  ha = '<div style="text-align:center;margin-bottom:10px;font-size:12px;color:#888">🏅 ' + vyp + '/' + dostizheniya.length + '</div>' + ha;
  c.innerHTML = ha;
}

function renderSkins(c) {
  var hs = '';
  for (var sk = 0; sk < skiny.length; sk++) {
    var s3 = skiny[sk];
    hs += '<div class="skin' + (activeSkin == s3.id ? ' active' : '') + '">';
    hs += '<div class="skin-icon">' + s3.id + '</div>';
    hs += '<div class="skin-info"><div class="skin-name">' + s3.name + '</div>';
    hs += '<div class="card-meta">' + (s3.price == 0 ? 'Бесплатно' : formatChislo(s3.price) + '₽') + '</div></div>';
    if (activeSkin == s3.id) hs += '<div class="ach-reward">✅</div>';
    else if (dengi >= s3.price) hs += '<button class="btn small" onclick="kupitSkin(\'' + s3.id + '\')">' + (s3.price == 0 ? 'Выбрать' : 'Купить') + '</button>';
    else hs += '<button class="btn small" disabled>Нет</button>';
    hs += '</div>';
  }
  c.innerHTML = hs;
}

function renderSettings(c, v) {
  var hst = '';
  hst += '<div class="setting-row"><div class="setting-info"><div class="setting-name">🌗 Тёмная тема</div></div>';
  hst += '<div class="switch' + (tema == 'dark' ? ' on' : '') + '" onclick="pereklTemu()"></div></div>';
  hst += '<div class="setting-row"><div class="setting-info"><div class="setting-name">🎰 Окна при заходе</div></div>';
  hst += '<div class="switch' + (pokazyvatModalki ? ' on' : '') + '" onclick="pereklModalki()"></div></div>';
  hst += '<div class="card purple"><div class="card-name">📅 Игровое время</div>';
  hst += '<div class="card-meta">День ' + v.den + ' · ' + formatTime(v.chas, v.min) + '</div>';
  hst += '<div class="card-meta">В игре: 1 сек = 1 мин · Вне игры: 1 сек = 1 сек</div></div>';
  hst += '<div class="card"><div class="card-name">📊 Статистика</div>';
  hst += '<div class="card-meta">Куплено: ' + kupilVsego + ' · Продано: ' + prodalVsego + '</div>';
  hst += '<div class="card-meta">Уровень: ' + lvl + ' · Энергия: ' + energ + '/' + maxEnerg + '</div></div>';
  hst += '<div class="card"><div class="card-name" style="margin-bottom:8px">🔐 Секретный код</div>';
  hst += '<button class="btn full" onclick="otkritParol()">🔑 Ввести код</button></div>';
  hst += '<div class="card red"><div class="card-name" style="margin-bottom:8px">🗑️ Сброс</div>';
  hst += '<button class="btn red full" onclick="sbrosProgressa()">Сбросить прогресс</button></div>';
  c.innerHTML = hst;
      }
