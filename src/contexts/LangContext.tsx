import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "pt" | "es";

const translations = {
  pt: {
    // Nav
    nav_home: "Início",
    nav_rooms: "Quartos",
    nav_hall: "Salão de Festas",
    nav_pool: "Piscina",
    nav_promos: "Promoções",
    nav_gallery: "Galeria",
    nav_contact: "Contato",
    nav_enter: "Entrar",
    // Hero
    hero_location: "Butiá · Rio Grande do Sul",
    hero_tagline: "Sleep Better",
    hero_desc: "Experiência premium em hospedagem. Conforto, elegância e sofisticação em cada detalhe.",
    hero_see_rooms: "Ver Quartos",
    hero_contact: "Fale Conosco",
    hero_checkin: "Check-in",
    hero_checkout: "Check-out",
    hero_guests: "Hóspedes",
    hero_guest: "hóspede",
    hero_guests_plural: "hóspedes",
    hero_search: "Buscar Quartos Disponíveis",
    hero_availability: "Verificar Disponibilidade",
    hero_rooms_stat: "Quartos",
    hero_rating_stat: "Avaliação",
    hero_premium_stat: "Premium",
    // Highlights
    highlights_title: "Conheça o",
    highlights_subtitle: "Nossos Espaços",
    room_title: "Quartos Premium",
    room_desc: "Suítes elegantes com todo o conforto que você merece. Design sofisticado e amenidades exclusivas.",
    room_cta: "Conhecer Quartos",
    hall_title: "Salão de Festas",
    hall_desc: "Espaço luxuoso para eventos inesquecíveis. Capacidade e infraestrutura completa para sua celebração.",
    hall_cta: "Ver Salão",
    pool_title: "Piscina",
    pool_desc: "Área de lazer premium com piscina e espaço de relaxamento. Momentos únicos de tranquilidade.",
    pool_cta: "Ver Piscina",
    // Quartos
    rooms_page_title: "Nossos",
    rooms_page_highlight: "Quartos",
    rooms_loading: "Carregando quartos...",
    rooms_empty: "Nenhum quarto disponível no momento.",
    rooms_people: "pessoas",
    rooms_per_night: "/noite",
    rooms_see_details: "Ver Detalhes",
    rooms_accommodations: "Acomodações",
    // CTA
    cta_title: "Pronto para sua",
    cta_highlight: "experiência",
    cta_desc: "Cadastre-se e tenha acesso exclusivo às melhores ofertas do SB Hotel.",
    cta_register: "Criar Conta",
    cta_login: "Já tenho conta",
    // Auth
    login_title: "Entrar",
    login_email: "E-mail",
    login_password: "Senha",
    login_submit: "Entrar",
    login_no_account: "Não tem conta?",
    login_register: "Cadastre-se",
    register_title: "Criar Conta",
    register_name: "Nome completo",
    register_submit: "Criar Conta",
    register_has_account: "Já tem conta?",
    register_login: "Entrar",
    // Quarto detalhe
    room_people: "pessoas",
    room_nights: "diária",
    room_nights_plural: "diárias",
    room_amenities: "Comodidades",
    room_reserve: "Fazer Reserva",
    room_check_avail: "Ver Disponibilidade",
    room_book: "Reservar",
    room_booking: "Reservando...",
    room_checking: "Verificando...",
    room_available: "Quarto disponível!",
    room_unavailable: "Quarto indisponível para estas datas.",
    room_login_required: "Faça login para reservar.",
    room_breadcrumb: "Quartos",
  },
  es: {
    // Nav
    nav_home: "Inicio",
    nav_rooms: "Habitaciones",
    nav_hall: "Salón de Fiestas",
    nav_pool: "Piscina",
    nav_promos: "Promociones",
    nav_gallery: "Galería",
    nav_contact: "Contacto",
    nav_enter: "Ingresar",
    // Hero
    hero_location: "Butiá · Río Grande do Sul · Brasil",
    hero_tagline: "Sleep Better",
    hero_desc: "Experiencia premium en hospedaje. Comodidad, elegancia y sofisticación en cada detalle.",
    hero_see_rooms: "Ver Habitaciones",
    hero_contact: "Contáctenos",
    hero_checkin: "Entrada",
    hero_checkout: "Salida",
    hero_guests: "Huéspedes",
    hero_guest: "huésped",
    hero_guests_plural: "huéspedes",
    hero_search: "Buscar Habitaciones Disponibles",
    hero_availability: "Verificar Disponibilidad",
    hero_rooms_stat: "Habitaciones",
    hero_rating_stat: "Calificación",
    hero_premium_stat: "Premium",
    // Highlights
    highlights_title: "Conocé el",
    highlights_subtitle: "Nuestros Espacios",
    room_title: "Habitaciones Premium",
    room_desc: "Suites elegantes con toda la comodidad que merecés. Diseño sofisticado y amenidades exclusivas.",
    room_cta: "Ver Habitaciones",
    hall_title: "Salón de Fiestas",
    hall_desc: "Espacio lujoso para eventos inolvidables. Capacidad e infraestructura completa para tu celebración.",
    hall_cta: "Ver Salón",
    pool_title: "Piscina",
    pool_desc: "Área de recreación premium con piscina y espacio de relajación. Momentos únicos de tranquilidad.",
    pool_cta: "Ver Piscina",
    // Quartos
    rooms_page_title: "Nuestras",
    rooms_page_highlight: "Habitaciones",
    rooms_loading: "Cargando habitaciones...",
    rooms_empty: "No hay habitaciones disponibles en este momento.",
    rooms_people: "personas",
    rooms_per_night: "/noche",
    rooms_see_details: "Ver Detalles",
    rooms_accommodations: "Alojamientos",
    // CTA
    cta_title: "¿Listo para tu",
    cta_highlight: "experiencia",
    cta_desc: "Registrate y accedé a las mejores ofertas del SB Hotel.",
    cta_register: "Crear Cuenta",
    cta_login: "Ya tengo cuenta",
    // Auth
    login_title: "Ingresar",
    login_email: "Correo electrónico",
    login_password: "Contraseña",
    login_submit: "Ingresar",
    login_no_account: "¿No tenés cuenta?",
    login_register: "Registrate",
    register_title: "Crear Cuenta",
    register_name: "Nombre completo",
    register_submit: "Crear Cuenta",
    register_has_account: "¿Ya tenés cuenta?",
    register_login: "Ingresar",
    // Quarto detalhe
    room_people: "personas",
    room_nights: "noche",
    room_nights_plural: "noches",
    room_amenities: "Comodidades",
    room_reserve: "Hacer Reserva",
    room_check_avail: "Ver Disponibilidad",
    room_book: "Reservar",
    room_booking: "Reservando...",
    room_checking: "Verificando...",
    room_available: "¡Habitación disponible!",
    room_unavailable: "Habitación no disponible para estas fechas.",
    room_login_required: "Iniciá sesión para reservar.",
    room_breadcrumb: "Habitaciones",
  },
};

type Translations = typeof translations.pt;

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof Translations) => string;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const saved = (localStorage.getItem("sb_lang") as Lang) || "pt";
  const [lang, setLangState] = useState<Lang>(saved);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("sb_lang", l);
  };

  const t = (key: keyof Translations): string =>
    translations[lang][key] || translations.pt[key] || key;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
};
