const express = require('express')
const _ = require('lodash')

const { Event } = require('../models/event')
const { authenticate } = require('../middleware/authenticate')

const router = express.Router()

const clampGuestCount = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 10) return 10
  return Math.floor(n)
}

const normalizeParticipants = (participants = []) => {
  return participants
    .filter(Boolean)
    .map((participant) => {
      if (participant.user) {
        return {
          user: participant.user,
          guestCount: clampGuestCount(participant.guestCount)
        }
      }

      return {
        user: participant,
        guestCount: 0
      }
    })
}

const getUserIdString = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value._id) return value._id.toString()
  return value.toString()
}

const findParticipantIndex = (participants, userId) => {
  const userIdString = getUserIdString(userId)
  return participants.findIndex((participant) => {
    if (!participant || !participant.user) return false
    return getUserIdString(participant.user) === userIdString
  })
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

  return {
    hour: Number(match[1]),
    minute: Number(match[2])
  }
}

const getEventDateTime = (event) => {
  const dateParts = parseDateParts(event?.date)
  if (!dateParts) return null

  const { hour, minute } = parseTimeParts(event?.time)
  const dt = new Date(dateParts.year, dateParts.month - 1, dateParts.day, hour, minute, 0, 0)
  if (Number.isNaN(dt.getTime())) return null
  return dt
}

const isEventClosed = (event) => {
  const dt = getEventDateTime(event)
  if (!dt) return false
  return Date.now() > dt.getTime()
}

router.get('/events', authenticate, async (req, res) => {
  try {
    const events = await Event.find({}).sort({ createdAt: -1 })
    res.send(events)
  } catch (e) {
    res.status(500).send({ errorMessage: 'Etkinlikler getirilemedi.' })
  }
})

router.get('/events/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants.user', 'adSoyad ePosta matrikul')
    if (!event) {
      return res.status(404).send({ errorMessage: 'Etkinlik bulunamadı.' })
    }

    const normalizedParticipants = normalizeParticipants(event.participants)
    const participantIndex = findParticipantIndex(normalizedParticipants, req.user._id)
    const joined = participantIndex >= 0
    const myGuestCount = joined ? normalizedParticipants[participantIndex].guestCount : 0

    res.send({
      ...event.toJSON(),
      participants: normalizedParticipants,
      joined,
      myGuestCount
    })
  } catch (e) {
    res.status(500).send({ errorMessage: 'Etkinlik getirilemedi.' })
  }
})

router.post('/events', authenticate, async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).send({ errorMessage: 'Etkinlik oluşturma yetkisi sadece admin kullanıcıdadır.' })
  }

  const body = _.pick(req.body, [
    'name',
    'location',
    'date',
    'time',
    'note',
    'mapEmbedUrl',
    'photoUrl',
    'placeId',
    'latitude',
    'longitude'
  ])

  if (!body.name || !body.location) {
    return res.status(400).send({ errorMessage: 'Etkinlik Adı ve Konum zorunludur.' })
  }

  try {
    const event = new Event({
      ...body,
      createdBy: req.user._id
    })

    const savedEvent = await event.save()
    res.status(201).send(savedEvent)
  } catch (e) {
    res.status(500).send({ errorMessage: 'Etkinlik kaydedilemedi.' })
  }
})

router.post('/events/:id/join', authenticate, async (req, res) => {
  try {
    const guestCount = clampGuestCount(req.body.guestCount)
    let event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).send({ errorMessage: 'Etkinlik bulunamadı.' })
    }

    if (isEventClosed(event)) {
      return res.status(400).send({ errorMessage: 'Etkinlik tarihi/saati geçtiği için katılım değiştirilemez.' })
    }

    const normalizedParticipants = normalizeParticipants(event.participants)
    const participantIndex = findParticipantIndex(normalizedParticipants, req.user._id)

    if (participantIndex >= 0) {
      normalizedParticipants[participantIndex].guestCount = guestCount
    } else {
      normalizedParticipants.push({
        user: req.user._id,
        guestCount
      })
    }

    event.participants = normalizedParticipants
    await event.save()
    event = await event.populate('participants.user', 'adSoyad ePosta matrikul')

    res.send({
      ...event.toJSON(),
      participants: normalizeParticipants(event.participants),
      joined: true,
      myGuestCount: guestCount
    })
  } catch (e) {
    res.status(500).send({ errorMessage: 'Katılım bilgisi kaydedilemedi.' })
  }
})

router.post('/events/:id/leave', authenticate, async (req, res) => {
  try {
    let event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).send({ errorMessage: 'Etkinlik bulunamadı.' })
    }

    if (isEventClosed(event)) {
      return res.status(400).send({ errorMessage: 'Etkinlik tarihi/saati geçtiği için katılım değiştirilemez.' })
    }

    const normalizedParticipants = normalizeParticipants(event.participants)
      .filter((participant) => getUserIdString(participant.user) !== getUserIdString(req.user._id))

    event.participants = normalizedParticipants
    await event.save()
    event = await event.populate('participants.user', 'adSoyad ePosta matrikul')

    res.send({
      ...event.toJSON(),
      participants: normalizeParticipants(event.participants),
      joined: false,
      myGuestCount: 0
    })
  } catch (e) {
    res.status(500).send({ errorMessage: 'Katılım iptal edilemedi.' })
  }
})

module.exports = router
