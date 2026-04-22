import {
    createSlice,
    createAsyncThunk
} from '@reduxjs/toolkit'

import axios from 'axios'

const getSessionProfile = () => {
    if (typeof window === 'undefined') {
        return undefined
    }

    const rawProfile = sessionStorage.getItem('profile')
    if (!rawProfile) {
        return undefined
    }

    try {
        return JSON.parse(rawProfile)
    } catch (e) {
        sessionStorage.removeItem('profile')
        return undefined
    }
}

const createInitialState = () => ({
    users: [],
    xauth: typeof window !== 'undefined' ? sessionStorage.getItem('xauth') : null,
    profile: getSessionProfile()
})

const initialState = createInitialState()

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        add: (state, action) => {
            console.log('anlık state', state)
            console.log('kullanıcı içeriği', action)
        },
        // setAll: (state, action) => {
        //     console.log('setAll içeriği', action.payload)
        // },
        setAll: (state, {payload}) => {
            console.log('setAll içeriği', payload)
            // return payload

            state.list = payload
        },
        setXAuth: (state, {payload}) => {
            console.log('xauth payload', payload)
            state.xauth = payload

            sessionStorage.setItem('xauth', payload)
        },
        setProfile: (state, {payload}) => {
            state.profile = payload
            sessionStorage.setItem('profile', JSON.stringify(payload))
        },
        setUsers: (state, {payload}) => {
            state.users = payload
        },
        setCodes: (state, {payload}) => {
            state.codes = payload
        },
        signOut: () => {
            sessionStorage.removeItem('xauth')
            sessionStorage.removeItem('profile')
            return createInitialState()
        }
    }
})

export const {add, setAll, setXAuth, setProfile, setCodes, signOut, setUsers} = userSlice.actions

export const getMe = createAsyncThunk('getMe', async (info, { getState, dispatch }) => {

    console.log('thunk params', info)

    const {
        //callback,
        localAuth
    } = info

    dispatch(
        setXAuth(
            localAuth
        )
    )

    // const url = '/api/user/me'
    // axios.get(url, {
    //     headers: {
    //         xauth: localAuth
    //     }
    // })
    // .then((response) => {
    //     console.log('thunk get all', response.data)

    //     dispatch(
    //         setProfile(
    //             response.data.profile
    //         )
    //     )

    //     dispatch(
    //         setCodes(
    //             response.data.codes
    //         )
    //     )

    //     callback(true)
    // })
    // .catch((err) => {
    //     console.log('error', err)
    //     callback(false)
    // })
})

export const signIn = createAsyncThunk('signIn', async (info, { getState, dispatch }) => {

    console.log('thunk params', info)

    const {
        callback,
        email,
        password
    } = info

    const url = '/api/signin'
    try {
        const response = await axios.post(url, {
            email,
            password
        })

        const xauth = response.headers.xauth
        const profile = response.data

        dispatch(
            setXAuth(
                xauth
            )
        )

        dispatch(
            setProfile(
                profile
            )
        )

        callback(true)
    } catch (err) {
        console.log('error', err)
        callback(false)
    }
})

export const getUsers = createAsyncThunk('getUsers', async (info, { getState, dispatch }) => {

    console.log('thunk params', info)

    const {user: {xauth}} = getState()
    console.log('getUsers', xauth)

    const {
        callback,
    } = info

    console.log('getUsers 1', info)

    const url = '/api/users'
    try {
        const response = await axios.get(url, {
            headers: {
                xauth
            }
        })
        console.log('thunk get users', response.data)

        dispatch(
            setUsers(
                response.data
            )
        )

        callback(true)
    } catch (err) {
        console.log('error', err)
        callback(false)
    }
})

export const updateMyProfile = createAsyncThunk('updateMyProfile', async (info, { getState, dispatch }) => {

    const {
        callback,
        userId,
        payload
    } = info

    const {user: {xauth, users, profile}} = getState()

    if (!userId) {
        if (callback) callback(false)
        return
    }

    try {
        const response = await axios.patch('/api/user/' + userId, payload, {
            headers: {
                xauth
            }
        })

        const updatedUser = response.data

        dispatch(
            setUsers(
                users.map((u) => u._id === updatedUser._id ? updatedUser : u)
            )
        )

        if (profile && profile._id === updatedUser._id) {
            dispatch(
                setProfile(
                    updatedUser
                )
            )
        }

        if (callback) callback(true, updatedUser)
    } catch (err) {
        console.log('error', err)
        if (callback) callback(false)
    }
})

