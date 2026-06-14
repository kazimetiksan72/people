const express = require('express')
const multer = require('multer')
const { BlobServiceClient } = require('@azure/storage-blob')

const { authenticate } = require('../middleware/authenticate')
const { TeneuBlanche } = require('../models/teneuBlanche')

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024,
    files: 50
  }
})

const ADMIN_EMAIL = 'kazim@pikselmutfak.com'
const CONTAINER_NAME = 'teneublanche'
const STORAGE_BASE_URL = 'https://idaimages.blob.core.windows.net'

const isKazim = (user) => String(user?.ePosta || '').trim().toLowerCase() === ADMIN_EMAIL

const getMediaType = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return ''
}

const formatTurkishDateTitle = (dateValue) => {
  if (!dateValue) return 'Teneu Blanche'

  const parsed = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateValue

  return parsed.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getBlobClient = async () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING tanımlı değil.')
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME)
  await containerClient.createIfNotExists()
  return containerClient
}

router.get('/teneu-blanche', authenticate, async (req, res) => {
  try {
    const events = await TeneuBlanche.find({}).sort({ eventDate: -1, createdAt: -1 })
    res.send(events)
  } catch (e) {
    res.status(500).send({ errorMessage: 'Teneu Blanche listesi alınamadı.' })
  }
})

router.post('/teneu-blanche', authenticate, async (req, res) => {
  if (!isKazim(req.user)) {
    return res.status(403).send({ errorMessage: 'Bu işlem için yetkiniz yok.' })
  }

  const eventDate = String(req.body?.eventDate || '').trim()

  if (!eventDate) {
    return res.status(400).send({ errorMessage: 'Etkinlik tarihi zorunludur.' })
  }

  try {
    const hasAnyEvent = await TeneuBlanche.exists({})
    const isDefault = !hasAnyEvent

    if (isDefault) {
      await TeneuBlanche.updateMany({}, { $set: { isDefault: false } })
    }

    const event = new TeneuBlanche({
      title: formatTurkishDateTitle(eventDate),
      eventDate,
      isDefault,
      createdBy: req.user._id,
      media: []
    })

    await event.save()
    res.status(201).send(event)
  } catch (e) {
    res.status(500).send({ errorMessage: 'Teneu Blanche oluşturulamadı.' })
  }
})

router.post('/teneu-blanche/:id/media', authenticate, upload.array('files', 50), async (req, res) => {
  if (!isKazim(req.user)) {
    return res.status(403).send({ errorMessage: 'Bu işlem için yetkiniz yok.' })
  }

  try {
    const event = await TeneuBlanche.findById(req.params.id)
    if (!event) {
      return res.status(404).send({ errorMessage: 'Teneu Blanche bulunamadı.' })
    }

    const files = Array.isArray(req.files) ? req.files : []
    if (files.length === 0) {
      return res.status(400).send({ errorMessage: 'Yüklenecek dosya seçilmedi.' })
    }

    const containerClient = await getBlobClient()
    const uploadedMedia = []

    for (const file of files) {
      const mediaType = getMediaType(file.mimetype)
      if (!mediaType) continue

      const safeName = String(file.originalname || 'media').replace(/[^\w.\-ğüşöçıİĞÜŞÖÇ]+/gi, '-')
      const blobName = `${event._id}/${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        }
      })

      uploadedMedia.push({
        type: mediaType,
        url: `${STORAGE_BASE_URL}/${CONTAINER_NAME}/${blobName}`,
        blobName,
        fileName: file.originalname || '',
        contentType: file.mimetype || ''
      })
    }

    if (uploadedMedia.length === 0) {
      return res.status(400).send({ errorMessage: 'Sadece fotoğraf veya video dosyaları yüklenebilir.' })
    }

    event.media.push(...uploadedMedia)
    await event.save()
    res.send(event)
  } catch (e) {
    console.log('POST /teneu-blanche/:id/media error', e)
    res.status(500).send({ errorMessage: 'Medya yüklenemedi.' })
  }
})

module.exports = router
