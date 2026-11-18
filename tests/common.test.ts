import test from 'node:test';
import assert from 'node:assert/strict';
import { courseSchema, progressSchema, quizSchema, registerSchema } from '../src/schemas/common';

test('cadastro público rejeita campos adicionais',()=>{
  assert.throws(()=>registerSchema.parse({name:'Aluno Teste',email:'aluno@test.local',password:'12345678',role:'ADMIN'}));
});

test('curso exige campos obrigatórios',()=>{
  assert.throws(()=>courseSchema.parse({title:'',description:'',categoryId:'invalido'}));
});

test('progresso aceita valores válidos',()=>{
  assert.deepEqual(progressSchema.parse({completed:true,watchedSeconds:'120'}),{completed:true,watchedSeconds:120});
});

test('quiz exige exatamente uma alternativa correta',()=>{
  assert.throws(()=>quizSchema.parse({title:'Teste',questions:[{question:'Pergunta?',options:[{text:'A',correct:false},{text:'B',correct:false}]}]}));
});
