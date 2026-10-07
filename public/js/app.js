(function(){
'use strict';
/* Configuração vinda do Laravel (resources/views/app.blade.php) */
const CFG=window.CAIOPINA||{};
const NOME=CFG.nome||'Clínica de Futebol Caio Pina';
const NOME_CURTO=CFG.nomeCurto||'Caio Pina';
const ANO=new Date().getFullYear();
const KEY='caiopina_demo_v6';
const pad=n=>String(n).padStart(2,'0');
const isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const iso=off=>{const d=new Date();d.setDate(d.getDate()+off);return isoOf(d);};
const addD=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return isoOf(d);};
const dow=s=>new Date(s+'T12:00:00').getDay();
const HOJE=iso(0);
const DIAS=['dom','seg','ter','qua','qui','sex','sáb'];
const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const fmtD=s=>{const d=new Date(s+'T12:00:00');return DIAS[d.getDay()]+', '+pad(d.getDate())+'/'+pad(d.getMonth()+1);};
const fmtNasc=s=>s.split('-').reverse().join('/');
const fmtQ=t=>new Date(t).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const semAcento=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const clone=o=>JSON.parse(JSON.stringify(o));
const iniciais=n=>{const p=n.trim().split(/\s+/);return ((p[0]||'')[0]+((p.length>1?p[p.length-1]:'')[0]||'')).toUpperCase();};
const primeiro=n=>n.trim().split(/\s+/)[0];
const senhaPadrao=n=>{const f=semAcento(primeiro(n));return f.charAt(0).toUpperCase()+f.slice(1).toLowerCase()+ANO;};
const clamp=v=>Math.min(1,Math.max(0,v));
const sel=(v,o)=>v===o?' selected':'';
const chk=b=>b?' checked':'';

/* ---------- formações e lousa ---------- */
const FORM={
 5:{'2-1-1':[2,1,1],'1-2-1':[1,2,1],'2-2':[2,2],'3-1':[3,1]},
 6:{'2-2-1':[2,2,1],'3-1-1':[3,1,1],'2-1-2':[2,1,2]},
 7:{'2-3-1':[2,3,1],'3-2-1':[3,2,1],'3-1-2':[3,1,2],'2-2-2':[2,2,2]},
 8:{'3-3-1':[3,3,1],'3-2-2':[3,2,2],'2-4-1':[2,4,1]},
 9:{'3-3-2':[3,3,2],'3-4-1':[3,4,1],'4-3-1':[4,3,1]},
 10:{'4-3-2':[4,3,2],'3-4-2':[3,4,2],'4-4-1':[4,4,1]},
 11:{'4-4-2':[4,4,2],'4-3-3':[4,3,3],'3-5-2':[3,5,2],'4-2-3-1':[4,2,3,1],'5-3-2':[5,3,2]}
};
const fPad=n=>Object.keys(FORM[n])[0];
function formar(lin){const ps=[{x:.05,y:.5}];lin.forEach((c,li)=>{const x=lin.length>1?.17+li*(.3/(lin.length-1)):.3;for(let j=0;j<c;j++)ps.push({x,y:.1+.8*(j+1)/(c+1)});});return ps;}
const POSICOES=[['GOL','Goleiro'],['LD','Lateral direito'],['ZAG','Zagueiro'],['LE','Lateral esquerdo'],['VOL','Volante'],['MC','Meio-campo'],['MEI','Meia'],['PD','Ponta direita'],['CA','Centroavante'],['PE','Ponta esquerda']];
const POSN=Object.fromEntries(POSICOES);
const ORD={GOL:0,LD:1,ZAG:1,LE:1,VOL:2,MC:3,MEI:3,PD:4,PE:4,CA:4};
const LADO={LE:0,PE:0,LD:2,PD:2};
const posTxt=a=>a&&a.pos&&a.pos.length?a.pos[0]+(a.pos.length>1?' ('+a.pos.slice(1).join(', ')+')':''):'';
const ordenar=l=>l.slice().sort((a,b)=>(ORD[a.pos[0]]??3)-(ORD[b.pos[0]]??3));
// Ordem das listas de jogadores (posição principal; empate pelo nome). O posicionamento no campo usa ordenar(), por setor.
const ORDEM_POS=['GOL','LD','ZAG','LE','VOL','MC','MEI','PD','CA','PE'];
const rankPos=a=>{const i=ORDEM_POS.indexOf(a&&a.pos&&a.pos[0]);return i<0?ORDEM_POS.length:i;};
const porPosicao=l=>l.slice().sort((a,b)=>rankPos(a)-rankPos(b)||String(a.nome).localeCompare(String(b.nome)));
const escalar=l=>{const o=ordenar(l),g=o.filter(a=>a.pos[0]==='GOL'),resto=o.filter(a=>!g.includes(a));return g.length?[g[0],...resto,...g.slice(1)]:o;};
const TAGS=['Saída de bola','Ataque','Defesa','Bola parada','Transição','Aquecimento'];
const CORES=[['#C0392B','Vermelho'],['#2F6FD6','Azul'],['#E8E6DF','Branco'],['#2E9E5B','Verde'],['#8E44AD','Roxo']];
function montarLousa(lista,catId,n,fa,fb){
  fa=fa&&FORM[n][fa]?fa:fPad(n);fb=fb&&FORM[n][fb]?fb:fPad(n);
  const pa=formar(FORM[n][fa]),pb=formar(FORM[n][fb]),el=escalar(lista);
  const casa=pa.map((p,i)=>{const a=el[i];return {aid:a?a.id:null,num:a?(a.num!=null?a.num:''):i+1,nome:a?primeiro(a.nome):'Avulso',x:p.x,y:p.y};});
  const porId=Object.fromEntries(lista.map(a=>[a.id,a])),grupos={};
  pa.forEach((p,i)=>{if(i===0)return;(grupos[p.x]=grupos[p.x]||[]).push(i);});
  Object.values(grupos).forEach(ix=>{ix.sort((x,y)=>pa[x].y-pa[y].y);const pl=ix.map(i=>casa[i]);
    const lado=c=>{const a=c.aid&&porId[c.aid];return a?(LADO[a.pos[0]]??1):1;};
    pl.sort((x,y)=>lado(x)-lado(y));ix.forEach((i,k)=>{const c=pl[k];casa[i]=Object.assign({},c,{x:pa[i].x,y:pa[i].y});});});
  const fora=pb.map((p,i)=>({num:i+1,nome:'',x:1-p.x,y:p.y}));
  return {id:null,cat:catId,nome:'',desc:'',tag:TAGS[0],n,fa,fb,campo:'inteiro',mostrarAdv:true,mostrarNomes:true,casa,fora,bola:{x:.5,y:.5},itens:[],quadros:[],qAtual:null,ferramenta:'mover',sel:null,benchSel:null,advNome:'Adversário',advCor:'#C0392B',vel:1,loop:false,undo:[],redo:[]};
}
const snapL=L=>clone({casa:L.casa,fora:L.fora,bola:L.bola,itens:L.itens});

/* ---------- dados de demonstração ---------- */
function seed(){
  const cats=[];for(let N=7;N<=18;N++)cats.push({id:'sub'+N,nome:'Sub-'+N,ini:ANO-N,fim:ANO-N});
  const Y=(N,md)=>(ANO-N)+'-'+md;
  let i=0;
  const A=(id,nome,nasc,pos,num,cat,resp,base,trocada)=>{i++;return {id,nome,nasc,pos,num,cat,resp,cel:'(18) 99'+String(100000+i*37).slice(-3)+'-'+String(1000+i*53).slice(-4),login:semAcento(nome).toLowerCase().replace(/\s+/g,'.'),senhaTrocada:trocada!==false,foto:null,presBase:base,promovido:false,hist:[]};};
  const alunos=[
    A('a1','João Silva',Y(11,'03-14'),['MEI','PD'],10,'sub11','Ana Silva',10),
    A('a2','Pedro Lima',Y(11,'08-02'),['CA'],9,'sub11','Carlos Lima',7),
    A('a3','Lucas Rocha',Y(11,'11-21'),['GOL'],1,'sub11','Marta Rocha',6,false),
    A('a4','Enzo Costa',Y(11,'05-09'),['ZAG'],4,'sub11','Paulo Costa',9),
    A('a5','Miguel Alves',Y(11,'12-01'),['LE','ZAG'],3,'sub11','Sônia Alves',6),
    A('a6','Davi Souza',Y(11,'01-30'),['VOL','MC'],null,'sub11','Júlia Souza',4,false),
    A('a7','Arthur Melo',Y(11,'07-17'),['MC','MEI'],7,'sub11','Renata Melo',8),
    A('a8','Gabriel Nunes',Y(11,'04-11'),['PE','CA'],11,'sub11','Tiago Nunes',5),
    A('a9','Theo Ramos',Y(11,'09-03'),['VOL'],5,'sub11','Clara Ramos',3),
    A('a10','Bernardo Reis',Y(11,'06-25'),['LD'],2,'sub11','Fábio Reis',4),
    A('b1','Rafael Dias',Y(13,'02-10'),['CA'],9,'sub13','Mário Dias',14),
    A('b2','Bruno Teixeira',Y(13,'06-22'),['GOL'],1,'sub13','Lúcia Teixeira',16),
    A('c1','Heitor Lopes',Y(9,'05-19'),['MEI'],8,'sub9','Vera Lopes',3),
    A('c2','Samuel Prado',Y(7,'10-02'),['PD'],null,'sub7','Irene Prado',2),
    A('d1','Vitor Campos',Y(15,'01-12'),['ZAG'],3,'sub15','Rui Campos',20),
    A('d2','Caio Martins',Y(17,'08-30'),['MC'],8,'sub17','Nádia Martins',31)
  ];
  {/* completa 25 alunos por categoria */
    const NOMES=['Lucas','Gabriel','Matheus','Pedro','Guilherme','Rafael','Felipe','Gustavo','Enzo','Davi','Arthur','Heitor','Bernardo','Samuel','Lorenzo','Benjamin','Theo','Miguel','Murilo','Vinícius','Leonardo','Henrique','Caio','Otávio','Nicolas','Bryan','Joaquim','Isaac','Bento','Emanuel','Vicente','Anthony','Ryan','Kauã','Yuri','Diego','Igor','Thiago','Daniel','Eduardo','João','Cauã','Breno','Renan','Luan','Erick','Kevin','Wesley','Augusto','Raul'];
    const SOBR=['Silva','Santos','Oliveira','Souza','Pereira','Costa','Rodrigues','Almeida','Nascimento','Lima','Araújo','Fernandes','Carvalho','Gomes','Martins','Rocha','Ribeiro','Alves','Monteiro','Mendes','Barros','Freitas','Barbosa','Pinto','Moura','Cavalcanti','Dias','Castro','Campos','Cardoso','Teixeira','Vieira','Ramos','Nunes','Moreira','Correia','Duarte','Machado','Lopes','Batista','Prado','Reis','Fonseca','Siqueira','Tavares'];
    const RESP=['Ana','Maria','Juliana','Patrícia','Fernanda','Camila','Aline','Renata','Carla','Simone','Luciana','Daniela','Adriana','Cláudia','Tatiane','Paula','Roberto','Marcos','André','Fábio','Sérgio','Rodrigo'];
    const POSG=[['GOL'],['ZAG'],['LD'],['LE'],['VOL'],['MC'],['MEI'],['PD'],['PE'],['CA'],['GOL'],['ZAG','LE'],['LD','PD'],['VOL','MC'],['MEI','MC'],['PE','PD'],['CA','PE'],['ZAG'],['GOL'],['MC','VOL'],['MEI'],['CA'],['PD','PE'],['LE'],['ZAG','VOL']];
    let r=20260923;const rnd=()=>(r=(r*1103515245+12345)%2147483648)/2147483648,pick=a=>a[Math.floor(rnd()*a.length)];
    const nomesUsados=new Set(alunos.map(a=>a.nome)),logins=new Set(alunos.map(a=>a.login));
    for(let N=7;N<=18;N++){
      const id='sub'+N,ja=alunos.filter(a=>a.cat===id),nums=new Set(ja.map(a=>a.num).filter(x=>x!=null));
      for(let k=ja.length;k<25;k++){
        let nome;do{nome=pick(NOMES)+' '+pick(SOBR);}while(nomesUsados.has(nome));nomesUsados.add(nome);
        let num=1;while(nums.has(num))num++;nums.add(num);
        const mm=pad(1+Math.floor(rnd()*12)),dd=pad(1+Math.floor(rnd()*28));
        const a=A(id+'_'+k,nome,Y(N,mm+'-'+dd),POSG[k%POSG.length],k%11===7?null:num,id,pick(RESP)+' '+nome.split(' ')[1],Math.floor(rnd()*(N>=13?34:26)),k%12!==5);
        let lg=a.login,c=2;while(logins.has(lg))lg=a.login+(c++);a.login=lg;logins.add(lg);
        alunos.push(a);
      }
    }
  }
  const E=o=>Object.assign({id:uid(),cat:'sub11',grupo:'treino',sub:'Tático',titulo:'',data:HOJE,hora:'17:00',fim:'18:30',chegada:'',local:'Campo 2',adv:'',mando:'casa',uniforme:'',levar:[],plano:null,cancelado:false,motivo:'',convocados:[],conf:{},chamada:{},encerrado:false,placar:null,part:[],conta:true,minutos:{},stats:null,obs:'',serie:null},o);
  const sub11=alunos.filter(a=>a.cat==='sub11');
  const L=montarLousa(sub11,'sub11',7,'2-3-1','3-2-1');
  L.id='l1';L.nome='Saída de bola contra marcação alta';L.tag='Saída de bola';L.advNome='EC Vila Nova';
  L.desc='O goleiro abre com o zagueiro do lado da bola. O volante recua entre os zagueiros e o meia do mesmo lado vem por dentro para receber de frente.';
  L.bola={x:.08,y:.5};const q1=snapL(L);
  L.casa[1].x+=.03;L.casa[1].y-=.06;L.casa[3].x-=.06;L.bola={x:L.casa[1].x+.02,y:L.casa[1].y+.03};L.itens=[{id:uid(),tipo:'seta',estilo:'passe',x1:.07,y1:.5,x2:L.casa[1].x,y2:L.casa[1].y}];const q2=snapL(L);
  L.casa[4].x-=.08;L.casa[4].y-=.12;L.bola={x:L.casa[4].x+.02,y:L.casa[4].y+.03};L.itens=[{id:uid(),tipo:'seta',estilo:'passe',x1:L.casa[1].x,y1:L.casa[1].y,x2:L.casa[4].x,y2:L.casa[4].y},{id:uid(),tipo:'seta',estilo:'movimento',x1:L.casa[6].x,y1:L.casa[6].y,x2:L.casa[6].x+.1,y2:L.casa[6].y-.12},{id:uid(),tipo:'zona',x:.3,y:.1,w:.15,h:.3}];const q3=snapL(L);
  L.quadros=[q1,q2,q3];Object.assign(L,clone(q1));L.undo=[];L.redo=[];
  const plano={objetivo:'Sair jogando pelo chão sob pressão do adversário',atividades:[{nome:'Aquecimento com bola',min:15,lousa:''},{nome:'Rondo 5 contra 2',min:20,lousa:''},{nome:'Saída de bola 2-3-1 contra 4 pressionando',min:30,lousa:'l1'},{nome:'Coletivo condicionado',min:25,lousa:''}]};
  const statsE1={a:{chutes:11,noGol:6,escanteios:5,faltas:4,amarelos:1,vermelhos:0},b:{chutes:6,noGol:2,escanteios:2,faltas:7,amarelos:1,vermelhos:0}};
  const statsE2={a:{chutes:9,noGol:5,escanteios:3,faltas:5,amarelos:0,vermelhos:0},b:{chutes:5,noGol:3,escanteios:1,faltas:6,amarelos:0,vermelhos:0}};
  const eventos=[
    E({id:'e1',grupo:'jogo',sub:'Amistoso',titulo:'Amistoso',data:iso(-4),hora:'09:00',fim:'10:30',chegada:'08:30',local:'Estádio Municipal',adv:'EC Rival',uniforme:'Camisa amarela, meião preto',encerrado:true,placar:{a:3,b:1},part:['a1','a2','a3','a4','a5','a7','a8','a6'],convocados:['a1','a2','a3','a4','a5','a7','a8','a6','a9'],stats:statsE1,minutos:{a1:40,a2:40,a3:40,a4:40,a5:40,a7:29,a6:11,a8:40},obs:'Boa pressão pós-perda no 1º tempo. Precisamos melhorar a recomposição pelo lado esquerdo.'}),
    E({id:'e2',grupo:'jogo',sub:'Competição',titulo:'Copa Regional',data:iso(-11),hora:'10:00',fim:'11:30',chegada:'09:15',local:'Campo do Juventus',adv:'AA Juventus',mando:'fora',uniforme:'Camisa preta',encerrado:true,placar:{a:2,b:0},part:['a1','a2','a3','a4','a5','a8','a9'],stats:statsE2,minutos:{a1:40,a2:40,a3:40,a4:40,a5:40,a8:40,a9:40},obs:'Jogo sólido defensivamente. Lucas decisivo no pênalti.'}),
    E({id:'t1',titulo:'Transição defensiva',sub:'Defesa',data:iso(-2),chamada:{a1:'P',a2:'P',a3:'F',a4:'P',a5:'P',a6:'J',a7:'P',a8:'P',a9:'P',a10:'F'}}),
    E({id:'t2',titulo:'Resistência com bola',sub:'Físico',data:iso(-7),chamada:{a1:'P',a2:'P',a3:'P',a4:'P',a5:'F',a6:'P',a7:'P',a8:'F',a9:'P',a10:'P'}}),
    E({id:'t3',titulo:'Saída de bola e marcação',sub:'Tático',data:HOJE,plano,levar:['Chuteira','Caneleira','Garrafa de água'],conf:{a1:'vai',a2:'vai',a4:'vai',a6:'nao'}}),
    E({id:'t4',titulo:'Coletivo 7 x 7',sub:'Coletivo',data:iso(1),levar:['Chuteira','Caneleira','Garrafa de água'],conf:{a1:'vai',a2:'vai',a3:'vai',a4:'vai',a5:'vai',a7:'vai',a8:'vai',a9:'vai',a10:'vai',a6:'nao'}}),
    E({titulo:'Treino físico',sub:'Físico',data:iso(2),cancelado:true,motivo:'Campo alagado pela chuva.'}),
    E({id:'e6',grupo:'jogo',sub:'Amistoso',titulo:'Amistoso',data:iso(4),hora:'09:00',fim:'10:30',chegada:'08:15',local:'Campo do Vila Nova',adv:'EC Vila Nova',mando:'fora',uniforme:'Camisa amarela, meião preto',levar:['Chuteira','Caneleira','Garrafa de água','Documento com foto'],convocados:['a1','a2','a3','a4','a5','a7','a8','a6','a10']}),
    E({titulo:'Finalização',sub:'Ataque',data:iso(7),serie:'s1'}),E({titulo:'Finalização',sub:'Ataque',data:iso(14),serie:'s1'}),
    E({cat:'sub13',titulo:'Finalização',sub:'Ataque',data:iso(3),hora:'18:30',fim:'20:00',local:'Campo 1'}),
    E({cat:'sub9',titulo:'Coordenação com bola',sub:'Físico',data:iso(2),hora:'16:00',fim:'17:00',local:'Campo 3'})
  ];
  const Lc=(ev,time,tipo,aluno,min,x)=>Object.assign({id:uid(),ev,time,tipo,aluno,assist:null,detalhe:'normal',min},x||{});
  const lances=[
    Lc('e1','a','gol','a2',"3'",{assist:'a1'}),Lc('e1','b','gol',null,"8'"),Lc('e1','a','gol','a1',"11'",{detalhe:'falta'}),Lc('e1','a','amarelo','a4',"16'"),
    Lc('e1','a','gol','a1',"15'",{assist:'a7'}),Lc('e1','a','sub',null,"30'",{sai:'a7',entra:'a6'}),Lc('e1','a','defesa','a3',"34'"),
    Lc('e2','a','gol','a2',"5'"),Lc('e2','a','penalti_defendido','a3',"25'"),Lc('e2','a','gol','a8',"33'",{detalhe:'cabeca',assist:'a1'})
  ];
  const dicas=[
    {id:uid(),aluno:'a1',tipo:'Técnica',texto:'Levanta a cabeça antes de receber a bola. Você já enxerga o passe, só precisa decidir mais rápido.',quando:Date.now()-86400000,lida:false,entendida:false,fixada:true,ev:null,lousa:null},
    {id:uid(),aluno:'a3',tipo:'Elogio',texto:'Que defesa no pênalti! Sua leitura do batedor foi perfeita. Continue estudando o corpo de quem chuta.',quando:Date.now()-9*86400000,lida:true,entendida:true,fixada:true,ev:'e2',lousa:null},
    {id:uid(),aluno:'a1',tipo:'Tática',texto:'Na saída de bola, venha por dentro para receber de frente, como na jogada que montei.',quando:Date.now()-3*86400000,lida:true,entendida:false,fixada:false,ev:null,lousa:'l1'}
  ];
  const metas=[
    {id:uid(),aluno:'a1',texto:'Dar 3 assistências nos próximos 4 jogos',prazo:iso(30),status:'andamento',quando:Date.now()-2*86400000},
    {id:uid(),aluno:'a3',texto:'Sair do gol com os pés em pelo menos 5 lances por jogo',prazo:iso(21),status:'andamento',quando:Date.now()-5*86400000}
  ];
  const notifs=[
    {id:uid(),para:'cat:sub11',texto:'Treino físico de '+fmtD(iso(2))+' foi cancelado. Motivo: campo alagado pela chuva.',quando:Date.now()-3600000},
    {id:uid(),para:'a1',texto:'Você foi convocado para o amistoso contra EC Vila Nova ('+fmtD(iso(4))+').',quando:Date.now()-7200000},
    {id:uid(),para:'a1',texto:'Nova dica do professor (Técnica).',quando:Date.now()-86400000}
  ];
  return {v:3,cats,alunos,eventos,lances,dicas,metas,notifs,lousas:[L],lidos:{},live:null};
}
function load(){try{const r=localStorage.getItem(KEY);return r?JSON.parse(r):null;}catch(e){return null;}}
function save(){try{localStorage.setItem('cp_ultesc',JSON.stringify(S.ultEsc||{}));}catch(e){}}
let S=vazio();
if(S.live)S.live.rodando=false;
if(!S.ultEsc)S.ultEsc={};

const ui={posSel:[],role:'professor',tela:{dono:'inicio',professor:'inicio',aluno:'inicio'},fx:null,estadio:false,descConfirm:false,lastKey:'',cqDestaque:[],cat:'sub11',catProf:'sub11',alunoAtual:'a1',modal:null,toast:null,liveSetup:null,lousa:null,vl:null,fotoTmp:null,delConfirm:null,
  ag:{view:'lista',tipo:'todos',mes:HOJE.slice(0,7),dia:null,semana:0},agA:{view:'lista',mes:HOJE.slice(0,7),dia:null},
  dAba:'enviar',dDraft:{modo:'um',alunos:[],cat:'sub11',tipo:'Técnica',texto:'',ev:'',lousa:'',fixar:false},dFiltro:{aluno:'',tipo:''}};

/* ---------- domínio ---------- */
const al=id=>S.alunos.find(a=>a.id===id)||null;
const ev=id=>S.eventos.find(e=>e.id===id)||null;
const cat=id=>S.cats.find(c=>c.id===id)||null;
const catNome=id=>{const c=cat(id);return c?c.nome:'';};
const nomeDe=id=>{const a=al(id);if(a)return a.nome;const j=S.live&&S.live.nomes&&S.live.nomes[id];return j?j.nome:'Aluno';};
const pNome=id=>primeiro(nomeDe(id));
function catPorAno(y,shift){return S.cats.find(c=>y>=c.ini+shift&&y<=c.fim+shift)||null;}
const alunosCat=c=>S.alunos.filter(a=>a.cat===c).sort((x,y)=>x.nome.localeCompare(y.nome));
function notif(para,texto){S.notifs.push({id:uid(),para,texto,quando:Date.now()});}
const notifsAluno=a=>S.notifs.filter(n=>n.para===a.id||n.para==='cat:'+a.cat).sort((x,y)=>y.quando-x.quando);
const naoLidas=a=>ui.naoLidas||0;
function toast(t){ui.toast=t;render();clearTimeout(toast._t);toast._t=setTimeout(()=>{ui.toast=null;const el=document.querySelector('.toast');if(el)el.remove();},3000);}
const lousa=id=>S.lousas.find(l=>l.id===id)||null;
const temConv=e=>e.grupo==='jogo'||e.sub==='Coletivo';
const convocadosDe=e=>e.grupo==='jogo'?e.convocados:Object.keys(e.conf).filter(id=>e.conf[id]==='vai'&&al(id));
const evTitulo=e=>e.grupo==='jogo'?(e.mando==='fora'?e.adv+' x '+NOME_CURTO:NOME_CURTO+' x '+e.adv):e.titulo;

const DEF=['GOL','ZAG','LD','LE','VOL'];
function stats(id){
  const a=al(id),evs=S.eventos.filter(e=>e.encerrado&&e.conta),ids=new Set(evs.map(e=>e.id));
  const s={jogos:0,gols:0,faltas:0,assist:0,penDef:0,cleans:0,minutos:0,treinos:a.presBase,faltasTreino:0,promovido:a.promovido,amarelos:0};
  evs.forEach(e=>{if(e.part.includes(id)){s.jogos++;s.minutos+=(e.minutos&&e.minutos[id])||0;if(e.grupo==='jogo'&&e.placar&&e.placar.b===0&&a.pos.some(p=>DEF.includes(p)))s.cleans++;}});
  S.lances.forEach(l=>{if(!ids.has(l.ev))return;
    if(l.tipo==='gol'&&l.aluno===id){s.gols++;if(l.detalhe==='falta')s.faltas++;}
    if(l.tipo==='gol'&&l.assist===id)s.assist++;
    if(l.tipo==='penalti_defendido'&&l.aluno===id)s.penDef++;
    if(l.tipo==='amarelo'&&l.aluno===id)s.amarelos++;});
  S.eventos.forEach(e=>{if(e.grupo==='treino'&&!e.cancelado){if(e.chamada[id]==='P')s.treinos++;if(e.chamada[id]==='F')s.faltasTreino++;}});
  return s;
}
const CQ=[
  {id:'g1',nome:'Primeiro gol',pos:'Todas',ok:s=>s.gols>=1,ic:'ball'},
  {id:'g10',nome:'Artilheiro 10',pos:'Todas',ok:s=>s.gols>=10,ic:'ball'},
  {id:'falta',nome:'Gol de falta',pos:'Todas',ok:s=>s.faltas>=1,ic:'curve'},
  {id:'a1',nome:'Primeira assistência',pos:'Meio e ataque',ok:s=>s.assist>=1,ic:'pass'},
  {id:'a5',nome:'Garçom 5',pos:'Meio e ataque',ok:s=>s.assist>=5,ic:'pass'},
  {id:'cs',nome:'Jogo sem sofrer gol',pos:'Goleiro e defesa',ok:s=>s.cleans>=1,ic:'shield'},
  {id:'pd',nome:'Pênalti defendido',pos:'Goleiro',ok:s=>s.penDef>=1,ic:'glove'},
  {id:'m300',nome:'300 minutos em campo',pos:'Todas',ok:s=>s.minutos>=300,ic:'clock'},
  {id:'t10',nome:'10 treinos',pos:'Todas',ok:s=>s.treinos>=10,ic:'cal'},
  {id:'t25',nome:'25 treinos',pos:'Todas',ok:s=>s.treinos>=25,ic:'cal'},
  {id:'promo',nome:'Promovido',pos:'Todas',ok:s=>s.promovido,ic:'up'}
];
const cqAluno=id=>{const c=ui.cartas[id];if(c)return c.cq.filter(x=>x.liberada).map(x=>x.codigo);stats(id);return [];};
const tier=s=>s.treinos>=25?{n:'Carta ouro',c:'#F7C600'}:s.treinos>=10?{n:'Carta prata',c:'#C9CCD1'}:{n:'Carta bronze',c:'#C98A4B'};

/* ---------- ícones ---------- */
const sv=(p,sz,x)=>`<svg width="${sz||20}" height="${sz||20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${x||''}>${p}</svg>`;
const IC={
  bell:sv('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
  plus:sv('<path d="M12 5v14M5 12h14"/>',18),
  ball:sv('<circle cx="12" cy="12" r="9"/><path d="M12 7l3 2.5-1 3.5h-4l-1-3.5z"/>',24),
  curve:sv('<path d="M4 18c4-8 10-12 16-12"/><path d="M16 4l4 2-2 4"/>',24),
  pass:sv('<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',24),
  shield:sv('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',24),
  glove:sv('<path d="M7 11V6a2 2 0 0 1 4 0v5M11 10V4a2 2 0 0 1 4 0v6M15 10V6a2 2 0 0 1 4 0v8a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2-4a2 2 0 0 1 3.4-2L9 14"/>',24),
  cal:sv('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18"/><path d="M8 14l2.5 2.5L16 12"/>',24),
  clock:sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',24),
  up:sv('<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',24),
  lock:sv('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',24),
  pin:sv('<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',15),
  msg:sv('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',18),
  play:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>',
  pause:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  x:sv('<path d="M6 6l12 12M18 6L6 18"/>',16),
  undo:sv('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',18),
  redo:sv('<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',18),
  sub:sv('<path d="M7 4v14M3 8l4-4 4 4"/><path d="M17 20V6M13 16l4 4 4-4"/>',18),
  target:sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',18),
  move:sv('<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>',20),
  pen:sv('<path d="M3 17c3-6 6 2 9-4s5-5 9-3"/>',20),
  zona:sv('<rect x="4" y="6" width="16" height="12" rx="2" stroke-dasharray="3 3"/>',20),
  cone:sv('<path d="M12 3l6 16H6z"/><path d="M4 21h16"/>',20),
  eraser:sv('<path d="M20 20H9L4 15l10-10 7 7-6 6"/>',20),
  copy:sv('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',16),
  edit:sv('<path d="M4 20h4L20 8l-4-4L4 16z"/>',16),
  home:sv('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'),
  users:sv('<circle cx="9" cy="8" r="4"/><path d="M2 21c1-4 4-6 7-6s6 2 7 6"/><path d="M16 4a4 4 0 0 1 0 8M22 21c-.6-2.6-2-4.4-4-5.3"/>'),
  live:sv('<circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"/>',24),
  card:sv('<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/>'),
  bolt:sv('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',24),
  recdot:'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="currentColor"/></svg>',
  stopsq:'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
  hand:sv('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V13M17 9.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.3 15.4a1.6 1.6 0 0 1 2.4-2.1L8 15"/>',20),
  zin:sv('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>',20),
  zout:sv('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>',20),
  fit:sv('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><rect x="8" y="8" width="8" height="8" rx="1"/>',20),
  reset:sv('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',20),
  expand:sv('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',20),
  field:sv('<rect x="2" y="5" width="20" height="14" rx="1"/><path d="M12 5v14"/><circle cx="12" cy="12" r="3"/>',18)
};
// Logo da escolinha (public/logo.png, gerada a partir da arte original)
const ESC=sz=>`<img src="/logo.png?v=2" width="${sz}" height="${sz}" alt="" aria-hidden="true" style="display:block;flex:none">`;
const avatar=(a,sz)=>a&&a.foto?`<img class="av" src="${a.foto}" alt="" style="width:${sz}px;height:${sz}px">`:`<span class="av" style="width:${sz}px;height:${sz}px;font-size:${Math.round(sz*.38)}px">${esc(a?iniciais(a.nome):'?')}</span>`;
const catOpts=selId=>S.cats.map(c=>`<option value="${c.id}"${sel(c.id,selId)}>${c.nome} (${c.ini})</option>`).join('');
const alunoOpts=(selId,apenasCat)=>S.cats.filter(c=>!apenasCat||c.id===apenasCat).map(c=>{const l=alunosCat(c.id);return l.length?`<optgroup label="${c.nome}">${l.map(a=>`<option value="${a.id}"${sel(a.id,selId)}>${esc(a.nome)}</option>`).join('')}</optgroup>`:'';}).join('');

/* ---------- casca ---------- */
function header(){
  const roles=[['dono','Dono'],['professor','Professor'],['aluno','Aluno / família']];
  let extra='';
  if(ui.role==='aluno'){const a=al(ui.alunoAtual),n=a?naoLidas(a):0;
    extra=`<label class="sr" for="selAluno">Aluno</label><select id="selAluno" class="inp sm" data-ch="aluno">${alunoOpts(ui.alunoAtual)}</select><span class="uname">@${esc(a.login)}</span><button type="button" class="bell" data-a="tab" data-v="avisos" aria-label="Avisos${n?', '+n+' novos':''}">${IC.bell}${n?`<span class="dot">${n}</span>`:''}</button>`;}
  const live=S.live&&ui.role==='professor'&&ui.tela.professor!=='aovivo'?`<button type="button" class="btn y sm" data-a="tab" data-v="aovivo">Partida em andamento</button>`:'';
  return `<header class="top"><div class="brand">${ESC(44)}<div><b>${esc(NOME_CURTO)}</b><small>Clínica de Futebol</small></div></div><div class="demo">${live}<span class="mut sm">Ver como</span><div class="seg" role="group" aria-label="Perfil">${roles.map(r=>`<button type="button" data-a="role" data-v="${r[0]}" aria-pressed="${ui.role===r[0]}">${r[1]}</button>`).join('')}</div>${extra}</div></header>`;
}
function navItems(){
  const a=al(ui.alunoAtual),nd=a?S.dicas.filter(d=>d.aluno===a.id&&!d.lida).length:0,na=a?naoLidas(a):0;
  return {
    dono:[['inicio','Início','Início',IC.home],['alunos','Alunos','Alunos',IC.users],['promocoes','Promoções','Promoções',IC.up]],
    professor:[['inicio','Início','Início',IC.home],['agenda','Agenda','Agenda',IC.cal],['aovivo','Jogo ao vivo','Ao vivo',IC.live,S.live?'●':''],['lousa','Lousa tática','Lousa',IC.field],['dicas','Dicas e metas','Dicas',IC.msg]],
    aluno:[['inicio','Início','Início',IC.home],['carta','Minha carta','Carta',IC.card],['agenda','Agenda','Agenda',IC.cal],['jogadas','Jogadas','Jogadas',IC.field],['dicas','Dicas e metas','Dicas',IC.msg,nd||''],['avisos','Avisos','Avisos',IC.bell,na||'','desk']]
  }[ui.role];
}
function telaAtual(){let cur=ui.tela[ui.role];if(cur==='novo')cur='alunos';return cur;}
function tabs(){const cur=telaAtual();return `<nav class="tabs" aria-label="Seções">${navItems().map(x=>`<button type="button" data-a="tab" data-v="${x[0]}"${cur===x[0]?' aria-current="page"':''}>${x[1]}${x[4]?` (${x[4]})`:''}</button>`).join('')}</nav>`;}
function bnav(){const cur=telaAtual(),it=navItems().filter(x=>x[5]!=='desk');return `<nav class="bnav" aria-label="Navegação" style="--n:${it.length}">${it.map(x=>`<button type="button" data-a="tab" data-v="${x[0]}"${cur===x[0]?' aria-current="page"':''}>${x[3]}<span>${x[2]}</span>${x[4]?`<span class="dot">${x[4]}</span>`:''}</button>`).join('')}</nav>`;}
let wl=null;
function wake(on){try{if(on&&!wl&&navigator.wakeLock)navigator.wakeLock.request('screen').then(x=>{wl=x;}).catch(()=>{});if(!on&&wl){wl.release().catch(()=>{});wl=null;}}catch(e){}}
function vibrar(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
const novasCq=id=>{const c=ui.cartas[id];return c?c.cq.filter(x=>x.nova).map(x=>x.codigo):[];};
function vFx(){
  const f=ui.fx;if(!f)return '';
  const cores=['#F7C600','#FFFFFF','#F7C600','#0A0A08','#FFD83D'];
  const conf=[...Array(34)].map(()=>`<span class="cf" style="left:${(Math.random()*100).toFixed(1)}%;background:${cores[Math.floor(Math.random()*cores.length)]};animation-duration:${(1.6+Math.random()*1.8).toFixed(2)}s;animation-delay:${(Math.random()*.5).toFixed(2)}s"></span>`).join('');
  if(f.tipo==='gol')return `<div class="fx" role="status" data-a="fxFechar">${conf}<div class="gol">GOL!</div><div class="sub">${esc(f.texto)}</div><div class="sub" style="font-family:var(--fd);font-size:48px">${esc(f.placar)}</div></div>`;
  const cs=f.ids.map(id=>CQ.find(c=>c.id===id)).filter(Boolean);if(!cs.length)return '';
  return `<div class="fx" role="dialog" aria-modal="true" aria-label="Conquista desbloqueada" data-a="fxFechar">${conf}<div class="ico">${IC[cs[0].ic]}</div><div class="sub" style="color:var(--y);font-size:14px;letter-spacing:.14em">CONQUISTA DESBLOQUEADA</div><div class="gol" style="font-size:clamp(40px,9vw,76px)">${cs.map(c=>esc(c.nome)).join(' + ')}</div>${cs[0].pos!=='Todas'?`<div class="sub mut" style="font-size:15px">Valoriza: ${esc(cs[0].pos)}</div>`:''}<button type="button" class="btn y big" data-a="fxFechar" style="position:relative">Continuar</button></div>`;
}
const chipsCat=(key,s)=>`<div class="catbar" role="group" aria-label="Categoria">${S.cats.map(c=>{const n=alunosCat(c.id).length;return `<button type="button" class="catchip${n?'':' vazio'}" data-a="${key}" data-v="${c.id}" aria-pressed="${s===c.id}"><b>${c.nome}</b><span>${c.ini} · ${n} ${n===1?'aluno':'alunos'}</span></button>`;}).join('')}</div>`;

function renderLocal(){
  if(!al(ui.alunoAtual)&&S.alunos.length)ui.alunoAtual=S.alunos[0].id;
  const r=ui.role,t=ui.tela[r];let body='';
  if(r==='dono')body=t==='inicio'?vInicioDono():t==='novo'?vNovo():t==='promocoes'?vPromo():vAlunos();
  if(r==='professor')body=t==='inicio'?vInicioProf():t==='aovivo'?vAoVivo():t==='lousa'?vLousa():t==='dicas'?vDicasProf():vAgenda(false);
  if(r==='aluno')body=t==='inicio'?vInicioAluno():t==='agenda'?vAgenda(true):t==='jogadas'?vJogadas():t==='dicas'?vDicasAluno():t==='avisos'?vAvisos():vCarta();
  if(r==='aluno'&&(t==='inicio'||t==='carta')&&!ui.modal&&!ui.fx){const n=novasCq(ui.alunoAtual);if(n.length){ui.fx={tipo:'cq',aluno:ui.alunoAtual,ids:n};vibrar([60,40,140]);}}
  const key=r+'|'+t,anim=key!==ui.lastKey;ui.lastKey=key;
  document.body.classList.toggle('estadio',!!(ui.estadio&&r==='professor'&&t==='aovivo'&&S.live));
  document.getElementById('app').innerHTML=header()+tabs()+`<main class="wrap${anim?' enter':''}" id="main">${body}</main><div class="foot"><button type="button" data-a="logout">Sair da conta</button></div>`+bnav()+(fullAtivo()?vLousaFull():'')+vModal()+vFx()+(ui.toast?`<div class="toast" role="status">${esc(ui.toast)}</div>`:'');
  document.body.classList.toggle('lzlock',fullAtivo());
  if(r==='professor'&&t==='lousa'){if(fullAtivo()){const c=document.getElementById('campo');if(c&&ui.lousa)c.innerHTML=campoSVG(ui.lousa,false);}bindCampo(ui.lousa,true);bindBanco(ui.lousa);}
  if(r==='aluno'&&t==='jogadas'&&ui.vl)bindCampo(ui.vl.obj,false);
  if(r==='aluno'&&t==='carta')bindCarta();
}

/* ================= INÍCIO ================= */
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function saud(){const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';}
function vInicioProf(){
  const prox=S.eventos.filter(e=>!e.cancelado&&!e.encerrado&&e.data>=HOJE).sort((x,y)=>(x.data+x.hora).localeCompare(y.data+y.hora));
  const hero=prox[0],L=S.live;
  let h=`<div class="head"><div><p class="mut">${saud()}, professor</p><h1>${cap(fmtD(HOJE))}</h1></div></div>`;
  if(L){const e=ev(L.ev);if(e)h+=`<button type="button" class="hero" data-a="tab" data-v="aovivo" style="text-align:left;cursor:pointer"><span class="bdg ok">● Partida em andamento</span><div class="big">${esc(nomeTime(L,'a'))} ${L.placar.a} x ${L.placar.b} ${esc(nomeTime(L,'b'))}</div><span class="sm mut">${catNome(e.cat)} · ${L.fase==='intervalo'?'Intervalo':L.periodo+'º tempo'} · toque para voltar ao jogo</span></button>`;}
  if(hero){const lista=temConv(hero)?convocadosDe(hero):Object.keys(hero.conf).filter(id=>hero.conf[id]==='vai');
    h+=`<section class="hero"><div class="row between wrapx"><span class="bdg y">Próximo · ${hero.data===HOJE?'Hoje':fmtD(hero.data)} · ${esc(hero.hora)}</span><span class="sm mut">${catNome(hero.cat)} · ${esc(hero.sub)}</span></div><div class="big">${esc(evTitulo(hero))}</div><div class="row mut sm">${IC.pin}${esc(hero.local)}</div><div class="row wrapx" style="gap:12px"><div class="avs">${lista.slice(0,8).map(id=>avatar(al(id),34)).join('')}</div><span class="sm">${lista.length} ${hero.grupo==='jogo'?'convocados':'confirmados'}</span></div><div class="row wrapx">`
    +(temConv(hero)&&!L?`<button type="button" class="btn y big" data-a="aoVivoDe" data-v="${hero.id}">${IC.play}Iniciar ao vivo</button>`:'')
    +(hero.grupo==='treino'&&hero.data===HOJE?`<button type="button" class="btn y" data-a="chamadaRapida" data-v="${hero.id}">Chamada: todos presentes</button><button type="button" class="btn" data-a="chamada" data-v="${hero.id}">Chamada detalhada</button>`:'')
    +(hero.grupo==='jogo'?`<button type="button" class="btn" data-a="convocar" data-v="${hero.id}">Convocar</button>`:'')
    +`<button type="button" class="btn o" data-a="evDet" data-v="${hero.id}">Detalhes</button></div></section>`;}
  h+=`<div class="tiles">${[['rapida','Partida rápida',IC.bolt],['novoEvento','Novo treino ou jogo',IC.cal],['irLousa','Montar jogada',IC.field],['irDica','Enviar dica',IC.msg]].map(t=>`<button type="button" class="tile" data-a="${t[0]}">${t[2]}<span>${t[1]}</span></button>`).join('')}</div>`;
  const semCh=S.eventos.filter(e=>e.grupo==='treino'&&!e.cancelado&&e.data<=HOJE&&e.data>=addD(HOJE,-14)&&!Object.keys(e.chamada).length&&(!hero||e.id!==hero.id));
  const semConv=S.eventos.filter(e=>e.grupo==='jogo'&&!e.cancelado&&!e.encerrado&&e.data>=HOJE&&e.data<=addD(HOJE,10)&&!e.convocados.length);
  const atras=S.metas.filter(m=>m.status==='andamento'&&m.prazo<HOJE),nl=S.dicas.filter(d=>!d.lida).length;
  let p='';
  semCh.forEach(e=>{p+=`<div class="card pend"><span style="color:var(--y)">${IC.cal}</span><div style="flex:1"><b>Chamada pendente</b><br><span class="sm mut">${catNome(e.cat)} · ${esc(e.titulo)} · ${fmtD(e.data)}</span></div><button type="button" class="btn y sm" data-a="chamadaRapida" data-v="${e.id}">Todos presentes</button><button type="button" class="btn sm" data-a="chamada" data-v="${e.id}">Detalhar</button></div>`;});
  semConv.forEach(e=>{p+=`<div class="card pend"><span style="color:var(--y)">${IC.users}</span><div style="flex:1"><b>Jogo sem convocação</b><br><span class="sm mut">${catNome(e.cat)} · ${esc(evTitulo(e))} · ${fmtD(e.data)}</span></div><button type="button" class="btn y sm" data-a="convocar" data-v="${e.id}">Convocar</button></div>`;});
  if(atras.length)p+=`<div class="card pend"><span style="color:var(--red)">${IC.target}</span><div style="flex:1"><b>${atras.length} meta${atras.length>1?'s':''} atrasada${atras.length>1?'s':''}</b><br><span class="sm mut">${atras.map(m=>esc(pNome(m.aluno))).join(', ')}</span></div><button type="button" class="btn sm" data-a="irMetas">Ver metas</button></div>`;
  if(nl)p+=`<div class="card pend"><span style="color:var(--mut)">${IC.msg}</span><div style="flex:1"><b>${nl} dica${nl>1?'s':''} ainda não lida${nl>1?'s':''}</b><br><span class="sm mut">Os alunos ainda não abriram</span></div><button type="button" class="btn sm" data-a="irHist">Ver histórico</button></div>`;
  h+=`<h2>Pendências</h2>`+(p?`<div class="col">${p}</div>`:'<div class="empty">Tudo em dia.</div>');
  const resto=prox.slice(1,5);
  if(resto.length)h+=`<h2>Próximos dias</h2><div class="list">${resto.map(e=>evCard(e,false)).join('')}</div>`;
  return h;
}
function vInicioAluno(){
  const a=al(ui.alunoAtual);if(!a)return '<div class="empty">Selecione um aluno.</div>';
  const s=stats(a.id),tr=tier(s),ok=cqAluno(a.id);
  const prox=S.eventos.filter(e=>e.cat===a.cat&&!e.encerrado&&e.data>=HOJE).sort((x,y)=>(x.data+x.hora).localeCompare(y.data+y.hora))[0];
  const dica=S.dicas.filter(d=>d.aluno===a.id).sort((x,y)=>(y.fixada-x.fixada)||(y.quando-x.quando))[0];
  const metas=S.metas.filter(m=>m.aluno===a.id&&m.status==='andamento');
  const alvo=s.treinos<10?{n:'prata',v:10,c:'#C9CCD1'}:s.treinos<25?{n:'ouro',v:25,c:'#F7C600'}:null;
  let h=`<div class="head"><div><p class="mut">${saud()}</p><h1>E aí, ${esc(primeiro(a.nome))}!</h1></div></div>`;
  h+=`<button type="button" class="minicarta" style="--tier:${tr.c}" data-a="tab" data-v="carta">${avatar(a,68)}<div style="flex:1;display:flex;flex-direction:column;gap:6px"><span class="xs" style="color:var(--tier);font-weight:800;letter-spacing:.1em">${tr.n.toUpperCase()} · ${catNome(a.cat)}</span><span class="nm">${esc(a.nome)}</span><span class="sm mut">${s.jogos} jogos · ${s.gols} gols · ${s.assist} assist. · ${s.treinos} treinos</span>${alvo?`<div class="prog" style="--tier:${alvo.c}"><i style="--w:${Math.min(100,s.treinos/alvo.v*100).toFixed(0)}%"></i></div><span class="xs mut">Faltam ${alvo.v-s.treinos} treinos para a carta ${alvo.n}</span>`:'<span class="xs" style="color:var(--y)">Nível máximo!</span>'}</div><span style="font-family:var(--fd);font-weight:800;font-size:48px;color:var(--tier)">${a.num!=null?a.num:''}</span></button>`;
  h+=`<h2>Próximo compromisso</h2>`+(prox?evCard(prox,true):'<div class="empty">Nada marcado por enquanto.</div>');
  if(dica)h+=`<section class="card col" style="gap:8px"><div class="row" style="color:var(--y)">${IC.msg}<h3 style="color:var(--ink)">Dica do professor</h3><span class="xs" style="color:${COR_DICA[dica.tipo]};font-weight:800">${dica.tipo}</span></div><p>${esc(dica.texto)}</p><div class="row wrapx">${dica.entendida?'<span class="bdg ok">Entendida</span>':`<button type="button" class="btn y sm" data-a="dEntendi" data-v="${dica.id}">Entendi</button>`}<button type="button" class="btn o sm" data-a="tab" data-v="dicas">Todas as dicas</button></div></section>`;
  if(metas.length)h+=`<section class="card col" style="gap:8px"><h3>Metas</h3>${metas.map(m=>`<div class="row"><span style="color:var(--y)">${IC.target}</span><span style="flex:1">${esc(m.texto)}</span><span class="xs mut">até ${fmtD(m.prazo)}</span></div>`).join('')}</section>`;
  h+=`<section class="card col" style="gap:10px"><div class="row between"><h3>Conquistas</h3><span class="sm mut">${ok.length} de ${CQ.length}</span></div><div class="row wrapx">${CQ.filter(c=>ok.includes(c.id)).map(c=>`<span class="bdg y">${esc(c.nome)}</span>`).join('')||'<span class="sm mut">Jogue e treine para liberar a primeira.</span>'}</div><button type="button" class="btn o sm" style="align-self:flex-start" data-a="tab" data-v="carta">Ver minha carta</button></section>`;
  return h;
}
function vInicioDono(){
  const sg=sugestoesPromo(),aguard=S.alunos.filter(a=>!a.senhaTrocada).length,sem=S.eventos.filter(e=>!e.cancelado&&e.data>=HOJE&&e.data<=addD(HOJE,7)).length;
  let h=`<div class="head"><div><p class="mut">${saud()}</p><h1>${esc(NOME)}</h1></div><button type="button" class="btn y" data-a="tela" data-v="novo">${IC.plus}Cadastrar aluno</button></div>`;
  h+=`<div class="kpis"><div class="kpi"><b>${S.alunos.length}</b><span>Alunos ativos</span></div><div class="kpi"><b>${S.cats.filter(c=>alunosCat(c.id).length).length}</b><span>Categorias com alunos</span></div><div class="kpi"><b>${aguard}</b><span>Aguardando 1º acesso</span></div><div class="kpi"><b>${sem}</b><span>Treinos e jogos em 7 dias</span></div></div>`;
  if(sg.length&&epocaPromo())h+=`<div class="banner"><span style="flex:1;min-width:220px"><b style="color:var(--y)">${sg.length} alunos</b> mudam de categoria em ${ANO+1}.</span><button type="button" class="btn y sm" data-a="tab" data-v="promocoes">Revisar promoção</button></div>`;
  h+=`<h2>Alunos por categoria</h2>${chipsCat('irCat',null)}`;
  if(aguard)h+=`<h2>Ainda não acessaram</h2><div class="list">${S.alunos.filter(a=>!a.senhaTrocada).map(a=>`<div class="card row" style="gap:12px">${avatar(a,40)}<div style="flex:1"><b>${esc(a.nome)}</b><br><span class="sm mut">@${esc(a.login)} · senha inicial ${senhaPadrao(a.nome)}</span></div><button type="button" class="btn sm" data-a="abrirAluno" data-v="${a.id}">Abrir</button></div>`).join('')}</div>`;
  return h;
}
/* ================= DONO ================= */
const epocaPromo=()=>!!(ui.promo&&ui.promo.mostrar_aviso);
const saemDaEscola=()=>(ui.promo&&ui.promo.saem_da_escolinha)||[];
function sugestoesPromo(){return S.alunos.map(a=>({a,alvo:catPorAno(+a.nasc.slice(0,4),1)})).filter(x=>x.alvo&&x.alvo.id!==x.a.cat);}
function vAlunos(){
  const lista=alunosCat(ui.cat),sg=sugestoesPromo();
  let h=`<div class="head"><div><h1>Alunos</h1><p class="mut">Cadastro, categoria e acesso ao app</p></div><button type="button" class="btn y" data-a="tela" data-v="novo">${IC.plus}Cadastrar aluno</button></div>`;
  if(sg.length&&epocaPromo())h+=`<div class="banner">${sv('<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',22,' style="color:var(--y)"')}<span style="flex:1;min-width:220px"><b style="color:var(--y)">${sg.length} alunos</b> passam da faixa de idade da categoria em ${ANO+1}.</span><button type="button" class="btn y sm" data-a="tab" data-v="promocoes">Revisar promoção</button></div>`;
  h+=chipsCat('cat',ui.cat)+`<input class="inp" style="max-width:320px" data-in="busca" placeholder="Buscar por nome ou usuário" aria-label="Buscar aluno">`;
  if(!lista.length)return h+`<div class="empty">Nenhum aluno no ${catNome(ui.cat)} ainda.<button type="button" class="btn y" data-a="tela" data-v="novo">Cadastrar aluno</button></div>`;
  return h+`<div class="tbl"><table><thead><tr><th>Aluno</th><th>Usuário</th><th>Nascimento</th><th>Posições</th><th>Camisa</th><th>Responsável</th><th>Acesso</th><th><span class="sr">Ações</span></th></tr></thead><tbody>${lista.map(a=>`<tr data-nome="${esc(semAcento(a.nome).toLowerCase()+' '+a.login)}"><td><div class="who">${avatar(a,38)}<b>${esc(a.nome)}</b></div></td><td><span class="uname">@${esc(a.login)}</span></td><td>${fmtNasc(a.nasc)}</td><td>${posTxt(a)}</td><td>${a.num!=null?a.num:'—'}</td><td>${esc(a.resp)}<br><span class="mut sm">${esc(a.cel)}</span></td><td>${a.senhaTrocada?'<span class="bdg ok">Ativo</span>':'<span class="bdg wait">Aguardando troca de senha</span>'}</td><td><button type="button" class="btn o sm" data-a="abrirAluno" data-v="${a.id}">Abrir</button></td></tr>`).join('')}</tbody></table></div>`;
}
function vNovo(){
  return `<div class="head"><div><h1>Cadastrar aluno</h1><p class="mut">O sistema cria o acesso do aluno e o do responsável.</p></div><button type="button" class="btn o" data-a="tela" data-v="alunos">Cancelar</button></div>
  <form class="card col" data-f="novo" style="gap:16px">
  <div class="row" style="gap:16px"><div id="fotoPrev">${ui.fotoTmp?`<img class="av" src="${ui.fotoTmp}" alt="" style="width:96px;height:96px">`:'<span class="av" style="width:96px;height:96px;font-size:30px">+</span>'}</div><label class="f">Foto do aluno <small>Opcional. É recortada e reduzida automaticamente.</small><input type="file" accept="image/*" data-ch="foto"></label></div>
  <div class="grid2"><label class="f">Nome completo<input class="inp" name="nome" required autocomplete="off" data-in="nomeNovo"></label><label class="f">Data de nascimento<input class="inp" type="date" name="nasc" required data-ch="nascNovo"></label></div>
  ${posPicker()}
  <div class="grid3"><label class="f">Número da camisa <small>Opcional</small><input class="inp" type="number" min="1" max="99" name="num"></label><label class="f">Categoria<select class="inp" name="cat" id="catNovo">${S.cats.map(c=>`<option value="${c.id}"${sel(c.id,ui.cat)}>${c.nome} (nascidos em ${c.ini})</option>`).join('')}</select></label><label class="f">Nome de usuário <small>Sugerido pelo nome</small><input class="inp" name="login" id="loginNovo" required autocomplete="off" data-in="loginNovo" placeholder="joao.silva"></label></div>
  <div class="grid2"><label class="f">Nome do responsável<input class="inp" name="resp" required autocomplete="off"></label><label class="f">Celular do responsável <small>É o login do responsável</small><input class="inp" name="cel" required placeholder="(18) 99999-9999" autocomplete="off"></label></div>
  <div class="checks"><label><input type="checkbox" name="termo" required>Responsável aceitou o termo de uso de imagem e dados</label></div>
  <div class="row" style="justify-content:flex-end"><button type="submit" class="btn y">Cadastrar e gerar acessos</button></div></form>`;
}
function posPicker(){const sel=ui.posSel;return `<fieldset class="col" id="posField"><legend>Posições <span class="mut sm">A primeira que você tocar é a principal, as outras são secundárias. Toque de novo para tirar.</span></legend><div class="posgrid">${POSICOES.map(([k,n])=>{const i=sel.indexOf(k);return `<button type="button" class="posbtn${i===0?' pri':i>0?' sec':''}" data-a="posTog" data-v="${k}" aria-pressed="${i>=0}" aria-label="${n}${i===0?', principal':i>0?', secundária':''}"><b>${k}</b><span>${i===0?'Principal':i>0?'Secundária':n}</span></button>`;}).join('')}</div>${sel.length?`<span class="sm">Principal: <b>${POSN[sel[0]]}</b>${sel.length>1?' · Secundárias: '+sel.slice(1).map(x=>POSN[x]).join(', '):''}</span>`:''}</fieldset>`;}
function vPromo(){
  const sg=sugestoesPromo();
  let h=`<div class="head"><div><h1>Promoções de categoria</h1><p class="mut">Em ${ANO+1} estes alunos passam da faixa de idade da categoria atual.${epocaPromo()?'':' O aviso no início aparece a partir de novembro, mas você pode promover quando quiser.'}</p></div></div>`;
  const sai=saemDaEscola();if(sai.length)h+=`<div class="card flat sm"><b>${sai.length} alunos do Sub-18</b> passam da idade máxima da escolinha em ${ANO+1} e não entram na promoção.</div>`;
  if(!sg.length)return h+'<div class="empty">Nenhum aluno precisa mudar de categoria agora.</div>';
  return h+`<form class="col" data-f="promo">${sg.map(x=>`<label class="card row" style="gap:14px;cursor:pointer"><input type="checkbox" name="p" value="${x.a.id}" checked style="accent-color:var(--y);width:20px;height:20px">${avatar(x.a,40)}<span style="flex:1"><b>${esc(x.a.nome)}</b><br><span class="mut sm">Nascido em ${x.a.nasc.slice(0,4)}</span></span><span class="bdg">${catNome(x.a.cat)}</span>${sv('<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',18)}<span class="bdg y">${x.alvo.nome}</span></label>`).join('')}<div class="row" style="justify-content:flex-end"><button type="submit" class="btn y">Promover selecionados</button></div></form>`;
}

/* ================= AGENDA ================= */
const SUBS={treino:['Tático','Técnico','Físico','Ataque','Defesa','Bola parada','Coletivo'],jogo:['Amistoso','Competição','Teste','Festival']};
const LEVAR=['Chuteira','Caneleira','Garrafa de água','Uniforme reserva','Documento com foto','Protetor solar','Lanche'];
function evsDe(catId,tipo){return S.eventos.filter(e=>e.cat===catId&&(tipo==='todos'||(tipo==='treinos'?e.grupo==='treino':e.grupo==='jogo'))).sort((x,y)=>(x.data+x.hora).localeCompare(y.data+y.hora));}
function confCount(e){let v=0,n=0;Object.values(e.conf).forEach(x=>{x==='vai'?v++:n++;});return {v,n};}
function evCard(e,aluno){
  const jogo=e.grupo==='jogo',c=confCount(e);
  let h=`<article class="card ev${jogo?' jogo':''}${e.cancelado?' cancel':''}"><div class="meta"><span class="tipo">${e.data===HOJE?'Hoje':fmtD(e.data)} · ${esc(e.sub)}${e.serie?' · semanal':''}</span><span class="mut">${esc(e.hora)}–${esc(e.fim)}</span></div><h3>${esc(evTitulo(e))}</h3><div class="row mut sm">${IC.pin}${esc(e.local)}</div>`;
  if(e.cancelado)h+=`<div><span class="bdg x">Cancelado</span> <span class="sm mut">${esc(e.motivo)}</span></div>`;
  else if(e.encerrado)h+=`<div><span class="bdg ok">Encerrado · ${e.placar.a} x ${e.placar.b}</span></div>`;
  if(e.plano&&e.plano.objetivo&&!e.cancelado)h+=`<div class="sm">Objetivo: ${esc(e.plano.objetivo)}</div>`;
  if(!aluno){
    const ch=Object.keys(e.chamada).length;
    h+=`<div class="row wrapx sm mut">${temConv(e)?`<span>${convocadosDe(e).length} ${jogo?'convocados':'confirmados no coletivo'}</span>·`:''}<span>${c.v} vão · ${c.n} não vão</span>${ch?`· <span>chamada feita</span>`:''}</div><div class="row wrapx"><button type="button" class="btn sm" data-a="evDet" data-v="${e.id}">Detalhes</button>${jogo&&!e.encerrado&&!e.cancelado?`<button type="button" class="btn sm" data-a="convocar" data-v="${e.id}">Convocar</button>`:''}`;
    if(!e.encerrado&&!e.cancelado&&(jogo||e.sub==='Coletivo'))h+=`<button type="button" class="btn y sm" data-a="aoVivoDe" data-v="${e.id}">Iniciar ao vivo</button>`;
    if(e.encerrado)h+=`<button type="button" class="btn y sm" data-a="resumo" data-v="${e.id}">Resumo</button>`;
    if(!jogo&&!e.cancelado&&e.data<=HOJE)h+=`<button type="button" class="btn sm" data-a="chamada" data-v="${e.id}">Chamada</button>`;
    h+='</div>';
  }else{
    const a=al(ui.alunoAtual);
    if(!e.encerrado&&!e.cancelado){if(jogo&&e.convocados.includes(a.id))h+='<div><span class="bdg y">Você foi convocado</span></div>';if(e.sub==='Coletivo')h+=e.conf[a.id]==='vai'?'<div><span class="bdg y">Você está no coletivo</span></div>':'<div class="sm mut">Confirme presença para entrar nos times do coletivo.</div>';}
    const mine=e.chamada[a.id];if(mine)h+=`<div class="sm">${mine==='P'?'<span class="bdg ok">Presente</span>':mine==='J'?'<span class="bdg b">Falta justificada</span>':'<span class="bdg x">Falta</span>'}</div>`;
    h+=`<div class="row wrapx">`;
    if(!e.cancelado&&!e.encerrado&&e.data>=HOJE){const cf=e.conf[a.id];h+=`<button type="button" class="btn sm ${cf==='vai'?'y':'o'}" data-a="conf" data-v="${e.id}|vai" aria-pressed="${cf==='vai'}">Vou</button><button type="button" class="btn sm ${cf==='nao'?'w':'o'}" data-a="conf" data-v="${e.id}|nao" aria-pressed="${cf==='nao'}">Não vou</button>`;}
    h+=`<button type="button" class="btn sm" data-a="evDet" data-v="${e.id}">Detalhes</button>`;
    if(e.encerrado)h+=`<button type="button" class="btn sm" data-a="resumo" data-v="${e.id}">Resumo</button>`;
    h+='</div>';
  }
  return h+'</article>';
}
function vAgenda(aluno){
  const a=al(ui.alunoAtual),catId=aluno?a.cat:ui.catProf,st=aluno?ui.agA:ui.ag;
  const tipo=aluno?'todos':ui.ag.tipo;
  const evs=evsDe(catId,tipo);
  let h=`<div class="head"><div><h1>Agenda</h1><p class="mut">${aluno?catNome(catId)+' · confirme se vai em cada treino e jogo.':'Treinos e jogos por categoria. Toda mudança avisa os alunos e as famílias.'}</p></div>${aluno?'':`<button type="button" class="btn y" data-a="novoEvento">${IC.plus}Novo treino ou jogo</button>`}</div>`;
  if(!aluno)h+=chipsCat('catProf',ui.catProf);
  h+=`<div class="row wrapx between"><div class="seg" role="group" aria-label="Visualização">${(aluno?[['lista','Lista'],['mes','Mês']]:[['lista','Lista'],['semana','Semana'],['mes','Mês']]).map(v=>`<button type="button" data-a="agView" data-v="${v[0]}" aria-pressed="${st.view===v[0]}">${v[1]}</button>`).join('')}</div>`;
  if(!aluno)h+=`<div class="seg" role="group" aria-label="Filtro">${[['todos','Todos'],['treinos','Treinos'],['jogos','Jogos']].map(v=>`<button type="button" data-a="agTipo" data-v="${v[0]}" aria-pressed="${ui.ag.tipo===v[0]}">${v[1]}</button>`).join('')}</div>`;
  h+='</div>';
  if(st.view==='mes')return h+agMes(evs,aluno,st);
  if(st.view==='semana')return h+agSemana(evs);
  const prox=evs.filter(e=>e.data>=HOJE),pass=evs.filter(e=>e.data<HOJE).reverse();
  h+='<h2>Próximos</h2>'+(prox.length?`<div class="list">${prox.map(e=>evCard(e,aluno)).join('')}</div>`:`<div class="empty">Nada marcado para o ${catNome(catId)}.${aluno?'':'<button type="button" class="btn y" data-a="novoEvento">Marcar treino ou jogo</button>'}</div>`);
  if(pass.length)h+=`<h2>Anteriores</h2><div class="list">${pass.slice(0,aluno?4:12).map(e=>evCard(e,aluno)).join('')}</div>`;
  return h;
}
function agSemana(evs){
  const base=addD(HOJE,-dow(HOJE)+7*ui.ag.semana),dias=[...Array(7)].map((_,i)=>addD(base,i));
  return `<div class="row between"><button type="button" class="btn o sm" data-a="agSem" data-v="-1">Semana anterior</button><b>${fmtD(dias[0])} a ${fmtD(dias[6])}</b><button type="button" class="btn o sm" data-a="agSem" data-v="1">Próxima semana</button></div><div class="semana">${dias.map(d=>`<div class="dia${d===HOJE?' hoje':''}"><b class="sm">${fmtD(d)}</b>${evs.filter(e=>e.data===d).map(e=>`<button type="button" class="mini${e.grupo==='jogo'?' j':''}${e.cancelado?' x':''}" data-a="evDet" data-v="${e.id}"><b class="sm">${esc(e.hora)} ${esc(e.sub)}</b><span class="xs">${esc(evTitulo(e))}</span>${e.encerrado?`<span class="xs mut">${e.placar.a} x ${e.placar.b}</span>`:''}</button>`).join('')||'<span class="xs mut">Livre</span>'}</div>`).join('')}</div>`;
}
function agMes(evs,aluno,st){
  const [y,m]=st.mes.split('-').map(Number),first=`${y}-${pad(m)}-01`,start=addD(first,-dow(first));
  const cells=[...Array(42)].map((_,i)=>addD(start,i));
  let h=`<div class="row between"><button type="button" class="btn o sm" data-a="agMes" data-v="-1" aria-label="Mês anterior">‹</button><b style="text-transform:capitalize">${MESES[m-1]} de ${y}</b><button type="button" class="btn o sm" data-a="agMes" data-v="1" aria-label="Próximo mês">›</button></div>`;
  h+=`<div class="cal">${DIAS.map(d=>`<div class="wd">${d}</div>`).join('')}${cells.map(d=>{const es=evs.filter(e=>e.data===d);return `<button type="button" class="d${d.slice(0,7)!==st.mes?' out':''}${d===HOJE?' hoje':''}" data-a="agDia" data-v="${d}" aria-pressed="${st.dia===d}"><span class="n">${+d.slice(8)}</span>${es.slice(0,3).map(e=>`<span class="pill${e.grupo==='jogo'?' j':''}${e.cancelado?' x':''}">${esc(e.hora)} ${esc(e.grupo==='jogo'?e.adv:e.sub)}</span>`).join('')}${es.length>3?`<span class="xs mut">+${es.length-3}</span>`:''}</button>`;}).join('')}</div>`;
  if(st.dia){const es=evs.filter(e=>e.data===st.dia);h+=`<h2>${fmtD(st.dia)}</h2>`+(es.length?`<div class="list">${es.map(e=>evCard(e,aluno)).join('')}</div>`:`<div class="empty">Nada neste dia.${aluno?'':`<button type="button" class="btn y" data-a="novoEvento" data-v="${st.dia}">Marcar neste dia</button>`}</div>`);}
  return h;
}
function evDetalheHTML(e,aluno){
  const jogo=e.grupo==='jogo',c=confCount(e),lista=alunosCat(e.cat);
  let h=`<div class="row between wrapx"><div><p class="tipo" style="color:var(--y);font-weight:700">${catNome(e.cat)} · ${esc(e.sub)}${e.serie?' · treino semanal':''}</p><h2>${esc(evTitulo(e))}</h2></div>${e.cancelado?'<span class="bdg x">Cancelado</span>':e.encerrado?`<span class="bdg ok">Encerrado · ${e.placar.a} x ${e.placar.b}</span>`:''}</div>`;
  if(e.cancelado&&e.motivo)h+=`<p class="sm">Motivo: ${esc(e.motivo)}</p>`;
  h+=`<div class="info"><div><span>Data</span><b>${fmtD(e.data)}</b></div><div><span>Horário</span><b>${esc(e.hora)} às ${esc(e.fim)}</b></div>${jogo&&e.chegada?`<div><span>Chegada</span><b>${esc(e.chegada)}</b></div>`:''}<div><span>Local</span><b>${esc(e.local)}</b></div>${jogo?`<div><span>Mando</span><b>${e.mando==='fora'?'Fora de casa':'Em casa'}</b></div>`:''}${e.uniforme?`<div><span>Uniforme</span><b>${esc(e.uniforme)}</b></div>`:''}</div>`;
  if(e.levar&&e.levar.length)h+=`<div class="col" style="gap:6px"><b>O que levar</b><div class="checks">${e.levar.map(x=>`<span class="bdg">${esc(x)}</span>`).join('')}</div></div>`;
  if(e.plano&&(e.plano.objetivo||e.plano.atividades.length)){const tot=e.plano.atividades.reduce((s,x)=>s+(+x.min||0),0);
    h+=`<div class="card flat col"><b>Plano do treino</b>${e.plano.objetivo?`<p>Objetivo: ${esc(e.plano.objetivo)}</p>`:''}${e.plano.atividades.map((x,i)=>{const lz=x.lousa?lousa(x.lousa):null;return `<div class="row between" style="border-top:1px solid var(--line);padding-top:8px"><span><b>${i+1}. ${esc(x.nome)}</b>${lz?`<br><button type="button" class="btn o sm" style="margin-top:4px" data-a="abrirJogada" data-v="${lz.id}">${IC.field}Ver jogada: ${esc(lz.nome)}</button>`:''}</span><span class="bdg">${+x.min||0} min</span></div>`;}).join('')}<p class="sm mut">Total: ${tot} minutos</p></div>`;}
  if(e.obs&&!e.encerrado)h+=`<p class="sm">Observações: ${esc(e.obs)}</p>`;
  if(temConv(e))h+=`<div class="col" style="gap:6px"><b>${jogo?'Convocados':'Confirmados no coletivo'} (${convocadosDe(e).length})</b>${jogo?'':'<span class="xs mut">A categoria inteira foi avisada. Quem confirma presença entra automaticamente.</span>'}<div class="checks">${convocadosDe(e).length?convocadosDe(e).map(id=>`<span class="bdg${aluno&&id===ui.alunoAtual?' y':''}">${esc(nomeDe(id))}</span>`).join(''):(jogo?'<span class="mut sm">Ninguém convocado ainda.</span>':'<span class="mut sm">Ninguém confirmou ainda.</span>')}</div></div>`;
  if(!aluno){
    const ch=Object.keys(e.chamada).length;
    h+=`<div class="col" style="gap:6px"><b>Presença confirmada</b><div class="sm">${c.v} vão · ${c.n} não vão · ${lista.length-c.v-c.n} sem resposta</div>${ch?`<div class="sm">Chamada: ${Object.values(e.chamada).filter(v=>v==='P').length} presentes, ${Object.values(e.chamada).filter(v=>v==='F').length} faltas, ${Object.values(e.chamada).filter(v=>v==='J').length} justificadas</div>`:''}</div>`;
    h+=`<div class="acts" style="justify-content:flex-start">`;
    if(!e.encerrado){h+=`<button type="button" class="btn sm" data-a="evEditar" data-v="${e.id}">${IC.edit}Editar</button>`;}
    h+=`<button type="button" class="btn sm" data-a="evDup" data-v="${e.id}">${IC.copy}Duplicar</button>`;
    if(jogo&&!e.encerrado&&!e.cancelado)h+=`<button type="button" class="btn sm" data-a="convocar" data-v="${e.id}">Convocar</button>`;
    if(!e.cancelado&&!e.encerrado)h+=`<button type="button" class="btn sm" data-a="lembrete" data-v="${e.id}">Enviar lembrete</button>`;
    if(!jogo&&!e.cancelado)h+=`<button type="button" class="btn sm" data-a="chamada" data-v="${e.id}">Chamada</button>`;
    if(!e.encerrado&&!e.cancelado&&(jogo||e.sub==='Coletivo'))h+=`<button type="button" class="btn y sm" data-a="aoVivoDe" data-v="${e.id}">Iniciar ao vivo</button>`;
    if(e.encerrado)h+=`<button type="button" class="btn y sm" data-a="resumo" data-v="${e.id}">Resumo</button>`;
    if(!e.encerrado)h+=e.cancelado?`<button type="button" class="btn o sm" data-a="reativar" data-v="${e.id}">Reativar</button>`:`<button type="button" class="btn r sm" data-a="cancelarEv" data-v="${e.id}">Cancelar</button>`;
    h+='</div>';
  }else{
    const a=al(ui.alunoAtual),cf=e.conf[a.id];
    h+='<div class="acts" style="justify-content:flex-start">';
    if(!e.cancelado&&!e.encerrado&&e.data>=HOJE)h+=`<button type="button" class="btn ${cf==='vai'?'y':'o'}" data-a="conf" data-v="${e.id}|vai">Vou</button><button type="button" class="btn ${cf==='nao'?'w':'o'}" data-a="conf" data-v="${e.id}|nao">Não vou</button>`;
    if(e.encerrado)h+=`<button type="button" class="btn y" data-a="resumo" data-v="${e.id}">Ver resumo</button>`;
    h+='</div>';
  }
  return h+`<div class="acts"><button type="button" class="btn o" data-a="fechar">Fechar</button></div>`;
}
function novoDraft(data){return {id:null,grupo:'treino',sub:'Tático',titulo:'',adv:'',mando:'casa',data:data||iso(1),hora:'17:00',fim:'18:30',chegada:'',local:'Campo 2',uniforme:'Camisa amarela, meião preto',levar:['Chuteira','Caneleira','Garrafa de água'],objetivo:'',atividades:[{nome:'Aquecimento',min:15,lousa:''}],repetir:false,dias:[],ate:iso(28),obs:'',cat:ui.catProf};}
function draftDe(e,dup){return {id:dup?null:e.id,grupo:e.grupo,sub:e.sub,titulo:e.titulo,adv:e.adv,mando:e.mando,data:dup?addD(e.data,7):e.data,hora:e.hora,fim:e.fim,chegada:e.chegada,local:e.local,uniforme:e.uniforme,levar:e.levar.slice(),objetivo:e.plano?e.plano.objetivo:'',atividades:e.plano?clone(e.plano.atividades):[],repetir:false,dias:[],ate:iso(28),obs:e.obs,cat:e.cat};}
function evFormHTML(d){
  const g=d.grupo,lz=S.lousas.filter(l=>l.cat===d.cat);
  let h=`<h2>${d.id?'Editar':'Novo'} ${g==='jogo'?'jogo':'treino'}</h2><form class="col" data-f="evento" style="gap:14px">`;
  h+=`<div class="grid3"><label class="f">Tipo<select class="inp" name="grupo" data-ch="grupoEv"><option value="treino"${sel(g,'treino')}>Treino</option><option value="jogo"${sel(g,'jogo')}>Jogo</option></select></label><label class="f">Modalidade<select class="inp" name="sub">${SUBS[g].map(s=>`<option${sel(s,d.sub)}>${s}</option>`).join('')}</select></label><label class="f">Categoria<select class="inp" name="cat" data-ch="catEv">${catOpts(d.cat)}</select></label></div>`;
  h+=g==='treino'?`<label class="f">Título<input class="inp" name="titulo" required value="${esc(d.titulo)}" placeholder="Ex.: Saída de bola e marcação"></label>`:`<div class="grid3"><label class="f">Adversário<input class="inp" name="adv" required value="${esc(d.adv)}"></label><label class="f">Mando<select class="inp" name="mando"><option value="casa"${sel(d.mando,'casa')}>Em casa</option><option value="fora"${sel(d.mando,'fora')}>Fora de casa</option></select></label><label class="f">Chegada<input class="inp" type="time" name="chegada" value="${esc(d.chegada)}"></label></div>`;
  h+=`<div class="grid3"><label class="f">Data<input class="inp" type="date" name="data" required value="${esc(d.data)}"></label><label class="f">Início<input class="inp" type="time" name="hora" required value="${esc(d.hora)}"></label><label class="f">Fim<input class="inp" type="time" name="fim" required value="${esc(d.fim)}"></label></div>`;
  h+=`<div class="grid2"><label class="f">Local<input class="inp" name="local" required value="${esc(d.local)}"></label><label class="f">Uniforme<input class="inp" name="uniforme" value="${esc(d.uniforme)}"></label></div>`;
  h+=`<fieldset><legend>O que levar</legend><div class="checks">${LEVAR.map(x=>`<label><input type="checkbox" name="levar" value="${x}"${chk(d.levar.includes(x))}>${x}</label>`).join('')}</div></fieldset>`;
  if(g==='treino'){
    h+=`<div class="card flat col"><b>Plano do treino</b><label class="f">Objetivo<input class="inp" name="objetivo" value="${esc(d.objetivo)}" placeholder="Ex.: Sair jogando sob pressão"></label>`;
    h+=d.atividades.map((x,i)=>`<div class="atv"><label class="f">Atividade ${i+1}<input class="inp" name="atv_nome_${i}" value="${esc(x.nome)}"></label><label class="f">Min<input class="inp" type="number" min="1" max="120" name="atv_min_${i}" value="${esc(x.min)}"></label><label class="f lz">Jogada da lousa<select class="inp" name="atv_lz_${i}"><option value="">Nenhuma</option>${lz.map(l=>`<option value="${l.id}"${sel(l.id,x.lousa)}>${esc(l.nome)}</option>`).join('')}</select></label><button type="button" class="btn o rm" data-a="atvDel" data-v="${i}" aria-label="Remover atividade ${i+1}">${IC.x}</button></div>`).join('');
    h+=`<div class="row between"><button type="button" class="btn sm" data-a="atvAdd">${IC.plus}Adicionar atividade</button><span class="sm mut">Total: ${d.atividades.reduce((s,x)=>s+(+x.min||0),0)} min</span></div></div>`;
    if(!d.id)h+=`<div class="card flat col"><label class="toggle"><input type="checkbox" name="repetir" data-ch="repetir"${chk(d.repetir)}>Repetir toda semana</label>${d.repetir?`<fieldset><legend>Dias da semana</legend><div class="checks">${DIAS.map((x,i)=>`<label><input type="checkbox" name="dias" value="${i}"${chk(d.dias.includes(String(i)))}>${x}</label>`).join('')}</div></fieldset><label class="f">Repetir até<input class="inp" type="date" name="ate" value="${esc(d.ate)}"></label>`:''}</div>`;
  }
  h+=`<label class="f">Observações para os alunos<textarea class="inp" name="obs" placeholder="Opcional">${esc(d.obs)}</textarea></label>`;
  return h+`<div class="acts"><button type="button" class="btn o" data-a="fechar">Cancelar</button><button type="submit" class="btn y">${d.id?'Salvar e avisar alterações':'Marcar e avisar alunos'}</button></div></form>`;
}
function capturaEv(f){
  const fd=new FormData(f),d=ui.modal.d;
  ['grupo','sub','titulo','adv','mando','data','hora','fim','chegada','local','uniforme','objetivo','ate','obs','cat'].forEach(k=>{if(fd.has(k))d[k]=fd.get(k);});
  d.levar=fd.getAll('levar');d.repetir=!!fd.get('repetir');if(fd.has('dias')||d.repetir)d.dias=fd.getAll('dias');
  d.atividades=d.atividades.map((x,i)=>({nome:fd.has('atv_nome_'+i)?fd.get('atv_nome_'+i):x.nome,min:fd.has('atv_min_'+i)?fd.get('atv_min_'+i):x.min,lousa:fd.has('atv_lz_'+i)?fd.get('atv_lz_'+i):x.lousa}));
}

/* ================= JOGO AO VIVO ================= */
const DET={normal:'',falta:'de falta',penalti:'de pênalti',cabeca:'de cabeça',fora_area:'de fora da área'};
const elegiveis=()=>S.eventos.filter(e=>!e.encerrado&&!e.cancelado&&(e.grupo==='jogo'||e.sub==='Coletivo')).sort((x,y)=>x.data.localeCompare(y.data));
const zStats=()=>({chutes:0,noGol:0,escanteios:0,faltas:0,amarelos:0,vermelhos:0});
const gameSec=L=>(L.periodo-1)*L.dur*60+Math.min(L.seg,L.dur*60)+Math.max(0,L.seg-L.dur*60);
function minLabel(L){const reg=L.dur*60;if(L.seg>reg)return (L.periodo*L.dur)+'+'+Math.ceil((L.seg-reg)/60)+"'";return (Math.floor(L.seg/60)+1+(L.periodo-1)*L.dur)+"'";}
const fmtT=s=>pad(Math.floor(s/60))+':'+pad(s%60);
function minJog(L,id){const base=L.minutos[id]||0,on=L.entrou[id]!=null?Math.max(0,gameSec(L)-L.entrou[id]):0;return Math.floor((base+on)/60);}
const nomeTime=(L,t)=>t==='a'?(L.jogo?NOME_CURTO:'Time A'):(L.jogo?L.adv:'Time B');
function vAoVivo(){
  if(S.live)return vLive();
  let h=`<div class="head"><div><h1>Jogo ao vivo</h1><p class="mut">Placar, cronômetro, escalação, substituições, cartões e estatísticas direto da beira do campo.</p></div><button type="button" class="btn y" data-a="rapida">${IC.bolt}Partida rápida</button></div>`;
  const el=elegiveis();
  if(!el.length)return h+`<div class="empty">Nenhum jogo ou coletivo marcado.<button type="button" class="btn y" data-a="tab" data-v="agenda">Ir para a agenda</button></div>`;
  const st=ui.liveSetup;
  h+=`<div class="card col"><label class="f">Partida<select class="inp" data-ch="liveEv"><option value="">Escolha um jogo ou coletivo</option>${el.map(e=>`<option value="${e.id}"${st&&st.ev===e.id?' selected':''}>${catNome(e.cat)} · ${fmtD(e.data)} · ${esc(evTitulo(e))}</option>`).join('')}</select></label></div>`;
  if(!st)return h;
  const e=ev(st.ev),jogo=e.grupo==='jogo',lista=porPosicao(alunosCat(e.cat)),n=st.n||7;
  h+=`<form class="card col" data-f="liveStart" style="gap:16px">${S.ultEsc[e.cat+'|'+(jogo?'j':'c')]?`<div class="row between wrapx"><span class="sm mut">Você já escalou o ${catNome(e.cat)} antes.</span><button type="button" class="btn sm" data-a="ultEsc" data-v="${e.cat}|${jogo?'j':'c'}">Repetir última escalação</button></div>`:''}<div class="grid4"><label class="f">Jogadores por time<select class="inp" name="n" data-ch="liveN">${[5,6,7,8,9,10,11].map(k=>`<option value="${k}"${k===n?' selected':''}>${k}</option>`).join('')}</select></label><label class="f">Duração de cada tempo<select class="inp" name="dur">${[10,15,20,25,30,35,40,45].map(k=>`<option value="${k}"${k===20?' selected':''}>${k} min</option>`).join('')}</select></label><label class="f">Tempos<select class="inp" name="tempos"><option value="2">2 tempos</option><option value="1">Tempo único</option></select></label>${jogo?`<label class="f">Adversário<input class="inp" name="adv" value="${esc(e.adv)}"></label>`:''}</div>`;
  const cids=convocadosDe(e),conv=cids.length?lista.filter(a=>cids.includes(a.id)):[];
  const fora=conv.length?lista.filter(a=>!conv.includes(a)):[];
  const pool=escalar(conv.length?conv:lista);
  if(!conv.length&&!e.rapida)h+=jogo?`<div class="banner"><span style="flex:1;min-width:220px">Ninguém foi convocado para este jogo. Convoque primeiro ou use o elenco inteiro abaixo.</span><button type="button" class="btn y sm" data-a="convocar" data-v="${e.id}">Convocar agora</button></div>`:`<div class="banner"><span style="flex:1;min-width:220px">Ninguém confirmou presença no coletivo ainda. Mande um lembrete para a categoria ou use o elenco inteiro abaixo.</span><button type="button" class="btn y sm" data-a="lembrete" data-v="${e.id}">Enviar lembrete</button></div>`;
  const linha=(a,nome,ops,d,extra)=>`<div class="row between wrapx" style="border-top:1px solid var(--line);padding:6px 0"${extra||''}><span class="who">${avatar(a,32)}<span>${esc(a.nome)} <span class="mut sm">${posTxt(a)}${a.num!=null?' · '+a.num:''}</span></span></span><span class="seg">${ops.map(o=>`<label class="rad"><input type="radio" name="${nome}_${a.id}" value="${o[0]}"${chk(o[0]===d)}>${o[1]}</label>`).join('')}</span></div>`;
  if(jogo){
    let tit=0;const OP=[['t','Titular'],['r','Reserva'],['f','Não joga']];
    h+=`<fieldset class="col"><legend>Escalação da ${esc(NOME_CURTO)} <span class="mut sm">(${conv.length?conv.length+' convocados · ':''}${n} titulares sugeridos pela posição)</span></legend>${pool.map(a=>{const d=tit<n?'t':'r';if(d==='t')tit++;return linha(a,'e',OP,d);}).join('')}</fieldset>`;
    if(fora.length)h+=`<details class="pn"><summary>Não convocados (${fora.length})</summary><div class="in">${fora.map(a=>linha(a,'e',OP,'f')).join('')}</div></details>`;
  }else{
    const OP=[['a','Time A'],['b','Time B'],['f','Fora']];
    h+=`<fieldset class="col"><div class="row between wrapx"><legend>Monte os times <span class="mut sm">(${conv.length?conv.length+' confirmaram presença · ':''}os primeiros ${n} de cada time começam, o resto fica no banco)</span></legend><button type="button" class="btn sm" data-a="sortear">Sortear times equilibrados</button></div>${pool.map((a,i)=>linha(a,'t',OP,i%2?'b':'a',` data-pool="${a.id}"`)).join('')}</fieldset>`;
    if(fora.length)h+=`<details class="pn"><summary>Não confirmaram (${fora.length})</summary><div class="in">${fora.map(a=>linha(a,'t',OP,'f')).join('')}</div></details>`;
  }
  return h+`<div class="row" style="justify-content:flex-end"><button type="submit" class="btn y big">Começar partida</button></div></form>`;
}
function statRow(lbl,a,b){const t=a+b||1;return `<div><span class="lbl">${lbl}</span><div class="statbar"><b>${a}</b><div class="bar"><i style="width:${a/t*100}%"></i><i style="width:${b/t*100}%"></i></div><b>${b}</b></div></div>`;}
function lanceIc(l){return l.tipo==='gol'?IC.ball:l.tipo==='amarelo'?'<span class="ca"></span>':l.tipo==='vermelho'?'<span class="ca v"></span>':l.tipo==='sub'?IC.sub:l.tipo==='defesa'||l.tipo==='penalti_defendido'?IC.glove:IC.target;}
function lanceTxt(l,nA,nB){
  const nm=l.aluno?nomeDe(l.aluno):(l.time==='a'?nA:nB);
  switch(l.tipo){
    case 'gol':return `<b>Gol${DET[l.detalhe]?' '+DET[l.detalhe]:''}</b> · ${esc(nm)}${l.assist?`<br><span class="mut sm">Assistência: ${esc(nomeDe(l.assist))}</span>`:''}`;
    case 'chute':return `${l.detalhe==='gol'?'Chute no gol':'Chute para fora'} · ${esc(nm)}`;
    case 'defesa':return `Defesa · ${esc(nm)}`;
    case 'penalti_defendido':return `<b>Pênalti defendido</b> · ${esc(nm)}`;
    case 'amarelo':return `Cartão amarelo · ${esc(nm)}`;
    case 'vermelho':return `<b>Cartão vermelho</b> · ${esc(nm)}${l.detalhe==='2am'?' (segundo amarelo)':''}`;
    case 'sub':return `Substituição ${esc(l.time==='a'?nA:nB)}: entra <b>${esc(nomeDe(l.entra))}</b>, sai ${esc(nomeDe(l.sai))}`;
    case 'marco':return `<span class="mut">${esc(l.texto)}</span>`;
  }
  return '';
}
function timeline(lances,nA,nB,edit){
  if(!lances.length)return '<p class="mut sm">Nenhum lance registrado ainda.</p>';
  return lances.slice().reverse().map(l=>`<div class="lance${l.tipo==='gol'?' gol':''}"><span class="min">${esc(l.min)}</span><span class="ic">${lanceIc(l)}</span><div style="flex:1">${lanceTxt(l,nA,nB)}</div>${edit&&['gol','chute','defesa','penalti_defendido','amarelo'].includes(l.tipo)?`<button type="button" class="btn o sm" data-a="delLance" data-v="${l.id}" aria-label="Remover lance">${IC.x}</button>`:''}</div>`).join('');
}
function vLive(){
  const L=S.live,e=ev(L.ev);if(!e){S.live=null;return vAoVivo();}
  const reg=L.dur*60,extra=L.seg>reg;
  let faseBtn='';
  if(L.fase==='intervalo')faseBtn=`<button type="button" class="btn y" data-a="segTempo">Começar 2º tempo</button>`;
  else if(L.tempos===2&&L.periodo===1)faseBtn=`<button type="button" class="btn" data-a="fimTempo">Encerrar 1º tempo</button>`;
  let h=`<div class="head"><div><p style="color:var(--y);font-weight:700">Ao vivo · ${esc(e.sub)} · ${catNome(e.cat)} · ${L.n} x ${L.n}</p><h1>${esc(nomeTime(L,'a'))} x ${esc(nomeTime(L,'b'))}</h1></div><div class="row wrapx"><button type="button" class="btn o" data-a="undoLive"${L.undo.length?'':' disabled'}>${IC.undo}Desfazer</button><button type="button" class="btn o" data-a="liveLousa">${IC.field}Abrir na lousa</button><button type="button" class="btn" data-a="estadio">${ui.estadio?'Sair do modo estádio':'Modo estádio'}</button><button type="button" class="btn o" data-a="descartar">${ui.descConfirm?'Confirmar descarte':'Descartar'}</button><button type="button" class="btn r" data-a="encerrar">Encerrar partida</button></div></div>`;
  h+=`<div class="livegrid"><div class="col" style="gap:16px">`;
  h+=`<section class="card col placarbox" style="gap:16px"><div class="placar"><div><div class="t">${esc(nomeTime(L,'a'))}</div><div class="n">${L.placar.a}</div></div><div><div id="timer">${fmtT(Math.min(L.seg,reg))}</div><div id="timerExtra">${extra?'+'+fmtT(L.seg-reg):''}</div><span class="fase${L.rodando?' on':''}">${L.fase==='intervalo'?'Intervalo':(L.tempos===1?'Tempo único':L.periodo+'º tempo')+(L.rodando?' · rolando':' · parado')}</span></div><div><div class="t">${esc(nomeTime(L,'b'))}</div><div class="n">${L.placar.b}</div></div></div>`;
  h+=`<div class="row wrapx" style="justify-content:center"><button type="button" class="btn w" data-a="cron"${L.fase==='intervalo'?' disabled':''}>${L.rodando?IC.pause+'Pausar':IC.play+'Iniciar'}</button><button type="button" class="btn o sm" data-a="ajTempo" data-v="-60">−1 min</button><button type="button" class="btn o sm" data-a="ajTempo" data-v="60">+1 min</button>${faseBtn}</div><p class="xs mut" style="text-align:center">${L.tempos===2?'2 tempos':'Tempo único'} de ${L.dur} min. O cronômetro segue nos acréscimos até você encerrar o tempo.</p></section>`;
  const acoes=t=>{const temJog=!!L.campo[t];return `<div class="col" style="gap:8px"><b>${esc(nomeTime(L,t))}</b><div class="acoes"><button type="button" class="btn ${t==='a'?'y':'w'}" data-a="tmAcao" data-v="${t}|gol">Gol</button><button type="button" class="btn" data-a="tmAcao" data-v="${t}|chuteGol">Chute no gol</button><button type="button" class="btn" data-a="tmAcao" data-v="${t}|chuteFora">Chute fora</button><button type="button" class="btn" data-a="tmAcao" data-v="${t}|escanteio">Escanteio</button><button type="button" class="btn" data-a="tmAcao" data-v="${t}|falta">Falta</button><button type="button" class="btn" data-a="tmAcao" data-v="${t}|cartao">Cartão</button>${temJog?`<button type="button" class="btn" data-a="tmAcao" data-v="${t}|sub">${IC.sub}Substituir</button><button type="button" class="btn" data-a="tmAcao" data-v="${t}|penDef">Pênalti defendido</button>`:''}</div></div>`;};
  h+=`<section class="card"><div class="grid2">${acoes('a')}${acoes('b')}</div><p class="xs mut" style="margin-top:10px">Toque em um jogador na lista "Em campo" para registrar o lance direto no nome dele.</p></section>`;
  const sa=L.stats.a,sb=L.stats.b;
  h+=`<section class="card col"><h2>Estatísticas</h2><div class="row between sm"><b>${esc(nomeTime(L,'a'))}</b><b>${esc(nomeTime(L,'b'))}</b></div>${statRow('Chutes',sa.chutes,sb.chutes)}${statRow('Chutes no gol',sa.noGol,sb.noGol)}${statRow('Escanteios',sa.escanteios,sb.escanteios)}${statRow('Faltas cometidas',sa.faltas,sb.faltas)}${statRow('Cartões amarelos',sa.amarelos,sb.amarelos)}${statRow('Cartões vermelhos',sa.vermelhos,sb.vermelhos)}</section>`;
  h+=`</div><div class="col" style="gap:16px">`;
  h+=`<section class="card col"><div class="row between"><h2>Campo</h2><span class="xs mut">Toque em um jogador para registrar lance ou substituir</span></div><div class="campo">${miniCampo(L)}</div></section>`;
  h+=vReservas(L,e);
  const golsDe=id=>L.lances.filter(l=>l.tipo==='gol'&&l.aluno===id).length;
  ['a','b'].forEach(t=>{if(!L.campo[t])return;
    h+=`<details class="pn"><summary>Em campo · ${esc(nomeTime(L,t))} (${L.campo[t].length}/${L.n})</summary><div class="in">${L.campo[t].map(id=>{const a=al(id),c=L.cart[id]||{};return `<button type="button" class="pl${t==='b'?' b':''}" data-a="plAbrir" data-v="${t}|${id}"><span class="nr">${a&&a.num!=null?a.num:'–'}</span><span style="flex:1"><b>${esc(nomeDe(id))}</b><br><span class="xs mut">${a?posTxt(a):''} · <span data-minp="${id}">${minJog(L,id)}</span> min</span></span>${c.am?'<span class="ca" title="Amarelo"></span>':''}${golsDe(id)?`<span class="bdg y">${golsDe(id)} gol${golsDe(id)>1?'s':''}</span>`:''}</button>`;}).join('')}`;
    const exp=L.expulsos.filter(id=>L.time[id]===t);if(exp.length)h+=`<b class="sm" style="color:var(--red)">Expulsos</b>${exp.map(id=>`<span class="sm">${esc(nomeDe(id))} · ${minJog(L,id)} min</span>`).join('')}`;
    h+='</div></details>';});
  h+=`<section class="card col"><h2>Lances</h2>${timeline(L.lances,nomeTime(L,'a'),nomeTime(L,'b'),true)}</section></div></div>`;
  return h;
}
function miniCampo(L){
  const W=1000,H=640;
  let h=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Jogadores em campo"><rect width="${W}" height="${H}" fill="#1D5A31"/>`;
  for(let k=0;k<10;k+=2)h+=`<rect x="${k*100}" width="100" height="${H}" fill="#21633A"/>`;
  h+=`<g fill="none" stroke="#E8F0E4" stroke-opacity=".75" stroke-width="3"><rect x="16" y="16" width="968" height="608"/><line x1="500" y1="16" x2="500" y2="624"/><circle cx="500" cy="320" r="78"/><rect x="16" y="170" width="140" height="300"/><rect x="844" y="170" width="140" height="300"/></g>`;
  const lin=FORM[L.n][fPad(L.n)],ps=formar(lin);
  const lado=t=>{const ids=ordenar(L.campo[t].map(al).filter(Boolean)).map(a=>a.id);
    ids.forEach((id,i)=>{const p=ps[i]||{x:.3,y:.5},x=(t==='a'?p.x:1-p.x)*W,y=p.y*H,a=al(id),c=L.cart[id]||{},fill=t==='a'?'#F7C600':'#F3F0E6';
      h+=`<g data-a="plAbrir" data-v="${t}|${id}" transform="translate(${x} ${y})" style="cursor:pointer"><circle r="30" fill="${fill}" stroke="#0A0A08" stroke-width="3"/><text y="9" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="800" font-size="26" fill="#0A0A08">${a&&a.num!=null?a.num:esc(iniciais(a.nome))}</text><text y="56" text-anchor="middle" font-family="Barlow,sans-serif" font-weight="700" font-size="21" fill="#FFFFFF" stroke="#0A0A08" stroke-width="5" paint-order="stroke">${esc(primeiro(a.nome))}</text>${c.am?'<rect x="18" y="-34" width="12" height="17" rx="2" fill="#F7C600" stroke="#0A0A08" stroke-width="2"/>':''}</g>`;});};
  lado('a');
  if(L.campo.b)lado('b');
  else ps.forEach((p,i)=>{h+=`<g transform="translate(${(1-p.x)*W} ${p.y*H})" opacity=".55"><circle r="26" fill="#C0392B" stroke="#0A0A08" stroke-width="3"/><text y="8" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="800" font-size="22" fill="#FFFFFF">${i+1}</text></g>`;});
  return h+'</svg>';
}
function vReservas(L,e){
  const coletivo=!L.jogo;
  const linhaDisp=(a,rotulo)=>`<div class="row between wrapx" data-res="${esc(semAcento(a.nome).toLowerCase())}" style="border-top:1px solid var(--line);padding:6px 0"><span class="who">${avatar(a,32)}<span><b>${esc(a.nome)}</b><br><span class="xs mut">${posTxt(a)}${a.num!=null?' · '+a.num:''} · ${rotulo}</span></span></span><span class="row">${coletivo?`<button type="button" class="btn y sm" data-a="addRes" data-v="a|${a.id}">Time A</button><button type="button" class="btn w sm" data-a="addRes" data-v="b|${a.id}">Time B</button>`:`<button type="button" class="btn y sm" data-a="addRes" data-v="a|${a.id}">Relacionar</button>`}</span></div>`;
  let banco='';
  ['a','b'].forEach(t=>{if(!L.campo[t])return;porPosicao(L.banco[t].map(al).filter(Boolean)).map(a=>a.id).forEach(id=>{const a=al(id);if(!a)return;banco+=`<div class="row between wrapx" data-res="${esc(semAcento(a.nome).toLowerCase())}" style="border-top:1px solid var(--line);padding:6px 0"><span class="who">${avatar(a,32)}<span><b>${esc(a.nome)}</b><br><span class="xs mut">No banco do ${esc(nomeTime(L,t))} · ${minJog(L,id)} min jogados</span></span></span><button type="button" class="btn sm" data-a="entrar" data-v="${t}|${id}">Entrar</button></div>`;});});
  const livres=porPosicao(alunosCat(e.cat).filter(a=>!(a.id in L.time)));
  const outros=S.alunos.filter(a=>a.cat!==e.cat&&!(a.id in L.time)).sort((x,y)=>x.cat.localeCompare(y.cat)||x.nome.localeCompare(y.nome));
  let h=`<section class="card col"><div class="row between wrapx"><h2>Reservas</h2><input class="inp sm" data-in="buscaRes" placeholder="Buscar aluno" aria-label="Buscar aluno na lista de reservas" style="max-width:220px"></div>`;
  h+=`<p class="xs mut">${coletivo?'Chegou alguém que não confirmou presença? Coloque no Time A ou B. Se o time estiver completo, ele vai para o banco. A presença dele é marcada automaticamente.':'Relacione quem chegou sem ter sido convocado. Ele entra no banco e a presença é marcada.'}</p>`;
  h+=`<div class="col" style="gap:0;max-height:460px;overflow:auto">`;
  h+=banco||'<span class="xs mut" style="padding:4px 0">Ninguém no banco.</span>';
  if(livres.length)h+=`<b class="sm" style="margin-top:10px">${catNome(e.cat)} · ${coletivo?'não confirmaram':'não convocados'} (${livres.length})</b>`+livres.map(a=>linhaDisp(a,coletivo?'não confirmou':'não convocado')).join('');
  if(outros.length)h+=`<details class="pn" style="margin-top:10px"><summary>Outras categorias (${outros.length})</summary><div class="in">${outros.map(a=>linhaDisp(a,catNome(a.cat))).join('')}</div></details>`;
  return h+'</div></section>';
}
function mutLive(fn){const L=S.live;const snap=clone(Object.assign({},L,{undo:[]}));L.undo.push(snap);if(L.undo.length>40)L.undo.shift();fn(L);save();}
function addLance(L,o){L.lances.push(Object.assign({id:uid(),min:minLabel(L),gs:gameSec(L),aluno:null,assist:null,detalhe:'normal'},o));}
function tirarDeCampo(L,id){const t=L.time[id];L.minutos[id]=(L.minutos[id]||0)+(L.entrou[id]!=null?Math.max(0,gameSec(L)-L.entrou[id]):0);delete L.entrou[id];L.campo[t]=L.campo[t].filter(x=>x!==id);}
function cartao(L,t,id,cor){
  const s=L.stats[t];
  if(!id){if(cor==='amarelo')s.amarelos++;else s.vermelhos++;addLance(L,{time:t,tipo:cor});return;}
  const c=L.cart[id]||(L.cart[id]={am:0,vm:false});
  if(cor==='amarelo'){c.am++;s.amarelos++;addLance(L,{time:t,tipo:'amarelo',aluno:id});if(c.am>=2){c.vm=true;s.vermelhos++;addLance(L,{time:t,tipo:'vermelho',aluno:id,detalhe:'2am'});tirarDeCampo(L,id);L.expulsos.push(id);toast(pNome(id)+' recebeu o segundo amarelo e foi expulso.');}}
  else{c.vm=true;s.vermelhos++;addLance(L,{time:t,tipo:'vermelho',aluno:id});tirarDeCampo(L,id);L.expulsos.push(id);}
}
function resumoHTML(o){
  const art={},ass={};o.lances.forEach(l=>{if(l.tipo==='gol'&&l.aluno)art[l.aluno]=(art[l.aluno]||0)+1;if(l.tipo==='gol'&&l.assist)ass[l.assist]=(ass[l.assist]||0)+1;});
  const lst=m=>Object.keys(m).sort((x,y)=>m[y]-m[x]).map(id=>`${esc(pNome(id))} (${m[id]})`).join(', ')||'—';
  let h=`<div class="placar"><div><div class="t">${esc(o.nA)}</div><div class="n" style="font-size:64px">${o.placar.a}</div></div><div class="mut">x</div><div><div class="t">${esc(o.nB)}</div><div class="n" style="font-size:64px">${o.placar.b}</div></div></div>`;
  h+=`<div class="grid2"><div class="card flat"><span class="xs mut">Gols</span><br>${lst(art)}</div><div class="card flat"><span class="xs mut">Assistências</span><br>${lst(ass)}</div></div>`;
  if(o.stats)h+=`<div class="card flat col">${statRow('Chutes',o.stats.a.chutes,o.stats.b.chutes)}${statRow('Chutes no gol',o.stats.a.noGol,o.stats.b.noGol)}${statRow('Escanteios',o.stats.a.escanteios,o.stats.b.escanteios)}${statRow('Faltas',o.stats.a.faltas,o.stats.b.faltas)}${statRow('Cartões',o.stats.a.amarelos+o.stats.a.vermelhos,o.stats.b.amarelos+o.stats.b.vermelhos)}</div>`;
  if(o.part&&o.part.length)h+=`<div class="col" style="gap:6px"><b>Minutos jogados</b><div class="checks">${o.part.slice().sort((x,y)=>(o.minutos[y]||0)-(o.minutos[x]||0)).map(id=>`<span class="bdg">${esc(pNome(id))} · ${o.minutos[id]||0} min</span>`).join('')}</div></div>`;
  h+=`<div class="col" style="gap:6px"><b>Linha do tempo</b>${timeline(o.lances.filter(l=>l.tipo!=='chute'),o.nA,o.nB,false)}</div>`;
  if(o.obs)h+=`<div class="card flat"><span class="xs mut">Observação do professor</span><p>${esc(o.obs)}</p></div>`;
  return h;
}

/* ================= LOUSA ================= */
const fullAtivo=()=>!!(ui.lousaFull&&ui.role==='professor'&&ui.tela.professor==='lousa');
const vertNow=()=>fullAtivo()&&window.innerHeight>window.innerWidth*1.05;
const campoId=()=>fullAtivo()?'campoFull':'campo';
const getView=L=>L.vw||(L.campo==='meio'?{x:460,y:0,w:540,h:640}:{x:0,y:0,w:1000,h:640});
const VB=(L,v)=>{const g=getView(L);return v?`${640-(g.y+g.h)} ${g.x} ${g.h} ${g.w}`:`${g.x} ${g.y} ${g.w} ${g.h}`;};
function clampView(g){g.w=Math.min(1000,Math.max(200,g.w));g.h=Math.min(640,Math.max(128,g.h));g.x=Math.min(1000-g.w,Math.max(0,g.x));g.y=Math.min(640-g.h,Math.max(0,g.y));return g;}
function zoomView(L,f,base){const g=Object.assign({},base||getView(L)),cx=g.x+g.w/2,cy=g.y+g.h/2;let w=g.w/f,h=g.h/f;const k=Math.max(w/1000,h/640,1);w/=k;h/=k;const m=Math.max(200/w,128/h,1);w*=m;h*=m;L.vw=clampView({x:cx-w/2,y:cy-h/2,w,h});}
const zoomPct=L=>Math.round(1000/getView(L).w*100);
function wavy(x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,n=Math.max(4,Math.round(len/26)),px=-dy/len,py=dx/len;let d=`M${x1} ${y1}`;for(let i=1;i<n;i++){const t=i/n,o=(i%2?1:-1)*8;d+=` L${x1+dx*t+px*o} ${y1+dy*t+py*o}`;}return d+` L${x2} ${y2}`;}
function itensSVG(its,W,H,edit,v){const rv=v?' rotate(-90)':'';return its.map(it=>{
  const da=edit?` data-it="${it.id}"`:'';
  if(it.tipo==='zona')return `<rect${da} x="${it.x*W}" y="${it.y*H}" width="${it.w*W}" height="${it.h*H}" rx="10" fill="#F7C600" fill-opacity=".18" stroke="#F7C600" stroke-width="3" stroke-dasharray="10 8"/>`;
  if(it.tipo==='cone')return `<g${da} transform="translate(${it.x*W} ${it.y*H})${rv}"><path d="M0 -16 L11 10 H-11 Z" fill="#F08A24" stroke="#0A0A08" stroke-width="2"/></g>`;
  if(it.tipo==='livre')return `<polyline${da} points="${it.pts.map((v,i)=>i%2?v*H:v*W).join(' ')}" fill="none" stroke="#F3F0E6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  const x1=it.x1*W,y1=it.y1*H,x2=it.x2*W,y2=it.y2*H;
  if(it.estilo==='conducao')return `<path${da} d="${wavy(x1,y1,x2,y2)}" fill="none" stroke="#F3F0E6" stroke-width="4" marker-end="url(#pt)"/>`;
  return `<line${da} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#F3F0E6" stroke-width="4" marker-end="url(#pt)"${it.estilo==='passe'?' stroke-dasharray="12 9"':''}/>`;
}).join('');}
function campoSVG(L,edit,v){
  const W=1000,H=640,rv=v?' rotate(-90)':'';
  let h=`<svg viewBox="${VB(L,v)}" role="img" aria-label="Campo com ${L.casa.length} jogadores da ${esc(NOME_CURTO)} e ${L.fora.length} do ${esc(L.advNome)}"><defs><marker id="pt" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#F3F0E6"/></marker></defs><g id="fg"${v?' transform="translate(640 0) rotate(90)"':''}>`;
  h+=`<rect width="${W}" height="${H}" fill="#1D5A31"/>`;for(let k=0;k<10;k+=2)h+=`<rect x="${k*100}" width="100" height="${H}" fill="#21633A"/>`;
  h+=`<g fill="none" stroke="#E8F0E4" stroke-opacity=".75" stroke-width="3"><rect x="16" y="16" width="968" height="608"/><line x1="500" y1="16" x2="500" y2="624"/><circle cx="500" cy="320" r="78"/><rect x="16" y="170" width="140" height="300"/><rect x="844" y="170" width="140" height="300"/><rect x="16" y="250" width="52" height="140"/><rect x="932" y="250" width="52" height="140"/><circle cx="110" cy="320" r="3" fill="#E8F0E4"/><circle cx="890" cy="320" r="3" fill="#E8F0E4"/></g>`;
  h+=`<g transform="translate(500 320) scale(1.9)${rv}" opacity=".4"><path d="M0 -24 L18 -18 V-4 C18 8 10 16 0 20 C-10 16 -18 8 -18 -4 V-18 Z" fill="#F7C600"/><text y="4" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="800" font-size="14" fill="#0A0A08">CP</text></g>`;
  h+=itensSVG(L.itens,W,H,edit,v)+'<g id="tmp"></g>';
  const tc=L.advCor==='#E8E6DF'?'#0A0A08':'#FFFFFF';
  const lbl=(nm,y)=>L.mostrarNomes&&nm?`<text y="${y}" text-anchor="middle" font-family="Barlow,sans-serif" font-weight="700" font-size="17" fill="#FFFFFF" stroke="#0A0A08" stroke-width="4" paint-order="stroke">${esc(nm)}</text>`:'';
  if(L.mostrarAdv)L.fora.forEach((p,i)=>{const s=L.sel==='f:'+i;h+=`<g data-pl="f:${i}" transform="translate(${p.x*W} ${p.y*H})${rv}">${s?'<circle r="32" fill="none" stroke="#F7C600" stroke-width="3"/>':''}<circle r="24" fill="${L.advCor}" stroke="#0A0A08" stroke-width="3"/><text y="7" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="800" font-size="21" fill="${tc}">${esc(p.num)}</text>${lbl(p.nome,46)}</g>`;});
  L.casa.forEach((p,i)=>{const s=L.sel==='c:'+i;h+=`<g data-pl="c:${i}" transform="translate(${p.x*W} ${p.y*H})${rv}">${s?'<circle r="32" fill="none" stroke="#FFFFFF" stroke-width="3"/>':''}<circle r="24" fill="#F7C600" stroke="#0A0A08" stroke-width="3"${L.benchSel?' stroke-dasharray="5 4"':''}/><text y="7" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="800" font-size="21" fill="#0A0A08">${esc(p.num)}</text>${lbl(p.nome,46)}</g>`;});
  h+=`<g data-pl="bola" transform="translate(${L.bola.x*W} ${L.bola.y*H})${rv}"><circle r="11" fill="#FFFFFF" stroke="#0A0A08" stroke-width="3"/><path d="M-4 -3 L0 -6 L4 -3 L3 2 L-3 2 Z" fill="#0A0A08"/></g>`;
  return h+'</g></svg>';
}
/* ---------- linha de reservas embaixo do campo ----------
   Arraste um reserva para cima de um titular (ou um titular para cima de um reserva) e os dois trocam.
   Também dá para tocar no reserva e depois no titular. */
const reservasLz=L=>{const em=new Set(L.casa.map(p=>p.aid).filter(Boolean));return porPosicao(alunosCat(L.cat).filter(a=>!em.has(a.id)));};
function bancoLz(L){
  const b=reservasLz(L);
  return `<div class="lzbanco" aria-label="Reservas"><span class="lzbanco-t">Reservas<small>arraste para trocar</small></span><div class="lzbanco-l">${b.length?b.map(a=>`<button type="button" class="res" data-res="${a.id}" data-a="bench" data-v="${a.id}" aria-pressed="${L.benchSel===a.id}" aria-label="${esc(a.nome)}, reserva"><i>${esc(a.num!=null?a.num:'')}</i><span>${esc(primeiro(a.nome))}</span><small>${esc(a.pos[0]||'')}</small></button>`).join(''):'<span class="mut sm">Todo o elenco está em campo.</span>'}</div></div>`;
}
function trocarTitular(L,i,resId){
  const a=al(resId),p=L.casa[i];if(!a||!p)return;
  pushUndo(L);const saiu=p.aid?primeiro(p.nome):'';
  Object.assign(p,{aid:a.id,num:a.num!=null?a.num:'',nome:primeiro(a.nome)});L.benchSel=null;L.sel=null;
  render();toast(primeiro(a.nome)+' entrou'+(saiu?', '+saiu+' foi para a reserva.':' em campo.'));
}
function bindBanco(L){
  document.querySelectorAll('.lzbanco [data-res]').forEach(btn=>btn.addEventListener('pointerdown',ev=>{
    if(L.playing)return;
    const id=btn.dataset.res,pid=ev.pointerId,sx=ev.clientX,sy=ev.clientY;let fan=null,alvo=null;
    const marca=g=>{if(alvo===g)return;if(alvo)alvo.classList.remove('alvo');alvo=g;if(alvo)alvo.classList.add('alvo');};
    const mover=e=>{if(e.pointerId!==pid)return;
      if(!fan){if(Math.hypot(e.clientX-sx,e.clientY-sy)<8)return;fan=btn.cloneNode(true);fan.classList.add('fantasma');fan.removeAttribute('data-a');document.body.appendChild(fan);}
      fan.style.left=e.clientX+'px';fan.style.top=e.clientY+'px';
      fan.style.visibility='hidden';const el=document.elementFromPoint(e.clientX,e.clientY);fan.style.visibility='';
      marca(el&&el.closest('.campo [data-pl^="c:"]'));};
    const fim=e=>{if(e.pointerId!==pid)return;
      window.removeEventListener('pointermove',mover);window.removeEventListener('pointerup',fim);window.removeEventListener('pointercancel',fim);
      if(!fan)return;fan.remove();const g=alvo;marca(null);
      if(e.type==='pointerup'&&g)trocarTitular(L,+g.getAttribute('data-pl').split(':')[1],id);};
    window.addEventListener('pointermove',mover);window.addEventListener('pointerup',fim);window.addEventListener('pointercancel',fim);
  }));
}
// Reserva embaixo do ponto (para soltar um titular em cima dele)
const resEm=(x,y)=>{const el=document.elementFromPoint(x,y);return el&&el.closest('.lzbanco [data-res]');};
function pushUndo(L){L.undo.push(JSON.stringify(snapL(L)));if(L.undo.length>50)L.undo.shift();L.redo=[];}
function bindCampo(L,edit){
  const v=edit&&vertNow(),box=document.getElementById(edit?campoId():'campo');if(!box||!L)return;
  box.className='campo t-'+(edit?(['passe','movimento','conducao'].includes(L.ferramenta)?'seta':L.ferramenta):'ver');
  box.innerHTML=campoSVG(L,edit,v);
  if(!edit)return;
  // Multitoque: cada dedo arrasta a sua peça (vários jogadores ao mesmo tempo). Pinça e "mão" só com dedos fora das peças.
  const svg=box.querySelector('svg'),drags=new Map(),livres=new Map();let pinca=null,grupo=null;
  const atualizaVB=()=>{svg.setAttribute('viewBox',VB(L,v));document.querySelectorAll('[data-zoom]').forEach(e=>{e.textContent=zoomPct(L)+'%';});};
  svg.addEventListener('wheel',ev=>{ev.preventDefault();zoomView(L,ev.deltaY<0?1.15:1/1.15);atualizaVB();},{passive:false});
  const pt=ev=>{const p=svg.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;const fg=svg.querySelector('#fg')||svg,q=p.matrixTransform(fg.getScreenCTM().inverse());return {x:clamp(q.x/1000),y:clamp(q.y/640)};};
  const limpaTmp=()=>{const t=document.getElementById('tmp');if(t)t.innerHTML='';};
  const desenhando=()=>[...drags.values()].some(d=>d.f);
  const prende=id=>{try{svg.setPointerCapture(id);}catch(e){}};
  svg.addEventListener('pointerdown',ev=>{
    const f=L.ferramenta,p=pt(ev),g=ev.target.closest('[data-pl]'),it=ev.target.closest('[data-it]');
    let o=null,k=null,gEl=g;
    if(f==='mover'||f==='mao'){
      if(g){k=g.getAttribute('data-pl');if(k==='bola')o=L.bola;else{const q=k.split(':');o=(q[0]==='c'?L.casa:L.fora)[+q[1]];}}
      else if(it){const x=L.itens.find(z=>z.id===it.getAttribute('data-it'));if(x&&x.tipo==='cone'){o=x;k='it';gEl=it;}}
    }
    if(o&&f==='mover'&&!L.playing){
      if(!drags.size)grupo={snap:JSON.stringify(snapL(L)),mov:false};
      drags.set(ev.pointerId,{g:gEl,o,k,mov:false,sx:ev.clientX,sy:ev.clientY,ox:o.x,oy:o.y});prende(ev.pointerId);return;
    }
    // Dedo fora das peças: pode virar pinça (zoom), mão (arrastar o campo) ou desenho
    livres.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(livres.size===2){const [a,b]=[...livres.values()];pinca={d0:Math.hypot(a.x-b.x,a.y-b.y)||1,g0:Object.assign({},getView(L))};
      livres.forEach((_,id)=>{const d=drags.get(id);if(d&&(d.f||d.pan))drags.delete(id);});limpaTmp();return;}
    if(L.playing)return;
    if(f==='mao'){drags.set(ev.pointerId,{pan:true,sx:ev.clientX,sy:ev.clientY,g0:Object.assign({},getView(L))});prende(ev.pointerId);return;}
    if(f==='borracha'){if(it){pushUndo(L);L.itens=L.itens.filter(x=>x.id!==it.getAttribute('data-it'));bindCampo(L,true);}return;}
    if(f==='cone'){pushUndo(L);L.itens.push({id:uid(),tipo:'cone',x:p.x,y:p.y});bindCampo(L,true);return;}
    if(['passe','movimento','conducao','livre','zona'].includes(f)&&!desenhando()){drags.set(ev.pointerId,{f,x1:p.x,y1:p.y,pts:[p.x,p.y]});prende(ev.pointerId);}
  });
  svg.addEventListener('pointermove',ev=>{
    if(livres.has(ev.pointerId))livres.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(pinca&&livres.size===2&&livres.has(ev.pointerId)){const [a,b]=[...livres.values()];zoomView(L,Math.hypot(a.x-b.x,a.y-b.y)/pinca.d0,pinca.g0);atualizaVB();return;}
    const d=drags.get(ev.pointerId);if(!d)return;
    if(d.pan){const r=svg.getBoundingClientRect(),g0=d.g0,dx=ev.clientX-d.sx,dy=ev.clientY-d.sy,sc=(v?g0.h:g0.w)/r.width,g=Object.assign({},g0);
      if(v){g.y=g0.y+dx*sc;g.x=g0.x-dy*sc;}else{g.x=g0.x-dx*sc;g.y=g0.y-dy*sc;}L.vw=clampView(g);atualizaVB();return;}
    const p=pt(ev),tmp=document.getElementById('tmp');
    if(d.f){
      if(d.f==='livre'){d.pts.push(p.x,p.y);tmp.innerHTML=`<polyline points="${d.pts.map((v,i)=>i%2?v*640:v*1000).join(' ')}" fill="none" stroke="#F7C600" stroke-width="4"/>`;}
      else if(d.f==='zona'){const x=Math.min(p.x,d.x1),y=Math.min(p.y,d.y1);tmp.innerHTML=`<rect x="${x*1000}" y="${y*640}" width="${Math.abs(p.x-d.x1)*1000}" height="${Math.abs(p.y-d.y1)*640}" fill="#F7C600" fill-opacity=".2" stroke="#F7C600" stroke-width="3"/>`;}
      else tmp.innerHTML=`<line x1="${d.x1*1000}" y1="${d.y1*640}" x2="${p.x*1000}" y2="${p.y*640}" stroke="#F7C600" stroke-width="4"/>`;
      return;}
    if(Math.abs(ev.clientX-d.sx)+Math.abs(ev.clientY-d.sy)>4)d.mov=true;
    if(!d.mov)return;if(grupo)grupo.mov=true;d.o.x=p.x;d.o.y=p.y;
    if(d.k.charAt(0)==='c'){const r=resEm(ev.clientX,ev.clientY);if(d.res!==r){if(d.res)d.res.classList.remove('alvo');d.res=r;if(r)r.classList.add('alvo');}}
    d.g.setAttribute('transform',`translate(${p.x*1000} ${p.y*640})${v?' rotate(-90)':''}`);
  });
  // Quando o último dedo que arrastava peças sai, grava um único "desfazer" para todos os movimentos juntos
  const fechaGrupo=()=>{if(grupo&&![...drags.values()].some(x=>x.o)){if(grupo.mov){L.undo.push(grupo.snap);if(L.undo.length>50)L.undo.shift();L.redo=[];
    // Arrastar não redesenha a tela: libera o botão "desfazer" que estava desabilitado
    document.querySelectorAll('[data-a=lzUndo]').forEach(b=>{b.disabled=false;});}grupo=null;}};
  const solta=ev=>{livres.delete(ev.pointerId);if(livres.size<2)pinca=null;};
  svg.addEventListener('pointercancel',ev=>{solta(ev);const d=drags.get(ev.pointerId);drags.delete(ev.pointerId);if(d&&d.f)limpaTmp();fechaGrupo();});
  svg.addEventListener('pointerup',ev=>{
    solta(ev);
    const d=drags.get(ev.pointerId);if(!d)return;drags.delete(ev.pointerId);
    if(d.pan)return;
    const p=pt(ev);
    if(d.f){
      if(d.f==='livre'){if(d.pts.length>6){pushUndo(L);L.itens.push({id:uid(),tipo:'livre',pts:d.pts});}}
      else if(d.f==='zona'){if(Math.abs(p.x-d.x1)>.02&&Math.abs(p.y-d.y1)>.02){pushUndo(L);L.itens.push({id:uid(),tipo:'zona',x:Math.min(p.x,d.x1),y:Math.min(p.y,d.y1),w:Math.abs(p.x-d.x1),h:Math.abs(p.y-d.y1)});}}
      else if(Math.hypot(p.x-d.x1,p.y-d.y1)>.02){pushUndo(L);L.itens.push({id:uid(),tipo:'seta',estilo:d.f,x1:d.x1,y1:d.y1,x2:p.x,y2:p.y});}
      bindCampo(L,true);return;}
    if(d.res){d.res.classList.remove('alvo');const r=resEm(ev.clientX,ev.clientY);
      if(r){d.o.x=d.ox;d.o.y=d.oy;if(grupo&&!drags.size)grupo=null;trocarTitular(L,+d.k.split(':')[1],r.dataset.res);return;}}
    fechaGrupo();
    if(d.mov||drags.size)return;
    if(d.k==='bola'||d.k==='it')return;
    if(L.benchSel&&d.k.charAt(0)==='c'){trocarTitular(L,+d.k.split(':')[1],L.benchSel);return;}
    L.sel=L.sel===d.k?null:d.k;render();
  });
}
function aplicarQuadro(L,q){const s=clone(q);L.casa=s.casa;L.fora=s.fora;L.bola=s.bola;L.itens=s.itens||[];}
const flat=L=>{const a=[];L.casa.forEach(p=>a.push(+p.x.toFixed(4),+p.y.toFixed(4)));L.fora.forEach(p=>a.push(+p.x.toFixed(4),+p.y.toFixed(4)));a.push(+L.bola.x.toFixed(4),+L.bola.y.toFixed(4));return a;};
function aplicarFlat(L,a){let k=0;L.casa.forEach(p=>{if(k+1<a.length-2){p.x=a[k];p.y=a[k+1];}k+=2;});L.fora.forEach(p=>{if(k+1<a.length-2){p.x=a[k];p.y=a[k+1];}k+=2;});L.bola.x=a[a.length-2];L.bola.y=a[a.length-1];}
const fmtSeg=ms=>{const s=Math.max(0,ms)/1000;return s<60?s.toFixed(1).replace('.',',')+' s':Math.floor(s/60)+':'+pad(Math.floor(s%60))+' min';};
const gravando=()=>!!(ui.lousa&&ui.lousa.rec);
let recIv=null;
function iniciarGravacao(L){
  L.sel=null;L.benchSel=null;L.stop=true;
  const t0=Date.now();L.rec={t0,frames:[{t:0,p:flat(L)}],itens:[{t:0,its:clone(L.itens)}],ik:L.itens.map(i=>i.id).join()};
  clearInterval(recIv);
  recIv=setInterval(()=>{const G=L.rec;if(!G){clearInterval(recIv);return;}
    const t=Date.now()-G.t0,p=flat(L),last=G.frames[G.frames.length-1];
    if(p.join()!==last.p.join()){if(t-last.t>120)G.frames.push({t:t-50,p:last.p});G.frames.push({t,p});}
    const ik=L.itens.map(i=>i.id).join();if(ik!==G.ik){G.ik=ik;G.itens.push({t,its:clone(L.itens)});}
    document.querySelectorAll('[data-rectime]').forEach(e=>{e.textContent=fmtSeg(t);});
    if(t>=120000)pararGravacao(L,'Limite de 2 minutos atingido. Gravação parada.');
  },50);
}
function pararGravacao(L,msg){
  const G=L.rec;if(!G)return;clearInterval(recIv);recIv=null;
  const t=Math.max(Date.now()-G.t0,300);G.frames.push({t,p:flat(L)});
  L.gravacao={dur:t,nc:L.casa.length,nf:L.fora.length,frames:G.frames,itens:G.itens};delete L.rec;
  aplicarFlat(L,L.gravacao.frames[0].p);L.itens=clone(L.gravacao.itens[0].its);
  if(msg!==false)toast(msg||'Jogada gravada ('+fmtSeg(t)+'). Reproduza, salve com um nome ou exclua.');
}
function tocar(L,onEnd){
  const G=L.gravacao;if(!G||G.frames.length<2){toast('Grave uma jogada primeiro.');return;}
  L.playing=true;L.stop=false;render();
  const fr=G.frames,its=G.itens;let st=null,k=0;
  const box=()=>document.getElementById(L===ui.lousa?campoId():'campo');
  function passo(ts){
    if(L.stop){fim();return;}
    if(st==null)st=ts;const t=(ts-st)*(L.vel||1);
    while(k<fr.length-2&&fr[k+1].t<=t)k++;
    const A=fr[k],B=fr[k+1]||A,span=B.t-A.t,r=span>0?Math.min(1,Math.max(0,(t-A.t)/span)):1;
    aplicarFlat(L,A.p.map((v,i)=>v+((B.p[i]??v)-v)*r));
    let cur=its[0].its;for(const e of its){if(e.t<=t)cur=e.its;else break;}L.itens=cur;
    const b=box();if(b)b.innerHTML=campoSVG(L,false,L===ui.lousa&&vertNow());
    document.querySelectorAll('[data-recprog]').forEach(e=>{e.style.width=Math.min(100,t/G.dur*100)+'%';});
    document.querySelectorAll('[data-rectime]').forEach(e=>{e.textContent=fmtSeg(Math.min(t,G.dur))+' / '+fmtSeg(G.dur);});
    if(t<G.dur){requestAnimationFrame(passo);return;}
    if(L.loop&&!L.stop){st=null;k=0;setTimeout(()=>requestAnimationFrame(passo),600);return;}
    fim();
  }
  function fim(){L.playing=false;L.itens=clone(its[its.length-1].its);if(onEnd)onEnd();render();}
  requestAnimationFrame(passo);
}
function quadrosParaGravacao(q){
  const fr=[],its=[{t:0,its:clone(q[0].itens||[])}],N=24;let t=0;
  for(let i=0;i<q.length-1;i++){const A=flat(q[i]),B=flat(q[i+1]);
    for(let s=0;s<=N;s++){const r=s/N,e=r<.5?2*r*r:1-Math.pow(-2*r+2,2)/2;fr.push({t:t+s*1000/N,p:A.map((v,j)=>+(v+((B[j]??v)-v)*e).toFixed(4))});}
    its.push({t:t+1,its:clone(q[i+1].itens||[])});t+=1000;fr.push({t:t+400,p:B});t+=400;}
  return {dur:t,nc:q[0].casa.length,nf:q[0].fora.length,frames:fr,itens:its};
}
function vGravacao(L){
  if(L.rec)return `<div class="row between wrapx"><span class="recdot">● Gravando <span data-rectime>0,0 s</span></span><button type="button" class="btn big recstop" data-a="recStop">${IC.stopsq}Parar</button></div><p class="sm mut">Mova jogadores e bola e desenhe setas. Tudo está sendo gravado do jeito que você faz.</p>`;
  const G=L.gravacao;
  if(!G)return `<div class="row between wrapx"><b>Gravar jogada ensaiada</b><button type="button" class="btn big recbtn" data-a="recStart">${IC.recdot}Gravar</button></div><p class="sm mut">Monte a posição inicial, toque em Gravar e mova os jogadores, a bola e desenhe como a jogada acontece. Toque em Parar quando terminar.</p>`;
  return `<div class="row between wrapx"><b>Jogada gravada</b><span class="sm mut" data-rectime>${fmtSeg(G.dur)}</span></div><div class="prog"><i data-recprog style="width:0;animation:none"></i></div><div class="row wrapx">${L.playing?`<button type="button" class="btn w" data-a="lzStop">${IC.pause}Parar</button>`:`<button type="button" class="btn y" data-a="lzPlay">${IC.play}Reproduzir</button>`}<label class="sm mut" for="vel">Velocidade</label><select id="vel" class="inp sm" data-ch="lzVel">${[[.5,'0,5x'],[1,'1x'],[2,'2x']].map(v=>`<option value="${v[0]}"${L.vel===v[0]?' selected':''}>${v[1]}</option>`).join('')}</select><label class="toggle sm"><input type="checkbox" data-ch="lzLoop"${chk(L.loop)}>Repetir</label></div><div class="row wrapx"><button type="button" class="btn o sm" data-a="recStart"${L.playing?' disabled':''}>${IC.recdot}Gravar de novo</button><button type="button" class="btn r sm" data-a="recDel"${L.playing?' disabled':''}>Excluir gravação</button></div><p class="sm mut">Para guardar, dê um nome logo abaixo e toque em Salvar jogada.</p>`;
}
function animar(L,edit,onEnd){
  const fr=L.quadros;if(fr.length<2){toast('Salve pelo menos 2 quadros para animar.');return;}
  L.playing=true;L.stop=false;render();
  let i=0,t0=null;const DUR=1000/(L.vel||1),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  aplicarQuadro(L,fr[0]);
  const box=()=>document.getElementById(L===ui.lousa?campoId():'campo');
  function passo(ts){
    if(L.stop){fim();return;}
    if(!t0)t0=ts;const r=Math.min(1,(ts-t0)/DUR),t=ease(r),A=fr[i],B=fr[i+1];
    L.casa.forEach((p,k)=>{if(A.casa[k]&&B.casa[k]){p.x=lerp(A.casa[k].x,B.casa[k].x,t);p.y=lerp(A.casa[k].y,B.casa[k].y,t);}});
    L.fora.forEach((p,k)=>{if(A.fora[k]&&B.fora[k]){p.x=lerp(A.fora[k].x,B.fora[k].x,t);p.y=lerp(A.fora[k].y,B.fora[k].y,t);}});
    L.bola.x=lerp(A.bola.x,B.bola.x,t);L.bola.y=lerp(A.bola.y,B.bola.y,t);L.itens=clone(B.itens||[]);
    const b=box();if(b)b.innerHTML=campoSVG(L,false,L===ui.lousa&&vertNow());
    if(r<1){requestAnimationFrame(passo);return;}
    i++;t0=null;
    if(i<fr.length-1){setTimeout(()=>requestAnimationFrame(passo),300/(L.vel||1));return;}
    if(L.loop&&!L.stop){i=0;setTimeout(()=>{aplicarQuadro(L,fr[0]);requestAnimationFrame(passo);},700);return;}
    fim();
  }
  function fim(){L.playing=false;if(onEnd)onEnd();render();}
  requestAnimationFrame(passo);
}
function lousaDoLive(){
  const Lv=S.live,e=ev(Lv.ev),n=Lv.n,L=montarLousa([],e.cat,n);
  const ids=Lv.campo.a.slice(0,11),pa=formar(FORM[n][L.fa]);
  L.casa=ordenar(ids.map(al).filter(Boolean)).map((a,i)=>{const p=pa[i]||{x:.3,y:.5};return {aid:a.id,num:a.num!=null?a.num:'',nome:primeiro(a.nome),x:p.x,y:p.y};});
  if(Lv.campo.b){const pb=formar(FORM[n][L.fb]);L.fora=ordenar(Lv.campo.b.map(al).filter(Boolean)).map((a,i)=>{const p=pb[i]||{x:.3,y:.5};return {num:a.num!=null?a.num:i+1,nome:primeiro(a.nome),x:1-p.x,y:p.y};});L.advNome='Time B';L.advCor='#E8E6DF';}
  else L.advNome=Lv.adv;
  L.nome=(Lv.jogo?'Contra '+Lv.adv:'Coletivo')+' · '+fmtD(e.data);return L;
}
function vLousa(){
  if(!ui.lousa)ui.lousa=montarLousa(alunosCat(ui.catProf),ui.catProf,7);
  const L=ui.lousa,emCampo=new Set(L.casa.map(p=>p.aid).filter(Boolean));
  const banco=alunosCat(L.cat).filter(a=>!emCampo.has(a.id));
  const salvas=S.lousas.filter(x=>x.cat===L.cat&&(!ui.lzTag||x.tag===ui.lzTag));
  const T=[['mover','Mover',IC.move],['passe','Passe',sv('<path d="M3 12h14" stroke-dasharray="3 3"/><path d="M14 7l5 5-5 5"/>',20)],['movimento','Movimento',sv('<path d="M3 12h14"/><path d="M14 7l5 5-5 5"/>',20)],['conducao','Condução',sv('<path d="M3 12q2-4 4 0t4 0 4 0"/><path d="M15 8l4 4-4 4"/>',20)],['livre','Desenho',IC.pen],['zona','Zona',IC.zona],['cone','Cone',IC.cone],['borracha','Borracha',IC.eraser],['mao','Mover campo',IC.hand]];
  let h=`<div class="head"><div><h1>Lousa tática</h1><p class="mut">Arraste jogadores, bola e cones. Escolha uma ferramenta e desenhe no campo. Toque em um jogador para editar.</p></div><div class="row wrapx">${S.live?`<button type="button" class="btn" data-a="lzDoLive">${IC.field}Usar escalação do jogo ao vivo</button>`:''}<button type="button" class="btn o" data-a="lzNova">Nova lousa</button></div></div><div class="lousa"><aside class="col" style="gap:12px">`;
  h+=`<details class="pn" open><summary>Jogada e times</summary><div class="in"><div class="grid2" style="gap:10px"><label class="f">Categoria<select class="inp" data-ch="lzCat">${catOpts(L.cat)}</select></label><label class="f">Jogadores<select class="inp" data-ch="lzN">${[5,6,7,8,9,10,11].map(n=>`<option value="${n}"${n===L.n?' selected':''}>${n} x ${n}</option>`).join('')}</select></label><label class="f">Formação ${esc(NOME_CURTO)}<select class="inp" data-ch="lzFa">${Object.keys(FORM[L.n]).map(f=>`<option${sel(f,L.fa)}>${f}</option>`).join('')}</select></label><label class="f">Formação adversário<select class="inp" data-ch="lzFb">${Object.keys(FORM[L.n]).map(f=>`<option${sel(f,L.fb)}>${f}</option>`).join('')}</select></label><label class="f">Adversário<input class="inp" data-ch="lzAdv" value="${esc(L.advNome)}"></label><label class="f">Cor<select class="inp" data-ch="lzCor">${CORES.map(c=>`<option value="${c[0]}"${sel(c[0],L.advCor)}>${c[1]}</option>`).join('')}</select></label></div>
  <div class="seg" role="group" aria-label="Área do campo"><button type="button" data-a="lzCampo" data-v="inteiro" aria-pressed="${L.campo==='inteiro'}">Campo inteiro</button><button type="button" data-a="lzCampo" data-v="meio" aria-pressed="${L.campo==='meio'}">Meio campo de ataque</button></div>
  <label class="toggle"><input type="checkbox" data-ch="lzAdvOn"${chk(L.mostrarAdv)}>Mostrar adversário</label><label class="toggle"><input type="checkbox" data-ch="lzNomes"${chk(L.mostrarNomes)}>Mostrar nomes</label></div></details>`;
  h+=`<div class="card col"><b>Ferramentas</b><div class="tools">${T.map(t=>`<button type="button" data-a="ferr" data-v="${t[0]}" aria-pressed="${L.ferramenta===t[0]}">${t[2]}${t[1]}</button>`).join('')}</div><div class="row wrapx"><button type="button" class="btn sm" data-a="lzUndo"${L.undo.length?'':' disabled'} aria-label="Desfazer">${IC.undo}</button><button type="button" class="btn sm" data-a="lzRedo"${L.redo.length?'':' disabled'} aria-label="Refazer">${IC.redo}</button><button type="button" class="btn o sm" data-a="lzLimpar">Apagar desenhos</button><button type="button" class="btn o sm" data-a="lzFormar">Reorganizar</button></div><div class="zoomrow"><span class="sm mut">Zoom</span><button type="button" class="btn sm" data-a="lzZoom" data-v="out" aria-label="Afastar">${IC.zout}</button><span class="pct" data-zoom>${zoomPct(L)}%</span><button type="button" class="btn sm" data-a="lzZoom" data-v="in" aria-label="Aproximar">${IC.zin}</button><button type="button" class="btn o sm" data-a="lzZoom" data-v="fit">${IC.fit}Campo inteiro</button></div><p class="xs mut" style="margin:0">Com zoom, use a ferramenta Mover campo (ou dois dedos) para arrastar a visão.</p><button type="button" class="btn r sm" data-a="lzReset">${IC.reset}${ui.resetConfirm?'Confirmar: redefinir tudo':'Redefinir tudo'}</button><div class="row wrapx"><button type="button" class="btn o sm" data-a="lzAvulso" data-v="c">+ Jogador ${esc(NOME_CURTO)}</button><button type="button" class="btn o sm" data-a="lzAvulso" data-v="f">+ Adversário</button></div></div>`;
  if(L.sel){const q=L.sel.split(':'),arr=q[0]==='c'?L.casa:L.fora,p=arr[+q[1]];if(p)h+=`<div class="card col" style="border-color:var(--y)"><div class="row between"><b>Jogador selecionado</b><button type="button" class="btn o sm" data-a="lzSelX" aria-label="Fechar">${IC.x}</button></div><div class="grid2" style="gap:10px"><label class="f">Nome<input class="inp" data-ch="plNome" value="${esc(p.nome)}"></label><label class="f">Número<input class="inp" data-ch="plNum" value="${esc(p.num)}"></label></div><button type="button" class="btn r sm" data-a="lzRemPl">Tirar do campo</button></div>`;}
  h+=`</aside><section class="col" style="gap:12px"><div class="campowrap${L.rec?' gravando':''}"><div id="campo" class="campo"></div><button type="button" class="fsbtn hand" data-a="maoTog" aria-pressed="${L.ferramenta==='mao'}" aria-label="Mãozinha: arrastar o campo">${IC.hand}<span>${L.ferramenta==='mao'?'Arrastando campo':'Arrastar campo'}</span></button><button type="button" class="fsbtn" data-a="lzFull" aria-label="Abrir lousa em tela cheia">${IC.expand}<span>Tela cheia</span></button></div>${bancoLz(L)}`;
  h+=`<div class="card col${L.rec?' gravando':''}">${vGravacao(L)}</div>`;
  h+=`<form class="card col" data-f="lzSalvar"><div class="grid2"><label class="f">Nome da jogada<input class="inp" name="nome" required value="${esc(L.nome)}" placeholder="Ex.: Saída de bola contra marcação alta"></label><label class="f">Tipo<select class="inp" name="tag">${TAGS.map(t=>`<option${sel(t,L.tag)}>${t}</option>`).join('')}</select></label></div><label class="f">Instruções para os alunos<textarea class="inp" name="desc" placeholder="Explique o que cada um faz na jogada">${esc(L.desc)}</textarea></label><div class="row" style="justify-content:flex-end"><button type="submit" class="btn y">${L.id?'Salvar alterações':'Salvar jogada'}</button></div></form>`;
  h+=`<div class="row between wrapx"><h2>Jogadas do ${catNome(L.cat)}</h2><div class="row wrapx"><button type="button" class="chip" data-a="lzTag" data-v="" aria-pressed="${!ui.lzTag}">Todas</button>${TAGS.map(t=>`<button type="button" class="chip" data-a="lzTag" data-v="${t}" aria-pressed="${ui.lzTag===t}">${t}</button>`).join('')}</div></div>`;
  h+=salvas.length?`<div class="list">${salvas.map(x=>`<div class="card col" style="gap:8px"><div class="row between"><span class="bdg">${esc(x.tag)}</span><span class="xs mut">${x.n} x ${x.n} · ${x.tem?'com movimento gravado':'posição parada'}</span></div><b>${esc(x.nome)}</b>${x.desc?`<p class="sm mut">${esc(x.desc.slice(0,110))}${x.desc.length>110?'…':''}</p>`:''}<div class="row"><button type="button" class="btn sm" data-a="lzAbrir" data-v="${x.id}">Abrir</button><button type="button" class="btn sm" data-a="lzDup" data-v="${x.id}">${IC.copy}Duplicar</button><button type="button" class="btn o sm" data-a="lzDel" data-v="${x.id}" aria-label="Excluir jogada">${IC.x}</button></div></div>`).join('')}</div>`:'<div class="empty">Nenhuma jogada salva com esse filtro.</div>';
  return h+'</section></div>';
}

/* ================= DICAS E METAS ================= */
const TIPOS_DICA=['Técnica','Tática','Física','Comportamento','Elogio'];
const COR_DICA={'Técnica':'var(--y)','Tática':'var(--blue)','Física':'var(--green)','Comportamento':'var(--red)','Elogio':'#E9A6FF'};
const MODELOS={
  'Técnica':['Treine o passe com a perna menos habilidosa 10 minutos por dia.','Olhe para os lados antes de receber a bola.','Proteja a bola com o corpo antes de girar.'],
  'Tática':['Na perda da bola, pressione nos primeiros 5 segundos.','Mantenha a distância para o seu companheiro de linha.','Ofereça linha de passe por dentro na saída de bola.'],
  'Física':['Durma bem na véspera dos jogos.','Beba água durante todo o dia de treino.','Faça o alongamento em casa depois do treino.'],
  'Comportamento':['Chegue 15 minutos antes para aquecer com o grupo.','Converse com os companheiros durante o jogo.','Respeite as decisões do árbitro.'],
  'Elogio':['Ótima atitude hoje, continue assim!','Você evoluiu muito na marcação, parabéns.','Liderança muito boa no coletivo.']
};
function vDicasProf(){
  let h=`<div class="head"><div><h1>Dicas e metas</h1><p class="mut">Orientação individual. Só o aluno vê o que você mandar para ele.</p></div><div class="seg" role="group" aria-label="Seção">${[['enviar','Enviar dica'],['metas','Metas'],['hist','Histórico']].map(v=>`<button type="button" data-a="dAba" data-v="${v[0]}" aria-pressed="${ui.dAba===v[0]}">${v[1]}</button>`).join('')}</div></div>`;
  if(ui.dAba==='metas')return h+vMetasProf();
  if(ui.dAba==='hist')return h+vHistDicas();
  const d=ui.dDraft;if(d.modo==='um'&&!d.alunos.length){const p0=alunosCat(ui.catProf)[0]||S.alunos[0];if(p0)d.alunos=[p0.id];}
  const catD=d.modo==='cat'?d.cat:(d.alunos[0]?al(d.alunos[0])?.cat:ui.catProf)||ui.catProf;
  h+=`<form class="card col" data-f="dica" style="gap:14px"><fieldset><legend>Para quem</legend><div class="seg">${[['um','Um aluno'],['varios','Vários alunos'],['cat','Categoria inteira']].map(o=>`<label class="rad"><input type="radio" name="modo" value="${o[0]}" data-ch="dModo"${chk(d.modo===o[0])}>${o[1]}</label>`).join('')}</div></fieldset>`;
  if(d.modo==='um')h+=`<label class="f">Aluno<select class="inp" name="aluno" data-ch="dAluno">${alunoOpts(d.alunos[0])}</select></label>`;
  else if(d.modo==='varios')h+=`<label class="f">Categoria<select class="inp" name="cat" data-ch="dCat">${catOpts(d.cat)}</select></label><fieldset><legend>Alunos</legend><div class="checks">${porPosicao(alunosCat(d.cat)).map(a=>`<label><input type="checkbox" name="alunos" value="${a.id}"${chk(d.alunos.includes(a.id))}>${esc(a.nome)}</label>`).join('')||'<span class="mut sm">Categoria sem alunos.</span>'}</div></fieldset>`;
  else h+=`<label class="f">Categoria<select class="inp" name="cat" data-ch="dCat">${catOpts(d.cat)}</select><small>${alunosCat(d.cat).length} alunos vão receber</small></label>`;
  h+=`<fieldset><legend>Tipo</legend><div class="seg">${TIPOS_DICA.map(t=>`<label class="rad"><input type="radio" name="tipo" value="${t}" data-ch="dTipo"${chk(d.tipo===t)}>${t}</label>`).join('')}</div></fieldset>`;
  h+=`<div class="col" style="gap:6px"><span class="sm mut">Modelos rápidos</span><div class="row wrapx">${MODELOS[d.tipo].map((m,i)=>`<button type="button" class="chip" data-a="dModelo" data-v="${i}">${esc(m.length>44?m.slice(0,42)+'…':m)}</button>`).join('')}</div></div>`;
  h+=`<label class="f">Dica<textarea class="inp" name="texto" id="dTexto" required placeholder="Escreva a orientação">${esc(d.texto)}</textarea></label>`;
  const jogos=S.eventos.filter(e=>e.encerrado&&e.cat===catD),lz=S.lousas.filter(l=>l.cat===catD);
  h+=`<div class="grid2"><label class="f">Vincular a um jogo <small>Opcional</small><select class="inp" name="ev"><option value="">Nenhum</option>${jogos.map(e=>`<option value="${e.id}"${sel(e.id,d.ev)}>${fmtD(e.data)} · ${esc(evTitulo(e))} (${e.placar.a} x ${e.placar.b})</option>`).join('')}</select></label><label class="f">Vincular a uma jogada <small>Opcional</small><select class="inp" name="lousa"><option value="">Nenhuma</option>${lz.map(l=>`<option value="${l.id}"${sel(l.id,d.lousa)}>${esc(l.nome)}</option>`).join('')}</select></label></div>`;
  h+=`<label class="toggle"><input type="checkbox" name="fixar"${chk(d.fixar)}>Fixar na carta do aluno</label><div class="row" style="justify-content:flex-end"><button type="submit" class="btn y">Enviar dica</button></div></form>`;
  return h;
}
function vMetasProf(){
  const ms=S.metas.slice().sort((a,b)=>(a.status===b.status?a.prazo.localeCompare(b.prazo):a.status==='andamento'?-1:1));
  let h=`<form class="card col" data-f="meta"><div class="grid3"><label class="f">Aluno<select class="inp" name="aluno">${alunoOpts('')}</select></label><label class="f">Meta<input class="inp" name="texto" required placeholder="Ex.: Acertar 80% dos passes no próximo jogo"></label><label class="f">Prazo<input class="inp" type="date" name="prazo" required value="${iso(30)}"></label></div><div class="row" style="justify-content:flex-end"><button type="submit" class="btn y">Criar meta</button></div></form>`;
  if(!ms.length)return h+'<div class="empty">Nenhuma meta criada.</div>';
  return h+`<div class="col">${ms.map(m=>{const a=al(m.aluno);if(!a)return '';const atras=m.status==='andamento'&&m.prazo<HOJE;return `<div class="card meta">${avatar(a,38)}<div style="flex:1"><b>${esc(m.texto)}</b><br><span class="sm mut">${esc(a.nome)} · ${catNome(a.cat)} · prazo ${fmtD(m.prazo)}</span></div>${m.status==='concluida'?'<span class="bdg ok">Concluída</span>':atras?'<span class="bdg x">Atrasada</span>':'<span class="bdg wait">Em andamento</span>'}<button type="button" class="btn sm" data-a="metaTog" data-v="${m.id}">${m.status==='concluida'?'Reabrir':'Concluir'}</button><button type="button" class="btn o sm" data-a="metaDel" data-v="${m.id}" aria-label="Excluir meta">${IC.x}</button></div>`;}).join('')}</div>`;
}
function vHistDicas(){
  const f=ui.dFiltro;
  const ds=S.dicas.filter(d=>(!f.aluno||d.aluno===f.aluno)&&(!f.tipo||d.tipo===f.tipo)).sort((a,b)=>b.quando-a.quando);
  let h=`<div class="row wrapx"><label class="sr" for="fA">Aluno</label><select id="fA" class="inp sm" data-ch="fAluno"><option value="">Todos os alunos</option>${alunoOpts(f.aluno)}</select><label class="sr" for="fT">Tipo</label><select id="fT" class="inp sm" data-ch="fTipo"><option value="">Todos os tipos</option>${TIPOS_DICA.map(t=>`<option${sel(t,f.tipo)}>${t}</option>`).join('')}</select><span class="sm mut">${ds.length} dicas · ${ds.filter(d=>d.entendida).length} entendidas</span></div>`;
  if(!ds.length)return h+'<div class="empty">Nenhuma dica com esse filtro.</div>';
  return h+`<div class="col">${ds.map(d=>{const a=al(d.aluno);if(!a)return '';const e=d.ev?ev(d.ev):null,lz=d.lousa?lousa(d.lousa):null;return `<div class="card row" style="align-items:flex-start;gap:12px">${avatar(a,38)}<div class="dica" style="flex:1"><div class="row wrapx"><b>${esc(a.nome)}</b><span class="tp" style="color:${COR_DICA[d.tipo]}">${d.tipo}</span><span class="xs mut">${fmtQ(d.quando)}</span>${d.fixada?'<span class="bdg y">Fixada</span>':''}</div><p>${esc(d.texto)}</p>${e||lz?`<span class="sm mut">${e?'Jogo: '+esc(evTitulo(e))+' ':''}${lz?'Jogada: '+esc(lz.nome):''}</span>`:''}</div><div class="col" style="align-items:flex-end;gap:6px">${d.entendida?'<span class="bdg ok">Entendida</span>':d.lida?'<span class="bdg b">Lida</span>':'<span class="bdg wait">Não lida</span>'}<div class="row"><button type="button" class="btn sm" data-a="dFixar" data-v="${d.id}">${d.fixada?'Desafixar':'Fixar'}</button><button type="button" class="btn o sm" data-a="dDel" data-v="${d.id}" aria-label="Excluir dica">${IC.x}</button></div></div></div>`;}).join('')}</div>`;
}
function vDicasAluno(){
  const a=al(ui.alunoAtual);
  const ds=S.dicas.filter(d=>d.aluno===a.id).sort((x,y)=>(y.fixada-x.fixada)||(y.quando-x.quando));
  const ms=S.metas.filter(m=>m.aluno===a.id);
  setTimeout(()=>{let mud=false;ds.forEach(d=>{if(!d.lida){d.lida=true;mud=true;}});if(mud)save();},0);
  let h=`<div class="head"><div><h1>Dicas e metas</h1><p class="mut">O que o professor quer que você treine.</p></div></div>`;
  h+=`<h2>Metas</h2>`+(ms.length?`<div class="col">${ms.map(m=>`<div class="card meta"><span style="color:${m.status==='concluida'?'var(--green)':'var(--y)'}">${IC.target}</span><div style="flex:1"><b>${esc(m.texto)}</b><br><span class="sm mut">Prazo ${fmtD(m.prazo)}</span></div>${m.status==='concluida'?'<span class="bdg ok">Concluída</span>':'<span class="bdg wait">Em andamento</span>'}</div>`).join('')}</div>`:'<div class="empty">Sem metas por enquanto.</div>');
  h+=`<h2>Dicas</h2>`+(ds.length?`<div class="col">${ds.map(d=>{const e=d.ev?ev(d.ev):null,lz=d.lousa?lousa(d.lousa):null;return `<div class="card dica"><div class="row wrapx"><span class="tp" style="color:${COR_DICA[d.tipo]}">${d.tipo}</span><span class="xs mut">${fmtQ(d.quando)}</span>${d.fixada?'<span class="bdg y">Fixada na carta</span>':''}${!d.lida?'<span class="bdg wait">Nova</span>':''}</div><p>${esc(d.texto)}</p><div class="row wrapx">${e?`<button type="button" class="btn sm" data-a="resumo" data-v="${e.id}">Ver jogo: ${esc(evTitulo(e))}</button>`:''}${lz?`<button type="button" class="btn sm" data-a="abrirJogada" data-v="${lz.id}">${IC.field}Ver jogada</button>`:''}${d.entendida?'<span class="bdg ok">Você marcou como entendida</span>':`<button type="button" class="btn y sm" data-a="dEntendi" data-v="${d.id}">Entendi</button>`}</div></div>`;}).join('')}</div>`:'<div class="empty">Nenhuma dica ainda.</div>');
  return h;
}

/* ================= ALUNO ================= */
function vCarta(){
  const a=al(ui.alunoAtual);if(!a)return '<div class="empty">Selecione um aluno.</div>';
  const s=stats(a.id),tr=tier(s),ok=cqAluno(a.id);
  const ds=S.dicas.filter(d=>d.aluno===a.id).sort((x,y)=>(y.fixada-x.fixada)||(y.quando-x.quando)),dica=ds[0];
  const metas=S.metas.filter(m=>m.aluno===a.id&&m.status==='andamento');
  let h=`<div class="grid2" style="align-items:start;gap:24px"><div class="col" style="align-items:center">`;
  const alvo=s.treinos<10?{n:'prata',v:10,c:'#C9CCD1'}:s.treinos<25?{n:'ouro',v:25,c:'#F7C600'}:null;
  h+=`<div class="tilt"><div class="tiltin"><div class="flip" data-a="virar" role="button" tabindex="0" aria-label="Virar a carta"><div class="carta${tr.n!=='Carta bronze'?' brilho':''}" style="--tier:${tr.c}"><div class="topo"><div><div class="num">${a.num!=null?a.num:'—'}</div><div class="pos" title="${esc(POSN[a.pos[0]]||'')}">${a.pos[0]}${a.pos.length>1?`<span style="font-size:13px;opacity:.75"> · ${a.pos.slice(1).join('/')}</span>`:''}</div><div class="sm" style="font-weight:700;margin-top:4px">${catNome(a.cat)}</div></div><div class="foto">${a.foto?`<img src="${a.foto}" alt="">`:esc(iniciais(a.nome))}</div><span class="tierlbl">${tr.n.toUpperCase()}</span></div><div class="corpo"><div><div class="nome">${esc(a.nome)}</div><span class="uname">@${esc(a.login)}</span></div><div class="stats"><div><b>${s.jogos}</b><span>Jogos</span></div><div><b>${s.gols}</b><span>Gols</span></div><div><b>${s.assist}</b><span>Assist.</span></div><div><b>${s.treinos}</b><span>Treinos</span></div></div><p class="sm mut" style="text-align:center">${s.minutos} minutos em campo</p></div></div>`;
  h+=`<div class="verso" style="--tier:${tr.c}"><div class="row between" style="margin-bottom:6px"><b style="font-family:var(--fd);font-size:22px;text-transform:uppercase">${esc(primeiro(a.nome))}</b><span class="bdg" style="background:var(--tier);color:#0A0A08">${tr.n}</span></div>${[['Jogos',s.jogos],['Minutos em campo',s.minutos],['Gols',s.gols],['Assistências',s.assist],['Gols de falta',s.faltas],['Pênaltis defendidos',s.penDef],['Cartões amarelos',s.amarelos],['Treinos presentes',s.treinos],['Faltas em treinos',s.faltasTreino],['Conquistas',ok.length+' de '+CQ.length]].map(x=>`<div class="linha"><span class="mut">${x[0]}</span><b>${x[1]}</b></div>`).join('')}<span class="xs mut" style="margin-top:auto;padding-top:8px;text-align:center">Toque para virar</span></div></div></div></div>`;
  h+=alvo?`<div class="col" style="width:min(360px,100%);gap:6px"><div class="row between sm"><span>${s.treinos} treinos</span><span class="mut">Faltam ${alvo.v-s.treinos} para a carta ${alvo.n}</span></div><div class="prog" style="--tier:${alvo.c}"><i style="--w:${Math.min(100,s.treinos/alvo.v*100).toFixed(0)}%"></i></div></div>`:'<p class="sm" style="color:var(--y)">Carta ouro: nível máximo!</p>';
  h+=`<p class="xs mut" style="text-align:center">Toque na carta para ver o verso com todas as estatísticas.</p></div><div class="col" style="gap:18px">`;
  if(dica)h+=`<section class="card col" style="gap:8px"><div class="row" style="color:var(--y)">${IC.msg}<h3 style="color:var(--ink)">Dica do professor</h3><span class="tp xs" style="color:${COR_DICA[dica.tipo]};font-weight:800">${dica.tipo}</span></div><p>${esc(dica.texto)}</p><button type="button" class="btn o sm" style="align-self:flex-start" data-a="tab" data-v="dicas">Ver todas as dicas</button></section>`;
  if(metas.length)h+=`<section class="card col" style="gap:8px"><h3>Metas em andamento</h3>${metas.map(m=>`<div class="row"><span style="color:var(--y)">${IC.target}</span><span style="flex:1">${esc(m.texto)}</span><span class="xs mut">até ${fmtD(m.prazo)}</span></div>`).join('')}</section>`;
  h+=`<section class="col"><div class="row between"><h2>Conquistas</h2><span class="mut sm">${ok.length} de ${CQ.length}</span></div><div class="cqs">${CQ.map(c=>{const on=ok.includes(c.id);return `<div class="cq${on?'':' off'}${on&&ui.cqDestaque.includes(c.id)?' novo':''}" style="color:${on?'var(--y)':'var(--mut)'}">${on?IC[c.ic]:IC.lock}<b style="color:${on?'var(--ink)':'var(--mut)'}">${c.nome}</b><small>${c.pos}</small></div>`;}).join('')}</div></section></div></div>`;
  return h;
}
function vLousaFull(){
  const L=ui.lousa;if(!L)return '';
  const T=[['mover','Mover',IC.move],['passe','Passe',sv('<path d="M3 12h14" stroke-dasharray="3 3"/><path d="M14 7l5 5-5 5"/>',20)],['movimento','Movimento',sv('<path d="M3 12h14"/><path d="M14 7l5 5-5 5"/>',20)],['conducao','Condução',sv('<path d="M3 12q2-4 4 0t4 0 4 0"/><path d="M15 8l4 4-4 4"/>',20)],['livre','Pincel',IC.pen],['zona','Zona',IC.zona],['cone','Cone',IC.cone],['borracha','Borracha',IC.eraser],['mao','Mover campo',IC.hand]];
  return `<div class="lzfull" role="dialog" aria-modal="true" aria-label="Lousa em tela cheia"><div class="lzbar">${T.map(t=>`<button type="button" class="lzt" data-a="ferr" data-v="${t[0]}" aria-pressed="${L.ferramenta===t[0]}" title="${t[1]}">${t[2]}<span>${t[1]}</span></button>`).join('')}<span class="lzsep"></span><button type="button" class="lzt" data-a="lzUndo"${L.undo.length?'':' disabled'} title="Desfazer">${IC.undo}<span>Desfazer</span></button><button type="button" class="lzt" data-a="lzRedo"${L.redo.length?'':' disabled'} title="Refazer">${IC.redo}<span>Refazer</span></button><button type="button" class="lzt" data-a="lzZoom" data-v="out" title="Afastar">${IC.zout}<span>Afastar</span></button><button type="button" class="lzt" data-a="lzZoom" data-v="in" title="Aproximar">${IC.zin}<span data-zoom>${zoomPct(L)}%</span></button><button type="button" class="lzt" data-a="lzZoom" data-v="fit" title="Campo inteiro">${IC.fit}<span>Inteiro</span></button><span class="lzsep"></span><button type="button" class="lzt" data-a="lzReset" title="Redefinir tudo" style="${ui.resetConfirm?'border-color:var(--red);color:var(--red)':''}">${IC.reset}<span>${ui.resetConfirm?'Confirmar':'Redefinir'}</span></button><button type="button" class="lzt" data-a="lzLimpar" title="Apagar desenhos">${IC.x}<span>Limpar</span></button><span class="lzsep"></span>${L.rec?`<button type="button" class="lzt recstop" data-a="recStop">${IC.stopsq}<span data-rectime>Parar</span></button>`:`<button type="button" class="lzt recbtn" data-a="recStart"${L.playing?' disabled':''}>${IC.recdot}<span>${L.gravacao?'Regravar':'Gravar'}</span></button>`}${L.gravacao&&!L.rec?(L.playing?`<button type="button" class="lzt" data-a="lzStop">${IC.pause}<span>Parar</span></button>`:`<button type="button" class="lzt" data-a="lzPlay">${IC.play}<span>Reproduzir</span></button>`):''}<button type="button" class="lzt" data-a="lzCampo" data-v="${L.campo==='meio'?'inteiro':'meio'}" title="Alternar meio campo">${IC.field}<span>${L.campo==='meio'?'Inteiro':'Meio'}</span></button><button type="button" class="lzt sair" data-a="lzFullX" aria-label="Sair da tela cheia">${IC.x}<span>Sair</span></button></div><div class="lzstage${L.rec?' gravando':''}"><div id="campoFull" class="campo"></div><button type="button" class="fsbtn hand" data-a="maoTog" aria-pressed="${L.ferramenta==='mao'}" aria-label="Mãozinha: arrastar o campo">${IC.hand}<span>${L.ferramenta==='mao'?'Arrastando campo':'Arrastar campo'}</span></button></div>${bancoLz(L)}</div>`;
}
function bindCarta(){const t=document.querySelector('.tilt');if(!t)return;const i=t.querySelector('.tiltin');
  t.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=t.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;i.style.transform=`rotateY(${(x*16).toFixed(1)}deg) rotateX(${(-y*16).toFixed(1)}deg)`;});
  t.addEventListener('pointerleave',()=>{i.style.transform='';});}
function vJogadas(){
  const a=al(ui.alunoAtual),l=S.lousas.filter(x=>x.cat===a.cat);
  let h=`<div class="head"><div><h1>Jogadas</h1><p class="mut">Jogadas que o professor compartilhou com o ${catNome(a.cat)}.</p></div></div>`;
  if(!l.length)return h+'<div class="empty">O professor ainda não compartilhou jogadas.</div>';
  h+=`<div class="row wrapx">${l.map(x=>`<button type="button" class="chip" data-a="verLousa" data-v="${x.id}" aria-pressed="${ui.vl&&ui.vl.id===x.id}">${esc(x.nome)}</button>`).join('')}</div>`;
  if(ui.vl){const o=ui.vl.obj;h+=`<div class="card col"><div class="row wrapx"><span class="bdg">${esc(o.tag)}</span><b>${esc(o.nome)}</b></div>${o.desc?`<p>${esc(o.desc)}</p>`:''}</div><div id="campo" class="campo"></div>${o.gravacao?`<div class="prog"><i data-recprog style="width:0;animation:none"></i></div><div class="row wrapx">${o.playing?`<button type="button" class="btn w" data-a="alStop">${IC.pause}Parar</button>`:`<button type="button" class="btn y" data-a="alPlay">${IC.play}Ver jogada</button>`}<span class="sm mut" data-rectime>${fmtSeg(o.gravacao.dur)}</span></div>`:'<p class="sm mut">Jogada sem movimento gravado.</p>'}</div>`;}
  return h;
}
function vAvisos(){
  const a=al(ui.alunoAtual),ns=notifsAluno(a);S.lidos[a.id]=Date.now();save();
  return `<div class="head"><div><h1>Avisos</h1><p class="mut">No app instalado, também chegam como notificação no celular.</p></div></div>`+(ns.length?`<div class="col">${ns.map(n=>`<div class="card row" style="gap:12px"><span style="color:var(--y)">${IC.bell}</span><div style="flex:1">${esc(n.texto)}<br><span class="mut sm">${fmtQ(n.quando)}</span></div></div>`).join('')}</div>`:'<div class="empty">Nenhum aviso.</div>');
}

/* ================= MODAIS ================= */
function vModalLocal(){
  const m=ui.modal;if(!m)return '';let h='',lg=false;
  const L=S.live;
  switch(m.tipo){
  case 'cred':{const a=al(m.id);h=`<h2>Aluno cadastrado</h2><p>Entregue estes acessos para a família. A senha precisa ser trocada no primeiro acesso.</p><div class="card flat col"><b>Aluno</b><span>Nome de usuário: <b class="uname">@${esc(a.login)}</b></span><span>Senha inicial: ${senhaPadrao(a.nome)}</span></div><div class="card flat col"><b>Responsável (${esc(a.resp)})</b><span>Entra com o celular: ${esc(a.cel)}</span><span>Senha inicial: ${senhaPadrao(a.nome)}</span></div><div class="acts"><button type="button" class="btn y" data-a="fechar">Pronto</button></div>`;break;}
  case 'aluno':{const b=al(m.id),s=stats(b.id);
    h=`<div class="row" style="gap:14px">${avatar(b,64)}<div><h2>${esc(b.nome)}</h2><span class="mut">${catNome(b.cat)} · ${posTxt(b)}${b.num!=null?' · camisa '+b.num:''}</span></div></div><div class="grid2" style="gap:10px"><div class="card flat col" style="gap:4px"><b>Nome de usuário do aluno</b><span class="uname">@${esc(b.login)}</span></div><div class="card flat col" style="gap:4px"><b>Login do responsável</b><span>${esc(b.cel)}</span></div></div>`;
    if(!b.senhaTrocada)h+=`<p class="sm"><span class="bdg wait">Aguardando troca de senha</span> Senha inicial: <b>${senhaPadrao(b.nome)}</b></p>`;
    h+=`<p class="sm mut">${s.jogos} jogos · ${s.minutos} min · ${s.gols} gols · ${s.assist} assistências · ${s.treinos} treinos · ${s.faltasTreino} faltas</p>${posPicker()}<div class="row"><button type="button" class="btn sm" data-a="salvarPos">Salvar posições</button></div><form class="row wrapx" data-f="mudarCat" style="align-items:flex-end"><label class="f" style="flex:1">Categoria<select class="inp" name="cat">${catOpts(b.cat)}</select></label><button type="submit" class="btn">Mudar categoria</button></form>`;
    if(b.hist.length)h+=`<div class="sm mut">Histórico: ${b.hist.map(esc).join('; ')}</div>`;
    h+=`<div class="acts"><button type="button" class="btn o" data-a="resetSenha" data-v="${b.id}">Redefinir senha</button><button type="button" class="btn r" data-a="delAluno" data-v="${b.id}">${ui.delConfirm===b.id?'Confirmar exclusão':'Excluir aluno'}</button><button type="button" class="btn y" data-a="fechar">Fechar</button></div>`;break;}
  case 'evForm':lg=true;h=evFormHTML(m.d);break;
  case 'evDet':{lg=true;const e=ev(m.id);h=e?evDetalheHTML(e,ui.role==='aluno'):'';break;}
  case 'convocar':{const e=ev(m.id);const jg=e.grupo==='jogo';h=`<h2>${jg?'Convocar para '+esc(evTitulo(e)):'Convocar para o coletivo'}</h2><p class="sm mut">${jg?'Os novos convocados recebem aviso na hora. Depois você escolhe titulares e reservas ao iniciar o jogo.':'Quem for convocado já fica com presença confirmada. Depois você monta os times ao iniciar o coletivo.'}</p><div class="row"><button type="button" class="btn o sm" data-a="convTodos" data-v="1">Marcar todos</button><button type="button" class="btn o sm" data-a="convTodos" data-v="0">Desmarcar todos</button></div><form class="col" data-f="convocar"><div class="checks" id="convList">${porPosicao(alunosCat(e.cat)).map(a=>`<label><input type="checkbox" name="c" value="${a.id}"${chk(e.convocados.includes(a.id))}>${esc(a.nome)} <span class="mut xs">${a.pos[0]}</span></label>`).join('')}</div><div class="acts"><button type="button" class="btn o" data-a="fechar">Cancelar</button><button type="submit" class="btn y">Salvar convocação</button></div></form>`;break;}
  case 'chamada':{lg=true;const e=ev(m.id);h=`<h2>Chamada · ${esc(e.titulo)}</h2><div class="row between wrapx"><p class="sm mut">${fmtD(e.data)} · Presença conta para os treinos da carta.</p><button type="button" class="btn y sm" data-a="todosP">Todos presentes</button></div><form class="col" data-f="chamada">${porPosicao(alunosCat(e.cat)).map(a=>{const v=e.chamada[a.id]||(e.conf[a.id]==='nao'?'F':'P');return `<div class="row between wrapx" style="border-top:1px solid var(--line);padding:6px 0"><span class="who">${avatar(a,32)}${esc(a.nome)}${e.conf[a.id]?`<span class="xs mut">(${e.conf[a.id]==='vai'?'confirmou':'avisou que não ia'})</span>`:''}</span><span class="seg">${[['P','Presente'],['F','Falta'],['J','Justificada']].map(o=>`<label class="rad"><input type="radio" name="p_${a.id}" value="${o[0]}"${chk(v===o[0])}>${o[1]}</label>`).join('')}</span></div>`;}).join('')}<div class="acts"><button type="button" class="btn o" data-a="fechar">Cancelar</button><button type="submit" class="btn y">Salvar chamada</button></div></form>`;break;}
  case 'cancelar':{const e=ev(m.id);h=`<h2>Cancelar ${esc(evTitulo(e))}</h2><form class="col" data-f="cancelar"><label class="f">Motivo <small>Vai no aviso para os alunos</small><textarea class="inp" name="motivo" required placeholder="Ex.: Campo alagado pela chuva."></textarea></label>${e.serie?'<label class="toggle"><input type="checkbox" name="serie">Cancelar também os próximos treinos desta série</label>':''}<div class="acts"><button type="button" class="btn o" data-a="fechar">Voltar</button><button type="submit" class="btn r">Cancelar e avisar</button></div></form>`;break;}
  case 'resumo':{lg=true;const e=ev(m.id);h=`<h2>${esc(evTitulo(e))}</h2><p class="sm mut">${fmtD(e.data)} · ${esc(e.sub)} · ${esc(e.local)}${e.conta?'':' · não contou na carta'}</p>`+resumoHTML({nA:e.grupo==='jogo'?NOME_CURTO:'Time A',nB:e.grupo==='jogo'?e.adv:'Time B',placar:e.placar,stats:e.stats,lances:S.lances.filter(l=>l.ev===e.id),minutos:e.minutos||{},part:e.part,obs:ui.role==='professor'?e.obs:''})+`<div class="acts"><button type="button" class="btn y" data-a="fechar">Fechar</button></div>`;break;}
  case 'gol':{const t=m.time,ids=L.campo[t];
    if(!ids){h=`<h2>Gol do ${esc(nomeTime(L,t))}</h2><form class="col" data-f="gol"><fieldset><legend>Como foi</legend><div class="checks">${[['normal','Jogada'],['falta','Falta'],['penalti','Pênalti'],['cabeca','Cabeça'],['fora_area','Fora da área']].map((d,i)=>`<label><input type="radio" name="detalhe" value="${d[0]}"${chk(i===0)}>${d[1]}</label>`).join('')}</div></fieldset><div class="acts"><button type="button" class="btn o" data-a="fechar">Cancelar</button><button type="submit" class="btn y">Registrar gol (${minLabel(L)})</button></div></form>`;break;}
    const ops=s=>ids.map(id=>{const a=al(id);return `<option value="${id}"${sel(id,s)}>${a&&a.num!=null?a.num+' · ':''}${esc(nomeDe(id))}</option>`;}).join('');
    h=`<h2>Gol ${esc(nomeTime(L,t))}</h2><form class="col" data-f="gol" style="gap:12px"><label class="f">Quem fez<select class="inp" name="autor">${ops(m.autor||ordenar(ids.map(al).filter(Boolean)).reverse()[0]?.id||ids[0])}</select></label><label class="f">Assistência<select class="inp" name="assist"><option value="">Sem assistência</option>${ops('')}</select></label><fieldset><legend>Como foi</legend><div class="checks">${[['normal','Jogada'],['falta','Falta'],['penalti','Pênalti'],['cabeca','Cabeça'],['fora_area','Fora da área']].map((d,i)=>`<label><input type="radio" name="detalhe" value="${d[0]}"${chk(i===0)}>${d[1]}</label>`).join('')}</div></fieldset><div class="acts"><button type="button" class="btn o" data-a="fechar">Cancelar</button><button type="submit" class="btn y">Registrar gol (${minLabel(L)})</button></div></form>`;break;}
  case 'pl':{const a=al(m.id),c=L.cart[m.id]||{};h=`<div class="row" style="gap:12px">${avatar(a,52)}<div><h2>${esc(nomeDe(m.id))}</h2><span class="sm mut">${a?posTxt(a):''} · ${minJog(L,m.id)} min em campo${c.am?' · 1 amarelo':''}</span></div></div><div class="acoes">${[['gol','Gol','y'],['chuteGol','Chute no gol',''],['chuteFora','Chute para fora',''],['defesa','Defesa',''],['penDef','Pênalti defendido',''],['falta','Cometeu falta',''],['amarelo','Cartão amarelo',''],['vermelho','Cartão vermelho','r'],['sub','Substituir','w']].map(x=>`<button type="button" class="btn ${x[2]}" data-a="plAcao" data-v="${x[0]}">${x[1]}</button>`).join('')}</div><div class="acts"><button type="button" class="btn o" data-a="fechar">Fechar</button></div>`;break;}
  case 'sub':{const t=m.time;h=`<h2>Substituição · ${esc(nomeTime(L,t))}</h2><form class="col" data-f="sub"><label class="f">Sai<select class="inp" name="sai">${L.campo[t].map(id=>`<option value="${id}"${sel(id,m.sai)}>${esc(nomeDe(id))} · ${minJog(L,id)} min</option>`).join('')}</select></label><label class="f">Entra<select class="inp" name="entra">${L.banco[t].map(id=>`<option value="${id}"${sel(id,m.entra)}>${esc(nomeDe(id))}</option>`).join('')}</select></label>${L.banco[t].length?'':'<p class="sm" style="color:var(--red)">Não há ninguém no banco.</p>'}<div class="acts"><button type="button" class="btn o" data-a="fechar">Cancelar</button><button type="submit" class="btn y"${L.banco[t].length&&L.campo[t].length?'':' disabled'}>Confirmar (${minLabel(L)})</button></div></form>`;break;}
  case 'entrarPl':{const t=m.time;h=`<h2>${esc(nomeDe(m.id))} entra</h2>${L.campo[t].length<L.n?`<p class="sm mut">O time está com ${L.campo[t].length} de ${L.n}. Dá para só colocar em campo.</p><div class="acts" style="justify-content:flex-start"><button type="button" class="btn y" data-a="soEntrar">Colocar em campo sem tirar ninguém</button></div>`:''}<form class="col" data-f="sub"><input type="hidden" name="entra" value="${m.id}"><label class="f">Quem sai<select class="inp" name="sai">${L.campo[t].map(id=>`<option value="${id}">${esc(nomeDe(id))} · ${minJog(L,id)} min</option>`).join('')}</select></label><div class="acts"><button type="button" class="btn o" data-a="fechar">Cancelar</button><button type="submit" class="btn y"${L.campo[t].length?'':' disabled'}>Confirmar substituição</button></div></form>`;break;}
  case 'cartao':{const t=m.time,ids=L.campo[t];h=`<h2>Cartão · ${esc(nomeTime(L,t))}</h2><form class="col" data-f="cartao">${ids?`<label class="f">Jogador<select class="inp" name="aluno">${ids.map(id=>`<option value="${id}">${esc(nomeDe(id))}</option>`).join('')}</select></label>`:''}<fieldset><legend>Cor</legend><div class="checks"><label><input type="radio" name="cor" value="amarelo" checked><span class="ca"></span> Amarelo</label><label><input type="radio" name="cor" value="vermelho"><span class="ca v"></span> Vermelho</label></div></fieldset><div class="acts"><button type="button" class="btn o" data-a="fechar">Cancelar</button><button type="submit" class="btn y">Registrar</button></div></form>`;break;}
  case 'penDef':{const t=m.time,ids=L.campo[t];h=`<h2>Pênalti defendido</h2><form class="col" data-f="penDef"><label class="f">Goleiro<select class="inp" name="aluno">${ids.map(id=>{const a=al(id);return `<option value="${id}"${a&&a.pos.includes('GOL')?' selected':''}>${esc(nomeDe(id))}</option>`;}).join('')}</select></label><div class="acts"><button type="button" class="btn o" data-a="fechar">Cancelar</button><button type="submit" class="btn y">Registrar defesa</button></div></form>`;break;}
  case 'encerrar':{lg=true;const part=Object.keys(L.time).filter(id=>L.jogou.includes(id));const mins={};part.forEach(id=>mins[id]=minJog(L,id));
    h=`<h2>Encerrar partida</h2>`+resumoHTML({nA:nomeTime(L,'a'),nB:nomeTime(L,'b'),placar:L.placar,stats:L.stats,lances:L.lances,minutos:mins,part,obs:''})+`<form class="col" data-f="encerrar"><label class="f">Observação do professor <small>Só você vê</small><textarea class="inp" name="obs" placeholder="O que funcionou, o que treinar na semana"></textarea></label><label class="toggle"><input type="checkbox" name="conta"${chk(L.jogo)}>Contar gols, assistências e minutos na carta dos alunos</label><div class="acts"><button type="button" class="btn o" data-a="fechar">Voltar ao jogo</button><button type="submit" class="btn y">Encerrar e salvar</button></div></form>`;break;}
  case 'rapida':h=`<h2>Partida rápida</h2><p class="sm mut">Cria a partida de agora e já abre a escalação, sem passar pela agenda.</p><form class="col" data-f="rapida"><div class="grid2"><label class="f">Categoria<select class="inp" name="cat">${catOpts(ui.catProf)}</select></label><label class="f">Tipo<select class="inp" name="sub"><option>Coletivo</option><option>Amistoso</option><option>Teste</option></select></label></div><label class="f">Adversário <small>Só para amistoso ou teste</small><input class="inp" name="adv" placeholder="Ex.: EC Vila Nova"></label><label class="f">Local<input class="inp" name="local" value="Campo 2"></label><div class="acts"><button type="button" class="btn o" data-a="fechar">Cancelar</button><button type="submit" class="btn y">Criar e escalar</button></div></form>`;break;
  case 'senha':{const c=al(ui.alunoAtual);h=`<h2>Primeiro acesso de ${esc(primeiro(c.nome))}</h2><p class="mut">Usuário <b class="uname">@${esc(c.login)}</b>. Troque a senha inicial (${senhaPadrao(c.nome)}) antes de continuar.</p><form class="col" data-f="senha"><label class="f">Nova senha <small>Pelo menos 6 caracteres</small><input class="inp" type="password" name="s1" required minlength="6" autocomplete="new-password"></label><label class="f">Repita a nova senha<input class="inp" type="password" name="s2" required minlength="6" autocomplete="new-password"></label><p class="sm" id="senhaErro" style="color:var(--red)"></p><div class="acts"><button type="submit" class="btn y">Salvar senha</button></div></form>`;break;}
  }
  return `<div class="overlay" data-a="fora"><div class="modal${lg?' lg':''}" role="dialog" aria-modal="true">${h}</div></div>`;
}

/* ================= AÇÕES ================= */
function checarSenha(){const a=al(ui.alunoAtual);if(ui.role==='aluno'&&a&&!a.senhaTrocada)ui.modal={tipo:'senha'};}
function iniciarLiveDe(id){ui.tela.professor='aovivo';ui.liveSetup={ev:id,n:7};ui.modal=null;}
function actLocal(a,v,el,e){
  if(a!=='lzReset'&&a!=='fora')ui.resetConfirm=false;
  if(gravando()&&['lzAvulso','lzRemPl','lzNova','lzAbrir','lzDoLive','lzPlay','liveLousa','abrirJogada'].includes(a)){toast('Pare a gravação primeiro.');return;}
  if(gravando()&&(a==='tab'||a==='role'))pararGravacao(ui.lousa,false);
  const L=S.live,Lz=ui.lousa;
  switch(a){
  case 'fora':if(e.target===el&&ui.modal&&ui.modal.tipo!=='senha'){ui.modal=null;ui.delConfirm=null;render();}return;
  case 'fechar':ui.modal=null;ui.delConfirm=null;break;
  case 'role':ui.lousaFull=false;ui.role=v;ui.modal=null;checarSenha();break;
  case 'tab':ui.descConfirm=false;ui.lousaFull=false;ui.tela[ui.role]=v;if(!ui.modal||ui.modal.tipo!=='senha')ui.modal=null;if(v!=='jogadas')ui.vl=null;break;
  case 'tela':ui.tela[ui.role]=v;ui.fotoTmp=null;ui.posSel=[];loginEditado=false;break;
  case 'cat':ui.cat=v;break;
  case 'catProf':ui.catProf=v;ui.ag.dia=null;break;
  case 'abrirAluno':ui.modal={tipo:'aluno',id:v};ui.posSel=al(v).pos.slice();ui.delConfirm=null;break;
  case 'delAluno':if(ui.delConfirm!==v){ui.delConfirm=v;break;}S.alunos=S.alunos.filter(x=>x.id!==v);ui.modal=null;ui.delConfirm=null;save();toast('Aluno excluído.');return;
  /* agenda */
  case 'agView':(ui.role==='aluno'?ui.agA:ui.ag).view=v;break;
  case 'agTipo':ui.ag.tipo=v;break;
  case 'agSem':ui.ag.semana+=+v;break;
  case 'agMes':{const st=ui.role==='aluno'?ui.agA:ui.ag;if(!st.mes)st.mes=HOJE.slice(0,7);const [y,m]=st.mes.split('-').map(Number),d=new Date(y,m-1+(+v),1);st.mes=d.getFullYear()+'-'+pad(d.getMonth()+1);st.dia=null;break;}
  case 'agDia':{const st=ui.role==='aluno'?ui.agA:ui.ag;st.dia=st.dia===v?null:v;break;}
  case 'novoEvento':ui.modal={tipo:'evForm',d:novoDraft(v||null)};break;
  case 'evDet':ui.modal={tipo:'evDet',id:v};break;
  case 'evEditar':ui.modal={tipo:'evForm',d:draftDe(ev(v),false)};break;
  case 'evDup':ui.modal={tipo:'evForm',d:draftDe(ev(v),true)};toast('Cópia criada para a semana seguinte. Ajuste e salve.');return;
  case 'atvAdd':{const f=document.querySelector('form[data-f=evento]');capturaEv(f);ui.modal.d.atividades.push({nome:'',min:10,lousa:''});break;}
  case 'atvDel':{const f=document.querySelector('form[data-f=evento]');capturaEv(f);ui.modal.d.atividades.splice(+v,1);break;}
  case 'convocar':ui.modal={tipo:'convocar',id:v};break;
  case 'convTodos':document.querySelectorAll('#convList input').forEach(i=>i.checked=v==='1');return;
  case 'chamada':ui.modal={tipo:'chamada',id:v};break;
  case 'cancelarEv':ui.modal={tipo:'cancelar',id:v};break;
  case 'reativar':{const x=ev(v);x.cancelado=false;x.motivo='';notif('cat:'+x.cat,evTitulo(x)+' de '+fmtD(x.data)+' está confirmado de novo.');save();ui.modal={tipo:'evDet',id:v};toast('Reativado. Os alunos foram avisados.');return;}
  case 'lembrete':{const x=ev(v);let n=0;alunosCat(x.cat).forEach(al_=>{if(!x.conf[al_.id]){notif(al_.id,'Lembrete: confirme se vai em '+evTitulo(x)+' ('+fmtD(x.data)+', '+x.hora+').');n++;}});save();toast(n?'Lembrete enviado para '+n+' alunos sem resposta.':'Todos já responderam.');return;}
  case 'conf':{const p=v.split('|'),y=ev(p[0]);y.conf[ui.alunoAtual]=p[1];save();if(y.sub==='Coletivo'){toast(p[1]==='vai'?'Presença confirmada. Você está no coletivo.':'Tudo bem, você saiu da lista do coletivo.');return;}break;}
  case 'resumo':ui.modal={tipo:'resumo',id:v};break;
  case 'abrirJogada':if(ui.role==='aluno'){const o=lousa(v);if(o&&o.cat===al(ui.alunoAtual).cat){ui.tela.aluno='jogadas';ui.vl={id:v,obj:clone(o),q:0};}else{toast('Essa jogada é de outra categoria.');return;}}else{ui.tela.professor='lousa';ui.lousa=Object.assign(clone(lousa(v)),{ferramenta:'mover',sel:null,benchSel:null,qAtual:null,undo:[],redo:[]});}ui.modal=null;break;
  /* ao vivo */
  case 'aoVivoDe':iniciarLiveDe(v);break;
  case 'cron':L.rodando=!L.rodando;wake(L.rodando);save();break;
  case 'ajTempo':L.seg=Math.max(0,L.seg+(+v));save();break;
  case 'fimTempo':wake(false);mutLive(L=>{L.rodando=false;L.fase='intervalo';addLance(L,{time:'a',tipo:'marco',texto:'Fim do 1º tempo: '+L.placar.a+' x '+L.placar.b});});toast('Intervalo. Placar: '+L.placar.a+' x '+L.placar.b+'.');return;
  case 'segTempo':mutLive(L=>{const fim=gameSec(L);Object.keys(L.entrou).forEach(id=>{L.minutos[id]=(L.minutos[id]||0)+Math.max(0,fim-L.entrou[id]);});L.periodo=2;L.seg=0;L.fase='jogo';L.rodando=true;const ini=gameSec(L);Object.keys(L.entrou).forEach(id=>L.entrou[id]=ini);addLance(L,{time:'a',tipo:'marco',texto:'Começou o 2º tempo'});});break;
  case 'undoLive':{const p=L.undo.pop();if(!p)return;p.undo=L.undo;if(p.periodo===L.periodo){p.seg=L.seg;p.rodando=L.rodando;}S.live=p;save();toast('Última ação desfeita.');return;}
  case 'delLance':mutLive(L=>{const l=L.lances.find(z=>z.id===v);if(!l)return;const s=L.stats[l.time];
    if(l.tipo==='gol'){L.placar[l.time]=Math.max(0,L.placar[l.time]-1);s.chutes=Math.max(0,s.chutes-1);s.noGol=Math.max(0,s.noGol-1);}
    if(l.tipo==='chute'){s.chutes=Math.max(0,s.chutes-1);if(l.detalhe==='gol')s.noGol=Math.max(0,s.noGol-1);}
    if(l.tipo==='amarelo'){s.amarelos=Math.max(0,s.amarelos-1);if(l.aluno&&L.cart[l.aluno])L.cart[l.aluno].am=Math.max(0,L.cart[l.aluno].am-1);}
    L.lances=L.lances.filter(z=>z.id!==v);});break;
  case 'tmAcao':{const [t,x]=v.split('|');const temJ=!!L.campo[t];
    if(x==='gol'){ui.modal={tipo:'gol',time:t};break;}
    if(x==='cartao'){ui.modal={tipo:'cartao',time:t};break;}
    if(x==='sub'){ui.modal={tipo:'sub',time:t};break;}
    if(x==='penDef'){ui.modal={tipo:'penDef',time:t};break;}
    mutLive(L=>{const s=L.stats[t];if(x==='chuteGol'){s.chutes++;s.noGol++;addLance(L,{time:t,tipo:'chute',detalhe:'gol'});}if(x==='chuteFora'){s.chutes++;addLance(L,{time:t,tipo:'chute',detalhe:'fora'});}if(x==='escanteio')s.escanteios++;if(x==='falta')s.faltas++;});
    if(!temJ||['escanteio','falta'].includes(x))toast({chuteGol:'Chute no gol',chuteFora:'Chute para fora',escanteio:'Escanteio',falta:'Falta'}[x]+' · '+nomeTime(L,t));else render();return;}
  case 'plAbrir':{const [t,id]=v.split('|');ui.modal={tipo:'pl',time:t,id};break;}
  case 'plAcao':{const {time:t,id}=ui.modal;
    if(v==='gol'){ui.modal={tipo:'gol',time:t,autor:id};break;}
    if(v==='sub'){ui.modal={tipo:'sub',time:t,sai:id};break;}
    mutLive(L=>{const s=L.stats[t],o=t==='a'?'b':'a';
      if(v==='chuteGol'){s.chutes++;s.noGol++;addLance(L,{time:t,tipo:'chute',detalhe:'gol',aluno:id});}
      if(v==='chuteFora'){s.chutes++;addLance(L,{time:t,tipo:'chute',detalhe:'fora',aluno:id});}
      if(v==='defesa'){L.stats[o].chutes++;L.stats[o].noGol++;addLance(L,{time:t,tipo:'defesa',aluno:id});}
      if(v==='penDef'){addLance(L,{time:t,tipo:'penalti_defendido',aluno:id});}
      if(v==='falta')s.faltas++;
      if(v==='amarelo'||v==='vermelho')cartao(L,t,id,v);});
    ui.modal=null;break;}
  case 'entrar':{const [t,id]=v.split('|');ui.modal={tipo:'entrarPl',time:t,id};break;}
  case 'soEntrar':{const {time:t,id}=ui.modal;mutLive(L=>{L.banco[t]=L.banco[t].filter(x=>x!==id);L.campo[t].push(id);L.entrou[id]=gameSec(L);if(!L.jogou.includes(id))L.jogou.push(id);addLance(L,{time:t,tipo:'marco',texto:nomeDe(id)+' entrou em campo'});});ui.modal=null;break;}
  case 'sortear':{const rows=[...document.querySelectorAll('[data-pool]')].map(r=>({r,a:al(r.getAttribute('data-pool'))}));
    rows.sort(()=>Math.random()-.5);rows.sort((x,y)=>(ORD[x.a.pos[0]]??3)-(ORD[y.a.pos[0]]??3));
    rows.forEach((x,i)=>{const t=(i%4===0||i%4===3)?'a':'b';const inp=x.r.querySelector(`input[value="${t}"]`);if(inp)inp.checked=true;});
    el.textContent='Sortear de novo';return;}
  case 'addRes':{const [t,id]=v.split('|'),e=ev(L.ev);let campo=false;
    mutLive(L=>{L.time[id]=t;if(L.campo[t].length<L.n){L.campo[t].push(id);L.entrou[id]=gameSec(L);if(!L.jogou.includes(id))L.jogou.push(id);campo=true;}else L.banco[t].push(id);
      addLance(L,{time:t,tipo:'marco',texto:nomeDe(id)+(campo?' entrou em campo pelo ':' foi para o banco do ')+nomeTime(L,t)});});
    e.conf[id]='vai';if(e.grupo==='treino')e.chamada[id]='P';save();
    toast(pNome(id)+(campo?' entrou em campo pelo ':' foi para o banco do ')+nomeTime(S.live,t)+'. Presença marcada.');return;}
  case 'irLousa':ui.tela.professor='lousa';break;
  case 'irDica':ui.tela.professor='dicas';ui.dAba='enviar';break;
  case 'irMetas':ui.tela.professor='dicas';ui.dAba='metas';break;
  case 'irHist':ui.tela.professor='dicas';ui.dAba='hist';break;
  case 'irCat':ui.cat=v;ui.tela.dono='alunos';break;
  case 'rapida':ui.modal={tipo:'rapida'};break;
  case 'chamadaRapida':{const x=ev(v);let p=0;alunosCat(x.cat).forEach(a_=>{const st=x.conf[a_.id]==='nao'?'F':'P';x.chamada[a_.id]=st;if(st==='P')p++;});save();toast('Chamada feita: '+p+' presentes. Quem avisou que não ia ficou com falta.');return;}
  case 'todosP':document.querySelectorAll('form[data-f=chamada] input[value=P]').forEach(i=>{i.checked=true;});return;
  case 'ultEsc':{const m=S.ultEsc[v]||{};Object.keys(m).forEach(id=>{const i=document.querySelector(`form[data-f=liveStart] input[name$="_${id}"][value="${m[id]}"]`);if(i)i.checked=true;});el.textContent='Última escalação aplicada';return;}
  case 'estadio':ui.estadio=!ui.estadio;try{if(ui.estadio&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});if(!ui.estadio&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});}catch(err){}break;
  case 'descartar':if(!ui.descConfirm){ui.descConfirm=true;break;}S.live=null;ui.descConfirm=false;ui.estadio=false;wake(false);save();toast('Partida descartada. Nada foi salvo.');return;
  case 'posTog':{const i=ui.posSel.indexOf(v);if(i>=0)ui.posSel.splice(i,1);else ui.posSel.push(v);const f=document.getElementById('posField');if(f)f.outerHTML=posPicker();return;}
  case 'salvarPos':{const b=al(ui.modal.id);if(!ui.posSel.length){toast('Escolha pelo menos a posição principal.');return;}b.pos=ui.posSel.slice();save();toast('Posições de '+primeiro(b.nome)+' salvas: '+posTxt(b)+'.');return;}
  case 'lzFull':ui.lousaFull=true;if(ui.lousa)ui.lousa.sel=null;try{const de=document.documentElement;if(de.requestFullscreen)de.requestFullscreen().then(()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{});}catch(e){}}).catch(()=>{});}catch(err){}break;
  case 'lzFullX':ui.lousaFull=false;try{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}catch(err){}break;
  case 'virar':{const f=document.querySelector('.flip');if(f)f.classList.toggle('virada');return;}
  case 'fxFechar':if(ui.fx&&ui.fx.tipo==='cq'){S.vistas[ui.fx.aluno]=(S.vistas[ui.fx.aluno]||[]).concat(ui.fx.ids);ui.cqDestaque=ui.fx.ids;save();}ui.fx=null;break;
  case 'encerrar':ui.modal={tipo:'encerrar'};L.rodando=false;ui.descConfirm=false;break;
  case 'liveLousa':ui.lousa=lousaDoLive();ui.tela.professor='lousa';break;
  /* lousa */
  case 'ferr':Lz.ferramenta=v;Lz.sel=null;break;
  case 'lzCampo':Lz.campo=v;Lz.vw=null;break;
  case 'maoTog':if(Lz.ferramenta==='mao'){Lz.ferramenta=Lz.ferrAnt&&Lz.ferrAnt!=='mao'?Lz.ferrAnt:'mover';toast('Mãozinha desligada. Agora você mexe nos jogadores.');return;}
    Lz.ferrAnt=Lz.ferramenta;Lz.ferramenta='mao';Lz.sel=null;
    if(zoomPct(Lz)<=100&&Lz.campo!=='meio'){zoomView(Lz,1.6);toast('Aproximei o campo para você poder arrastar. Toque na mãozinha de novo para voltar.');return;}
    toast('Arraste o campo com o dedo ou o mouse. Toque na mãozinha de novo para voltar.');return;
  case 'lzZoom':if(v==='fit'){Lz.vw=null;Lz.campo='inteiro';}else zoomView(Lz,v==='in'?1.3:1/1.3);break;
  case 'lzReset':{if(!ui.resetConfirm){ui.resetConfirm=true;break;}ui.resetConfirm=false;
    if(Lz.rec){clearInterval(recIv);recIv=null;delete Lz.rec;}Lz.stop=true;
    const keep={id:Lz.id,nome:Lz.nome,desc:Lz.desc,tag:Lz.tag,advNome:Lz.advNome,advCor:Lz.advCor,mostrarAdv:Lz.mostrarAdv,mostrarNomes:Lz.mostrarNomes,vel:Lz.vel,loop:Lz.loop};
    ui.lousa=Object.assign(montarLousa(alunosCat(Lz.cat),Lz.cat,Lz.n,Lz.fa,Lz.fb),keep);
    toast('Tudo redefinido: formação original, sem desenhos, sem gravação e campo inteiro.');return;}
  case 'lzUndo':{const p=Lz.undo.pop();if(!p)return;Lz.redo.push(JSON.stringify(snapL(Lz)));Object.assign(Lz,JSON.parse(p));break;}
  case 'lzRedo':{const p=Lz.redo.pop();if(!p)return;Lz.undo.push(JSON.stringify(snapL(Lz)));Object.assign(Lz,JSON.parse(p));break;}
  case 'lzLimpar':pushUndo(Lz);Lz.itens=[];break;
  case 'lzFormar':{pushUndo(Lz);const pa=formar(FORM[Lz.n][Lz.fa]),pb=formar(FORM[Lz.n][Lz.fb]);Lz.casa.forEach((q,i)=>{if(pa[i])Object.assign(q,pa[i]);});Lz.fora.forEach((q,i)=>{if(pb[i]){q.x=1-pb[i].x;q.y=pb[i].y;}});Lz.bola={x:.5,y:.5};break;}
  case 'lzAvulso':pushUndo(Lz);if(v==='c')Lz.casa.push({aid:null,num:Lz.casa.length+1,nome:'Avulso',x:.4,y:.5});else Lz.fora.push({num:Lz.fora.length+1,nome:'',x:.6,y:.5});break;
  case 'lzSelX':Lz.sel=null;break;
  case 'lzRemPl':{pushUndo(Lz);const q=Lz.sel.split(':');(q[0]==='c'?Lz.casa:Lz.fora).splice(+q[1],1);Lz.sel=null;break;}
  case 'bench':Lz.benchSel=Lz.benchSel===v?null:v;Lz.sel=null;break;
  case 'lzQ':{const i=+v;aplicarQuadro(Lz,Lz.quadros[i]);Lz.qAtual=i;break;}
  case 'lzQNovo':Lz.quadros.push(snapL(Lz));Lz.qAtual=Lz.quadros.length-1;toast('Quadro '+Lz.quadros.length+' salvo. Mova os jogadores e crie o próximo.');return;
  case 'lzQAtual':Lz.quadros[Lz.qAtual]=snapL(Lz);toast('Quadro '+(Lz.qAtual+1)+' atualizado.');return;
  case 'lzQDel':Lz.quadros.splice(Lz.qAtual,1);Lz.qAtual=null;break;
  case 'lzPlay':Lz.sel=null;tocar(Lz);return;
  case 'recStart':Lz.stop=true;iniciarGravacao(Lz);toast('Gravando. Mova os jogadores e toque em Parar quando terminar.');return;
  case 'recStop':pararGravacao(Lz);return;
  case 'recDel':if(Lz.gravacao){aplicarFlat(Lz,Lz.gravacao.frames[0].p);Lz.itens=clone(Lz.gravacao.itens[0].its);}delete Lz.gravacao;toast('Gravação excluída.');return;
  case 'lzStop':Lz.stop=true;return;
  case 'lzNova':ui.lousa=montarLousa(alunosCat(Lz?Lz.cat:ui.catProf),Lz?Lz.cat:ui.catProf,Lz?Lz.n:7);break;
  case 'lzDoLive':ui.lousa=lousaDoLive();break;
  case 'lzTag':ui.lzTag=v||null;break;
  case 'lzAbrir':ui.lousa=Object.assign(clone(lousa(v)),{stop:true,ferramenta:'mover',sel:null,benchSel:null,qAtual:null,undo:[],redo:[],playing:false});break;
  case 'lzDup':{const c=clone(lousa(v));c.id=uid();c.nome=c.nome+' (cópia)';S.lousas.push(c);save();toast('Jogada duplicada.');return;}
  case 'lzDel':S.lousas=S.lousas.filter(z=>z.id!==v);if(Lz&&Lz.id===v)Lz.id=null;save();break;
  case 'verLousa':{const o=lousa(v);ui.vl={id:v,obj:Object.assign(clone(o),{sel:null,benchSel:null,playing:false}),q:0};if(o.gravacao){aplicarFlat(ui.vl.obj,o.gravacao.frames[0].p);ui.vl.obj.itens=clone(o.gravacao.itens[0].its);}break;}
  case 'alQ':{const vl=ui.vl;vl.q=Math.max(0,Math.min(vl.obj.quadros.length-1,vl.q+(+v)));aplicarQuadro(vl.obj,vl.obj.quadros[vl.q]);break;}
  case 'alPlay':tocar(ui.vl.obj);return;
  case 'alStop':ui.vl.obj.stop=true;return;
  /* dicas */
  case 'dAba':ui.dAba=v;break;
  case 'dModelo':{const t=document.getElementById('dTexto');if(t){t.value=MODELOS[ui.dDraft.tipo][+v];ui.dDraft.texto=t.value;}return;}
  case 'dFixar':{const d=S.dicas.find(z=>z.id===v);if(!d.fixada)S.dicas.forEach(z=>{if(z.aluno===d.aluno)z.fixada=false;});d.fixada=!d.fixada;save();break;}
  case 'dDel':S.dicas=S.dicas.filter(z=>z.id!==v);save();break;
  case 'dEntendi':{const d=S.dicas.find(z=>z.id===v);d.entendida=true;d.lida=true;save();toast('O professor vai ver que você entendeu.');return;}
  case 'metaTog':{const m=S.metas.find(z=>z.id===v);m.status=m.status==='concluida'?'andamento':'concluida';if(m.status==='concluida')notif(m.aluno,'Meta concluída: '+m.texto+'. Parabéns!');save();break;}
  case 'metaDel':S.metas=S.metas.filter(z=>z.id!==v);save();break;
  case 'reset':try{localStorage.removeItem(KEY);}catch(err){}S=seed();ui.liveSetup=null;ui.lousa=null;ui.vl=null;ui.modal=null;toast('Dados de demonstração restaurados.');return;
  default:return;
  }
  render();
}
function capDraftDica(){const f=document.querySelector('form[data-f=dica]');if(!f)return;const fd=new FormData(f),d=ui.dDraft;d.texto=fd.get('texto')||'';d.ev=fd.get('ev')||'';d.lousa=fd.get('lousa')||'';d.fixar=!!fd.get('fixar');if(fd.has('alunos'))d.alunos=fd.getAll('alunos');}
function chgLocal(k,el){
  if(gravando()&&['lzN','lzCat'].includes(k)){toast('Pare a gravação primeiro.');render();return;}
  const Lz=ui.lousa;
  switch(k){
  case 'aluno':ui.alunoAtual=el.value;ui.vl=null;checarSenha();render();break;
  case 'liveEv':ui.liveSetup=el.value?{ev:el.value,n:7}:null;render();break;
  case 'liveN':ui.liveSetup.n=+el.value;render();break;
  case 'lzCat':ui.lousa=montarLousa(alunosCat(el.value),el.value,Lz.n);ui.catProf=el.value;render();break;
  case 'lzN':{const n=+el.value,o=Lz;ui.lousa=montarLousa(alunosCat(o.cat),o.cat,n);Object.assign(ui.lousa,{advNome:o.advNome,advCor:o.advCor,itens:o.itens,nome:o.nome,desc:o.desc,tag:o.tag,id:o.id,campo:o.campo});render();break;}
  case 'lzFa':case 'lzFb':{pushUndo(Lz);const casa=k==='lzFa';Lz[casa?'fa':'fb']=el.value;const ps=formar(FORM[Lz.n][el.value]);(casa?Lz.casa:Lz.fora).forEach((q,i)=>{if(ps[i]){q.x=casa?ps[i].x:1-ps[i].x;q.y=ps[i].y;}});render();break;}
  case 'lzAdv':Lz.advNome=el.value||'Adversário';bindCampo(Lz,true);break;
  case 'lzCor':Lz.advCor=el.value;bindCampo(Lz,true);break;
  case 'lzAdvOn':Lz.mostrarAdv=el.checked;bindCampo(Lz,true);break;
  case 'lzNomes':Lz.mostrarNomes=el.checked;bindCampo(Lz,true);break;
  case 'lzVel':Lz.vel=+el.value;break;
  case 'lzLoop':Lz.loop=el.checked;break;
  case 'plNome':case 'plNum':{const q=Lz.sel.split(':'),p=(q[0]==='c'?Lz.casa:Lz.fora)[+q[1]];pushUndo(Lz);p[k==='plNome'?'nome':'num']=el.value;bindCampo(Lz,true);break;}
  case 'grupoEv':case 'catEv':{const f=el.form;capturaEv(f);if(k==='grupoEv'){ui.modal.d.grupo=el.value;ui.modal.d.sub=SUBS[el.value][0];}render();break;}
  case 'repetir':{capturaEv(el.form);ui.modal.d.repetir=el.checked;if(el.checked&&!ui.modal.d.dias.length)ui.modal.d.dias=[String(dow(ui.modal.d.data))];render();break;}
  case 'dModo':capDraftDica();ui.dDraft.modo=el.value;ui.dDraft.alunos=[];render();break;
  case 'dTipo':capDraftDica();ui.dDraft.tipo=el.value;render();break;
  case 'dCat':capDraftDica();ui.dDraft.cat=el.value;ui.dDraft.alunos=[];render();break;
  case 'dAluno':capDraftDica();ui.dDraft.alunos=[el.value];render();break;
  case 'fAluno':ui.dFiltro.aluno=el.value;render();break;
  case 'fTipo':ui.dFiltro.tipo=el.value;render();break;
  case 'nascNovo':{const c=catPorAno(+el.value.slice(0,4),0),s=document.getElementById('catNovo');if(c&&s)s.value=c.id;break;}
  case 'foto':{const f=el.files&&el.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{const img=new Image();img.onload=()=>{const cv=document.createElement('canvas'),sz=180;cv.width=sz;cv.height=sz;const m=Math.min(img.width,img.height);cv.getContext('2d').drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,sz,sz);ui.fotoTmp=cv.toDataURL('image/jpeg',.78);const p=document.getElementById('fotoPrev');if(p)p.innerHTML=`<img class="av" src="${ui.fotoTmp}" alt="" style="width:96px;height:96px">`;};img.src=rd.result;};rd.readAsDataURL(f);break;}
  }
}
function subLocal(k,f){
  const fd=new FormData(f);
  switch(k){
  case 'novo':{
    const pos=ui.posSel.slice();if(!pos.length){toast('Escolha pelo menos a posição principal.');return;}
    const num=fd.get('num'),lg=fd.get('login').trim().toLowerCase();
    if(!/^[a-z0-9._]{3,24}$/.test(lg)){toast('Nome de usuário: 3 a 24 caracteres, só letras, números e ponto.');return;}
    if(S.alunos.some(x=>x.login===lg)){toast('O usuário @'+lg+' já existe. Escolha outro.');return;}
    const a={id:uid(),nome:fd.get('nome').trim(),nasc:fd.get('nasc'),pos,num:num?+num:null,cat:fd.get('cat'),resp:fd.get('resp').trim(),cel:fd.get('cel').trim(),login:lg,senhaTrocada:false,foto:ui.fotoTmp,presBase:0,promovido:false,hist:[]};
    S.alunos.push(a);save();ui.fotoTmp=null;ui.posSel=[];ui.cat=a.cat;ui.tela.dono='alunos';ui.modal={tipo:'cred',id:a.id};break;}
  case 'promo':{const ids=fd.getAll('p');ids.forEach(id=>{const x=al(id),alvo=catPorAno(+x.nasc.slice(0,4),1);x.hist.push(catNome(x.cat)+' → '+alvo.nome+' ('+new Date().toLocaleDateString('pt-BR')+')');x.cat=alvo.id;x.promovido=true;notif(x.id,'Parabéns! Você subiu para o '+alvo.nome+'. Conquista liberada: Promovido.');});save();toast(ids.length+' alunos promovidos.');return;}
  case 'mudarCat':{const b=al(ui.modal.id),nc=fd.get('cat');if(nc===b.cat){toast('O aluno já está nessa categoria.');return;}const sobe=cat(nc).ini<cat(b.cat).ini;b.hist.push(catNome(b.cat)+' → '+catNome(nc)+' ('+new Date().toLocaleDateString('pt-BR')+')');b.cat=nc;if(sobe){b.promovido=true;notif(b.id,'Parabéns! Você subiu para o '+catNome(nc)+'.');}save();toast('Categoria alterada para '+catNome(nc)+'.');return;}
  case 'evento':{
    capturaEv(f);const d=ui.modal.d;
    if(d.fim<=d.hora){toast('O horário de fim precisa ser depois do início.');return;}
    const plano=d.grupo==='treino'?{objetivo:(d.objetivo||'').trim(),atividades:d.atividades.filter(x=>x.nome&&x.nome.trim()).map(x=>({nome:x.nome.trim(),min:+x.min||0,lousa:x.lousa||''}))}:null;
    const base={cat:d.cat,grupo:d.grupo,sub:d.sub,titulo:d.grupo==='treino'?d.titulo.trim():d.sub,hora:d.hora,fim:d.fim,chegada:d.grupo==='jogo'?d.chegada:'',local:d.local.trim(),adv:d.grupo==='jogo'?d.adv.trim():'',mando:d.mando||'casa',uniforme:d.uniforme.trim(),levar:d.levar,plano,obs:d.obs.trim()};
    if(d.id){const e=ev(d.id),mud=[];if(e.data!==d.data)mud.push('data');if(e.hora!==d.hora)mud.push('horário');if(e.local!==base.local)mud.push('local');Object.assign(e,base,{data:d.data});notif('cat:'+e.cat,evTitulo(e)+' ('+fmtD(e.data)+') foi alterado'+(mud.length?': mudou '+mud.join(', '):'')+'.');save();ui.modal={tipo:'evDet',id:e.id};toast('Alterações salvas. Os alunos foram avisados.');return;}
    const datas=[];
    if(d.grupo==='treino'&&d.repetir){if(!d.dias.length){toast('Escolha pelo menos um dia da semana.');return;}for(let x=d.data;x<=d.ate&&datas.length<60;x=addD(x,1))if(d.dias.includes(String(dow(x))))datas.push(x);if(!datas.length){toast('Nenhuma data entre o início e o fim da repetição.');return;}}
    else datas.push(d.data);
    const serie=datas.length>1?uid():null;
    datas.forEach(dt=>S.eventos.push(Object.assign({id:uid(),data:dt,cancelado:false,motivo:'',convocados:[],conf:{},chamada:{},encerrado:false,placar:null,part:[],conta:true,minutos:{},stats:null,serie},clone(base))));
    notif('cat:'+d.cat,datas.length>1?`Novos treinos semanais: ${base.titulo} (${datas.length} datas a partir de ${fmtD(datas[0])}).`:`Novo ${d.grupo==='jogo'?'jogo: '+evTitulo(base):'treino: '+base.titulo} em ${fmtD(datas[0])} às ${base.hora}.${base.sub==='Coletivo'?' Confirme presença para entrar nos times.':''}`);
    save();ui.catProf=d.cat;ui.modal=null;toast(datas.length>1?datas.length+' treinos marcados. Os alunos foram avisados.':'Marcado. Os alunos do '+catNome(d.cat)+' foram avisados.');return;}
  case 'convocar':{const e=ev(ui.modal.id),novos=fd.getAll('c'),jg=e.grupo==='jogo';
    novos.forEach(id=>{if(!e.convocados.includes(id))notif(id,jg?'Você foi convocado para '+evTitulo(e)+' ('+fmtD(e.data)+', chegada '+(e.chegada||e.hora)+').':'Você foi convocado para o coletivo de '+fmtD(e.data)+' às '+e.hora+'. Sua presença já está confirmada.');});
    if(!jg){novos.forEach(id=>{e.conf[id]='vai';});e.convocados.filter(id=>!novos.includes(id)).forEach(id=>{if(e.conf[id]==='vai')delete e.conf[id];});}
    e.convocados=novos;save();ui.modal={tipo:'evDet',id:e.id};toast(novos.length+' convocados.'+(jg?' Os novos foram avisados.':' Presença confirmada para todos eles.'));return;}
  case 'chamada':{const e=ev(ui.modal.id);alunosCat(e.cat).forEach(a=>{const v=fd.get('p_'+a.id);if(v)e.chamada[a.id]=v;});save();ui.modal=null;const p=Object.values(e.chamada).filter(x=>x==='P').length;toast('Chamada salva: '+p+' presentes.');return;}
  case 'cancelar':{const e=ev(ui.modal.id),motivo=fd.get('motivo').trim(),alvo=fd.get('serie')?S.eventos.filter(x=>x.serie===e.serie&&x.data>=e.data&&!x.encerrado):[e];alvo.forEach(x=>{x.cancelado=true;x.motivo=motivo;});notif('cat:'+e.cat,(alvo.length>1?alvo.length+' treinos de '+e.titulo+' a partir de '+fmtD(e.data)+' foram cancelados':evTitulo(e)+' de '+fmtD(e.data)+' foi cancelado')+'. Motivo: '+motivo);save();ui.modal=null;toast('Cancelado. Os alunos foram avisados.');return;}
  case 'liveStart':{
    const st=ui.liveSetup,e=ev(st.ev),jogo=e.grupo==='jogo',n=+fd.get('n'),campo={a:[],b:jogo?null:[]},banco={a:[],b:[]},time={};
    const lista=porPosicao(alunosCat(e.cat));
    if(jogo){lista.forEach(a=>{const v=fd.get('e_'+a.id);if(v==='t'){campo.a.push(a.id);time[a.id]='a';}if(v==='r'){banco.a.push(a.id);time[a.id]='a';}});if(!campo.a.length){toast('Escolha os titulares.');return;}if(campo.a.length>n){toast('Você escolheu '+campo.a.length+' titulares para '+n+' vagas.');return;}}
    else{lista.forEach(a=>{const v=fd.get('t_'+a.id);if(v==='a'||v==='b'){(campo[v].length<n?campo[v]:banco[v]).push(a.id);time[a.id]=v;}});if(!campo.a.length||!campo.b.length){toast('Coloque jogadores nos dois times.');return;}}
    const entrou={};[...campo.a,...(campo.b||[])].forEach(id=>entrou[id]=0);
    const mk={};lista.forEach(a=>{const v=fd.get((jogo?'e_':'t_')+a.id);if(v)mk[a.id]=v;});S.ultEsc[e.cat+'|'+(jogo?'j':'c')]=mk;
    S.live={ev:e.id,jogo,adv:jogo?(fd.get('adv')||e.adv).trim():'Time B',n,dur:+fd.get('dur'),tempos:+fd.get('tempos'),periodo:1,seg:0,rodando:false,fase:'jogo',placar:{a:0,b:0},campo,banco,time,entrou,minutos:{},jogou:Object.keys(entrou),cart:{},expulsos:[],stats:{a:zStats(),b:zStats()},lances:[],undo:[]};
    ui.liveSetup=null;save();break;}
  case 'gol':{const t=ui.modal.time,autor=fd.get('autor')||null;let as=fd.get('assist')||null;if(as===autor)as=null;
    mutLive(L=>{L.placar[t]++;L.stats[t].chutes++;L.stats[t].noGol++;addLance(L,{time:t,tipo:'gol',aluno:autor,assist:as,detalhe:fd.get('detalhe')||'normal'});});
    ui.modal=null;const Lg=S.live,dt=fd.get('detalhe');ui.fx={tipo:'gol',texto:(autor?nomeDe(autor):nomeTime(Lg,t))+(DET[dt]?' · '+DET[dt]:'')+(as?' · assistência de '+pNome(as):''),placar:nomeTime(Lg,'a')+' '+Lg.placar.a+' x '+Lg.placar.b+' '+nomeTime(Lg,'b')};vibrar([200,80,200,80,400]);clearTimeout(vFx._t);vFx._t=setTimeout(()=>{if(ui.fx&&ui.fx.tipo==='gol'){ui.fx=null;render();}},2800);render();return;}
  case 'penDef':{const t=ui.modal.time;mutLive(L=>addLance(L,{time:t,tipo:'penalti_defendido',aluno:fd.get('aluno')}));ui.modal=null;break;}
  case 'cartao':{const t=ui.modal.time;mutLive(L=>cartao(L,t,fd.get('aluno')||null,fd.get('cor')));ui.modal=null;break;}
  case 'sub':{const t=ui.modal.time,sai=fd.get('sai'),entra=fd.get('entra');if(!sai||!entra)return;
    mutLive(L=>{tirarDeCampo(L,sai);L.banco[t].push(sai);L.banco[t]=L.banco[t].filter(x=>x!==entra);L.campo[t].push(entra);L.entrou[entra]=gameSec(L);if(!L.jogou.includes(entra))L.jogou.push(entra);addLance(L,{time:t,tipo:'sub',sai,entra});});
    ui.modal=null;toast('Entra '+pNome(entra)+', sai '+pNome(sai)+'.');return;}
  case 'encerrar':{
    const L=S.live,e=ev(L.ev),fim=gameSec(L);
    Object.keys(L.entrou).forEach(id=>{L.minutos[id]=(L.minutos[id]||0)+Math.max(0,fim-L.entrou[id]);});
    const part=L.jogou.slice(),antes={};part.forEach(id=>antes[id]=cqAluno(id));
    const mins={};part.forEach(id=>mins[id]=Math.round((L.minutos[id]||0)/60));
    Object.assign(e,{encerrado:true,placar:{a:L.placar.a,b:L.placar.b},part,conta:!!fd.get('conta'),minutos:mins,stats:clone(L.stats),obs:(fd.get('obs')||'').trim()});
    L.lances.filter(l=>l.tipo!=='marco').forEach(l=>{const c=Object.assign({},l,{ev:e.id});delete c.gs;S.lances.push(c);});
    let total=0;part.forEach(id=>{cqAluno(id).forEach(c=>{if(!antes[id].includes(c)){total++;notif(id,'Conquista liberada: '+CQ.find(z=>z.id===c).nome+'!');}});});
    notif('cat:'+e.cat,(L.jogo?'Fim de jogo: '+evTitulo(e)+' · '+e.placar.a+' x '+e.placar.b:'Coletivo encerrado: '+e.placar.a+' x '+e.placar.b)+'. Veja o resumo na agenda.');
    S.live=null;ui.estadio=false;wake(false);save();ui.modal={tipo:'resumo',id:e.id};toast('Partida salva.'+(e.conta?' '+total+' conquistas liberadas.':' Não contou na carta.'));return;}
  case 'lzSalvar':{
    const Lz=ui.lousa;Lz.nome=fd.get('nome').trim();Lz.tag=fd.get('tag');Lz.desc=fd.get('desc').trim();
    if(Lz.rec)pararGravacao(Lz,false);const cp=clone(Lz);['sel','benchSel','playing','stop','undo','redo','qAtual','rec'].forEach(x=>delete cp[x]);cp.ferramenta='mover';cp.undo=[];cp.redo=[];
    if(Lz.id&&lousa(Lz.id)){S.lousas=S.lousas.map(z=>z.id===Lz.id?cp:z);}else{Lz.id=uid();cp.id=Lz.id;S.lousas.push(cp);notif('cat:'+Lz.cat,'Nova jogada do professor: '+Lz.nome+' ('+Lz.tag+').');}
    save();toast('Jogada "'+Lz.nome+'" salva e compartilhada com o '+catNome(Lz.cat)+'.');return;}
  case 'dica':{
    capDraftDica();const d=ui.dDraft;let alvo=[];
    if(d.modo==='um')alvo=[fd.get('aluno')];else if(d.modo==='varios')alvo=fd.getAll('alunos');else alvo=alunosCat(d.cat).map(a=>a.id);
    alvo=alvo.filter(Boolean);if(!alvo.length){toast('Escolha pelo menos um aluno.');return;}
    alvo.forEach(id=>{if(d.fixar)S.dicas.forEach(z=>{if(z.aluno===id)z.fixada=false;});S.dicas.push({id:uid(),aluno:id,tipo:d.tipo,texto:d.texto.trim(),quando:Date.now(),lida:false,entendida:false,fixada:d.fixar,ev:d.ev||null,lousa:d.lousa||null});notif(id,'Nova dica do professor ('+d.tipo+').');});
    save();ui.dDraft=Object.assign({},d,{texto:'',ev:'',lousa:'',fixar:false});toast('Dica enviada para '+(alvo.length===1?pNome(alvo[0]):alvo.length+' alunos')+'.');return;}
  case 'meta':{const m={id:uid(),aluno:fd.get('aluno'),texto:fd.get('texto').trim(),prazo:fd.get('prazo'),status:'andamento',quando:Date.now()};S.metas.push(m);notif(m.aluno,'Nova meta do professor: '+m.texto+' (até '+fmtD(m.prazo)+').');save();toast('Meta criada para '+pNome(m.aluno)+'.');return;}
  case 'rapida':{const sb=fd.get('sub'),jg=sb!=='Coletivo',adv=(fd.get('adv')||'').trim();if(jg&&!adv){toast('Informe o adversário.');return;}
    const d=new Date(),hi=pad(d.getHours())+':'+pad(d.getMinutes()),d2=new Date(d.getTime()+90*60000),hf=pad(d2.getHours())+':'+pad(d2.getMinutes());
    const e={id:uid(),cat:fd.get('cat'),grupo:jg?'jogo':'treino',sub:sb,titulo:jg?sb:'Coletivo',data:HOJE,hora:hi,fim:hf<hi?'23:59':hf,chegada:'',local:(fd.get('local')||'').trim(),adv,mando:'casa',uniforme:'',levar:[],plano:null,cancelado:false,motivo:'',convocados:[],conf:{},chamada:{},encerrado:false,placar:null,part:[],conta:true,minutos:{},stats:null,obs:'',serie:null,rapida:true};
    S.eventos.push(e);save();ui.catProf=e.cat;ui.tela.professor='aovivo';ui.liveSetup={ev:e.id,n:7};ui.modal=null;toast('Partida criada. Agora escale os times.');return;}
  case 'senha':{const s1=fd.get('s1'),s2=fd.get('s2'),c=al(ui.alunoAtual),err=document.getElementById('senhaErro');if(s1!==s2){err.textContent='As senhas não conferem.';return;}if(s1===senhaPadrao(c.nome)){err.textContent='Escolha uma senha diferente da inicial.';return;}c.senhaTrocada=true;save();ui.modal=null;toast('Senha trocada. Bem-vindo, '+primeiro(c.nome)+'!');return;}
  }
  render();
}

