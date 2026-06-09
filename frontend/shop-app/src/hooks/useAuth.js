export function useAuth() {
  const token = localStorage.getItem('mf_shop_token')
  const shop = JSON.parse(localStorage.getItem('mf_shop') || 'null')

  function login(tokenVal, shopData) {
    localStorage.setItem('mf_shop_token', tokenVal)
    localStorage.setItem('mf_shop', JSON.stringify(shopData))
  }

  function logout() {
    localStorage.removeItem('mf_shop_token')
    localStorage.removeItem('mf_shop')
    window.location.href = '/login'
  }

  return { token, shop, login, logout, isLoggedIn: !!token }
}
