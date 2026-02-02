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

import ReactGA from "react-ga4";

const App = () => {

  ReactGA.initialize("G-XY22F0HGZG");

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