/* ---------- cronômetro ---------- */
let tick=0,ultimoTick=Date.now(),restoMs=0;
// Conta pelo relógio real: com a tela bloqueada o navegador pausa os timers, e na volta soma os segundos que passaram
function umSegundo(L){
  L.seg++;tick++;if(tick%5===0){save();salvarLive();}
  if(L.minJ&&L.dur){L.minuto=minutoLive(L);// minutos em campo seguem contando no aparelho, mesmo sem internet
    if(L.seg%60===0)['a','b'].forEach(t=>(L.campo[t]||[]).forEach(id=>{L.minJ[id]=(L.minJ[id]||0)+1;}));}
  const reg=L.dur*60,t=document.getElementById('timer'),x=document.getElementById('timerExtra');
  if(t)t.textContent=fmtT(Math.min(L.seg,reg));
  if(x)x.textContent=L.seg>reg?'+'+fmtT(L.seg-reg):'';
  if(L.seg===reg){toast(L.tempos===2&&L.periodo===1?'Tempo regulamentar do 1º tempo. Encerre quando quiser.':'Tempo regulamentar. O cronômetro segue nos acréscimos.');return;}
  if(L.seg%60===0)document.querySelectorAll('[data-minp]').forEach(s=>{s.textContent=minJog(L,s.getAttribute('data-minp'));});
}
setInterval(()=>{
  const agora=Date.now(),dt=agora-ultimoTick+restoMs;ultimoTick=agora;
  const L=S.live;if(!L||!L.rodando){restoMs=0;return;}
  const passos=Math.floor(dt/1000);restoMs=dt-passos*1000;
  for(let i=0;i<passos;i++)umSegundo(L);
},1000);

