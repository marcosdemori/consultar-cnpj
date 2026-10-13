/* =====================================================
    BOOT — executa antes de qualquer script de terceiros.

    A aplicacao aceita ?cnpj= para abrir um link compartilhado, mas manter
    esse parametro na barra de enderecos faria com que o beacon de analytics
    registrasse QUAL empresa cada visitante consultou, associada ao IP e ao
    horario. Aqui o parametro e lido para memoria e removido do historico
    imediatamente, antes de o beacon carregar. O compartilhamento continua
    funcionando: o botao "Copiar link" monta a URL sob demanda.
    ===================================================== */
(function () {
  'use strict';
  var cnpj = '';
  try {
    cnpj = (new URLSearchParams(location.search).get('cnpj') || '').replace(/\D/g, '');
  } catch (e) { /* URL malformada: segue sem consulta inicial */ }

  window.__initialCnpj = cnpj.length === 14 ? cnpj : '';

  // Remove a query string do endereco sem recarregar nem criar entrada no historico.
  if (location.search) {
    try {
      history.replaceState({}, '', location.pathname + location.hash);
    } catch (e) { /* navegador sem History API: o parametro permanece */ }
  }
})();
