import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import ReactPlayer from 'react-player'
import { useRedux } from './redux/hooks'
import { signOut } from './redux/requests'

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import EventRoundedIcon from '@mui/icons-material/EventRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import MovieRoundedIcon from '@mui/icons-material/MovieRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'

const fontStyle = (weight) => ({
  fontFamily: 'Open Sans',
  fontOpticalSizing: 'auto',
  fontWeight: weight,
  fontStyle: 'normal'
})

const formatDateTr = (value) => {
  if (!value) return '-'
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const getMediaCount = (event) => Array.isArray(event?.media) ? event.media.length : 0

const Media = () => {
  const navigate = useNavigate()
  const { id: eventId } = useParams()
  const { xauth, profile } = useRedux()
  const fileInputRef = useRef(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [createOpen, setCreateOpen] = useState(false)
  const [isEventFormEdit, setIsEventFormEdit] = useState(false)
  const [createError, setCreateError] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [previewImage, setPreviewImage] = useState(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedMediaIds, setSelectedMediaIds] = useState([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeletingMedia, setIsDeletingMedia] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const profileEmail = String(profile?.ePosta || '').trim().toLowerCase()
  const isKazim = profileEmail === 'kazim@pikselmutfak.com'
  const isDetail = Boolean(eventId)

  const fetchEvents = useCallback(async () => {
    if (!xauth) return
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/teneu-blanche', { headers: { xauth } })
      setEvents(Array.isArray(response.data) ? response.data : [])
    } catch (e) {
      setEvents([])
      setError('Medya etkinlikleri alınamadı.')
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

  const selectedEvent = useMemo(() => {
    if (!eventId) return null
    return events.find((item) => String(item._id) === String(eventId)) || null
  }, [eventId, events])

  const media = useMemo(() => {
    return Array.isArray(selectedEvent?.media) ? selectedEvent.media : []
  }, [selectedEvent])
  const canDeleteMedia = useCallback((item) => {
    return isKazim || String(item?.uploadedBy || '') === String(profile?._id || '')
  }, [isKazim, profile?._id])

  const deletableMediaCount = useMemo(() => {
    return media.filter((item) => canDeleteMedia(item)).length
  }, [media, canDeleteMedia])

  const totalUploadProgress = useMemo(() => {
    if (selectedFiles.length === 0) return 0
    const total = selectedFiles.reduce((sum, file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`
      return sum + (uploadProgress[key]?.progress || 0)
    }, 0)
    return Math.round(total / selectedFiles.length)
  }, [selectedFiles, uploadProgress])

  useEffect(() => {
    setSelectMode(false)
    setSelectedMediaIds([])
    setDeleteConfirmOpen(false)
    setDeleteError('')
    setUploadError('')
  }, [eventId])

  if (!xauth) return <Navigate to="/signin" replace />

  const openCreateDialog = () => {
    setCreateError('')
    setIsEventFormEdit(false)
    setEventTitle('')
    setEventDescription('')
    setEventDate('')
    setCreateOpen(true)
  }

  const openEditDialog = () => {
    if (!selectedEvent) return
    setCreateError('')
    setIsEventFormEdit(true)
    setEventTitle(selectedEvent.title || '')
    setEventDescription(selectedEvent.description || '')
    setEventDate(selectedEvent.eventDate || '')
    setCreateOpen(true)
  }

  const onSaveEvent = async () => {
    setCreateError('')
    if (!eventTitle.trim()) {
      setCreateError('Etkinlik ismi zorunludur.')
      return
    }
    if (!eventDate) {
      setCreateError('Etkinlik tarihi zorunludur.')
      return
    }

    try {
      const payload = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        eventDate
      }

      if (isEventFormEdit && eventId) {
        const response = await axios.patch(`/api/teneu-blanche/${eventId}`, payload, { headers: { xauth } })
        setEvents((prev) => prev.map((item) => item._id === response.data._id ? response.data : item))
      } else {
        const response = await axios.post('/api/teneu-blanche', payload, { headers: { xauth } })
        const created = response.data
        await fetchEvents()
        navigate(`/medya/${created._id}`)
      }

      setCreateOpen(false)
    } catch (e) {
      setCreateError(e?.response?.data?.errorMessage || (isEventFormEdit ? 'Medya etkinliği güncellenemedi.' : 'Medya etkinliği oluşturulamadı.'))
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

  const closeSelectMode = () => {
    setSelectMode(false)
    setSelectedMediaIds([])
    setDeleteError('')
  }

  const toggleMediaSelection = (mediaId) => {
    setSelectedMediaIds((prev) => {
      if (prev.includes(mediaId)) return prev.filter((id) => id !== mediaId)
      return [...prev, mediaId]
    })
  }

  const onUploadFiles = async () => {
    const files = selectedFiles
    if (!eventId || files.length === 0) return

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

        const response = await axios.post(`/api/teneu-blanche/${eventId}/media`, formData, {
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
      setUploadError(failedMessage)
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

  const onDeleteSelectedMedia = async () => {
    if (!eventId || selectedMediaIds.length === 0) return

    setIsDeletingMedia(true)
    setDeleteError('')
    try {
      const response = await axios.delete(`/api/teneu-blanche/${eventId}/media`, {
        headers: { xauth },
        data: { mediaIds: selectedMediaIds }
      })

      setEvents((prev) => prev.map((item) => item._id === response.data._id ? response.data : item))
      setSelectedMediaIds([])
      setSelectMode(false)
      setDeleteConfirmOpen(false)
    } catch (err) {
      setDeleteError(err?.response?.data?.errorMessage || 'Medya silinemedi.')
    } finally {
      setIsDeletingMedia(false)
    }
  }

  const drawer = (
    <Drawer anchor="left" open={menuOpen} onClose={() => setMenuOpen(false)}>
      <Box sx={{ width: 280, p: 1.2, height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">
        <Typography sx={{ ...fontStyle(900), fontSize: 19, px: 1.2, py: 0.8 }}>Menü</Typography>
        <List>
          <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/') }}><ListItemIcon><PeopleAltRoundedIcon /></ListItemIcon><ListItemText primary="Kardeşler" /></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/events') }}><ListItemIcon><EventRoundedIcon /></ListItemIcon><ListItemText primary="Etkinlikler" /></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/tasks') }}><ListItemIcon><AssignmentRoundedIcon /></ListItemIcon><ListItemText primary="Görevler" /></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/medya') }}><ListItemIcon><AutoAwesomeRoundedIcon /></ListItemIcon><ListItemText primary="Medya" /></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/security') }}><ListItemIcon><SecurityRoundedIcon /></ListItemIcon><ListItemText primary="Güvenlik" /></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/hicbir-k-olmez') }}><ListItemIcon><FavoriteRoundedIcon /></ListItemIcon><ListItemText primary="Hiçbir K. Ölmez" /></ListItemButton></ListItem>
          {isKazim ? <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/ayrilanlar') }}><ListItemIcon><PersonRemoveRoundedIcon /></ListItemIcon><ListItemText primary="Ayrılanlar" /></ListItemButton></ListItem> : null}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" color="error" onClick={() => { setMenuOpen(false); signOut(); navigate('/signin', { replace: true }) }} sx={{ ...fontStyle(800), textTransform: 'none', borderRadius: 2, minHeight: 42, mx: 1, mb: 1 }}>Çıkış Yap</Button>
      </Box>
    </Drawer>
  )

  const header = (
    <Paper elevation={0} sx={{ mb: 1.8, borderRadius: 3, border: '1px solid rgba(23,33,55,0.12)', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.72)', p: { xs: 1.2, md: 1.6 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => setMenuOpen(true)} sx={{ border: '1px solid rgba(23,33,55,0.18)', borderRadius: 2 }}>
            <MenuRoundedIcon />
          </IconButton>
          {isDetail ? (
            <IconButton onClick={() => navigate('/medya')} sx={{ border: '1px solid rgba(23,33,55,0.18)', borderRadius: 2 }}>
              <ArrowBackRoundedIcon />
            </IconButton>
          ) : null}
          <Box>
            <Typography sx={{ ...fontStyle(900), fontSize: { xs: 21, md: 26 }, lineHeight: 1.05 }}>
              Medya
            </Typography>
            {isDetail && selectedEvent ? (
              <Typography sx={{ ...fontStyle(700), fontSize: 13, color: '#64748b', mt: 0.35 }}>
                {selectedEvent.title}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
          {isKazim && !isDetail ? (
            <Button variant="contained" onClick={openCreateDialog} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>
              Yeni Ekle
            </Button>
          ) : null}
          {isDetail ? (
            <>
              {isKazim ? (
                <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={openEditDialog} disabled={!selectedEvent} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>
                  Düzenle
                </Button>
              ) : null}
              <Button variant="contained" startIcon={<CloudUploadRoundedIcon />} onClick={openUploadDialog} disabled={!eventId || isUploading} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>
                {isUploading ? 'Yükleniyor...' : 'Medya Yükle'}
              </Button>
              <Button variant={selectMode ? 'contained' : 'outlined'} onClick={() => selectMode ? closeSelectMode() : setSelectMode(true)} disabled={!eventId || deletableMediaCount === 0 || isDeletingMedia} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>
                {selectMode ? 'Vazgeç' : 'Seç'}
              </Button>
              {selectMode ? (
                <Button color="error" variant="contained" startIcon={<DeleteRoundedIcon />} onClick={() => setDeleteConfirmOpen(true)} disabled={selectedMediaIds.length === 0 || isDeletingMedia} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>
                  Sil ({selectedMediaIds.length})
                </Button>
              ) : null}
            </>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  )

  const renderEventCards = () => {
    if (loading) return <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Yükleniyor...</Typography></Paper>
    if (sortedEvents.length === 0) return <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Henüz medya etkinliği yok.</Typography></Paper>

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' }, gap: { xs: 1, md: 1.4 } }}>
        {sortedEvents.map((event) => (
          <Paper
            key={event._id}
            variant="outlined"
            onClick={() => navigate(`/medya/${event._id}`)}
            sx={{
              p: { xs: 1.1, md: 1.5 },
              minHeight: { xs: 132, md: 154 },
              borderRadius: 3,
              cursor: 'pointer',
              background: 'linear-gradient(145deg, #ffffff 0%, #eef6ff 100%)',
              borderColor: 'rgba(37,99,235,0.18)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: '160ms ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 16px 34px rgba(15,23,42,0.10)' }
            }}
          >
            <Box>
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'grid', placeItems: 'center', color: '#2563eb', backgroundColor: 'rgba(37,99,235,0.12)' }}>
                  <MovieRoundedIcon fontSize="small" />
                </Box>
                <Typography sx={{ ...fontStyle(900), fontSize: { xs: 15, md: 17 }, lineHeight: 1.15 }}>
                  {event.title || 'Medya Etkinliği'}
                </Typography>
              </Stack>
              <Typography sx={{ ...fontStyle(700), fontSize: 13, color: '#64748b' }}>
                {formatDateTr(event.eventDate)}
              </Typography>
            </Box>
            <Typography sx={{ ...fontStyle(900), color: '#2563eb', fontSize: { xs: 14, md: 15 } }}>
              {getMediaCount(event)} medya
            </Typography>
          </Paper>
        ))}
      </Box>
    )
  }

  const renderMediaDetail = () => {
    if (loading) return <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Yükleniyor...</Typography></Paper>
    if (!selectedEvent) return <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Medya etkinliği bulunamadı.</Typography></Paper>

    return (
      <>
        <Paper variant="outlined" sx={{ position: 'relative', p: { xs: 1.3, md: 1.8 }, pb: { xs: 3.6, md: 3.8 }, borderRadius: 3, mb: 1.4, backgroundColor: '#fff' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box>
              <Typography sx={{ ...fontStyle(900), fontSize: { xs: 23, md: 30 }, lineHeight: 1.1 }}>{selectedEvent.title}</Typography>
              {selectedEvent.description ? (
                <Typography sx={{ ...fontStyle(600), color: '#334155', mt: 1 }}>{selectedEvent.description}</Typography>
              ) : null}
            </Box>
            <Typography sx={{ ...fontStyle(900), color: '#2563eb' }}>{media.length} medya</Typography>
          </Stack>
          <Typography sx={{ position: 'absolute', right: { xs: 12, md: 16 }, bottom: { xs: 10, md: 12 }, ...fontStyle(700), color: '#64748b', fontSize: { xs: 11, md: 12 } }}>
            {formatDateTr(selectedEvent.eventDate)}
          </Typography>
        </Paper>

        {media.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Bu etkinlik için henüz medya yüklenmemiş.</Typography></Paper>
        ) : (
          <Box sx={{ columnCount: { xs: 3, md: 3, lg: 4 }, columnGap: { xs: 0.7, md: 1.2 } }}>
            {media.map((item) => (
              <Paper key={item._id || item.url} variant="outlined" sx={{ position: 'relative', display: 'inline-block', width: '100%', mb: { xs: 0.7, md: 1.2 }, overflow: 'hidden', borderRadius: 2, backgroundColor: '#fff' }}>
                {selectMode && canDeleteMedia(item) ? (
                  <Checkbox
                    checked={selectedMediaIds.includes(String(item._id))}
                    onChange={() => toggleMediaSelection(String(item._id))}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ position: 'absolute', top: 6, right: 6, zIndex: 3, p: 0.3, borderRadius: 1.4, backgroundColor: 'rgba(255,255,255,0.88)', boxShadow: '0 8px 22px rgba(15,23,42,0.20)', '&:hover': { backgroundColor: '#fff' } }}
                  />
                ) : null}
                {item.type === 'video' ? (
                  <Box onClick={() => selectMode && canDeleteMedia(item) && toggleMediaSelection(String(item._id))} sx={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#0f172a', cursor: selectMode && canDeleteMedia(item) ? 'pointer' : 'default' }}>
                    <ReactPlayer
                      src={item.url}
                      controls
                      width="100%"
                      height="100%"
                      style={{ position: 'absolute', inset: 0 }}
                      config={{ file: { attributes: { preload: 'metadata', playsInline: true } } }}
                    />
                  </Box>
                ) : (
                  <Box
                    component="img"
                    src={item.url}
                    alt={item.fileName || selectedEvent.title}
                    loading="lazy"
                    onClick={() => selectMode ? (canDeleteMedia(item) && toggleMediaSelection(String(item._id))) : setPreviewImage(item)}
                    sx={{ width: '100%', display: 'block', cursor: selectMode && canDeleteMedia(item) ? 'pointer' : 'zoom-in', transition: '180ms ease', '&:hover': { filter: 'brightness(0.92)' } }}
                  />
                )}
              </Paper>
            ))}
          </Box>
        )}
      </>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f7f9fc', py: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 1340, mx: 'auto', px: { xs: 1.4, sm: 2.2, md: 3 } }}>
        {header}
        {drawer}

        {error ? <Alert severity="error" sx={{ mb: 1.2 }}>{error}</Alert> : null}
        {uploadError ? <Alert severity="error" sx={{ mb: 1.2 }}>{uploadError}</Alert> : null}
        {deleteError ? <Alert severity="error" sx={{ mb: 1.2 }}>{deleteError}</Alert> : null}

        {isDetail ? renderMediaDetail() : renderEventCards()}

        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={onFileInputChange} />
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ ...fontStyle(900) }}>{isEventFormEdit ? 'Medya Etkinliğini Düzenle' : 'Medya Etkinliği Ekle'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2} sx={{ pt: 0.5 }}>
            {createError ? <Alert severity="error">{createError}</Alert> : null}
            <TextField label="Etkinlik İsmi" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} fullWidth />
            <TextField label="Kısa Açıklama" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} fullWidth multiline minRows={2} />
            <TextField label="Etkinlik Tarihi" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none' }}>Vazgeç</Button>
          <Button variant="contained" onClick={onSaveEvent} sx={{ textTransform: 'none' }}>Kaydet</Button>
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
              sx={{ border: dragActive ? '2px solid #2563eb' : '2px dashed rgba(37,99,235,0.35)', backgroundColor: dragActive ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)', borderRadius: 3, px: 2, py: 4, textAlign: 'center', transition: '160ms ease' }}
            >
              <CloudUploadRoundedIcon sx={{ fontSize: 46, color: '#2563eb', mb: 1 }} />
              <Typography sx={{ ...fontStyle(900), fontSize: 18 }}>Fotoğraf ve videoları buraya sürükle bırak</Typography>
              <Typography sx={{ ...fontStyle(600), color: '#64748b', mt: 0.5, mb: 2 }}>Fotoğrafları telefonunuzdan seçip yükleyebilirsiniz.</Typography>
              <Button variant="outlined" onClick={onPickFiles} disabled={isUploading} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>Dosya Seç</Button>
            </Box>

            {selectedFiles.length > 0 ? (
              <Stack spacing={0.8}>
                <Typography sx={{ ...fontStyle(900), fontSize: 14 }}>Seçilen medyalar</Typography>
                {selectedFiles.map((file) => (
                  <Paper key={`${file.name}-${file.size}-${file.lastModified}`} variant="outlined" sx={{ p: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography noWrap sx={{ ...fontStyle(800), fontSize: 14, minWidth: 0 }}>{file.name}</Typography>
                        <Typography sx={{ ...fontStyle(900), fontSize: 12, color: '#2563eb', flexShrink: 0 }}>%{uploadProgress[`${file.name}-${file.size}-${file.lastModified}`]?.progress || 0}</Typography>
                      </Stack>
                      <Typography sx={{ ...fontStyle(600), fontSize: 12, color: '#64748b', mb: 0.7 }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                        {uploadProgress[`${file.name}-${file.size}-${file.lastModified}`]?.status ? ` · ${uploadProgress[`${file.name}-${file.size}-${file.lastModified}`].status}` : ''}
                      </Typography>
                      <LinearProgress variant="determinate" value={uploadProgress[`${file.name}-${file.size}-${file.lastModified}`]?.progress || 0} sx={{ height: 7, borderRadius: 99, backgroundColor: 'rgba(100,116,139,0.16)' }} />
                    </Box>
                    <Button color="error" onClick={() => removeSelectedFile(file)} disabled={isUploading} sx={{ textTransform: 'none', ...fontStyle(800) }}>Kaldır</Button>
                  </Paper>
                ))}
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={isUploading} sx={{ textTransform: 'none' }}>Vazgeç</Button>
          <Button variant="contained" onClick={onUploadFiles} disabled={isUploading || selectedFiles.length === 0} sx={{ textTransform: 'none' }}>{isUploading ? 'Yükleniyor...' : 'Yükle'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => !isDeletingMedia && setDeleteConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ ...fontStyle(900) }}>Medyaları Sil</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2}>
            {deleteError ? <Alert severity="error">{deleteError}</Alert> : null}
            <Typography sx={{ ...fontStyle(700), color: '#334155' }}>Seçili {selectedMediaIds.length} medya silinecek. Bu işlem hem listeden hem de Azure Storage üzerinden dosyaları kaldıracak.</Typography>
            <Alert severity="warning">Bu işlem geri alınamaz. Devam etmek istediğine emin misin?</Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={isDeletingMedia} sx={{ textTransform: 'none' }}>Vazgeç</Button>
          <Button color="error" variant="contained" onClick={onDeleteSelectedMedia} disabled={isDeletingMedia || selectedMediaIds.length === 0} sx={{ textTransform: 'none' }}>{isDeletingMedia ? 'Siliniyor...' : 'Evet, Sil'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth={false}
        PaperProps={{ sx: { position: 'relative', m: { xs: 1.2, md: 3 }, p: 0, borderRadius: 2, backgroundColor: 'transparent', boxShadow: 'none', overflow: 'visible' } }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.72)' } }}
      >
        <IconButton aria-label="Kapat" onClick={() => setPreviewImage(null)} sx={{ position: 'absolute', right: -12, top: -12, zIndex: 2, width: 38, height: 38, backgroundColor: '#fff', color: '#111827', boxShadow: '0 12px 30px rgba(0,0,0,0.28)', '&:hover': { backgroundColor: '#f3f4f6' } }}>
          <CloseRoundedIcon />
        </IconButton>
        {previewImage ? (
          <Box component="img" src={previewImage.url} alt={previewImage.fileName || 'Medya görseli'} sx={{ display: 'block', maxWidth: 'min(92vw, 1180px)', maxHeight: '86vh', objectFit: 'contain', borderRadius: 2, backgroundColor: '#111827', boxShadow: '0 24px 80px rgba(0,0,0,0.45)' }} />
        ) : null}
      </Dialog>
    </Box>
  )
}

export default Media