/* ---------- eventos ---------- */
function sugerirUsuario(nome){const p=semAcento(nome).toLowerCase().replace(/[^a-z\s]/g,'').trim().split(/\s+/).filter(Boolean);if(!p.length)return '';const b=p.length>1?p[0]+'.'+p[p.length-1]:p[0];let u=b,k=2;while(S.alunos.some(x=>x.login===u))u=b+(k++);return u;}
let loginEditado=false;
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||t.disabled)return;act(t.getAttribute('data-a'),t.getAttribute('data-v'),t,e);});
document.addEventListener('change',e=>{const t=e.target.closest('[data-ch]');if(t)chg(t.getAttribute('data-ch'),t);});
document.addEventListener('submit',e=>{const f=e.target.closest('form[data-f]');if(!f)return;e.preventDefault();sub(f.getAttribute('data-f'),f);});
document.addEventListener('input',e=>{const di=e.target.getAttribute('data-in');
  if(di==='loginNovo'){loginEditado=!!e.target.value;return;}
  if(di==='nomeNovo'){const lf=document.getElementById('loginNovo');if(lf&&!loginEditado)lf.value=sugerirUsuario(e.target.value);return;}
  if(e.target.id==='dTexto'){ui.dDraft.texto=e.target.value;return;}
  if(di==='buscaRes'){const q=semAcento(e.target.value).toLowerCase();document.querySelectorAll('[data-res]').forEach(r=>{r.style.display=r.getAttribute('data-res').includes(q)?'':'none';});document.querySelectorAll('details.pn').forEach(dt=>{if(q&&dt.querySelector('[data-res]'))dt.open=true;});return;}
  if(di!=='busca')return;const q=semAcento(e.target.value).toLowerCase();document.querySelectorAll('tr[data-nome]').forEach(r=>{r.style.display=r.getAttribute('data-nome').includes(q)?'':'none';});});
