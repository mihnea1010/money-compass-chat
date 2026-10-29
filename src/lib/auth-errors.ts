type AuthErrorLike = { code?: string; status?: number; message?: string } | null | undefined;

const SIGNUP: Record<string, string> = {
  weak_password: "Parola e prea ușor de ghicit sau a apărut în scurgeri de date publice. Alege o parolă mai lungă și unică (ex. trei cuvinte + o cifră).",
  user_already_exists: "Există deja un cont cu acest email. Intră în cont sau resetează parola.",
  email_exists: "Există deja un cont cu acest email. Intră în cont sau resetează parola.",
  email_address_invalid: "Adresa de email nu pare validă. Verifică-o și încearcă din nou.",
  validation_failed: "Emailul sau parola nu sunt valide. Verifică datele introduse.",
  over_email_send_rate_limit: "Am trimis prea multe emailuri de confirmare. Încearcă din nou peste câteva minute.",
  over_request_rate_limit: "Prea multe încercări. Așteaptă puțin și încearcă din nou.",
  signup_disabled: "Crearea de conturi noi este oprită momentan.",
  email_provider_disabled: "Înregistrarea cu email este oprită momentan. Folosește „Continuă cu Google”.",
};

const SIGNIN: Record<string, string> = {
  invalid_credentials: "Email sau parolă greșite.",
  email_not_confirmed: "Confirmă mai întâi contul din emailul primit, apoi intră.",
  over_request_rate_limit: SIGNUP.over_request_rate_limit,
  email_provider_disabled: "Autentificarea cu email este oprită momentan. Folosește „Continuă cu Google”.",
};

/** Maps an auth error to a safe Romanian message; never echoes raw backend text. */
export function authErrorMessage(mode: "in" | "up", error: AuthErrorLike): string {
  const code = error?.code ?? "";
  const table = mode === "up" ? SIGNUP : SIGNIN;
  if (table[code]) return table[code];
  if (mode === "up" && /weak|pwned|easy to guess/i.test(error?.message ?? "")) return SIGNUP.weak_password;
  if (error?.status === 429) return SIGNUP.over_request_rate_limit;
  return mode === "in"
    ? "Nu am putut intra în cont. Verifică emailul și parola."
    : "Contul nu a putut fi creat. Verifică datele și încearcă din nou.";
}

/** With email confirmation on, a duplicate email returns a user without identities instead of an error. */
export function isObfuscatedDuplicate(user: { identities?: unknown[] | null } | null | undefined): boolean {
  return !!user && Array.isArray(user.identities) && user.identities.length === 0;
}
