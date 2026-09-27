(function(){
'use strict';
const STORAGE_KEYS=['hola-language','hola-lang','hola_survey_language','hola_avatar_lang'];
let saved=localStorage.getItem('hola-language')||localStorage.getItem('hola-lang')||localStorage.getItem('hola_survey_language')||localStorage.getItem('hola_avatar_lang');
const browser=(navigator.language||'').toLowerCase().split(/[-_]/)[0];
if(!saved&&browser==='ru'){saved='ru';STORAGE_KEYS.forEach(k=>localStorage.setItem(k,'ru'))}
const active=()=>localStorage.getItem('hola-language')==='ru';
function syncLanguage(lang){if(!lang)return;STORAGE_KEYS.forEach(k=>localStorage.setItem(k,lang))}
const D=new Map(Object.entries({
'Alliance Overview':'Обзор альянса','Resumen de la alianza':'Обзор альянса','Strategy':'Стратегия','Estrategia':'Стратегия','Teamwork':'Командная работа','Equipo':'Команда','Family':'Семья','Familia':'Семья','Victory':'Победа','Victoria':'Победа',
'Members':'Участники','Miembros':'Участники','Countries':'Страны','Países':'Страны','Upcoming events':'Предстоящие события','Próximos eventos':'Предстоящие события','View all →':'Посмотреть все →','Ver todos →':'Посмотреть все →',
'Alliance Exercise':'Учения альянса','Ejercicio de alianza':'Учения альянса','Zombie Siege':'Осада зомби','Asedio zombi':'Осада зомби','Desert Storm':'Буря в пустыне','Tormenta del desierto':'Буря в пустыне','Zombie Invasion':'Вторжение зомби','Invasión zombi':'Вторжение зомби',
'Quick Access':'Быстрый доступ','Acceso rápido':'Быстрый доступ','Meet the alliance':'Познакомьтесь с альянсом','Conoce a la alianza':'Познакомьтесь с альянсом','Open members':'Открыть участников','Abrir miembros':'Открыть участников','Change language':'Изменить язык','Cambiar idioma':'Изменить язык','Open Desert Storm':'Открыть Бурю в пустыне','Abrir Desert Storm':'Открыть Бурю в пустыне','Administration center':'Центр управления','Centro de administración':'Центр управления','Alliance statistics':'Статистика альянса','Estadísticas de la alianza':'Статистика альянса',
'ALLIANCE MISSION':'МИССИЯ АЛЬЯНСА','MISIÓN DE ALIANZA':'МИССИЯ АЛЬЯНСА','Update your HOLa profile':'Обновите профиль HOLa','Actualiza tu perfil HOLa':'Обновите профиль HOLa','Keep your THP, squads and member profile up to date.':'Поддерживайте THP, отряды и профиль участника в актуальном состоянии.','Mantén al día tu THP, squads y perfil de miembro.':'Поддерживайте THP, отряды и профиль участника в актуальном состоянии.','Complete / update survey':'Заполнить / обновить анкету','Completar / actualizar encuesta':'Заполнить / обновить анкету','NEW':'НОВОЕ','NUEVO':'НОВОЕ','You can now create your HOLa avatar':'Теперь вы можете создать свой аватар HOLa','Ahora puedes crear tu avatar HOLa':'Теперь вы можете создать свой аватар HOLa','Try it':'Попробовать','Pruébalo':'Попробовать',
'Technology donations':'Пожертвования в технологии','Donaciones a tecnología':'Пожертвования в технологии','WEEKLY TOP 3':'ТОП-3 НЕДЕЛИ','TOP 3 SEMANAL':'ТОП-3 НЕДЕЛИ','No weekly ranking has been published yet.':'Недельный рейтинг пока не опубликован.','Todavía no hay un ranking semanal publicado.':'Недельный рейтинг пока не опубликован.',
'MEMBERS':'УЧАСТНИКИ','MIEMBROS':'УЧАСТНИКИ','Alliance roster':'Состав альянса','members':'участников','miembros':'участников','surveys':'анкет','encuestas':'анкет','Search player...':'Найти игрока...','Buscar jugador...':'Найти игрока...','All':'Все','Todos':'Все','Tank':'Танки','Tanque':'Танки','Aircraft':'Авиация','Aéreo':'Авиация','Missile':'Ракеты','Misil':'Ракеты','Loading members...':'Загрузка участников...','Cargando miembros...':'Загрузка участников...','Members could not be loaded.':'Не удалось загрузить участников.','No matching players.':'Подходящие игроки не найдены.','No hay jugadores que coincidan.':'Подходящие игроки не найдены.','Location not provided':'Местоположение не указано','Ubicación no indicada':'Местоположение не указано','✓ Survey completed':'✓ Анкета заполнена','✓ Encuesta completada':'✓ Анкета заполнена','○ Survey pending':'○ Анкета не заполнена','○ Encuesta pendiente':'○ Анкета не заполнена','⚔ Squads':'⚔ Отряды','⚔ Escuadrones':'⚔ Отряды','▣ About me':'▣ Обо мне','▣ Sobre mí':'▣ Обо мне','This member has not added their story yet.':'Этот участник пока не добавил свою историю.','Este miembro todavía no ha añadido su historia.':'Этот участник пока не добавил свою историю.','Profession':'Профессия','Profesión':'Профессия','Engineer':'Инженер','Ingeniero':'Инженер','Tank Squad':'Танковый отряд','Escuadrón Tanque':'Танковый отряд','Aircraft Squad':'Авиационный отряд','Escuadrón Aéreo':'Авиационный отряд','Missile Squad':'Ракетный отряд','Escuadrón Misil':'Ракетный отряд','No Overlord':'Нет Повелителя','Sin Overlord':'Нет Повелителя','My quote':'Моя фраза','Mi frase':'Моя фраза','About me':'Обо мне','Sobre mí':'Обо мне','Progress':'Прогресс','Progreso':'Прогресс','Survey':'Анкета','Encuesta':'Анкета','Rank':'Ранг','Rango':'Ранг','Show more':'Показать ещё','Mostrar más':'Показать ещё','TOGETHER WE GO FURTHER':'ВМЕСТЕ МЫ ДОСТИГНЕМ БОЛЬШЕГО','JUNTOS LLEGAMOS MÁS LEJOS':'ВМЕСТЕ МЫ ДОСТИГНЕМ БОЛЬШЕГО',
'Alliance train':'Поезд альянса','Tren de la alianza':'Поезд альянса','AUTOMATIC ROTATION · HOLa':'АВТОМАТИЧЕСКАЯ РОТАЦИЯ · HOLa','ROTACIÓN AUTOMÁTICA · HOLa':'АВТОМАТИЧЕСКАЯ РОТАЦИЯ · HOLa','Drivers and substitutes calculated from VS, Desert Storm, donations and real history.':'Машинисты и запасные рассчитываются по VS, Буре в пустыне, пожертвованиям и реальной истории.','Conductores y suplentes calculados desde VS, Desert Storm, donaciones y el historial real.':'Машинисты и запасные рассчитываются по VS, Буре в пустыне, пожертвованиям и реальной истории.','Week':'Неделя','Semana':'Неделя','Data':'Данные','Datos':'Данные','PUSH WEEK':'НЕДЕЛЯ PUSH','SEMANA PUSH':'НЕДЕЛЯ PUSH','SAVE WEEK':'НЕДЕЛЯ SAVE','SEMANA SAVE':'НЕДЕЛЯ SAVE','DRIVER':'МАШИНИСТ','CONDUCTOR':'МАШИНИСТ','SUBSTITUTE 1':'ЗАПАСНОЙ 1','SUPLENTE 1':'ЗАПАСНОЙ 1','SUBSTITUTE 2':'ЗАПАСНОЙ 2','SUPLENTE 2':'ЗАПАСНОЙ 2','Waiting for data':'Ожидание данных','Pendiente de datos':'Ожидание данных','Real driver not confirmed':'Фактический машинист не подтверждён','Conductor real sin confirmar':'Фактический машинист не подтверждён','Real driver':'Фактический машинист','Conductor real':'Фактический машинист','How the train is assigned':'Как назначается поезд','Cómo se concede el tren':'Как назначается поезд','Monday':'Понедельник','Lunes':'Понедельник','Tuesday':'Вторник','Martes':'Вторник','Wednesday':'Среда','Miércoles':'Среда','Thursday':'Четверг','Jueves':'Четверг','Friday':'Пятница','Viernes':'Пятница','Saturday':'Суббота','Sábado':'Суббота','Sunday':'Воскресенье','Domingo':'Воскресенье',
'Push rule: at least 7.2M each day from Monday to Friday. Ranked by total points, highest first.':'Правило Push: не менее 7,2 млн каждый день с понедельника по пятницу. Сортировка по общей сумме от большей к меньшей.','Norma Push: mínimo 7,2 M cada día de lunes a viernes. Se ordena de mayor a menor puntuación total.':'Правило Push: не менее 7,2 млн каждый день с понедельника по пятницу. Сортировка по общей сумме от большей к меньшей.','Save rule: no more than 7.2M each day from Monday to Friday. Going over fails the rule; ranked lowest first.':'Правило Save: не более 7,2 млн каждый день с понедельника по пятницу. Превышение не засчитывается; сортировка от меньшей суммы.','Norma Save: máximo 7,2 M cada día de lunes a viernes. Quien lo supere no cumple; se ordena de menor a mayor.':'Правило Save: не более 7,2 млн каждый день с понедельника по пятницу. Превышение не засчитывается; сортировка от меньшей суммы.',
'Desert Storm Strategy':'Стратегия Бури в пустыне','Estrategia Tormenta del Desierto':'Стратегия Бури в пустыне','Special Force':'Спецназ','Fuerza Especial':'Спецназ','Players':'Игроки','Jugadores':'Игроки','Strategy plan':'План стратегии','Plan de estrategia':'План стратегии','Battle result':'Результат боя','Resultado de batalla':'Результат боя','Loading...':'Загрузка...','Cargando…':'Загрузка...','No results yet.':'Результатов пока нет.','Todavía no hay resultados.':'Результатов пока нет.','Victory':'Победа','Defeat':'Поражение','Derrota':'Поражение','Draw':'Ничья','Empate':'Ничья',
'Hall of Honor':'Зал славы','Muro de Honor':'Зал славы','TOP 10 · Tanks, missiles & aircraft':'ТОП-10 · Танки, ракеты и авиация','TOP 10 · Tanques, misiles y aéreos':'ТОП-10 · Танки, ракеты и авиация','TANKS':'ТАНКИ','TANQUES':'ТАНКИ','MISSILES':'РАКЕТЫ','MISILES':'РАКЕТЫ','AIRCRAFT':'АВИАЦИЯ','AÉREOS':'АВИАЦИЯ','POSITIONS 4–10':'МЕСТА 4–10','PUESTOS 4–10':'МЕСТА 4–10','There are no squads registered in this category yet.':'В этой категории пока нет зарегистрированных отрядов.','Todavía no hay squads registrados en esta categoría.':'В этой категории пока нет зарегистрированных отрядов.',
'Complete your HOLa profile':'Заполните профиль HOLa','Completa tu perfil HOLa':'Заполните профиль HOLa','Update your data':'Обновите данные','Actualiza tus datos':'Обновите данные','Continue':'Продолжить','Continuar':'Продолжить','Back':'Назад','Atrás':'Назад','Save':'Сохранить','Guardar':'Сохранить','Finish':'Завершить','Finalizar':'Завершить','Name':'Имя','Nombre':'Имя','Country':'Страна','País':'Страна','Headquarters':'Штаб','Cuartel general':'Штаб','Main squad':'Основной отряд','Squad principal':'Основной отряд','Power':'Мощь','Poder':'Мощь','Choose an option':'Выберите вариант','Selecciona una opción':'Выберите вариант','Yes':'Да','Sí':'Да','No':'Нет','Next':'Далее','Siguiente':'Далее','Previous':'Назад','Anterior':'Назад','Upload image':'Загрузить изображение','Subir imagen':'Загрузить изображение','Take photo':'Сделать фото','Hacer foto':'Сделать фото','Confirm':'Подтвердить','Confirmar':'Подтвердить','Cancel':'Отмена','Cancelar':'Отмена','Search':'Поиск','Buscar':'Поиск',
'HOLa Avatar Studio':'Студия аватаров HOLa','S3 · Egypt Collection':'S3 · Египетская коллекция','S3 · Colección Egipto':'S3 · Египетская коллекция','Forge your identity':'Создай свой образ','Forja tu identidad':'Создай свой образ','Your Egyptian hero':'Твой египетский герой','Tu héroe egipcio':'Твой египетский герой','Mix the pieces, build your design, then let AI turn it into a unique avatar.':'Сочетай элементы, создай дизайн, а затем позволь ИИ превратить его в уникальный аватар.','Combina piezas, crea tu diseño y después deja que la IA lo convierta en un avatar único.':'Сочетай элементы, создай дизайн, а затем позволь ИИ превратить его в уникальный аватар.','✦ Randomize':'✦ Случайно','✦ Aleatorio':'✦ Случайно','↺ Reset':'↺ Сбросить','↺ Reiniciar':'↺ Сбросить','Save draft':'Сохранить черновик','Guardar borrador':'Сохранить черновик','Restore design':'Восстановить дизайн','Recuperar diseño':'Восстановить дизайн','✨ Transform with AI':'✨ Преобразовать с ИИ','✨ Transformar con IA':'✨ Преобразовать с ИИ','AI Avatar':'ИИ-аватар','Avatar IA':'ИИ-аватар','Use this avatar':'Использовать этот аватар','Usar este avatar':'Использовать этот аватар','Download':'Скачать','Descargar':'Скачать','Close':'Закрыть','Cerrar':'Закрыть','Another variant':'Другой вариант','Otra variante':'Другой вариант',
'Administration':'Управление','Administración':'Управление','Log in':'Войти','Iniciar sesión':'Войти','Sign out':'Выйти','Cerrar sesión':'Выйти','Email':'Электронная почта','Password':'Пароль','Contraseña':'Пароль','Access':'Доступ','Acceder':'Войти','Export data':'Экспорт данных','Exportar datos':'Экспорт данных','Audit log':'Журнал действий','Registro de actividad':'Журнал действий','Actual drivers':'Фактические машинисты','Conductores reales':'Фактические машинисты','Events':'События','Eventos':'События','Donations':'Пожертвования','Donaciones':'Пожертвования','Member management':'Управление участниками','Gestión de miembros':'Управление участниками','VS scores':'Очки VS','Puntuaciones VS':'Очки VS',
'⚠ ESTA SEMANA ES DE PRUEBA':'⚠ ЭТА НЕДЕЛЯ ТЕСТОВАЯ','Semana del tren':'Неделя поезда','Conductores de la semana':'Машинисты недели','7 DÍAS · 7 TITULARES':'7 ДНЕЙ · 7 ОСНОВНЫХ МАШИНИСТОВ','Suplentes de la semana':'Запасные на неделю','VS · lunes a jueves':'VS · с понедельника по четверг','DONATIONS':'ПОЖЕРТВОВАНИЯ','11 suplentes por categoría. Si falta un titular, entra el siguiente de su lista. Cada conductor decide sus puestos VIP y Guardián.':'11 запасных по категориям. Если основной машинист отсутствует, его заменяет следующий из списка. Каждый машинист сам назначает места VIP и Стража.','Auditoría del tren':'История поезда','Consulta los resultados, fechas y motivos de un jugador.':'Просмотрите результаты, даты и причины для выбранного игрока.','Escribe el nombre de un jugador para ver su semana.':'Введите имя игрока, чтобы увидеть его неделю.','Las posiciones mostradas esta semana no son las correctas. La clasificación oficial es la que N6C6R6 envíe por correo.':'Позиции, показанные на этой неделе, являются тестовыми. Официальный рейтинг будет указан в письме от N6C6R6.','El método automático se utilizará a partir de la semana del 5 al 10 de octubre, con los datos recogidos del 28 de septiembre al 4 de octubre.':'Автоматический метод начнёт применяться с недели 5–10 октября на основе данных, собранных с 28 сентября по 4 октября.','Del 28 de septiembre al 4 de octubre':'С 28 сентября по 4 октября','Donaciones':'Пожертвования','Suplentes':'Запасные','Titulares':'Основные машинисты','Guardián':'Страж','Jugador':'Игрок','Puntos':'Очки','Fecha':'Дата','Motivo':'Причина'
}));
const ATTR=['placeholder','title','aria-label'];
function localizeDates(value){const months={' ene ':' янв. ',' feb ':' февр. ',' mar ':' марта ',' abr ':' апр. ',' may ':' мая ',' jun ':' июня ',' jul ':' июля ',' ago ':' авг. ',' sept ':' сент. ',' oct ':' окт. ',' nov ':' нояб. ',' dic ':' дек. '};let out=' '+value+' ';for(const [a,b] of Object.entries(months))out=out.replaceAll(a,b);return out.slice(1,-1)}
function translateValue(value){
 if(!value)return value;
 const trimmed=value.trim();
 if(D.has(trimmed))return localizeDates(value.replace(trimmed,D.get(trimmed)));
 let m=trimmed.match(/^(Week|Semana) (\d)\/4 · (.+)$/);if(m)return localizeDates('Неделя '+m[2]+'/4 · '+(D.get(m[3])||m[3]));
 m=trimmed.match(/^(Data|Datos): (.+)$/);if(m)return localizeDates('Данные: '+m[2]);
 m=trimmed.match(/^(Monday|Lunes|Tuesday|Martes|Wednesday|Miércoles|Thursday|Jueves|Friday|Viernes|Saturday|Sábado|Sunday|Domingo) · (.+)$/);if(m)return localizeDates((D.get(m[1])||m[1])+' · '+m[2]);
 m=trimmed.match(/^(Real driver|Conductor real): (.+)$/);if(m)return localizeDates('Фактический машинист: '+m[2]);
 m=trimmed.match(/^(Registered|Registrado): (.+)$/);if(m)return localizeDates('Записан: '+m[2]);
 m=trimmed.match(/^(TOP|Top) (\d+)/);if(m)return localizeDates(trimmed.replace(m[0],'ТОП '+m[2]));
 m=trimmed.match(/^(Week|Semana) (\d)\/4$/);if(m)return 'Неделя '+m[2]+'/4';
 return localizeDates(value);
}
function translateNode(root){
 if(!active())return;
 document.documentElement.lang='ru';
 if(document.title)document.title=translateValue(document.title).replace('Alliance Tracker','Центр альянса').replace('Centro de la alianza','Центр альянса');
 const walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const n of nodes){const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA)$/i.test(p.tagName)||p.closest('[data-no-translate]'))continue;const v=translateValue(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}
 for(const el of (root||document).querySelectorAll?.('*')||[]){for(const a of ATTR){if(el.hasAttribute(a)){const v=translateValue(el.getAttribute(a));if(v!==el.getAttribute(a))el.setAttribute(a,v)}}}
 for(const img of document.querySelectorAll('#currentFlag,#flag,.translator-btn img,.language__current')){img.src='https://flagcdn.com/w80/ru.png';img.alt='Русский'}
}
function russianButton(){
 const candidates=[...document.querySelectorAll('[data-lang],[data-html]')].filter(x=>x.matches('button'));
 if(candidates.some(x=>x.dataset.lang==='ru'||x.dataset.html==='ru'))return;
 const sample=candidates.find(x=>x.dataset.lang==='en'||x.dataset.html==='en')||candidates[0];
 if(!sample)return;
 const button=sample.cloneNode(true);button.dataset.lang='ru';if('html'in button.dataset)button.dataset.html='ru';if('code'in button.dataset)button.dataset.code='ru';
 const img=button.querySelector('img');if(img){img.src='https://flagcdn.com/w40/ru.png';img.alt=''}
 const span=button.querySelector('span');if(span)span.textContent='Русский';else{const flag=button.querySelector('img');button.childNodes.forEach(n=>{if(n.nodeType===3)n.remove()});button.append(document.createTextNode(' Русский'))}
 const parent=sample.parentElement?.tagName==='LI'?sample.parentElement.cloneNode(false):null;if(parent){parent.append(button);sample.parentElement.parentElement.append(parent)}else sample.parentElement.append(button);
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-lang],[data-html]');
 if(!b)return;
 const lang=b.dataset.lang||b.dataset.html;
 if(lang)syncLanguage(lang);
 if(lang==='ru'){e.preventDefault();e.stopImmediatePropagation();location.reload()}
},true);
function boot(){
 russianButton();
 if(!active())return;
 translateNode(document.body);
 let timer=0,pending=new Set(),busy=false;
 const obs=new MutationObserver(list=>{
  if(!active()||busy)return;
  for(const m of list)for(const n of m.addedNodes){
   const el=n.nodeType===1?n:(n.nodeType===3?n.parentElement:null);
   if(el)pending.add(el);
  }
  if(!pending.size||timer)return;
  timer=setTimeout(()=>{
   timer=0;if(!active())return pending.clear();
   busy=true;obs.disconnect();
   const roots=[...pending];pending.clear();
   for(const root of roots)if(root.isConnected)translateNode(root);
   obs.observe(document.body,{childList:true,subtree:true});
   busy=false;
  },250);
 });
 obs.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();