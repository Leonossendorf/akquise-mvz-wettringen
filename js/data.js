/* MVZ Wettringen – Entwurf. Eine Quelle für Sprechzeiten, Schließtage und Meldungen.
   Alles, was sich ändert, steht nur hier. Die Seite zeigt es überall gleich. */
window.MVZ = {
  telefon: "02557 377",
  telefonLink: "tel:+492557377",
  medflex: "https://medflex.de", /* im Entwurf: Startseite von medflex; im echten Projekt der Praxislink */

  /* Sprechzeiten je Wochentag (1 = Montag … 5 = Freitag), Zeiten in [Stunde, Minute, Stunde, Minute].
     Quelle: mvz-wettringen.de, Kontaktblock der Startseite, Stand 28.10.2026. */
  zeiten: {
    1: [[7, 30, 12, 0], [14, 30, 18, 0]],
    2: [[7, 30, 12, 0], [14, 30, 18, 0]],
    3: [[7, 30, 12, 0]],
    4: [[7, 30, 12, 0], [14, 30, 18, 0]],
    5: [[7, 30, 12, 0]]
  },
  /* Sonderregel: dienstags in geraden Kalenderwochen beginnt der Vormittag um 7:00 Uhr. */
  dienstagGeradeKW: [7, 0, 12, 0],

  /* Gesetzliche Feiertage NRW */
  feiertage: ["2026-01-01", "2026-04-03", "2026-04-06", "2026-05-01", "2026-05-14", "2026-05-25", "2026-06-04", "2026-10-03", "2026-11-01", "2026-12-25", "2026-12-26",
              "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-01", "2027-05-06", "2027-05-17", "2027-05-27", "2027-10-03", "2027-11-01", "2027-12-25", "2027-12-26"],

  /* Schließtage des MVZ: [von, bis, Hinweis]. Im Entwurf leer, weil nichts belegt ist. */
  schliessungen: [],

  /* Meldungen: erscheinen auf der Startseite und unter Aktuelles, bis "bis" erreicht ist. Danach verschwinden sie von selbst.
     Die Beispiele sind als Beispiel gekennzeichnet. */
  meldungen: [
    { datum: "2026-10-01", bis: "2027-02-28", titel: "Grippeimpfung", text: "Die Grippe-Impfung bieten wir jedes Jahr im Herbst an. Fragen Sie gern bei uns nach, wir beraten Sie.", beispiel: true },
    { datum: "2025-10-01", bis: "2026-12-31", titel: "Doctor medic Alina Ionica und Dr. med. Claudia Gemen sind da", text: "Seit dem 1. Oktober 2025 behandeln die beiden Ärztinnen der früheren Praxis Ionica & Gemen in Neuenkirchen bei uns in Wettringen. Was Sie zum ersten Besuch mitbringen, steht unter „Neu bei uns“.", link: "neu-bei-uns.html", beispiel: false }
  ]
};
