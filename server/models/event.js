const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    default: ''
  },
  time: {
    type: String,
    default: ''
  },
  note: {
    type: String,
    default: ''
  },
  mapEmbedUrl: {
    type: String,
    default: ''
  },
  photoUrl: {
    type: String,
    default: ''
  },
  placeId: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    guestCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    }
  }]
}, {
  timestamps: true
})

EventSchema.set('toJSON', {
  transform: (_, ret) => {
    let participantCount = 0
    let totalAttendance = 0

    if (Array.isArray(ret.participants)) {
      ret.participants.forEach((participant) => {
        if (!participant) return
        participantCount += 1
        const guestCount = Number(participant.guestCount) || 0
        totalAttendance += (1 + guestCount)
      })
    }

    ret.participantCount = participantCount
    ret.totalAttendance = totalAttendance
    return ret
  }
})

const Event = mongoose.model('Event', EventSchema)

module.exports = { Event }
