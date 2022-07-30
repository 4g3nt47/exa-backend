// The course model.

import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
import bcrypt from 'bcrypt';

// Define the course schema
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
  password:{
    type: String,
    required: true,
    default: "null"
  },
  questions:[
    {
      question:{
        type: String,
        required: true
      },
      options:{
        type: Object,
        required: true
      },
      answer:{
        type: Number,
        required: true
      }
    }
  ],
  questionsCount:{
    type: Number,
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

// For setting course password using bcrypt
courseSchema.methods.setPassword = async function(password){
  this.password = await bcrypt.hash(password, 10);
};

// Returns true if the course is password-protected.
courseSchema.methods.isProtected = function(){
  return (this.password !== "null");
};

// Apply the schema, and export.
const Course = mongoose.model('courses', courseSchema);
export default Course;

// Creates a course with given data.
export const createCourse = async (data) => {

  // Destructure the request body.
  let {
    name, title, releaseDate, questions, questionsCount,
    passingScore, duration, password, avatar
  } = data;
  // Do some validations.
  name = name.toString().trim();
  title = title.toString().trim();
  releaseDate = parseInt(releaseDate);
  questions = JSON.parse(questions);
  questionsCount = parseInt(questionsCount);
  passingScore = parseInt(passingScore);
  duration = parseInt(duration);
  password = password.toString().trim();
  if (name.length < 3 || name.length > 30)
    throw new Error("Invalid course name");
  if (await Course.findOne({name}))
    throw new Error("Course with the given name already exists!");
  if (title.length < 5 || title.length > 100)
    throw new Error("Invalid course title!");
  if (typeof(questions) !== "object")
    throw new Error("Questions must be an array object");
  if (questions.length < 5)
    throw new Error("A course must have at least 5 questions!");
  if (questionsCount > questions.length || questionsCount < 1)
    throw new Error("Questions per test must be <= total questions!");
  // Create the course.
  const course = new Course({
    name, title, releaseDate, questions, questionsCount, passingScore, duration, avatar
  });
  course.creationDate = Date.now();
  if (password) // Password is optional.
    await course.setPassword(password);
  await course.save();
  return true;
};

// Get data for a single course. Questions, answers, and actual password (if any) excluded.
export const getCourse = async (id) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid ID");
  const course = await Course.findOne({_id: new ObjectId(id)});
  if (!course)
    throw new Error("Invalid course!");
  let data = {
    id: course._id,
    name: course.name,
    title: course.title,
    password: course.isProtected(),
    creationDate: course.creationDate,
    releaseDate: course.releaseDate,
    questions: course.questionsCount,
    passingScore: course.passingScore,
    duration: course.duration
  };
  return data;
};

// Get data of all courses.
export const getCourseList = async () => {

  const courses = await Course.find({});
  const result = [];
  for (let course of courses){
    let data = {
      id: course._id,
      name: course.name,
      title: course.title,
      password: course.isProtected(),
      creationDate: course.creationDate,
      releaseDate: course.releaseDate,
      questions: course.questionsCount,
      passingScore: course.passingScore,
      duration: course.duration
    };
    result.push(data);
  }
  return result;
};

// Delete a course.
export const deleteCourse = async (id) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid ID!");
  const result = await Course.deleteOne({_id: new ObjectId(id)});
  if (result.deletedCount === 0)
    throw new Error("Invalid course!");
  return result;
};
