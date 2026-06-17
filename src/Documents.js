import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
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
  LinearProgress,
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
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import EventRoundedIcon from '@mui/icons-material/EventRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'

const fontStyle = (weight) => ({
  fontFamily: 'Open Sans',
  fontOpticalSizing: 'auto',
  fontWeight: weight,
  fontStyle: 'normal'
})

const degreeLabels = {
  1: 'Çırak',
  2: 'Kalfa',
  3: 'Üstat'
}

const formatBytes = (value) => {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes <= 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDateTr = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`

const Documents = () => {
  const navigate = useNavigate()
  const { xauth, profile } = useRedux()
  const fileInputRef = useRef(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [documentDegree, setDocumentDegree] = useState('1')
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [openingId, setOpeningId] = useState('')
  const [editDocument, setEditDocument] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDegree, setEditDegree] = useState('1')
  const [editError, setEditError] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deleteDocument, setDeleteDocument] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const profileEmail = String(profile?.ePosta || '').trim().toLowerCase()
  const isKazim = profileEmail === 'kazim@pikselmutfak.com'
  const canSeeAyrilanlar = isKazim

  const totalUploadProgress = useMemo(() => {
    if (selectedFiles.length === 0) return 0
    const total = selectedFiles.reduce((sum, file) => sum + (uploadProgress[fileKey(file)]?.progress || 0), 0)
    return Math.round(total / selectedFiles.length)
  }, [selectedFiles, uploadProgress])

  const fetchDocuments = useCallback(async () => {
    if (!xauth) return
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/documents', { headers: { xauth } })
      setDocuments(Array.isArray(response.data) ? response.data : [])
    } catch (e) {
      setDocuments([])
      setError(e?.response?.data?.errorMessage || 'Dokümanlar alınamadı.')
    } finally {
      setLoading(false)
    }
  }, [xauth])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  if (!xauth) return <Navigate to="/signin" replace />

  const openUploadDialog = () => {
    setUploadError('')
    setSelectedFiles([])
    setUploadProgress({})
    setDocumentDegree('1')
    setDragActive(false)
    setUploadOpen(true)
  }

  const addFiles = (incomingFiles) => {
    const files = Array.from(incomingFiles || []).filter((file) => /\.(pdf|doc|docx|xls|xlsx)$/i.test(file.name))
    if (files.length === 0) {
      setUploadError('Sadece PDF, Word ve Excel dokümanları yüklenebilir.')
      return
    }

    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map(fileKey))
      const uniqueFiles = files.filter((file) => !existingKeys.has(fileKey(file)))
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
      delete next[fileKey(fileToRemove)]
      return next
    })
  }

  const onUploadFiles = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadError('')
    setUploadProgress(Object.fromEntries(selectedFiles.map((file) => [
      fileKey(file),
      { progress: 0, status: 'Bekliyor' }
    ])))

    try {
      for (const file of selectedFiles) {
        const key = fileKey(file)
        const formData = new FormData()
        formData.append('degree', documentDegree)
        formData.append('files', file)

        setUploadProgress((prev) => ({ ...prev, [key]: { progress: 0, status: 'Yükleniyor' } }))
        await axios.post('/api/documents', formData, {
          headers: {
            xauth,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
            setUploadProgress((prev) => ({ ...prev, [key]: { progress, status: 'Yükleniyor' } }))
          }
        })
        setUploadProgress((prev) => ({ ...prev, [key]: { progress: 100, status: 'Tamamlandı' } }))
      }

      await fetchDocuments()
      setSelectedFiles([])
      setUploadOpen(false)
    } catch (e) {
      const message = e?.response?.data?.errorMessage || 'Doküman yüklenemedi.'
      setUploadError(message)
      setUploadProgress((prev) => {
        const next = { ...prev }
        const failedKey = Object.keys(next).find((key) => next[key].status === 'Yükleniyor')
        if (failedKey) next[failedKey] = { ...next[failedKey], status: message }
        return next
      })
    } finally {
      setIsUploading(false)
    }
  }

  const onOpenDocument = async (document) => {
    setOpeningId(document._id)
    setError('')
    try {
      const response = await axios.get(`/api/documents/${document._id}/download`, {
        headers: { xauth },
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: document.contentType || response.data.type || 'application/octet-stream' })
      const blobUrl = URL.createObjectURL(blob)
      const isPdf = String(document.fileName || '').toLowerCase().endsWith('.pdf')

      if (isPdf) {
        window.open(blobUrl, '_blank', 'noopener,noreferrer')
      } else {
        const link = window.document.createElement('a')
        link.href = blobUrl
        link.download = document.fileName || 'dokuman'
        window.document.body.appendChild(link)
        link.click()
        link.remove()
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch (e) {
      setError(e?.response?.data?.errorMessage || 'Doküman açılamadı.')
    } finally {
      setOpeningId('')
    }
  }

  const openEditDialog = (document) => {
    setEditDocument(document)
    setEditTitle(document.title || '')
    setEditDegree(String(document.degree || '1'))
    setEditError('')
  }

  const onSaveDocument = async () => {
    if (!editDocument) return

    setIsSavingEdit(true)
    setEditError('')
    try {
      const response = await axios.put(`/api/documents/${editDocument._id}`, {
        title: editTitle,
        degree: editDegree
      }, { headers: { xauth } })

      setDocuments((prev) => prev.map((document) => document._id === editDocument._id ? response.data : document))
      setEditDocument(null)
    } catch (e) {
      setEditError(e?.response?.data?.errorMessage || 'Doküman güncellenemedi.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const openDeleteDialog = (document) => {
    setDeleteDocument(document)
    setDeleteError('')
  }

  const onDeleteDocument = async () => {
    if (!deleteDocument) return

    setIsDeleting(true)
    setDeleteError('')
    try {
      await axios.delete(`/api/documents/${deleteDocument._id}`, { headers: { xauth } })
      setDocuments((prev) => prev.filter((document) => document._id !== deleteDocument._id))
      setDeleteDocument(null)
    } catch (e) {
      setDeleteError(e?.response?.data?.errorMessage || 'Doküman silinemedi.')
    } finally {
      setIsDeleting(false)
    }
  }

  const drawer = (
    <Drawer anchor="left" open={menuOpen} onClose={() => setMenuOpen(false)}>
      <Box sx={{ width: 280, p: 1.2, height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">
        <Typography sx={{ ...fontStyle(900), fontSize: 19, px: 1.2, py: 0.8 }}>Menü</Typography>
        <List>
          <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/') }}><ListItemIcon><PeopleAltRoundedIcon /></ListItemIcon><ListItemText primary="Kardeşler" /></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/medya') }}><ListItemIcon><AutoAwesomeRoundedIcon /></ListItemIcon><ListItemText primary="Medya" /></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton onClick={() => { setMenuOpen(false); navigate('/documents') }}><ListItemIcon><DescriptionRoundedIcon /></ListItemIcon><ListItemText primary="Dokümanlar" /></ListItemButton></ListItem>
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
  )

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f7f9fc', py: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto', px: { xs: 1.4, sm: 2.2, md: 3 } }}>
        <Paper elevation={0} sx={{ mb: 1.4, p: { xs: 1.4, sm: 1.8 }, borderRadius: 3, border: '1px solid rgba(23,33,55,0.10)', background: 'linear-gradient(135deg, #ffffff 0%, #eef6ff 100%)' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.2}>
            <Stack direction="row" alignItems="center" spacing={1.1}>
              <IconButton onClick={() => setMenuOpen(true)} sx={{ border: '1px solid rgba(23,33,55,0.18)', borderRadius: 2 }}>
                <MenuRoundedIcon />
              </IconButton>
              <Box>
                <Typography sx={{ ...fontStyle(900), fontSize: { xs: 24, md: 30 }, color: '#17233c', lineHeight: 1 }}>
                  Dokümanlar
                </Typography>
                <Typography sx={{ ...fontStyle(700), color: '#64748b', fontSize: 13, mt: 0.45 }}>
                  Derecenize uygun dokümanlar
                </Typography>
              </Box>
            </Stack>
            {isKazim ? (
              <Button variant="contained" startIcon={<CloudUploadRoundedIcon />} onClick={openUploadDialog} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>
                Doküman Ekle
              </Button>
            ) : null}
          </Stack>
        </Paper>

        {drawer}
        {error ? <Alert severity="error" sx={{ mb: 1.2 }}>{error}</Alert> : null}

        {loading ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Dokümanlar yükleniyor...</Typography></Paper>
        ) : documents.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography sx={{ ...fontStyle(700) }}>Görüntüleyebileceğiniz doküman bulunmuyor.</Typography></Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.2 }}>
            {documents.map((document) => (
              <Paper key={document._id} variant="outlined" sx={{ p: 1.5, borderRadius: 3, backgroundColor: '#fff', borderColor: 'rgba(37,99,235,0.16)' }}>
                <Stack spacing={1.1}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', color: '#2563eb', backgroundColor: 'rgba(37,99,235,0.12)', flexShrink: 0 }}>
                      <InsertDriveFileRoundedIcon />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ ...fontStyle(900), fontSize: 17, color: '#17233c', lineHeight: 1.2, wordBreak: 'break-word' }}>
                        {document.title || document.fileName}
                      </Typography>
                      <Typography sx={{ ...fontStyle(700), fontSize: 12, color: '#64748b', mt: 0.4 }}>
                        Derece {document.degree} - {degreeLabels[document.degree] || '-'} | {formatBytes(document.size)} | {formatDateTr(document.createdAt)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.8}>
                    <Button variant="outlined" onClick={() => onOpenDocument(document)} disabled={openingId === document._id} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800), flex: 1 }}>
                      {openingId === document._id ? 'Açılıyor...' : 'Görüntüle'}
                    </Button>
                    {isKazim ? (
                      <>
                        <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => openEditDialog(document)} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800), flex: 1 }}>
                          Düzenle
                        </Button>
                        <Button variant="outlined" color="error" startIcon={<DeleteRoundedIcon />} onClick={() => openDeleteDialog(document)} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800), flex: 1 }}>
                          Sil
                        </Button>
                      </>
                    ) : null}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Box>
        )}

        <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: 'none' }} onChange={(e) => addFiles(e.target.files)} />
      </Box>

      <Dialog open={uploadOpen} onClose={() => !isUploading && setUploadOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ ...fontStyle(900) }}>Doküman Ekle</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.4}>
            {uploadError ? <Alert severity="error">{uploadError}</Alert> : null}
            <TextField select label="Derece" value={documentDegree} onChange={(e) => setDocumentDegree(e.target.value)} fullWidth>
              <MenuItem value="1">Çırak</MenuItem>
              <MenuItem value="2">Kalfa</MenuItem>
              <MenuItem value="3">Üstat</MenuItem>
            </TextField>
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
              <Typography sx={{ ...fontStyle(900), fontSize: 18 }}>PDF, Word ve Excel dokümanlarını buraya sürükle bırak</Typography>
              <Typography sx={{ ...fontStyle(600), color: '#64748b', mt: 0.5, mb: 2 }}>Dokümanları bilgisayarınızdan seçip yükleyebilirsiniz.</Typography>
              <Button variant="outlined" onClick={onPickFiles} disabled={isUploading} sx={{ textTransform: 'none', borderRadius: 2, ...fontStyle(800) }}>Dosya Seç</Button>
            </Box>
            {selectedFiles.length > 0 ? (
              <Stack spacing={0.8}>
                {selectedFiles.map((file) => {
                  const progress = uploadProgress[fileKey(file)]
                  return (
                    <Paper key={fileKey(file)} variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                      <Stack spacing={0.7}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Typography sx={{ ...fontStyle(800), fontSize: 13, wordBreak: 'break-word' }}>{file.name}</Typography>
                          <Button size="small" onClick={() => removeSelectedFile(file)} disabled={isUploading} sx={{ textTransform: 'none' }}>Kaldır</Button>
                        </Stack>
                        <LinearProgress variant="determinate" value={progress?.progress || 0} sx={{ height: 7, borderRadius: 99 }} />
                        <Typography sx={{ ...fontStyle(700), fontSize: 12, color: '#64748b' }}>
                          {progress?.status || 'Bekliyor'} - %{progress?.progress || 0}
                        </Typography>
                      </Stack>
                    </Paper>
                  )
                })}
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

      <Dialog open={Boolean(editDocument)} onClose={() => !isSavingEdit && setEditDocument(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ ...fontStyle(900) }}>Dokümanı Düzenle</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.4}>
            {editError ? <Alert severity="error">{editError}</Alert> : null}
            <TextField label="Doküman İsmi" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} fullWidth autoFocus />
            <TextField select label="Derece" value={editDegree} onChange={(e) => setEditDegree(e.target.value)} fullWidth>
              <MenuItem value="1">Çırak</MenuItem>
              <MenuItem value="2">Kalfa</MenuItem>
              <MenuItem value="3">Üstat</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDocument(null)} disabled={isSavingEdit} sx={{ textTransform: 'none' }}>Vazgeç</Button>
          <Button variant="contained" onClick={onSaveDocument} disabled={isSavingEdit || !editTitle.trim()} sx={{ textTransform: 'none' }}>
            {isSavingEdit ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteDocument)} onClose={() => !isDeleting && setDeleteDocument(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ ...fontStyle(900) }}>Dokümanı Sil</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2}>
            {deleteError ? <Alert severity="error">{deleteError}</Alert> : null}
            <Typography sx={{ ...fontStyle(700), color: '#17233c' }}>
              Bu dokümanı silmek istediğinizden emin misiniz?
            </Typography>
            <Typography sx={{ ...fontStyle(900), color: '#17233c', wordBreak: 'break-word' }}>
              {deleteDocument?.title || deleteDocument?.fileName}
            </Typography>
            <Alert severity="warning">Bu işlem dokümanı Azure Storage üzerinden de siler.</Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDocument(null)} disabled={isDeleting} sx={{ textTransform: 'none' }}>Vazgeç</Button>
          <Button variant="contained" color="error" onClick={onDeleteDocument} disabled={isDeleting} sx={{ textTransform: 'none' }}>
            {isDeleting ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Documents