let rzT;window.addEventListener('resize',()=>{if(!fullAtivo())return;clearTimeout(rzT);rzT=setTimeout(()=>{if(ui.lousa&&!ui.lousa.playing)bindCampo(ui.lousa,true);},120);});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&ui.lousaFull&&ui.estadio===false){}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&fullAtivo()){ui.lousaFull=false;render();return;}if((e.key==='Enter'||e.key===' ')&&e.target.getAttribute&&e.target.getAttribute('role')==='button'&&e.target.dataset.a){e.preventDefault();act(e.target.dataset.a,e.target.dataset.v,e.target,e);return;}if(e.key==='Escape'&&ui.modal&&ui.modal.tipo!=='senha'){ui.modal=null;render();}});

/* =====================================================================
   CAMADA DE API — substitui o armazenamento local do protótipo
   ===================================================================== */
const API=CFG.api||((location.protocol==='file:'?'http://127.0.0.1:8000':'')+'/api');
let TOKEN=null;try{TOKEN=localStorage.getItem('cp_token');}catch(e){}
class ErroApi extends Error{constructor(m,s){super(m);this.status=s;}}
Object.assign(ui,{user:null,cartas:{},cartaPend:{},naoLidas:0,promo:null,carregandoTudo:false,liveSig:'',liveCarregando:false,marcandoLidas:false});

