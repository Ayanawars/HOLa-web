export const TRAIN_RULE_LANGUAGES=Object.freeze(['es','en','fr','de','ro','pt','uk','it','pl','tr','ru']);
const LOCALIZED_RULES={
  "fr": {
    "headings": [
      "Conditions VS",
      "Attribution quotidienne",
      "Rotation et remplaçants",
      "Tickets et confirmation"
    ],
    "minimum": [
      "Chaque score du lundi au vendredi doit être enregistré et atteindre au moins 7 200 000 points.",
      "Un seul jour sous le minimum suffit à ne pas remplir la condition VS."
    ],
    "push": "Les joueurs admissibles sont classés par total hebdomadaire décroissant.",
    "save": "Classement du lundi au jeudi uniquement, au plus près de 28 800 000 points. Le vendredi exige toujours 7 200 000 points, sans plafond ni effet sur la priorité.",
    "assignment": [
      "Priorité DS : les conducteurs de Desert Storm B et A sont réservés en premier. Un joueur également classé en VS conserve sa place DS.",
      "Du lundi au jeudi : les quatre premiers joueurs VS admissibles encore disponibles, dans l’ordre, un conducteur par jour.",
      "Vendredi : équipe B de Desert Storm, classée par points.",
      "Samedi : équipe A de Desert Storm, classée par points.",
      "Dimanche : le plus grand total de dons technologiques de la semaine précédente parmi les joueurs remplissant aussi la condition VS du lundi au vendredi.",
      "Les scores et les dons proviennent de la semaine précédant celle du train."
    ],
    "rotation": [
      "Le cycle dure quatre semaines. Un joueur ayant réellement conduit est exclu des nouvelles attributions jusqu’à la fin de ce cycle.",
      "Seul le fait de conduire utilise un tour : être désigné titulaire ou remplaçant ne suffit pas à exclure un joueur.",
      "Réserves hebdomadaires partagées : quatre VS, deux DS B, deux DS A et trois dons. Les remplaçants DS sont réservés avant les VS. Les remplacements suivent l’ordre de chaque catégorie.",
      "Le conducteur choisit librement les places VIP et Gardien."
    ],
    "tickets": [
      "Donnez 3 tickets avant le départ. Un conducteur ou remplaçant qui tente de monter sans les donner perd sa place et est exclu cette semaine et la suivante.",
      "Les membres pas encore sélectionnés sont exclus uniquement de la semaine suivante. Un R4 enregistre l’incident et le statut du membre dans les tickets du train.",
      "Le conducteur réel est confirmé dans l’administration du train. La liste prévue peut changer lors de l’enregistrement des résultats ou des conducteurs réels."
    ]
  },
  "de": {
    "headings": [
      "VS-Voraussetzung",
      "Tägliche Vergabe",
      "Rotation und Ersatzspieler",
      "Tickets und Bestätigung"
    ],
    "minimum": [
      "Jeder Tageswert von Montag bis Freitag muss erfasst sein und mindestens 7.200.000 Punkte erreichen.",
      "Wird das Minimum an nur einem Tag verfehlt, ist die VS-Voraussetzung nicht erfüllt."
    ],
    "push": "Berechtigte Spieler werden nach ihrer Wochensumme absteigend sortiert.",
    "save": "Für die Rangliste zählt nur Montag bis Donnerstag, möglichst nahe an 28.800.000 Punkten. Am Freitag gelten weiterhin mindestens 7.200.000 Punkte, ohne Obergrenze und ohne Einfluss auf die Priorität.",
    "assignment": [
      "DS hat Vorrang: Die Fahrer von Desert Storm B und A werden zuerst reserviert. Ist ein Spieler auch in VS gelistet, behält er seinen DS-Platz.",
      "Montag bis Donnerstag: die ersten vier verbleibenden berechtigten VS-Spieler, der Reihe nach ein Fahrer pro Tag.",
      "Freitag: Desert Storm Team B, nach Punkten sortiert.",
      "Samstag: Desert Storm Team A, nach Punkten sortiert.",
      "Sonntag: die höchsten gesamten Technologiespenden der Vorwoche unter den Spielern, die auch die VS-Voraussetzung von Montag bis Freitag erfüllen.",
      "Punkte und Spenden stammen aus der Woche vor der Zugwoche."
    ],
    "rotation": [
      "Ein Zyklus dauert vier Wochen. Wer tatsächlich gefahren ist, erhält für den Rest dieses Zyklus keine weitere Zuteilung.",
      "Nur tatsächliches Fahren verbraucht einen Zug: Eine Nennung als Fahrer oder Ersatzspieler allein schließt niemanden aus.",
      "Gemeinsame wöchentliche Ersatzlisten: vier VS, zwei DS B, zwei DS A und drei Spenden. DS-Ersatzspieler werden vor VS reserviert. Ersatz erfolgt in der Reihenfolge der jeweiligen Kategorie.",
      "Der Fahrer wählt die VIP- und Wächterplätze frei aus."
    ],
    "tickets": [
      "Spende vor der Abfahrt 3 Tickets. Fahrer oder Ersatzspieler, die ohne diese Spende einsteigen wollen, verlieren ihren Platz und sind diese und nächste Woche gesperrt.",
      "Noch nicht ausgewählte Mitglieder sind nur für die folgende Woche gesperrt. Ein R4 erfasst den Verstoß und den Auswahlstatus im Bereich Zugtickets.",
      "Der tatsächliche Fahrer wird in der Zugverwaltung bestätigt. Die geplante Liste kann sich durch erfasste Ergebnisse oder tatsächliche Fahrer ändern."
    ]
  },
  "ro": {
    "headings": [
      "Condiția VS",
      "Atribuirea zilnică",
      "Rotație și rezerve",
      "Bilete și confirmare"
    ],
    "minimum": [
      "Fiecare punctaj de luni până vineri trebuie înregistrat și trebuie să atingă minimum 7.200.000 de puncte.",
      "Neatingerea minimului chiar și într-o singură zi înseamnă neîndeplinirea condiției VS."
    ],
    "push": "Jucătorii eligibili sunt ordonați descrescător după totalul săptămânal.",
    "save": "Clasamentul folosește doar luni–joi, cât mai aproape de 28.800.000 de puncte. Vineri rămâne obligatoriu minimul de 7.200.000, fără plafon și fără efect asupra priorității.",
    "assignment": [
      "Prioritate DS: conductorii Desert Storm B și A sunt rezervați primii. Dacă un jucător apare și în VS, își păstrează locul DS.",
      "Luni–joi: primii patru jucători VS eligibili rămași disponibili, în ordine, câte un conductor pe zi.",
      "Vineri: echipa B din Desert Storm, ordonată după puncte.",
      "Sâmbătă: echipa A din Desert Storm, ordonată după puncte.",
      "Duminică: cel mai mare total al donațiilor pentru tehnologie din săptămâna precedentă, dintre cei care îndeplinesc și condiția VS de luni până vineri.",
      "Punctajele și donațiile provin din săptămâna anterioară săptămânii trenului."
    ],
    "rotation": [
      "Ciclul durează patru săptămâni. Cine a condus efectiv este exclus de la alte atribuiri pentru restul acelui ciclu.",
      "Doar conducerea efectivă consumă rândul: simpla apariție ca titular sau rezervă nu exclude jucătorul.",
      "Liste comune săptămânale de rezerve: patru VS, două DS B, două DS A și trei donații. Rezervele DS sunt rezervate înaintea celor VS. Înlocuirile urmează ordinea categoriei.",
      "Conductorul alege liber locurile VIP și Gardian."
    ],
    "tickets": [
      "Donează 3 bilete înainte de plecare. Un conductor sau o rezervă care încearcă să urce fără donație își pierde locul și este exclus în această săptămână și în următoarea.",
      "Membrii încă neselectați sunt excluși doar în săptămâna următoare. Un R4 înregistrează abaterea și statutul membrului în Biletele trenului.",
      "Conductorul real este confirmat în administrarea trenului. Lista planificată se poate modifica la înregistrarea rezultatelor sau a conductorilor reali."
    ]
  },
  "pt": {
    "headings": [
      "Requisito VS",
      "Atribuição diária",
      "Rotação e suplentes",
      "Bilhetes e confirmação"
    ],
    "minimum": [
      "Cada pontuação de segunda a sexta deve estar registada e atingir pelo menos 7.200.000 pontos.",
      "Não atingir o mínimo num único dia significa não cumprir o requisito VS."
    ],
    "push": "Os jogadores elegíveis são ordenados pelo total semanal, do maior para o menor.",
    "save": "O ranking usa apenas segunda a quinta, o mais próximo de 28.800.000 pontos. Sexta continua a exigir 7.200.000, sem limite máximo nem efeito na prioridade.",
    "assignment": [
      "Prioridade DS: os condutores de Desert Storm B e A são reservados primeiro. Se um jogador também aparecer em VS, mantém o lugar DS.",
      "Segunda a quinta: os primeiros quatro jogadores VS elegíveis ainda disponíveis, por ordem, um condutor por dia.",
      "Sexta: equipa B de Desert Storm, ordenada por pontos.",
      "Sábado: equipa A de Desert Storm, ordenada por pontos.",
      "Domingo: maior total de doações para tecnologia da semana anterior, entre quem também cumpre o requisito VS de segunda a sexta.",
      "As pontuações e doações são da semana anterior à semana do comboio."
    ],
    "rotation": [
      "O ciclo dura quatro semanas. Quem conduziu efetivamente fica excluído de novas atribuições durante o resto desse ciclo.",
      "Só conduzir de facto consome o turno: constar como titular ou suplente não exclui por si só.",
      "Listas semanais partilhadas de suplentes: quatro VS, dois DS B, dois DS A e três doações. Os suplentes DS são reservados antes dos VS. As substituições seguem a ordem de cada categoria.",
      "O condutor escolhe livremente os lugares VIP e Guardião."
    ],
    "tickets": [
      "Doa 3 bilhetes antes da partida. Um condutor ou suplente que tente entrar sem os doar perde o lugar e fica impedido nessa semana e na seguinte.",
      "Os membros ainda não selecionados ficam impedidos apenas na semana seguinte. Um R4 regista a infração e a situação do membro nos Bilhetes do comboio.",
      "O condutor real é confirmado na administração do comboio. A lista prevista pode mudar com o registo de resultados ou de condutores reais."
    ]
  },
  "uk": {
    "headings": [
      "Вимога VS",
      "Призначення за днями",
      "Ротація та запасні",
      "Квитки та підтвердження"
    ],
    "minimum": [
      "Результат кожного дня з понеділка по п’ятницю має бути записаний і становити щонайменше 7 200 000 очок.",
      "Невиконання мінімуму хоча б одного дня означає невиконання вимоги VS."
    ],
    "push": "Гравців, які виконали вимоги, упорядковують за тижневою сумою від більшої до меншої.",
    "save": "Рейтинг враховує лише понеділок–четвер: пріоритет має сума, найближча до 28 800 000 очок. У п’ятницю також потрібно щонайменше 7 200 000, без верхньої межі та впливу на пріоритет.",
    "assignment": [
      "Пріоритет DS: спочатку резервуються машиністи Desert Storm B та A. Якщо гравець також є в рейтингу VS, він зберігає місце DS.",
      "Понеділок–четвер: перші чотири доступні гравці VS, які виконали вимоги, по черзі, один машиніст на день.",
      "П’ятниця: команда B Desert Storm, за кількістю очок.",
      "Субота: команда A Desert Storm, за кількістю очок.",
      "Неділя: найбільша загальна сума пожертв на технології за попередній тиждень серед гравців, які також виконали вимогу VS з понеділка по п’ятницю.",
      "Очки та пожертви беруться з тижня, що передує тижню потяга."
    ],
    "rotation": [
      "Цикл триває чотири тижні. Гравець, який уже фактично керував потягом, не отримує нових призначень до кінця цього циклу.",
      "Лише фактичне керування використовує чергу: сама присутність у списку основних або запасних не виключає гравця.",
      "Спільні тижневі списки запасних: чотири VS, два DS B, два DS A та три за пожертвами. Запасні DS резервуються раніше за VS. Заміни відбуваються за порядком відповідної категорії.",
      "Машиніст вільно обирає місця VIP та Вартового."
    ],
    "tickets": [
      "Пожертвуйте 3 квитки до відправлення. Основний або запасний машиніст, який намагається сісти без пожертви, втрачає місце та отримує заборону на цей і наступний тиждень.",
      "Ще не обрані учасники отримують заборону лише на наступний тиждень. R4 записує порушення та статус учасника в розділі квитків потяга.",
      "Фактичний машиніст підтверджується в адміністрації потяга. Плановий список може змінюватися після запису результатів або фактичних машиністів."
    ]
  },
  "it": {
    "headings": [
      "Requisito VS",
      "Assegnazione giornaliera",
      "Rotazione e riserve",
      "Biglietti e conferma"
    ],
    "minimum": [
      "Ogni punteggio da lunedì a venerdì deve essere registrato e raggiungere almeno 7.200.000 punti.",
      "Non raggiungere il minimo anche solo un giorno significa non soddisfare il requisito VS."
    ],
    "push": "I giocatori idonei sono ordinati per totale settimanale, dal più alto al più basso.",
    "save": "La classifica considera solo lunedì–giovedì, con priorità al totale più vicino a 28.800.000 punti. Venerdì richiede comunque 7.200.000, senza limite massimo né effetto sulla priorità.",
    "assignment": [
      "Priorità DS: vengono riservati prima i conducenti di Desert Storm B e A. Se un giocatore compare anche in VS, mantiene il posto DS.",
      "Lunedì–giovedì: i primi quattro giocatori VS idonei ancora disponibili, in ordine, un conducente al giorno.",
      "Venerdì: squadra B di Desert Storm, ordinata per punti.",
      "Sabato: squadra A di Desert Storm, ordinata per punti.",
      "Domenica: il totale più alto di donazioni tecnologiche della settimana precedente, tra chi soddisfa anche il requisito VS da lunedì a venerdì.",
      "Punteggi e donazioni provengono dalla settimana precedente a quella del treno."
    ],
    "rotation": [
      "Il ciclo dura quattro settimane. Chi ha guidato effettivamente è escluso da nuove assegnazioni per il resto di quel ciclo.",
      "Solo guidare davvero consuma il turno: figurare come titolare o riserva non esclude di per sé un giocatore.",
      "Liste settimanali condivise di riserve: quattro VS, due DS B, due DS A e tre donazioni. Le riserve DS vengono prenotate prima delle VS. Le sostituzioni seguono l’ordine della categoria.",
      "Il conducente sceglie liberamente i posti VIP e Guardiano."
    ],
    "tickets": [
      "Dona 3 biglietti prima della partenza. Un conducente o una riserva che tenta di salire senza donarli perde il posto ed è escluso per questa settimana e la successiva.",
      "I membri non ancora selezionati sono esclusi solo per la settimana successiva. Un R4 registra l’infrazione e lo stato del membro nei Biglietti del treno.",
      "Il conducente effettivo è confermato nell’amministrazione del treno. La lista prevista può cambiare quando vengono registrati risultati o conducenti effettivi."
    ]
  },
  "pl": {
    "headings": [
      "Wymaganie VS",
      "Przydział na poszczególne dni",
      "Rotacja i rezerwowi",
      "Bilety i potwierdzenie"
    ],
    "minimum": [
      "Wynik każdego dnia od poniedziałku do piątku musi być zapisany i wynosić co najmniej 7 200 000 punktów.",
      "Nieosiągnięcie minimum choćby jednego dnia oznacza niespełnienie wymagania VS."
    ],
    "push": "Uprawnieni gracze są szeregowani według sumy tygodniowej, od najwyższej do najniższej.",
    "save": "Ranking obejmuje tylko poniedziałek–czwartek, z pierwszeństwem sumy najbliższej 28 800 000 punktów. W piątek nadal wymagane jest 7 200 000, bez górnego limitu i bez wpływu na pierwszeństwo.",
    "assignment": [
      "Priorytet DS: najpierw rezerwowane są miejsca maszynistów Desert Storm B i A. Jeśli gracz jest też w rankingu VS, zachowuje miejsce DS.",
      "Poniedziałek–czwartek: czterej pierwsi dostępni gracze VS spełniający wymagania, kolejno po jednym maszyniście dziennie.",
      "Piątek: drużyna B Desert Storm, według punktów.",
      "Sobota: drużyna A Desert Storm, według punktów.",
      "Niedziela: najwyższa łączna darowizna na technologię z poprzedniego tygodnia wśród graczy spełniających także wymaganie VS od poniedziałku do piątku.",
      "Punkty i darowizny pochodzą z tygodnia poprzedzającego tydzień pociągu."
    ],
    "rotation": [
      "Cykl trwa cztery tygodnie. Gracz, który faktycznie prowadził pociąg, jest wykluczony z kolejnych przydziałów do końca tego cyklu.",
      "Tylko faktyczne prowadzenie wykorzystuje kolejkę: samo wskazanie jako maszynista lub rezerwowy nie wyklucza gracza.",
      "Wspólne tygodniowe listy rezerwowych: czterech VS, dwóch DS B, dwóch DS A i trzech za darowizny. Rezerwowi DS są rezerwowani przed VS. Zastępstwa następują według kolejności w kategorii.",
      "Maszynista swobodnie wybiera miejsca VIP i Strażnika."
    ],
    "tickets": [
      "Przekaż 3 bilety przed odjazdem. Maszynista lub rezerwowy próbujący wejść bez darowizny traci miejsce i otrzymuje zakaz na ten oraz następny tydzień.",
      "Jeszcze niewybrani członkowie otrzymują zakaz tylko na następny tydzień. R4 zapisuje naruszenie i status członka w sekcji Biletów pociągu.",
      "Faktyczny maszynista jest potwierdzany w administracji pociągu. Planowana lista może się zmieniać po zapisaniu wyników lub faktycznych maszynistów."
    ]
  },
  "tr": {
    "headings": [
      "VS şartı",
      "Günlük atama",
      "Rotasyon ve yedekler",
      "Biletler ve onay"
    ],
    "minimum": [
      "Pazartesiden cumaya her günün puanı kaydedilmeli ve en az 7.200.000 puana ulaşmalıdır.",
      "Tek bir gün bile minimuma ulaşamamak, VS şartını karşılamamak demektir."
    ],
    "push": "Şartları karşılayan oyuncular haftalık toplam puana göre yüksekten düşüğe sıralanır.",
    "save": "Sıralama yalnızca pazartesi–perşembeyi kapsar; 28.800.000 puana en yakın toplam önceliklidir. Cuma günü de en az 7.200.000 gerekir; üst sınır yoktur ve ek puanlar önceliği etkilemez.",
    "assignment": [
      "DS önceliği: önce Desert Storm B ve A makinistleri ayrılır. Oyuncu VS sıralamasında da varsa DS yerini korur.",
      "Pazartesi–perşembe: kalan uygun VS oyuncularından ilk dördü, sırayla günde bir makinist.",
      "Cuma: Desert Storm B takımı, puana göre sıralama.",
      "Cumartesi: Desert Storm A takımı, puana göre sıralama.",
      "Pazar: pazartesi–cuma VS şartını da karşılayanlar arasından önceki haftanın en yüksek toplam teknoloji bağışı.",
      "Puanlar ve bağışlar tren haftasından önceki haftaya aittir."
    ],
    "rotation": [
      "Döngü dört hafta sürer. Treni fiilen kullanmış oyuncu, o döngünün kalanında yeni atamalardan çıkarılır.",
      "Yalnızca treni fiilen kullanmak sırayı tüketir; asıl veya yedek olarak listelenmek tek başına oyuncuyu dışlamaz.",
      "Ortak haftalık yedek havuzları: dört VS, iki DS B, iki DS A ve üç bağış. DS yedekleri VS yedeklerinden önce ayrılır. Değişiklikler kategori sırasına göre yapılır.",
      "Makinist VIP ve Muhafız yerlerini serbestçe seçer."
    ],
    "tickets": [
      "Kalkıştan önce 3 bilet bağışla. Bağışlamadan binmeye çalışan makinist veya yedek yerini kaybeder ve bu hafta ile sonraki hafta yasaklanır.",
      "Henüz seçilmemiş üyeler yalnızca sonraki hafta yasaklanır. R4, ihlali ve üyenin seçilme durumunu Tren biletleri bölümüne kaydeder.",
      "Gerçek makinist tren yönetiminde onaylanır. Planlanan liste, sonuçlar veya gerçek makinistler kaydedildikçe değişebilir."
    ]
  },
  "ru": {
    "headings": [
      "Требование VS",
      "Назначение по дням",
      "Ротация и запасные",
      "Билеты и подтверждение"
    ],
    "minimum": [
      "Результат каждого дня с понедельника по пятницу должен быть записан и составлять не менее 7 200 000 очков.",
      "Невыполнение минимума хотя бы в один день означает невыполнение требования VS."
    ],
    "push": "Игроки, выполнившие условия, ранжируются по недельной сумме от большей к меньшей.",
    "save": "В рейтинге учитываются только понедельник–четверг: приоритет у суммы, ближайшей к 28 800 000 очков. В пятницу также требуется не менее 7 200 000, без верхнего предела и влияния на приоритет.",
    "assignment": [
      "Приоритет DS: сначала резервируются машинисты Desert Storm B и A. Если игрок также есть в рейтинге VS, он сохраняет место DS.",
      "Понедельник–четверг: первые четыре оставшихся доступных игрока VS, выполнивших условия, по порядку, один машинист в день.",
      "Пятница: команда B Desert Storm, по количеству очков.",
      "Суббота: команда A Desert Storm, по количеству очков.",
      "Воскресенье: наибольшая общая сумма пожертвований на технологии за прошлую неделю среди игроков, также выполнивших требование VS с понедельника по пятницу.",
      "Очки и пожертвования берутся за неделю, предшествующую неделе поезда."
    ],
    "rotation": [
      "Цикл длится четыре недели. Игрок, который уже фактически вёл поезд, исключается из новых назначений до конца этого цикла.",
      "Только фактическое управление расходует очередь: само присутствие в списке основных или запасных не исключает игрока.",
      "Общие недельные списки запасных: четыре VS, два DS B, два DS A и три по пожертвованиям. Запасные DS резервируются раньше VS. Замены идут по порядку соответствующей категории.",
      "Машинист свободно выбирает места VIP и Стража."
    ],
    "tickets": [
      "Пожертвуйте 3 билета до отправления. Основной или запасной машинист, пытающийся сесть без пожертвования, теряет место и получает запрет на эту и следующую неделю.",
      "Ещё не выбранные участники получают запрет только на следующую неделю. R4 записывает нарушение и статус участника в разделе билетов поезда.",
      "Фактический машинист подтверждается в управлении поездом. Плановый список может меняться после записи результатов или фактических машинистов."
    ]
  }
};

