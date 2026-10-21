var SAVE_VERSION = 5;
var SAVE_KEY_LOCAL = 'perekup';
var SAVE_KEY_VK = 'perekup_save_v2';

var igrovoySdvig = 0;
var vremyaZahoda = Date.now();
var posledneeSohr = Date.now();
var sohranenieVProtsesse = false;

var user = null;
var dengi = 1000;
var lvl = 1;
var opyt = 0;
var energ = 20;
var maxEnerg = 20;
var inv = [];
var loty = [];
var dolg = 0;
var activeSkin = '👤';
var tab = 'market';
var tema = 'dark';
var moeDom = 'street';
var vtoroyDom = null;
var domUp = 0;
var vtoroyDomId = null;
var vtoroyDomUp = 0;
var poslDohodDen = 0;

var poslBonus = 0;
var seriyaDney = 0;
var poslSonDen = 0;
var poslEdaMin = -9999;
var poslEnergMin = -9999;
var pokazyvatModalki = true;

var posledVidenVersiya = '';
var TEKUSHCHAYA_VERSIYA = '1.2';

var kupilVsego = 0;
var prodalVsego = 0;
var jackpotVyl = false;
var apnutoDo5 = 0;
var vystavlenoLotov = 0;
var sEdeno = 0;
var sEdenoRestoran = 0;
var pospalRaz = 0;
var skinKingKupil = false;
var skinDragonKupil = false;
var bralKredit = false;
var platilDolg = false;

var rynokCateg = 'all';
var casinoTab = 'keysy';
var rulPoslRezultat = '';
var upgradeVybranUid = null;
var upgradeResult = '';

function tekuscheeIgrovoeMs() {
  var vIgre = (Date.now() - vremyaZahoda) * MNOZHITEL_V_IGRE;
  return igrovoySdvig + vIgre;
}

function vremyaIgry() {
  var ms = tekuscheeIgrovoeMs();
  var vsegoMinut = Math.floor(ms / 60000);
  var den = Math.floor(vsegoMinut / 1440) + 1;
  var chas = Math.floor((vsegoMinut % 1440) / 60);
  var min = vsegoMinut % 60;
  return { den: den, chas: chas, min: min };
}

function formatTime(chas, min) {
  var hh = chas < 10 ? '0' + chas : chas;
  var mm = min < 10 ? '0' + min : min;
  return hh + ':' + mm;
}

function primenitTemu() {
  if (tema == 'light') document.body.classList.add('light');
  else document.body.classList.remove('light');
}

function sobratSaveObekt() {
  return {
    version: SAVE_VERSION,
    dengi: dengi, lvl: lvl, opyt: opyt,
    energ: energ, maxEnerg: maxEnerg,
    inv: inv, loty: loty, dolg: dolg,
    poslBonus: poslBonus, seriyaDney: seriyaDney,
    poslSonDen: poslSonDen, poslEdaMin: poslEdaMin, poslEnergMin: poslEnergMin,
    activeSkin: activeSkin, dostizheniya: dostizheniya,
    kupilVsego: kupilVsego, prodalVsego: prodalVsego,
    jackpotVyl: jackpotVyl, tema: tema, moeDom: moeDom,
    vtoroyDom: vtoroyDom, pokazyvatModalki: pokazyvatModalki,
    domUp: domUp, vtoroyDomId: vtoroyDomId, vtoroyDomUp: vtoroyDomUp,
    poslDohodDen: poslDohodDen,
    posledVidenVersiya: posledVidenVersiya,
    apnutoDo5: apnutoDo5, vystavlenoLotov: vystavlenoLotov,
    sEdeno: sEdeno, sEdenoRestoran: sEdenoRestoran,
    pospalRaz: pospalRaz, skinKingKupil: skinKingKupil,
    skinDragonKupil: skinDragonKupil,
    bralKredit: bralKredit, platilDolg: platilDolg,
    igrovoySdvig: igrovoySdvig,
    posledneeSohr: posledneeSohr
  };
}

function sohranit() {
  if (sohranenieVProtsesse) return;
  sohranenieVProtsesse = true;
  igrovoySdvig = tekuscheeIgrovoeMs();
  vremyaZahoda = Date.now();
  posledneeSohr = Date.now();
  var data = sobratSaveObekt();
  var json = JSON.stringify(data);
  try { localStorage.setItem(SAVE_KEY_LOCAL, json); } catch(e) {}
  if (typeof vkBridge !== 'undefined' && vkBridge && vkBridge.send) {
    try { vkBridge.send('VKWebAppStorageSet', { key: SAVE_KEY_VK, value: json }).catch(function() {}); } catch(e) {}
  }
  sohranenieVProtsesse = false;
}

