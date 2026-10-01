/* Rival Team B, 2026-10-02. Snapshot from Last Intel, 2026-10-01. */
(() => {
  'use strict';
  const words = {
    es:['Rival','Cerrar','Servidor','Líder','Miembros','Poder total','THP publicado','Media de poder','Bajas','Posición en servidor','Top 30 por poder total','Sin dato','Datos del 01/10/2026. THP = poder total de héroes. Este ranking es de toda la alianza; no confirma sus participantes de Desert Storm.','Fuente: Last Intel','Rival del Team B · 02/10/2026','Jugador','Buscar jugador'],
    en:['Opponent','Close','Server','Leader','Members','Total power','Reported THP','Mean power','Kills','Server rank','Top 30 by total power','Unavailable','Data from 01/10/2026. THP = total hero power. This is the alliance roster ranking; it does not confirm Desert Storm participants.','Source: Last Intel','Team B opponent · 02/10/2026','Player','Find player'],
    fr:['Adversaire','Fermer','Serveur','Chef','Membres','Puissance totale','THP publié','Puissance moyenne','Éliminations','Rang du serveur','Top 30 par puissance totale','Non disponible','Données du 01/10/2026. THP = puissance totale des héros. Ce classement de l’alliance ne confirme pas les participants à Desert Storm.','Source : Last Intel','Adversaire Team B · 02/10/2026','Joueur','Chercher un joueur'],
    de:['Gegner','Schließen','Server','Anführer','Mitglieder','Gesamtstärke','Erfasste THP','Durchschnittsstärke','Kills','Serverrang','Top 30 nach Gesamtstärke','Keine Daten','Daten vom 01.10.2026. THP = gesamte Heldenstärke. Die Allianzrangliste bestätigt keine Desert-Storm-Teilnehmer.','Quelle: Last Intel','Gegner Team B · 02.10.2026','Spieler','Spieler suchen'],
    ro:['Adversar','Închide','Server','Lider','Membri','Putere totală','THP publicat','Putere medie','Eliminări','Poziție pe server','Top 30 după puterea totală','Fără date','Date din 01/10/2026. THP = puterea totală a eroilor. Clasamentul alianței nu confirmă participanții la Desert Storm.','Sursa: Last Intel','Adversar Team B · 02/10/2026','Jucător','Caută jucător'],
    pt:['Adversário','Fechar','Servidor','Líder','Membros','Poder total','THP publicado','Poder médio','Eliminações','Posição no servidor','Top 30 por poder total','Sem dados','Dados de 01/10/2026. THP = poder total dos heróis. A classificação da aliança não confirma participantes em Desert Storm.','Fonte: Last Intel','Adversário Team B · 02/10/2026','Jogador','Procurar jogador'],
    uk:['Суперник','Закрити','Сервер','Лідер','Учасники','Загальна сила','Опублікований THP','Середня сила','Вбивства','Місце на сервері','Топ 30 за загальною силою','Немає даних','Дані за 01/10/2026. THP = загальна сила героїв. Рейтинг альянсу не підтверджує учасників Desert Storm.','Джерело: Last Intel','Суперник Team B · 02/10/2026','Гравець','Пошук гравця'],
    it:['Avversario','Chiudi','Server','Leader','Membri','Potenza totale','THP pubblicato','Potenza media','Uccisioni','Posizione nel server','Top 30 per potenza totale','Non disponibile','Dati del 01/10/2026. THP = potenza totale degli eroi. La classifica dell’alleanza non conferma i partecipanti a Desert Storm.','Fonte: Last Intel','Avversario Team B · 02/10/2026','Giocatore','Cerca giocatore'],
    pl:['Przeciwnik','Zamknij','Serwer','Lider','Członkowie','Całkowita moc','Opublikowane THP','Średnia moc','Zabójstwa','Pozycja na serwerze','Top 30 według całkowitej mocy','Brak danych','Dane z 01/10/2026. THP = całkowita moc bohaterów. Ranking sojuszu nie potwierdza uczestników Desert Storm.','Źródło: Last Intel','Przeciwnik Team B · 02/10/2026','Gracz','Szukaj gracza'],
    tr:['Rakip','Kapat','Sunucu','Lider','Üyeler','Toplam güç','Yayımlanan THP','Ortalama güç','Öldürmeler','Sunucu sırası','Toplam güce göre ilk 30','Veri yok','01/10/2026 verileri. THP = toplam kahraman gücü. İttifak sıralaması Desert Storm katılımcılarını doğrulamaz.','Kaynak: Last Intel','Team B rakibi · 02/10/2026','Oyuncu','Oyuncu ara'],
    ru:['Соперник','Закрыть','Сервер','Лидер','Участники','Общая мощь','Опубликованный THP','Средняя мощь','Убийства','Место на сервере','Топ 30 по общей мощи','Нет данных','Данные на 01/10/2026. THP = общая мощь героев. Рейтинг альянса не подтверждает участников Desert Storm.','Источник: Last Intel','Соперник Team B · 02/10/2026','Игрок','Поиск игрока']
  };
  const button=document.getElementById('rivalButton');
  const dialog=document.getElementById('rivalDialog');
  const data=window.HOLA_DS_RIVAL;
  if(!button||!dialog||!data)return;
  const $=id=>document.getElementById(id);
  const t=()=>words[document.documentElement.lang]||words.en;
  const format=n=>n==null?t()[11]:new Intl.NumberFormat(document.documentElement.lang||'en',{maximumFractionDigits:2,minimumFractionDigits:2}).format(n/(n>=1e9?1e9:1e6))+(n>=1e9?' B':' M');
  function rows(){
    const body=$('rivalRows');body.replaceChildren();
    data.players.forEach((p,i)=>{
      const row=document.createElement('tr');
      const rank=document.createElement('td');rank.textContent=i+1;
      const player=document.createElement('td');player.className='rival-player';
      const img=document.createElement('img');img.src=p.avatar;img.alt='';img.width=40;img.height=40;img.loading='lazy';
      const name=document.createElement('strong');name.textContent=p.name;
      player.append(img,name);
      const power=document.createElement('td');power.textContent=format(p.power);
      const thp=document.createElement('td');thp.textContent=format(p.thp);thp.className=p.thp==null?'rival-missing':'rival-thp';
      row.append(rank,player,power,thp);body.append(row);
    });
  }
  function render(){
    const w=t();$('rivalButtonLabel').textContent=w[0];$('rivalClose').textContent=w[1];
    $('rivalContext').textContent=w[14];$('rivalTitle').textContent='[CCBz] Chonky Cat Brigade';
    $('rivalNote').textContent=w[12];$('rivalRanking').textContent=w[10];
    $('rivalPlayerHeading').textContent=w[15];$('rivalPowerHeading').textContent=w[5];
    const stats=[[w[2],'1885'],[w[3],'Bergfinn'],[w[4],'100/100'],[w[9],'2 / 90'],[w[5],format(data.power)],[w[6],format(data.thp)],[w[7],format(data.power/100)],[w[8],format(data.kills)]];
    $('rivalStats').replaceChildren();
    stats.forEach(([label,value])=>{const item=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;item.append(dt,dd);$('rivalStats').append(item)});
    rows();
  }
  button.addEventListener('click',()=>{render();dialog.showModal();});
  $('rivalClose').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  dialog.addEventListener('close',()=>button.focus());
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.querySelectorAll('[data-team]').forEach(b=>b.addEventListener('click',()=>{button.hidden=b.dataset.team!=='B'}));
  render();
})();
