// The course model.

import crypto from 'crypto';
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
import bcrypt from 'bcrypt';
import Result from './result.js';

// Define the course schema
const courseSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  creationDate: {
    type: Number,
    required: true
  },
  releaseDate: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true,
    default: "null"
  },
  questions: [
    {
      id: {
        type: String,
        required: true
      },
      question: {
        type: String,
        required: true
      },
      options: {
        type: Object,
        required: true
      },
      answer: {
        type: Number,
        required: true
      }
    }
  ],
  questionsCount: {
    type: Number,
    required: true,
    default: 0
  },
  passingScore: {
    type: Number,
    required: true,
    default: 50
  },
  duration: {
    type: Number,
    required: true
  }
});

// For setting course password using bcrypt
courseSchema.methods.setPassword = async function(password){
  this.password = await bcrypt.hash(password, 10);
};

// For validating course password
courseSchema.methods.validatePassword = async function(password){
  return (await bcrypt.compare(password, this.password));
};

// Returns true if the course is password-protected.
courseSchema.methods.isProtected = function(){
  return (this.password !== "null");
};

// Returns a list of random questions that can be used for a test (valid answers not included)
courseSchema.methods.getQuestions = function(){

  const shuffle = (arr) => {
    for (let i = 0; i < arr.length; i++){
      let newIndex = Math.floor((Math.random() * arr.length));
      let val = arr[i];
      arr[i] = arr[newIndex];
      arr[newIndex] = val;
    }
  };
  shuffle(this.questions);
  return this.questions.slice(0, this.questionsCount);
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
  // Add random IDs to the questions.
  for (let question of questions)
    question.id = crypto.randomBytes(20).toString('hex');
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
    avatar: course.avatar,
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
      avatar: course.avatar,
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

// Get an active course for the user using the given course ID
const getActiveCourse = (user, courseID) => {

  for (let course of user.activeTests){
    if (course.id === courseID.toString())
      return course;
  }
  return null;
};

// Start a course.
export const startCourse = async (user, courseID, password) => {

  if (!ObjectId.isValid(courseID))
    throw new Error("Invalid course ID!");
  courseID = new ObjectId(courseID);
  if (await Result.findOne({_id: courseID}))
    throw new Error("Course already taken!");
  // Check if it's an active course (no course auth required for resuming a course)
  let course = getActiveCourse(user, courseID);
  if (course)
    return course;
  // Find the course
  course = await Course.findById(courseID);
  if (!course)
    throw new Error("Invalid course!");
  if (Date.now() < course.releaseDate)
    throw new Error("Course not yet released!");
  // Handle course authentication, if required.
  if (course.isProtected()){
    if (!(password && (await course.validatePassword(password))))
      throw new Error("Authentication failed!");
  }
  // All set. Fetch questions and start the test.
  let questions = course.getQuestions();
  let testQuestions = [];
  for (let question of questions){
    testQuestions.push({
      id: question.id,
      question: question.question,
      options: question.options,
      answer: -1
    });
  }
  const activeTest = {
    id: courseID,
    finishTime: Date.now() + (course.duration * questions.length),
    questions: testQuestions
  };
  user.activeTests.push(activeTest);
  await user.save();
  return activeTest;
};

// Updates the answers of an active test.
export const updateAnswers = async (user, body) => {

  let {courseID, data} = body; 
  if (!ObjectId.isValid(courseID))
    throw new Error("Invalid course ID!");
  if (!data)
    throw new Error("Required parameter not defined!");
  courseID =  new ObjectId(courseID);
  const course = getActiveCourse(user, courseID);
  if (!course)
    throw new Error("Invalid course!");
  // Check if test time is not over
  if (Date.now() > course.finishTime){
    // Disregard the current update and end the test.
    finishTest(user, courseID);
  }
  // Map questions IDs to their data
  const newQuestions = {};
  for (let q of data)
    newQuestions[q.id] = q;
  // Apply the updates
  for (let i = 0; i < course.questions.length; i++){
    if (newQuestions[course.questions[i].id])
      course.questions[i].answer = parseInt(newQuestions[course.questions[i].answer]);
  }
  // Save to DB
  return (await user.save());
};
