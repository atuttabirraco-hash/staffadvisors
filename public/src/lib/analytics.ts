// Google Analytics (gtag.js) - inizializzazione lato browser
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;
let lastPath = "";

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const measurementId = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY'] as
    | string
    | undefined;
  if (!measurementId) return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  // gtag.js only processes `arguments` objects, not plain arrays.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
  lastPath = window.location.pathname; // config already sent this page view
}

export function trackPageView(path: string) {
  if (!initialized || !window.gtag || path === lastPath) return;
  lastPath = path;
  window.gtag("event", "page_view", { page_path: path, page_location: window.location.href });
}

/** Reports a completed sign-up once per account (GA4 "sign_up", imported by Google Ads). */
export function trackSignUp(userId: string, method: string) {
  if (typeof window === "undefined") return;
  const key = `sa_signup_tracked_${userId}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch { /* storage unavailable: still report */ }
  window.gtag?.("event", "sign_up", { method });
}
