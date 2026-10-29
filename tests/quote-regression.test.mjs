import assert from 'node:assert/strict';
import test from 'node:test';
import {quote} from '../lib/menu.ts';
const line={id:'frango',qty:2,size:'G',side:'Legumes',extras:['ovo'],note:'Teste local'};
const cases=[
 ['retirada: 2 marmitas G com ovo = R$60,80',()=>assert.equal(quote([line],'retirada',0).total,6080)],
 ['entrega zona 1: R$68,80',()=>assert.equal(quote([line],'entrega',1).total,6880)],
 ['entrega zona 0: R$65,80',()=>assert.equal(quote([line],'entrega',0).total,6580)],
 ['preço do cliente é ignorado',()=>assert.equal(quote([{...line,unit:1,price:1}],'retirada',0).total,6080)],
 ['bebida não recebe acréscimo de tamanho',()=>assert.equal(quote([{id:'coca',qty:1,size:'G',extras:[]}],'retirada',0).total,650)],
 ['carrinho vazio rejeitado',()=>assert.throws(()=>quote([],'retirada',0))],
 ['quantidade negativa rejeitada',()=>assert.throws(()=>quote([{...line,qty:-1}],'retirada',0))],
 ['quantidade acima do limite rejeitada',()=>assert.throws(()=>quote([{...line,qty:21}],'retirada',0))],
 ['tamanho inválido rejeitado',()=>assert.throws(()=>quote([{...line,size:'X'}],'retirada',0))],
 ['acompanhamento inválido rejeitado',()=>assert.throws(()=>quote([{...line,side:'X'}],'retirada',0))],
 ['adicional duplicado rejeitado',()=>assert.throws(()=>quote([{...line,extras:['ovo','ovo']}],'retirada',0))],
 ['produto desconhecido rejeitado',()=>assert.throws(()=>quote([{...line,id:'X'}],'retirada',0))],
 ['região inválida rejeitada',()=>assert.throws(()=>quote([line],'entrega',5))],
 ['modalidade inválida rejeitada',()=>assert.throws(()=>quote([line],'outro',0))],
];
for(const [name,run] of cases) test(name, run);