/* ---------- modo offline: fila de envios ----------
   Sem internet, o que o professor faz fica guardado no aparelho (localStorage) e é enviado em ordem quando a conexão volta. */
let FILA=[];try{FILA=JSON.parse(localStorage.getItem('cp_fila')||'[]');}catch(e){}
let RELOGIO=0;// diferença entre o relógio do servidor e o do aparelho (ms), para as ações offline terem o horário certo
const salvarFila=()=>{try{localStorage.setItem('cp_fila',JSON.stringify(FILA));}catch(e){}};
const novoId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const agoraServ=()=>Date.now()+RELOGIO;
const MSG_FILA='Sem internet: guardado no aparelho. Envia sozinho quando a conexão voltar.';
// Não entram na fila: login/senha, criação que precisa da resposta do servidor e envio de foto
const podeEnfileirar=(p,form)=>!form&&!/^\/(login|senha|logout|partidas\/rapida|usuarios)/.test(p)&&!/resetar-senha/.test(p);
function enfileirar(m,p,body){FILA.push({id:novoId(),u:ui.user&&ui.user.id,m,p,body});salvarFila();}
class ErroFila extends Error{constructor(){super(MSG_FILA);this.status=-1;this.fila=true;}}

async function api(m,p,body,form,daFila){
  // Com algo pendente na fila, novas alterações entram atrás dela para manter a ordem
  if(m!=='GET'&&!daFila&&FILA.length&&podeEnfileirar(p,form)){enfileirar(m,p,body);enviarFila();throw new ErroFila();}
  const h={'Accept':'application/json'};if(TOKEN)h.Authorization='Bearer '+TOKEN;
  let b;if(form)b=form;else if(body!==undefined){h['Content-Type']='application/json';b=JSON.stringify(body);}
  let r;try{r=await fetch(API+p,{method:m,headers:h,body:b});}
  catch(e){
    ui.semRede=true;
    if(m!=='GET'&&!daFila&&podeEnfileirar(p,form)){enfileirar(m,p,body);throw new ErroFila();}
    throw new ErroApi(form||/partidas\/rapida/.test(p)?'Isso precisa de internet. Tente de novo quando a conexão voltar.':'Sem conexão com o servidor. Confira a internet.',0);
  }
  // Resposta do cache do aparelho (service worker) quando não há rede
  if(r.headers.get('X-Offline'))ui.semRede=true;
  else{ui.semRede=false;const dh=Date.parse(r.headers.get('Date')||'');if(dh)RELOGIO=dh-Date.now();}
  const t=await r.text();let j=null;try{j=t?JSON.parse(t):null;}catch(e){}
  if(r.status===401&&p!=='/login'){sair(true);throw new ErroApi('Sua sessão expirou. Entre de novo.',401);}
  if(r.status===423){ui.modal={tipo:'senhaApi'};render();throw new ErroApi('Troque a senha para continuar.',423);}
  if(!r.ok){const e1=j&&j.errors?Object.values(j.errors)[0]:null;throw new ErroApi((e1&&e1[0])||(j&&j.message)||('Erro '+r.status+' no servidor.'),r.status);}
  return j;
}
async function exec(fn){try{await fn();}catch(e){
  if(e.fila){ui.modal=null;toast(e.message);return;}
  if(!(e instanceof ErroApi))console.error(e);if(e.status!==423)toast(e.message||'Algo deu errado.');}}

