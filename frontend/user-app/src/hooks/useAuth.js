export function useAuth() {
  const token = localStorage.getItem('mf_token')
  const user = JSON.parse(localStorage.getItem('mf_user') || 'null')

  function login(tokenVal, userData) {
    localStorage.setItem('mf_token', tokenVal)
    localStorage.setItem('mf_user', JSON.stringify(userData))
  }

  function logout() {
    localStorage.removeItem('mf_token')
    localStorage.removeItem('mf_user')
    window.location.href = '/login'
  }

  return { token, user, login, logout, isLoggedIn: !!token }
}
