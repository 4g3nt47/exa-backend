const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require('bcrypt');

const courseSchema = mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  title:{
    type: String,
    required: true
  },
  creationDate:{
    type: Number,
    required: true
  },
  releaseDate:{
    type: Number,
    required: true
  },
  questions:{
    type: Object,
    required: true,
    default: []
  },
  questionsCount:{
    type: String,
    required: true,
    default: 0
  },
  passingScore:{
    type: Number,
    required: true,
    default: 50
  },
  duration:{
    type: Number,
    required: true
  }
});

const Course = mongoose.model('courses', courseSchema);
exports.Course = Course;

exports.createCourse = async (data) => {

  let {
    name, title, releaseDate, questions, questionsCount, passingScore, duration
  } = data;
  name = name.toString().trim();
  title = title.toString().trim();
  releaseDate = parseInt(releaseDate);
  passingScore = parseInt(passingScore);
  if (name.length < 3 || name.length > 30)
    throw new Error("Invalid course name");
  if (title.length < 5 || title.length > 100)
    throw new Error("Invalid course title!");
  if (typeof(questions) !== "object")
    throw new Error("Questions must be an array object");
  if (questionsCount > questions.length || questionsCount < 1)
    throw new Error("Questions per test must be <= total questions");
  const course = new Course({
    name, title, releaseDate, questions, questionsCount, passingScore, duration
  });
  course.creationDate = Date.now();
  await course.save();
  return true;
};

exports.getCourse = async (id) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid ID");
  return await Course.findOne({_id: new ObjectId(id)});
};

