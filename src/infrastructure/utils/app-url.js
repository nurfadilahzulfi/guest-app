/**
 * Mendapatkan Base URL aplikasi secara dinamis dan andal.
 * 
 * Prioritas:
 * 1. process.env.APP_URL (jika di-set eksplisit dan bukan localhost saat di production)
 * 2. process.env.VERCEL_PROJECT_PRODUCTION_URL (disediakan otomatis oleh Vercel, e.g. guest-app-alpha.vercel.app)
 * 3. process.env.VERCEL_URL (URL deployment Vercel)
 * 4. Fallback: process.env.APP_URL lokal atau http://localhost:3000
 * 
 * @returns {string} Base URL tanpa trailing slash
 */
export function getBaseAppUrl() {
  if (process.env.APP_URL && !process.env.APP_URL.includes("localhost")) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Mendapatkan Base URL aplikasi berdasarkan HTTP Request yang sedang masuk.
 * Ini adalah metode paling akurat karena langsung mendeteksi domain/host
 * yang dikunjungi oleh user (termasuk reverse proxy Vercel dan custom domain).
 * 
 * @param {Request} [request]
 * @returns {string} Base URL tanpa trailing slash
 */
export function getRequestAppUrl(request) {
  if (request) {
    try {
      const proto = request.headers.get("x-forwarded-proto") || "https";
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      if (host) {
        return `${proto}://${host}`.replace(/\/$/, "");
      }
      if (request.nextUrl?.origin) {
        return request.nextUrl.origin.replace(/\/$/, "");
      }
    } catch {
      // ignore
    }
  }

  return getBaseAppUrl();
}
