import { useMemo, useEffect, useState } from 'react'
import { useRedux } from './redux/hooks'
import { Navigate, useNavigate } from 'react-router-dom'
import { getUsers, signOut } from './redux/requests'

import SpinningCornerImage from './SpinningCornerImage'

import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItem,
  ListItemAvatar,
  Avatar,
  Typography,
  TextField,
  Paper,
  Chip,
  Stack
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import EventRoundedIcon from '@mui/icons-material/EventRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded'
import { keyframes } from '@emotion/react'

const printStyles = `
  .main {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    text-align: center;
  }

  body, html {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    background-image:
      linear-gradient(120deg, rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.52)),
      radial-gradient(circle at 15% 20%, rgba(188, 140, 58, 0.18), transparent 42%),
      url("./gonye.png");
    background-repeat: no-repeat;
    background-position: center center;
    background-size: cover;
    background-attachment: fixed;
  }

  @media print {
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @page {
      size: auto;
      margin: 0mm;
    }

    .no-print {
      display: none !important;
    }
  }
`

const normalize = (value) => (value || '').toString().toLowerCase().trim()

const rowEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const Home = () => {
  const navigate = useNavigate()
  const { xauth, users, profile } = useRedux()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!xauth || users.length > 0) {
      return
    }

    getUsers({ callback: () => {} })
  }, [xauth, users.length])

  const sortedUsers = useMemo(() => {
    return users
      .filter((u) => u.listedeGorunsun !== false && !u.vefatEtti)
      .sort((a, b) => Number(a.idaMatrikul) - Number(b.idaMatrikul))
  }, [users])

  const filteredUsers = useMemo(() => {
    const term = normalize(search)
    if (!term) {
      return sortedUsers
    }

    return sortedUsers.filter((p) => {
      const haystack = [p.adSoyad, p.matrikul, p.idaMatrikul, p.ePosta, p.tlfGsmEvIs]
        .map((x) => normalize(x))
        .join(' ')
      return haystack.includes(term)
    })
  }, [search, sortedUsers])

  if (!xauth) {
    return <Navigate to="/signin" replace />
  }

  const onDetail = (p) => {
    navigate(`/brother/${p.matrikul}`, { state: { person: p } })
  }

  const onPhone = (phone) => {
    if (!phone) return
    window.location.href = `tel:0${phone}`
  }

  const onWhatsapp = (phone, matrikul) => {
    if (!phone) return
    window.location.href = matrikul === '39285' ? `https://wa.me/1${phone}` : `https://wa.me/90${phone}`
  }

  const onEmail = (mail) => {
    if (!mail) return
    window.location.href = `mailto:${mail}`
  }

  const fontStyle = (weight) => ({
    fontFamily: 'Open Sans',
    fontOpticalSizing: 'auto',
    fontWeight: weight,
    fontStyle: 'normal'
  })
  const canSeeAyrilanlar = String(profile?.ePosta || '').trim().toLowerCase() === 'kazim@pikselmutfak.com'

  return (
    <div className="main">
      <style>{printStyles}</style>
      <SpinningCornerImage
        loading={users.length < 1}
        size={110}
        src="./olive.png"
        rpm={70}
      />

      <Box
        sx={{
          width: '100%',
          maxWidth: 1340,
          mx: 'auto',
          boxSizing: 'border-box',
          px: { xs: 1.4, sm: 2.2, md: 3 },
          pt: { xs: 1.4, md: 2.4 },
          pb: 3,
          textAlign: 'left'
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
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.2}
            alignItems={{ xs: 'stretch', md: 'center' }}
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

              <Box>
                <Typography sx={{ ...fontStyle(900), fontSize: { xs: 21, md: 26 }, lineHeight: 1.05 }}>
                  İDA Kardeş Listesi
                </Typography>
                <Typography sx={{ ...fontStyle(600), fontSize: 13, opacity: 0.72, mt: 0.3 }}>
                  Toplam {sortedUsers.length} kayıt
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              <TextField
                size="small"
                placeholder="Ad, matrikül, e-posta veya telefon ara"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.65 }} />
                }}
                sx={{
                  width: { xs: '100%', md: 420 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.88)'
                  }
                }}
              />
            </Stack>
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

        <Paper
          elevation={0}
          sx={{
            borderRadius: { xs: 2, md: 3 },
            border: '1px solid rgba(23,33,55,0.12)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.78))',
            overflow: 'hidden'
          }}
        >
          <List disablePadding>
            <ListItem
              sx={{
                display: { xs: 'none', md: 'grid' },
                gridTemplateColumns: '64px 100px 100px 1fr 220px 190px 108px',
                alignItems: 'center',
                gap: 1.5,
                py: 1.1,
                px: 2,
                backgroundColor: 'rgba(12,17,29,0.06)',
                borderBottom: '1px solid rgba(15,25,40,0.12)'
              }}
            >
              <Typography sx={{ ...fontStyle(700), fontSize: 12.5, letterSpacing: 0.2 }}>Fotoğraf</Typography>
              <Typography sx={{ ...fontStyle(700), fontSize: 12.5, letterSpacing: 0.2 }}>İDA</Typography>
              <Typography sx={{ ...fontStyle(700), fontSize: 12.5, letterSpacing: 0.2 }}>Matrikül</Typography>
              <Typography sx={{ ...fontStyle(700), fontSize: 12.5, letterSpacing: 0.2 }}>Ad Soyad</Typography>
              <Typography sx={{ ...fontStyle(700), fontSize: 12.5, letterSpacing: 0.2 }}>E-posta</Typography>
              <Typography sx={{ ...fontStyle(700), fontSize: 12.5, letterSpacing: 0.2 }}>Telefon</Typography>
              <Typography sx={{ ...fontStyle(700), fontSize: 12.5, letterSpacing: 0.2, textAlign: 'right' }}></Typography>
            </ListItem>

            {filteredUsers.length === 0 && (
              <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                <Typography sx={{ ...fontStyle(800), fontSize: 18 }}>Sonuç bulunamadı</Typography>
                <Typography sx={{ ...fontStyle(600), fontSize: 13.5, opacity: 0.75, mt: 0.5 }}>
                  Arama kelimesini değiştirerek tekrar deneyebilirsin.
                </Typography>
              </Box>
            )}

            {filteredUsers.map((p, idx) => (
              <Box key={p.matrikul}>
                <ListItem
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      onDetail(p)
                    }
                  }}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '56px 1fr',
                      md: '64px 100px 100px 1fr 220px 190px 108px'
                    },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    gap: { xs: 1.2, md: 1.5 },
                    py: { xs: 1.2, md: 1.3 },
                    px: { xs: 1.4, md: 2 },
                    backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.44)' : 'rgba(255,255,255,0.2)',
                    transition: 'background-color 220ms ease',
                    animation: `${rowEnter} 340ms ease both`,
                    animationDelay: `${Math.min(idx, 24) * 28}ms`,
                    '&:hover': {
                      backgroundColor: 'rgba(227, 237, 252, 0.58)'
                    }
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 'unset' }}>
                    <Avatar
                      variant="rounded"
                      alt={p.adSoyad}
                      src={`./images/${p.matrikul}.jpg`}
                      sx={{
                        width: { xs: 54, md: 52 },
                        height: { xs: 54, md: 52 },
                        borderRadius: 2,
                        border: '1px solid rgba(8,12,20,0.22)',
                        backgroundColor: 'rgba(255,255,255,0.7)'
                      }}
                    />
                  </ListItemAvatar>

                  <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                    <Typography className="notranslate" translate="no" sx={{ ...fontStyle(900), fontSize: 16.5, lineHeight: 1.2 }}>
                      {p.adSoyad}
                    </Typography>

                    <Stack direction="row" spacing={0.8} sx={{ mt: 0.6, flexWrap: 'wrap' }}>
                      <Chip size="small" label={`İDA ${p.idaMatrikul || '-'}`} sx={{ ...fontStyle(700), height: 22 }} />
                      <Chip size="small" label={`M ${p.matrikul || '-'}`} sx={{ ...fontStyle(700), height: 22 }} />
                    </Stack>

                    <Typography sx={{ ...fontStyle(500), fontSize: 13.2, opacity: 0.9, mt: 0.7 }}>
                      {p.tlfGsmEvIs}
                    </Typography>
                    <Typography sx={{ ...fontStyle(500), fontSize: 12.8, opacity: 0.88 }}>
                      {p.ePosta}
                    </Typography>

                    <Box
                      className="no-print"
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.8,
                        mt: 1
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          onPhone(p.tlfGsmEvIs)
                        }}
                        sx={{ ...fontStyle(700), textTransform: 'none', borderRadius: 2, flex: 1, minWidth: 0, px: 1 }}
                      >
                        Ara
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          onWhatsapp(p.tlfGsmEvIs, p.matrikul)
                        }}
                        sx={{ ...fontStyle(700), textTransform: 'none', borderRadius: 2, flex: 1, minWidth: 0, px: 1 }}
                      >
                        WhatsApp
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEmail(p.ePosta)
                        }}
                        sx={{ ...fontStyle(700), textTransform: 'none', borderRadius: 2, flex: 1, minWidth: 0, px: 1 }}
                      >
                        E-posta
                      </Button>
                    </Box>
                  </Box>

                  <Typography sx={{ display: { xs: 'none', md: 'block' }, ...fontStyle(700), fontSize: 13.5 }}>
                    {p.idaMatrikul}
                  </Typography>
                  <Typography sx={{ display: { xs: 'none', md: 'block' }, ...fontStyle(700), fontSize: 13.5 }}>
                    {p.matrikul}
                  </Typography>
                  <Typography className="notranslate" translate="no" sx={{ display: { xs: 'none', md: 'block' }, ...fontStyle(900), fontSize: 14 }}>
                    {p.adSoyad}
                  </Typography>

                  <Typography
                    component="button"
                    type="button"
                    onClick={() => onEmail(p.ePosta)}
                    title={p.ePosta}
                    sx={{
                      display: { xs: 'none', md: 'block' },
                      ...fontStyle(500),
                      fontSize: 13.5,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      background: 'transparent',
                      border: 'none',
                      p: 0,
                      m: 0,
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'inherit',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {p.ePosta}
                  </Typography>

                  <Typography sx={{ display: { xs: 'none', md: 'block' }, ...fontStyle(500), fontSize: 13.5 }}>
                    {p.tlfGsmEvIs}
                  </Typography>

                  <Box className="no-print" sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={() => onDetail(p)}
                      sx={{
                        ...fontStyle(700),
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 1.8,
                        whiteSpace: 'nowrap',
                        backgroundColor: '#111827',
                        '&:hover': { backgroundColor: '#1f2937' }
                      }}
                    >
                      Detay
                    </Button>
                  </Box>
                </ListItem>

                {idx !== filteredUsers.length - 1 && (
                  <Divider sx={{ borderColor: 'rgba(0,0,0,0.18)' }} />
                )}
              </Box>
            ))}
          </List>
        </Paper>

      </Box>
    </div>
  )
}

export default Home
