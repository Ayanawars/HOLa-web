import {translateSuggestions} from './suggestions-i18n.js?v=20261025-1';
const render=()=>translateSuggestions();
new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
render();
