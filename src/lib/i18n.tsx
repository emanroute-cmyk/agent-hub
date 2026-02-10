import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Language = "en" | "fr" | "ar" | "es";

export const LANGUAGES: { code: Language; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "es", label: "Español", dir: "ltr" },
];

const translations: Record<Language, Record<string, string>> = {
  en: {
    "nav.agents": "Agents",
    "nav.admin": "Admin",
    "app.title": "Agent Portal",
    "app.subtitle": "AI Command Center",
    "agents.title": "Your Agents",
    "agents.subtitle": "Select a specialist to start a conversation",
    "agents.search": "Search agents...",
    "agents.noResults": "No agents found matching",
    "agents.online": "Online",
    "agents.offline": "Offline",
    "agents.maintenance": "Maintenance",
    "admin.title": "Admin Panel",
    "admin.subtitle": "Manage agents, endpoints, and access control",
    "admin.newAgent": "New Agent",
    "admin.editAgent": "Edit Agent",
    "admin.createAgent": "Create New Agent",
    "admin.name": "Name",
    "admin.category": "Category",
    "admin.endpoint": "Endpoint URL",
    "admin.description": "Description",
    "admin.icon": "Icon",
    "admin.status": "Status",
    "admin.actions": "Actions",
    "admin.agent": "Agent",
    "admin.save": "Update",
    "admin.create": "Create",
    "admin.cancel": "Cancel",
    "admin.agentUpdated": "Agent updated",
    "admin.agentCreated": "Agent created",
    "admin.agentDeleted": "Agent deleted",
    "admin.missingFields": "Missing fields",
    "admin.missingFieldsDesc": "Name and endpoint are required.",
    "admin.namePlaceholder": "Agent name",
    "admin.categoryPlaceholder": "e.g. Analytics",
    "admin.endpointPlaceholder": "https://api.example.com/agents/...",
    "admin.descriptionPlaceholder": "What does this agent do?",
    "chat.placeholder": "Type your message...",
    "chat.welcome": "Hello! I'm **{name}**. How can I assist you today?",
    "chat.simulated": 'I\'ve received your query: "{query}". This is a simulated response. Connect a real endpoint in the Admin panel to get live responses from this agent.',
    "notfound.title": "404",
    "notfound.text": "Oops! Page not found",
    "notfound.link": "Return to Home",
    "settings.theme": "Theme",
    "settings.language": "Language",
    "user.name": "User",
    "user.email": "user@company.com",
  },
  fr: {
    "nav.agents": "Agents",
    "nav.admin": "Admin",
    "app.title": "Portail Agent",
    "app.subtitle": "Centre de Commande IA",
    "agents.title": "Vos Agents",
    "agents.subtitle": "Sélectionnez un spécialiste pour démarrer une conversation",
    "agents.search": "Rechercher des agents...",
    "agents.noResults": "Aucun agent trouvé correspondant à",
    "agents.online": "En ligne",
    "agents.offline": "Hors ligne",
    "agents.maintenance": "Maintenance",
    "admin.title": "Panneau Admin",
    "admin.subtitle": "Gérer les agents, endpoints et contrôle d'accès",
    "admin.newAgent": "Nouvel Agent",
    "admin.editAgent": "Modifier l'Agent",
    "admin.createAgent": "Créer un Nouvel Agent",
    "admin.name": "Nom",
    "admin.category": "Catégorie",
    "admin.endpoint": "URL de l'Endpoint",
    "admin.description": "Description",
    "admin.icon": "Icône",
    "admin.status": "Statut",
    "admin.actions": "Actions",
    "admin.agent": "Agent",
    "admin.save": "Mettre à jour",
    "admin.create": "Créer",
    "admin.cancel": "Annuler",
    "admin.agentUpdated": "Agent mis à jour",
    "admin.agentCreated": "Agent créé",
    "admin.agentDeleted": "Agent supprimé",
    "admin.missingFields": "Champs manquants",
    "admin.missingFieldsDesc": "Le nom et l'endpoint sont requis.",
    "admin.namePlaceholder": "Nom de l'agent",
    "admin.categoryPlaceholder": "ex. Analytique",
    "admin.endpointPlaceholder": "https://api.example.com/agents/...",
    "admin.descriptionPlaceholder": "Que fait cet agent ?",
    "chat.placeholder": "Tapez votre message...",
    "chat.welcome": "Bonjour ! Je suis **{name}**. Comment puis-je vous aider aujourd'hui ?",
    "chat.simulated": 'J\'ai reçu votre requête : "{query}". Ceci est une réponse simulée. Connectez un vrai endpoint dans le panneau Admin pour obtenir des réponses en direct.',
    "notfound.title": "404",
    "notfound.text": "Oops ! Page non trouvée",
    "notfound.link": "Retour à l'Accueil",
    "settings.theme": "Thème",
    "settings.language": "Langue",
    "user.name": "Utilisateur",
    "user.email": "utilisateur@entreprise.com",
  },
  ar: {
    "nav.agents": "الوكلاء",
    "nav.admin": "الإدارة",
    "app.title": "بوابة الوكيل",
    "app.subtitle": "مركز قيادة الذكاء الاصطناعي",
    "agents.title": "وكلاؤك",
    "agents.subtitle": "اختر متخصصًا لبدء محادثة",
    "agents.search": "البحث عن وكلاء...",
    "agents.noResults": "لم يتم العثور على وكلاء مطابقين",
    "agents.online": "متصل",
    "agents.offline": "غير متصل",
    "agents.maintenance": "صيانة",
    "admin.title": "لوحة الإدارة",
    "admin.subtitle": "إدارة الوكلاء ونقاط النهاية والتحكم في الوصول",
    "admin.newAgent": "وكيل جديد",
    "admin.editAgent": "تعديل الوكيل",
    "admin.createAgent": "إنشاء وكيل جديد",
    "admin.name": "الاسم",
    "admin.category": "الفئة",
    "admin.endpoint": "رابط نقطة النهاية",
    "admin.description": "الوصف",
    "admin.icon": "الأيقونة",
    "admin.status": "الحالة",
    "admin.actions": "الإجراءات",
    "admin.agent": "الوكيل",
    "admin.save": "تحديث",
    "admin.create": "إنشاء",
    "admin.cancel": "إلغاء",
    "admin.agentUpdated": "تم تحديث الوكيل",
    "admin.agentCreated": "تم إنشاء الوكيل",
    "admin.agentDeleted": "تم حذف الوكيل",
    "admin.missingFields": "حقول مفقودة",
    "admin.missingFieldsDesc": "الاسم ونقطة النهاية مطلوبان.",
    "admin.namePlaceholder": "اسم الوكيل",
    "admin.categoryPlaceholder": "مثال: التحليلات",
    "admin.endpointPlaceholder": "https://api.example.com/agents/...",
    "admin.descriptionPlaceholder": "ماذا يفعل هذا الوكيل؟",
    "chat.placeholder": "اكتب رسالتك...",
    "chat.welcome": "مرحبًا! أنا **{name}**. كيف يمكنني مساعدتك اليوم؟",
    "chat.simulated": 'لقد تلقيت استفسارك: "{query}". هذا رد محاكاة. قم بتوصيل نقطة نهاية حقيقية في لوحة الإدارة للحصول على ردود مباشرة.',
    "notfound.title": "404",
    "notfound.text": "عفوًا! الصفحة غير موجودة",
    "notfound.link": "العودة إلى الرئيسية",
    "settings.theme": "المظهر",
    "settings.language": "اللغة",
    "user.name": "المستخدم",
    "user.email": "user@company.com",
  },
  es: {
    "nav.agents": "Agentes",
    "nav.admin": "Admin",
    "app.title": "Portal de Agentes",
    "app.subtitle": "Centro de Comando IA",
    "agents.title": "Tus Agentes",
    "agents.subtitle": "Selecciona un especialista para iniciar una conversación",
    "agents.search": "Buscar agentes...",
    "agents.noResults": "No se encontraron agentes que coincidan con",
    "agents.online": "En línea",
    "agents.offline": "Desconectado",
    "agents.maintenance": "Mantenimiento",
    "admin.title": "Panel de Admin",
    "admin.subtitle": "Gestionar agentes, endpoints y control de acceso",
    "admin.newAgent": "Nuevo Agente",
    "admin.editAgent": "Editar Agente",
    "admin.createAgent": "Crear Nuevo Agente",
    "admin.name": "Nombre",
    "admin.category": "Categoría",
    "admin.endpoint": "URL del Endpoint",
    "admin.description": "Descripción",
    "admin.icon": "Icono",
    "admin.status": "Estado",
    "admin.actions": "Acciones",
    "admin.agent": "Agente",
    "admin.save": "Actualizar",
    "admin.create": "Crear",
    "admin.cancel": "Cancelar",
    "admin.agentUpdated": "Agente actualizado",
    "admin.agentCreated": "Agente creado",
    "admin.agentDeleted": "Agente eliminado",
    "admin.missingFields": "Campos faltantes",
    "admin.missingFieldsDesc": "El nombre y el endpoint son obligatorios.",
    "admin.namePlaceholder": "Nombre del agente",
    "admin.categoryPlaceholder": "ej. Analítica",
    "admin.endpointPlaceholder": "https://api.example.com/agents/...",
    "admin.descriptionPlaceholder": "¿Qué hace este agente?",
    "chat.placeholder": "Escribe tu mensaje...",
    "chat.welcome": "¡Hola! Soy **{name}**. ¿En qué puedo ayudarte hoy?",
    "chat.simulated": 'He recibido tu consulta: "{query}". Esta es una respuesta simulada. Conecta un endpoint real en el panel Admin para obtener respuestas en vivo.',
    "notfound.title": "404",
    "notfound.text": "¡Ups! Página no encontrada",
    "notfound.link": "Volver al Inicio",
    "settings.theme": "Tema",
    "settings.language": "Idioma",
    "user.name": "Usuario",
    "user.email": "usuario@empresa.com",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
  dir: "ltr",
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("app-language");
    return (stored as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
    const langConfig = LANGUAGES.find((l) => l.code === lang);
    document.documentElement.dir = langConfig?.dir || "ltr";
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => {
      let value = translations[language]?.[key] || translations.en[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, v);
        });
      }
      return value;
    },
    [language]
  );

  const dir = LANGUAGES.find((l) => l.code === language)?.dir || "ltr";

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
