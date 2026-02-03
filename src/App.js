import 'bootstrap/dist/css/bootstrap.min.css';

import {BrowserRouter, Routes, Route} from 'react-router-dom'

import {
  store
} from './redux/store'

import {
  Provider
} from 'react-redux'

import SignIn from './SignIn'
import Home from './Home'
import { getMe } from './redux/requests';



const App = () => {

  const localAuth = sessionStorage.getItem('xauth')
  console.log({localAuth})
  if (localAuth !== null) {
    getMe({
      callback: () => {},
      localAuth
    })
  }

  return (
    <>
    <Provider store={store}>
      <BrowserRouter>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/signin' element={<SignIn />} />
            <Route path='*' element={<App />} />
          </Routes>
      </BrowserRouter>
      </Provider>
    </>
  )
}

export default App;