function primenitSave(d) {
  if (!d || typeof d !== 'object') return;
  if (typeof d.dengi === 'number' && d.dengi >= 0 && isFinite(d.dengi)) dengi = d.dengi;
  if (typeof d.lvl === 'number' && d.lvl >= 1 && d.lvl <= 1000) lvl = d.lvl;
  if (typeof d.opyt === 'number' && d.opyt >= 0) opyt = d.opyt;
  if (typeof d.energ === 'number' && d.energ >= 0) energ = d.energ;
  if (typeof d.maxEnerg === 'number' && d.maxEnerg >= 20) maxEnerg = d.maxEnerg;
  if (Array.isArray(d.inv)) inv = d.inv.filter(function(x) { return x && x.itemId && naytiTovar(x.itemId); });
  if (Array.isArray(d.loty)) {
    loty = d.loty.filter(function(x) { return x && x.itemId && naytiTovar(x.itemId); });
    for (var li = 0; li < loty.length; li++) {
      if (!loty[li].srokDo) loty[li].srokDo = Date.now() + SROK_LOTA_MS;
      if (!loty[li].vremyaStart) loty[li].vremyaStart = Date.now();
      if (typeof loty[li].shansProdagy !== 'number') loty[li].shansProdagy = 50;
      if (typeof loty[li].vremyaOzhidaniya !== 'number') loty[li].vremyaOzhidaniya = 5000;
      if (!loty[li].vremyaAktivnosti) loty[li].vremyaAktivnosti = loty[li].vremyaStart + loty[li].vremyaOzhidaniya + 30000;
    }
  }
  if (typeof d.dolg === 'number' && d.dolg >= 0) dolg = d.dolg;
  if (typeof d.poslBonus === 'number') poslBonus = d.poslBonus;
  if (typeof d.seriyaDney === 'number') seriyaDney = d.seriyaDney;
  if (typeof d.poslSonDen === 'number') poslSonDen = d.poslSonDen;
  if (typeof d.poslEdaMin === 'number') poslEdaMin = d.poslEdaMin;
  if (typeof d.poslEnergMin === 'number' && d.poslEnergMin > 0) poslEnergMin = d.poslEnergMin;
  else poslEnergMin = -9999;
  if (typeof d.activeSkin === 'string') activeSkin = d.activeSkin;
  if (Array.isArray(d.dostizheniya)) {
    for (var i = 0; i < d.dostizheniya.length; i++) {
      for (var j = 0; j < dostizheniya.length; j++) {
        if (dostizheniya[j].id == d.dostizheniya[i].id) dostizheniya[j].done = !!d.dostizheniya[i].done;
      }
    }
  }
  if (typeof d.kupilVsego === 'number' && d.kupilVsego >= 0) kupilVsego = d.kupilVsego;
  if (typeof d.prodalVsego === 'number' && d.prodalVsego >= 0) prodalVsego = d.prodalVsego;
  if (typeof d.jackpotVyl === 'boolean') jackpotVyl = d.jackpotVyl;
  if (d.tema === 'dark' || d.tema === 'light') tema = d.tema;
  if (typeof d.moeDom === 'string' && naytiDom(d.moeDom)) moeDom = d.moeDom;
  if (d.vtoroyDom === 'mesto' || d.vtoroyDom === null) vtoroyDom = d.vtoroyDom;
  if (typeof d.pokazyvatModalki === 'boolean') pokazyvatModalki = d.pokazyvatModalki;
  if (typeof d.posledVidenVersiya === 'string') posledVidenVersiya = d.posledVidenVersiya;
  if (typeof d.domUp === 'number') domUp = d.domUp;
  if (typeof d.vtoroyDomId === 'string' && naytiDom(d.vtoroyDomId)) vtoroyDomId = d.vtoroyDomId;
  if (typeof d.vtoroyDomUp === 'number') vtoroyDomUp = d.vtoroyDomUp;
  if (typeof d.poslDohodDen === 'number') poslDohodDen = d.poslDohodDen;
  if (typeof d.apnutoDo5 === 'number') apnutoDo5 = d.apnutoDo5;
  if (typeof d.vystavlenoLotov === 'number') vystavlenoLotov = d.vystavlenoLotov;
  if (typeof d.sEdeno === 'number') sEdeno = d.sEdeno;
  if (typeof d.sEdenoRestoran === 'number') sEdenoRestoran = d.sEdenoRestoran;
  if (typeof d.pospalRaz === 'number') pospalRaz = d.pospalRaz;
  if (typeof d.skinKingKupil === 'boolean') skinKingKupil = d.skinKingKupil;
  if (typeof d.skinDragonKupil === 'boolean') skinDragonKupil = d.skinDragonKupil;
  if (typeof d.bralKredit === 'boolean') bralKredit = d.bralKredit;
  if (typeof d.platilDolg === 'boolean') platilDolg = d.platilDolg;
  var oldSdvig = (typeof d.igrovoySdvig === 'number') ? d.igrovoySdvig : 0;
  var oldSohr = (typeof d.posledneeSohr === 'number') ? d.posledneeSohr : Date.now();
  var proshloOffline = Date.now() - oldSohr;
  if (proshloOffline < 0) proshloOffline = 0;
  if (proshloOffline > 24 * 60 * 60 * 1000) proshloOffline = 24 * 60 * 60 * 1000;
  igrovoySdvig = oldSdvig + proshloOffline;
  if (energ > maxEnerg) energ = maxEnerg;
}

