# Aula Viva — TODO

## Design System & Base
- [x] Configurar paleta de cores (creme, azul escuro, teal, amarelo dourado)
- [x] Configurar tipografia (Nunito/Poppins)
- [x] Atualizar index.css com variáveis de cor e estilos globais
- [x] Atualizar client/index.html com fontes Google

## Base de Dados (Schema)
- [x] Tabela quizzes
- [x] Tabela questions (banco de perguntas)
- [x] Tabela sessions (sessões de aula com código temporário)
- [x] Tabela session_responses (respostas anónimas)
- [x] Tabela chat_messages (mensagens do chat anónimo)
- [x] Migrar schema para a base de dados

## Backend (tRPC Routers)
- [x] Router quiz (criar, listar, editar, duplicar)
- [x] Router questions (banco validado, filtros por tema e sensibilidade)
- [x] Router session (criar sessão com código, abrir/fechar, gerir estado)
- [x] Router vote (submeter resposta anónima, obter estatísticas)
- [x] Router chat (enviar mensagem, moderar, sinalizar sensível)
- [x] Router report (gerar relatório pedagógico por sessão)
- [x] Router coordination (métricas agregadas para coordenação)

## Páginas do Professor
- [x] Landing page pública com explicação da plataforma
- [x] Autenticação (login via OAuth)
- [x] Dashboard do professor
- [x] Página de criação/edição de quiz
- [x] Banco de perguntas com filtros
- [x] Página de gestão de sessão ativa (lançar, moderar, encerrar)
- [x] Painel de moderação do chat em tempo real
- [x] Visualização de estatísticas da sessão
- [x] Exportação de relatório pedagógico

## Fluxo do Aluno
- [x] Página de entrada por código (sem conta)
- [x] Ecrã de votação anónima (múltipla escolha, escala, resposta aberta)
- [x] Ecrã de estatísticas da turma após votação
- [x] Ecrã de chat anónimo moderado
- [x] Mensagem de protocolo para situações sensíveis

## Painel de Coordenação
- [x] Página de coordenação com métricas agregadas
- [x] Filtros por escola, turma, disciplina e período
- [x] Gráficos de participação e tendências

## Explicações Pedagógicas
- [x] Texto explicativo em cada módulo/secção
- [x] Tooltips e ajudas contextuais

## Testes
- [x] Testes vitest para routers principais

## Melhorias Identificadas
- [x] Restringir votes.submit para aceitar apenas quando sessão está em estado "active"
- [x] Validar ownership na moderação do chat (só professor da sessão ou admin)
- [x] Implementar quizzes.duplicate no backend e UI

## Modo Kahoot (Jogo em Tempo Real)
- [x] Adicionar campo `mode` (normal | kahoot) à tabela sessions
- [x] Adicionar campo `activeQuestionIndex` e `questionStartedAt` à tabela sessions
- [x] Adicionar campo `answeredAt` e `isCorrect` à tabela session_responses
- [x] Migrar schema para a base de dados
- [x] Router: lançar próxima pergunta (professor)
- [x] Router: submeter resposta rápida do aluno com timestamp
- [x] Router: obter estado atual da sessão Kahoot (pergunta ativa, tempo restante, respostas)
- [x] Router: avançar para resultados da pergunta
- [x] Router: placar final anónimo (ordenado por nº de respostas corretas)
- [x] Ecrã do professor: modo Kahoot com botão "Próxima Pergunta", barra de progresso e contagem de respostas em tempo real
- [x] Ecrã do aluno: 4 botões coloridos estilo Kahoot com temporizador visual
- [x] Ecrã de resultados por pergunta (gráfico de barras com resposta correta destacada)
- [x] Ecrã de placar final anónimo com pódio
- [x] Integrar modo Kahoot no fluxo de criação de quiz (botão "Jogo" no Dashboard)
- [x] Redirecionamento automático no JoinSession quando mode=kahoot

## Funcionalidades Cruciais em Falta

