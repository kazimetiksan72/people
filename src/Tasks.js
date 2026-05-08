import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useRedux } from './redux/hooks'
import { getUsers, signOut } from './redux/requests'

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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded'
import EventRoundedIcon from '@mui/icons-material/EventRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'

const formatDateTr = (value) => {
  if (!value) return '-'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return String(value)
  return dt.toLocaleDateString('tr-TR')
}

const Tasks = () => {
  const navigate = useNavigate()
  const { xauth, users, profile } = useRedux()
  const [menuOpen, setMenuOpen] = useState(false)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [createError, setCreateError] = useState('')
  const [content, setContent] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [assignedAt, setAssignedAt] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [rejectModal, setRejectModal] = useState({ open: false, taskId: '' })
  const [rejectReason, setRejectReason] = useState('')
  const [completeModal, setCompleteModal] = useState({ open: false, taskId: '' })
  const [completedAt, setCompletedAt] = useState(new Date().toISOString().slice(0, 10))

  const isKazim = String(profile?.ePosta || '').trim().toLowerCase() === 'kazim@pikselmutfak.com'
  const canSeeAyrilanlar = isKazim

  const fontStyle = (weight) => ({
    fontFamily: 'Open Sans',
    fontOpticalSizing: 'auto',
    fontWeight: weight,
    fontStyle: 'normal'
  })

  useEffect(() => {
    if (!xauth || users.length > 0) return
    getUsers({ callback: () => {} })
  }, [xauth, users.length])

  const fetchTasks = useCallback(async () => {
    if (!xauth) return
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/tasks', { headers: { xauth } })
      setTasks(Array.isArray(response.data) ? response.data : [])
    } catch (e) {
      setError('Görevler alınamadı.')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [xauth])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const assignableUsers = useMemo(() => users.filter((u) => u.listedeGorunsun !== false && !u.vefatEtti), [users])

  if (!xauth) return <Navigate to="/signin" replace />

  const onCreateTask = async () => {
    setCreateError('')
    if (!content.trim() || !assignedTo || !assignedAt || !dueDate) {
      setCreateError('Tüm alanlar zorunludur.')
      return
    }
    try {
      await axios.post('/api/tasks', {
        content: content.trim(),
        assignedTo,
        assignedAt,
        dueDate
      }, { headers: { xauth } })
      setOpenCreate(false)
      setContent('')
      setAssignedTo('')
      setDueDate('')
      fetchTasks()
    } catch (e) {
      setCreateError(e?.response?.data?.errorMessage || 'Görev atanamadı.')
    }
  }

  const patchTaskLocally = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)))
  }

  const onAccept = async (taskId) => {
    try {
      const response = await axios.post(`/api/tasks/${taskId}/accept`, {}, { headers: { xauth } })
      patchTaskLocally(response.data)
    } catch {}
  }

  const onReject = async () => {
    if (!rejectReason.trim()) return
    try {
      const response = await axios.post(`/api/tasks/${rejectModal.taskId}/reject`, { reason: rejectReason.trim() }, { headers: { xauth } })
      patchTaskLocally(response.data)
      setRejectModal({ open: false, taskId: '' })
      setRejectReason('')
    } catch {}
  }

  const onComplete = async () => {
    if (!completedAt) return
    try {
      const response = await axios.post(`/api/tasks/${completeModal.taskId}/complete`, { completedAt }, { headers: { xauth } })
      patchTaskLocally(response.data)
      setCompleteModal({ open: false, taskId: '' })
    } catch {}
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f7f9fc', py: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 1340, mx: 'auto', px: { xs: 1.4, sm: 2.2, md: 3 } }}>
        <Paper elevation={0} sx={{ position: 'sticky', top: 10, zIndex: 20, mb: 1.8, borderRadius: 3, border: '1px solid rgba(23,33,55,0.12)', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.72)', p: { xs: 1.2, md: 1.6 } }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={() => setMenuOpen(true)} sx={{ border: '1px solid rgba(23,33,55,0.18)', borderRadius: 2 }}>
                <MenuRoundedIcon />
              </IconButton>
              <Typography sx={{ ...fontStyle(900), fontSize: { xs: 21, md: 26 }, lineHeight: 1.05 }}>
                Görevler
              </Typography>
            </Stack>
            {isKazim ? (
              <Button variant="contained" onClick={() => setOpenCreate(true)} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>
                Görev Ata
              </Button>
            ) : null}
          </Stack>
        </Paper>

        <Drawer anchor="left" open={menuOpen} onClose={() => setMenuOpen(false)}>
          <Box sx={{ width: 280, p: 1.2, height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">
            <Typography sx={{ ...fontStyle(900), fontSize: 19, px: 1.2, py: 0.8 }}>Menü</Typography>
            <List>
              <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/') }}><ListItemIcon><PeopleAltRoundedIcon /></ListItemIcon><ListItemText primary="Kardeşler" /></ListItemButton></ListItem>
              <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/events') }}><ListItemIcon><EventRoundedIcon /></ListItemIcon><ListItemText primary="Etkinlikler" /></ListItemButton></ListItem>
              <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/security') }}><ListItemIcon><SecurityRoundedIcon /></ListItemIcon><ListItemText primary="Güvenlik" /></ListItemButton></ListItem>
              <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/hicbir-k-olmez') }}><ListItemIcon><FavoriteRoundedIcon /></ListItemIcon><ListItemText primary="Hiçbir K. Ölmez" /></ListItemButton></ListItem>
              {canSeeAyrilanlar ? <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/ayrilanlar') }}><ListItemIcon><PersonRemoveRoundedIcon /></ListItemIcon><ListItemText primary="Ayrılanlar" /></ListItemButton></ListItem> : null}
              <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/tasks') }}><ListItemIcon><AssignmentRoundedIcon /></ListItemIcon><ListItemText primary="Görevler" /></ListItemButton></ListItem>
            </List>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="contained" color="error" onClick={() => { setMenuOpen(false); signOut(); navigate('/signin', { replace: true }) }} sx={{ ...fontStyle(800), textTransform: 'none', borderRadius: 2, minHeight: 42, mx: 1, mb: 1 }}>Çıkış Yap</Button>
          </Box>
        </Drawer>

        <Stack spacing={1.1}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {loading ? <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Görevler yükleniyor...</Typography></Paper> : null}
          {!loading && tasks.length === 0 ? <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Görev bulunamadı.</Typography></Paper> : null}
          {!loading && tasks.map((task) => {
            const isMine = String(task.assignedTo) === String(profile?._id)
            const canAct = isMine && task.status !== 'Tamamlandı'
            return (
              <Paper key={task._id} variant="outlined" sx={{ p: 1.3, borderRadius: 2 }}>
                <Stack spacing={0.7}>
                  <Typography sx={{ ...fontStyle(900), fontSize: 16 }}>{task.content}</Typography>
                  <Typography sx={{ ...fontStyle(700), color: '#334155' }}>Üs. Muh. tarafından görev atanmıştır.</Typography>
                  <Typography sx={{ ...fontStyle(600), fontSize: 13 }}>Kardeş: {task.assignedToName || '-'}</Typography>
                  <Typography sx={{ ...fontStyle(600), fontSize: 13 }}>Atanma: {formatDateTr(task.assignedAt)} | Son Tarih: {formatDateTr(task.dueDate)}</Typography>
                  <Typography sx={{ ...fontStyle(700), fontSize: 13 }}>Statü: {task.status}</Typography>
                  {task.rejectionReason ? <Typography sx={{ ...fontStyle(600), fontSize: 13, color: '#991b1b' }}>Reddetme Mazereti: {task.rejectionReason}</Typography> : null}
                  {task.completedAt ? <Typography sx={{ ...fontStyle(600), fontSize: 13, color: '#166534' }}>Tamamlanma Tarihi: {formatDateTr(task.completedAt)}</Typography> : null}

                  {canAct && task.status === 'Yeni Atandı' ? (
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" onClick={() => onAccept(task._id)} sx={{ textTransform: 'none' }}>Kabul Et</Button>
                      <Button variant="outlined" color="error" onClick={() => { setRejectModal({ open: true, taskId: task._id }); setRejectReason('') }} sx={{ textTransform: 'none' }}>Reddet</Button>
                    </Stack>
                  ) : null}

                  {canAct && task.status === 'Yapılıyor' ? (
                    <Button variant="contained" color="success" onClick={() => { setCompleteModal({ open: true, taskId: task._id }) }} sx={{ textTransform: 'none', width: 'fit-content' }}>
                      Tamamlandı Olarak İşaretle
                    </Button>
                  ) : null}
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      </Box>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ ...fontStyle(900) }}>Görev Ata</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.1} sx={{ pt: 0.5 }}>
            {createError ? <Alert severity="error">{createError}</Alert> : null}
            <TextField label="Görev İçeriği" multiline minRows={2} value={content} onChange={(e) => setContent(e.target.value)} fullWidth />
            <TextField select label="Kardeş" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} fullWidth>
              {assignableUsers.map((u) => <MenuItem key={u._id} value={u._id}>{u.adSoyad}</MenuItem>)}
            </TextField>
            <TextField label="Görev Atanma Tarihi" type="date" value={assignedAt} onChange={(e) => setAssignedAt(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Tamamlanma Son Tarihi" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} sx={{ textTransform: 'none' }}>Vazgeç</Button>
          <Button onClick={onCreateTask} variant="contained" sx={{ textTransform: 'none' }}>Kaydet</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectModal.open} onClose={() => setRejectModal({ open: false, taskId: '' })} fullWidth maxWidth="xs">
        <DialogTitle sx={{ ...fontStyle(900) }}>Görevi Reddet</DialogTitle>
        <DialogContent dividers>
          <TextField label="Mazeret" multiline minRows={2} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectModal({ open: false, taskId: '' })} sx={{ textTransform: 'none' }}>Vazgeç</Button>
          <Button onClick={onReject} variant="contained" color="error" sx={{ textTransform: 'none' }}>Reddet</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={completeModal.open} onClose={() => setCompleteModal({ open: false, taskId: '' })} fullWidth maxWidth="xs">
        <DialogTitle sx={{ ...fontStyle(900) }}>Görevi Tamamla</DialogTitle>
        <DialogContent dividers>
          <TextField label="Tamamlanma Tarihi" type="date" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteModal({ open: false, taskId: '' })} sx={{ textTransform: 'none' }}>Vazgeç</Button>
          <Button onClick={onComplete} variant="contained" color="success" sx={{ textTransform: 'none' }}>Tamamlandı</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Tasks
