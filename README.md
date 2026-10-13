# 🚀 MegaOnline - CNPJ Pro (v3.0)

Aplicação web para consulta de CNPJ com interface estilo SaaS, resiliência de dados e visualização avançada.

👉 Acesse online: [https://marcosdemori.github.io/consultar-cnpj/](https://marcosdemori.github.io/consultar-cnpj/)

---

## 🧠 Visão Geral

Consulta de CNPJ individual ou em massa, com dados cadastrais, Inscrição Estadual, CNAEs, quadro societário e enquadramento tributário. Frontend estático, sem build e sem backend.

## 📁 Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | Marcação e metadados (SEO, Open Graph, CSP) |
| `styles.css` | Estilos, com temas claro/escuro por variáveis CSS |
| `app.js` | Lógica de consulta, renderização, lote e exportação |
| `boot.js` | Lê e remove o `?cnpj=` da URL antes de scripts de terceiros |
| `manifest.json`, `robots.txt`, `sitemap.xml`, `404.html` | Suporte a PWA e indexação |

## 🔄 Origem dos dados

- **API primária:** [cnpj.ws](https://publica.cnpj.ws) — **única fonte gratuita que retorna Inscrição Estadual**.
- **API de fallback:** [CNPJá Open](https://open.cnpja.com) — dados cadastrais quando a primária está indisponível.

> ⚠️ O endpoint gratuito da CNPJá Open **não retorna o campo `registrations`** (Inscrição Estadual), que exige plano pago. Por isso, dados vindos do fallback exibem a IE como **`INDISPONÍVEL`**, nunca como `ISENTO`: afirmar isenção sem ter consultado a fonte de IE produziria cadastro fiscal incorreto.

Em caso de *rate limit* (HTTP 429), a aplicação **aguarda e repete na API primária** em vez de cair no fallback, preservando o campo de IE. Só após esgotar as tentativas o fallback é aceito, devidamente sinalizado.

## 🛠️ Correções da Versão 3.0

### Inscrição Estadual
- **IE não é mais omitida indevidamente.** O fallback nunca retornou IE; o resultado era exibido como `ISENTO`. Agora os três estados são distintos: IE encontrada, `ISENTO` (fonte confirmou ausência) e `INDISPONÍVEL` (fonte não consultada).
- **Fim de números de IE inválidos.** A IE era formatada com o tamanho da UF do *estabelecimento*. Uma empresa em SP com inscrição apenas em MS tinha `283242809` preenchida para 12 dígitos, gerando um número inexistente. Agora o padrão aplicado é o da UF da própria inscrição, com aviso quando as UFs divergem.
- **Prioridade de seleção:** IE ativa da mesma UF → IE da mesma UF → IE ativa de outra UF → primeira disponível.

### Dados do fallback
- **Sócios voltaram a aparecer.** A normalização lia `d.members`, mas a CNPJá Open entrega em `company.members`, com o nome em `member.person.name`. O quadro societário vinha sempre vazio.
- Corrigidos também `faixa_etaria` e os campos de Simples/MEI.

### Segurança
- **XSS corrigido (confirmado explorável).** Campos vindos das APIs eram interpolados sem escape em `innerHTML` nos badges, sócios, CNAEs e na tabela de lote. Uma `razao_social` maliciosa executava script. Todo dado de terceiros passa por `esc()`.
- **CSV formula injection.** Campos iniciados por `=`, `+`, `-` ou `@` eram executados como fórmula ao abrir o CSV no Excel/Sheets. Neutralizados por `csvSafe()`.
- **CSP** via `<meta http-equiv>`, sem `unsafe-inline` em `script-src`.

### Consulta em massa
- CNPJs são validados por dígito verificador antes do envio, e itens inválidos ou acima do limite de 50 são informados em vez de descartados em silêncio.
- Corrigida condição de corrida em que pausar ou limpar o lote deixava a execução anterior sobrescrever a interface.

## 🔒 Privacidade

A aplicação **não mantém o CNPJ consultado na barra de endereços**. O parâmetro `?cnpj=` de links compartilhados é lido e removido por `boot.js` antes de qualquer script de terceiros carregar, para que o analytics não registre qual empresa cada visitante consultou. O compartilhamento continua disponível pelo botão **Copiar link**, que monta a URL sob demanda.

O histórico de consultas fica apenas no `localStorage` do navegador e não é transmitido.

## 📊 Analytics

Usa **Cloudflare Web Analytics**: sem cookies e sem dados pessoais, dispensando banner de consentimento sob a LGPD.

Para ativar, substitua `SEU_TOKEN_AQUI` em `index.html` pelo token gerado em *dash.cloudflare.com → Analytics & Logs → Web Analytics → Add a site*. Não é necessário mover o domínio para a Cloudflare.

## 🔍 Funcionalidades

- **Dashboard** com dados cadastrais, sócios, CNAEs e cronologia.
- **Regime tributário:** MEI, Simples Nacional e Regime Ordinário com datas de opção.
- **Consulta em massa** de até 50 CNPJs por lote, com intervalo configurável.
- **Histórico local** das últimas consultas (`localStorage`).
- **Copiar ao clicar** em qualquer campo.
- **Exportação CSV** das consultas em massa.

## 🖥️ Tecnologias

HTML5, CSS3 (variáveis dinâmicas) e JavaScript puro, sem frameworks nem etapa de build.

## 🌐 Deploy

Hospedado via **GitHub Pages**. Para rodar localmente, sirva o diretório por HTTP:

```bash
python -m http.server 8000
```

Abrir `index.html` direto pelo `file://` não funciona: o navegador bloqueia as requisições às APIs por CORS.

## 👨‍💻 Autor

Desenvolvido por **Marcos De Mori Laiola**
