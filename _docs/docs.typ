#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge
== Dokumentácia: #text(weight: "regular")[
  Aplikácia na textovú komunikáciu
]

=== Zadanie

Vytvorte progresívnu webovú aplikáciu na textovú komunikáciu v štýle IRC (Slack), ktorá komplexne rieši nižšie definované prípady použitia.

=== Diagram dátového modelu
#image("database.png")
Dodatočné zmeny:
- pridaný `user_kicks` table pre zaznamenávanie odchodu a blokovania užívateľov

=== Diagram architektúry aplikácie
#image("comms.png", width: 60%)

=== Návrhové rozhodnutia
- Argon2 je odporúčaný algoritmus pre hashovanie hesiel aj od vývojarov Adonis.js: https://docs.adonisjs.com/guides/security/hashing#argon
- Frontend: Používa sa balík `unplugin-vue-router` pre typovanie samotných routov v SPA, na základe toho sa používa file-based routing
- Frontend: Pouzivame `@vueuse` balíky pre jednoduchšiu prácu s Vue komponentami, a aj aby sme nemuseli alokovať zdroje na opätovnú implementáciu niektorých veci. To, čo ponúka rámec Quasar, nie je vždy reaktívne.

=== Screenshoty

#image("screen-04.png")
#image("screen-05.png")
#image("screen-01.png")
#image("screen-02.png")
#image("screen-03.png")
