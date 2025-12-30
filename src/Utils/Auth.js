export function getAuth() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // save this on login
  return { token, role };
}

export function isLoggedIn() {
  const { token } = getAuth();
  return !!token;
}