// Shared rules for the train page and current-week notice.
export function trainRuleSections(weekType,lang='en'){
  lang=String(lang).toLowerCase().split('-')[0];
  const translated=LOCALIZED_RULES[lang];
  if(translated){
    const save=weekType==='save';
    return [
      {heading:translated.headings[0]+' · '+(save?'SAVE':'PUSH'),items:[...translated.minimum,save?translated.save:translated.push]},
      {heading:translated.headings[1],items:[...translated.assignment]},
      {heading:translated.headings[2],items:[...translated.rotation]},
      {heading:translated.headings[3],items:[...translated.tickets]}
    ];
  }
  const es=lang==='es',save=weekType==='save',sections=[];
  const section=(heading,items)=>sections.push({heading,items});
  section(es?'Requisito VS · '+(save?'Save':'Push'):'VS requirement · '+(save?'Save':'Push'),save?(es?['De lunes a viernes, cada día debe tener puntuación registrada y alcanzar al menos 7.200.000 puntos.','Si no se alcanza el mínimo en un solo día, no se cumple el requisito VS.','Ranking solo de lunes a jueves: prioridad por cercanía a 28.800.000 puntos. El viernes exige 7.200.000 como mínimo, sin límite máximo ni efecto en la prioridad.']:['Every Monday–Friday score must be recorded and reach at least 7,200,000.','Missing the minimum on any day fails the VS requirement.','Ranked on Monday–Thursday only, closest to 28,800,000. Friday still requires 7,200,000, with no upper limit and no effect on priority.']):(es?['De lunes a viernes, cada día debe tener puntuación registrada y alcanzar al menos 7.200.000 puntos.','Si no se alcanza el mínimo en un solo día, no se cumple el requisito VS.','Entre quienes cumplen, se ordena por el total semanal de mayor a menor.']:['Every Monday–Friday score must be recorded and reach at least 7,200,000.','Missing the minimum on any day fails the VS requirement.','Eligible players are ranked by weekly total, highest first.']));section(es?'Asignación de cada día':'Daily assignment',es?['Prioridad DS: primero se reservan los conductores de Desert Storm B y A. Si un jugador también aparece en VS, conserva el puesto de DS.','Lunes a jueves: los cuatro primeros jugadores elegibles de VS que queden disponibles, por orden, un conductor por día.','Viernes: clasificación por puntos de Desert Storm, equipo B.','Sábado: clasificación por puntos de Desert Storm, equipo A.','Domingo: mayor donación total a tecnología de la semana anterior, entre quienes también cumplen el requisito VS de lunes a viernes.','Las puntuaciones y donaciones utilizadas son las de la semana anterior a la semana del tren.']:['DS priority: Desert Storm B and A drivers are reserved first. If a player also appears in VS, they keep the DS position.','Monday–Thursday: the first four remaining eligible VS players, one driver per day.','Friday: Desert Storm team B, ranked by points.','Saturday: Desert Storm team A, ranked by points.','Sunday: highest total technology donations from the previous week, among players who also meet the Monday–Friday VS requirement.','Scores and donations come from the week before the train week.']);section(es?'Rotación y suplentes':'Rotation and substitutes',es?['El ciclo dura cuatro semanas. Quien ya ha conducido realmente queda excluido de nuevas asignaciones durante el resto de ese ciclo.','Solo conducir de verdad cuenta como turno consumido: aparecer como titular o suplente no excluye por sí solo.','Hay bolsas semanales compartidas de suplentes: cuatro de VS, dos de DS B, dos de DS A y tres de donaciones. Los suplentes de DS se reservan antes que los de VS. Si falta un titular, se sigue el orden de su categoría.','El conductor decide libremente los puestos VIP y Guardián.']:['The cycle lasts four weeks. A player who actually drove is excluded from further assignments for the rest of that cycle.','Only actually driving uses a turn: being listed as driver or substitute alone does not exclude a player.','Shared weekly substitute pools: four VS, two DS B, two DS A and three donations. DS substitutes are reserved before VS substitutes. Replacements follow the order within their category.','The driver freely chooses the VIP and Guardian positions.']);section(es?'Boletos y confirmación':'Tickets and confirmation',es?['Dona 3 tickets antes de que salga el tren. Un conductor o suplente que intente subir sin donarlos pierde su puesto y queda vetado esa semana y la siguiente.','Los miembros todavía no seleccionados quedan vetados solo de la siguiente semana. El R4 registra el incumplimiento y la situación del miembro en Tickets del tren.','El conductor real se confirma en la administración del tren. La lista prevista puede variar al registrar resultados o conductores reales.']:['Donate 3 tickets before departure. Drivers and substitutes who try to board without donating lose their place and are banned for that week and the following week.','Members not yet selected are banned only from the following week. An R4 records the incident and the member’s selection status in Train tickets.','The actual driver is confirmed in train administration. The planned list can change when results or actual drivers are recorded.'])
  return sections;
}
