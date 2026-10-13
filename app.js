/* === TEMA === */
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const sunIcon = `<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"></path>`;
const moonIcon = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
function setTheme(isLight) {
  isLight ? document.body.classList.add('light-mode') : document.body.classList.remove('light-mode');
  themeIcon.innerHTML = isLight ? moonIcon : sunIcon;
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
const savedTheme = localStorage.getItem('theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(savedTheme === 'light' || (!savedTheme && !systemDark));
themeToggle.addEventListener('click', () => setTheme(!document.body.classList.contains('light-mode')));

/* === TABS === */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const btn = document.getElementById('tab' + (tab === 'unico' ? 'Unico' : 'Massa'));
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  document.getElementById('panel' + (tab === 'unico' ? 'Unico' : 'Massa')).classList.add('active');
}
document.getElementById('tabUnico').addEventListener('click', () => switchTab('unico'));
document.getElementById('tabMassa').addEventListener('click', () => switchTab('massa'));

/* === CONSTANTES === */
const LK = 'cnpj_lv3', HK = 'cnpj_hv3', RW = 15000, SC = 20000, MR = 5;
const IEL = {
  AC:13,AL:9,AP:9,AM:9,BA:8,CE:9,DF:13,ES:9,GO:9,MA:9,MT:11,MS:9,MG:13,PA:9,
  PB:9,PR:10,PE:14,PI:9,RJ:8,RN:10,RS:10,RO:14,RR:9,SC:9,SP:12,SE:9,TO:11
};
const G = id => document.getElementById(id);

const cnpjInput = G('cnpjInput'), cBtn = G('consultarBtn'), lBtn = G('limparBtn');
const errBox = G('errorBox'), errTxt = G('errorText'), toastEl = G('toastBox');
const emptyEl = G('emptyState'), resultEl = G('resultSection'), statusEl = G('statusBadge');
const histStrip = G('historyStrip'), histList = G('historyList');
const banName = G('banName'), banFantasy = G('banFantasy'), banBadges = G('banBadges'), banMeta = G('banMeta');
const fDados = G('dadosCadastrais'), fEnder = G('enderecoContato');
const cnaeMain = G('cnaeMain'), cnaeList = G('cnaeList'), cnaeCnt = G('cnaeCount'), cnaeSec = G('cnaeSecWrap');
const socList = G('sociosList'), socCnt = G('sociosCount');
const regSec = G('regimeSection'), capEl = G('capitalPorte'), inscEl = G('inscricoes'), cronEl = G('cronologia');

let curCnpj = '', rHist = [], lCnpj = '', lAt = 0, cdT = null, toT = null;

/* === UTILS === */
const dg = v => String(v || '').replace(/\D/g, '');
/* Escapa dados de terceiros antes de injetar via innerHTML (anti-XSS). */
const esc = v => String(v == null ? '' : v)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
/* Neutraliza fórmulas em CSV (Excel/Sheets interpretam =, +, -, @, tab e CR). */
const csvSafe = v => {
  const t = String(v == null ? '' : v);
  return /^[=+\-@\t\r\n]/.test(t) ? "'" + t : t;
};
const f14 = v => {
  const d = dg(v).slice(0, 14);
  return d.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3')
           .replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2');
};
const fC = v => { const d = dg(v); return d.length===14 ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5') : v||'—'; };
const fCep = v => { const d = dg(v); return d.length===8 ? d.replace(/(\d{5})(\d{3})/,'$1-$2') : v||'—'; };
const fD = v => { if(!v) return '—'; const d = new Date(v+'T12:00:00'); return isNaN(d) ? '—' : d.toLocaleDateString('pt-BR'); };
const fM = v => { if(v==null||v==='') return '—'; return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)); };
const fPh = (d,p) => { if(!d||!p) return null; const s=String(p).replace(/\D/g,''); return s.length===8?`(${d}) ${s.slice(0,4)}-${s.slice(4)}`:s.length===9?`(${d}) ${s.slice(0,5)}-${s.slice(5)}`:`(${d}) ${p}`; };
const fIE = (v,u) => { const d=dg(v); const l=IEL[String(u||'').toUpperCase()]; return !d?String(v||'—'):!l?d:d.padStart(l,'0'); };
const ieUF = ie => String(ie?.uf || ie?.state || ie?.estado?.sigla || '').toUpperCase();
function pickIE(est) {
  const ies = Array.isArray(est?.inscricoes_estaduais) ? est.inscricoes_estaduais : [];
  const uf = String(est?.estado?.sigla || est?.uf || '').toUpperCase();
  if(!ies.length) return null;
  const hasNumber = ie => !!dg(ie?.inscricao_estadual || ie?.number || '');
  const isActive = ie => ie?.ativo === true || ie?.enabled === true || ie?.active === true || ie?.status?.text === 'Ativa';
  return ies.find(ie => hasNumber(ie) && ieUF(ie) === uf && isActive(ie))
      || ies.find(ie => hasNumber(ie) && ieUF(ie) === uf)
      || ies.find(ie => hasNumber(ie) && isActive(ie))
      || ies.find(hasNumber)
      || null;
}
/* Resolve a IE para exibição.
   Distingue três estados que antes eram todos exibidos como "ISENTO":
     known=false  -> a fonte consultada não informa IE (ex.: fallback CNPJá Open)
     ie=null      -> a fonte informa que não há IE (isento de fato)
     ie presente  -> número formatado pelo padrão da UF da própria inscrição */
