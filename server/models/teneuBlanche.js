const mongoose = require('mongoose')

const TeneuBlancheMediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  blobName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    default: ''
  },
  contentType: {
    type: String,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true })

const TeneuBlancheSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  eventDate: {
    type: String,
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  media: [TeneuBlancheMediaSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

const TeneuBlanche = mongoose.model('TeneuBlanche', TeneuBlancheSchema)

module.exports = { TeneuBlanche }
