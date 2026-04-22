import { Navigate, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRedux } from './redux/hooks'
import { signOut } from './redux/requests'
import axios from 'axios'

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
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
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import EventRoundedIcon from '@mui/icons-material/EventRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded'

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY

const getTodayDateString = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const parseEventDateTime = (event) => {
  if (!event?.date) return null

  const datePart = String(event.date).trim()
  const timePart = String(event.time || '').trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const safeTime = /^\d{2}:\d{2}$/.test(timePart) ? `${timePart}:00` : '23:59:59'
    const parsed = new Date(`${datePart}T${safeTime}`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(datePart)) {
    const [d, m, y] = datePart.split('.')
    const safeTime = /^\d{2}:\d{2}$/.test(timePart) ? `${timePart}:00` : '23:59:59'
    const parsed = new Date(`${y}-${m}-${d}T${safeTime}`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const fallback = new Date(datePart)
  if (Number.isNaN(fallback.getTime())) return null

  if (!timePart || !/^\d{2}:\d{2}$/.test(timePart)) {
    fallback.setHours(23, 59, 59, 999)
    return fallback
  }

  const [hh, mm] = timePart.split(':').map((v) => Number(v))
  fallback.setHours(hh, mm, 0, 0)
  return fallback
}

const Events = () => {
  const navigate = useNavigate()
  const { xauth, profile } = useRedux()
  const isAdmin = profile?.role === 'admin'
  const canSeeAyrilanlar = String(profile?.ePosta || '').trim().toLowerCase() === 'kazim@pikselmutfak.com'
  const [menuOpen, setMenuOpen] = useState(false)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [eventName, setEventName] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [locationValue, setLocationValue] = useState(null)
  const [locationOptions, setLocationOptions] = useState([])
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [eventDate, setEventDate] = useState(getTodayDateString())
  const [eventTime, setEventTime] = useState('')
  const [eventNote, setEventNote] = useState('')
  const [savedEvents, setSavedEvents] = useState([])
  const [isEventsLoading, setIsEventsLoading] = useState(false)
  const [selectedPlacePreview, setSelectedPlacePreview] = useState(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [eventSelector, setEventSelector] = useState('active')
  const [formError, setFormError] = useState('')
  const [googleWarning, setGoogleWarning] = useState('')

  const autocompleteServiceRef = useRef(null)
  const placesServiceRef = useRef(null)
  const sessionTokenRef = useRef(null)
  const debounceRef = useRef(null)

  const fontStyle = (weight) => ({
    fontFamily: 'Open Sans',
    fontOpticalSizing: 'auto',
    fontWeight: weight,
    fontStyle: 'normal'
  })

  const initPlacesService = () => {
    if (!window.google?.maps?.places) return false

    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
    }

    if (!placesServiceRef.current) {
      placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'))
    }

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
    }

    return true
  }

  const loadGooglePlaces = useCallback(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setGoogleWarning('Google araması için REACT_APP_GOOGLE_MAPS_API_KEY tanımlı değil. Konum manuel girilebilir.')
      return
    }

    if (initPlacesService()) {
      setGoogleWarning('')
      return
    }

    const existingScript = document.getElementById('google-maps-places-script')
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (initPlacesService()) {
          setGoogleWarning('')
        }
      })
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-places-script'
    script.async = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    script.onload = () => {
      if (!initPlacesService()) {
        setGoogleWarning('Google Places başlatılamadı. Konumu manuel girebilirsin.')
        return
      }
      setGoogleWarning('')
    }
    script.onerror = () => {
      setGoogleWarning('Google Maps yüklenemedi. Konumu manuel girebilirsin.')
    }
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (!xauth) return
    if (!isCreateOpen) return
    loadGooglePlaces()
  }, [isCreateOpen, xauth, loadGooglePlaces])

  useEffect(() => {
    if (!xauth) return
    if (!isCreateOpen) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const input = (locationInput || '').trim()

    if (!input) {
      setLocationOptions([])
      setIsLocationLoading(false)
      return
    }

    if (!autocompleteServiceRef.current) {
      setLocationOptions([])
      return
    }

    setIsLocationLoading(true)
    debounceRef.current = setTimeout(() => {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input,
          sessionToken: sessionTokenRef.current,
          language: 'tr',
          componentRestrictions: { country: 'tr' }
        },
        (predictions, status) => {
          setIsLocationLoading(false)
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
            setLocationOptions([])
            return
          }

          setLocationOptions(predictions.map((p) => ({ place_id: p.place_id, description: p.description })))
        }
      )
    }, 280)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [locationInput, isCreateOpen, xauth])

  const fetchEvents = useCallback(async () => {
    if (!xauth) return

    setIsEventsLoading(true)
    try {
      const response = await axios.get('/api/events', {
        headers: {
          xauth
        }
      })
      setSavedEvents(Array.isArray(response.data) ? response.data : [])
    } catch (e) {
      setSavedEvents([])
    } finally {
      setIsEventsLoading(false)
    }
  }, [xauth])

  useEffect(() => {
    if (!xauth) return
    fetchEvents()
  }, [xauth, fetchEvents])

  const filteredEvents = useMemo(() => {
    const now = new Date()
    return savedEvents.filter((event) => {
      const eventDateTime = parseEventDateTime(event)
      if (!eventDateTime) {
        return eventSelector === 'active'
      }
      const isPast = eventDateTime.getTime() < now.getTime()
      return eventSelector === 'past' ? isPast : !isPast
    })
  }, [savedEvents, eventSelector])

  if (!xauth) {
    return <Navigate to="/signin" replace />
  }

  const resetForm = () => {
    setEventName('')
    setLocationInput('')
    setLocationValue(null)
    setLocationOptions([])
    setEventDate(getTodayDateString())
    setEventTime('')
    setEventNote('')
    setSelectedPlacePreview(null)
    setFormError('')
    setIsLocationLoading(false)
    setIsPreviewLoading(false)
    sessionTokenRef.current = null
  }

  const setPlacePreview = (place) => {
    if (!place?.place_id) {
      setSelectedPlacePreview(null)
      return
    }

    const mapEmbedUrl = GOOGLE_MAPS_API_KEY
      ? `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=place_id:${place.place_id}`
      : null

    setSelectedPlacePreview({
      placeId: place.place_id,
      description: place.description,
      mapEmbedUrl,
      photoUrl: null,
      latitude: null,
      longitude: null
    })

    if (!placesServiceRef.current || !window.google?.maps?.places) {
      return
    }

    setIsPreviewLoading(true)
    placesServiceRef.current.getDetails(
      {
        placeId: place.place_id,
        fields: ['photos', 'geometry']
      },
      (result, status) => {
        setIsPreviewLoading(false)

        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !result) {
          return
        }

        const photoUrl = result.photos?.[0]?.getUrl({ maxWidth: 900, maxHeight: 600 }) || null
        const latitude = result.geometry?.location?.lat ? result.geometry.location.lat() : null
        const longitude = result.geometry?.location?.lng ? result.geometry.location.lng() : null
        setSelectedPlacePreview((prev) => {
          if (!prev || prev.placeId !== place.place_id) {
            return prev
          }
          return {
            ...prev,
            photoUrl,
            latitude,
            longitude
          }
        })
      })
  }

  const onCloseForm = () => {
    setIsCreateOpen(false)
    resetForm()
  }

  const onSaveEvent = () => {
    if (!isAdmin) {
      setFormError('Etkinlik oluşturma yetkisi sadece admin kullanıcıdadır.')
      return
    }

    if (!eventName.trim() || !locationInput.trim()) {
      setFormError('Etkinlik Adı ve Etkinlik Konumu zorunludur.')
      return
    }

    axios.post('/api/events', {
      name: eventName.trim(),
      location: (selectedPlacePreview?.description || locationInput).trim(),
      date: eventDate,
      time: eventTime,
      note: eventNote.trim(),
      mapEmbedUrl: selectedPlacePreview?.mapEmbedUrl || '',
      photoUrl: selectedPlacePreview?.photoUrl || '',
      placeId: selectedPlacePreview?.placeId || '',
      latitude: selectedPlacePreview?.latitude ?? null,
      longitude: selectedPlacePreview?.longitude ?? null
    }, {
      headers: {
        xauth
      }
    })
      .then((response) => {
        setSavedEvents((prev) => [response.data, ...prev])
        setFormError('')
        onCloseForm()
      })
      .catch(() => {
        setFormError('Etkinlik kaydedilirken hata oluştu.')
      })
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1340,
        mx: 'auto',
        boxSizing: 'border-box',
        px: { xs: 1.4, sm: 2.2, md: 3 },
        pt: { xs: 1.4, md: 2.4 },
        pb: 3
      }}
    >
      <Paper
        className="no-print"
        elevation={0}
        sx={{
          position: 'sticky',
          top: 10,
          zIndex: 20,
          mb: 1.8,
          borderRadius: 3,
          border: '1px solid rgba(23,33,55,0.12)',
          backdropFilter: 'blur(12px)',
          background: 'rgba(255,255,255,0.72)',
          p: { xs: 1.2, md: 1.6 }
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              onClick={() => setMenuOpen(true)}
              sx={{
                border: '1px solid rgba(23,33,55,0.18)',
                borderRadius: 2
              }}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Typography sx={{ ...fontStyle(900), fontSize: { xs: 21, md: 26 }, lineHeight: 1.05 }}>
              Etkinlikler
            </Typography>
          </Stack>

          {isAdmin ? (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => setIsCreateOpen(true)}
              sx={{
                ...fontStyle(800),
                textTransform: 'none',
                borderRadius: 2,
                px: 2.2,
                backgroundColor: '#15803d',
                '&:hover': { backgroundColor: '#166534' }
              }}
            >
              Yeni Ekle
            </Button>
          ) : null}
        </Stack>
      </Paper>

      <Drawer
        anchor="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        <Box sx={{ width: 280, p: 1.2, height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">
          <Typography sx={{ ...fontStyle(900), fontSize: 19, px: 1.2, py: 0.8 }}>
            Menü
          </Typography>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => {
                setMenuOpen(false)
                navigate('/')
              }}>
                <ListItemIcon><PeopleAltRoundedIcon /></ListItemIcon>
                <ListItemText primary="Kardeşler" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => {
                setMenuOpen(false)
                navigate('/events')
              }}>
                <ListItemIcon><EventRoundedIcon /></ListItemIcon>
                <ListItemText primary="Etkinlikler" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => {
                setMenuOpen(false)
                navigate('/security')
              }}>
                <ListItemIcon><SecurityRoundedIcon /></ListItemIcon>
                <ListItemText primary="Güvenlik" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => {
                setMenuOpen(false)
                navigate('/hicbir-k-olmez')
              }}>
                <ListItemIcon><FavoriteRoundedIcon /></ListItemIcon>
                <ListItemText primary="Hiçbir K. Ölmez" />
              </ListItemButton>
            </ListItem>
            {canSeeAyrilanlar ? (
              <ListItem disablePadding>
                <ListItemButton onClick={() => {
                  setMenuOpen(false)
                  navigate('/ayrilanlar')
                }}>
                  <ListItemIcon><PersonRemoveRoundedIcon /></ListItemIcon>
                  <ListItemText primary="Ayrılanlar" />
                </ListItemButton>
              </ListItem>
            ) : null}
          </List>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setMenuOpen(false)
              signOut()
              navigate('/signin', { replace: true })
            }}
            sx={{
              ...fontStyle(800),
              textTransform: 'none',
              borderRadius: 2,
              minHeight: 42,
              mx: 1,
              mb: 1
            }}
          >
            Çıkış Yap
          </Button>
        </Box>
      </Drawer>

      <Box sx={{ mt: 2.2, display: 'grid', gap: 1.2 }}>
        <Box>
          <ToggleButtonGroup
            value={eventSelector}
            exclusive
            onChange={(_, value) => {
              if (!value) return
              setEventSelector(value)
            }}
            fullWidth
            sx={{
              '& .MuiToggleButton-root': {
                ...fontStyle(800),
                textTransform: 'none',
                borderRadius: '10px !important',
                py: 1,
                '&.Mui-selected': {
                  backgroundColor: '#1976d2',
                  color: '#fff'
                },
                '&.Mui-selected:hover': {
                  backgroundColor: '#1565c0'
                }
              }
            }}
          >
            <ToggleButton value="active">Aktif Etkinlikler</ToggleButton>
            <ToggleButton value="past">Geçmiş Etkinlikler</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {isEventsLoading ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography sx={{ ...fontStyle(700), fontSize: 15, color: 'text.secondary' }}>
              Etkinlikler yükleniyor...
            </Typography>
          </Paper>
        ) : filteredEvents.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography sx={{ ...fontStyle(700), fontSize: 15, color: 'text.secondary' }}>
              {eventSelector === 'past'
                ? 'Henüz geçmiş etkinlik yok.'
                : 'Henüz aktif etkinlik yok.'}
            </Typography>
          </Paper>
        ) : (
          filteredEvents.map((event) => (
            <Paper
              key={event._id || event.id}
              variant="outlined"
              sx={{ p: 1.2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
            >
              <Typography sx={{ ...fontStyle(900), fontSize: 17, minWidth: 0 }} noWrap>
                {event.name}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate(`/events/${event._id || event.id}`)}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Detay
              </Button>
            </Paper>
          ))
        )}
      </Box>

      <Dialog open={isCreateOpen} onClose={onCloseForm} fullWidth maxWidth="sm">
        <DialogTitle sx={{ ...fontStyle(900), fontSize: 24 }}>Yeni Etkinlik</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2} sx={{ pt: 0.4 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            {googleWarning ? <Alert severity="info">{googleWarning}</Alert> : null}

            <TextField
              label="Etkinlik Adı"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              fullWidth
            />

            <Autocomplete
              freeSolo
              options={locationOptions}
              filterOptions={(x) => x}
              loading={isLocationLoading}
              value={locationValue}
              inputValue={locationInput}
              onInputChange={(_, newInputValue) => {
                setLocationInput(newInputValue)
                if (!newInputValue) {
                  setLocationValue(null)
                  setSelectedPlacePreview(null)
                }
              }}
              onChange={(_, newValue) => {
                if (!newValue) {
                  setLocationValue(null)
                  setSelectedPlacePreview(null)
                  return
                }

                if (typeof newValue === 'string') {
                  setLocationValue({ description: newValue })
                  setLocationInput(newValue)
                  setSelectedPlacePreview(null)
                  return
                }

                setLocationValue(newValue)
                setLocationInput(newValue.description)
                setPlacePreview(newValue)
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option
                return option.description || ''
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Etkinlik Konumu"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLocationLoading ? <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />

            {selectedPlacePreview ? (
              <Box
                sx={{
                  mt: 0.4,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 1
                }}
              >
                <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2, minHeight: 170 }}>
                  {selectedPlacePreview.mapEmbedUrl ? (
                    <iframe
                      title="Google Map"
                      src={selectedPlacePreview.mapEmbedUrl}
                      width="100%"
                      height="170"
                      style={{ border: 0, display: 'block' }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <Box sx={{ p: 1.2 }}>
                      <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 700, fontSize: 13, color: 'text.secondary' }}>
                        Google Map önizlemesi için API anahtarı gerekli.
                      </Typography>
                    </Box>
                  )}
                </Paper>

                <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2, minHeight: 170, position: 'relative' }}>
                  {isPreviewLoading ? (
                    <Box sx={{ minHeight: 170, display: 'grid', placeItems: 'center' }}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : selectedPlacePreview.photoUrl ? (
                    <Box
                      component="img"
                      src={selectedPlacePreview.photoUrl}
                      alt={selectedPlacePreview.description || 'Mekan görseli'}
                      sx={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <Box sx={{ p: 1.2 }}>
                      <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 700, fontSize: 13, color: 'text.secondary' }}>
                        Seçilen mekana ait görsel bulunamadı.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            ) : null}

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, mt: '5px' }}>
              <TextField
                label="Etkinlik Tarihi"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Etkinlik Saati"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <TextField
              label="Not"
              value={eventNote}
              onChange={(e) => setEventNote(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.2 }}>
          <Button onClick={onCloseForm} sx={{ textTransform: 'none' }}>
            Vazgeç
          </Button>
          <Button variant="contained" onClick={onSaveEvent} sx={{ textTransform: 'none' }}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Events
