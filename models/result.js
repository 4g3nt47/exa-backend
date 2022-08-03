// The test results model

import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

// Define the results schema
const resultSchema = mongoose.Schema({
  userID: {
    type: String,
    required: true
  },
  courseID: {
    type: String,
    required: true,
  },
  courseName: {
    type: String,
    required: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  passingScore: {
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
  passedQuestions: {
    type: Object,
    required: true,
    default: []
  },
  failedQuestions: {
    type: Object,
    required: true,
    default: []
  },
  duration: {
    type: Number,
    required: true
  }
});

// Apply and export
const Result = mongoose.model('results', resultSchema);
export default Result;
