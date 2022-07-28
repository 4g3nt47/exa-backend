/* 
  The schema for course results
*/

import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

const resultSchema = mongoose.Schema({
  course: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true,
  },
  date: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('results', resultSchema);
