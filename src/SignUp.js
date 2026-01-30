import {
    Form
} from 'react-bootstrap'

import {
    useState,
    useEffect
} from 'react'

import Button from './Button'

import axios from 'axios'

const SignUp = () => {

    const [userInfo, setUserInfo] = useState({
        name: "",
        password: "",
        email: ""
    })

    useEffect(() => {
        // console.log('userinfo güncellendi', userInfo)
    }, [userInfo])

    const saveUser = () => {

        const url = '/api/signup'
        axios.post(url, userInfo)
        .then((response) => {
            console.log('signup response', response.data)
        })
        .catch((err) => {
            console.log('signup failed', err)
        })
    }

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
            <Form.Control placeholder="Ad Soyad" value={userInfo.name} onChange={(e) => {
                const name = e.target.value
                const newInfo = {...userInfo, name}
                setUserInfo(newInfo)
            }} />
            <Button title='Kaydet' onClick={() => {
                    console.log('user kaydedildi', userInfo)
                    saveUser()
                }}
            />
        </>
    )
}

export default SignUp