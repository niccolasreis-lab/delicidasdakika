export const categories=['Todos','Marmitas','Prato do dia','Extras','Bebidas'];
export const menu=[
{id:'frango',name:'Frango grelhado da Kika',description:'Filé de frango douradinho, arroz soltinho, feijão caseiro e seu acompanhamento favorito.',price:1890,category:'Marmitas',icon:'🍗',color:'#e8b66b',tag:'Queridinho da casa'},
{id:'strogonoff',name:'Strogonoff de frango',description:'Cremoso na medida, com arroz branco e batata palha crocante.',price:2190,category:'Prato do dia',icon:'🥘',color:'#d68747',tag:'Prato do dia'},
{id:'calabresa',name:'Calabresa acebolada',description:'Calabresa na chapa com cebola dourada, arroz e feijão feito com carinho.',price:1790,category:'Marmitas',icon:'🍲',color:'#b9603f',tag:''},
{id:'parmegiana',name:'Frango à parmegiana',description:'Frango empanado, molho de tomate caseiro e queijo derretido. Acompanha arroz e fritas.',price:2490,category:'Marmitas',icon:'🍛',color:'#c96b38',tag:'Especial da Kika'},
{id:'vegetariana',name:'Marmita da horta',description:'Legumes da estação, arroz, feijão e uma generosa porção de sabor.',price:1790,category:'Marmitas',icon:'🥦',color:'#88a65c',tag:'Sem carne'},
{id:'mini',name:'Mini marmita de frango',description:'Uma porção menor do nosso frango com arroz, feijão e acompanhamento.',price:1290,category:'Marmitas',icon:'🍱',color:'#d8a15c',tag:'Porção menor'},
{id:'ovo',name:'Ovo frito',description:'Mais um carinho na sua marmita. Conte nas observações como prefere.',price:350,category:'Extras',icon:'🍳',color:'#e9c36b',tag:''},
{id:'fritas',name:'Porção de fritas',description:'Douradinhas por fora e macias por dentro.',price:890,category:'Extras',icon:'🍟',color:'#edc568',tag:''},
{id:'coca',name:'Coca-Cola 350 ml',description:'Lata de 350 ml para acompanhar seu almoço.',price:650,category:'Bebidas',icon:'🥤',color:'#bc4d3c',tag:''},
{id:'guarana',name:'Guaraná Antarctica 350 ml',description:'Lata de 350 ml, bem geladinha.',price:600,category:'Bebidas',icon:'🥤',color:'#6d9b58',tag:''}
];
export const extras=[{id:'ovo',name:'Ovo frito',price:350},{id:'carne',name:'Frango extra',price:600}];
export const zones=[{name:'Zona de exemplo • até 2 km',fee:500},{name:'Zona de exemplo • 2 a 4 km',fee:800}];
export const money=(v:number)=>(v/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
type PricingCatalog={menu:{id:string;name:string;price:number;category:string;mediumExtra?:number;largeExtra?:number}[];extras:typeof extras;zones:typeof zones};
export function quote(lines:any[],fulfillment:string,zone:number){return quoteWithCatalog(lines,fulfillment,zone,{menu,extras,zones})}
export function quoteWithCatalog(lines:{id:string;qty:number;size:string;side:string;extras:string[];note:string}[],fulfillment:string,zone:number,data:PricingCatalog){
 const {menu,extras,zones}=data;
 if(!Array.isArray(lines)||!lines.length||lines.length>30)throw Error('Escolha entre 1 e 30 itens.');
 if(!['entrega','retirada'].includes(fulfillment))throw Error('Selecione entrega ou retirada.');
 const items=lines.map(l=>{const p=menu.find(p=>p.id===l.id);if(!p||!Number.isInteger(l.qty)||l.qty<1||l.qty>20)throw Error('Item inválido.');const meal=['Marmitas','Prato do dia'].includes(p.category);const size=meal?l.size:'P';if(!['P','M','G'].includes(size))throw Error('Tamanho inválido.');if(meal&&!['Fritas','Legumes','Batata palha'].includes(l.side))throw Error('Selecione o acompanhamento.');const ids=Array.isArray(l.extras)?l.extras:[];if(ids.length>2||new Set(ids).size!==ids.length||(!meal&&ids.length))throw Error('Adicionais inválidos.');const adds=ids.map((id:string)=>{const a=extras.find(a=>a.id===id);if(!a)throw Error('Adicional inválido.');return a;});const unit=p.price+({P:0,M:p.mediumExtra??400,G:p.largeExtra??800}[size as 'P'|'M'|'G'])+adds.reduce((s:number,a:any)=>s+a.price,0);return {id:p.id,name:p.name,qty:l.qty,size,side:meal?l.side:'',extras:ids,note:String(l.note||'').slice(0,300),unit};});
 if(fulfillment==='entrega'&&(!Number.isInteger(zone)||!zones[zone]))throw Error('Selecione a região.');
 const fee=fulfillment==='entrega'?zones[zone].fee:0;return {items,fee,total:items.reduce((s,l)=>s+l.unit*l.qty,0)+fee};
}
