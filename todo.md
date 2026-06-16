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
