import { brand } from "@/config/brand";

/**
 * Customer-facing storefront copy (shopper / demo visitor).
 * Keep developer notes out of this file — use TEMPLATE.md instead.
 */
export const siteContent = {
  home: {
    hero: {
      eyebrow: brand.shortName,
      title: brand.name,
      subtitle: brand.tagline,
      primaryCta: { label: "Ver catálogo", href: "/products" },
      secondaryCta: { label: "Conócenos", href: "/about" },
      slides: [
        {
          id: "drop",
          kicker: "Nueva temporada",
          title: "Diseños que se notan",
          text: "Piezas cómodas, con carácter, listas para usar todos los días.",
          href: "/products",
          tone: "dark" as const,
        },
        {
          id: "collections",
          kicker: "Colecciones",
          title: "Encuentra tu estilo",
          text: "Explora por colección y elige lo que mejor va contigo.",
          href: "/products",
          tone: "warm" as const,
        },
        {
          id: "custom",
          kicker: "Personalización",
          title: "También a tu medida",
          text: "¿Quieres cambiar un diseño o armar uno propio? Lo vemos juntos.",
          href: "/contact",
          tone: "cool" as const,
        },
      ],
    },
    featured: {
      title: "Lo más reciente",
      subtitle: "Lo último que sumamos al catálogo.",
      cta: { label: "Ver tienda", href: "/products" },
    },
    value: {
      title: "Hecho para quienes quieren verse bien sin complicarse",
      points: [
        { title: "Calidad diaria", text: "Materiales cómodos pensados para usarlos de verdad." },
        { title: "Diseños propios", text: "Estampados y cortes con identidad, no genéricos." },
        { title: "Envíos a todo el país", text: "Recibe tu pedido donde estés." },
        { title: "Compra segura", text: "Pago y seguimiento claros de punta a punta." },
      ],
    },
    collections: {
      title: "Explora por colección",
      subtitle: "Elige una línea y entra directo a lo que te gusta.",
      empty: "Pronto publicaremos nuevas colecciones.",
    },
    finalCta: {
      title: "¿Listo para elegir tu prenda?",
      subtitle: `Descubre el catálogo de ${brand.name}.`,
      cta: { label: "Explorar productos", href: "/products" },
    },
  },
  about: {
    eyebrow: "Quiénes somos",
    title: brand.name,
    lead: "Hacemos ropa con diseños propios para que lleves algo que de verdad te guste, sin dar tantas vueltas.",
    storyEyebrow: "Nuestra historia",
    storyTitle: "Todo empezó con una pregunta simple",
    story: [
      "¿Por qué es tan difícil encontrar prendas con personalidad y buena calidad? Quisimos resolver eso: ropa cómoda, con estilo propio y atención cercana.",
      `Así nació ${brand.name}. Hoy puedes elegir un diseño del catálogo o pedirnos que lo personalicemos contigo.`,
    ],
    storyAsideEyebrow: "Desde el día uno",
    storyAsideTitle: "Diseño · Calidad · Atención real",
    pillarsEyebrow: "Lo que nos importa",
    pillarsTitle: "Tres cosas que siempre cuidamos",
    pillars: [
      {
        title: "Buena calidad",
        text: "Materiales cómodos y acabados pensados para uso diario real.",
      },
      {
        title: "Diseños propios",
        text: "Cada colección tiene su propio estilo. Nada genérico de catálogo masivo.",
      },
      {
        title: "Lo adaptamos contigo",
        text: "¿Te gusta un diseño pero quieres cambiar algo? Escríbenos y lo vemos juntos.",
      },
    ],
    ctaTitle: "¿Quieres ver los diseños?",
    ctaText: "Mira el catálogo o escríbenos si quieres armar algo a tu gusto.",
  },
  faq: {
    eyebrow: "Ayuda",
    title: "Preguntas frecuentes",
    lead: "Respuestas claras a lo que más nos preguntan. Si no encuentras lo tuyo, escríbenos.",
    items: [
      {
        id: 1,
        question: "¿De qué material son las prendas?",
        answer:
          "Trabajamos con telas cómodas y duraderas, pensadas para el uso diario. En cada ficha de producto encuentras el detalle del material y del estampado.",
      },
      {
        id: 2,
        question: "¿Cuánto demora la entrega?",
        answer:
          "En ciudad suele tardar de 2 a 3 días hábiles. A provincias, de 5 a 7 días hábiles según el courier. Si tienes prisa, escríbenos y vemos qué se puede hacer.",
      },
      {
        id: 3,
        question: "¿Envían a provincias?",
        answer:
          "Sí, enviamos a todo el país. El costo depende de tu ciudad y aparece en el checkout o te lo confirmamos por WhatsApp.",
      },
      {
        id: 4,
        question: "¿Puedo personalizar un diseño?",
        answer:
          "Claro. Puedes mandarnos tu idea, logo o frase por WhatsApp y lo armamos contigo. También puedes elegir un diseño del catálogo y pedir cambios.",
      },
      {
        id: 5,
        question: "¿Hacen pedidos al por mayor?",
        answer:
          "Sí. A partir de cierta cantidad hay precios especiales. Escríbenos con lo que necesitas y te pasamos una cotización sin compromiso.",
      },
      {
        id: 6,
        question: "¿Cómo sé qué talla pedir?",
        answer:
          "En cada producto verás las tallas disponibles. Si tienes duda, mándanos tus medidas por WhatsApp y te ayudamos a elegir.",
      },
      {
        id: 7,
        question: "¿Qué pasa si llega algo mal?",
        answer:
          "Avísanos dentro de las primeras 48 horas con fotos y lo solucionamos: cambio o devolución según el caso. Queremos que quedes contento.",
      },
      {
        id: 8,
        question: "¿Tienen tienda física?",
        answer:
          "Por ahora vendemos solo online. Así mantenemos mejores precios. Te atendemos por WhatsApp, Instagram y correo.",
      },
    ],
  },
  contact: {
    eyebrow: "Contacto",
    title: "Hablemos",
    lead: "Escríbenos por el canal que prefieras. Estamos listos para ayudarte con pedidos, tallas y personalizaciones.",
    channels: [
      {
        label: "WhatsApp",
        value: "Chat directo",
        hint: "La forma más rápida de hablar con nosotros",
      },
      {
        label: "Correo",
        value: brand.email,
        hint: "Te respondemos en menos de 24 horas",
        href: `mailto:${brand.email}`,
      },
      {
        label: "Soporte",
        value: brand.supportEmail,
        hint: "Pedidos, cambios y seguimiento",
        href: `mailto:${brand.supportEmail}`,
      },
    ],
  },
  catalog: {
    eyebrow: "Catálogo",
    title: "Todos los productos",
    lead: "Filtra por categoría, colección, color o talla y encuentra tu próxima prenda.",
  },
  footer: {
    blurb: brand.tagline,
    shopTitle: "Tienda",
    helpTitle: "Ayuda",
    talkTitle: "Hablemos",
    bottomNote: "Diseños exclusivos para quienes valoran su estilo.",
  },
} as const;

export type SiteContent = typeof siteContent;
