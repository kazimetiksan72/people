import 'bootstrap/dist/css/bootstrap.min.css';

import {BrowserRouter, Routes, Route} from 'react-router-dom'
import { useEffect } from 'react'

import {
  store
} from './redux/store'

import {
  Provider
} from 'react-redux'

import SignIn from './SignIn'
import Home from './Home'
import { setXAuth, getUsers } from './redux/requests'
import Brother from './Brother'
import Events from './Events'
import EventDetail from './EventDetail'
import Security from './Security'

const App = () => {

  useEffect(() => {
    const localAuth = sessionStorage.getItem('xauth')
    if (localAuth !== null) {
      setXAuth(localAuth)
      getUsers({
        callback: () => {}
      })
    }
  }, [])

  return (
    <>
    <Provider store={store}>
      <BrowserRouter>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/events' element={<Events />} />
            <Route path='/events/:id' element={<EventDetail />} />
            <Route path='/security' element={<Security />} />
            <Route path='/brother/:matrikul' element={<Brother />} />
            <Route path='/signin' element={<SignIn />} />
            <Route path='*' element={<SignIn />} />
          </Routes>
      </BrowserRouter>
      </Provider>
    </>
  )
}

export default App;
