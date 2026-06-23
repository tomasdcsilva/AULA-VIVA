import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Limpar perguntas existentes não validadas e adicionar novas
const questions = [
  // ── ESTEREÓTIPOS DE GÉNERO ──
  {
    text: "Concordas com a afirmação: «As raparigas são naturalmente mais organizadas e os rapazes mais desportivos»?",
    type: "scale", category: "stereotypes", sensitivityLevel: "low", educationLevel: "2nd_cycle",
    options: JSON.stringify(["1 – Discordo totalmente","2","3","4","5 – Concordo totalmente"]),
    correctOption: null, isValidated: true, isApproved: true,
  },
  {
    text: "Descreve uma situação em que sentiste que te trataram de forma diferente por seres rapaz ou rapariga.",
    type: "open", category: "stereotypes", sensitivityLevel: "medium", educationLevel: "2nd_cycle",
    options: null, correctOption: null, isValidated: true, isApproved: true,
  },
  {
    text: "Qual destas afirmações descreve melhor um estereótipo de género?",
    type: "multiple_choice", category: "stereotypes", sensitivityLevel: "low", educationLevel: "3rd_cycle",
    options: JSON.stringify(["Uma característica que varia de pessoa para pessoa","Uma ideia generalizada sobre como rapazes ou raparigas devem ser","Uma lei que define o comportamento de cada género","Uma preferência pessoal"]),
    correctOption: 1, isValidated: true, isApproved: true,
  },
  {
    text: "Os estereótipos de género podem limitar as escolhas profissionais das pessoas. Concordas?",
    type: "scale", category: "stereotypes", sensitivityLevel: "low", educationLevel: "secondary",
    options: JSON.stringify(["1 – Discordo totalmente","2","3","4","5 – Concordo totalmente"]),
    correctOption: null, isValidated: true, isApproved: true,
  },
  // ── CONTROLO ──
  {
    text: "O teu namorado/a namorada pede-te para não saíres com amigos sem ele/ela. Isso é...",
    type: "multiple_choice", category: "control", sensitivityLevel: "medium", educationLevel: "3rd_cycle",
    options: JSON.stringify(["Ciúme normal","Um sinal de amor e preocupação","Um comportamento de controlo preocupante","Algo que depende da situação"]),
    correctOption: 2, isValidated: true, isApproved: true,
  },
  {
    text: "Verificar constantemente o telemóvel do/a parceiro/a é uma forma de controlo?",
    type: "multiple_choice", category: "control", sensitivityLevel: "medium", educationLevel: "3rd_cycle",
    options: JSON.stringify(["Sim, é uma violação da privacidade","Não, é apenas curiosidade","Só se a outra pessoa não souber","Depende da frequência"]),
    correctOption: 0, isValidated: true, isApproved: true,
  },
  {
    text: "Numa relação, é aceitável que uma pessoa decida com quem a outra pode ou não pode falar?",
    type: "scale", category: "control", sensitivityLevel: "medium", educationLevel: "secondary",
    options: JSON.stringify(["1 – Nunca aceitável","2","3","4","5 – Sempre aceitável"]),
    correctOption: null, isValidated: true, isApproved: true,
  },
  // ── CONSENTIMENTO ──
  {
    text: "O que significa consentimento numa relação?",
    type: "multiple_choice", category: "consent", sensitivityLevel: "medium", educationLevel: "3rd_cycle",
    options: JSON.stringify(["Dizer sim uma vez para sempre","Concordar livremente, de forma clara e a qualquer momento reversível","Não dizer não","Aceitar porque a outra pessoa insiste"]),
    correctOption: 1, isValidated: true, isApproved: true,
  },
  {
    text: "Se alguém disse sim antes, isso significa que consente sempre no futuro?",
    type: "multiple_choice", category: "consent", sensitivityLevel: "high", educationLevel: "secondary",
    options: JSON.stringify(["Sim, o consentimento é permanente","Não, o consentimento pode ser retirado a qualquer momento","Depende do tipo de relação","Sim, se for numa relação estável"]),
    correctOption: 1, isValidated: true, isApproved: true,
  },
  {
    text: "Concordas que o consentimento deve ser explícito e não apenas assumido?",
    type: "scale", category: "consent", sensitivityLevel: "medium", educationLevel: "3rd_cycle",
    options: JSON.stringify(["1 – Discordo totalmente","2","3","4","5 – Concordo totalmente"]),
    correctOption: null, isValidated: true, isApproved: true,
  },
  // ── VIOLÊNCIA PSICOLÓGICA ──
  {
    text: "Qual destes comportamentos é um exemplo de violência psicológica?",
    type: "multiple_choice", category: "psychological_violence", sensitivityLevel: "high", educationLevel: "3rd_cycle",
    options: JSON.stringify(["Discutir sobre onde jantar","Ignorar sistematicamente a opinião da outra pessoa","Ter opiniões diferentes","Preferir estar sozinho/a às vezes"]),
    correctOption: 1, isValidated: true, isApproved: true,
  },
  {
    text: "Humilhar alguém em público, mesmo que a seguir peça desculpa, é aceitável?",
    type: "multiple_choice", category: "psychological_violence", sensitivityLevel: "high", educationLevel: "secondary",
    options: JSON.stringify(["Sim, se pedir desculpa depois","Não, é sempre uma forma de violência","Depende do contexto","Só se acontecer muitas vezes"]),
    correctOption: 1, isValidated: true, isApproved: true,
  },
  // ── RELAÇÕES SAUDÁVEIS ──
  {
    text: "Numa relação saudável, é normal que cada pessoa mantenha amizades e interesses próprios?",
    type: "multiple_choice", category: "healthy_relationships", sensitivityLevel: "low", educationLevel: "2nd_cycle",
    options: JSON.stringify(["Sim, a autonomia é saudável","Não, o casal deve partilhar tudo","Depende do tempo de relação","Só se o parceiro concordar"]),
    correctOption: 0, isValidated: true, isApproved: true,
  },
  {
    text: "Concordas com a afirmação: «Numa relação saudável, ambas as pessoas se sentem livres para dizer não»?",
    type: "scale", category: "healthy_relationships", sensitivityLevel: "low", educationLevel: "2nd_cycle",
    options: JSON.stringify(["1 – Discordo totalmente","2","3","4","5 – Concordo totalmente"]),
    correctOption: null, isValidated: true, isApproved: true,
  },
  {
    text: "O que mudarias numa relação que não te faz sentir bem?",
    type: "open", category: "healthy_relationships", sensitivityLevel: "medium", educationLevel: "3rd_cycle",
    options: null, correctOption: null, isValidated: true, isApproved: true,
  },
  // ── CIÚME ──
  {
    text: "O ciúme é sempre um sinal de amor?",
    type: "multiple_choice", category: "jealousy", sensitivityLevel: "medium", educationLevel: "3rd_cycle",
    options: JSON.stringify(["Sim, significa que a pessoa se importa","Não, pode ser um sinal de insegurança ou controlo","Depende da intensidade","Sim, é completamente normal"]),
    correctOption: 1, isValidated: true, isApproved: true,
  },
  {
    text: "Sentes ciúme quando o/a teu/tua parceiro/a fala com outras pessoas?",
    type: "scale", category: "jealousy", sensitivityLevel: "medium", educationLevel: "3rd_cycle",
    options: JSON.stringify(["1 – Nunca","2","3","4","5 – Sempre"]),
    correctOption: null, isValidated: true, isApproved: true,
  },
  {
    text: "Qual a diferença entre ciúme saudável e ciúme tóxico?",
    type: "open", category: "jealousy", sensitivityLevel: "medium", educationLevel: "secondary",
    options: null, correctOption: null, isValidated: true, isApproved: true,
  },
  // ── PRESSÃO DO GRUPO ──
  {
    text: "Os teus amigos pressionam-te a fazer algo que não queres. O que fazes?",
    type: "multiple_choice", category: "peer_pressure", sensitivityLevel: "medium", educationLevel: "2nd_cycle",
    options: JSON.stringify(["Faço para não ser excluído/a","Digo que não e explico o porquê","Finjo que concordo","Ignoro e mudo de assunto"]),
    correctOption: 1, isValidated: true, isApproved: true,
  },
  {
    text: "A pressão do grupo pode influenciar as decisões numa relação amorosa?",
    type: "scale", category: "peer_pressure", sensitivityLevel: "medium", educationLevel: "3rd_cycle",
    options: JSON.stringify(["1 – Nunca","2","3","4","5 – Sempre"]),
    correctOption: null, isValidated: true, isApproved: true,
  },
  // ── REDES SOCIAIS ──
  {
    text: "Partilhar fotografias do/a parceiro/a sem o seu consentimento nas redes sociais é...",
    type: "multiple_choice", category: "social_media", sensitivityLevel: "medium", educationLevel: "3rd_cycle",
    options: JSON.stringify(["Normal entre namorados","Uma violação da privacidade","Aceitável se a relação for boa","Só problemático se as fotos forem íntimas"]),
    correctOption: 1, isValidated: true, isApproved: true,
  },
  {
    text: "As redes sociais podem criar expectativas irrealistas sobre como deve ser uma relação?",
    type: "scale", category: "social_media", sensitivityLevel: "low", educationLevel: "secondary",
    options: JSON.stringify(["1 – Discordo totalmente","2","3","4","5 – Concordo totalmente"]),
    correctOption: null, isValidated: true, isApproved: true,
  },
  {
    text: "Exigir que o/a parceiro/a partilhe as passwords das redes sociais é uma forma de controlo?",
    type: "multiple_choice", category: "social_media", sensitivityLevel: "high", educationLevel: "secondary",
    options: JSON.stringify(["Sim, é uma invasão de privacidade","Não, é transparência","Depende da confiança","Só se a pessoa não quiser"]),
    correctOption: 0, isValidated: true, isApproved: true,
  },
  // ── MASCULINIDADES ──
  {
    text: "A frase «os rapazes não choram» é um exemplo de...",
    type: "multiple_choice", category: "masculinities", sensitivityLevel: "low", educationLevel: "2nd_cycle",
    options: JSON.stringify(["Uma verdade biológica","Um estereótipo de género prejudicial","Um conselho útil","Uma regra social necessária"]),
    correctOption: 1, isValidated: true, isApproved: true,
  },
  {
    text: "Os rapazes sentem a mesma pressão social que as raparigas em relação à aparência e comportamento?",
    type: "scale", category: "masculinities", sensitivityLevel: "medium", educationLevel: "3rd_cycle",
    options: JSON.stringify(["1 – Discordo totalmente","2","3","4","5 – Concordo totalmente"]),
    correctOption: null, isValidated: true, isApproved: true,
  },
  {
    text: "O que significa para ti ser um homem ou uma mulher hoje em dia?",
    type: "open", category: "masculinities", sensitivityLevel: "medium", educationLevel: "secondary",
    options: null, correctOption: null, isValidated: true, isApproved: true,
  },
  // ── DEPENDÊNCIA EMOCIONAL ──
  {
    text: "Sentires que não consegues viver sem o/a teu/tua parceiro/a é um sinal de...",
    type: "multiple_choice", category: "emotional_dependency", sensitivityLevel: "high", educationLevel: "secondary",
    options: JSON.stringify(["Amor verdadeiro","Dependência emocional que pode ser problemática","Uma relação muito forte","Algo completamente normal"]),
    correctOption: 1, isValidated: true, isApproved: true,
  },
  {
    text: "Numa relação saudável, cada pessoa deve manter a sua identidade e autonomia?",
    type: "scale", category: "emotional_dependency", sensitivityLevel: "medium", educationLevel: "3rd_cycle",
    options: JSON.stringify(["1 – Discordo totalmente","2","3","4","5 – Concordo totalmente"]),
    correctOption: null, isValidated: true, isApproved: true,
  },
];

console.log(`A inserir ${questions.length} perguntas...`);

for (const q of questions) {
  await conn.execute(
    `INSERT INTO questions (text, type, category, sensitivityLevel, educationLevel, options, correctOption, isValidated, isApproved, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE text=text`,
    [q.text, q.type, q.category, q.sensitivityLevel, q.educationLevel, q.options, q.correctOption, q.isValidated, q.isApproved]
  );
}

console.log("✓ Seed completo!");
await conn.end();
