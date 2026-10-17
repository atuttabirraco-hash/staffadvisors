import type { Lang } from "./i18n";

type ReviewAccessCopy = { title: string; text: string };

export const reviewAccessCopy: Record<Lang, ReviewAccessCopy> = {
  it: { title: "Accedi per scrivere una recensione", text: "Senza registrazione puoi leggere e cercare aziende. Con un account gratuito puoi pubblicare recensioni, che restano anonime." },
  en: { title: "Sign in to write a review", text: "Without an account you can browse and search companies. With a free account you can post reviews, which remain anonymous." },
  es: { title: "Inicia sesion para escribir una resena", text: "Sin registrarte puedes consultar y buscar empresas. Con una cuenta gratuita puedes publicar resenas, que siguen siendo anonimas." },
  fr: { title: "Connectez-vous pour publier un avis", text: "Sans inscription, vous pouvez consulter et rechercher des entreprises. Avec un compte gratuit, vous pouvez publier des avis qui restent anonymes." },
  de: { title: "Melde dich an, um eine Bewertung zu schreiben", text: "Ohne Konto kannst du Unternehmen ansehen und suchen. Mit einem kostenlosen Konto kannst du anonyme Bewertungen veroffentlichen." },
  pt: { title: "Inicie sessao para escrever uma avaliacao", text: "Sem registo pode consultar e pesquisar empresas. Com uma conta gratuita pode publicar avaliacoes, que permanecem anonimas." },
  pl: { title: "Zaloguj sie, aby napisac opinie", text: "Bez rejestracji mozesz przegladac i wyszukiwac firmy. Z bezplatnym kontem mozesz publikowac anonimowe opinie." },
  ar: { title: "سجل الدخول لكتابة مراجعة", text: "من دون تسجيل يمكنك تصفح الشركات والبحث عنها. ومع حساب مجاني يمكنك نشر مراجعات تبقى مجهولة الهوية." },
};