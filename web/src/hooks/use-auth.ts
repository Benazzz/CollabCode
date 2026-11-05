import { useContext } from 'react'
import { AuthContext } from '@/lib/auth'

export const useAuth = () => useContext(AuthContext)
