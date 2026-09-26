// Language auto-redirect: a visitor whose browser language is Japanese lands
// on index-ja.html, everyone else on index.html.  Runs in <head>, before
// paint.  Once the visitor picks a language with the switch link, that
// choice is remembered (localStorage) and wins over the browser language.
(function () {
  var pageLang = document.documentElement.getAttribute('lang') === 'ja' ? 'ja' : 'en';
  var stored = null;
  try { stored = localStorage.getItem('lang'); } catch (e) {}
  var wanted = stored || (((navigator.language || navigator.userLanguage || '').toLowerCase().indexOf('ja') === 0) ? 'ja' : 'en');
  if (wanted !== pageLang) {
    var target = wanted === 'ja' ? 'index-ja.html' : 'index.html';
    location.replace(target + location.search + location.hash);
    return;
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a.lang-switch').forEach(function (a) {
      a.addEventListener('click', function () {
        try { localStorage.setItem('lang', a.getAttribute('hreflang') === 'ja' ? 'ja' : 'en'); } catch (e) {}
      });
    });
  });
})();