function zagruzit() {
  var zagruzheno = false;
  try {
    var s = localStorage.getItem(SAVE_KEY_LOCAL);
    if (s) { var d = JSON.parse(s); primenitSave(d); zagruzheno = true; }
  } catch(e) {}
  if (!zagruzheno && typeof vkBridge !== 'undefined' && vkBridge && vkBridge.send) {
    try {
      vkBridge.send('VKWebAppStorageGet', { keys: [SAVE_KEY_VK] })
        .then(function(res) {
          if (res && res.keys && res.keys[0] && res.keys[0].value) {
            try {
              var d = JSON.parse(res.keys[0].value);
              primenitSave(d);
              sohranit();
              render();
            } catch(e) {}
          }
        }).catch(function() {});
    } catch(e) {}
  }
  vremyaZahoda = Date.now();
  posledneeSohr = Date.now();
}

function sbrosProgressa() {
  if (!confirm('⚠️ ТОЧНО сбросить прогресс?')) return;
  if (!confirm('⚠️ Последнее предупреждение!')) return;
  try { localStorage.removeItem(SAVE_KEY_LOCAL); } catch(e) {}
  igrovoySdvig = 0;
  vremyaZahoda = Date.now();
  posledneeSohr = Date.now();
  dengi = 1000; lvl = 1; opyt = 0;
  maxEnerg = 22; energ = 22;
  inv = []; loty = []; dolg = 0;
  activeSkin = '👤';
  poslBonus = 0; seriyaDney = 0;
  poslSonDen = 0; poslEdaMin = -9999; poslEnergMin = -9999;
  kupilVsego = 0; prodalVsego = 0;
  jackpotVyl = false; apnutoDo5 = 0; vystavlenoLotov = 0;
  sEdeno = 0; sEdenoRestoran = 0; pospalRaz = 0;
  skinKingKupil = false; skinDragonKupil = false;
  bralKredit = false; platilDolg = false;
  moeDom = 'street'; vtoroyDom = null;
  domUp = 0; vtoroyDomId = null; vtoroyDomUp = 0; poslDohodDen = 0;
  posledVidenVersiya = '';
  for (var i = 0; i < dostizheniya.length; i++) dostizheniya[i].done = false;
  toast('🗑️ Прогресс сброшен', 'ok');
  sohranit();
  render();
}

function dobavitOpyt(skolko) {
  if (typeof skolko !== 'number' || skolko <= 0) return;
  opyt += skolko;
  var povysheniya = 0;
  while (opyt >= trebOpyt(lvl + 1) && lvl < 100) {
    lvl++;
    povysheniya++;
    maxEnerg = 20 + lvl * 2;
    if (povysheniya > 50) break;
  }
  if (povysheniya > 0) {
    energ = maxEnerg;
    proveritDostizheniya();
    toast('🎉 Уровень ' + lvl + '! +' + (povysheniya * 2) + ' энергии', 'gold');
  }
}

