const express = require('express')
const multer = require('multer')
const path = require('path')
const { BlobServiceClient } = require('@azure/storage-blob')

const { authenticate } = require('../middleware/authenticate')
const { Document } = require('../models/document')
const { normalizeUploadFileName, sanitizeFileName } = require('../utils/fileName')

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 20
  }
})

const ADMIN_EMAIL = 'kazim@pikselmutfak.com'
const CONTAINER_NAME = 'documents'
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx'])

const isKazim = (user) => String(user?.ePosta || '').trim().toLowerCase() === ADMIN_EMAIL
const getUserDegree = (user) => {
  const degree = Number(user?.derece)
  return Number.isFinite(degree) ? degree : 0
}
const canViewDocument = (user, document) => {
  if (isKazim(user)) return true
  return getUserDegree(user) >= Number(document?.degree || 0)
}

const getRenamedFileName = (currentFileName, nextTitle) => {
  const ext = path.extname(String(currentFileName || ''))
  return `${nextTitle}${ext}`
}

const getContainerClient = async () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING tanımlı değil.')
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME)
  await containerClient.createIfNotExists()
  return containerClient
}

const isAllowedDocument = (file = {}) => {
  const ext = path.extname(String(file.originalname || '')).toLowerCase()
  return ALLOWED_EXTENSIONS.has(ext)
}

const serializeDocument = (document) => ({
  _id: document._id,
  title: document.title,
  degree: document.degree,
  fileName: document.fileName,
  contentType: document.contentType,
  size: document.size,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt
})

router.get('/documents', authenticate, async (req, res) => {
  try {
    const degree = getUserDegree(req.user)
    const query = isKazim(req.user) ? {} : { degree: { $in: ['1', '2', '3'].filter((item) => Number(item) <= degree) } }
    const documents = await Document.find(query).sort({ degree: 1, createdAt: -1 })
    res.send(documents.map(serializeDocument))
  } catch (e) {
    console.log('GET /documents error', e)
    res.status(500).send({ errorMessage: 'Dokümanlar alınamadı.' })
  }
})

router.post('/documents', authenticate, upload.array('files', 20), async (req, res) => {
  if (!isKazim(req.user)) {
    return res.status(403).send({ errorMessage: 'Doküman yükleme yetkisi sadece yetkili kullanıcıdadır.' })
  }

  const degree = String(req.body?.degree || '').trim()
  if (!['1', '2', '3'].includes(degree)) {
    return res.status(400).send({ errorMessage: 'Doküman derecesi zorunludur.' })
  }

  const files = Array.isArray(req.files) ? req.files : []
  if (files.length === 0) {
    return res.status(400).send({ errorMessage: 'Yüklenecek doküman seçilmedi.' })
  }

  const invalidFiles = files.filter((file) => !isAllowedDocument(file))
  if (invalidFiles.length > 0) {
    return res.status(400).send({ errorMessage: 'Sadece PDF, Word ve Excel dokümanları yüklenebilir.' })
  }

  try {
    const containerClient = await getContainerClient()
    const uploadedDocuments = []

    for (const file of files) {
      const originalName = normalizeUploadFileName(file.originalname, 'dokuman')
      const safeName = sanitizeFileName(originalName, 'dokuman')
      const blobName = `${degree}/${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype || 'application/octet-stream'
        }
      })

      const document = await Document.create({
        title: path.basename(originalName || safeName, path.extname(originalName || safeName)),
        degree,
        blobName,
        fileName: originalName || safeName,
        contentType: file.mimetype || 'application/octet-stream',
        size: file.size || 0,
        uploadedBy: req.user._id
      })

      uploadedDocuments.push(serializeDocument(document))
    }

    res.status(201).send(uploadedDocuments)
  } catch (e) {
    console.log('POST /documents error', e)
    res.status(500).send({ errorMessage: 'Doküman yüklenemedi.' })
  }
})

router.put('/documents/:id', authenticate, async (req, res) => {
  if (!isKazim(req.user)) {
    return res.status(403).send({ errorMessage: 'Doküman düzenleme yetkisi sadece yetkili kullanıcıdadır.' })
  }

  const title = normalizeUploadFileName(req.body?.title, '').trim()
  const degree = String(req.body?.degree || '').trim()

  if (!title) {
    return res.status(400).send({ errorMessage: 'Doküman ismi zorunludur.' })
  }

  if (!['1', '2', '3'].includes(degree)) {
    return res.status(400).send({ errorMessage: 'Doküman derecesi zorunludur.' })
  }

  try {
    const document = await Document.findById(req.params.id)
    if (!document) {
      return res.status(404).send({ errorMessage: 'Doküman bulunamadı.' })
    }

    document.title = title
    document.degree = degree
    document.fileName = getRenamedFileName(document.fileName, title)
    await document.save()

    res.send(serializeDocument(document))
  } catch (e) {
    console.log('PUT /documents/:id error', e)
    res.status(500).send({ errorMessage: 'Doküman güncellenemedi.' })
  }
})

router.delete('/documents/:id', authenticate, async (req, res) => {
  if (!isKazim(req.user)) {
    return res.status(403).send({ errorMessage: 'Doküman silme yetkisi sadece yetkili kullanıcıdadır.' })
  }

  try {
    const document = await Document.findById(req.params.id)
    if (!document) {
      return res.status(404).send({ errorMessage: 'Doküman bulunamadı.' })
    }

    const containerClient = await getContainerClient()
    const blobClient = containerClient.getBlockBlobClient(document.blobName)
    await blobClient.deleteIfExists()
    await document.deleteOne()

    res.send({ success: true })
  } catch (e) {
    console.log('DELETE /documents/:id error', e)
    res.status(500).send({ errorMessage: 'Doküman silinemedi.' })
  }
})

router.get('/documents/:id/download', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
    if (!document) {
      return res.status(404).send({ errorMessage: 'Doküman bulunamadı.' })
    }

    if (!canViewDocument(req.user, document)) {
      return res.status(403).send({ errorMessage: 'Bu dokümanı görüntüleme yetkiniz yok.' })
    }

    const containerClient = await getContainerClient()
    const blobClient = containerClient.getBlockBlobClient(document.blobName)
    const downloadResponse = await blobClient.download()

    res.setHeader('Content-Type', document.contentType || 'application/octet-stream')
    res.setHeader('Content-Length', downloadResponse.contentLength || document.size || 0)
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`)

    downloadResponse.readableStreamBody.pipe(res)
  } catch (e) {
    console.log('GET /documents/:id/download error', e)
    res.status(500).send({ errorMessage: 'Doküman indirilemedi.' })
  }
})

module.exports = router
