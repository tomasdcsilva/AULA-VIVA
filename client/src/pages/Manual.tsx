import { Link } from "wouter";
import { ArrowLeft, BookOpen, Play, MessageCircle, BarChart3, FileText, Users, Shield, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface AccordionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Accordion({ title, icon, children, defaultOpen = false }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-2xl overflow-hidden mb-4">
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-cream-dark transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 font-display font-bold text-navy">
          <span className="text-teal">{icon}</span>
          {title}
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-card border-t border-border text-sm text-navy space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal text-white text-xs font-bold flex items-center justify-center">{n}</span>
      <p className="pt-0.5">{text}</p>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-amber-800 text-xs">
      <span className="text-base">💡</span>
      <p>{text}</p>
    </div>
  );
}

export default function Manual() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-navy mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar à plataforma
          </Link>
          <div className="av-card bg-gradient-to-br from-teal to-teal-dark text-white mb-2">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-8 h-8" />
              <div>
                <h1 className="font-display font-bold text-2xl">Manual de Utilização</h1>
                <p className="text-teal-100 text-sm">Aula Viva · Projeto PesqueirAmiga</p>
              </div>
            </div>
            <p className="text-teal-100 text-sm leading-relaxed">
              Guia completo para professores sobre como criar quizzes, lançar sessões, moderar o debate e interpretar os relatórios pedagógicos.
            </p>
          </div>
        </div>

        {/* Introdução */}
        <div className="av-card mb-6">
          <h2 className="font-display font-bold text-navy text-lg mb-2">O que é a Aula Viva?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Aula Viva é uma plataforma pedagógica que organiza a atividade de aula em cinco momentos: <strong>ler, votar, ver, conversar e refletir</strong>. O professor seleciona uma obra literária, cria ou escolhe perguntas, lança uma sessão com código, os alunos respondem anonimamente, a turma visualiza estatísticas agregadas, abre-se um chat anónimo moderado e, no final, a plataforma gera um relatório pedagógico.
          </p>
          <div className="grid grid-cols-5 gap-2 mt-4">
            {[
              { emoji: "📖", label: "Ler" },
              { emoji: "🗳️", label: "Votar" },
              { emoji: "📊", label: "Ver" },
              { emoji: "💬", label: "Conversar" },
              { emoji: "🔍", label: "Refletir" },
            ].map((m) => (
              <div key={m.label} className="bg-cream-dark rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{m.emoji}</div>
                <p className="text-xs font-semibold text-navy">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Secções do manual */}
        <Accordion title="1. Criar uma conta" icon={<Users className="w-5 h-5" />} defaultOpen>
          <Step n={1} text='Acede à plataforma e clica em "Criar conta" no ecrã de login.' />
          <Step n={2} text="Preenche o teu nome completo, email profissional, escola e uma password segura (mínimo 8 caracteres)." />
          <Step n={3} text='Clica em "Registar". A conta é criada imediatamente — não é necessário confirmar o email.' />
          <Step n={4} text='Para editar o teu nome ou escola mais tarde, clica no teu nome no canto superior direito e acede a "O meu perfil".' />
          <Tip text="Usa o teu email profissional da escola para que o coordenador do projeto te possa identificar no painel de acompanhamento." />
        </Accordion>

        <Accordion title="2. Criar um quiz" icon={<BookOpen className="w-5 h-5" />}>
          <Step n={1} text='No painel principal, clica em "Novo Quiz".' />
          <Step n={2} text="Preenche o título, seleciona a obra literária, o tema, a disciplina, o ano de escolaridade e a turma." />
          <Step n={3} text='Na secção "Banco de Perguntas", escolhe perguntas já validadas por especialistas ou cria as tuas próprias.' />
          <Step n={4} text='Nas opções avançadas, podes ativar "Resultados apenas no relatório" para que os alunos não vejam os gráficos durante a sessão — útil para perguntas mais sensíveis.' />
          <Step n={5} text='Clica em "Guardar Quiz" quando estiveres satisfeito.' />
          <Tip text="Podes duplicar um quiz existente para adaptar a outra turma ou obra, sem ter de começar do zero." />
        </Accordion>

        <Accordion title="3. Lançar uma sessão" icon={<Play className="w-5 h-5" />}>
          <Step n={1} text='No painel principal, encontra o teu quiz e clica em "Lançar Sessão".' />
          <Step n={2} text="Confirma os dados da sessão (turma, modo de jogo) e clica em iniciar." />
          <Step n={3} text="Aparece um código de 5 caracteres (ex: AB-123). Projeta este código no quadro ou partilha-o com os alunos." />
          <Step n={4} text='Os alunos acedem a aulaviva-p8o2mkci.manus.space/join e introduzem o código — sem criar conta.' />
          <Step n={5} text='Quando os alunos estiverem ligados, clica em "Abrir Votação" para iniciar as perguntas.' />
          <Tip text="A sessão tem dois modos: modo normal (quiz com debate) e modo Kahoot (competição com pontuação em tempo real). Escolhe o modo adequado ao objetivo pedagógico da aula." />
        </Accordion>

        <Accordion title="4. Gerir a sessão em tempo real" icon={<BarChart3 className="w-5 h-5" />}>
          <p className="text-muted-foreground">Durante a sessão, tens controlo total sobre o ritmo e o conteúdo:</p>
          <div className="space-y-2 mt-2">
            <div className="flex items-start gap-2">
              <span className="text-teal font-bold text-xs mt-0.5">VOTAR</span>
              <p>Os alunos respondem anonimamente. Vês o número de respostas em tempo real.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-teal font-bold text-xs mt-0.5">VER</span>
              <p>Clica em "Encerrar Votação" para mostrar os gráficos de resultados à turma (se esta opção estiver ativa).</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-teal font-bold text-xs mt-0.5">CHAT</span>
              <p>Clica em "Abrir Chat" para iniciar o debate anónimo. Podes pausar, ocultar mensagens ou encerrar o chat a qualquer momento.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-teal font-bold text-xs mt-0.5">ENCERRAR</span>
              <p>Clica em "Encerrar Sessão" quando a atividade terminar. Os dados ficam guardados para o relatório.</p>
            </div>
          </div>
          <Tip text="Usa a vista de projeção (botão do monitor) para mostrar os resultados no quadro interativo sem expor o painel de controlo." />
        </Accordion>

        <Accordion title="5. Moderar o chat" icon={<MessageCircle className="w-5 h-5" />}>
          <p className="text-muted-foreground">O chat anónimo é moderado em tempo real. Para cada mensagem, podes:</p>
          <div className="space-y-2 mt-2">
            <div className="flex items-start gap-2"><span className="text-red-500">🚫</span><p><strong>Ocultar</strong> — remove a mensagem do chat público (apenas o professor vê que foi ocultada).</p></div>
            <div className="flex items-start gap-2"><span className="text-amber-500">⭐</span><p><strong>Destacar</strong> — marca a mensagem como relevante para o debate ou para o relatório.</p></div>
            <div className="flex items-start gap-2"><span className="text-red-600">🚩</span><p><strong>Sinalizar</strong> — marca como conteúdo sensível para acompanhamento posterior.</p></div>
          </div>
          <Tip text="Quando um aluno escreve uma mensagem com palavras associadas a situações de risco (ex: 'ajuda', 'medo', 'violência'), a plataforma mostra automaticamente ao aluno um painel com canais de apoio (Linha 116 006, APAV, psicólogo escolar)." />
        </Accordion>

        <Accordion title="6. Ler e exportar o relatório" icon={<FileText className="w-5 h-5" />}>
          <Step n={1} text='No painel principal, clica em "Ver Relatório" na sessão que pretendes analisar.' />
          <Step n={2} text="O relatório inclui: identificação da sessão, participação, resultados por pergunta, pontos críticos, resumo do chat e sugestões para a próxima aula." />
          <Step n={3} text='Para guardar, usa "Exportar PDF" (documento formatado) ou "Exportar Excel" (dados em folha de cálculo com 3 separadores: Sessão, Resultados e Sugestões).' />
          <Tip text="O relatório não contém dados que permitam identificar alunos individualmente — apenas estatísticas agregadas e excertos anonimizados do chat." />
        </Accordion>

        <Accordion title="7. Segurança e anonimato" icon={<Shield className="w-5 h-5" />}>
          <p className="text-muted-foreground leading-relaxed">A plataforma foi desenhada para proteger os alunos:</p>
          <div className="space-y-2 mt-2">
            <div className="flex items-start gap-2"><span>🔒</span><p>Os alunos entram por código temporário — não criam conta, não fornecem nome nem email.</p></div>
            <div className="flex items-start gap-2"><span>👁️</span><p>O professor vê apenas estatísticas agregadas — nunca consegue associar uma resposta a um aluno específico.</p></div>
            <div className="flex items-start gap-2"><span>💬</span><p>As mensagens do chat são anónimas. O professor pode moderá-las mas não sabe quem as escreveu.</p></div>
            <div className="flex items-start gap-2"><span>📋</span><p>Os relatórios exportados contêm apenas dados agregados e excertos anonimizados.</p></div>
          </div>
        </Accordion>

        <Accordion title="8. Perguntas frequentes" icon={<HelpCircle className="w-5 h-5" />}>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-navy">Os alunos precisam de criar conta?</p>
              <p className="text-muted-foreground mt-1">Não. Os alunos entram apenas com o código da sessão, sem fornecer qualquer dado pessoal.</p>
            </div>
            <div>
              <p className="font-semibold text-navy">Posso usar a plataforma no telemóvel?</p>
              <p className="text-muted-foreground mt-1">Sim. A plataforma é responsiva e funciona em telemóveis, tablets e computadores.</p>
            </div>
            <div>
              <p className="font-semibold text-navy">O que acontece se encerrar a sessão por engano?</p>
              <p className="text-muted-foreground mt-1">Os dados ficam guardados e o relatório continua disponível. Não é possível reabrir uma sessão encerrada, mas podes criar uma nova sessão com o mesmo quiz.</p>
            </div>
            <div>
              <p className="font-semibold text-navy">Esqueci a password. O que faço?</p>
              <p className="text-muted-foreground mt-1">Na página de login, clica em "Esqueci a password". Receberás um código de 4 dígitos no teu email para redefinir a password.</p>
            </div>
            <div>
              <p className="font-semibold text-navy">Posso usar a mesma sessão em duas turmas?</p>
              <p className="text-muted-foreground mt-1">Não. Cada sessão é única. Para usar o mesmo quiz em outra turma, lança uma nova sessão a partir do mesmo quiz.</p>
            </div>
            <div>
              <p className="font-semibold text-navy">Como acede o coordenador do projeto aos dados?</p>
              <p className="text-muted-foreground mt-1">O coordenador tem acesso a um painel separado com indicadores agregados por escola, disciplina e período. Não tem acesso aos relatórios individuais das sessões.</p>
            </div>
          </div>
        </Accordion>

        {/* Rodapé */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>Aula Viva · Projeto PesqueirAmiga · Master HBM Research, LDA</p>
          <p className="mt-1">Para suporte técnico, contacta o coordenador do projeto.</p>
        </div>
      </div>
    </div>
  );
}
