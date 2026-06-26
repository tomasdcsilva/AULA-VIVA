# Revisão crítica dos documentos do projeto Aula Viva

## Síntese executiva

Após leitura cuidada da **proposta detalhada** e análise do material visual da plataforma, a direção conceptual do projeto está bem definida: a **Aula Viva não é um jogo de perguntas e respostas com lógica avaliativa**, mas sim um dispositivo pedagógico para **ler, votar anonimamente, debater com segurança e retomar a reflexão na aula seguinte** [1][2]. Esse princípio é a referência central para avaliar o que já foi construído e o que ainda precisa de ser afinado.

De forma geral, a plataforma já cobre uma parte relevante do **MVP previsto** — criação de quizzes, acesso por código, participação anónima, visualização de resultados e relatórios básicos. No entanto, ao comparar o estado atual com os documentos, ainda existem diferenças importantes entre uma **aplicação funcional** e uma **plataforma pedagogicamente alinhada com a candidatura PesqueirAmiga** [1].

A principal conclusão é esta:

> **O que falta não é apenas “mais funcionalidades”; falta sobretudo consolidar a coerência pedagógica, a governação dos conteúdos e o painel de avaliação global previsto nos documentos.**

## O que está bem encaminhado

Há vários aspetos que já estão alinhados com a proposta e que constituem uma boa base de trabalho.

| Área | Estado atual | Observação crítica |
|---|---|---|
| Acesso por código | Implementado | Está alinhado com o princípio de participação sem conta nominal do aluno [1]. |
| Votação anónima | Implementada | Respeita o núcleo de confiança descrito na proposta [1]. |
| Fluxo professor/aluno | Parcialmente alinhado | Já existe distinção entre interface do professor e do aluno, como previsto [1]. |
| Relatório por atividade | Implementado em versão inicial | Já existe uma base útil, mas ainda precisa de maior profundidade pedagógica. |
| Banco de perguntas | Em evolução | A reorganização recente ajuda, mas ainda precisa de validação editorial mais forte. |
| Experiência mobile | Melhorada | As correções recentes no modo jogo aproximam a plataforma de um uso real em sala de aula. |

Além disso, o material visual do projeto reforça uma lógica muito clara em **quatro momentos** — **Ler, Votar, Debater, Refletir/Retomar** — e essa espinha dorsal já começa a aparecer em partes da aplicação [2].

## O principal desalinhamento atual

O maior risco do produto, neste momento, é continuar a parecer demasiado uma ferramenta de quiz “estilo Kahoot”, quando os documentos defendem explicitamente outra lógica: uma plataforma para **tornar visíveis perceções, apoiar debate crítico e sustentar reflexão pedagógica**, e não para apurar vencedores ou medir desempenho individual [1].

Isto tem implicações diretas em várias decisões de produto.

| Tema | O que os documentos defendem | O que ainda precisa de ser revisto |
|---|---|---|
| Finalidade | Reflexão crítica e debate orientado | Ainda há vestígios de linguagem e interação demasiado competitivas |
| Estatísticas | Apoiar discussão e leitura pedagógica da turma | Algumas visualizações ainda são mais “operacionais” do que pedagógicas |
| Banco de perguntas | Curadoria validada por especialistas, professores e psicólogos | Ainda existe demasiada liberdade sem workflow de validação robusto |
| Relatórios | Apoio à aula seguinte, coordenação e financiamento | Falta consolidar exportação, indicadores agregados e leitura longitudinal |

## O que pode ser melhorado imediatamente

### 1. Clarificar definitivamente que a plataforma **não avalia alunos**

Os documentos insistem que os dados devem ser agregados e que a plataforma **não deve ser interpretada como instrumento de avaliação individual** [1]. Por isso, tudo o que pareça ranking, pontuação, acerto individual, “vencedor” ou desempenho pessoal deve ser removido, atenuado ou substituído por linguagem de participação, diversidade de perceções e reflexão.

