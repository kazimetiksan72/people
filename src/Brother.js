import { useEffect, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { keyframes } from '@emotion/react'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import WorkRoundedIcon from '@mui/icons-material/WorkRounded'
import EventRoundedIcon from '@mui/icons-material/EventRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import BloodtypeRoundedIcon from '@mui/icons-material/BloodtypeRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import FamilyRestroomRoundedIcon from '@mui/icons-material/FamilyRestroomRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'

import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useRedux } from './redux/hooks'
import { getUsers, updateMyProfile } from './redux/requests'

const safeText = (value) => {
  if (value === null || value === undefined) return '-'
  const text = String(value).trim()
  return text.length > 0 ? text : '-'
}

const normalizePhoneDigits = (phone) => {
  if (!phone) return ''
  return String(phone).replace(/\D/g, '')
}

const getWhatsAppNumber = (phone) => {
  const digits = normalizePhoneDigits(phone)
  if (!digits) return ''

  const normalized = digits.startsWith('0') ? digits.slice(1) : digits
  if (normalized.length === 10) return `90${normalized}`
  if (normalized.startsWith('90') && normalized.length >= 12) return normalized
  return normalized
}

const formatLongDateTr = (value) => {
  if (!value) return ''

  const text = String(value).trim()
  if (!text) return ''

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]

  const formatByParts = (day, month, year) => {
    const d = Number(day)
    const m = Number(month)
    const y = Number(year)
    if (!d || !m || !y || m < 1 || m > 12) return ''
    return `${d} ${monthNames[m - 1]} ${y}`
  }

  const trMatch = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (trMatch) {
    return formatByParts(trMatch[1], trMatch[2], trMatch[3]) || text
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return formatByParts(isoMatch[3], isoMatch[2], isoMatch[1]) || text
  }

  return text
}

const KAN_GRUBU_OPTIONS = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-']
const MEDENI_HAL_OPTIONS = ['Evli', 'Bekar']

const heroEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const chipEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

const parseDateForInput = (value) => {
  if (!value) return { dateValue: '', rawValue: '' }

  const text = String(value).trim()
  if (!text) return { dateValue: '', rawValue: '' }

  // Already yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return { dateValue: text, rawValue: '' }

  // dd.mm.yyyy / dd/mm/yyyy / dd-mm-yyyy
  const trMatch = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (trMatch) {
    const [, d, m, y] = trMatch
    return { dateValue: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, rawValue: '' }
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return { dateValue: `${y}-${m}-${d}`, rawValue: '' }
  }

  return { dateValue: '', rawValue: text }
}

const normalizeKanGrubu = (value) => {
  if (!value) return ''
  const raw = String(value).trim().toUpperCase()
  const compact = raw.replace(/\s+/g, '')
  const normalized = compact
    .replace(/\(\+\)/g, '+')
    .replace(/\(-\)/g, '-')
    .replace(/O/g, '0')

  const groupMatch = normalized.match(/^(AB|A|B|0)/)
  const signMatch = normalized.match(/([+-])$/)
  if (!groupMatch || !signMatch) return ''

  return `${groupMatch[1]} Rh${signMatch[1]}`
}

const normalizeMedeniHali = (value) => {
  if (!value) return ''
  const raw = String(value).trim().toLowerCase()
  if (raw === 'evli') return 'Evli'
  if (raw === 'bekar') return 'Bekar'
  return ''
}

