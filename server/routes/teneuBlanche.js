const express = require('express')
const multer = require('multer')
const { BlobServiceClient } = require('@azure/storage-blob')

const { authenticate } = require('../middleware/authenticate')
const { TeneuBlanche } = require('../models/teneuBlanche')
const { normalizeUploadFileName, sanitizeFileName } = require('../utils/fileName')

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
const isReadonlyUser = (user) => user?.role === 'readonly'

const getMediaType = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return ''
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
    res.status(500).send({ errorMessage: 'Medya etkinlikleri alınamadı.' })
  }
})

router.post('/teneu-blanche', authenticate, async (req, res) => {
  if (isReadonlyUser(req.user)) {
    return res.status(403).send({ errorMessage: 'Salt okunur kullanıcılar değişiklik yapamaz.' })
  }

  if (!isKazim(req.user)) {
    return res.status(403).send({ errorMessage: 'Bu işlem için yetkiniz yok.' })
  }

  const title = String(req.body?.title || '').trim()
  const description = String(req.body?.description || '').trim()
  const eventDate = String(req.body?.eventDate || '').trim()

  if (!title) {
    return res.status(400).send({ errorMessage: 'Etkinlik ismi zorunludur.' })
  }

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
      title,
      description,
      eventDate,
      isDefault,
      createdBy: req.user._id,
      media: []
    })

    await event.save()
    res.status(201).send(event)
  } catch (e) {
    res.status(500).send({ errorMessage: 'Medya etkinliği oluşturulamadı.' })
  }
})

router.patch('/teneu-blanche/:id', authenticate, async (req, res) => {
  if (isReadonlyUser(req.user)) {
    return res.status(403).send({ errorMessage: 'Salt okunur kullanıcılar değişiklik yapamaz.' })
  }

  if (!isKazim(req.user)) {
    return res.status(403).send({ errorMessage: 'Bu işlem için yetkiniz yok.' })
  }

  const title = String(req.body?.title || '').trim()
  const description = String(req.body?.description || '').trim()
  const eventDate = String(req.body?.eventDate || '').trim()

  if (!title) {
    return res.status(400).send({ errorMessage: 'Etkinlik ismi zorunludur.' })
  }

  if (!eventDate) {
    return res.status(400).send({ errorMessage: 'Etkinlik tarihi zorunludur.' })
  }

  try {
    const event = await TeneuBlanche.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, eventDate } },
      { new: true }
    )

    if (!event) {
      return res.status(404).send({ errorMessage: 'Medya etkinliği bulunamadı.' })
    }

    res.send(event)
  } catch (e) {
    res.status(500).send({ errorMessage: 'Medya etkinliği güncellenemedi.' })
  }
})

router.post('/teneu-blanche/:id/media', authenticate, upload.array('files', 50), async (req, res) => {
  if (isReadonlyUser(req.user)) {
    return res.status(403).send({ errorMessage: 'Salt okunur kullanıcılar medya yükleyemez.' })
  }

  try {
    const event = await TeneuBlanche.findById(req.params.id)
    if (!event) {
      return res.status(404).send({ errorMessage: 'Medya etkinliği bulunamadı.' })
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

      const originalName = normalizeUploadFileName(file.originalname, 'media')
      const safeName = sanitizeFileName(originalName, 'media')
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
        fileName: originalName || '',
        contentType: file.mimetype || '',
        uploadedBy: req.user._id
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

router.delete('/teneu-blanche/:id/media', authenticate, async (req, res) => {
  if (isReadonlyUser(req.user)) {
    return res.status(403).send({ errorMessage: 'Salt okunur kullanıcılar medya silemez.' })
  }

  try {
    const mediaIds = Array.isArray(req.body?.mediaIds)
      ? req.body.mediaIds.map((id) => String(id)).filter(Boolean)
      : []

    if (mediaIds.length === 0) {
      return res.status(400).send({ errorMessage: 'Silinecek medya seçilmedi.' })
    }

    const event = await TeneuBlanche.findById(req.params.id)
    if (!event) {
      return res.status(404).send({ errorMessage: 'Medya etkinliği bulunamadı.' })
    }

    const selectedMedia = event.media.filter((item) => mediaIds.includes(String(item._id)))
    const mediaToDelete = selectedMedia.filter((item) => {
      return isKazim(req.user) || String(item.uploadedBy || '') === String(req.user._id)
    })

    if (selectedMedia.length !== mediaToDelete.length) {
      return res.status(403).send({ errorMessage: 'Sadece kendi yüklediğiniz medyaları silebilirsiniz.' })
    }

    if (mediaToDelete.length === 0) {
      return res.status(404).send({ errorMessage: 'Seçilen medya bulunamadı.' })
    }

    const containerClient = await getBlobClient()

    for (const media of mediaToDelete) {
      if (!media.blobName) continue
      await containerClient.getBlockBlobClient(media.blobName).deleteIfExists()
    }

    event.media = event.media.filter((item) => !mediaIds.includes(String(item._id)))
    await event.save()

    res.send(event)
  } catch (e) {
    console.log('DELETE /teneu-blanche/:id/media error', e)
    res.status(500).send({ errorMessage: 'Medya silinemedi.' })
  }
})

module.exports = router
