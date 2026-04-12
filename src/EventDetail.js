import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

import { useRedux } from './redux/hooks'
import { signOut } from './redux/requests'

import {
  Avatar,
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
  useMediaQuery,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import EventRoundedIcon from '@mui/icons-material/EventRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import DirectionsRoundedIcon from '@mui/icons-material/DirectionsRounded'

const formatDateTrLong = (value) => {
  if (!value) return '-'

  const text = String(value).trim()
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    const monthIndex = Number(m) - 1
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${Number(d)} ${monthNames[monthIndex]} ${y}`
    }
  }

  const trMatch = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (trMatch) {
    const [, d, m, y] = trMatch
    const monthIndex = Number(m) - 1
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${Number(d)} ${monthNames[monthIndex]} ${y}`
    }
  }

  return text
}

const parseDateParts = (value) => {
  const text = String(value || '').trim()
  if (!text) return null

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return { year: Number(y), month: Number(m), day: Number(d) }
  }

  const trMatch = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (trMatch) {
    const [, d, m, y] = trMatch
    return { year: Number(y), month: Number(m), day: Number(d) }
  }

  return null
}

const parseTimeParts = (value) => {
  const text = String(value || '').trim()
  if (!text) return { hour: 23, minute: 59 }
  const match = text.match(/^(\d{1,2}):(\d{1,2})/)
  if (!match) return { hour: 23, minute: 59 }
  return { hour: Number(match[1]), minute: Number(match[2]) }
}

const isEventClosed = (date, time) => {
  const dateParts = parseDateParts(date)
  if (!dateParts) return false
  const timeParts = parseTimeParts(time)
  const dt = new Date(dateParts.year, dateParts.month - 1, dateParts.day, timeParts.hour, timeParts.minute, 0, 0)
  if (Number.isNaN(dt.getTime())) return false
  return Date.now() > dt.getTime()
}

const EventDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { xauth } = useRedux()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [event, setEvent] = useState(null)
  const [participantsOpen, setParticipantsOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [directionsDialogOpen, setDirectionsDialogOpen] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [guestCount, setGuestCount] = useState(0)
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')

  const latitude = Number(event?.latitude)
  const longitude = Number(event?.longitude)
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
  const eventClosed = isEventClosed(event?.date, event?.time)

  const fontStyle = (weight) => ({
    fontFamily: 'Open Sans',
    fontOpticalSizing: 'auto',
    fontWeight: weight,
    fontStyle: 'normal'
  })

  useEffect(() => {
    if (!xauth || !id) return

    setIsLoading(true)
    axios.get('/api/events/' + id, {
      headers: {
        xauth
      }
    })
      .then((response) => {
        setEvent(response.data)
        setIsJoined(Boolean(response.data?.joined))
        setGuestCount(Number(response.data?.myGuestCount) || 0)
      })
      .catch(() => {
        setEvent(null)
        setIsJoined(false)
        setGuestCount(0)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [xauth, id])

  const onJoin = () => {
    if (!id || joinLoading || eventClosed) {
      if (eventClosed) setJoinError('Etkinlik tarihi/saati geçtiği için katılım değiştirilemez.')
      return
    }

    setJoinLoading(true)
    setJoinError('')

    axios.post('/api/events/' + id + '/join', { guestCount }, {
      headers: {
        xauth
      }
    })
      .then((response) => {
        setEvent(response.data)
        setIsJoined(Boolean(response.data?.joined))
        setGuestCount(Number(response.data?.myGuestCount) || 0)
        setJoinDialogOpen(false)
      })
      .catch((error) => {
        setJoinError(error?.response?.data?.errorMessage || 'Katılım bilgisi kaydedilemedi.')
      })
      .finally(() => {
        setJoinLoading(false)
      })
  }

  const onLeave = () => {
    if (!id || joinLoading || !isJoined || eventClosed) {
      if (eventClosed) setJoinError('Etkinlik tarihi/saati geçtiği için katılım değiştirilemez.')
      return
    }

    setJoinLoading(true)
    setJoinError('')

    axios.post('/api/events/' + id + '/leave', {}, {
      headers: {
        xauth
      }
    })
      .then((response) => {
        setEvent(response.data)
        setIsJoined(Boolean(response.data?.joined))
        setGuestCount(Number(response.data?.myGuestCount) || 0)
      })
      .catch((error) => {
        setJoinError(error?.response?.data?.errorMessage || 'Katılım iptal edilemedi.')
      })
      .finally(() => {
        setJoinLoading(false)
      })
  }

  const openDirections = (provider) => {
    if (!hasCoordinates) return

    const destination = `${latitude},${longitude}`
    const encodedDestination = encodeURIComponent(destination)
    let url = ''

    if (provider === 'apple') {
      url = `https://maps.apple.com/?daddr=${encodedDestination}&dirflg=d`
    } else if (provider === 'google') {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}&travelmode=driving`
    } else if (provider === 'yandex') {
      url = `https://yandex.com/maps/?rtext=~${encodedDestination}&rtt=auto`
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    setDirectionsDialogOpen(false)
  }

  if (!xauth) {
    return <Navigate to="/signin" replace />
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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
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

            <Typography sx={{ ...fontStyle(900), fontSize: { xs: 18, sm: 20, md: 26 }, lineHeight: 1.05 }}>
              Etkinlik Detayları
            </Typography>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate('/events')}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' },
              alignSelf: { xs: 'stretch', sm: 'auto' }
            }}
          >
            Etkinliklere Dön
          </Button>
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

      {isLoading ? (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography sx={{ ...fontStyle(700) }}>Etkinlik yükleniyor...</Typography>
          </Stack>
        </Paper>
      ) : !event ? (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography sx={{ ...fontStyle(700) }}>Etkinlik bulunamadı.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.2}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
            <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 2 }}>
              <Typography sx={{ ...fontStyle(900), fontSize: { xs: 20, sm: 24 }, lineHeight: 1.15 }}>
                {event.name}
              </Typography>
              <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 0.5 }}>
                <LocationOnRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography sx={{ ...fontStyle(600), wordBreak: 'break-word' }}>{event.location}</Typography>
              </Stack>
              <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 0.5 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                <Typography sx={{ ...fontStyle(600), fontSize: 13, color: 'text.secondary' }}>
                  {formatDateTrLong(event.date)} {event.time ? `· ${event.time}` : ''}
                </Typography>
              </Stack>
              {event.note ? (
                <Typography sx={{ ...fontStyle(600), fontSize: 14, mt: '30px' }}>
                  {event.note}
                </Typography>
              ) : null}
            </Paper>

            <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2, minHeight: { xs: 190, sm: 220 } }}>
              {event.mapEmbedUrl ? (
                <iframe
                  title="Google Map"
                  src={event.mapEmbedUrl}
                  width="100%"
                  height={isMobile ? '190' : '220'}
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <Box sx={{ p: 1.2 }}>
                  <Typography sx={{ ...fontStyle(700), fontSize: 13, color: 'text.secondary' }}>
                    Harita bilgisi yok.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>

          {joinError ? (
            <Typography sx={{ ...fontStyle(700), color: 'error.main', fontSize: 13 }}>
              {joinError}
            </Typography>
          ) : null}
          {eventClosed ? (
            <Typography sx={{ ...fontStyle(700), color: 'warning.main', fontSize: 13 }}>
              Etkinlik tarihi/saati geçtiği için katılım durumu değiştirilemez.
            </Typography>
          ) : null}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="contained"
              onClick={() => setJoinDialogOpen(true)}
              disabled={joinLoading || eventClosed}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                minHeight: 44,
                fontFamily: 'Open Sans',
                fontWeight: 800,
                flex: 1,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {joinLoading ? 'Kaydediliyor...' : isJoined
                ? `Katılımı Güncelle (Misafir: ${guestCount})`
                : 'Katılıyorum'}
            </Button>

            {isJoined ? (
              <Button
                variant="outlined"
                color="error"
                onClick={onLeave}
                disabled={joinLoading || eventClosed}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  minHeight: 44,
                  fontFamily: 'Open Sans',
                  fontWeight: 800,
                  flex: 1,
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Katılımdan Vazgeç
              </Button>
            ) : null}

            <Button
              variant="outlined"
              onClick={() => setParticipantsOpen(true)}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                minHeight: 44,
                fontFamily: 'Open Sans',
                fontWeight: 800,
                flex: 1,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Katılımcıları Gör ({event?.participantCount || 0})
            </Button>
          </Stack>

          {isMobile && hasCoordinates ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<DirectionsRoundedIcon />}
              onClick={() => setDirectionsDialogOpen(true)}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                minHeight: 44,
                fontFamily: 'Open Sans',
                fontWeight: 800,
                width: '100%'
              }}
            >
              Yol Tarifi Al
            </Button>
          ) : null}
        </Stack>
      )}

      <Dialog
        open={participantsOpen}
        onClose={() => setParticipantsOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ ...fontStyle(900), fontSize: 22 }}>
          Katılımcılar
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ ...fontStyle(700), fontSize: 13, color: 'text.secondary', mb: 1 }}>
            Toplam Katılımcı (Misafir Dahil): {Number(event?.totalAttendance) || 0}
          </Typography>
          {!event?.participants || event.participants.length === 0 ? (
            <Typography sx={{ ...fontStyle(600), color: 'text.secondary' }}>
              Henüz katılımcı yok.
            </Typography>
          ) : (
            <Stack spacing={0.8}>
              {[...event.participants]
                .sort((a, b) => {
                  const nameA = (a?.user?.adSoyad || a?.user?.ePosta || a?.user?.matrikul || '').toLocaleLowerCase('tr')
                  const nameB = (b?.user?.adSoyad || b?.user?.ePosta || b?.user?.matrikul || '').toLocaleLowerCase('tr')
                  return nameA.localeCompare(nameB, 'tr')
                })
                .map((participant) => (
                <Paper key={(participant.user?._id || participant.user || participant._id || String(participant))} variant="outlined" sx={{ p: 1.1, borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      variant="rounded"
                      src={participant.user?.matrikul ? `/images/${participant.user.matrikul}.jpg` : ''}
                      alt={participant.user?.adSoyad || 'Profil'}
                      sx={{ width: 34, height: 34, borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)' }}
                    />
                    <Box>
                      <Typography sx={{ ...fontStyle(800), fontSize: 15 }}>
                        {participant.user?.adSoyad || participant.user?.ePosta || participant.user?.matrikul || 'Katılımcı'}
                      </Typography>
                      {Number(participant.guestCount) > 0 ? (
                        <Typography sx={{ ...fontStyle(600), fontSize: 12, color: 'text.secondary' }}>
                          +{Number(participant.guestCount)} misafir
                        </Typography>
                      ) : null}
                    </Box>
                  </Stack>
                </Paper>
                ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParticipantsOpen(false)} sx={{ textTransform: 'none' }}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={joinDialogOpen}
        onClose={() => !joinLoading && setJoinDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ ...fontStyle(900), fontSize: 22 }}>
          Katılım
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ ...fontStyle(600), color: 'text.secondary', fontSize: '0.8rem', mb: '20px' }}>
            Lütfen beraberinizde gelecek kişi sayısını belirtin.
          </Typography>
          <TextField
            fullWidth
            select
            label="Misafir Sayısı"
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value) || 0)}
            SelectProps={{ native: true }}
          >
            {Array.from({ length: 11 }, (_, index) => (
              <option key={index} value={index}>
                {index}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setJoinDialogOpen(false)}
            disabled={joinLoading}
            sx={{ textTransform: 'none' }}
          >
            Vazgeç
          </Button>
          <Button
            variant="contained"
            onClick={onJoin}
            disabled={joinLoading}
            sx={{ textTransform: 'none' }}
          >
            {joinLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={directionsDialogOpen}
        onClose={() => setDirectionsDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ ...fontStyle(900), fontSize: 22 }}>
          Yol Tarifi Al
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Button
              variant="outlined"
              onClick={() => openDirections('google')}
              startIcon={
                <Box
                  component="img"
                  src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=64"
                  alt="Google Maps"
                  sx={{ width: 18, height: 18, borderRadius: '4px' }}
                />
              }
              sx={{ textTransform: 'none', borderRadius: 2, minHeight: 42 }}
            >
              Google Maps
            </Button>
            <Button
              variant="outlined"
              onClick={() => openDirections('apple')}
              startIcon={
                <Box
                  component="img"
                  src="https://www.google.com/s2/favicons?domain=maps.apple.com&sz=64"
                  alt="Apple Maps"
                  sx={{ width: 18, height: 18, borderRadius: '4px' }}
                />
              }
              sx={{ textTransform: 'none', borderRadius: 2, minHeight: 42 }}
            >
              Apple Maps
            </Button>
            <Button
              variant="outlined"
              onClick={() => openDirections('yandex')}
              startIcon={
                <Box
                  component="img"
                  src="https://www.google.com/s2/favicons?domain=yandex.com&sz=64"
                  alt="Yandex Maps"
                  sx={{ width: 18, height: 18, borderRadius: '4px' }}
                />
              }
              sx={{ textTransform: 'none', borderRadius: 2, minHeight: 42 }}
            >
              Yandex Maps
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDirectionsDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EventDetail
