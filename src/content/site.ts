type ProcessStep = {
  title: string;
  description: string;
  icon: string;
};

type AuthorityCard = {
  title: string;
  description: string;
};

type Benefit = {
  title: string;
  description: string;
  icon: string;
};

type FAQItem = {
  question: string;
  answer: string;
};

type Testimonial = {
  quote: string;
  author: string;
  location: string;
};

export const siteMeta = {
  title: "ConCasa | Recupera tu Subcuenta de Vivienda",
  description:
    "Recuperamos tu Subcuenta de Vivienda del Infonavit sin pagos por adelantado. Asesoría premium, proceso transparente y depósito directo a tu cuenta.",
  url: "https://concasa.mx",
};

export const companyInfo = {
  name: "ConCasa Soluciones Inmobiliarias",
  headline: "Especialistas en recuperar tu Subcuenta de Vivienda",
  phone: "+52 81 1234 5678",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5218112345678",
  email: "asesoria@concasa.mx",
  address: {
    streetAddress: "Av. Lázaro Cárdenas 2400",
    addressLocality: "Monterrey",
    addressRegion: "Nuevo León",
    postalCode: "66260",
    addressCountry: "MX",
  },
  geo: {
    latitude: 25.6516,
    longitude: -100.289,
  },
};

export const heroCopy = {
  title: "Recupera tu Subcuenta de Vivienda en Efectivo",
  subtitle:
    "No es un préstamo. Es tu dinero. Nosotros realizamos todo el trámite por ti.",
  bullets: [
    "Asesoría gratuita",
    "Proceso rápido y seguro",
    "Sin pagos por adelantado",
    "Solo pagas si recuperas tu dinero",
  ],
  heroImage:
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
};

export const subaccountExplainer = {
  title: "¿Qué es la Subcuenta de Vivienda?",
  description:
    "La Subcuenta de Vivienda es un ahorro que se genera mientras trabajas en una empresa registrada ante el IMSS. Tu patrón y tú aportaban dinero cada bimestre a esta cuenta del Infonavit. Si nunca lo usaste o dejaste de cotizar, es muy probable que tengas un monto disponible para recuperar en efectivo.",
  highlight:
    "Miles de personas no saben que tienen dinero guardado. Nosotros te ayudamos a obtenerlo.",
};

export const eligibilityChecklist = [
  "Dejaste de cotizar en el IMSS",
  "Te dieron de baja hace meses o años",
  "Estás pensionado o jubilado",
  "Tienes saldo sin usar de trabajos anteriores",
  "Eres beneficiario de un familiar fallecido",
  "Nunca utilizaste tu crédito Infonavit",
];

export const benefits: Benefit[] = [
  {
    title: "Depósito directo",
    description: "Recibe tu dinero en tu cuenta bancaria sin intermediarios.",
    icon: "💼",
  },
  {
    title: "Tu historial se mantiene limpio",
    description: "No es un préstamo ni te endeudas. Es tu ahorro.",
    icon: "🧾",
  },
  {
    title: "Trámite 100% seguro",
    description: "Validamos cada paso con transparencia y respaldo legal.",
    icon: "🔒",
  },
  {
    title: "Revisión gratuita",
    description: "Analizamos tu caso sin costo y sin compromiso.",
    icon: "🔍",
  },
  {
    title: "Acompañamiento completo",
    description: "Un especialista te guía desde la consulta hasta la entrega.",
    icon: "🤝",
  },
  {
    title: "Resultados rápidos",
    description: "Priorizamos tiempos cortos para que uses tu dinero ya.",
    icon: "⚡️",
  },
];

export const authorityCards: AuthorityCard[] = [
  {
    title: "Experiencia real",
    description:
      "Más de 850 usuarios atendidos en Monterrey y todo México con recuperaciones exitosas.",
  },
  {
    title: "Proceso transparente",
    description: "Sin letra chiquita, sin costos ocultos y con reportes claros.",
  },
  {
    title: "Asesoría personalizada",
    description:
      "Un especialista responde tus dudas y te acompaña en cada paso.",
  },
  {
    title: "Pagas solo si recuperas",
    description:
      "Honramos la promesa: no cobramos anticipos, solo una vez que recibes tu dinero.",
  },
];

export const processSteps: ProcessStep[] = [
  {
    title: "Envíanos tus datos",
    description: "Completa el formulario y dinos desde qué CTA llegaste.",
    icon: "1",
  },
  {
    title: "Validamos tu caso",
    description: "Revisamos tu historial Infonavit sin costo.",
    icon: "2",
  },
  {
    title: "Cuánto puedes recuperar",
    description: "Te entregamos un estimado claro y documentado.",
    icon: "3",
  },
  {
    title: "Iniciamos el trámite",
    description: "Preparamos toda la gestión legal y administrativa.",
    icon: "4",
  },
  {
    title: "Recibes tu dinero",
    description: "Depósito directo a tu cuenta bancaria.",
    icon: "5",
  },
];

export const faqItems: FAQItem[] = [
  {
    question: "¿Es un préstamo?",
    answer:
      "No. Recuperamos el ahorro que ya generaste en tu Subcuenta de Vivienda del Infonavit. No te endeudas ni afecta tu buró.",
  },
  {
    question: "¿Cuánto dinero puedo recuperar?",
    answer:
      "Depende del tiempo que cotizaste y de las aportaciones acumuladas. Validamos tu saldo y te damos una estimación antes de avanzar.",
  },
  {
    question: "¿Qué necesito para iniciar?",
    answer:
      "Solo tu nombre completo, número de afiliación al IMSS, fecha de nacimiento y un medio de contacto para confirmar tu identidad.",
  },
  {
    question: "¿Cuánto tarda el proceso?",
    answer:
      "El análisis inicial toma 1-2 días hábiles. El trámite completo varía entre 3 y 6 semanas según la respuesta del Infonavit.",
  },
  {
    question: "¿A dónde llega el dinero?",
    answer:
      "Directamente a tu cuenta bancaria indicada al aprobar el proceso. Nadie más puede retirarlo.",
  },
  {
    question: "¿Qué pasa si estoy activo en el IMSS?",
    answer:
      "Si sigues cotizando puedes revisar tu saldo, pero la recuperación en efectivo aplica cuando dejas de cotizar o te pensionas.",
  },
  {
    question: "¿Qué pasa si ya usé crédito Infonavit?",
    answer:
      "Podemos revisar si quedó remanente. Si ya se aplicó todo tu saldo, te lo informamos sin costo.",
  },
  {
    question: "¿Esto afecta un futuro crédito Infonavit?",
    answer:
      "No. Recuperar la Subcuenta de Vivienda disponible no te impide solicitar futuros créditos si vuelves a cotizar.",
  },
  {
    question: "¿Cuánto cobra ConCasa?",
    answer:
      "Cobramos un honorario porcentual únicamente cuando tú recibes tu dinero. No hay anticipos.",
  },
  {
    question: "¿Qué pasa si no tengo saldo?",
    answer:
      "Te avisamos de inmediato y no pagas nada. Preferimos que tengas claridad total.",
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      "Recuperé más de $18,000 pesos sin complicaciones. Todo súper rápido.",
    author: "Ana",
    location: "Escobedo",
  },
  {
    quote: "Me explicaron todo y el trato fue muy profesional.",
    author: "Jorge",
    location: "Monterrey",
  },
  {
    quote:
      "Mi papá falleció y ellos recuperaron su saldo. Muchísimas gracias.",
    author: "Sandra",
    location: "San Nicolás",
  },
];

export const defaultWhatsappMessage =
  "Hola, quiero conversar con un asesor de ConCasa.";

