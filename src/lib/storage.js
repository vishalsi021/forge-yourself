const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];

  return value ? decodeURIComponent(value) : null;
}

function writeCookie(name, value) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure}`;
}

function clearCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
}

export const cookieStorage = {
  getItem(key) {
    return readCookie(key);
  },
  setItem(key, value) {
    writeCookie(key, value);
  },
  removeItem(key) {
    clearCookie(key);
  },
};