function ieInfo(data) {
  const est = data?.estabelecimento || {};
  const estUF = String(est?.estado?.sigla || est?.uf || '').toUpperCase();
  if (data?._ieUnavailable) {
    return { text: 'INDISPONÍVEL', known: false, copyable: false, ie: null, uf: estUF, foreign: false };
  }
  const ie = pickIE(est);
  if (!ie || !dg(ie.inscricao_estadual || ie.number || '')) {
    return { text: 'ISENTO', known: true, copyable: false, ie: null, uf: estUF, foreign: false };
  }
  // Formata pelo tamanho da UF da própria inscrição, nunca pela UF do estabelecimento:
  // padronizar uma IE de MS com o tamanho de SP produziria um número inexistente.
  const ownUF = ieUF(ie) || estUF;
  const num = ie.inscricao_estadual || ie.number || '';
  return {
    text: fIE(num, ownUF),
    known: true,
    copyable: true,
    ie,
    uf: ownUF,
    foreign: !!(ownUF && estUF && ownUF !== estUF)
  };
}
const fCnae = v => { if(!v) return '—'; const s=String(v).replace(/\D/g,''); return s.length>=5?s.slice(0,4)+'-'+s.slice(4,5)+(s.length>5?'/'+s.slice(5):''):s; };
const ini = n => (n||'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';

/* === UI HELPERS === */
const sErr = m => { errTxt.textContent=m; errBox.style.display='flex'; };
const hErr = () => { errBox.style.display='none'; errTxt.textContent=''; };
function sToast(m,t='ok') {
  toastEl.textContent=m; toastEl.className='toast '+t; toastEl.style.display='flex';
  if(toT) clearTimeout(toT); toT=setTimeout(()=>toastEl.style.display='none',3000);
}
function setSt(lbl,cls='') {
  statusEl.innerHTML=`<div class="nav-dot"></div>${lbl}`;
  statusEl.className='nav-pill'+(cls?' '+cls:'');
}
function setLoad(v) {
  cBtn.disabled=v; cBtn.textContent=v?'Consultando…':'Consultar';
  setSt(v?'Consultando…':'Aguardando consulta',v?'loading':'');
}
function stopCd() { if(cdT){clearInterval(cdT);cdT=null;} if(!cBtn.disabled) cBtn.textContent='Consultar'; }
function startCd(ms,msg) {
  stopCd(); cBtn.disabled=true;
  const t0=Date.now();
  const tick=()=>{
    const r=ms-(Date.now()-t0);
    if(r<=0){stopCd();cBtn.disabled=false;hErr();return;}
    const s=Math.max(1,Math.ceil(r/1000));
    cBtn.textContent=`${s}s`;
    if(msg) sErr(`${msg} Aguarde ${s}s.`);
  };
  tick(); cdT=setInterval(tick,300);
}
async function cpTxt(t) {
  if(!t) return false;
  if(window.isSecureContext&&navigator.clipboard){try{await navigator.clipboard.writeText(t);return true;}catch(e){}}
  const fa=G('cFB'); fa.value=t; fa.style.left='0'; fa.select();
  let ok=false; try{ok=document.execCommand('copy');}catch(e){}
  fa.style.left='-9999px'; window.getSelection()?.removeAllRanges(); return ok;
}

/* === VALIDAÇÃO E STORAGE === */
function canR(c) {
  const n=Date.now(); rHist=rHist.filter(t=>n-t<RW);
  if(rHist.length>=MR) return{ok:false,ms:RW-(n-rHist[0]),msg:'Muitas consultas em pouco tempo.'};
  if(lCnpj===c&&n-lAt<SC) return{ok:false,ms:SC-(n-lAt),msg:'Este CNPJ foi consultado recentemente.'};
  return{ok:true};
}
function regR(c) { rHist.push(Date.now()); lCnpj=c; lAt=Date.now(); }
const savL = c => { try{localStorage.setItem(LK,dg(c));}catch(e){} };
const loadL = () => { try{return localStorage.getItem(LK)||'';}catch(e){return '';} };
const clrL = () => { try{localStorage.removeItem(LK);}catch(e){} };
function savH(c) {
  try{
    const cl=dg(c);
    let h=JSON.parse(localStorage.getItem(HK)||'[]');
    h=[cl,...h.filter(x=>x!==cl)].slice(0,7);
    localStorage.setItem(HK,JSON.stringify(h));
  }catch(e){}
}
const getH = () => { try{return JSON.parse(localStorage.getItem(HK)||'[]');}catch(e){return[];} };
function renderHist() {
  const h=getH();
  if(!h.length){histStrip.style.display='none';return;}
  histStrip.style.display='block'; histList.innerHTML='';
  h.forEach(i=>{
    const b=document.createElement('button'); b.className='chip'; b.textContent=fC(i);
    b.onclick=()=>{cnpjInput.value=f14(i);consultar();};
    histList.appendChild(b);
  });
}
function vCnpj(c) {
  const d=dg(c);
  if(d.length!==14||/^(\d)\1+$/.test(d)) return false;
  const calc=(s,t)=>{
    let sum=0,pos=s-7;
    for(let i=s;i>=1;i--){sum+=d.charAt(s-i)*pos--;if(pos<2)pos=9;}
    const r=sum%11<2?0:11-(sum%11); return r===Number(d.charAt(t));
  };
  return calc(12,12)&&calc(13,13);
}
function regime(data) {
  const s=data.simples||{};
  const mei=s.mei==='Sim'||s.mei===true;
  const sn=s.simples==='Sim'||s.simples===true;
  if(mei) return{cls:'mei',name:'MEI',desc:'Microempreendedor Individual',opt:fD(s.data_opcao_simples),excl:fD(s.data_exclusao_simples)};
  if(sn) return{cls:'simples',name:'Simples Nacional',desc:'Enquadrado no Simples Nacional',opt:fD(s.data_opcao_simples),excl:fD(s.data_exclusao_simples)};
  return{cls:'ordinario',name:'Regime Ordinário',desc:'Lucro Presumido ou Lucro Real',opt:'—',excl:'—'};
}
function scls(s) { const u=(s||'').toUpperCase(); return u==='ATIVA'?'g':/INAPTA|CANCELADA|BAIXADA/.test(u)?'r':'a'; }
function sbdg(s) { const c=scls(s); return c==='g'?'bdg-g':c==='r'?'bdg-r':'bdg-a'; }
function fi(lbl,val,cls='',mono=false,copyable=false) {
  const d=document.createElement('div');
  const isCop=copyable&&val&&val!=='—'&&val!=='ISENTO';
  d.className='fi'+(isCop?' copyable':''); d.title=isCop?'Clique para copiar':'';
  d.innerHTML=`<div class="fi-l">${esc(lbl)}</div><div class="fi-v${mono?' mono':''}${cls?' '+cls:''}">${esc(val||'—')}</div>`;
  if(isCop) d.addEventListener('click',async()=>{if(await cpTxt(val)) sToast(lbl+' copiado!','ok');});
  return d;
}

/* === RENDER INDIVIDUAL === */
function renderData(data) {
  const est=data.estabelecimento||{}; const uf=est.estado?.sigla||'';
  curCnpj=dg(est.cnpj||cnpjInput.value);
  banName.textContent=data.razao_social||'—';
  banFantasy.textContent=est.nome_fantasia?`Nome fantasia: ${est.nome_fantasia}`:'Sem nome fantasia cadastrado';
  banBadges.innerHTML='';
  const sit=est.situacao_cadastral||''; const reg=regime(data);
  [[sit,sbdg(sit)],[fC(est.cnpj),'bdg-i'],[reg.name,reg.cls==='simples'?'bdg-g':reg.cls==='mei'?'bdg-a':'bdg-i']].forEach(([t,c])=>{
    const b=document.createElement('span'); b.className='bdg '+c;
    b.innerHTML=`<span class="bdg-dot"></span>${esc(t)}`; banBadges.appendChild(b);
  });
  banMeta.innerHTML='';
  [{l:'CNPJ',v:fC(est.cnpj),mono:true,copyVal:dg(est.cnpj)},{l:'Situação',v:sit,cls:scls(sit)},
   {l:'Abertura',v:fD(est.data_inicio_atividade)},{l:'Porte',v:data.porte?.descricao||'—'},
   {l:'Regime',v:reg.name},{l:'Capital social',v:fM(data.capital_social)}].forEach(({l,v,cls,mono,copyVal})=>{
    const d=document.createElement('div'); d.className='bm-item'+(copyVal?' copyable':''); d.title=copyVal?'Clique para copiar':'';
    d.innerHTML=`<div class="bm-lbl">${esc(l)}</div><div class="bm-val${mono?' mono':''}${cls?' '+cls:''}">${esc(v||'—')}</div>`;
    if(copyVal) d.addEventListener('click',async()=>{if(await cpTxt(copyVal)) sToast(l+' copiado!','ok');});
    banMeta.appendChild(d);
  });
  fDados.innerHTML='';
  [{l:'Razão social',v:data.razao_social,copy:true},{l:'Nome fantasia',v:est.nome_fantasia,copy:true},
   {l:'Natureza jurídica',v:data.natureza_juridica?.descricao,copy:false},{l:'Tipo de unidade',v:est.tipo,copy:false},
   {l:'Atualizado em',v:fD(data.atualizado_em),copy:false}].forEach(({l,v,copy})=>fDados.appendChild(fi(l,v,'',false,copy)));
  fEnder.innerHTML='';
  const logr=[est.tipo_logradouro,est.logradouro].filter(Boolean).join(' ')||'—';
  const tels=[fPh(est.ddd1,est.telefone1),fPh(est.ddd2,est.telefone2)].filter(Boolean);
  [{l:'Logradouro',v:`${logr}, ${est.numero||'S/N'}`,copy:true},{l:'Bairro',v:est.bairro,copy:true},
   {l:'Município',v:est.cidade?.nome,copy:true},{l:'UF',v:uf,copy:false},
   {l:'CEP',v:fCep(est.cep),mono:true,copy:true},{l:'Telefone',v:tels.join(' · ')||'—',copy:true},
   {l:'E-mail',v:est.email,copy:true}].filter(x=>x.v).forEach(({l,v,mono,copy})=>fEnder.appendChild(fi(l,v,'',mono,copy)));
  const ap=est.atividade_principal; cnaeMain.innerHTML='';
  if(ap){const d=document.createElement('div');d.className='cnae-p';d.innerHTML=`<div class="cnae-badge">${esc(fCnae(ap.id||ap.subclasse))}</div><div class="cnae-txt">${esc(ap.descricao||ap.texto||'—')}</div>`;cnaeMain.appendChild(d);}
  const atSec=est.atividades_secundarias||[];
  cnaeCnt.textContent=`${1+atSec.length} atividade${(1+atSec.length)>1?'s':''}`;
  cnaeList.innerHTML='';
  if(atSec.length){
    cnaeSec.style.display='';
    atSec.forEach(a=>{const d=document.createElement('div');d.className='csec-i';d.innerHTML=`<div class="csec-code">${esc(fCnae(a.id||a.subclasse))}</div><div class="csec-desc">${esc(a.descricao||a.texto||'—')}</div>`;cnaeList.appendChild(d);});
  }else{cnaeSec.style.display='none';}
  socList.innerHTML=''; const socios=data.socios||[];
  socCnt.textContent=`${socios.length} sócio${socios.length!==1?'s':''}`;
  if(socios.length){
    socios.forEach(s=>{
      const d=document.createElement('div'); d.className='partner';
      d.innerHTML=`<div class="p-row"><div class="p-av">${esc(ini(s.nome))}</div><div><div class="p-name">${esc(s.nome||'—')}</div><div class="p-role">${esc(s.qualificacao_socio?.descricao||'Qualificação não informada')}</div></div></div><div class="p-tags"><span class="ptag">Entrada: ${esc(fD(s.data_entrada))}</span>${s.faixa_etaria?`<span class="ptag">${esc(s.faixa_etaria)}</span>`:''}</div>`;
      socList.appendChild(d);
    });
  }else{socList.innerHTML='<div style="font-size:13px;color:var(--text4);padding:4px 0">Nenhum sócio retornado.</div>';}
  regSec.innerHTML='';
  const rh=document.createElement('div'); rh.className=`rh ${reg.cls}`;
  rh.innerHTML=`<div class="rh-lbl">Regime de tributação</div><div class="rh-name">${reg.name}</div><div class="rh-desc">${reg.desc}</div>`;
  regSec.appendChild(rh);
  const rf=document.createElement('div'); rf.className='fgrid col1'; rf.style.marginTop='10px';
  if(reg.opt!=='—') rf.appendChild(fi('Opção pelo Simples',reg.opt));
  if(reg.excl!=='—') rf.appendChild(fi('Exclusão do Simples',reg.excl));
  if(rf.children.length) regSec.appendChild(rf);
  capEl.innerHTML=''; capEl.appendChild(fi('Capital social',fM(data.capital_social))); capEl.appendChild(fi('Porte',data.porte?.descricao));
  if(data.natureza_juridica?.descricao) capEl.appendChild(fi('Natureza jurídica',data.natureza_juridica.descricao));
  inscEl.innerHTML='';
  const ieI=ieInfo(data);
  inscEl.appendChild(fi('Insc. estadual',ieI.text,'',true,ieI.copyable));
  inscEl.appendChild(fi('Estado',uf||'—'));
  if(!ieI.known){
    inscEl.appendChild(fi('Fonte da IE','Não consultada — refaça a consulta para obter a IE'));
  } else if(ieI.ie && ieI.ie.ativo!==undefined){
    inscEl.appendChild(fi('Status IE',ieI.ie.ativo?'Ativa':'Inativa'));
  }
  if(ieI.foreign) inscEl.appendChild(fi('UF da inscrição',ieI.uf+' (difere da UF do estabelecimento)'));
  cronEl.innerHTML='';
  [{l:'Abertura da empresa',v:fD(est.data_inicio_atividade),f:true},
   {l:'Data da situação cadastral',v:fD(est.data_situacao_cadastral),f:!!(est.data_situacao_cadastral)},
   {l:'Última atualização',v:fD(data.atualizado_em),f:false}].forEach(({l,v,f})=>{
    const d=document.createElement('div'); d.className='tl-item';
    d.innerHTML=`<div class="tl-dot${f?' filled':''}"></div><div><div class="tl-l">${l}</div><div class="tl-v">${v}</div></div>`;
    cronEl.appendChild(d);
  });
  emptyEl.style.display='none'; resultEl.style.display='block'; setSt('Dados carregados','active');
  // Badge de fonte da API
  const srcBdg = document.createElement('span');
  const isFallback = data._source === 'cnpja';
  srcBdg.className = 'bdg ' + (isFallback ? 'bdg-a' : 'bdg-n');
  srcBdg.style.fontSize = '10px';
  srcBdg.title = isFallback
    ? 'Fonte secundária (CNPJá Open): não informa Inscrição Estadual.'
    : 'Fonte primária (CNPJ.ws), com Inscrição Estadual.';
  srcBdg.innerHTML = `<span class="bdg-dot"></span>${isFallback ? 'Fonte alternativa — sem IE' : 'Fonte oficial — com IE'}`;
  banBadges.appendChild(srcBdg);
}

/* =====================================================
    CAMADA DE ABSTRAÇÃO — DUAS APIs
    Primary  : publica.cnpj.ws  (única fonte gratuita de IE)
    Secondary: open.cnpja.com   (fallback cadastral; NÃO retorna IE)

    O endpoint gratuito open.cnpja.com/office/{cnpj} não inclui o campo
    "registrations" — ele exige plano pago. Por isso todo dado vindo do
    fallback é marcado com _ieUnavailable e exibido como INDISPONÍVEL,
    nunca como ISENTO: afirmar isenção sem ter consultado a fonte de IE
    produz cadastro fiscal errado.
    ===================================================== */

/* Normaliza resposta da CNPJá Open para o formato interno (cnpj.ws) */
function normalizeCnpja(d) {
  const c = d.company || {};
  const address = d.address || {};
  const phones = d.phones || [];
  const emails = d.emails || [];
  const activities = d.mainActivity ? [d.mainActivity] : [];
  const secondaries = d.sideActivities || [];
  // Os sócios ficam em company.members (não em d.members) e o nome em member.person.name.
  const members = c.members || d.members || [];
  const regs = d.registrations || [];
  const simples = c.simples || {};
  const simei = c.simei || {};

  const normalizedRegs = regs
    .filter(r => r && r.number)
    .map(r => ({
      inscricao_estadual: r.number || '',
      ativo: r.enabled !== false,
      uf: r.state || ''
    }));

  return {
    _source: 'cnpja',
    // O plano gratuito não devolve registrations: a IE é desconhecida, não ausente.
    _ieUnavailable: normalizedRegs.length === 0,
    razao_social: c.name || d.alias || '',
    capital_social: c.equity,
    porte: { descricao: c.size?.text || '' },
    natureza_juridica: { descricao: c.nature?.text || '' },
    atualizado_em: d.updated,
    socios: members.map(m => ({
      nome: m.person?.name || m.name || '',
      qualificacao_socio: { descricao: m.role?.text || '' },
      data_entrada: m.since,
      faixa_etaria: m.person?.age || m.age?.text || m.age || ''
    })),
    simples: {
      simples: simples.optant ? 'Sim' : 'Não',
      mei: simei.optant ? 'Sim' : 'Não',
      data_opcao_simples: simples.since,
      data_exclusao_simples: simples.until || null
    },
    estabelecimento: {
      cnpj: d.taxId,
      nome_fantasia: d.alias,
      tipo: d.head ? 'Matriz' : 'Filial',
      situacao_cadastral: d.status?.text || '',
      data_situacao_cadastral: d.statusDate,
      data_inicio_atividade: d.founded,
      tipo_logradouro: address.street ? '' : '',
      logradouro: address.street || '',
      numero: address.number || '',
      complemento: address.details || '',
      bairro: address.district || '',
      cep: address.zip || '',
      cidade: { nome: address.city || '' },
      estado: { sigla: address.state || '' },
      ddd1: phones[0]?.area || '',
      telefone1: phones[0]?.number || '',
      ddd2: phones[1]?.area || '',
      telefone2: phones[1]?.number || '',
      email: emails[0]?.address || '',
      atividade_principal: activities[0] ? {
        id: activities[0].id,
        descricao: activities[0].text
      } : null,
      atividades_secundarias: secondaries.map(a => ({ id: a.id, descricao: a.text })),
      inscricoes_estaduais: normalizedRegs
    }
  };
}

/* Tenta a API primária; em caso de erro ou limite, tenta a secundária.
   Em 429 NÃO cai direto para o fallback: a secundária não tem IE, então
   esperar e repetir na primária preserva o dado fiscal. O fallback só
   entra quando a primária está indisponível de fato. */
async function fetchCnpjDual(cnpj) {
  try {
    const r = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`);
    if (r.status === 429) return { retry429: true };
    if (r.ok) {
      const d = await r.json();
      d._source = 'cnpjws';
      d._ieUnavailable = false;
      return { data: d };
    }
    if (r.status === 404) {
      // Pode ser lacuna da base da cnpj.ws; confirma na secundária antes de negar.
      const fb = await tryCnpjaFallback(cnpj);
      if (fb.ok) return fb;
      return { error: 'Não encontrado na Receita Federal.' };
    }
  } catch(e) {}

  return await tryCnpjaFallback(cnpj);
}

async function tryCnpjaFallback(cnpj) {
  try {
    const r2 = await fetch(`https://open.cnpja.com/office/${cnpj}`);
    if (r2.ok) {
      const d2 = await r2.json();
      return { data: normalizeCnpja(d2), fallback: true, ok: true };
    }
    if (r2.status === 404) return { error: 'CNPJ não encontrado em nenhuma das bases.', ok: false };
    if (r2.status === 429) return { error: 'Limite de requisições atingido nas duas APIs.', ok: false };
    return { error: 'Erro na comunicação com ambas as APIs.', ok: false };
  } catch(e) {
    return { error: 'Falha de rede em ambas as APIs.', ok: false };
  }
}

// async function fetchCnpjDual(cnpj) {
//   // --- Tentativa 1: Primária (cnpj.ws) ---
//   try {
//     const r = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`);
//     if (r.ok) {
//       const d = await r.json();
//       d._source = 'cnpjws';
//       return { data: d };
//     }
//     if (r.status === 404) return { error: 'Não encontrado.' };
//   } catch(e) {}

//   // --- Tentativa 2: Secundária (Brasil API - Fallback mais forte) ---
//   try {
//     const r2 = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
//     if (r2.ok) {
//       const d2 = await r2.json();
//       // Normalização básica para o seu sistema
//       return { 
//         data: {
//           razao_social: d2.razao_social,
//           estabelecimento: {
//             cnpj: d2.cnpj,
//             situacao_cadastral: d2.descricao_situacao_cadastral,
//             estado: { sigla: d2.uf },
//             inscricoes_estaduais: d2.inscricoes_estaduais || [] // Brasil API retorna este array
//           },
//           simples: {
//             simples: d2.opcao_pelo_simples ? 'Sim' : 'Não',
//             mei: d2.opcao_pelo_mei ? 'Sim' : 'Não'
//           }
//         }, 
//         fallback: true 
//       };
//     }
//   } catch(e) {}

//   return { error: 'Ambas as APIs falharam.' };
// }

/* === CONSULTA INDIVIDUAL === */
async function consultar() {
  const cnpj=dg(cnpjInput.value); hErr();
  if(!vCnpj(cnpj)){sErr('CNPJ inválido. Verifique os dígitos e tente novamente.');return;}
  const chk=canR(cnpj);
  if(!chk.ok){startCd(chk.ms,chk.msg);sToast(chk.msg,'warn');return;}
  stopCd(); setLoad(true); regR(cnpj);
  try{
    const res = await fetchCnpjDual(cnpj);
    if(res.retry429){
      startCd(20000,'Limite da API atingido.');
      throw new Error('Muitas requisições. Aguarde 20s.');
    }
    if(res.error) throw new Error(res.error);
    renderData(res.data);
    savL(cnpj); savH(cnpj); renderHist();
    sToast(res.fallback
      ? 'Fonte alternativa (CNPJá): Inscrição Estadual indisponível. Refaça a consulta em alguns instantes para obtê-la.'
      : 'Consulta realizada com sucesso!', res.fallback ? 'warn' : 'ok');
  }catch(e){sErr(e.message);setSt('Erro na consulta','');}finally{setLoad(false);}
}
function limpar() {
  stopCd(); cnpjInput.value=''; curCnpj=''; hErr(); clrL();
  resultEl.style.display='none'; emptyEl.style.display='';
  setSt('Aguardando consulta',''); cnpjInput.focus();
}
/* O CNPJ consultado NAO vai para a barra de enderecos: isso o entregaria ao
   beacon de analytics e ao Referer, revelando qual empresa cada visitante
   consultou. O link compartilhavel e montado sob demanda em shareUrl(). */
function shareUrl(c) {
  const u = new URL(location.href);
  u.search = '';
  u.hash = '';
  if (dg(c).length === 14) u.searchParams.set('cnpj', dg(c));
  return u.toString();
}

cnpjInput.addEventListener('input',function(){this.value=f14(this.value);});
cnpjInput.addEventListener('keydown',e=>{if(e.key==='Enter')consultar();});
cBtn.addEventListener('click',consultar);
lBtn.addEventListener('click',limpar);
G('shareBtn').addEventListener('click',async()=>{
  const c=curCnpj||dg(cnpjInput.value);
  if(c.length!==14){sToast('Consulte um CNPJ primeiro.','warn');return;}
  (await cpTxt(shareUrl(c)))?sToast('Link copiado!','ok'):sToast('Não foi possível copiar.','warn');
});
G('pdfBtn').addEventListener('click',()=>window.print());

/* === CONSULTA EM MASSA === */
const bulkInput  = G('bulkInput');
const bulkCntBdg = G('bulkCountBadge');
const delaySlider= G('delaySlider');
const delayVal   = G('delayVal');
const bulkStart  = G('bulkStartBtn');
const bulkStop   = G('bulkStopBtn');
const bulkClear  = G('bulkClearBtn');
const bulkProg   = G('bulkProgress');
const bulkEmptyEl= G('bulkEmpty');
const progLabel  = G('progressLabel');
const progPct    = G('progressPct');
const progBar    = G('progressBar');
const psTotal    = G('ps-total');
const psPend     = G('ps-pend');
const psOk       = G('ps-ok');
const psErr      = G('ps-err');
const resBody    = G('bulkResultsBody');
const exportCsv  = G('exportCsvBtn');
const copiarTudo = G('copiarTudoBtn');
const exportLbl  = G('exportLabel');

let bulkQueue    = [];
let bulkResults  = [];
let bulkRunning  = false;
let bulkStopped  = false;
let bulkRunId    = 0;

delaySlider.addEventListener('input',()=>{ delayVal.textContent=delaySlider.value+'s'; });

const BULK_MAX = 50;
/* Separa válidos, inválidos e excedentes para que nada seja ignorado em silêncio. */
function parseBulkDetailed() {
  const raw = bulkInput.value.split('\n').map(l=>dg(l.trim())).filter(Boolean);
  const seen = new Set();
  const valid = [], invalid = [];
  raw.forEach(c => {
    if(seen.has(c)) return;
    seen.add(c);
    (c.length===14 && vCnpj(c) ? valid : invalid).push(c);
  });
  return { valid: valid.slice(0,BULK_MAX), invalid, overflow: Math.max(0, valid.length-BULK_MAX) };
}
function parseBulkInput() { return parseBulkDetailed().valid; }

bulkInput.addEventListener('input',()=>{
  const {valid,invalid,overflow}=parseBulkDetailed();
  const extra=[
    invalid.length?`${invalid.length} inválido${invalid.length!==1?'s':''}`:'',
    overflow?`${overflow} acima do limite`:''
  ].filter(Boolean).join(', ');
  bulkCntBdg.textContent=`${valid.length} CNPJ${valid.length!==1?'s':''}${extra?' · '+extra:''}`;
});

function createBulkRow(cnpj) {
  const row = document.createElement('div'); 
  row.className = 'br-row'; 
  row.id = 'brow-' + cnpj;
  row.innerHTML = `
    <div class="br-cell"><span class="br-cnpj">${fC(cnpj)}</span></div>
    <div class="br-cell" id="bname-${cnpj}"><span class="br-name" style="color:var(--text4)">—</span></div>
    <div class="br-cell" id="bie-${cnpj}"><span class="mono" style="font-size:11px;color:var(--text4)">—</span></div>
    <div class="br-cell" id="bregime-${cnpj}"><span class="br-regime" style="color:var(--text4)">—</span></div>
    <div class="br-cell" id="bsit-${cnpj}"></div>
    <div class="br-cell" id="bstatus-${cnpj}">
      <div class="br-status-wrap"><span class="br-pending">...</span></div>
    </div>`;
  return row;
}

function updateBulkRow(cnpj, state, data, errMsg) {
  const nameEl    = G('bname-'+cnpj);
  const ieEl      = G('bie-'+cnpj);
  const regimeEl  = G('bregime-'+cnpj);
  const sitEl     = G('bsit-'+cnpj);
  const statusEl2 = G('bstatus-'+cnpj);
  if(!nameEl) return;

  if(state === 'loading'){
    statusEl2.innerHTML = `<div class="br-status-wrap"><div class="spin"></div></div>`;
    return;
  }

  if(state === 'ok'){
    const est = data.estabelecimento || {};
    const sit = est.situacao_cadastral || '—';
    const reg = regime(data);
    const sc  = scls(sit);
    const ieI = ieInfo(data);
    const ieStyle = ieI.known ? '' : ';color:var(--amber-text)';
    const ieTitle = ieI.known ? '' : ' title="A API que informa a IE não respondeu nesta consulta"';

    nameEl.innerHTML   = `<span class="br-name" title="${esc(data.razao_social||'')}">${esc(data.razao_social||'—')}</span>`;
    ieEl.innerHTML     = `<span class="mono" style="font-size:11px${ieStyle}"${ieTitle}>${esc(ieI.text)}</span>`;
    regimeEl.innerHTML = `<span class="br-regime">${esc(reg.name)}</span>`;
    sitEl.innerHTML    = `<span class="br-sit ${sc}">${esc(sit)}</span>`;
    statusEl2.innerHTML = `<div class="br-status-wrap"><svg class="br-ok-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`;
    return;
  }

  if(state === 'error'){
    nameEl.innerHTML   = `<span class="br-error" title="${esc(errMsg)}">${esc(errMsg)}</span>`;
    ieEl.innerHTML     = `—`;
    sitEl.innerHTML    = ``;
    regimeEl.innerHTML = ``;
    statusEl2.innerHTML = `<div class="br-status-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:var(--red-text)"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>`;
  }
}

function updateStats() {
  const total=bulkResults.length;
  const ok=bulkResults.filter(r=>r.state==='ok').length;
  const err=bulkResults.filter(r=>r.state==='error').length;
  const pend=total-ok-err;
  const done=ok+err;
  const pct=total>0?Math.round((done/total)*100):0;
  psTotal.textContent=total; psPend.textContent=pend; psOk.textContent=ok; psErr.textContent=err;
  progPct.textContent=pct+'%';
  progBar.style.width=pct+'%';
  if(pct===100) progBar.classList.add('done'); else progBar.classList.remove('done');
  if(pend===0&&total>0){
    progLabel.textContent=`Concluído — ${ok} sucesso${ok!==1?'s':''}, ${err} erro${err!==1?'s':''}`;
    exportLbl.textContent=`${ok} empresa${ok!==1?'s':''} consultada${ok!==1?'s':''}`;
    exportCsv.disabled=ok===0; copiarTudo.disabled=ok===0;
  } else {
    progLabel.textContent=`Consultando ${done} de ${total}…`;
    exportLbl.textContent='';
    exportCsv.disabled=true; copiarTudo.disabled=true;
  }
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

const RETRY_WAIT = 21000;

async function waitRetry(cnpj) {
  const statusEl2 = G('bstatus-'+cnpj);
  const end = Date.now() + RETRY_WAIT;
  return new Promise(resolve => {
    const tick = () => {
      if(bulkStopped){ resolve(false); return; }
      const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      if(statusEl2) statusEl2.innerHTML=`<div class="br-status-wrap"><span style="font-size:11px;color:var(--amber-text)">${rem}s</span></div>`;
      progLabel.textContent = `Rate limit — aguardando ${rem}s para retry…`;
      if(rem <= 0){ resolve(true); return; }
      setTimeout(tick, 500);
    };
    tick();
  });
}

async function fetchCnpj(cnpj) {
  const res = await fetchCnpjDual(cnpj);
  if(res.retry429) return { retry: true };
  if(res.error)    return { error: res.error };
  return { data: res.data, fallback: res.fallback };
}

/* Esperas de 21s por CNPJ antes de desistir da fonte que tem IE. */
const MAX_429_RETRIES = 2;

async function runBulk() {
  const runId = ++bulkRunId;
  bulkRunning=true; bulkStopped=false;
  bulkStart.style.display='none'; bulkStop.style.display='';
  const delay=parseInt(delaySlider.value)*1000;

  for(let i=0;i<bulkQueue.length;i++){
    if(bulkStopped||runId!==bulkRunId) break;
    const cnpj=bulkQueue[i];
    const res=bulkResults.find(r=>r.cnpj===cnpj);
    if(!res||res.state!=='pending') continue;

    updateBulkRow(cnpj,'loading',null,null);
    setSt(`Consultando ${i+1}/${bulkQueue.length}`,'loading');

    let result;
    try{
      result = await fetchCnpj(cnpj);
    }catch(e){
      result = { error: 'Falha de rede' };
    }

    // O 429 vem da API que informa a IE. Esperar e repetir preserva esse campo;
    // só depois de esgotar as tentativas aceitamos a fonte sem IE.
    let tentativas = 0;
    while(result.retry && tentativas < MAX_429_RETRIES && !bulkStopped){
      tentativas++;
      const ok = await waitRetry(cnpj);
      if(!ok) break;
      updateBulkRow(cnpj,'loading',null,null);
      try{ result = await fetchCnpj(cnpj); }
      catch(e){ result = { error: 'Falha de rede' }; break; }
    }
    if(bulkStopped) break;
    if(result.retry){
      try{
        const fb = await tryCnpjaFallback(cnpj);
        result = fb.ok ? { data: fb.data, fallback: true }
                       : { error: 'Limite da API excedido. Tente novamente mais tarde.' };
      }catch(e){ result = { error: 'Limite da API excedido.' }; }
    }

    if (result.data) {
      res.state = 'ok';
      res.data = result.data;
      updateBulkRow(cnpj, 'ok', result.data, null);
    } else {
      const msg = result.error || 'Erro na API';
      res.state = 'error';
      res.error = msg;
      updateBulkRow(cnpj, 'error', null, msg);
    }

    updateStats();
    if(i<bulkQueue.length-1&&!bulkStopped) await sleep(delay);
  }

  if(runId!==bulkRunId) return;   // lote substituído ou limpo: não tocar na UI
  bulkRunning=false;
  bulkStop.style.display='none';
  if(!bulkStopped) {
    bulkStart.textContent='Nova consulta';
    bulkStart.style.display='';
    setSt('Lote concluído','active');
  } else {
    bulkStart.textContent='Retomar';
    bulkStart.style.display='';
    setSt('Pausado','');
  }
}

bulkStart.addEventListener('click',()=>{
  if(bulkRunning) return;
  if(bulkStopped&&bulkQueue.length){ runBulk(); return; }
  const {valid:cnpjs,invalid,overflow}=parseBulkDetailed();
  if(!cnpjs.length){ alert('Nenhum CNPJ válido encontrado. Verifique os dígitos verificadores.'); return; }
  if(invalid.length||overflow){
    const partes=[
      invalid.length?`${invalid.length} CNPJ(s) com dígito verificador inválido serão ignorados`:'',
      overflow?`${overflow} CNPJ(s) acima do limite de ${BULK_MAX} por lote não serão consultados`:''
    ].filter(Boolean).join('\n');
    if(!confirm(partes+`\n\nConsultar os ${cnpjs.length} CNPJ(s) válidos mesmo assim?`)) return;
  }
  bulkQueue=cnpjs;
  bulkResults=cnpjs.map(c=>({cnpj:c,state:'pending',data:null,error:null}));
  resBody.innerHTML='';
  cnpjs.forEach(c=>{ resBody.appendChild(createBulkRow(c)); });
  bulkProg.style.display='block';
  bulkEmptyEl.style.display='none';
  updateStats();
  runBulk();
});

bulkStop.addEventListener('click',()=>{
  if(!bulkRunning) return;
  bulkStopped=true;
  bulkStop.style.display='none';
  progLabel.textContent='Parando — aguarde a consulta em andamento…';
});

bulkClear.addEventListener('click',()=>{
  // Invalida o lote em andamento: o loop antigo checa este token e não
  // mexe mais na UI depois de limpar.
  bulkRunId++;
  bulkStopped=true; bulkRunning=false;
  bulkQueue=[]; bulkResults=[];
  bulkInput.value=''; bulkCntBdg.textContent='0 CNPJs';
  bulkProg.style.display='none'; bulkEmptyEl.style.display='';
  bulkStart.textContent='Iniciar consultas'; bulkStop.style.display='none'; bulkStart.style.display='';
  exportCsv.disabled=true; copiarTudo.disabled=true; exportLbl.textContent='';
  setSt('Aguardando consulta',''); bulkRunning=false; bulkStopped=false;
});

exportCsv.addEventListener('click', () => {
  const ok = bulkResults.filter(r => r.state === 'ok');
  if(!ok.length) return;
  const rows = [['CNPJ', 'Razão Social', 'Nome Fantasia', 'Inscrição Estadual', 'Situação', 'Regime', 'CNAE Principal', 'Capital Social', 'UF', 'Município', 'Telefone', 'E-mail']];
  ok.forEach(({cnpj, data}) => {
    const est = data.estabelecimento || {};
    const reg = regime(data);
    const uf = est.estado?.sigla || '';
    const ap = est.atividade_principal;
    const tel = fPh(est.ddd1, est.telefone1) || '';
    const ieVal = ieInfo(data).text;

    rows.push([
      fC(cnpj),
      data.razao_social || '',
      est.nome_fantasia || '',
      ieVal,
      est.situacao_cadastral || '',
      reg.name,
      ap ? `${fCnae(ap.id || ap.subclasse)} ${ap.descricao || ap.texto || ''}` : '',
      data.capital_social || '',
      uf,
      est.cidade?.nome || '',
      tel,
      est.email || ''
    ]);
  });
  const csv = rows.map(r => r.map(c => '"' + csvSafe(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); 
  a.href = url; 
  a.download = `cnpj_lista_${Date.now()}.csv`;
  document.body.appendChild(a); 
  a.click(); 
  document.body.removeChild(a); 
  URL.revokeObjectURL(url);
});

copiarTudo.addEventListener('click',async()=>{
  const ok=bulkResults.filter(r=>r.state==='ok');
  if(!ok.length) return;
  const txt=ok.map(({cnpj,data})=>{
    const est=data.estabelecimento||{};
    const reg=regime(data);
    const ieVal = ieInfo(data).text;
    return `${fC(cnpj)} | ${data.razao_social||'—'} | IE: ${ieVal} | ${reg.name} | ${est.situacao_cadastral||'—'}`;
  }).join('\n');
  if(await cpTxt(txt)) sToast(`${ok.length} registros copiados!`,'ok');
});

window.addEventListener('load',()=>{
  renderHist();
  // boot.js leu o ?cnpj= e removeu o parametro da URL antes do beacon carregar.
  const uc=dg(window.__initialCnpj||'');
  clrL();
  if(uc.length===14){cnpjInput.value=f14(uc);consultar();}
});
