const mongoose = require('mongoose')

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  degree: {
    type: String,
    enum: ['1', '2', '3'],
    required: true
  },
  blobName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    default: 'application/octet-stream'
  },
  size: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

const Document = mongoose.model('Document', DocumentSchema)

module.exports = { Document }