const getChildrenFromUser = (user) => {
  if (Array.isArray(user?.cocukBilgileri) && user.cocukBilgileri.length > 0) {
    return user.cocukBilgileri.map((child) => ({
      ad: String(child?.ad || ''),
      dogumTarihi: parseDateForInput(child?.dogumTarihi || '').dateValue
    }))
  }

  const names = String(user?.cocuklar || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  const birthDates = String(user?.dogumTarihleri || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  const maxLen = Math.max(names.length, birthDates.length)
  if (maxLen === 0) return [{ ad: '', dogumTarihi: '' }]

  return Array.from({ length: maxLen }, (_, index) => ({
    ad: names[index] || '',
    dogumTarihi: parseDateForInput(birthDates[index] || '').dateValue
  }))
}

function InfoRow({ icon, label, value, link }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2, py: 0.85 }}>
      <Box sx={{ mt: 0.2, color: '#3a4760' }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontFamily: 'Open Sans', fontSize: 12, fontWeight: 700, color: '#5a6474' }}>
          {label}
        </Typography>
        {link ? (
          <Typography
            component="a"
            href={link}
            sx={{
              fontFamily: 'Open Sans',
              fontSize: 15,
              fontWeight: 700,
              color: '#111827',
              textDecoration: 'none',
              wordBreak: 'break-word',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {safeText(value)}
          </Typography>
        ) : (
          <Typography sx={{ fontFamily: 'Open Sans', fontSize: 15, fontWeight: 700, color: '#111827', wordBreak: 'break-word' }}>
            {safeText(value)}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

function InfoCard({ title, rows }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid rgba(24,35,58,0.12)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.8))',
        p: { xs: 1.5, md: 2 }
      }}
    >
      <Typography sx={{ fontFamily: 'Open Sans', fontSize: 18, fontWeight: 900, color: '#131f35', mb: 0.8 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 0.6, borderColor: 'rgba(22,34,54,0.12)' }} />
      {rows.map((row) => (
        <InfoRow key={row.label} {...row} />
      ))}
    </Paper>
  )
}

