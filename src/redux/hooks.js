import {
    useSelector
} from 'react-redux'

export const useRedux = () => {
    
    const codes = useSelector(state => state.user.codes)
    const xauth = useSelector(state => state.user.xauth)
    const profile = useSelector(state => state.user.profile)

    return {codes, xauth, profile}
}