import axios from 'axios'

import { store } from '../redux/store'
import { signOut } from '../redux/userSlice'

let isInterceptorSetup = false
let isRedirectingForUnauthorized = false

const redirectToSignIn = () => {
  if (typeof window === 'undefined') return

  const currentPath = window.location.pathname
  if (currentPath !== '/signin') {
    window.location.replace('/signin')
  }
}

export const setupAxios401Interceptor = () => {
  if (isInterceptorSetup) return
  isInterceptorSetup = true

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status

      if (status === 401 && !isRedirectingForUnauthorized) {
        isRedirectingForUnauthorized = true

        try {
          store.dispatch(signOut())
        } finally {
          redirectToSignIn()
          setTimeout(() => {
            isRedirectingForUnauthorized = false
          }, 0)
        }
      }

      return Promise.reject(error)
    }
  )
}
