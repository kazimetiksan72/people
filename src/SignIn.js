import {
    Form
} from 'react-bootstrap'

import {
    useState,
    useEffect
} from 'react'

import Button from './Button'

import axios from 'axios'

// import {
//     useDispatch,
//     useSelector
// } from 'react-redux'

// import { 
//     setXAuth,
//     setProfile
// } from '../redux/userSlice'

import {
    useNavigate
} from 'react-router-dom'

import { 
    signIn 
} from './redux/requests'

const SignIn = () => {

    const [userInfo, setUserInfo] = useState({
        email: "kazim@etiksan.com",
        password: "12345"
    })

    const navigate = useNavigate()

    // const dispatch = useDispatch()
    
    // const xauth = useSelector(state => state.user.xauth)
    // console.log('redux token', xauth)

    // const signIn = () => {

        // const url = '/api/signin'
        // axios.post(url, userInfo)
        // .then((response) => {
        //     console.log('signin response', response.data)
        //     console.log('jwt token', response.headers.xauth)

        //     const {xauth} = response.headers

        //     // redux güncellenecek
        //     dispatch(
        //         setXAuth(
        //             xauth
        //         )
        //     )

        //     dispatch(
        //         setProfile(
        //             response.data
        //         )
        //     )

        //     navigate('/')
    //     })
    //     .catch((err) => {
    //         console.log('signin failed', err)
    //     })
    // }

    return (
        <>
            <Form.Control type="email" placeholder="Email" value={userInfo.email} onChange={(e) => {
                const email = e.target.value
                const newInfo = {...userInfo, email}
                setUserInfo(newInfo)
            }} />
            <Form.Control type="password" placeholder='Password' security="true" value={userInfo.password} onChange={(e) => {
                const password = e.target.value
                const newInfo = {...userInfo, password}
                setUserInfo(newInfo)
            }} />
            <Button title='Giriş Yap' onClick={() => {
                    signIn({
                        ...userInfo,
                        callback: (isOk) => {
                            // loader varsa kapat

                            if (isOk) {
                                navigate('/')
                            }
                        }
                    })
                }}
            />
        </>
    )
}

export default SignIn