let enviando=false;
async function enviarFila(){
  if(enviando||!FILA.length||!TOKEN)return;enviando=true;let mudou=false;
  try{
    while(FILA.length){const it=FILA[0];
      try{await api(it.m,it.p,it.body,null,true);}
      catch(e){if(e.status===0)break;// ainda sem rede: tenta de novo depois
        if(e.status===401)return;
        toast('Uma alteração feita sem internet não foi aceita: '+e.message);}
      // Remove pelo id: a fila pode ter mudado enquanto o envio estava no ar (ex.: partida descartada)
      FILA=FILA.filter(x=>x.id!==it.id);salvarFila();mudou=true;}
  }finally{enviando=false;}
  if(mudou){if(!FILA.length){await sincronizarTudo().catch(()=>{});}render();}
}
// Fila vazia: busca o estado oficial do servidor (inclusive a partida, que pode ter sido corrigida)
async function sincronizarTudo(){
  await carregar();ajustarPadroes();
  const L=S.live;
  if(L){try{const r=await api('GET',`/eventos/${L.ev}/partida`);if(!FILA.length){S.live=Object.assign(mapLive(r),{hist:L.hist||[]});ui.liveSig=assinatura(r);salvarLive();}}
    catch(e){if(e.status===404){S.live=null;salvarLive();}}}
}
window.addEventListener('online',()=>{ui.semRede=false;enviarFila();render();});
window.addEventListener('offline',()=>{ui.semRede=true;render();});
setInterval(()=>{if(FILA.length)enviarFila();},15000);
const N=v=>v===null||v===undefined||v===''?null:Number(v);
const S_=x=>x==null?null:String(x);

