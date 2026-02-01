import {
    useState
} from 'react'

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import {
    useNavigate
} from 'react-router-dom'

import {
    signIn
} from './redux/requests'

const SignIn = () => {

    const [userInfo, setUserInfo] = useState({
        email: "",
        password: ""
    })

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event) => {
        event.preventDefault();
    };

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
            <div style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{
                    width: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 180,
                    justifyContent: 'space-between'
                }}>
                    <TextField
                        variant="outlined"
                        label="Kullanıcı Adı"
                        onChange={(e) => {
                            const email = e.target.value
                            const newInfo = { ...userInfo, email }
                            setUserInfo(newInfo)

                        }}
                        value={userInfo.email}
                    />
                    <FormControl variant="outlined">
                        <InputLabel htmlFor="outlined-adornment-password">Şifre</InputLabel>
                        <OutlinedInput
                            id="outlined-adornment-password"
                            type={showPassword ? 'text' : 'password'}
                        value={userInfo.password}
                        onChange={(e) => {
                            const password = e.target.value
                            const newInfo = { ...userInfo, password }
                            setUserInfo(newInfo)
                        }}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label={
                                            showPassword ? 'hide the password' : 'display the password'
                                        }
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        onMouseUp={handleMouseUpPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            }
                            label="Şifre"
                        />
                    </FormControl>
                    <Button loading={loading} size="large" variant="contained" onClick={() => {
                        
                        setLoading(true)
                        signIn({
                            ...userInfo,
                            callback: (isOk) => {
                                setLoading(false)
                                // loader varsa kapat

                                if (isOk) {
                                    navigate('/')
                                }
                            }
                        })

                    }}>GİRİŞ YAP</Button>
                </div>

            </div>
        </>
    )
}

export default SignIn