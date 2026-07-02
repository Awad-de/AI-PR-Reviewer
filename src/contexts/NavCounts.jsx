import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getTotalReviewCount, getTotalComparisonCount } from '../services/supabase.js'

const NavCountsContext = createContext(null)

export function NavCountsProvider({ children }) {
  const [reviewCount, setReviewCount] = useState(0)
  const [comparisonCount, setComparisonCount] = useState(0)

  const refresh = useCallback(async () => {
    const [reviews, comparisons] = await Promise.all([
      getTotalReviewCount(),
      getTotalComparisonCount(),
    ])
    setReviewCount(reviews)
    setComparisonCount(comparisons)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <NavCountsContext.Provider value={{ reviewCount, comparisonCount, refresh }}>
      {children}
    </NavCountsContext.Provider>
  )
}

export function useNavCounts() {
  const ctx = useContext(NavCountsContext)
  if (!ctx) throw new Error('useNavCounts must be inside NavCountsProvider')
  return ctx
}