/* ---------- conversão API -> formato das telas ---------- */
const mapCat=c=>({id:S_(c.id),nome:c.nome,ini:c.ano_nascimento,fim:c.ano_nascimento,total:c.alunos});
const mapAluno=r=>({id:S_(r.id),nome:r.nome,nasc:r.nascimento,pos:r.posicoes||['MEI'],num:r.numero_camisa,cat:S_(r.categoria&&r.categoria.id),
  resp:(r.responsavel&&r.responsavel.nome)||'',cel:(r.responsavel&&r.responsavel.celular)||'',login:r.username||'',senhaTrocada:r.acesso_ativo!==false,
  foto:r.foto_url||null,presBase:0,promovido:false,hist:[]});
const CH={presente:'P',falta:'F',justificada:'J'},CHV={P:'presente',F:'falta',J:'justificada'};
function mapEvento(r){
  const e={id:S_(r.id),cat:S_(r.categoria&&r.categoria.id),grupo:r.grupo,sub:r.modalidade,titulo:r.titulo,data:r.data,hora:r.hora_inicio,fim:r.hora_fim,
    chegada:r.chegada||'',local:r.local,adv:r.adversario||'',mando:r.mando,uniforme:r.uniforme||'',levar:r.levar||[],
    plano:r.plano?{objetivo:r.plano.objetivo||'',atividades:(r.plano.atividades||[]).map(a=>({nome:a.nome,min:a.minutos,lousa:S_(a.lousa_id)||''}))}:null,
    cancelado:r.cancelado,motivo:r.motivo_cancelamento||'',encerrado:r.encerrado,placar:r.placar?{a:r.placar.casa,b:r.placar.fora}:null,
    conta:r.conta_na_carta,serie:r.semanal?'s':null,rapida:r.rapida,aoVivo:!!r.ao_vivo_agora,convocados:[],conf:{},chamada:{},part:[],minutos:{},stats:null,obs:''};
  (r.vinculos||r.meus||[]).forEach(v=>{const id=S_(v.aluno_id);if(v.convocado)e.convocados.push(id);
    if(v.confirmacao)e.conf[id]=v.confirmacao==='vai'?'vai':'nao';if(v.chamada)e.chamada[id]=CH[v.chamada];});
  return e;
}
const mapDica=d=>({id:S_(d.id),aluno:S_(d.aluno_id),tipo:d.tipo,texto:d.texto,quando:Date.parse(d.created_at),lida:!!d.lida_em,entendida:!!d.entendida_em,fixada:!!d.fixada,ev:S_(d.evento_id),lousa:S_(d.lousa_id)});
const mapMeta=m=>({id:S_(m.id),aluno:S_(m.aluno_id),texto:m.texto,prazo:String(m.prazo).slice(0,10),status:m.status,quando:Date.parse(m.created_at)});
const mapNotif=n=>({id:n.id,texto:(n.titulo?n.titulo+': ':'')+n.texto,quando:Date.parse(n.em),lida:n.lida,dados:n.dados||{}});
const mapLousaItem=l=>({id:S_(l.id),cat:S_(l.categoria_id),nome:l.nome,tag:l.tipo,desc:l.descricao||'',n:l.jogadores_por_time,tem:!!l.tem_gravacao,quadros:[],advNome:''});
const CAMPOS_LOUSA=['casa','fora','bola','itens','fa','fb','campo','vw','mostrarAdv','mostrarNomes','advNome','advCor','vel','loop'];
function fromApiLousa(r){
  const L=montarLousa([],S_(r.categoria_id),r.jogadores_por_time);
  CAMPOS_LOUSA.forEach(k=>{if(r.dados&&r.dados[k]!==undefined)L[k]=r.dados[k];});
  Object.assign(L,{id:S_(r.id),cat:S_(r.categoria_id),nome:r.nome,tag:r.tipo,desc:r.descricao||'',n:r.jogadores_por_time,quadros:[],undo:[],redo:[],ferramenta:'mover',sel:null,benchSel:null,qAtual:null,playing:false,stop:true});
  if(r.gravacao)L.gravacao=r.gravacao;else delete L.gravacao;
  return L;
}
function toApiLousa(L){const dados={};CAMPOS_LOUSA.forEach(k=>{if(L[k]!==undefined)dados[k]=clone(L[k]);});
  return {categoria_id:N(L.cat),nome:L.nome,tipo:L.tag,descricao:L.desc||null,jogadores_por_time:L.n,dados,gravacao:L.gravacao||null};}
function mapLive(p){
  const time={},cart={},minJ={},nomes={};
  Object.entries(p.time||{}).forEach(([k,v])=>{time[S_(k)]=v;});
  Object.entries(p.cartoes||{}).forEach(([k,v])=>{cart[S_(k)]={am:v.amarelos||0,vm:!!v.vermelho};});
  Object.entries(p.minutos_jogados||{}).forEach(([k,v])=>{minJ[S_(k)]=v;});
  Object.entries(p.jogadores||{}).forEach(([k,v])=>{nomes[S_(k)]=v;});
  const ids=a=>(a||[]).map(S_),st=t=>{const x=p.estatisticas[t];return {chutes:x.chutes,noGol:x.no_gol,escanteios:x.escanteios,faltas:x.faltas,amarelos:x.amarelos,vermelhos:x.vermelhos};};
  return {ev:S_(p.evento_id),jogo:p.jogo,adv:p.times.b,n:p.jogadores_por_time,dur:p.duracao,tempos:p.tempos,periodo:p.periodo,seg:p.segundos,rodando:p.rodando,fase:p.fase,
    placar:{a:p.placar.a,b:p.placar.b},campo:{a:ids(p.campo.a),b:p.campo.b?ids(p.campo.b):null},banco:{a:ids(p.banco.a),b:ids(p.banco.b)},time,cart,
    expulsos:ids(p.expulsos),jogou:ids(p.jogou),stats:{a:st('a'),b:st('b')},minJ,nomes,minuto:p.minuto,undo:p.pode_desfazer?[1]:[],
    lances:(p.lances||[]).map(l=>({id:l.id,min:l.minuto,tipo:l.tipo==='substituicao'?'sub':l.tipo,time:l.time,aluno:S_(l.aluno_id),assist:S_(l.assistencia_id),
      sai:S_(l.sai_id),entra:S_(l.entra_id),detalhe:l.detalhe==='segundo_amarelo'?'2am':(l.detalhe||'normal'),texto:l.texto}))};
}
const assinatura=p=>JSON.stringify(Object.assign({},p,{segundos:0,minutos_jogados:0,minuto:0}));

/* ---------- carregar dados ---------- */
function vazio(){let u={};try{u=JSON.parse(localStorage.getItem('cp_ultesc')||'{}');}catch(e){}
  return {cats:[],alunos:[],eventos:[],lances:[],dicas:[],metas:[],notifs:[],lousas:[],lidos:{},vistas:{},live:null,ultEsc:u};}
async function carregar(partes){
  const P=new Set(partes||['cats','alunos','eventos','dicas','metas','lousas','notifs','promo']),j=[];
  // Sem internet, cada lista que não estiver guardada no aparelho só fica como estava, sem derrubar as outras
  const push=j.push.bind(j);j.push=pr=>push(pr.catch(e=>{if(e.status!==0)throw e;}));
  if(P.has('cats'))j.push(api('GET','/categorias').then(r=>{S.cats=r.map(mapCat);}));
  if(P.has('alunos'))j.push(api('GET','/alunos?por_pagina=500').then(r=>{S.alunos=r.data.map(mapAluno);}));
  if(P.has('eventos'))j.push(api('GET',`/eventos?de=${iso(-120)}&ate=${iso(200)}`).then(r=>{S.eventos=r.data.map(mapEvento);}));
  if(P.has('dicas'))j.push(api('GET','/dicas').then(r=>{S.dicas=r.map(mapDica);}));
  if(P.has('metas'))j.push(api('GET','/metas').then(r=>{S.metas=r.map(mapMeta);}));
  if(P.has('lousas'))j.push(api('GET','/lousas').then(r=>{S.lousas=r.map(mapLousaItem);}));
  if(P.has('notifs'))j.push(api('GET','/notificacoes').then(r=>{S.notifs=r.itens.map(mapNotif);ui.naoLidas=r.nao_lidas;}));
  if(P.has('promo')&&ui.user&&ui.user.papel==='dono')j.push(api('GET','/promocoes').then(r=>{ui.promo=r;}));
  await Promise.all(j);
  if(P.has('alunos')||P.has('eventos'))ui.cartas={};
}
function ajustarPadroes(){
  const pref=S.cats.find(c=>c.nome==='Sub-11'&&alunosCat(c.id).length)||S.cats.find(c=>alunosCat(c.id).length)||S.cats[0];
  if(pref){if(!cat(ui.cat))ui.cat=pref.id;if(!cat(ui.catProf))ui.catProf=pref.id;if(!cat(ui.dDraft.cat))ui.dDraft.cat=ui.catProf;}
  if(ui.role==='aluno'&&!al(ui.alunoAtual)&&S.alunos[0])ui.alunoAtual=S.alunos[0].id;
}
async function verificarAoVivo(){
  if(!ui.user||ui.role==='aluno')return;
  // Partida guardada no aparelho com ações ainda não enviadas: continua dela (ex.: abriu o app sem internet)
  const salvo=lerLive();
  if(salvo&&filaDaPartida(salvo.ev)){S.live=salvo;const x=ev(salvo.ev);if(x)x.aoVivo=true;return;}
  const e=S.eventos.find(x=>x.aoVivo);
  if(!e){S.live=null;salvarLive();return;}
  if(S.live&&S.live.ev===e.id)return;
  const r=await api('GET',`/eventos/${e.id}/partida`);
  S.live=Object.assign(mapLive(r),{hist:salvo&&salvo.ev===S_(e.id)?salvo.hist||[]:[]});ui.liveSig=assinatura(r);salvarLive();
}
function entrarComo(u){
  // A fila guardada no aparelho só é enviada pelo mesmo usuário que a criou
  if(FILA.some(i=>i.u&&i.u!==u.id)){FILA=FILA.filter(i=>!i.u||i.u===u.id);salvarFila();}
  try{localStorage.setItem('cp_me',JSON.stringify(u));}catch(e){}
  ui.user=u;ui.role=u.papel==='dono'?'dono':u.papel==='professor'?'professor':'aluno';
  ui.tela={dono:'inicio',professor:'inicio',aluno:'inicio'};ui.modal=null;ui.marcandoLidas=false;
  if(u.alunos&&u.alunos.length)ui.alunoAtual=S_(u.alunos[0].id);
}
async function iniciarSessao(){
  ui.carregandoTudo=true;render();
  try{await carregar();ajustarPadroes();await verificarAoVivo();}
  finally{ui.carregandoTudo=false;render();}
}
async function boot(){
  if(!TOKEN){render();return;}
  try{let me;
    try{me=await api('GET','/me');try{localStorage.setItem('cp_me',JSON.stringify(me));}catch(x){}}
    catch(e){// Sem internet: entra com o último perfil guardado neste aparelho
      let salvo=null;try{salvo=JSON.parse(localStorage.getItem('cp_me')||'null');}catch(x){}
      if(e.status!==0||!salvo)throw e;me=salvo;ui.semRede=true;}
    entrarComo(me);
    if(me.precisa_trocar_senha){ui.modal={tipo:'senhaApi'};render();return;}
    await iniciarSessao();
  }catch(e){if(e.status!==401){ui.erroLogin=e.message;}render();}
}
function sair(silencioso){
  if(!silencioso&&FILA.length){toast(`Há ${FILA.length} alteraç${FILA.length>1?'ões':'ão'} feita${FILA.length>1?'s':''} sem internet ainda não enviada${FILA.length>1?'s':''}. Conecte à internet antes de sair.`);enviarFila();return;}
  if(!silencioso){try{localStorage.removeItem('cp_live');}catch(e){}if(window.caches)caches.delete('caiopina-api').catch(()=>{});}
  if(TOKEN&&!silencioso)fetch(API+'/logout',{method:'POST',headers:{Authorization:'Bearer '+TOKEN,Accept:'application/json'}}).catch(()=>{});
  TOKEN=null;try{localStorage.removeItem('cp_token');localStorage.removeItem('cp_me');}catch(e){}
  ui.user=null;S=vazio();ui.modal=null;ui.cartas={};ui.lousa=null;ui.vl=null;ui.liveSetup=null;ui.estadio=false;render();
}

/* ---------- substituições das funções locais ---------- */
const ZERO_ST={jogos:0,gols:0,faltas:0,assist:0,penDef:0,cleans:0,minutos:0,treinos:0,faltasTreino:0,promovido:false,amarelos:0};
function carregarCarta(id){
  if(ui.cartaPend[id]||!al(id))return;ui.cartaPend[id]=1;
  api('GET',`/alunos/${id}/carta`).then(r=>{const e=r.estatisticas;
    ui.cartas[id]={s:{jogos:e.jogos,gols:e.gols,faltas:e.gols_falta,assist:e.assistencias,penDef:e.penaltis_defendidos,cleans:e.jogos_sem_sofrer,
      minutos:e.minutos,treinos:e.treinos,faltasTreino:e.faltas_treino,promovido:e.promovido,amarelos:e.amarelos},cq:r.conquistas};
    delete ui.cartaPend[id];render();}).catch(()=>{delete ui.cartaPend[id];});
}
function stats(id){const c=ui.cartas[id];if(c)return c.s;carregarCarta(id);return Object.assign({},ZERO_ST);}
function checarSenha(){}
function minJog(L,id){return (L.minJ&&L.minJ[id])||0;}
function minLabel(L){return L.minuto||'';}
function sugestoesPromo(){return ((ui.promo&&ui.promo.sugestoes)||[]).map(x=>({a:al(S_(x.aluno.id))||{id:S_(x.aluno.id),nome:x.aluno.nome,cat:''},alvo:{id:S_(x.para.id),nome:x.para.nome}}));}
function lousaDoLive(){
  const Lv=S.live,e=ev(Lv.ev),n=Lv.n,L=montarLousa([],e?e.cat:ui.catProf,n);
  const pl=id=>al(id)||{id,nome:(Lv.nomes[id]&&Lv.nomes[id].nome)||'Jogador',num:Lv.nomes[id]&&Lv.nomes[id].numero,pos:(Lv.nomes[id]&&Lv.nomes[id].posicoes)||['MEI']};
  const pa=formar(FORM[n][L.fa]);
  L.casa=ordenar(Lv.campo.a.map(pl)).map((a,i)=>{const p=pa[i]||{x:.3,y:.5};return {aid:a.id,num:a.num!=null?a.num:'',nome:primeiro(a.nome),x:p.x,y:p.y};});
  if(Lv.campo.b){const pb=formar(FORM[n][L.fb]);L.fora=ordenar(Lv.campo.b.map(pl)).map((a,i)=>{const p=pb[i]||{x:.3,y:.5};return {num:a.num!=null?a.num:i+1,nome:primeiro(a.nome),x:1-p.x,y:p.y};});L.advNome='Time B';L.advCor='#E8E6DF';}
  else L.advNome=Lv.adv;
  L.nome=(Lv.jogo?'Contra '+Lv.adv:'Coletivo')+(e?' · '+fmtD(e.data):'');return L;
}
function vPromo(){
  const P=ui.promo;let h=`<div class="head"><div><h1>Promoções de categoria</h1><p class="mut">Em ${P?P.ano:ANO+1} estes alunos passam da faixa de idade da categoria atual.</p></div></div>`;
  if(!P)return h+'<div class="empty">Carregando…</div>';
  if(P.saem_da_escolinha.length)h+=`<div class="card flat sm"><b>${P.saem_da_escolinha.length} alunos do Sub-18</b> passam da idade máxima da escolinha e não entram na promoção.</div>`;
  if(!P.sugestoes.length)return h+'<div class="empty">Nenhum aluno precisa mudar de categoria agora.</div>';
  return h+`<form class="col" data-f="promo">${P.sugestoes.map(x=>`<label class="card row" style="gap:14px;cursor:pointer"><input type="checkbox" name="p" value="${x.aluno.id}" checked style="accent-color:var(--y);width:20px;height:20px">${avatar(al(S_(x.aluno.id))||{nome:x.aluno.nome},40)}<span style="flex:1"><b>${esc(x.aluno.nome)}</b></span><span class="bdg">${esc(x.de)}</span>${sv('<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',18)}<span class="bdg y">${esc(x.para.nome)}</span></label>`).join('')}<div class="row" style="justify-content:flex-end"><button type="submit" class="btn y">Promover selecionados</button></div></form>`;
}
function vAvisos(){
  // Marca como lidos a cada visita com avisos novos e redesenha para o número do sino sumir
  if(ui.naoLidas&&!ui.marcandoLidas){ui.marcandoLidas=true;api('POST','/notificacoes/lidas').then(()=>{ui.naoLidas=0;render();}).catch(()=>{}).finally(()=>{ui.marcandoLidas=false;});}
  const ns=S.notifs;
  return `<div class="head"><div><h1>Avisos</h1><p class="mut">No app instalado, também chegam como notificação no celular.</p></div></div>`+(ns.length?`<div class="col">${ns.map(n=>`<div class="card row" style="gap:12px"><span style="color:var(--y)">${IC.bell}</span><div style="flex:1">${esc(n.texto)}<br><span class="mut sm">${fmtQ(n.quando)}</span></div>${n.lida?'':'<span class="bdg y">Novo</span>'}</div>`).join('')}</div>`:'<div class="empty">Nenhum aviso.</div>');
}
function header(){
  const u=ui.user;let extra='';
  if(ui.role==='aluno'){const a=al(ui.alunoAtual),n=ui.naoLidas||0;
    extra=(S.alunos.length>1?`<label class="sr" for="selAluno">Filho</label><select id="selAluno" class="inp sm" data-ch="aluno">${S.alunos.map(x=>`<option value="${x.id}"${x.id===ui.alunoAtual?' selected':''}>${esc(x.nome)}</option>`).join('')}</select>`:'')
      +(a&&a.login?`<span class="uname">@${esc(a.login)}</span>`:'')
      +`<button type="button" class="bell" data-a="tab" data-v="avisos" aria-label="Avisos${n?', '+n+' novos':''}">${IC.bell}${n?`<span class="dot">${n}</span>`:''}</button>`;}
  const papel=u.papel==='dono'?`<div class="seg" role="group" aria-label="Área">${[['dono','Gestão'],['professor','Treinos e jogos']].map(r=>`<button type="button" data-a="role" data-v="${r[0]}" aria-pressed="${ui.role===r[0]}">${r[1]}</button>`).join('')}</div>`:'';
  const live=S.live&&ui.role==='professor'&&ui.tela.professor!=='aovivo'?`<button type="button" class="btn y sm" data-a="tab" data-v="aovivo">Partida em andamento</button>`:'';
  const quem=u.papel==='responsavel'?'Responsável':u.papel==='aluno'?'Aluno':u.papel==='dono'?'Dono':'Professor';
  return `<header class="top"><div class="brand">${ESC(44)}<div><b>${esc(NOME_CURTO)}</b><small>${esc(u.nome)} · ${quem}</small></div></div><div class="demo">${statusRede()}${live}${papel}${extra}<button type="button" class="btn o sm" data-a="logout">Sair</button></div></header>`;
}
function vLogin(){
  return `<div style="min-height:100vh;display:grid;place-items:center;padding:20px"><form class="card col" data-f="login" style="width:min(400px,100%);gap:16px;padding:24px">
  <div class="col" style="align-items:center">${ESC(150)}<h1 class="sr">${esc(NOME)}</h1></div>
  <label class="f">Usuário ou celular<input class="inp" name="login" required autocomplete="username" autocapitalize="none" placeholder="joao.silva ou (18) 99999-9999"></label>
  <label class="f">Senha<input class="inp" type="password" name="senha" required autocomplete="current-password"></label>
  ${ui.erroLogin?`<p class="sm" style="color:var(--red)">${esc(ui.erroLogin)}</p>`:''}
  <button type="submit" class="btn y big">Entrar</button>
  <p class="xs mut">O acesso é entregue pela escolinha. No primeiro acesso, você cria sua própria senha.</p></form></div>`;
}
function vModal(){
  const m=ui.modal;if(!m)return '';let h='',lg=false;
  if(m.tipo==='senhaApi')h=`<h2>Crie sua senha</h2><p class="mut">Por segurança, troque a senha inicial antes de continuar.</p><form class="col" data-f="senhaApi"><label class="f">Nova senha <small>Pelo menos 6 caracteres</small><input class="inp" type="password" name="s1" required minlength="6" autocomplete="new-password"></label><label class="f">Repita a nova senha<input class="inp" type="password" name="s2" required minlength="6" autocomplete="new-password"></label><div class="acts"><button type="button" class="btn o" data-a="logout">Sair</button><button type="submit" class="btn y">Salvar senha</button></div></form>`;
  else if(m.tipo==='credApi'){const r=m.r,ac=r.acessos;h=`<h2>Aluno cadastrado</h2><p>Entregue estes acessos para a família. A senha precisa ser trocada no primeiro acesso.</p><div class="card flat col"><b>Aluno</b><span>Nome de usuário: <b class="uname">@${esc(ac.aluno.login)}</b></span><span>Senha inicial: <b>${esc(ac.aluno.senha_inicial)}</b></span></div><div class="card flat col"><b>Responsável (${esc(r.aluno.responsavel?r.aluno.responsavel.nome:'')})</b><span>Entra com o celular: ${esc(ac.responsavel.login)}</span><span>${ac.responsavel.ja_tinha_conta?'Já tinha conta (outro filho na escolinha). Usa a senha que já criou.':'Senha inicial: <b>'+esc(ac.responsavel.senha_inicial)+'</b>'}</span></div><div class="acts"><button type="button" class="btn y" data-a="fechar">Pronto</button></div>`;}
  else if(m.tipo==='senhaReset')h=`<h2>Senha redefinida</h2><div class="card flat col"><span>Usuário: <b class="uname">@${esc(m.login)}</b></span><span>Nova senha inicial: <b>${esc(m.senha)}</b></span></div><p class="sm mut">O aluno vai precisar criar uma senha nova no próximo acesso.</p><div class="acts"><button type="button" class="btn y" data-a="fechar">Pronto</button></div>`;
  else if(m.tipo==='resumoApi'){lg=true;const r=m.r;
    const lista=a=>a.length?a.map(x=>`${esc(primeiro(x.nome||'—'))} (${x.total})`).join(', '):'—';
    const st=r.estatisticas;
    const tl=r.linha_do_tempo.map(l=>{const ic=l.tipo==='gol'?IC.ball:l.tipo==='amarelo'?'<span class="ca"></span>':l.tipo==='vermelho'?'<span class="ca v"></span>':l.tipo==='substituicao'?IC.sub:IC.glove;
      const quem=l.tipo==='substituicao'?`Entra <b>${esc(l.entra||'')}</b>, sai ${esc(l.sai||'')}`:esc(l.aluno||(l.time==='a'?r.times.a:r.times.b));
      const tit={gol:'Gol'+(DET[l.detalhe]?' '+DET[l.detalhe]:''),amarelo:'Cartão amarelo',vermelho:'Cartão vermelho',substituicao:'Substituição',defesa:'Defesa',penalti_defendido:'Pênalti defendido'}[l.tipo]||l.tipo;
      return `<div class="lance${l.tipo==='gol'?' gol':''}"><span class="min">${esc(l.minuto)}</span><span class="ic">${ic}</span><div style="flex:1"><b>${tit}</b> · ${quem}${l.assistencia?`<br><span class="mut sm">Assistência: ${esc(l.assistencia)}</span>`:''}</div></div>`;}).join('');
    h=`<h2>${esc(r.evento.titulo)}</h2><p class="sm mut">${fmtD(r.evento.data)} · ${esc(r.evento.modalidade)} · ${esc(r.evento.local)}${r.conta_na_carta?'':' · não contou na carta'}</p>
    <div class="placar"><div><div class="t">${esc(r.times.a)}</div><div class="n" style="font-size:64px">${r.placar.a}</div></div><div class="mut">x</div><div><div class="t">${esc(r.times.b)}</div><div class="n" style="font-size:64px">${r.placar.b}</div></div></div>
    <div class="grid2"><div class="card flat"><span class="xs mut">Gols</span><br>${lista(r.gols)}</div><div class="card flat"><span class="xs mut">Assistências</span><br>${lista(r.assistencias)}</div></div>
    ${st?`<div class="card flat col">${statRow('Chutes',st.a.chutes,st.b.chutes)}${statRow('Chutes no gol',st.a.no_gol,st.b.no_gol)}${statRow('Escanteios',st.a.escanteios,st.b.escanteios)}${statRow('Faltas',st.a.faltas,st.b.faltas)}${statRow('Cartões',st.a.amarelos+st.a.vermelhos,st.b.amarelos+st.b.vermelhos)}</div>`:''}
    ${r.minutos.length?`<div class="col" style="gap:6px"><b>Minutos jogados</b><div class="checks">${r.minutos.map(x=>`<span class="bdg">${esc(primeiro(x.nome))} · ${x.minutos} min</span>`).join('')}</div></div>`:''}
    <div class="col" style="gap:6px"><b>Linha do tempo</b>${tl||'<p class="mut sm">Sem lances registrados.</p>'}</div>
    ${r.observacao_professor?`<div class="card flat"><span class="xs mut">Observação do professor</span><p>${esc(r.observacao_professor)}</p></div>`:''}
    <div class="acts"><button type="button" class="btn y" data-a="fechar">Fechar</button></div>`;}
  else return vModalLocal();
  return `<div class="overlay" data-a="fora"><div class="modal${lg?' lg':''}" role="dialog" aria-modal="true">${h}</div></div>`;
}
function render(){
  if(!ui.user||ui.carregandoTudo){
    document.body.classList.remove('estadio','lzlock');
    const t=ui.toast?`<div class="toast" role="status">${esc(ui.toast)}</div>`:'';
    if(ui.carregandoTudo){document.getElementById('app').innerHTML=`<div style="min-height:100vh;display:grid;place-items:center;text-align:center" role="status"><div class="col" style="align-items:center">${ESC(110)}<p class="mut">Carregando a escolinha…</p></div></div>`+t;return;}
    document.getElementById('app').innerHTML=(ui.user?'':vLogin())+vModal()+t;return;
  }
  renderLocal();
  if(ui.role!=='aluno'&&ui.tela.professor==='aovivo'&&ui.role==='professor'&&!S.live&&!ui.liveCarregando&&S.eventos.some(e=>e.aoVivo)){
    ui.liveCarregando=true;verificarAoVivo().then(render).catch(()=>{}).finally(()=>{ui.liveCarregando=false;});
  }
}

