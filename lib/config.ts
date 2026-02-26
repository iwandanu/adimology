export const ADMIN_EMAIL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ADMIN_EMAIL
    ? process.env.NEXT_PUBLIC_ADMIN_EMAIL.toLowerCase()
    : '');

