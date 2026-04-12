import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useRedux } from './redux/hooks'
import { changeMyPassword, signOut } from './redux/requests'

import {
  Alert,
  Box,
  Button,
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
  Typography
} from '@mui/material'
import EventRoundedIcon from '@mui/icons-material/EventRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'

const Security = () => {
  const navigate = useNavigate()
  const { xauth } = useRedux()
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordAgain, setNewPasswordAgain] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)

  if (!xauth) {
    return <Navigate to="/signin" replace />
  }

  const fontStyle = (weight) => ({
    fontFamily: 'Open Sans',
    fontOpticalSizing: 'auto',
    fontWeight: weight,
    fontStyle: 'normal'
  })

  const onSubmit = () => {
    if (!currentPassword || !newPassword || !newPasswordAgain) {
      setMessage({ type: 'error', text: 'Tüm alanlar zorunludur.' })
      return
    }

    if (newPassword !== newPasswordAgain) {
      setMessage({ type: 'error', text: 'Yeni şifre alanları eşleşmiyor.' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    changeMyPassword({
      currentPassword,
      newPassword,
      callback: (ok, errorMessage) => {
        setIsSaving(false)
        if (ok) {
          setCurrentPassword('')
          setNewPassword('')
          setNewPasswordAgain('')
          setMessage({ type: 'success', text: 'Şifreniz güncellendi.' })
        } else {
          setMessage({ type: 'error', text: errorMessage || 'Şifre güncellenemedi.' })
        }
      }
    })
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f7f9fc', py: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 1340, mx: 'auto', px: { xs: 1.4, sm: 2.2, md: 3 } }}>
        <Paper
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
              Güvenlik
            </Typography>
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
      </Box>

      <Box sx={{ width: '100%', maxWidth: 760, mx: 'auto', px: { xs: 1.4, md: 2.4 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid rgba(23,33,55,0.12)',
            background: '#fff',
            p: { xs: 1.4, md: 2.2 }
          }}
        >
          <Stack spacing={1.4}>
            <Typography sx={{ ...fontStyle(800), fontSize: 18 }}>
              Şifre Değiştir
            </Typography>

            {message && (
              <Alert severity={message.type}>
                {message.text}
              </Alert>
            )}

            <TextField
              label="Mevcut Şifre"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
            />
            <TextField
              label="Yeni Şifre"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
            />
            <TextField
              label="Yeni Şifre (Tekrar)"
              type="password"
              value={newPasswordAgain}
              onChange={(e) => setNewPasswordAgain(e.target.value)}
              fullWidth
            />

            <Button
              variant="contained"
              onClick={onSubmit}
              disabled={isSaving}
              sx={{
                ...fontStyle(800),
                textTransform: 'none',
                borderRadius: 2,
                alignSelf: 'flex-start',
                minWidth: 150
              }}
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}

export default Security