export const changeMyPassword = createAsyncThunk('changeMyPassword', async (info, { getState }) => {

    const {
        callback,
        currentPassword,
        newPassword
    } = info

    const {user: {xauth}} = getState()

    try {
        await axios.post('/api/user/me/change-password', {
            currentPassword,
            newPassword
        }, {
            headers: {
                xauth
            }
        })

        if (callback) callback(true)
    } catch (err) {
        console.log('error', err)
        if (callback) {
            callback(false, err?.response?.data?.errorMessage || 'Şifre güncellenemedi.')
        }
    }
})

export const deleteUser = createAsyncThunk('deleteUser', async (info, { getState, dispatch }) => {
    const {
        callback,
        userId,
        reason
    } = info

    const { user: { xauth, users, profile } } = getState()

    if (!userId) {
        if (callback) callback(false, 'Kullanıcı bulunamadı.')
        return
    }

    try {
        const response = await axios.delete('/api/user/' + userId, {
            data: {
                reason
            },
            headers: {
                xauth
            }
        })

        const updatedUser = response.data

        dispatch(
            setUsers(
                users.map((u) => u._id === updatedUser._id ? updatedUser : u)
            )
        )

        if (profile && profile._id === updatedUser._id) {
            dispatch(setProfile(updatedUser))
        }

        if (callback) callback(true)
    } catch (err) {
        const errorMessage = err?.response?.data?.errorMessage || 'Silme sırasında bir hata oluştu.'
        if (callback) callback(false, errorMessage)
    }
})

export const markUserAsDeceased = createAsyncThunk('markUserAsDeceased', async (info, { getState, dispatch }) => {
    const {
        callback,
        userId
    } = info

    const { user: { xauth, users, profile } } = getState()

    if (!userId) {
        if (callback) callback(false, 'Kullanıcı bulunamadı.')
        return
    }

    try {
        const response = await axios.post('/api/user/' + userId + '/deceased', {}, {
            headers: {
                xauth
            }
        })

        const updatedUser = response.data

        dispatch(
            setUsers(
                users.map((u) => u._id === updatedUser._id ? updatedUser : u)
            )
        )

        if (profile && profile._id === updatedUser._id) {
            dispatch(setProfile(updatedUser))
        }

        if (callback) callback(true, updatedUser)
    } catch (err) {
        const errorMessage = err?.response?.data?.errorMessage || 'Vefat işaretleme sırasında bir hata oluştu.'
        if (callback) callback(false, errorMessage)
    }
})


export const generateQR = createAsyncThunk('generateQR', async (info, { getState, dispatch }) => {

    console.log('thunk params', info)

    const {user: {xauth}} = getState()

    console.log('slice xauth', xauth)

    const {
        callback,
    } = info

    const url = '/api/code/new'
    axios.post(url, {}, {
        headers: {
            xauth
        }
    })
    .then((response) => {

        const codes = response.data

        dispatch(
            setCodes(
                codes
            )
        )

        callback(true)
    })
    .catch((err) => {
        console.log('error', err)
        callback(false)
    })
})

export const getMyCodes = createAsyncThunk('getMyCodes', async (info, { getState, dispatch }) => {

    console.log('thunk params get codes', info)

    const {
        callback,
    } = info

    const {user: {xauth}} = getState()

    const url = '/api/code/'
    axios.get(url, {
        headers: {
            xauth
        }
    })
    .then((response) => {
        console.log('thunk get codes', response.data)

        dispatch(
            setCodes(
                response.data
            )
        )

        callback(true)
    })
    .catch((err) => {
        console.log('error', err)
        callback(false)
    })
})

export const saveContext = createAsyncThunk('saveContext', async (info, { getState, dispatch }) => {

    console.log('saveContext params', info)

    const {
        callback,
        context,
        _id
    } = info

    const url = '/api/code/'+_id
    axios.patch(url, {
        context
    })
    .then((response) => {

        callback(response.data)
    })
    .catch((err) => {
        console.log('error', err)
        callback(false)
    })
})

export const retrieveCode = createAsyncThunk('retrieveCode', async (info, { getState, dispatch }) => {

    const {
        callback,
        identifier
    } = info

    const url = '/api/code/retrieve/'+identifier
    axios.get(url)
    .then((response) => {
        console.log('thunk get codes', response.data)

        callback(response.data)
    })
    .catch((err) => {
        console.log('error', err)
        callback(false)
    })
})

export default userSlice.reducer