/* ---------- ações ---------- */
/* ---------- jogo ao vivo no aparelho ----------
   Cada ação é aplicada aqui na hora (com ou sem internet), entra na fila com id e horário, e o servidor
   aplica as mesmas regras quando recebe. Com a fila vazia, o estado do servidor volta a ser o oficial. */
function statusRede(){
  const n=FILA.length,pend=n?` · ${n} para enviar`:'';
  if(ui.semRede||!navigator.onLine)return `<span class="bdg x" role="status">Sem internet${pend}</span>`;
  return n?`<span class="bdg wait" role="status">Enviando${pend}</span>`:'';
}
function liveInicial(e,b){
  const ids=a=>[...new Set((a||[]).map(S_))],jogo=e.grupo==='jogo',n=b.n,campo={a:[],b:jogo?null:[]},banco={a:[],b:[]},time={};
  if(jogo){const tit=ids(b.titulares),res=ids(b.reservas).filter(x=>!tit.includes(x));
    if(tit.length>n)throw new ErroApi(`Você escolheu ${tit.length} titulares para ${n} vagas.`,422);
    campo.a=tit;banco.a=res;tit.concat(res).forEach(id=>{time[id]='a';});}
  else{const a=ids(b.time_a),bb=ids(b.time_b).filter(x=>!a.includes(x));
    campo.a=a.slice(0,n);banco.a=a.slice(n);campo.b=bb.slice(0,n);banco.b=bb.slice(n);a.forEach(id=>{time[id]='a';});bb.forEach(id=>{time[id]='b';});}
  const z={chutes:0,noGol:0,escanteios:0,faltas:0,amarelos:0,vermelhos:0},nomes={},minJ={};
  Object.keys(time).forEach(id=>{const x=al(id);minJ[id]=0;if(x)nomes[id]={id,nome:x.nome,numero:x.num,posicoes:x.pos};});
  return {ev:e.id,jogo,adv:jogo?(b.adversario||e.adv||'Adversário'):'Time B',n,dur:b.duracao,tempos:b.tempos,periodo:1,seg:0,rodando:false,fase:'jogo',
    placar:{a:0,b:0},campo,banco,time,cart:{},expulsos:[],jogou:campo.a.concat(campo.b||[]),stats:{a:Object.assign({},z),b:Object.assign({},z)},
    minJ,nomes,minuto:"1'",undo:[],lances:[],hist:[]};
}
function salvarLive(){try{if(S.live)localStorage.setItem('cp_live',JSON.stringify(Object.assign({},S.live,{salvoEm:Date.now()})));else localStorage.removeItem('cp_live');}catch(e){}}
// O cronômetro continua contando enquanto o app esteve fechado (celular bloqueado, página recarregada)
function lerLive(){try{const L=JSON.parse(localStorage.getItem('cp_live')||'null');
  if(L&&L.rodando&&L.salvoEm)L.seg+=Math.max(0,Math.floor((Date.now()-L.salvoEm)/1000));
  if(L){delete L.salvoEm;L.minuto=minutoLive(L);}return L;}catch(e){return null;}}
const filaDaPartida=ev=>FILA.some(i=>i.p.indexOf(`/eventos/${ev}/partida`)===0);
function minutoLive(L){const reg=L.dur*60;return L.seg>reg?(L.periodo*L.dur)+'+'+Math.ceil((L.seg-reg)/60)+"'":(Math.floor(L.seg/60)+1+(L.periodo-1)*L.dur)+"'";}
function aplicarLocal(L,b){
  const erro=m=>{throw new ErroApi(m,422);};
  const st=t=>L.stats[t],emCampo=(t,id)=>L.campo[t]&&L.campo[t].includes(id);
  const opc=(t,id)=>{if(id==null)return null;id=S_(id);if(!emCampo(t,id))erro('O jogador precisa estar em campo nesse time.');return id;};
  let n=0;const lance=d=>{L.lances.push(Object.assign({id:b.acao_id+(n++?'-'+n:''),min:minutoLive(L),aluno:null,assist:null,sai:null,entra:null,detalhe:'normal',texto:null},d));};
  const tira=id=>{const t=L.time[id];L.campo[t]=L.campo[t].filter(x=>x!==id);};
  const poe=(t,id)=>{L.campo[t].push(id);if(!L.jogou.includes(id))L.jogou.push(id);};
  const expulsa=id=>{tira(id);L.expulsos.push(id);};
  const t=b.time,antes=clone(Object.assign({},L,{hist:null}));
  switch(b.acao){
    case 'cronometro':
      if(b.comando==='iniciar'){if(L.fase==='intervalo')erro('Comece o 2º tempo para voltar a contar.');L.rodando=true;}
      else if(b.comando==='pausar')L.rodando=false;else L.seg=Math.max(0,L.seg+(b.segundos||0));
      break;
    case 'fim_tempo':
      if(!(L.tempos===2&&L.periodo===1&&L.fase==='jogo'))erro('Não há primeiro tempo para encerrar.');
      L.rodando=false;L.fase='intervalo';lance({tipo:'marco',time:'a',texto:`Fim do 1º tempo: ${L.placar.a} x ${L.placar.b}`});break;
    case 'segundo_tempo':
      if(L.fase!=='intervalo')erro('O segundo tempo só começa depois do intervalo.');
      L.periodo=2;L.seg=0;L.fase='jogo';L.rodando=true;lance({tipo:'marco',time:'a',texto:'Começou o 2º tempo'});break;
    case 'gol':{const a=opc(t,b.aluno_id);let as=opc(t,b.assistencia_id);if(as===a)as=null;
      L.placar[t]++;st(t).chutes++;st(t).noGol++;lance({tipo:'gol',time:t,aluno:a,assist:as,detalhe:b.detalhe||'normal'});break;}
    case 'chute':st(t).chutes++;if(b.no_gol)st(t).noGol++;lance({tipo:'chute',time:t,aluno:opc(t,b.aluno_id),detalhe:b.no_gol?'gol':'fora'});break;
    case 'escanteio':st(t).escanteios++;break;
    case 'falta':st(t).faltas++;break;
    case 'cartao':{const id=opc(t,b.aluno_id),verm=b.cor==='vermelho';
      if(id===null){st(t)[verm?'vermelhos':'amarelos']++;lance({tipo:verm?'vermelho':'amarelo',time:t});break;}
      const c=L.cart[id]||(L.cart[id]={am:0,vm:false});
      if(!verm){c.am++;st(t).amarelos++;lance({tipo:'amarelo',time:t,aluno:id});
        if(c.am>=2){c.vm=true;st(t).vermelhos++;lance({tipo:'vermelho',time:t,aluno:id,detalhe:'2am'});expulsa(id);}}
      else{c.vm=true;st(t).vermelhos++;lance({tipo:'vermelho',time:t,aluno:id});expulsa(id);}
      break;}
    case 'defesa':{const o=t==='a'?'b':'a';const id=S_(b.aluno_id);if(!emCampo(t,id))erro('O jogador precisa estar em campo nesse time.');
      st(o).chutes++;st(o).noGol++;lance({tipo:'defesa',time:t,aluno:id});break;}
    case 'penalti_defendido':{const id=S_(b.aluno_id);if(!emCampo(t,id))erro('O jogador precisa estar em campo nesse time.');lance({tipo:'penalti_defendido',time:t,aluno:id});break;}
    case 'substituicao':{const sai=S_(b.sai_id),entra=S_(b.entra_id);
      if(!emCampo(t,sai))erro('O jogador precisa estar em campo nesse time.');if(!L.banco[t].includes(entra))erro('Quem entra precisa estar no banco.');
      tira(sai);L.banco[t].push(sai);L.banco[t]=L.banco[t].filter(x=>x!==entra);poe(t,entra);lance({tipo:'sub',time:t,sai,entra});break;}
    case 'entrar':{const id=S_(b.aluno_id);if(!L.banco[t].includes(id))erro('O jogador precisa estar no banco.');
      if(L.campo[t].length>=L.n)erro('O time já está completo. Faça uma substituição.');
      L.banco[t]=L.banco[t].filter(x=>x!==id);poe(t,id);lance({tipo:'marco',time:t,texto:primeiro(nomeDe(id))+' entrou em campo'});break;}
    case 'adicionar':{const id=S_(b.aluno_id);if(L.time[id])erro('Este aluno já está na partida.');
      const a=al(id);L.time[id]=t;if(a)L.nomes[id]={id,nome:a.nome,numero:a.num,posicoes:a.pos};
      if(L.campo[t].length<L.n){poe(t,id);lance({tipo:'marco',time:t,texto:primeiro(nomeDe(id))+' chegou e entrou em campo'});}
      else{L.banco[t].push(id);lance({tipo:'marco',time:t,texto:primeiro(nomeDe(id))+' chegou e foi para o banco'});}
      break;}
    case 'remover_lance':{const i=L.lances.findIndex(x=>x.id===b.lance_id);if(i<0)erro('Lance não encontrado.');
      const l=L.lances[i],s=st(l.time),dec=(o,k)=>{o[k]=Math.max(0,o[k]-1);};
      if(!['gol','chute','defesa','penalti_defendido','amarelo'].includes(l.tipo))erro('Esse lance só pode ser revertido com "desfazer".');
      if(l.tipo==='gol'){dec(L.placar,l.time);dec(s,'chutes');dec(s,'noGol');}
      if(l.tipo==='chute'){dec(s,'chutes');if(l.detalhe==='gol')dec(s,'noGol');}
      if(l.tipo==='defesa'){const o=st(l.time==='a'?'b':'a');dec(o,'chutes');dec(o,'noGol');}
      if(l.tipo==='amarelo'){dec(s,'amarelos');if(l.aluno&&L.cart[l.aluno])dec(L.cart[l.aluno],'am');}
      L.lances.splice(i,1);break;}
    case 'desfazer':{const h=L.hist||[];if(!h.length)erro('Não há nada para desfazer.');
      const ant=h.pop();if(ant.periodo===L.periodo){ant.seg=L.seg;ant.rodando=L.rodando;}
      Object.keys(L).forEach(k=>{if(k!=='hist')delete L[k];});Object.assign(L,ant,{hist:h});
      L.undo=h.length?[1]:[];L.minuto=minutoLive(L);return;}
    default:erro('Ação desconhecida.');
  }
  if(b.acao!=='cronometro'){L.hist=(L.hist||[]).concat([antes]).slice(-30);L.undo=[1];}
  L.minuto=minutoLive(L);
}
async function acaoLive(body,msg){
  const L=S.live;if(!L)return;
  body=Object.assign({acao_id:novoId(),em:Math.round(agoraServ())},body);
  aplicarLocal(L,body);// erro de regra aparece na hora, sem esperar o servidor
  enfileirar('POST',`/eventos/${L.ev}/partida/acoes`,body);salvarLive();
  if(msg)toast(msg);else render();
  enviarFila();
}
async function recarregar(partes,msg){await carregar(partes);ajustarPadroes();if(msg)toast(msg);else render();}
const ACT={
  logout:()=>sair(false),
  fora:(v,el,e)=>{if(ui.modal&&ui.modal.tipo==='senhaApi')return;actLocal('fora',v,el,e);},
  fxFechar:async()=>{const f=ui.fx;if(f&&f.tipo==='cq'){const c=ui.cartas[f.aluno];if(c)c.cq.forEach(x=>{if(f.ids.includes(x.codigo))x.nova=false;});ui.cqDestaque=f.ids;api('POST',`/alunos/${f.aluno}/conquistas/vistas`).catch(()=>{});}ui.fx=null;render();},
  resumo:async v=>{const r=await api('GET',`/eventos/${v}/resumo`);ui.modal={tipo:'resumoApi',r};render();},
  chamadaRapida:async v=>{const r=await api('POST',`/eventos/${v}/chamada-rapida`);await recarregar(['eventos'],r.mensagem);},
  lembrete:async v=>{const r=await api('POST',`/eventos/${v}/lembrete`);toast(r.mensagem);},
  reativar:async v=>{await api('POST',`/eventos/${v}/reativar`);await carregar(['eventos']);ui.modal={tipo:'evDet',id:v};toast('Reativado. Os alunos foram avisados.');},
  evDup:async v=>{await api('POST',`/eventos/${v}/duplicar`);ui.modal=null;await recarregar(['eventos'],'Cópia criada para a semana seguinte.');},
  conf:async v=>{const p=v.split('|');const r=await api('POST',`/eventos/${p[0]}/confirmacao`,{aluno_id:N(ui.alunoAtual),status:p[1]==='vai'?'vai':'nao_vai'});await recarregar(['eventos'],r.mensagem);},
  delAluno:async v=>{if(ui.delConfirm!==v){ui.delConfirm=v;render();return;}await api('DELETE',`/alunos/${v}`);ui.modal=null;ui.delConfirm=null;await recarregar(['alunos','cats','promo'],'Aluno excluído.');},
  salvarPos:async()=>{const b=al(ui.modal.id);if(!ui.posSel.length){toast('Escolha pelo menos a posição principal.');return;}await api('POST',`/alunos/${b.id}`,{posicoes:ui.posSel.slice()});await recarregar(['alunos'],'Posições salvas.');},
  resetSenha:async v=>{const r=await api('POST',`/alunos/${v}/resetar-senha`);ui.modal={tipo:'senhaReset',login:r.login,senha:r.senha_inicial};await recarregar(['alunos']);},
  // jogo ao vivo
  cron:async()=>{const L=S.live;await acaoLive({acao:'cronometro',comando:L.rodando?'pausar':'iniciar'});wake(S.live.rodando);},
  ajTempo:v=>acaoLive({acao:'cronometro',comando:'ajustar',segundos:+v}),
  fimTempo:async()=>{wake(false);const r=await acaoLive({acao:'fim_tempo'},'Intervalo.');return r;},
  segTempo:async()=>{await acaoLive({acao:'segundo_tempo'});wake(true);},
  undoLive:()=>acaoLive({acao:'desfazer'},'Última ação desfeita.'),
  delLance:v=>acaoLive({acao:'remover_lance',lance_id:v}),
  tmAcao:async(v,el,e)=>{const [t,x]=v.split('|');
    if(['gol','cartao','sub','penDef'].includes(x)){actLocal('tmAcao',v,el,e);return;}
    const nome={chuteGol:'Chute no gol',chuteFora:'Chute para fora',escanteio:'Escanteio',falta:'Falta'}[x];
    const body=x==='chuteGol'?{acao:'chute',time:t,no_gol:true}:x==='chuteFora'?{acao:'chute',time:t,no_gol:false}:{acao:x,time:t};
    await acaoLive(body,nome+' · '+nomeTime(S.live,t));},
  plAcao:async(v,el,e)=>{const {time:t,id}=ui.modal;
    if(v==='gol'||v==='sub'){actLocal('plAcao',v,el,e);return;}
    const b={chuteGol:{acao:'chute',time:t,aluno_id:N(id),no_gol:true},chuteFora:{acao:'chute',time:t,aluno_id:N(id),no_gol:false},defesa:{acao:'defesa',time:t,aluno_id:N(id)},
      penDef:{acao:'penalti_defendido',time:t,aluno_id:N(id)},falta:{acao:'falta',time:t},amarelo:{acao:'cartao',time:t,aluno_id:N(id),cor:'amarelo'},vermelho:{acao:'cartao',time:t,aluno_id:N(id),cor:'vermelho'}}[v];
    ui.modal=null;await acaoLive(b);},
  soEntrar:async()=>{const {time:t,id}=ui.modal;ui.modal=null;await acaoLive({acao:'entrar',time:t,aluno_id:N(id)});},
  addRes:async v=>{const [t,id]=v.split('|');await acaoLive({acao:'adicionar',time:t,aluno_id:N(id)},primeiro(nomeDe(id))+' entrou na partida. Presença marcada.');},
  descartar:async()=>{if(!ui.descConfirm){ui.descConfirm=true;render();return;}const id=S.live.ev,pre=`/eventos/${id}/partida`;
    // Se nem o início chegou ao servidor, basta jogar fora o que está na fila; senão, pede para apagar lá também
    const inicioNaFila=FILA.some(i=>i.m==='POST'&&i.p===pre);
    FILA=FILA.filter(i=>i.p.indexOf(pre)!==0);salvarFila();
    if(!inicioNaFila)enfileirar('DELETE',pre);
    const e=ev(id);if(e)e.aoVivo=false;
    S.live=null;salvarLive();ui.descConfirm=false;ui.estadio=false;wake(false);toast('Partida descartada. Nada foi salvo.');enviarFila();},
  // lousa
  lzAbrir:async v=>{const r=await api('GET',`/lousas/${v}`);ui.lousa=fromApiLousa(r);render();},
  lzDel:async v=>{await api('DELETE',`/lousas/${v}`);if(ui.lousa&&ui.lousa.id===v)ui.lousa.id=null;await recarregar(['lousas'],'Jogada excluída.');},
  lzDup:async v=>{const r=await api('GET',`/lousas/${v}`);const c=fromApiLousa(r);c.nome=c.nome+' (cópia)';await api('POST','/lousas',toApiLousa(c));await recarregar(['lousas'],'Jogada duplicada.');},
  verLousa:async v=>{const r=await api('GET',`/lousas/${v}`);const o=fromApiLousa(r);if(o.gravacao){aplicarFlat(o,o.gravacao.frames[0].p);o.itens=clone(o.gravacao.itens[0].its);}ui.vl={id:v,obj:o,q:0};render();},
  abrirJogada:async v=>{const r=await api('GET',`/lousas/${v}`);const o=fromApiLousa(r);ui.modal=null;
    if(ui.role==='aluno'){if(o.gravacao){aplicarFlat(o,o.gravacao.frames[0].p);o.itens=clone(o.gravacao.itens[0].its);}ui.tela.aluno='jogadas';ui.vl={id:v,obj:o,q:0};}
    else{ui.role='professor';ui.tela.professor='lousa';ui.lousa=o;}
    render();},
  // dicas e metas
  dFixar:async v=>{await api('POST',`/dicas/${v}/fixar`);await recarregar(['dicas']);},
  dDel:async v=>{await api('DELETE',`/dicas/${v}`);await recarregar(['dicas'],'Dica excluída.');},
  dEntendi:async v=>{const r=await api('POST',`/dicas/${v}/entendida`);const d=S.dicas.find(z=>z.id===v);if(d){d.entendida=true;d.lida=true;}toast(r.mensagem);},
  metaTog:async v=>{const m=S.metas.find(z=>z.id===v);await api('PUT',`/metas/${v}`,{status:m.status==='concluida'?'andamento':'concluida'});await recarregar(['metas']);},
  metaDel:async v=>{await api('DELETE',`/metas/${v}`);await recarregar(['metas'],'Meta excluída.');},
  reset:()=>sair(false)
};
function act(a,v,el,e){
  if(gravando()&&['lzAbrir','abrirJogada','lzDel'].includes(a)){toast('Pare a gravação primeiro.');return;}
  const f=ACT[a];
  if(f){if(a!=='fora'&&a!=='lzReset')ui.resetConfirm=false;exec(()=>f(v,el,e));return;}
  return actLocal(a,v,el,e);
}
function chg(k,el){
  if(k==='aluno'){ui.alunoAtual=el.value;ui.vl=null;render();return;}
  return chgLocal(k,el);
}
const SUB={
  login:async(fd)=>{ui.erroLogin='';
    let r;try{r=await api('POST','/login',{login:fd.get('login'),senha:fd.get('senha'),dispositivo:navigator.userAgent.slice(0,60)});}
    catch(e){ui.erroLogin=e.message;render();return;}
    TOKEN=r.token;try{localStorage.setItem('cp_token',TOKEN);}catch(e){}
    entrarComo(r.usuario);
    if(r.usuario.precisa_trocar_senha){ui.modal={tipo:'senhaApi'};render();return;}
    await iniciarSessao();},
  senhaApi:async(fd)=>{if(fd.get('s1')!==fd.get('s2')){toast('As senhas não conferem.');return;}
    const r=await api('POST','/senha',{nova_senha:fd.get('s1'),nova_senha_confirmation:fd.get('s2')});
    entrarComo(r.usuario);await iniciarSessao();toast('Senha criada. Bem-vindo!');},
  novo:async(fd)=>{
    if(!ui.posSel.length){toast('Escolha pelo menos a posição principal.');return;}
    const F=new FormData();
    [['nome','nome'],['nascimento','nasc'],['categoria_id','cat'],['username','login'],['responsavel_nome','resp'],['responsavel_celular','cel'],['numero_camisa','num']].forEach(([k,c])=>{const v=fd.get(c);if(v!==null&&v!=='')F.append(k,v);});
    ui.posSel.forEach(p=>F.append('posicoes[]',p));F.append('termo_aceito','1');
    if(ui.fotoTmp){const b=await (await fetch(ui.fotoTmp)).blob();F.append('foto',b,'foto.jpg');}
    const r=await api('POST','/alunos',null,F);
    ui.posSel=[];ui.fotoTmp=null;ui.tela.dono='alunos';ui.cat=S_(r.aluno.categoria.id);
    await carregar(['alunos','cats','promo']);ui.modal={tipo:'credApi',r};render();},
  promo:async(fd)=>{const ids=fd.getAll('p').map(Number);if(!ids.length){toast('Selecione pelo menos um aluno.');return;}const r=await api('POST','/promocoes',{alunos:ids});await recarregar(['alunos','cats','promo'],r.mensagem);},
  mudarCat:async(fd)=>{const b=al(ui.modal.id);const r=await api('POST',`/alunos/${b.id}/categoria`,{categoria_id:N(fd.get('cat'))});await recarregar(['alunos','cats','promo'],r.mensagem);},
  evento:async(fd,f)=>{capturaEv(f);const d=ui.modal.d;
    if(d.fim<=d.hora){toast('O horário de fim precisa ser depois do início.');return;}
    const jogo=d.grupo==='jogo';
    const body={categoria_id:N(d.cat),grupo:d.grupo,modalidade:d.sub,titulo:jogo?null:d.titulo,adversario:jogo?d.adv:null,mando:jogo?(d.mando||'casa'):null,
      data:d.data,hora_inicio:d.hora,hora_fim:d.fim,chegada:jogo&&d.chegada?d.chegada:null,local:d.local,uniforme:d.uniforme||null,levar:d.levar,
      plano:jogo?null:{objetivo:d.objetivo||'',atividades:d.atividades.filter(a=>a.nome&&a.nome.trim()).map(a=>({nome:a.nome.trim(),minutos:N(a.min)||1,lousa_id:N(a.lousa)}))},
      observacoes:d.obs||null};
    if(!d.id&&!jogo&&d.repetir){body.repetir=true;body.dias_semana=d.dias.map(Number);body.repetir_ate=d.ate;}
    if(d.id){await api('PUT',`/eventos/${d.id}`,body);await carregar(['eventos']);ui.modal={tipo:'evDet',id:d.id};toast('Alterações salvas. Os alunos foram avisados.');}
    else{const r=await api('POST','/eventos',body);ui.catProf=d.cat;ui.modal=null;await recarregar(['eventos'],r.data.length>1?r.data.length+' treinos marcados. Os alunos foram avisados.':'Marcado. Os alunos foram avisados.');}},
  convocar:async(fd)=>{const id=ui.modal.id;const r=await api('PUT',`/eventos/${id}/convocacao`,{alunos:fd.getAll('c').map(Number)});await carregar(['eventos']);ui.modal={tipo:'evDet',id};toast(r.mensagem+' Os novos foram avisados.');},
  chamada:async(fd)=>{const e=ev(ui.modal.id),mapa={};alunosCat(e.cat).forEach(a=>{const v=fd.get('p_'+a.id);if(v)mapa[a.id]=CHV[v];});const r=await api('PUT',`/eventos/${e.id}/chamada`,{chamada:mapa});ui.modal=null;await recarregar(['eventos'],r.mensagem);},
  cancelar:async(fd)=>{const r=await api('POST',`/eventos/${ui.modal.id}/cancelar`,{motivo:fd.get('motivo').trim(),serie:!!fd.get('serie')});ui.modal=null;await recarregar(['eventos'],r.mensagem+' Os alunos foram avisados.');},
  rapida:async(fd)=>{const sb=fd.get('sub');const r=await api('POST','/partidas/rapida',{categoria_id:N(fd.get('cat')),modalidade:sb,adversario:sb==='Coletivo'?null:(fd.get('adv')||'').trim(),local:(fd.get('local')||'').trim()||null});
    ui.catProf=fd.get('cat');ui.tela.professor='aovivo';ui.liveSetup={ev:S_(r.evento_id),n:7};ui.modal=null;await recarregar(['eventos'],r.mensagem);},
  liveStart:async(fd)=>{const st=ui.liveSetup,e=ev(st.ev),jogo=e.grupo==='jogo',lista=porPosicao(alunosCat(e.cat)),pre=jogo?'e_':'t_';
    const g=v=>lista.filter(a=>fd.get(pre+a.id)===v).map(a=>N(a.id));
    const body={n:N(fd.get('n')),duracao:N(fd.get('dur')),tempos:N(fd.get('tempos'))};
    if(jogo){body.titulares=g('t');body.reservas=g('r');body.adversario=(fd.get('adv')||e.adv||'').trim()||null;if(!body.titulares.length){toast('Escolha os titulares.');return;}}
    else{body.time_a=g('a');body.time_b=g('b');if(!body.time_a.length||!body.time_b.length){toast('Coloque jogadores nos dois times.');return;}}
    const mk={};lista.forEach(a=>{const v=fd.get(pre+a.id);if(v)mk[a.id]=v;});S.ultEsc[e.cat+'|'+(jogo?'j':'c')]=mk;save();
    body.acao_id=novoId();body.em=Math.round(agoraServ());
    S.live=liveInicial(e,body);e.aoVivo=true;ui.liveSetup=null;
    enfileirar('POST',`/eventos/${e.id}/partida`,body);salvarLive();
    toast('Partida começou. Toque em Iniciar para rodar o cronômetro.');enviarFila();},
  gol:async(fd)=>{const t=ui.modal.time,autor=fd.get('autor')||null;let as=fd.get('assist')||null;if(as===autor)as=null;const dt=fd.get('detalhe')||'normal';ui.modal=null;
    await acaoLive({acao:'gol',time:t,aluno_id:N(autor),assistencia_id:N(as),detalhe:dt});
    const Lg=S.live;ui.fx={tipo:'gol',texto:(autor?nomeDe(autor):nomeTime(Lg,t))+(DET[dt]?' · '+DET[dt]:'')+(as?' · assistência de '+pNome(as):''),placar:nomeTime(Lg,'a')+' '+Lg.placar.a+' x '+Lg.placar.b+' '+nomeTime(Lg,'b')};
    vibrar([200,80,200,80,400]);clearTimeout(vFx._t);vFx._t=setTimeout(()=>{if(ui.fx&&ui.fx.tipo==='gol'){ui.fx=null;render();}},2800);render();},
  penDef:async(fd)=>{const t=ui.modal.time;ui.modal=null;await acaoLive({acao:'penalti_defendido',time:t,aluno_id:N(fd.get('aluno'))},'Pênalti defendido!');},
  cartao:async(fd)=>{const t=ui.modal.time;ui.modal=null;await acaoLive({acao:'cartao',time:t,aluno_id:N(fd.get('aluno')),cor:fd.get('cor')});},
  sub:async(fd)=>{const t=ui.modal.time,sai=fd.get('sai'),entra=fd.get('entra');if(!sai||!entra)return;ui.modal=null;await acaoLive({acao:'substituicao',time:t,sai_id:N(sai),entra_id:N(entra)},'Entra '+pNome(entra)+', sai '+pNome(sai)+'.');},
  encerrar:async(fd)=>{const L=S.live,id=L.ev,e=ev(id);
    enfileirar('POST',`/eventos/${id}/partida/encerrar`,{conta_na_carta:!!fd.get('conta'),observacao:(fd.get('obs')||'').trim()||null,em:Math.round(agoraServ())});
    if(e){e.encerrado=true;e.aoVivo=false;e.placar={a:L.placar.a,b:L.placar.b};}
    S.live=null;salvarLive();ui.estadio=false;wake(false);ui.modal=null;render();
    for(let i=0;i<40&&enviando;i++)await new Promise(r=>setTimeout(r,250));
    await enviarFila();
    if(filaDaPartida(id)){toast('Partida salva no aparelho. Vai para o servidor quando a internet voltar.');return;}
    ui.cartas={};const r=await api('GET',`/eventos/${id}/resumo`);ui.modal={tipo:'resumoApi',r};toast('Partida salva.');},
  lzSalvar:async(fd)=>{const Lz=ui.lousa;Lz.nome=fd.get('nome').trim();Lz.tag=fd.get('tag');Lz.desc=fd.get('desc').trim();if(Lz.rec)pararGravacao(Lz,false);
    const body=toApiLousa(Lz);
    if(Lz.id){await api('PUT',`/lousas/${Lz.id}`,body);await recarregar(['lousas'],'Alterações salvas.');}
    else{const r=await api('POST','/lousas',body);Lz.id=S_(r.id);await recarregar(['lousas'],'Jogada "'+Lz.nome+'" salva e compartilhada com o '+catNome(Lz.cat)+'.');}},
  dica:async(fd)=>{capDraftDica();const d=ui.dDraft;
    const body={modo:d.modo==='cat'?'categoria':d.modo,tipo:d.tipo,texto:(fd.get('texto')||'').trim(),evento_id:N(fd.get('ev')),lousa_id:N(fd.get('lousa')),fixar:!!fd.get('fixar')};
    if(d.modo==='um')body.alunos=[N(fd.get('aluno'))];else if(d.modo==='varios')body.alunos=fd.getAll('alunos').map(Number);else body.categoria_id=N(d.cat);
    const r=await api('POST','/dicas',body);ui.dDraft=Object.assign({},d,{texto:'',ev:'',lousa:'',fixar:false});await recarregar(['dicas'],r.mensagem);},
  meta:async(fd)=>{await api('POST','/metas',{aluno_id:N(fd.get('aluno')),texto:fd.get('texto').trim(),prazo:fd.get('prazo')});await recarregar(['metas'],'Meta criada. O aluno foi avisado.');}
};
function sub(k,f){const s=SUB[k];if(s){const fd=new FormData(f);exec(()=>s(fd,f));return;}return subLocal(k,f);}

/* ---------- sincronização do jogo ao vivo ---------- */
setInterval(async()=>{
  if(!ui.user||!S.live||ui.role!=='professor'||document.hidden)return;
  // Com ações da partida ainda na fila, o aparelho é quem sabe o estado certo: não sobrescreve
  if(filaDaPartida(S.live.ev))return;
  try{const r=await api('GET',`/eventos/${S.live.ev}/partida`);
    if(ui.semRede||!S.live||filaDaPartida(S.live.ev))return;// resposta antiga do cache ou ação nova no meio
    const sg=assinatura(r),m=Object.assign(mapLive(r),{hist:S.live.hist||[]});
    S.live.seg=m.seg;S.live.rodando=m.rodando;S.live.minJ=m.minJ;S.live.minuto=m.minuto;
    const t=document.getElementById('timer');if(t){const reg=m.dur*60;t.textContent=fmtT(Math.min(m.seg,reg));const x=document.getElementById('timerExtra');if(x)x.textContent=m.seg>reg?'+'+fmtT(m.seg-reg):'';}
    if(sg!==ui.liveSig){ui.liveSig=sg;S.live=m;salvarLive();if(!ui.modal&&!ui.fx&&ui.tela.professor==='aovivo')render();}
  }catch(e){if(e.status===404&&!ui.semRede){S.live=null;salvarLive();await carregar(['eventos']).catch(()=>{});render();}}
},4000);

/* ---------- avisos novos no sino (aluno e responsável) ---------- */
async function checarAvisos(){
  if(!ui.user||ui.role!=='aluno'||document.hidden)return;
  try{const r=await api('GET','/notificacoes'),mudou=r.nao_lidas!==ui.naoLidas||r.itens.length!==S.notifs.length;
    S.notifs=r.itens.map(mapNotif);ui.naoLidas=r.nao_lidas;
    // Não redesenha com modal aberto ou alguém digitando, para não perder o que está na tela
    if(mudou&&!ui.modal&&!ui.fx&&!document.querySelector('input:focus,textarea:focus,select:focus'))render();
  }catch(e){}
}
setInterval(checarAvisos,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checarAvisos();});
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))navigator.serviceWorker.register(CFG.sw||'/sw.js').catch(()=>{});

S.lousas.forEach(l=>{if(!l.gravacao&&l.quadros&&l.quadros.length>=2){l.gravacao=quadrosParaGravacao(l.quadros);aplicarFlat(l,l.gravacao.frames[0].p);}});
if(!S.vistas){S.vistas={};S.alunos.forEach(a=>{S.vistas[a.id]=cqAluno(a.id).filter(c=>!(a.id==='a1'&&c==='falta'));});save();}
boot();
})();
