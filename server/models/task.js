const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedToName: {
    type: String
  },
  assignedToMatrikul: {
    type: String
  },
  assignedAt: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Yeni Atandı', 'Yapılıyor', 'Tamamlandı'],
    default: 'Yeni Atandı'
  },
  assignedByName: {
    type: String,
    default: 'Üs. Muh.'
  },
  rejectionReason: {
    type: String
  },
  rejectedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

TaskSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

const Task = mongoose.model('Task', TaskSchema)

module.exports = { Task }
