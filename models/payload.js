const mongoose = require('mongoose');

// Define the schema
const payloadSchema = new mongoose.Schema({
  type: String,
  blocks: [{
    text: String,
    showInOption: Boolean,
    isAnswer: Boolean,
  }],
  siblingId: mongoose.Schema.Types.ObjectId,
  solution: String,
  title: String,
  options: [{
    text: String,
    isCorrectAnswer: Boolean,
  }],
});

// Export the model or reuse it if already defined
const Payload = mongoose.models.Payload || mongoose.model('Payload', payloadSchema);
module.exports = Payload;