> **Recomendação:** normalizar em toda a interface expressões como “participação da turma”, “distribuição de respostas”, “temas a discutir” e “pontos para reflexão”, evitando linguagem de acerto/erro, placar ou mérito individual.

### 2. Reorganizar o banco de perguntas como um **banco validado**, não apenas um formulário

A proposta é muito clara ao dizer que as perguntas devem ser **validadas por especialistas em género, professores e psicólogos escolares** [1]. Isto significa que o produto deveria distinguir pelo menos três camadas:

| Camada | Função |
|---|---|
| Banco validado | Perguntas oficiais, aprovadas e prontas a usar |
| Sugestões de professor | Perguntas propostas localmente, ainda não validadas |
| Gestão editorial | Área de coordenação para rever, aprovar, editar ou rejeitar perguntas |

Neste momento, o risco é o banco transformar-se num repositório livre demais. Isso enfraquece precisamente um dos ativos mais fortes da candidatura: a **qualidade pedagógica e a credibilidade do conteúdo**.

### 3. Consolidar o fluxo pedagógico completo da aula

A secção “Experiência de utilização em aula” define um percurso bastante concreto: **preparação, contextualização, votação anónima, visualização, chat orientado, encerramento e reflexão posterior** [1]. A aplicação já cobre algumas destas etapas, mas ainda não as apresenta como um percurso pedagógico coeso.

Seria útil transformar esse fluxo em estrutura explícita do produto.

| Momento | O que deveria existir de forma explícita |
|---|---|
| Antes da aula | Seleção de obra, excerto, tema, turma, disciplina e objetivos |
| Início | Enquadramento breve da atividade e instruções de segurança |
| Votação | Resposta anónima simples, com possibilidade de não responder |
| Visualização | Gráficos agregados e leitura guiada pelo professor |
| Debate | Chat moderado com regras visíveis e prompts do professor |
| Retoma | Relatório pedagógico com pistas para aula seguinte |

### 4. Melhorar a nomenclatura da interface

Em várias áreas, a linguagem ainda pode ser simplificada. O utilizador-professor não deveria ter de interpretar termos técnicos ou ambíguos. Se um conceito gerar dúvida, deve ser revisto.

Exemplos prováveis de melhoria:

| Termo atual ou genérico | Termo mais pedagógico |
|---|---|
| Sessão | Atividade, aula interativa ou jogo de turma (consoante o modo) |
| Estatísticas | Resultados da turma / leitura da turma |
| Gerir | Ver relatório / acompanhar atividade |
| Banco de perguntas | Perguntas validadas / biblioteca pedagógica |

## O que falta face aos documentos

### 1. Painel de coordenação com indicadores globais

Isto é uma das lacunas mais importantes. A proposta prevê explicitamente um **painel de coordenação** com indicadores agregados por **escola, turma, período, disciplina, obra, tema e número de sessões** [1]. Este painel não é acessório; ele serve quatro objetivos centrais do projeto:

1. **acompanhar execução**,
2. **avaliar impacto**,
3. **produzir relatórios institucionais**,
4. **apoiar candidatura e financiamento** [1].

Neste momento, este ponto parece ainda insuficientemente desenvolvido face ao peso que tem nos documentos.

### 2. Exportação estruturada de relatórios

Os documentos referem exportação em **Word, PDF ou folha de cálculo** [1]. Isto sugere que o relatório não é apenas uma página de consulta; é também um artefacto de trabalho e prestação de contas.

Atualmente, mesmo com melhorias recentes na página de gestão, ainda faz falta consolidar:

| Exportação | Utilidade |
|---|---|
| PDF | Partilha com coordenação, arquivo e reuniões |
| Word | Ajustes manuais e anexação a documentos do projeto |
| Folha de cálculo | Tratamento agregado de indicadores e análise externa |

### 3. Gestão de risco e protocolo de segurança emocional

