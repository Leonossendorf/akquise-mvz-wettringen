/* MVZ Wettringen – Entwurf von Leon Oßendorf. Kein Tracking, keine externen Dienste. */
(function () {
  "use strict";
  var html = document.documentElement, D = window.MVZ || {};
  html.classList.add("js");

  /* Schriftgröße merken */
  function pref(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setPref(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  var fsBtn = document.getElementById("btn-schrift");
  if (fsBtn) {
    var sync = function () { fsBtn.setAttribute("aria-pressed", html.classList.contains("fs-1") || html.classList.contains("fs-2") ? "true" : "false"); };
    fsBtn.addEventListener("click", function () {
      if (html.classList.contains("fs-2")) { html.classList.remove("fs-2"); setPref("mvz-fs", null); }
      else if (html.classList.contains("fs-1")) { html.classList.remove("fs-1"); html.classList.add("fs-2"); setPref("mvz-fs", "2"); }
      else { html.classList.add("fs-1"); setPref("mvz-fs", "1"); }
      sync();
    });
    sync();
  }

  /* Menü auf dem Handy */
  var tog = document.querySelector(".nav-toggle"), nav = document.getElementById("hauptmenue");
  if (tog && nav) tog.addEventListener("click", function () { var o = nav.classList.toggle("offen"); tog.setAttribute("aria-expanded", o ? "true" : "false"); });

  /* Hilfen für Datum und Zeit */
  var TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function fmtDatum(s) { var p = s.split("-"); return p[2] + "." + p[1] + "." + p[0]; }
  function fmtZeit(h, m) { return h + ":" + ("0" + m).slice(-2); }
  function isoWoche(d) { /* Kalenderwoche nach ISO 8601 */
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var tag = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - tag);
    var start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - start) / 864e5 + 1) / 7);
  }
  function zeitenAm(d) { /* Sprechzeiten für ein Datum, inkl. Dienstag-Regel */
    var z = D.zeiten && D.zeiten[d.getDay()]; if (!z) return [];
    z = z.slice();
    if (d.getDay() === 2 && D.dienstagGeradeKW && isoWoche(d) % 2 === 0) z[0] = D.dienstagGeradeKW;
    return z;
  }
  function schliessungAm(s) { var L = D.schliessungen || []; for (var i = 0; i < L.length; i++) if (s >= L[i][0] && s <= L[i][1]) return L[i]; return null; }
  function geschlossenAm(d) { var s = iso(d); return !zeitenAm(d).length || (D.feiertage || []).indexOf(s) >= 0 || schliessungAm(s); }
  function naechsteOeffnung(von) {
    var d = new Date(von.getFullYear(), von.getMonth(), von.getDate());
    for (var i = 0; i < 40; i++) {
      if (!geschlossenAm(d)) {
        var z = zeitenAm(d);
        for (var k = 0; k < z.length; k++) { var t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), z[k][0], z[k][1]); if (t > von) return { tag: d, h: z[k][0], m: z[k][1], heute: i === 0 }; }
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  }
  function spanne(z) { return fmtZeit(z[0], z[1]) + "–" + fmtZeit(z[2], z[3]) + " Uhr"; }

  /* Status „heute“ */
  function status(now) {
    var box = document.getElementById("status"), st = document.getElementById("status-zustand"), tx = document.getElementById("status-text");
    if (!box || !st || !tx) return;
    var s = iso(now), u = schliessungAm(s), n = naechsteOeffnung(now), nt = "";
    if (n) nt = (n.heute ? "heute" : (n.tag.getTime() - now.getTime() < 6 * 864e5 ? "am " + TAGE[n.tag.getDay()] : "am " + fmtDatum(iso(n.tag)))) + " ab " + fmtZeit(n.h, n.m) + " Uhr";
    box.classList.remove("offen", "zu");
    if (u) { box.classList.add("zu"); st.textContent = "Geschlossen bis " + fmtDatum(u[1]); tx.textContent = (u[2] ? u[2] + " " : "") + (n ? "Wir sind " + nt + " wieder für Sie da." : ""); return; }
    var z = geschlossenAm(now) ? [] : zeitenAm(now), min = now.getHours() * 60 + now.getMinutes();
    for (var k = 0; k < z.length; k++) {
      var a = z[k][0] * 60 + z[k][1], b = z[k][2] * 60 + z[k][3];
      if (min >= a && min < b) {
        box.classList.add("offen"); st.textContent = "Jetzt geöffnet, bis " + fmtZeit(z[k][2], z[k][3]) + " Uhr";
        tx.textContent = z[k + 1] ? "Heute außerdem " + spanne(z[k + 1]) + "." : "Heute keine Nachmittagssprechstunde.";
        return;
      }
    }
    box.classList.add("zu"); st.textContent = "Zurzeit geschlossen";
    tx.textContent = n ? "Wir sind " + nt + " wieder für Sie da." : "Bitte beachten Sie die Sprechzeiten.";
  }

  /* Tabelle und Kurzform aus derselben Quelle */
  function tabelle() {
    var t = document.getElementById("zeiten-tabelle"); if (!t || !D.zeiten) return;
    var heute = new Date().getDay(), h = "<table><caption class=\"visually-hidden\">Sprechzeiten je Wochentag, Angaben in Uhr</caption><thead><tr><th scope=\"col\">Tag</th><th scope=\"col\">Vormittag</th><th scope=\"col\">Nachmittag</th></tr></thead><tbody>";
    var kurz = function (z) { return fmtZeit(z[0], z[1]) + "–" + fmtZeit(z[2], z[3]); };
    for (var d = 1; d <= 5; d++) {
      var z = D.zeiten[d] || [], vm = z[0] ? kurz(z[0]) : "–", nm = z[1] ? kurz(z[1]) : "–";
      if (d === 2 && D.dienstagGeradeKW) vm += "<br><span class=\"small leise\">in geraden Kalenderwochen ab " + fmtZeit(D.dienstagGeradeKW[0], D.dienstagGeradeKW[1]) + " Uhr</span>";
      h += "<tr" + (d === heute ? " class=\"heute\"" : "") + "><th scope=\"row\">" + TAGE[d] + "</th><td>" + vm + "</td><td>" + nm + "</td></tr>";
    }
    t.innerHTML = h + "</tbody></table>";
  }
  function kurzform() {
    var els = document.querySelectorAll("[data-zeiten-kurz]"); if (!els.length || !D.zeiten) return;
    var vm = D.zeiten[1][0], nm = D.zeiten[1][1], tageNm = [];
    for (var d = 1; d <= 5; d++) if (D.zeiten[d] && D.zeiten[d][1]) tageNm.push(TAGE[d].slice(0, 2));
    var s = "Mo–Fr " + spanne(vm) + (nm ? ", " + tageNm.join(", ") + " " + spanne(nm) : "");
    for (var i = 0; i < els.length; i++) els[i].textContent = s;
  }

  /* Meldungen mit Ablaufdatum */
  function meldungen() {
    var ziel = document.getElementById("meldungen"); if (!ziel || !D.meldungen) return;
    var heute = iso(new Date()), max = parseInt(ziel.getAttribute("data-max") || "99", 10), n = 0, h = "";
    var L = D.meldungen.slice().sort(function (a, b) { return a.datum < b.datum ? 1 : -1; });
    for (var i = 0; i < L.length && n < max; i++) {
      var m = L[i]; if (m.bis && m.bis < heute) continue; n++;
      h += "<article class=\"meldung\"><time datetime=\"" + m.datum + "\">" + fmtDatum(m.datum).slice(0, 6) + "</time><div><h3>" + m.titel + (m.beispiel ? " <span class=\"beispiel\">Beispiel</span>" : "") + "</h3><p>" + m.text + (m.link ? " <a href=\"" + m.link + "\">Mehr dazu</a>" : "") + "</p></div></article>";
    }
    ziel.innerHTML = h || "<p class=\"leise\">Zurzeit keine Meldungen.</p>";
  }
  try { status(new Date()); tabelle(); kurzform(); meldungen(); } catch (e) {}

  /* Team-Filter „Wer hilft mir bei …?“ */
  var filter = document.querySelector(".chips[data-filter]");
  if (filter) {
    var btns = filter.querySelectorAll("button"), personen = document.querySelectorAll(".person[data-tags]"), info = document.getElementById("filter-info");
    for (var b = 0; b < btns.length; b++) btns[b].addEventListener("click", function () {
      var tag = this.getAttribute("data-tag");
      for (var j = 0; j < btns.length; j++) btns[j].setAttribute("aria-pressed", btns[j] === this ? "true" : "false");
      var n = 0;
      for (var p = 0; p < personen.length; p++) { var on = tag === "alle" || (" " + personen[p].getAttribute("data-tags") + " ").indexOf(" " + tag + " ") >= 0; personen[p].classList.toggle("ausgeblendet", !on); if (on) n++; }
      if (info) info.textContent = tag === "alle" ? "" : n + (n === 1 ? " Person" : " Personen") + " für „" + this.textContent.trim() + "“.";
    });
  }

  /* Formulare: Vorauswahl über ?anliegen=… oder ?stelle=… bzw. #…, Demo-Versand */
  function vorauswahl() {
    var q = location.search.replace("?", "").split("&"), wert = null;
    for (var i = 0; i < q.length; i++) { var kv = q[i].split("="); if (kv[0] === "anliegen" || kv[0] === "stelle") wert = decodeURIComponent(kv[1] || ""); }
    if (!wert && location.hash) wert = location.hash.replace("#", "");
    if (!wert) return;
    var r = document.querySelector('input[name="anliegen"][value="' + wert + '"], input[name="stelle"][value="' + wert + '"]');
    if (!r) return;
    r.checked = true;
    var f = r.form; if (f) { f.setAttribute("tabindex", "-1"); f.scrollIntoView({ block: "start" }); }
  }
  vorauswahl();
  var forms = document.querySelectorAll("form[data-demo]");
  for (var f = 0; f < forms.length; f++) (function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var err = form.querySelector(".fehler"), tel = form.querySelector("input[type=tel]"), mail = form.querySelector("input[type=email]");
      if (err) err.textContent = "";
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (tel && mail && !tel.value.trim() && !mail.value.trim()) { if (err) err.textContent = "Bitte geben Sie eine Telefonnummer oder eine E-Mail-Adresse an, damit wir Sie erreichen können."; tel.focus(); return; }
      var ok = document.getElementById(form.getAttribute("data-demo"));
      if (ok) { ok.hidden = false; ok.setAttribute("tabindex", "-1"); ok.focus(); ok.scrollIntoView({ block: "start" }); }
      form.hidden = true;
    });
  })(forms[f]);

  /* Sanftes Einblenden beim Scrollen (ruhig, einmalig, achtet prefers-reduced-motion) */
  var reduziert = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var secs = document.querySelectorAll("main > section:not(.hero2), .kreuz");
  for (var q = 0; q < secs.length; q++) if (!secs[q].classList.contains("kreuz")) secs[q].classList.add("reveal");
  if (reduziert || !("IntersectionObserver" in window)) { for (var q2 = 0; q2 < secs.length; q2++) secs[q2].classList.add("in"); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    for (var q3 = 0; q3 < secs.length; q3++) io.observe(secs[q3]);
    /* Sicherheitsnetz: spätestens nach 2,5 s ist alles sichtbar, auch ohne Scrollen */
    setTimeout(function () { for (var q4 = 0; q4 < secs.length; q4++) secs[q4].classList.add("in"); }, 2500);
  }
})();
