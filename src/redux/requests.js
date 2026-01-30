import * as userSlice from './userSlice'

import {
    store
} from './store'


export const getMe = (info) => store.dispatch(userSlice.getMe(info))
export const signIn = (info) => store.dispatch(userSlice.signIn(info))
export const signOut = (info) => store.dispatch(userSlice.signOut(info))
export const generateQR = (info) => store.dispatch(userSlice.generateQR(info))
export const getMyCodes = (info) => store.dispatch(userSlice.getMyCodes(info))
export const saveContext = (info) => store.dispatch(userSlice.saveContext(info))
export const retrieveCode = (info) => store.dispatch(userSlice.retrieveCode(info))