const bearer = [{ bearerAuth: [] }];
const idParam = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', format: 'uuid' },
});
const idem = {
  name: 'Idempotency-Key', in: 'header', required: true,
  description: 'Chave única para impedir duplicação da operação.',
  schema: { type: 'string', example: 'abc-123' },
};
const jsonBody = (schema: any, example?: any) => ({
  required: true,
  content: { 'application/json': { schema, ...(example ? { example } : {}) } },
});
const problemResponses = {
  '400': { description: 'Requisição inválida (RFC 7807)' },
  '401': { description: 'Não autenticado (RFC 7807)' },
  '403': { description: 'Acesso negado (RFC 7807)' },
  '404': { description: 'Recurso não encontrado (RFC 7807)' },
  '409': { description: 'Conflito (RFC 7807)' },
  '429': { description: 'Limite de requisições excedido (RFC 7807)' },
  '500': { description: 'Erro interno (RFC 7807)' },
};

export const swagger = {
  openapi: '3.0.3',
  info: {
    title: 'PRISMA LMS API', version: '1.0.0',
    description: 'API REST acadêmica para gerenciamento de LMS. Use /auth/login, copie o token e clique em Authorize.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Ambiente local' }],
  tags: [
    { name: 'Auth' }, { name: 'Cursos' }, { name: 'Módulos' }, { name: 'Aulas' },
    { name: 'Matrículas e Progresso' }, { name: 'Quizzes' }, { name: 'Suporte / SLA' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Problem: { type: 'object', properties: { type:{type:'string'}, title:{type:'string'}, status:{type:'integer'}, detail:{type:'string'}, instance:{type:'string'}, requestId:{type:'string'} } },
      Login: { type:'object', required:['email','password'], properties:{ email:{type:'string',format:'email'}, password:{type:'string',format:'password'} } },
      Register: { type:'object', required:['name','email','password'], properties:{ name:{type:'string'}, email:{type:'string',format:'email'}, password:{type:'string',minLength:6}, role:{type:'string',enum:['ADMIN','PROFESSOR','ALUNO'],default:'ALUNO'} } },
      CourseInput: { type:'object', required:['title','description','categoryId'], properties:{ title:{type:'string'}, description:{type:'string'}, cover:{type:'string',nullable:true}, categoryId:{type:'string',format:'uuid'} } },
      ModuleInput: { type:'object', required:['title','order'], properties:{ title:{type:'string'}, description:{type:'string'}, order:{type:'integer',minimum:1} } },
      LessonInput: { type:'object', required:['title','videoUrl','duration','order'], properties:{ title:{type:'string'}, description:{type:'string'}, videoUrl:{type:'string'}, duration:{type:'integer',description:'Duração em segundos'}, order:{type:'integer',minimum:1} } },
      ProgressInput: { type:'object', required:['completed','watchedSeconds'], properties:{ completed:{type:'boolean'}, watchedSeconds:{type:'integer',minimum:0} } },
      QuizInput: { type:'object', required:['title','questions'], properties:{ title:{type:'string'}, questions:{type:'array',items:{type:'object',required:['question','options'],properties:{question:{type:'string'},options:{type:'array',items:{type:'object',required:['text','correct'],properties:{text:{type:'string'},correct:{type:'boolean'}}}}}}} } },
      QuizAttempt: { type:'object', required:['answers'], properties:{ answers:{type:'object',additionalProperties:{type:'string'},description:'Mapa questionId -> optionId'} } },
      SupportInput: { type:'object', required:['subject','description','priority'], properties:{ subject:{type:'string'}, description:{type:'string'}, priority:{type:'string',enum:['LOW','MEDIUM','HIGH','CRITICAL']} } },
    },
  },
  paths: {
    '/auth/register': { post: { tags:['Auth'], summary:'Cadastrar usuário', requestBody:jsonBody({$ref:'#/components/schemas/Register'},{name:'Novo Aluno',email:'novo@prisma.local',password:'123456',role:'ALUNO'}), responses:{'201':{description:'Usuário criado'},...problemResponses} } },
    '/auth/login': { post: { tags:['Auth'], summary:'Autenticar e obter JWT', requestBody:jsonBody({$ref:'#/components/schemas/Login'},{email:'admin@prisma.local',password:'123456'}), responses:{'200':{description:'Login realizado; retorna token JWT'},...problemResponses} } },
    '/courses': {
      get:{tags:['Cursos'],summary:'Listar cursos',security:bearer,responses:{'200':{description:'Lista de cursos'},...problemResponses}},
      post:{tags:['Cursos'],summary:'Criar curso (PROFESSOR)',security:bearer,parameters:[idem],requestBody:jsonBody({$ref:'#/components/schemas/CourseInput'},{title:'Node.js Básico',description:'Curso de introdução ao Node.js',cover:'https://example.com/capa.jpg',categoryId:'COLE-O-ID-DA-CATEGORIA'}),responses:{'201':{description:'Curso criado como PENDING'},...problemResponses}},
    },
    '/courses/{id}': {
      get:{tags:['Cursos'],summary:'Buscar curso por ID',security:bearer,parameters:[idParam('id','ID do curso')],responses:{'200':{description:'Curso encontrado'},...problemResponses}},
      put:{tags:['Cursos'],summary:'Editar curso (professor responsável ou ADMIN)',security:bearer,parameters:[idParam('id','ID do curso')],requestBody:jsonBody({$ref:'#/components/schemas/CourseInput'}),responses:{'200':{description:'Curso atualizado'},...problemResponses}},
      delete:{tags:['Cursos'],summary:'Excluir curso (ADMIN)',security:bearer,parameters:[idParam('id','ID do curso')],responses:{'204':{description:'Curso excluído'},...problemResponses}},
    },
    '/courses/{id}/approve': { post:{tags:['Cursos'],summary:'Aprovar curso (ADMIN)',security:bearer,parameters:[idParam('id','ID do curso')],responses:{'200':{description:'Curso aprovado'},...problemResponses}} },
    '/courses/{id}/reject': { post:{tags:['Cursos'],summary:'Rejeitar curso (ADMIN)',security:bearer,parameters:[idParam('id','ID do curso')],responses:{'200':{description:'Curso rejeitado'},...problemResponses}} },
    '/courses/{courseId}/enroll': { post:{tags:['Matrículas e Progresso'],summary:'Matricular aluno em curso aprovado (ALUNO)',security:bearer,parameters:[idParam('courseId','ID do curso'),idem],responses:{'201':{description:'Matrícula criada'},...problemResponses}} },
    '/users/me/courses': { get:{tags:['Matrículas e Progresso'],summary:'Listar meus cursos (ALUNO)',security:bearer,responses:{'200':{description:'Matrículas do aluno'},...problemResponses}} },
    '/courses/{courseId}/students': { get:{tags:['Matrículas e Progresso'],summary:'Listar alunos do curso (PROFESSOR/ADMIN)',security:bearer,parameters:[idParam('courseId','ID do curso')],responses:{'200':{description:'Alunos matriculados'},...problemResponses}} },
    '/courses/{courseId}/modules': {
      get:{tags:['Módulos'],summary:'Listar módulos do curso',security:bearer,parameters:[idParam('courseId','ID do curso')],responses:{'200':{description:'Módulos'},...problemResponses}},
      post:{tags:['Módulos'],summary:'Criar módulo (PROFESSOR/ADMIN)',security:bearer,parameters:[idParam('courseId','ID do curso')],requestBody:jsonBody({$ref:'#/components/schemas/ModuleInput'},{title:'Módulo 2',description:'Conteúdo do módulo',order:2}),responses:{'201':{description:'Módulo criado'},...problemResponses}},
    },
    '/modules/{id}': {
      get:{tags:['Módulos'],summary:'Buscar módulo',security:bearer,parameters:[idParam('id','ID do módulo')],responses:{'200':{description:'Módulo'},...problemResponses}},
      put:{tags:['Módulos'],summary:'Editar módulo',security:bearer,parameters:[idParam('id','ID do módulo')],requestBody:jsonBody({$ref:'#/components/schemas/ModuleInput'}),responses:{'200':{description:'Módulo atualizado'},...problemResponses}},
      delete:{tags:['Módulos'],summary:'Excluir módulo',security:bearer,parameters:[idParam('id','ID do módulo')],responses:{'204':{description:'Módulo excluído'},...problemResponses}},
    },
    '/modules/{moduleId}/lessons': {
      get:{tags:['Aulas'],summary:'Listar aulas do módulo',security:bearer,parameters:[idParam('moduleId','ID do módulo')],responses:{'200':{description:'Aulas'},...problemResponses}},
      post:{tags:['Aulas'],summary:'Criar aula (PROFESSOR/ADMIN)',security:bearer,parameters:[idParam('moduleId','ID do módulo')],requestBody:jsonBody({$ref:'#/components/schemas/LessonInput'},{title:'Nova aula',description:'Descrição da aula',videoUrl:'https://example.com/video',duration:600,order:3}),responses:{'201':{description:'Aula criada'},...problemResponses}},
    },
    '/lessons/{id}': {
      get:{tags:['Aulas'],summary:'Buscar aula',security:bearer,parameters:[idParam('id','ID da aula')],responses:{'200':{description:'Aula'},...problemResponses}},
      put:{tags:['Aulas'],summary:'Editar aula',security:bearer,parameters:[idParam('id','ID da aula')],requestBody:jsonBody({$ref:'#/components/schemas/LessonInput'}),responses:{'200':{description:'Aula atualizada'},...problemResponses}},
      delete:{tags:['Aulas'],summary:'Excluir aula',security:bearer,parameters:[idParam('id','ID da aula')],responses:{'204':{description:'Aula excluída'},...problemResponses}},
    },
    '/lessons/{lessonId}/progress': { post:{tags:['Matrículas e Progresso'],summary:'Registrar progresso (ALUNO)',security:bearer,parameters:[idParam('lessonId','ID da aula'),idem],requestBody:jsonBody({$ref:'#/components/schemas/ProgressInput'},{completed:true,watchedSeconds:540}),responses:{'200':{description:'Progresso registrado'},...problemResponses}} },
    '/courses/{courseId}/progress': { get:{tags:['Matrículas e Progresso'],summary:'Calcular progresso percentual (ALUNO)',security:bearer,parameters:[idParam('courseId','ID do curso')],responses:{'200':{description:'Total, concluídas e percentual'},...problemResponses}} },
    '/modules/{moduleId}/quizzes': {
      get:{tags:['Quizzes'],summary:'Listar quizzes',security:bearer,parameters:[idParam('moduleId','ID do módulo')],responses:{'200':{description:'Quizzes sem revelar alternativas corretas'},...problemResponses}},
      post:{tags:['Quizzes'],summary:'Criar quiz (PROFESSOR/ADMIN)',security:bearer,parameters:[idParam('moduleId','ID do módulo')],requestBody:jsonBody({$ref:'#/components/schemas/QuizInput'},{title:'Quiz de revisão',questions:[{question:'Qual alternativa está correta?',options:[{text:'Alternativa A',correct:true},{text:'Alternativa B',correct:false}]}]}),responses:{'201':{description:'Quiz criado'},...problemResponses}},
    },
    '/quizzes/{quizId}/attempt': { post:{tags:['Quizzes'],summary:'Responder quiz (ALUNO)',security:bearer,parameters:[idParam('quizId','ID do quiz')],requestBody:jsonBody({$ref:'#/components/schemas/QuizAttempt'},{answers:{'QUESTION_ID':'OPTION_ID'}}),responses:{'200':{description:'Resultado registrado'},...problemResponses}} },
    '/support': {
      get:{tags:['Suporte / SLA'],summary:'Listar chamados',security:bearer,responses:{'200':{description:'Chamados do usuário; ADMIN vê todos'},...problemResponses}},
      post:{tags:['Suporte / SLA'],summary:'Abrir chamado com SLA automático',security:bearer,requestBody:jsonBody({$ref:'#/components/schemas/SupportInput'},{subject:'Problema para acessar aula',description:'O vídeo não está carregando.',priority:'HIGH'}),responses:{'201':{description:'Chamado criado com deadline calculado'},...problemResponses}},
    },
    '/support/{id}': {
      get:{tags:['Suporte / SLA'],summary:'Buscar chamado',security:bearer,parameters:[idParam('id','ID do chamado')],responses:{'200':{description:'Chamado'},...problemResponses}},
      put:{tags:['Suporte / SLA'],summary:'Atualizar status do chamado (ADMIN)',security:bearer,parameters:[idParam('id','ID do chamado')],requestBody:jsonBody({type:'object',required:['status'],properties:{status:{type:'string',enum:['OPEN','IN_PROGRESS','CLOSED']}}},{status:'IN_PROGRESS'}),responses:{'200':{description:'Chamado atualizado'},...problemResponses}},
    },
  },
};
