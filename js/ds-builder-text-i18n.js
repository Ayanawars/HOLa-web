(()=>{
"use strict";
const keys=[
 "📝 Importar participantes por texto",
 "Escribe un jugador por línea, con su tipo de inscripción. Puedes incluir la numeración.",
 "Ejemplos:",
 "Lista de participantes",
 "Reemplazar la convocatoria actual (en vez de añadir). Conserva las posiciones del mapa de quienes mantienen su tipo.",
 "🔎 Comprobar texto",
 "✓ Confirmar importación",
 "Solo importa nombres confirmados como miembros de HOLa. No se publica automáticamente: pulsa «Guardar borrador» cuando termines."
];
const locale={
 en:["📝 Import participants from text","Enter one player per line with their registration type. Numbering is optional.","Examples:","Participant list","Replace current roster (instead of adding). Map positions are kept for players whose roles stay the same.","🔎 Check text","✓ Confirm import","Only official HOLa members can be imported. Nothing is published automatically: click «Save draft» when finished."],
 fr:["📝 Importer les participants par texte","Saisissez un joueur par ligne avec son rôle. La numérotation est facultative.","Exemples :","Liste des participants","Remplacer l'équipe actuelle (au lieu d'ajouter). Les positions sont conservées si les rôles ne changent pas.","🔎 Vérifier le texte","✓ Confirmer l'import","Seuls les membres officiels de HOLa peuvent être importés. Rien n'est publié automatiquement : enregistrez le brouillon ensuite."],
 de:["📝 Teilnehmer per Text importieren","Gib pro Zeile einen Spieler und seine Rolle ein. Die Nummerierung ist optional.","Beispiele:","Teilnehmerliste","Aktuelle Aufstellung ersetzen (statt ergänzen). Kartenpositionen bleiben bei unveränderter Rolle erhalten.","🔎 Text prüfen","✓ Import bestätigen","Nur offizielle HOLa-Mitglieder können importiert werden. Es wird nichts automatisch veröffentlicht: danach den Entwurf speichern."],
 ro:["📝 Importă participanți din text","Introdu un jucător pe fiecare rând, cu rolul său. Numerotarea este opțională.","Exemple:","Lista participanților","Înlocuiește lista actuală (în loc să adaugi). Pozițiile de pe hartă se păstrează pentru rolurile neschimbate.","🔎 Verifică textul","✓ Confirmă importul","Se pot importa doar membri HOLa confirmați. Nu se publică automat: salvează ciorna când termini."],
 pt:["📝 Importar participantes por texto","Introduz um jogador por linha com o respetivo papel. A numeração é opcional.","Exemplos:","Lista de participantes","Substituir a lista atual (em vez de adicionar). As posições no mapa mantêm-se para quem conservar o papel.","🔎 Verificar texto","✓ Confirmar importação","Só é possível importar membros oficiais da HOLa. Nada é publicado automaticamente: guarda o rascunho no fim."],
 uk:["📝 Імпорт учасників із тексту","Введіть одного гравця в кожному рядку із зазначенням ролі. Нумерація необов’язкова.","Приклади:","Список учасників","Замінити поточний склад (замість додавання). Позиції на карті зберігаються для гравців із незмінними ролями.","🔎 Перевірити текст","✓ Підтвердити імпорт","Імпортуються лише підтверджені учасники HOLa. Автоматичної публікації немає: потім збережіть чернетку."],
 it:["📝 Importa partecipanti da testo","Inserisci un giocatore per riga con il suo ruolo. La numerazione è facoltativa.","Esempi:","Elenco partecipanti","Sostituisci la formazione attuale (anziché aggiungere). Le posizioni restano per chi mantiene lo stesso ruolo.","🔎 Controlla il testo","✓ Conferma importazione","Si possono importare solo membri HOLa confermati. Non viene pubblicato nulla automaticamente: salva la bozza al termine."],
 pl:["📝 Importuj uczestników z tekstu","Wpisz jednego gracza w każdym wierszu wraz z jego rolą. Numeracja jest opcjonalna.","Przykłady:","Lista uczestników","Zastąp aktualny skład (zamiast dodawać). Pozycje na mapie pozostaną dla graczy z niezmienioną rolą.","🔎 Sprawdź tekst","✓ Potwierdź import","Można importować tylko potwierdzonych członków HOLa. Nic nie zostanie automatycznie opublikowane: zapisz wersję roboczą."],
 tr:["📝 Metinden katılımcı içe aktar","Her satıra rolüyle birlikte bir oyuncu yaz. Numaralandırma isteğe bağlıdır.","Örnekler:","Katılımcı listesi","Mevcut kadroyu değiştir (eklemek yerine). Rolü değişmeyenlerin haritadaki yerleri korunur.","🔎 Metni kontrol et","✓ İçe aktarmayı onayla","Yalnızca onaylı HOLa üyeleri aktarılabilir. Otomatik yayın yapılmaz: bitirdiğinde taslağı kaydet."]
};
const i18n=window.HOLaBuilderI18n;
if(!i18n)return;
for(const [code,values] of Object.entries(locale)){
 if(values.length!==keys.length)throw Error("DS text locale mismatch: "+code);
 i18n.registerExtras(code,Object.fromEntries(keys.map((key,index)=>[key,values[index]])));
}
})();