A proposta dedica uma secção clara à necessidade de regras visíveis, filtros, ocultação de mensagens, encerramento do chat, avisos de segurança e encaminhamento para situações sensíveis [1]. Esta componente é mais do que “moderação técnica”; é uma exigência metodológica.

Faltam, ou devem ser reforçados, os seguintes elementos:

| Elemento | Estado desejável |
|---|---|
| Regras antes do chat | Sempre visíveis e adequadas à idade |
| Botão “prefiro não responder” | Disponível em perguntas sensíveis |
| Sinalização de risco | Mensagens ou respostas que exigem atenção docente |
| Protocolo de apoio | Texto com canais e encaminhamento adequado |
| Filtro de linguagem | Implementado e configurável |

### 4. Relatório pedagógico mais completo

Os documentos definem um relatório com **percentagens por pergunta, tendências principais, pontos críticos, resumo do chat, pistas de reflexão e exportação** [1]. A versão atual pode já mostrar parte disto, mas ainda deveria amadurecer em quatro direções:

| Componente do relatório | O que deveria mostrar |
|---|---|
| Participação | nº de participantes, taxa de resposta, duração do debate |
| Perceções | distribuição de respostas por tema sensível |
| Pontos críticos | perguntas com maior dispersão, ambivalência ou normalização de risco |
| Retoma pedagógica | sugestões para a próxima aula, com base nos dados |

### 5. Indicadores de impacto para a candidatura

A secção 18 da proposta detalha um conjunto de **indicadores de avaliação e impacto** que devem poder ser recolhidos pela plataforma [1]. Esta é outra área onde ainda parece faltar robustez. Os indicadores sugeridos incluem:

| Dimensão | Indicadores previstos nos documentos |
|---|---|
| Alcance | nº de escolas, turmas, professores, sessões e alunos participantes |
| Utilização | nº de quizzes criados, quizzes aplicados, obras trabalhadas e temas abordados |
| Participação | taxa média de resposta, nº de mensagens no chat, duração média dos debates |
| Perceções | respostas relativas a controlo, ciúme, consentimento, pressão emocional, violência psicológica |
| Aprendizagem | comparação entre respostas iniciais, debate e reflexão posterior, quando aplicável |
| Qualidade pedagógica | feedback dos professores e utilidade dos relatórios |
| Disseminação | relatórios, infografias agregadas e comunicação do projeto |

Neste momento, a plataforma parece mais preparada para **uso em aula** do que para **produção sistemática de evidências de impacto**, e os documentos pedem as duas coisas.

## O que está pedagogicamente subexplorado

### 1. A leitura literária como ponto de partida

O material visual insiste na sequência **“da leitura à reflexão”** e na análise de **excertos literários em contexto seguro** [2]. Isso significa que o quiz não deveria aparecer isolado; deveria nascer de uma obra, de um excerto, de uma personagem, de um dilema narrativo.

Seria importante reforçar no produto:

- a associação de cada quiz a uma **obra literária**;
- a possibilidade de guardar o **excerto de referência**;
- a identificação do **tema central** (controlo, ciúme, consentimento, redes sociais, etc.);
- a ligação entre pergunta e **competência pedagógica**.

### 2. Perguntas abertas e leitura qualitativa das respostas

Os documentos valorizam respostas abertas curtas como forma de formular alternativas saudáveis e pensamento construtivo [1]. A plataforma já começou a caminhar nessa direção, mas isso precisa de ser levado mais longe.

O professor deveria conseguir ver, de forma muito simples e anonimizável:

| Leitura qualitativa | Exemplo |
|---|---|
| Respostas mais frequentes | Formulações que se repetem |
| Palavras-chave emergentes | Termos dominantes na turma |
| Exemplos anonimizados | Frases ilustrativas para debate |
| Sinais de preocupação | Conteúdos que justificam atenção posterior |

### 3. Diferença entre “modo jogo” e “modo reflexão”

