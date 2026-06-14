import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import ReactPlayer from 'react-player'
import { useRedux } from './redux/hooks'
import { signOut } from './redux/requests'

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import EventRoundedIcon from '@mui/icons-material/EventRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'

const TeneuBlanche = () => {
  const navigate = useNavigate()
  const { xauth, profile } = useRedux()
  const fileInputRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [previewImage, setPreviewImage] = useState(null)

  const isKazim = String(profile?.ePosta || '').trim().toLowerCase() === 'kazim@pikselmutfak.com'

  const fontStyle = (weight) => ({
    fontFamily: 'Open Sans',
    fontOpticalSizing: 'auto',
    fontWeight: weight,
    fontStyle: 'normal'
  })

  const fetchEvents = useCallback(async () => {
    if (!xauth) return
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/teneu-blanche', { headers: { xauth } })
      const items = Array.isArray(response.data) ? response.data : []
      setEvents(items)
      setSelectedId((prev) => {
        if (prev && items.some((item) => item._id === prev)) return prev
        return items.find((item) => item.isDefault)?._id || items[0]?._id || ''
      })
    } catch (e) {
      setEvents([])
      setError('Teneu Blanche listesi alınamadı.')
    } finally {
      setLoading(false)
    }
  }, [xauth])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => String(b.eventDate || b.createdAt || '').localeCompare(String(a.eventDate || a.createdAt || '')))
  }, [events])

  const totalUploadProgress = useMemo(() => {
    if (selectedFiles.length === 0) return 0
    const total = selectedFiles.reduce((sum, file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`
      return sum + (uploadProgress[key]?.progress || 0)
    }, 0)
    return Math.round(total / selectedFiles.length)
  }, [selectedFiles, uploadProgress])

  if (!xauth) return <Navigate to="/signin" replace />

  const selectedEvent = events.find((item) => item._id === selectedId)
  const media = Array.isArray(selectedEvent?.media) ? selectedEvent.media : []

  const openCreateDialog = () => {
    setCreateError('')
    setEventDate('')
    setCreateOpen(true)
  }

  const onCreate = async () => {
    setCreateError('')
    if (!eventDate) {
      setCreateError('Etkinlik tarihi zorunludur.')
      return
    }

    try {
      const response = await axios.post('/api/teneu-blanche', {
        eventDate
      }, { headers: { xauth } })

      const created = response.data
      await fetchEvents()
      setSelectedId(created._id)
      setCreateOpen(false)
    } catch (e) {
      setCreateError(e?.response?.data?.errorMessage || 'Teneu Blanche oluşturulamadı.')
    }
  }

  const openUploadDialog = () => {
    setUploadError('')
    setSelectedFiles([])
    setUploadProgress({})
    setDragActive(false)
    setUploadOpen(true)
  }

  const addFiles = (incomingFiles) => {
    const files = Array.from(incomingFiles || []).filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
    if (files.length === 0) return

    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`))
      const uniqueFiles = files.filter((file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`))
      return [...prev, ...uniqueFiles]
    })
  }

  const onPickFiles = () => {
    setUploadError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const onFileInputChange = (e) => {
    addFiles(e.target.files)
  }

  const onDropFiles = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    addFiles(e.dataTransfer.files)
  }

  const removeSelectedFile = (fileToRemove) => {
    setSelectedFiles((prev) => prev.filter((file) => file !== fileToRemove))
    setUploadProgress((prev) => {
      const next = { ...prev }
      delete next[`${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`]
      return next
    })
  }

  const onUploadFiles = async () => {
    const files = selectedFiles
    if (!selectedId || files.length === 0) return

    setIsUploading(true)
    setUploadError('')
    setUploadProgress(Object.fromEntries(files.map((file) => [
      `${file.name}-${file.size}-${file.lastModified}`,
      { progress: 0, status: 'Bekliyor' }
    ])))

    try {
      let latestEvent = null

      for (const file of files) {
        const key = `${file.name}-${file.size}-${file.lastModified}`
        const formData = new FormData()
        formData.append('files', file)

        setUploadProgress((prev) => ({ ...prev, [key]: { progress: 0, status: 'Yükleniyor' } }))

        const response = await axios.post(`/api/teneu-blanche/${selectedId}/media`, formData, {
          headers: {
            xauth,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
            setUploadProgress((prev) => ({ ...prev, [key]: { progress, status: 'Yükleniyor' } }))
          }
        })

        latestEvent = response.data
        setUploadProgress((prev) => ({ ...prev, [key]: { progress: 100, status: 'Tamamlandı' } }))
      }

      if (latestEvent) {
        setEvents((prev) => prev.map((item) => item._id === latestEvent._id ? latestEvent : item))
      }
      setSelectedFiles([])
      setUploadOpen(false)
    } catch (err) {
      const failedMessage = err?.response?.data?.errorMessage || 'Medya yüklenemedi.'
      setUploadError(err?.response?.data?.errorMessage || 'Medya yüklenemedi.')
      setUploadProgress((prev) => {
        const next = { ...prev }
        const failedKey = Object.keys(next).find((key) => next[key].status === 'Yükleniyor')
        if (failedKey) next[failedKey] = { ...next[failedKey], status: failedMessage }
        return next
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f7f9fc', py: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 1340, mx: 'auto', px: { xs: 1.4, sm: 2.2, md: 3 } }}>
        <Paper elevation={0} sx={{ position: 'sticky', top: 10, zIndex: 20, mb: 1.8, borderRadius: 3, border: '1px solid rgba(23,33,55,0.12)', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.72)', p: { xs: 1.2, md: 1.6 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={() => setMenuOpen(true)} sx={{ border: '1px solid rgba(23,33,55,0.18)', borderRadius: 2 }}>
                <MenuRoundedIcon />
              </IconButton>
              <Typography sx={{ ...fontStyle(900), fontSize: { xs: 21, md: 26 }, lineHeight: 1.05 }}>
                Teneu Blanche
              </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField
                select
                size="small"
                label="Etkinlik"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 260 } }}
              >
                {sortedEvents.map((item) => (
                  <MenuItem key={item._id} value={item._id}>
                    {item.title}
                  </MenuItem>
                ))}
              </TextField>

              {isKazim ? (
                <>
                  <Button variant="outlined" onClick={openCreateDialog} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>
                    Yeni Ekle
                  </Button>
                  <Button variant="contained" startIcon={<CloudUploadRoundedIcon />} onClick={openUploadDialog} disabled={!selectedId || isUploading} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>
                    {isUploading ? 'Yükleniyor...' : 'Medya Yükle'}
                  </Button>
                </>
              ) : null}
            </Stack>
          </Stack>
        </Paper>

        <Drawer anchor="left" open={menuOpen} onClose={() => setMenuOpen(false)}>
          <Box sx={{ width: 280, p: 1.2, height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">
            <Typography sx={{ ...fontStyle(900), fontSize: 19, px: 1.2, py: 0.8 }}>Menü</Typography>
            <List>
              <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/') }}><ListItemIcon><PeopleAltRoundedIcon /></ListItemIcon><ListItemText primary="Kardeşler" /></ListItemButton></ListItem>
              <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/events') }}><ListItemIcon><EventRoundedIcon /></ListItemIcon><ListItemText primary="Etkinlikler" /></ListItemButton></ListItem>
              <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/tasks') }}><ListItemIcon><AssignmentRoundedIcon /></ListItemIcon><ListItemText primary="Görevler" /></ListItemButton></ListItem>
              <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/teneu-blanche') }}><ListItemIcon><AutoAwesomeRoundedIcon /></ListItemIcon><ListItemText primary="Teneu Blanche" /></ListItemButton></ListItem>
              <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/security') }}><ListItemIcon><SecurityRoundedIcon /></ListItemIcon><ListItemText primary="Güvenlik" /></ListItemButton></ListItem>
              <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/hicbir-k-olmez') }}><ListItemIcon><FavoriteRoundedIcon /></ListItemIcon><ListItemText primary="Hiçbir K. Ölmez" /></ListItemButton></ListItem>
              {isKazim ? <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/ayrilanlar') }}><ListItemIcon><PersonRemoveRoundedIcon /></ListItemIcon><ListItemText primary="Ayrılanlar" /></ListItemButton></ListItem> : null}
            </List>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="contained" color="error" onClick={() => { setMenuOpen(false); signOut(); navigate('/signin', { replace: true }) }} sx={{ ...fontStyle(800), textTransform: 'none', borderRadius: 2, minHeight: 42, mx: 1, mb: 1 }}>Çıkış Yap</Button>
          </Box>
        </Drawer>

        {error ? <Alert severity="error" sx={{ mb: 1.2 }}>{error}</Alert> : null}
        {uploadError ? <Alert severity="error" sx={{ mb: 1.2 }}>{uploadError}</Alert> : null}

        {loading ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Yükleniyor...</Typography></Paper>
        ) : !selectedEvent ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Henüz Teneu Blanche kaydı yok.</Typography></Paper>
        ) : media.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Bu etkinlik için henüz medya yüklenmemiş.</Typography></Paper>
        ) : (
          <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3, lg: 4 }, columnGap: 1.2 }}>
            {media.map((item) => (
              <Paper key={item._id || item.url} variant="outlined" sx={{ display: 'inline-block', width: '100%', mb: 1.2, overflow: 'hidden', borderRadius: 2, backgroundColor: '#fff' }}>
                {item.type === 'video' ? (
                  <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#0f172a' }}>
                    <ReactPlayer
                      src={item.url}
                      controls
                      width="100%"
                      height="100%"
                      style={{ position: 'absolute', inset: 0 }}
                      config={{
                        file: {
                          attributes: {
                            preload: 'metadata',
                            playsInline: true
                          }
                        }
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    component="img"
                    src={item.url}
                    alt={item.fileName || selectedEvent.title}
                    loading="lazy"
                    onClick={() => setPreviewImage(item)}
                    sx={{
                      width: '100%',
                      display: 'block',
                      cursor: 'zoom-in',
                      transition: '180ms ease',
                      '&:hover': {
                        filter: 'brightness(0.92)'
                      }
                    }}
                  />
                )}
              </Paper>
            ))}
          </Box>
        )}

        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={onFileInputChange} />
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ ...fontStyle(900) }}>Teneu Blanche Ekle</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2} sx={{ pt: 0.5 }}>
            {createError ? <Alert severity="error">{createError}</Alert> : null}
            <TextField label="Etkinlik Tarihi" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none' }}>Vazgeç</Button>
          <Button variant="contained" onClick={onCreate} sx={{ textTransform: 'none' }}>Kaydet</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={uploadOpen} onClose={() => !isUploading && setUploadOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ ...fontStyle(900) }}>Medya Yükle</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.4}>
            {uploadError ? <Alert severity="error">{uploadError}</Alert> : null}
            {selectedFiles.length > 0 ? (
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.7 }}>
                  <Typography sx={{ ...fontStyle(900), fontSize: 14 }}>Toplam yükleme durumu</Typography>
                  <Typography sx={{ ...fontStyle(900), fontSize: 14, color: '#2563eb' }}>%{totalUploadProgress}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={totalUploadProgress} sx={{ height: 9, borderRadius: 99, backgroundColor: 'rgba(37,99,235,0.12)' }} />
              </Box>
            ) : null}
            <Box
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true) }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true) }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false) }}
              onDrop={onDropFiles}
              sx={{
                border: dragActive ? '2px solid #2563eb' : '2px dashed rgba(37,99,235,0.35)',
                backgroundColor: dragActive ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)',
                borderRadius: 3,
                px: 2,
                py: 4,
                textAlign: 'center',
                transition: '160ms ease'
              }}
            >
              <CloudUploadRoundedIcon sx={{ fontSize: 46, color: '#2563eb', mb: 1 }} />
              <Typography sx={{ ...fontStyle(900), fontSize: 18 }}>Fotoğraf ve videoları buraya sürükle bırak</Typography>
              <Typography sx={{ ...fontStyle(600), color: '#64748b', mt: 0.5, mb: 2 }}>
                Seçilen medyalar Azure Storage üzerindeki teneublanche containerına yüklenecek.
              </Typography>
              <Button variant="outlined" onClick={onPickFiles} disabled={isUploading} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>
                Dosya Seç
              </Button>
            </Box>

            {selectedFiles.length > 0 ? (
              <Stack spacing={0.8}>
                <Typography sx={{ ...fontStyle(900), fontSize: 14 }}>Seçilen medyalar</Typography>
                {selectedFiles.map((file) => (
                  <Paper key={`${file.name}-${file.size}-${file.lastModified}`} variant="outlined" sx={{ p: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography noWrap sx={{ ...fontStyle(800), fontSize: 14, minWidth: 0 }}>{file.name}</Typography>
                        <Typography sx={{ ...fontStyle(900), fontSize: 12, color: '#2563eb', flexShrink: 0 }}>
                          %{uploadProgress[`${file.name}-${file.size}-${file.lastModified}`]?.progress || 0}
                        </Typography>
                      </Stack>
                      <Typography sx={{ ...fontStyle(600), fontSize: 12, color: '#64748b', mb: 0.7 }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                        {uploadProgress[`${file.name}-${file.size}-${file.lastModified}`]?.status ? ` · ${uploadProgress[`${file.name}-${file.size}-${file.lastModified}`].status}` : ''}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress[`${file.name}-${file.size}-${file.lastModified}`]?.progress || 0}
                        sx={{ height: 7, borderRadius: 99, backgroundColor: 'rgba(100,116,139,0.16)' }}
                      />
                    </Box>
                    <Button color="error" onClick={() => removeSelectedFile(file)} disabled={isUploading} sx={{ textTransform: 'none', ...fontStyle(800) }}>
                      Kaldır
                    </Button>
                  </Paper>
                ))}
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={isUploading} sx={{ textTransform: 'none' }}>Vazgeç</Button>
          <Button variant="contained" onClick={onUploadFiles} disabled={isUploading || selectedFiles.length === 0} sx={{ textTransform: 'none' }}>
            {isUploading ? 'Yükleniyor...' : 'Yükle'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth={false}
        PaperProps={{
          sx: {
            position: 'relative',
            m: { xs: 1.2, md: 3 },
            p: 0,
            borderRadius: 2,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0,0,0,0.72)'
          }
        }}
      >
        <IconButton
          aria-label="Kapat"
          onClick={() => setPreviewImage(null)}
          sx={{
            position: 'absolute',
            right: -12,
            top: -12,
            zIndex: 2,
            width: 38,
            height: 38,
            backgroundColor: '#fff',
            color: '#111827',
            boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
            '&:hover': {
              backgroundColor: '#f3f4f6'
            }
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
        {previewImage ? (
          <Box
            component="img"
            src={previewImage.url}
            alt={previewImage.fileName || 'Teneu Blanche görseli'}
            sx={{
              display: 'block',
              maxWidth: 'min(92vw, 1180px)',
              maxHeight: '86vh',
              objectFit: 'contain',
              borderRadius: 2,
              backgroundColor: '#111827',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)'
            }}
          />
        ) : null}
      </Dialog>
    </Box>
  )
}

export default TeneuBlanche
