import { useEffect, useState } from 'react'
import api from '../api'
import { useLang } from '../LangContext'
import StatsView from '../components/StatsView'

const infoStyle = {
  background: 'white', borderRadius: 14, padding: 40, textAlign: 'center',
  color: '#888', fontSize: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 6px 20px rgba(16,24,40,0.06)',
}

export default function Statistik() {
  const { t } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get('/api/shop/stats/summary')
        .then(res => setData(res.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={infoStyle}>{t('stat_loading')}</div>
  if (error || !data) return <div style={infoStyle}>{t('stat_load_error')}</div>

  return (
      <StatsView
          data={data}
          fetchDay={date => api.get('/api/shop/stats/day', { params: { date } }).then(r => r.data)}
          onToggleExcludeSunday={enabled => api.put('/api/shop/stats/exclude-sunday', { enabled })}
      />
  )
}