- [x] Adicionar campo `educationLevel` (2º ciclo, 3º ciclo, secundário) à tabela questions
- [x] Adicionar campo `correctOption` à tabela questions para resposta correta
- [x] Adicionar campo `isApproved` e `submittedBy` à tabela questions para fluxo de aprovação
- [x] Migrar schema para a base de dados
- [x] Expandir categorias temáticas: ciúmes, pressão do grupo, redes sociais, masculinidades, dependência emocional
- [x] Adicionar filtro por nível de ensino no banco de perguntas e no QuizEditor
- [x] Adicionar 30+ perguntas novas cobrindo as categorias em falta e os 3 níveis de ensino
- [x] Professores podem submeter perguntas para aprovação
- [x] Coordenador/admin vê lista de perguntas pendentes e aprova/rejeita
- [x] Resposta correta visível no editor de perguntas
- [x] Modo Jogo usa resposta correta para calcular pontuação real
- [x] Exportação de relatório pedagógico em PDF formatado
- [x] Histórico de sessões no painel do professor (data, turma, nº participantes)
- [x] Vista de projeção fullscreen para sala de aula (pergunta + temporizador em grande)
- [x] Confirmação antes de sair do QuizEditor sem guardar

## Sistema de Autenticação Própria (Email + Password)
- [x] Schema: adicionar campos passwordHash, emailVerified, verificationToken, resetToken, resetTokenExpiresAt à tabela users
- [x] Migrar schema para a base de dados
- [x] Backend: auth.register (registo com email + password)
- [x] Backend: auth.login (login com email + password, gera JWT próprio)
- [x] Backend: auth.verifyEmail (verificar token de email)
- [x] Backend: auth.forgotPassword (enviar email de recuperação)
- [x] Backend: auth.resetPassword (redefinir password com token)
- [x] Integrar envio de email via Resend API
- [x] Página de registo (/register) com design Aula Viva
- [x] Página de login (/login) com design Aula Viva
- [x] Página de verificação de email (/verify-email)
- [x] Página de recuperação de password (/forgot-password)
- [x] Página de redefinição de password (/reset-password)
- [x] Atualizar useAuth hook para usar JWT próprio em vez de OAuth Manus
- [x] Atualizar todas as páginas que usam getLoginUrl() para usar /login
- [x] Testes vitest para os novos routers de autenticação

## Redesign Dashboard e Modo Jogo
- [x] Botão Eliminar Quiz no Dashboard com confirmação
- [x] Botão Jogar grande e central nos cartões de quiz
- [x] Botão Gerir que abre página de estatísticas por quiz
- [x] Remover botões "Lançar Sessão" e "Jogo" separados
- [x] Página /quiz/:id/stats com estatísticas agregadas de todas as sessões
- [x] Procedimento quizzes.stats no servidor
- [x] Escala com 4 opções concordo/discordo (sem ponto de interrogação)
- [x] Perguntas abertas: caixa de texto no aluno
- [x] Ecrã final sem ranking — foco em participação
- [x] KahootPlayer preenche tela completa no telemóvel

## Revisão Geral (Jun 2026)
- [x] KahootPlayer: botão "Prefiro não responder" em todas as perguntas
- [x] KahootPlayer: perguntas de escala mostrar texto das opções (não só cor)
- [x] KahootHost: mostrar respostas abertas no ecrã de resultados
- [x] QuestionBank: remover texto "validado por especialistas" e aviso de aprovação para professores
- [x] QuestionBank: opções de escala fixas (não editáveis)
- [x] StudentSession: corrigir SCALE_LABELS para 4 opções concordo/discordo
- [x] Coordination: remover imports não usados
- [x] KahootHost: mostrar pergunta aberta no ecrã de resultados com lista de respostas

## Melhorias pedagógicas (documentos — Jun 2026)

- [x] Corrigir bug escala 5→4 opções no StudentSession.tsx
- [x] Adicionar campos turma e data ao lançar sessão (modal antes do jogo)
- [x] Guardar turma/data na tabela sessions (schema + migração)
- [x] Completar getCoordinationStats com join quizzes+users (nº professores, disciplinas, obras, taxa de resposta)
- [x] Painel de Coordenação: adicionar KPIs de professores ativos, disciplinas e obras mais usadas
- [x] Melhorar exportação de relatório no QuizStats (HTML estruturado como SessionManager)
- [x] Adicionar ecrã de boas-vindas com regras de segurança no KahootPlayer
- [x] Adicionar campos excerto literário e tema central no QuizEditor
- [x] Guardar excerto e tema na tabela quizzes (schema + migração)
