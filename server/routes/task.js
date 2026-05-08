const express = require('express')
const _ = require('lodash')
const mongoose = require('mongoose')
const router = express.Router()

const { Task } = require('../models/task')
const { User } = require('../models/user')
const { authenticate } = require('../middleware/authenticate')

const ADMIN_EMAIL = 'kazim@pikselmutfak.com'

const isKazim = (user) => String(user?.ePosta || '').trim().toLowerCase() === ADMIN_EMAIL

router.get('/tasks', authenticate, async (req, res) => {
  try {
    const query = isKazim(req.user) ? {} : { assignedTo: req.user._id }
    const tasks = await Task.find(query).sort({ createdAt: -1 })
    res.send(tasks)
  } catch (e) {
    res.status(500).send({ errorMessage: 'Görevler alınırken hata oluştu.' })
  }
})

router.post('/tasks', authenticate, async (req, res) => {
  try {
    if (!isKazim(req.user)) {
      return res.status(403).send({ errorMessage: 'Bu işlem için yetkiniz yok.' })
    }

    const body = _.pick(req.body, ['content', 'assignedTo', 'assignedAt', 'dueDate'])
    const content = String(body.content || '').trim()
    const assignedTo = String(body.assignedTo || '').trim()
    const assignedAt = new Date(body.assignedAt)
    const dueDate = new Date(body.dueDate)

    if (!content || !assignedTo || Number.isNaN(assignedAt.getTime()) || Number.isNaN(dueDate.getTime())) {
      return res.status(400).send({ errorMessage: 'Görev içeriği, atanacak kardeş, atama tarihi ve bitiş tarihi zorunludur.' })
    }

    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).send({ errorMessage: 'Geçersiz kardeş seçimi.' })
    }

    const brother = await User.findById(assignedTo)
    if (!brother) {
      return res.status(404).send({ errorMessage: 'Kardeş kaydı bulunamadı.' })
    }

    const task = new Task({
      content,
      assignedTo: brother._id,
      assignedToName: brother.adSoyad || '',
      assignedToMatrikul: brother.matrikul || '',
      assignedAt,
      dueDate,
      assignedByName: 'Üs. Muh.'
    })

    await task.save()
    res.send(task)
  } catch (e) {
    res.status(500).send({ errorMessage: 'Görev atanırken hata oluştu.' })
  }
})

router.post('/tasks/:id/accept', authenticate, async (req, res) => {
  const task = await Task.findById(req.params.id)
  if (!task) {
    return res.status(404).send({ errorMessage: 'Görev bulunamadı.' })
  }

  if (String(task.assignedTo) !== String(req.user._id)) {
    return res.status(403).send({ errorMessage: 'Bu görev size atanmadı.' })
  }

  task.status = 'Yapılıyor'
  task.rejectionReason = undefined
  task.rejectedAt = undefined
  await task.save()
  res.send(task)
})

router.post('/tasks/:id/reject', authenticate, async (req, res) => {
  const task = await Task.findById(req.params.id)
  if (!task) {
    return res.status(404).send({ errorMessage: 'Görev bulunamadı.' })
  }

  if (String(task.assignedTo) !== String(req.user._id)) {
    return res.status(403).send({ errorMessage: 'Bu görev size atanmadı.' })
  }

  const reason = String(req.body?.reason || '').trim()
  if (!reason) {
    return res.status(400).send({ errorMessage: 'Mazeret zorunludur.' })
  }

  task.status = 'Yeni Atandı'
  task.rejectionReason = reason
  task.rejectedAt = new Date()
  await task.save()
  res.send(task)
})

router.post('/tasks/:id/complete', authenticate, async (req, res) => {
  const task = await Task.findById(req.params.id)
  if (!task) {
    return res.status(404).send({ errorMessage: 'Görev bulunamadı.' })
  }

  if (String(task.assignedTo) !== String(req.user._id)) {
    return res.status(403).send({ errorMessage: 'Bu görev size atanmadı.' })
  }

  const completedAt = new Date(req.body?.completedAt)
  if (Number.isNaN(completedAt.getTime())) {
    return res.status(400).send({ errorMessage: 'Tamamlanma tarihi zorunludur.' })
  }

  task.status = 'Tamamlandı'
  task.completedAt = completedAt
  await task.save()
  res.send(task)
})

module.exports = router
