import {
    createSlice,
    createAsyncThunk
} from '@reduxjs/toolkit'

import axios from 'axios'

const initialState = {
    codes: [],
    xauth: undefined,
    profile: undefined
}

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
        },
        setCodes: (state, {payload}) => {
            state.codes = payload
        },
        signOut: (state, {payload}) => {
            return initialState
        }
    }
})

export const {add, setAll, setXAuth, setProfile, setCodes, signOut} = userSlice.actions

export const getMe = createAsyncThunk('getMe', async (info, { getState, dispatch }) => {

    console.log('thunk params', info)

    const {
        callback,
        localAuth
    } = info

    dispatch(
        setXAuth(
            localAuth
        )
    )

    const url = '/api/user/me'
    axios.get(url, {
        headers: {
            xauth: localAuth
        }
    })
    .then((response) => {
        console.log('thunk get all', response.data)

        dispatch(
            setProfile(
                response.data.profile
            )
        )

        dispatch(
            setCodes(
                response.data.codes
            )
        )

        callback(true)
    })
    .catch((err) => {
        console.log('error', err)
        callback(false)
    })
})

export const signIn = createAsyncThunk('signIn', async (info, { getState, dispatch }) => {

    console.log('thunk params', info)

    const {
        callback,
        email,
        password
    } = info

    const url = '/api/signin'
    axios.post(url, {
        email,
        password
    })
    .then((response) => {

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
    })
    .catch((err) => {
        console.log('error', err)
        callback(false)
    })
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