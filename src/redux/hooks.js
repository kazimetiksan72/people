import {
    useSelector
} from 'react-redux'

export const useRedux = () => {
    
    const users = useSelector(state => state.user.users)
    const xauth = useSelector(state => state.user.xauth)
    const profile = useSelector(state => state.user.profile)

    return {users, xauth, profile}
}