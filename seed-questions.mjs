import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const questions = [
  // ── Estereótipos de Género ────────────────────────────────────────────────
  {
    text: "Achas que existem profissões que são mais adequadas para homens do que para mulheres?",
    type: "multiple_choice",
    category: "stereotypes",
    sensitivityLevel: "low",
    options: JSON.stringify(["Sim, claramente", "Talvez algumas", "Não, depende da pessoa", "Nunca pensei nisso"]),
    isValidated: true,
  },
  {
    text: "Quando um rapaz chora em público, o que achas que os outros pensam?",
    type: "multiple_choice",
    category: "stereotypes",
    sensitivityLevel: "low",
    options: JSON.stringify(["Que é fraco", "Que é sensível e isso é normal", "Que está a exagerar", "Que é corajoso"]),
    isValidated: true,
  },
  {
    text: "Na tua opinião, quem deve tomar a iniciativa de pedir alguém em namoro?",
    type: "multiple_choice",
    category: "stereotypes",
    sensitivityLevel: "low",
    options: JSON.stringify(["O rapaz", "A rapariga", "Qualquer um dos dois", "Depende da situação"]),
    isValidated: true,
  },
  {
    text: "Concordas com a afirmação: «As raparigas são naturalmente mais organizadas e os rapazes mais desportivos»?",
    type: "scale",
    category: "stereotypes",
    sensitivityLevel: "low",
    options: JSON.stringify(["1 — Discordo totalmente", "2 — Discordo", "3 — Neutro", "4 — Concordo", "5 — Concordo totalmente"]),
    isValidated: true,
  },
  {
    text: "Descreve uma situação em que sentiste que te trataram de forma diferente por seres rapaz ou rapariga.",
    type: "open",
    category: "stereotypes",
    sensitivityLevel: "medium",
    options: null,
    isValidated: true,
  },

  // ── Controlo ──────────────────────────────────────────────────────────────
  {
    text: "O teu namorado/a namorada pede-te para não saíres com amigos sem ele/ela. Isso é...",
    type: "multiple_choice",
    category: "control",
    sensitivityLevel: "medium",
    options: JSON.stringify(["Ciúme normal, sinal de amor", "Um sinal de insegurança", "Comportamento controlador", "Depende da frequência"]),
    isValidated: true,
  },
  {
    text: "Achas que verificar o telemóvel do/da parceiro/a sem permissão é aceitável numa relação?",
    type: "multiple_choice",
    category: "control",
    sensitivityLevel: "medium",
    options: JSON.stringify(["Sim, se houver desconfiança", "Não, nunca é aceitável", "Só se os dois concordarem", "Depende da relação"]),
    isValidated: true,
  },
  {
    text: "Concordas com a afirmação: «Se o meu parceiro/a parceira se preocupa com o que visto, é porque se importa comigo»?",
    type: "scale",
    category: "control",
    sensitivityLevel: "medium",
    options: JSON.stringify(["1 — Discordo totalmente", "2 — Discordo", "3 — Neutro", "4 — Concordo", "5 — Concordo totalmente"]),
    isValidated: true,
  },
  {
    text: "O que distingue ciúme saudável de comportamento controlador numa relação?",
    type: "open",
    category: "control",
    sensitivityLevel: "medium",
    options: null,
    isValidated: true,
  },

  // ── Consentimento ─────────────────────────────────────────────────────────
  {
    text: "O consentimento numa relação íntima precisa de ser...",
    type: "multiple_choice",
    category: "consent",
    sensitivityLevel: "medium",
    options: JSON.stringify(["Dado uma vez e vale para sempre", "Explícito e dado em cada situação", "Implícito se a relação for longa", "Desnecessário entre namorados"]),
    isValidated: true,
  },
  {
    text: "Se alguém diz «não sei» ou fica em silêncio quando lhe pedem algo íntimo, isso significa...",
    type: "multiple_choice",
    category: "consent",
    sensitivityLevel: "high",
    options: JSON.stringify(["Que está a pensar e pode ser sim", "Que não deu consentimento", "Que é tímido/a", "Que é preciso insistir"]),
    isValidated: true,
  },
  {
    text: "Concordas com a afirmação: «Numa relação de namoro, o consentimento deve ser pedido sempre, mesmo para coisas pequenas»?",
    type: "scale",
    category: "consent",
    sensitivityLevel: "medium",
    options: JSON.stringify(["1 — Discordo totalmente", "2 — Discordo", "3 — Neutro", "4 — Concordo", "5 — Concordo totalmente"]),
    isValidated: true,
  },

  // ── Violência Psicológica ─────────────────────────────────────────────────
  {
    text: "Qual destas situações consideras violência psicológica?",
    type: "multiple_choice",
    category: "psychological_violence",
    sensitivityLevel: "high",
    options: JSON.stringify(["Insultar o/a parceiro/a em privado", "Ignorar o/a parceiro/a durante dias", "Ameaçar terminar a relação para obter algo", "Todas as anteriores"]),
    isValidated: true,
  },
  {
    text: "Concordas com a afirmação: «Chamar nomes feios ao/à parceiro/a quando estão zangados não é violência, é só uma discussão»?",
    type: "scale",
    category: "psychological_violence",
    sensitivityLevel: "high",
    options: JSON.stringify(["1 — Discordo totalmente", "2 — Discordo", "3 — Neutro", "4 — Concordo", "5 — Concordo totalmente"]),
    isValidated: true,
  },
  {
    text: "Já alguma vez te sentiste mal contigo mesmo/a por causa de algo que um/a namorado/a disse? Como te sentiste?",
    type: "open",
    category: "psychological_violence",
    sensitivityLevel: "high",
    options: null,
    isValidated: true,
  },

  // ── Relações Saudáveis ────────────────────────────────────────────────────
  {
    text: "Quais são, para ti, os três pilares mais importantes de uma relação saudável?",
    type: "multiple_choice",
    category: "healthy_relationships",
    sensitivityLevel: "low",
    options: JSON.stringify(["Confiança, respeito e comunicação", "Paixão, exclusividade e proteção", "Partilha de interesses e amigos", "Dependência emocional e cumplicidade"]),
    isValidated: true,
  },
  {
    text: "Numa relação saudável, é normal que cada pessoa mantenha amizades e interesses próprios?",
    type: "multiple_choice",
    category: "healthy_relationships",
    sensitivityLevel: "low",
    options: JSON.stringify(["Sim, a autonomia é essencial", "Não, o casal deve partilhar tudo", "Depende do que o casal decidir", "Só se o/a parceiro/a concordar"]),
    isValidated: true,
  },
  {
    text: "Concordas com a afirmação: «Numa relação saudável, ambas as pessoas se sentem livres para dizer não»?",
    type: "scale",
    category: "healthy_relationships",
    sensitivityLevel: "low",
    options: JSON.stringify(["1 — Discordo totalmente", "2 — Discordo", "3 — Neutro", "4 — Concordo", "5 — Concordo totalmente"]),
    isValidated: true,
  },
  {
    text: "O que mudarias numa relação que não te faz sentir bem?",
    type: "open",
    category: "healthy_relationships",
    sensitivityLevel: "medium",
    options: null,
    isValidated: true,
  },
];

// Inserir perguntas
for (const q of questions) {
  await connection.execute(
    `INSERT INTO questions (text, type, category, sensitivityLevel, options, isValidated, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE text=text`,
    [q.text, q.type, q.category, q.sensitivityLevel, q.options, q.isValidated ? 1 : 0]
  );
}

console.log(`✅ ${questions.length} perguntas inseridas no banco.`);
await connection.end();