function proveritDostizheniya() {
  for (var i = 0; i < dostizheniya.length; i++) {
    var d = dostizheniya[i];
    if (d.done) continue;
    var vypolnil = false;
    if (d.id == 'first_buy' && kupilVsego >= 1) vypolnil = true;
    if (d.id == 'first_sell' && prodalVsego >= 1) vypolnil = true;
    if (d.id == 'sell_10' && prodalVsego >= 10) vypolnil = true;
    if (d.id == 'sell_50' && prodalVsego >= 50) vypolnil = true;
    if (d.id == 'sell_100' && prodalVsego >= 100) vypolnil = true;
    if (d.id == 'sell_200' && prodalVsego >= 200) vypolnil = true;
    if (d.id == 'sell_1000' && prodalVsego >= 1000) vypolnil = true;
    if (d.id == 'sell_5000' && prodalVsego >= 5000) vypolnil = true;
    if (d.id == 'lvl_5' && lvl >= 5) vypolnil = true;
    if (d.id == 'lvl_10' && lvl >= 10) vypolnil = true;
    if (d.id == 'lvl_15' && lvl >= 15) vypolnil = true;
    if (d.id == 'lvl_20' && lvl >= 20) vypolnil = true;
    if (d.id == 'lvl_25' && lvl >= 25) vypolnil = true;
    if (d.id == 'lvl_30' && lvl >= 30) vypolnil = true;
    if (d.id == 'money_10k' && dengi >= 10000) vypolnil = true;
    if (d.id == 'money_100k' && dengi >= 100000) vypolnil = true;
    if (d.id == 'money_1m' && dengi >= 1000000) vypolnil = true;
    if (d.id == 'money_10m' && dengi >= 10000000) vypolnil = true;
    if (d.id == 'money_100m' && dengi >= 100000000) vypolnil = true;
    if (d.id == 'money_1b' && dengi >= 1000000000) vypolnil = true;
    if (d.id == 'money_10b' && dengi >= 10000000000) vypolnil = true;
    if (d.id == 'dom_flat1' && (moeDom == 'flat_1' || moeDom == 'flat_2' || moeDom == 'house' || moeDom == 'villa' || moeDom == 'mansion')) vypolnil = true;
    if (d.id == 'dom_flat2' && (moeDom == 'flat_2' || moeDom == 'house' || moeDom == 'villa' || moeDom == 'mansion')) vypolnil = true;
    if (d.id == 'dom_house' && (moeDom == 'house' || moeDom == 'villa' || moeDom == 'mansion')) vypolnil = true;
    if (d.id == 'dom_villa' && (moeDom == 'villa' || moeDom == 'mansion')) vypolnil = true;
    if (d.id == 'dom_mansion' && moeDom == 'mansion') vypolnil = true;
    if (d.id == 'dom_vtoroy' && vtoroyDom === 'mesto') vypolnil = true;
    if (d.id == 'up_5' && apnutoDo5 >= 1) vypolnil = true;
    if (d.id == 'up_10' && apnutoDo5 >= 10) vypolnil = true;
    if (d.id == 'up_50' && apnutoDo5 >= 50) vypolnil = true;
    if (d.id == 'lot_first' && vystavlenoLotov >= 1) vypolnil = true;
    if (d.id == 'lot_100' && vystavlenoLotov >= 100) vypolnil = true;
    if (d.id == 'food_shaurma' && sEdeno >= 1) vypolnil = true;
    if (d.id == 'food_rest' && sEdenoRestoran >= 1) vypolnil = true;
    if (d.id == 'sleep_10' && pospalRaz >= 10) vypolnil = true;
    if (d.id == 'skin_king' && skinKingKupil) vypolnil = true;
    if (d.id == 'skin_dragon' && skinDragonKupil) vypolnil = true;
    if (d.id == 'bank_first' && bralKredit) vypolnil = true;
    if (d.id == 'bank_clean' && platilDolg) vypolnil = true;
    if (vypolnil) {
      d.done = true;
      dengi += d.reward;
      (function(name, r) {
        setTimeout(function() { toast('🏅 ' + name + ' +' + formatChislo(r) + '₽', 'gold'); }, 500);
      })(d.name, d.reward);
    }
  }
}

function rasschitatShansICena(l, item) {
  var minC = minCenaTovara(item, l.ap);
  var maxC = maxCenaTovara(item, l.ap);
  var diap = maxC - minC;
  if (diap < 1) diap = 1;
  var otklonenie = (l.moyaCena - minC) / diap;
  if (otklonenie < 0) otklonenie = 0;
  if (otklonenie > 1) otklonenie = 1;
  var bonusAp = l.ap * SHANS_BONUS_ZA_AP;
  var shans = SHANS_BAZA - otklonenie * (SHANS_RAZMER - bonusAp);
  if (shans < 5) shans = 5;
  if (shans > 95) shans = 95;
  var vremya = VREMYA_PRODAZHI_MIN + otklonenie * (VREMYA_PRODAZHI_MAX - VREMYA_PRODAZHI_MIN);
  l.shansProdagy = Math.round(shans);
  l.vremyaOzhidaniya = Math.round(vremya * 1000);
  l.vremyaStart = Date.now();
  l.vremyaAktivnosti = Date.now() + l.vremyaOzhidaniya + 30000;
}

function sekDoProdazhi(l) {
  var proshlo = Date.now() - l.vremyaStart;
  var ostalos = l.vremyaOzhidaniya - proshlo;
  if (ostalos < 0) ostalos = 0;
  return Math.ceil(ostalos / 1000);
}

function stoimostUpDoma(dom, up) {
  return Math.floor(dom.cena * DOM_UP_CENA_PROCENT * (1 + up * 0.5));
}

function dohodDomaSUp(dom, up) {
  return Math.floor(dom.dohod * (1 + up * 0.5));
}

function sonDomaSUp(dom, up) {
  return Math.floor(dom.son * (1 + up * 0.5));
}