Os documentos não proíbem uma dimensão lúdica, mas a plataforma precisa de deixar mais claro quando está em **modo dinâmico de participação** e quando está em **modo leitura/reflexão**. Um único padrão de interação para tudo pode empobrecer o uso pedagógico.

Uma melhoria forte seria assumir explicitamente dois modos:

| Modo | Finalidade |
|---|---|
| Modo jogo | Aquecer a participação e dinamizar resposta rápida |
| Modo reflexão | Trabalhar perceções, debate e relatório pedagógico |

## O que pode criar problemas mais tarde se não for resolvido agora

### 1. Falta de workflow editorial

Se qualquer professor puder criar e reutilizar perguntas sem mediação, o banco degrada-se rapidamente. Os documentos protegem-se desse risco ao defender validação por especialistas [1]. Sem esse workflow, a plataforma arrisca perder coerência, segurança pedagógica e credibilidade institucional.

### 2. Interpretação indevida dos dados

Os documentos alertam expressamente para o risco de os dados serem lidos como **avaliação individual** [1]. Por isso, a interface tem de impedir não apenas a identificação nominal, mas também leituras implícitas de desempenho pessoal, sobretudo em turmas pequenas ou sessões com poucos participantes.

### 3. Subutilização do painel de coordenação

Sem o módulo de coordenação, a plataforma pode funcionar bem para uma aula, mas falhar naquilo que é decisivo para a candidatura: **provar execução, alcance, adesão e utilidade pedagógica** [1].

## Prioridades recomendadas

A ordem de trabalho mais racional, tendo em conta os documentos, seria esta:

| Prioridade | Ação recomendada | Razão |
|---|---|---|
| Muito alta | Consolidar o painel de coordenação e indicadores globais | É central para avaliação, financiamento e relatórios [1] |
| Muito alta | Criar workflow de validação do banco de perguntas | Protege a qualidade pedagógica e reduz riscos [1] |
| Muito alta | Reforçar segurança emocional, moderação e protocolo de apoio | Está explicitamente previsto na proposta [1] |
| Alta | Melhorar exportação de relatórios (PDF, Word, folha de cálculo) | Necessário para uso institucional [1] |
| Alta | Refinar o relatório pedagógico com leitura qualitativa e pistas de aula | É um dos diferenciais centrais do projeto [1] |
| Média | Reforçar associação quiz–obra–excerto–tema–competência | Aproxima o produto da lógica “da leitura à reflexão” [2] |
| Média | Separar melhor modo jogo e modo reflexão | Reduz ruído competitivo e aumenta coerência pedagógica |
| Média | Rever toda a linguagem da interface | Diminui confusão e melhora adoção docente |

## Conclusão

A documentação enviada é sólida e dá uma identidade muito clara à Aula Viva. O projeto não foi pensado como uma plataforma genérica de quizzes, mas como uma **ferramenta pedagógica, segura, anonimizante e orientada para reflexão crítica sobre desigualdade de género e relações tóxicas**, com utilidade simultaneamente **didática, institucional e avaliativa** [1][2].

Neste momento, a plataforma já está numa fase em que **funciona** em vários aspetos fundamentais. No entanto, para ficar realmente fiel aos documentos, precisa de reforçar quatro eixos:

1. **governação pedagógica do banco de perguntas**;
2. **painel de coordenação e indicadores globais**;
3. **segurança emocional, moderação e protocolo de risco**;
4. **relatório pedagógico/exportação com valor institucional e não apenas visual**.

> Em resumo: **a base tecnológica existe, mas a próxima etapa decisiva é transformar a aplicação funcional numa plataforma metodologicamente coerente com a candidatura**.

## Fontes

[1]: /home/ubuntu/upload/proposta_detalhada_plataforma_aula_viva.pdf "Proposta detalhada de desenvolvimento — Plataforma Aula Viva"
[2]: /home/ubuntu/upload/Plataforma_AulaViva_—_PesqueirAmiga.pdf "Documento visual da Plataforma Aula Viva"