export default function Brother() {
  const navigate = useNavigate()
  const { users, xauth, profile } = useRedux()
  const { matrikul } = useParams()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [rawDateHints, setRawDateHints] = useState({
    dogumTarihi: '',
    dogumTarihi2: ''
  })
  const [formData, setFormData] = useState({
    dogumTarihi: '',
    dogumYeri: '',
    kanGrubu: '',
    meslegi: '',
    isi: '',
    isAdresi: '',
    medeniHali: '',
    esininAdi: '',
    dogumTarihi2: '',
    evAdresi: '',
    cocukBilgileri: [{ ad: '', dogumTarihi: '' }]
  })

  useEffect(() => {
    if (!xauth || users.length > 0) return
    getUsers({ callback: () => {} })
  }, [xauth, users.length])

  if (!xauth) {
    return <Navigate to="/signin" replace />
  }

  const user = users.find((u) => u.matrikul === matrikul)
  const isLoading = users.length === 0

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '65vh', display: 'grid', placeItems: 'center' }}>
        <Stack spacing={1.1} alignItems="center">
          <CircularProgress size={30} />
          <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 800, color: '#23324d' }}>Detay yükleniyor...</Typography>
        </Stack>
      </Box>
    )
  }

  if (!user) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(24,35,58,0.12)', p: 2.2 }}>
          <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 900, fontSize: 24, color: '#17233c' }}>Kayıt bulunamadı</Typography>
          <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 600, mt: 0.5, color: '#4b5563' }}>
            Bu matrikül numarasına ait kayıt yok.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate('/')}
            sx={{ mt: 1.8, textTransform: 'none', borderRadius: 2, fontFamily: 'Open Sans', fontWeight: 800 }}
          >
            Listeye dön
          </Button>
        </Paper>
      </Box>
    )
  }

  const phoneDigits = normalizePhoneDigits(user.tlfGsmEvIs)
  const waNumber = getWhatsAppNumber(user.tlfGsmEvIs)
  const waLink = waNumber ? `https://wa.me/${waNumber}` : ''
  const avatarSrc = `/images/${safeText(user.matrikul)}.jpg`
  const isAdmin = profile?.role === 'admin'
  const isOwnProfile = Boolean(profile?.matrikul) && String(profile.matrikul) === String(user.matrikul)
  const canEditProfile = isAdmin || isOwnProfile

  const openEditDialog = () => {
    setFormError('')
    const parsedDogumTarihi = parseDateForInput(user.dogumTarihi)
    const parsedEsDogumTarihi = parseDateForInput(user.dogumTarihi2)

    setRawDateHints({
      dogumTarihi: parsedDogumTarihi.rawValue,
      dogumTarihi2: parsedEsDogumTarihi.rawValue
    })

    setFormData({
      dogumTarihi: parsedDogumTarihi.dateValue,
      dogumYeri: user.dogumYeri || '',
      kanGrubu: normalizeKanGrubu(user.kanGrubu),
      meslegi: user.meslegi || '',
      isi: user.isi || '',
      isAdresi: user.isAdresi || '',
      medeniHali: normalizeMedeniHali(user.medeniHali),
      esininAdi: user.esininAdi || '',
      dogumTarihi2: parsedEsDogumTarihi.dateValue,
      evAdresi: user.evAdresi || '',
      cocukBilgileri: getChildrenFromUser(user)
    })
    setIsEditOpen(true)
  }

  const updateChildField = (index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      cocukBilgileri: prev.cocukBilgileri.map((child, i) => (
        i === index ? { ...child, [key]: value } : child
      ))
    }))
  }

  const addChildRow = () => {
    setFormData((prev) => ({
      ...prev,
      cocukBilgileri: [...prev.cocukBilgileri, { ad: '', dogumTarihi: '' }]
    }))
  }

  const removeChildRow = (index) => {
    setFormData((prev) => {
      const next = prev.cocukBilgileri.filter((_, i) => i !== index)
      return {
        ...prev,
        cocukBilgileri: next.length > 0 ? next : [{ ad: '', dogumTarihi: '' }]
      }
    })
  }

  const onSaveProfile = () => {
    setIsSaving(true)
    setFormError('')

    updateMyProfile({
      userId: user._id,
      payload: {
        ...formData,
        dogumTarihi: formData.dogumTarihi || rawDateHints.dogumTarihi || '',
        dogumTarihi2: formData.dogumTarihi2 || rawDateHints.dogumTarihi2 || '',
        cocukBilgileri: formData.cocukBilgileri
          .map((child) => ({
            ad: String(child?.ad || '').trim(),
            dogumTarihi: String(child?.dogumTarihi || '').trim()
          }))
          .filter((child) => child.ad || child.dogumTarihi)
      },
      callback: (ok) => {
        setIsSaving(false)
        if (!ok) {
          setFormError('Güncelleme sırasında bir hata oluştu.')
          return
        }

        setIsEditOpen(false)
      }
    })
  }

  const sections = [
    {
      title: 'Kimlik Bilgileri',
      rows: [
        { label: 'Ad Soyad', value: user.adSoyad, icon: <PersonRoundedIcon fontSize="small" /> },
        { label: 'İDA Matrikül', value: user.idaMatrikul, icon: <BadgeRoundedIcon fontSize="small" /> },
        { label: 'Matrikül', value: user.matrikul, icon: <BadgeRoundedIcon fontSize="small" /> },
        { label: 'Tekris Tarihi', value: formatLongDateTr(user.tekrisTarihi), icon: <EventRoundedIcon fontSize="small" /> }
      ]
    },
    {
      title: 'Doğum ve Sağlık',
      rows: [
        { label: 'Doğum Tarihi', value: formatLongDateTr(user.dogumTarihi), icon: <EventRoundedIcon fontSize="small" /> },
        { label: 'Doğum Yeri', value: user.dogumYeri, icon: <LocationOnRoundedIcon fontSize="small" /> },
        { label: 'Kan Grubu', value: user.kanGrubu, icon: <BloodtypeRoundedIcon fontSize="small" /> }
      ]
    },
    {
      title: 'İş Bilgileri',
      rows: [
        { label: 'Mesleği', value: user.meslegi, icon: <WorkRoundedIcon fontSize="small" /> },
        { label: 'İşi', value: user.isi, icon: <WorkRoundedIcon fontSize="small" /> },
        { label: 'İş Adresi', value: user.isAdresi, icon: <WorkRoundedIcon fontSize="small" /> }
      ]
    },
    {
      title: 'Aile Bilgileri',
      rows: [
        { label: 'Medeni Hali', value: user.medeniHali, icon: <FamilyRestroomRoundedIcon fontSize="small" /> },
        { label: 'Eşinin Adı', value: user.esininAdi, icon: <FamilyRestroomRoundedIcon fontSize="small" /> },
        { label: 'Eşinin Doğum Tarihi', value: formatLongDateTr(user.dogumTarihi2), icon: <EventRoundedIcon fontSize="small" /> },
        { label: 'Çocuklar', value: user.cocuklar, icon: <FamilyRestroomRoundedIcon fontSize="small" /> },
        { label: 'Çocukların Doğum Tarihleri', value: user.dogumTarihleri, icon: <EventRoundedIcon fontSize="small" /> }
      ]
    },
    {
      title: 'İletişim ve Adres',
      rows: [
        { label: 'Telefon', value: user.tlfGsmEvIs, icon: <PhoneRoundedIcon fontSize="small" />, link: phoneDigits ? `tel:${phoneDigits}` : undefined },
        { label: 'E-posta', value: user.ePosta, icon: <EmailRoundedIcon fontSize="small" />, link: user.ePosta ? `mailto:${user.ePosta}` : undefined },
        { label: 'Ev Adresi', value: user.evAdresi, icon: <HomeRoundedIcon fontSize="small" /> },
        { label: 'İş Adresi', value: user.isAdresi, icon: <WorkRoundedIcon fontSize="small" /> }
      ]
    }
  ]

  const actionButtons = [
    {
      key: 'call',
      label: 'Ara',
      icon: <PhoneRoundedIcon />,
      variant: 'outlined',
      href: phoneDigits ? `tel:${phoneDigits}` : undefined
    },
    {
      key: 'email',
      label: 'E-posta',
      icon: <EmailRoundedIcon />,
      variant: 'outlined',
      href: user.ePosta ? `mailto:${user.ePosta}` : undefined
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: <WhatsAppIcon />,
      variant: 'contained',
      href: waLink || undefined,
      external: true
    }
  ]

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 1.3, md: 2.7 },
        py: { xs: 1.2, md: 2.2 },
        background:
          'linear-gradient(160deg, rgba(226,205,160,0.28), rgba(230,238,249,0.72) 35%, rgba(214,228,245,0.86) 100%)'
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '1px solid rgba(24,35,58,0.14)',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.82))',
            animation: `${heroEnter} 420ms ease both`
          }}
        >
          <Box sx={{ p: { xs: 1.2, md: 2 } }}>
            <Button
              className="no-print"
              variant="text"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate('/')}
              sx={{ textTransform: 'none', fontFamily: 'Open Sans', fontWeight: 800, borderRadius: 2 }}
            >
              Listeye dön
            </Button>
          </Box>

          <Grid container>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  px: { xs: 1.4, md: 2 },
                  pb: { xs: 1.4, md: 2 },
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <Avatar
                  src={avatarSrc}
                  alt={safeText(user.adSoyad)}
                  variant="rounded"
                  sx={{
                    width: { xs: '100%', sm: 280, md: '100%' },
                    maxWidth: 320,
                    height: { xs: 360, sm: 360, md: 430 },
                    borderRadius: 3,
                    border: '1px solid rgba(20,30,50,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    fontFamily: 'Open Sans',
                    fontWeight: 800,
                    fontSize: 34
                  }}
                >
                  {safeText(user.adSoyad)
                    .split(' ')
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join('')}
                </Avatar>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <Box sx={{ p: { xs: 1.4, md: 2.2 } }}>
                <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 900, fontSize: { xs: 28, md: 38 }, color: '#0f1a2e', lineHeight: 1.03 }}>
                  {safeText(user.adSoyad)}
                </Typography>

                <Stack direction="row" spacing={0.8} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.7 }}>
                  <Chip
                    label={`İDA ${safeText(user.idaMatrikul)}`}
                    icon={<BadgeRoundedIcon />}
                    sx={{ fontFamily: 'Open Sans', fontWeight: 800, animation: `${chipEnter} 360ms ease both`, animationDelay: '120ms' }}
                  />
                  <Chip
                    label={`Matrikül ${safeText(user.matrikul)}`}
                    icon={<BadgeRoundedIcon />}
                    sx={{ fontFamily: 'Open Sans', fontWeight: 800, animation: `${chipEnter} 360ms ease both`, animationDelay: '170ms' }}
                  />
                  {user.tekrisTarihi ? (
                    <Chip
                      label={`Tekris ${safeText(user.tekrisTarihi)}`}
                      icon={<EventRoundedIcon />}
                      sx={{ fontFamily: 'Open Sans', fontWeight: 800, animation: `${chipEnter} 360ms ease both`, animationDelay: '220ms' }}
                    />
                  ) : null}
                </Stack>

                <Typography sx={{ mt: 1.3, fontFamily: 'Open Sans', fontSize: 15, fontWeight: 600, color: '#374151' }}>
                  Üye iletişim bilgileri ve tüm detaylar aşağıdaki bölümlerde yer alır.
                </Typography>

                <Box
                  className="no-print"
                  sx={{
                    mt: 1.1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 1
                  }}
                >
                  {actionButtons.map((action) => (
                    <Button
                      key={action.key}
                      fullWidth
                      variant={action.variant}
                      startIcon={action.icon}
                      href={action.href}
                      target={action.external ? '_blank' : undefined}
                      rel={action.external ? 'noopener noreferrer' : undefined}
                      disabled={!action.href}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontFamily: 'Open Sans',
                        fontWeight: 800,
                        minHeight: 44,
                        minWidth: 0,
                        px: { xs: 1, sm: 1.4 },
                        whiteSpace: 'nowrap',
                        ...(action.key === 'whatsapp' && action.href
                          ? {
                              backgroundColor: '#166534',
                              '&:hover': { backgroundColor: '#14532d' }
                            }
                          : {})
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Box>

                {canEditProfile ? (
                  <Button
                    className="no-print"
                    fullWidth
                    variant="contained"
                    startIcon={<EditRoundedIcon />}
                    onClick={openEditDialog}
                    sx={{
                      mt: 1,
                      textTransform: 'none',
                      borderRadius: 2,
                      fontFamily: 'Open Sans',
                      fontWeight: 800,
                      minHeight: 44
                    }}
                  >
                    Bilgilerimi Güncelle
                  </Button>
                ) : null}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {isMobile ? (
          <Box sx={{ mt: 1.3 }}>
            {sections.map((section, index) => (
              <Accordion
                key={section.title}
                defaultExpanded={index === 0}
                disableGutters
                elevation={0}
                sx={{
                  mb: 1,
                  borderRadius: '14px !important',
                  overflow: 'hidden',
                  border: '1px solid rgba(24,35,58,0.12)',
                  '&::before': { display: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreRoundedIcon />}
                  sx={{ px: 1.5, backgroundColor: 'rgba(255,255,255,0.78)' }}
                >
                  <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 900, fontSize: 17 }}>{section.title}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1.5, pt: 0.8, pb: 1.2, backgroundColor: 'rgba(255,255,255,0.88)' }}>
                  {section.rows.map((row) => (
                    <InfoRow key={row.label} {...row} />
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : (
          <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <InfoCard title={sections[0].title} rows={sections[0].rows} />
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoCard title={sections[1].title} rows={sections[1].rows} />
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoCard title={sections[2].title} rows={sections[2].rows} />
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoCard title={sections[3].title} rows={sections[3].rows} />
            </Grid>
            <Grid item xs={12}>
              <InfoCard title={sections[4].title} rows={sections[4].rows} />
            </Grid>
          </Grid>
        )}
      </Box>

      <Dialog
        open={isEditOpen}
        onClose={() => {
          if (!isSaving) setIsEditOpen(false)
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontFamily: 'Open Sans', fontWeight: 900 }}>
          Bilgilerimi Güncelle
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2} sx={{ pt: 0.4 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}

            <TextField
              label="Doğum Tarihi"
              type="date"
              value={formData.dogumTarihi}
              onChange={(e) => setFormData((p) => ({ ...p, dogumTarihi: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText={rawDateHints.dogumTarihi ? `Mevcut kayıt: ${rawDateHints.dogumTarihi}` : ''}
            />
            <TextField label="Doğum Yeri" value={formData.dogumYeri} onChange={(e) => setFormData((p) => ({ ...p, dogumYeri: e.target.value }))} fullWidth />
            <TextField
              select
              label="Kan Grubu"
              value={formData.kanGrubu}
              onChange={(e) => setFormData((p) => ({ ...p, kanGrubu: e.target.value }))}
              fullWidth
            >
              {KAN_GRUBU_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Mesleği" value={formData.meslegi} onChange={(e) => setFormData((p) => ({ ...p, meslegi: e.target.value }))} fullWidth />
            <TextField label="İşi" value={formData.isi} onChange={(e) => setFormData((p) => ({ ...p, isi: e.target.value }))} fullWidth />
            <TextField label="İş Adresi" value={formData.isAdresi} onChange={(e) => setFormData((p) => ({ ...p, isAdresi: e.target.value }))} fullWidth multiline minRows={2} />
            <TextField
              select
              label="Medeni Hali"
              value={formData.medeniHali}
              onChange={(e) => setFormData((p) => ({ ...p, medeniHali: e.target.value }))}
              fullWidth
            >
              {MEDENI_HAL_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Eşinin Adı" value={formData.esininAdi} onChange={(e) => setFormData((p) => ({ ...p, esininAdi: e.target.value }))} fullWidth />
            <TextField
              label="Eşinin Doğum Tarihi"
              type="date"
              value={formData.dogumTarihi2}
              onChange={(e) => setFormData((p) => ({ ...p, dogumTarihi2: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText={rawDateHints.dogumTarihi2 ? `Mevcut kayıt: ${rawDateHints.dogumTarihi2}` : ''}
            />
            <Box sx={{ border: '1px solid rgba(22,34,54,0.12)', borderRadius: 2, p: 1.2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 800, fontSize: 14 }}>
                  Çocuk Bilgileri
                </Typography>
                <Button
                  startIcon={<AddRoundedIcon />}
                  onClick={addChildRow}
                  sx={{ textTransform: 'none' }}
                >
                  Çocuk Ekle
                </Button>
              </Stack>
              <Stack spacing={1}>
                {formData.cocukBilgileri.map((child, index) => (
                  <Box key={`child-${index}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' }, gap: 1 }}>
                    <TextField
                      label="Çocuk Adı"
                      value={child.ad}
                      onChange={(e) => updateChildField(index, 'ad', e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Doğum Tarihi"
                      type="date"
                      value={child.dogumTarihi}
                      onChange={(e) => updateChildField(index, 'dogumTarihi', e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button
                      color="error"
                      onClick={() => removeChildRow(index)}
                      sx={{ textTransform: 'none', minWidth: 44 }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </Button>
                  </Box>
                ))}
              </Stack>
            </Box>
            <TextField label="Ev Adresi" value={formData.evAdresi} onChange={(e) => setFormData((p) => ({ ...p, evAdresi: e.target.value }))} fullWidth multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.2 }}>
          <Button onClick={() => setIsEditOpen(false)} disabled={isSaving} sx={{ textTransform: 'none' }}>
            Vazgeç
          </Button>
          <Button variant="contained" onClick={onSaveProfile} disabled={isSaving} sx={{ textTransform: 'none' }}>
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
