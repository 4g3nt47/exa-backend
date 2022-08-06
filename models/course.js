/**
 * @file Models for the course API endpoints.
 * @author Umar Abdul (https://github.com/4g3nt47)
 */

import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import validator from 'validator';
import excel from 'excel4node';
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
import Result from './result.js';
import {logStatus, logError, logWarning} from './event-log.js';

/**
 * The collection schema for courses.
 */
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

/**
 * Sets course password.
 * @param {string} password - The password string.
 */
courseSchema.methods.setPassword = async function(password){
  this.password = await bcrypt.hash(password, 10);
};

/**
 * Validates course password.
 * @param {string} password - The plain text password to test against
 * @return {boolean} true on success.
 */
courseSchema.methods.validatePassword = async function(password){
  return (await bcrypt.compare(password, this.password));
};

/**
 * Checks if a course is password-protected.
 * @return {boolean} true if course is password-protected.
 */
courseSchema.methods.isProtected = function(){
  return (this.password !== "null");
};

/**
 * Builds a random array of questions (answers not included) for a test.
 * @return {object} An array of questions.
 */
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

/**
 * Handles course creation.
 * @param {object} data - The request body containing all the data.
 * @return {boolean} true on success.
 */
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
  if (name.length < 3 || name.length > 16)
    throw new Error("Couse name must be between 3 and 16 characters long!");
  if (!validator.isAlphanumeric(name))
    throw new Error("Course name must be alphanumeric only!");
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

/**
 * Get data for a single course.
 * @param {object} user - The user's profile.
 * @param {number} id - The course ID.
 * @return {object} The course data, excluding questions, answers, and actual password (if any).
 */
export const getCourse = async (user, id) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid ID");
  const course = await Course.findById(new ObjectId(id));
  if (!course)
    throw new Error("Invalid course!");
  let courseData = {
    id: course._id.toString(),
    name: course.name,
    title: course.title,
    avatar: course.avatar,
    password: course.isProtected(),
    creationDate: course.creationDate,
    releaseDate: course.releaseDate,
    questions: course.questionsCount,
    passingScore: course.passingScore,
    duration: course.duration,
    activeTest: false
  };
  // Check if the course is active for the user.
  for (let testData of user.activeTests){
    if (testData.id === courseData.id){
      courseData.activeTest = true;
      break;
    }
  }
  return courseData;
};

/**
 * Get data of all courses.
 * @param {object} user - The user's profile.
 * @return {object} An array of all courses.
 */
export const getCourseList = async (user) => {

  const courses = await Course.find({});
  const result = [];
  for (let course of courses)
    result.push(await getCourse(user, course._id.toString()));
  return result;
};

/**
 * Delete a course.
 * @param {string} id - The course ID.
 * @return {object} The result of the delete query.
 */
export const deleteCourse = async (id) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid ID!");
  const result = await Course.deleteOne({_id: new ObjectId(id)});
  if (result.deletedCount === 0)
    throw new Error("Invalid course!");
  return result;
};

/**
 * Delete all results for a course.
 * @param {string} id - The course ID.
 * @return {object} The result of the delete query.
 */
export const deleteCourseResults = async (id) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid ID!");
  return (await Result.deleteMany({courseID: id}));
};

/**
 * Get an active course for the user using the given course ID.
 * @param {object} user - The user's profile.
 * @return {object} The course data, null if not found.
 */
const getActiveCourse = (user, courseID) => {

  for (let course of user.activeTests){
    if (course.id === courseID.toString())
      return course;
  }
  return null;
};

/**
 * Start or resume a course.
 * @param {object} user - The user's profile
 * @param {string} courseID - The course ID.
 * @param {string} [password] - The course password (optional).
 * @return {object} The started course data, including questions and options, but not actual answers.
 */
export const startCourse = async (user, courseID, password) => {

  if (!ObjectId.isValid(courseID))
    throw new Error("Invalid course ID!");
  courseID = new ObjectId(courseID);
  if (await Result.findOne({userID: user._id.toString(), courseID}))
    throw new Error("You took this course already!");
  // Check if it's an active course (no course auth required for resuming a course)
  let course = getActiveCourse(user, courseID);
  if (course){
    if (Date.now() > course.finishTime){ // Test time has been exhausted
      await finishTest(user, course);
      throw new Error("You have ran out of time. Your result has been submitted successfully.");
    }
    return course; // Return the active course data so user can resume.
  }
  // Find the course
  course = await Course.findById(new ObjectId(courseID));
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
    startTime: Date.now(),
    finishTime: Date.now() + (course.duration * questions.length),
    questions: testQuestions
  };
  user.activeTests.push(activeTest);
  await user.save();
  return activeTest;
};

/**
 * Update the answer(s) of an active test.
 * @param {object} user - The user's profile.
 * @param {object} body - The answers data.
 * @return {object} The updated user profile.
 */
export const updateAnswers = async (user, body) => {

  let {courseID, data, finished} = body; 
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
    return (await finishTest(user, course));
  }
  // Generate a list of valid question IDs for the questions selected for this test.
  // This helps prevent users from cheating by submitting answers to valid questions that are not in the test scope.
  let validIDs = [];
  course.questions.map(q => validIDs.push(q.id));
  // Map questions IDs to their data
  const newQuestions = {};
  for (let q of data){
    const qid = q.id;
    // Validate the ID and make sure it matches one of the questions selected for the current test.
    if (!validIDs.includes(qid)){
      // This is very likely a cheating attempt.
      // Event should be logged and test terminated.
      logWarning(`Possible cheating attempt by user '${user.username}' on course '${course.courseID}': Submission of questions with invalid or out of scope IDs`);
      await finishTest(user, course);
      throw new Error("Invalid question ID. Test terminated!");
    }
    newQuestions[qid] = q;
  }
  // Apply the updates
  for (let i = 0; i < course.questions.length; i++){ // Loop over all questions in the test
    if (newQuestions[course.questions[i].id]) // Update provided for the current question?
      course.questions[i].answer = parseInt(newQuestions[course.questions[i].id].answer);
  }
  if (finished) // User is done with the test.
    return (await finishTest(user, course));
  else
    return (await user.save());
};

/**
 * Submit/finish an active test. Handles result generation and cache cleanup.
 * @param {object} user - The user's profile.
 * @param {object} activeTest - The active test data.
 * @return {object} The updated user profile.
 */
const finishTest = async (user, activeTest) => {

  // Load the original course data.
  const courseID = activeTest.id;
  const course = await Course.findById(new ObjectId(courseID));
  if (!course)
    throw new Error("Unable to find original course with ID: " + courseID);
  // Start marking.
  let marked = []; // For storing ID of marked questions to detect duplicate submissions.
  let correct = []; // Stores ID of questions user got right.
  let wrong = []; // Stores ID of questions user got wrong.
  // Create a mapping of question IDs to their valid answers.
  let validAnswers = {};
  for (let question of course.questions)
    validAnswers[question.id] = question.answer;
  // Loop over submissions, and mark.
  for (let question of activeTest.questions){
    const questionID = question.id;
    if (marked.includes(questionID)){
      // Duplicate questions submitted.
      // This is very likely to be a cheating attempt by a user, so the test should be invalidated and the event logged.
      correct = 0;
      break;
    }
    marked.push(questionID);
    if (validAnswers[questionID] === question.answer) // User answered correctly?
      correct.push(questionID);
    else
      wrong.push(questionID);
  }
  // Calculate the score in percentage (0 - 100)
  let score = (correct.length / course.questionsCount) * 100;
  // Determine if the user passed or failed.
  let passed = (score >= course.passingScore);
  // Create and save the result.
  let duration = Date.now() - activeTest.startTime;
  if (duration > (activeTest.finishTime - activeTest.startTime)){ // Test duration reported exceed maximum allowed?
    // This can happen if user exits the test without submitting and didn't resume until the time allowed has passed, or when they allow the countdown to finish.
    duration = activeTest.finishTime - activeTest.startTime;
  }
  const result = new Result({
    userID: user._id,
    username: user.username,
    name: user.name,
    courseID,
    courseName: course.name,
    courseTitle: course.title,
    score,
    passingScore: course.passingScore,
    passed,
    passedQuestions: correct,
    failedQuestions: wrong,
    date: Date.now(),
    duration
  });
  await result.save();
  // Clear the test cache from user's profile
  for (let i = 0; i < user.activeTests.length; i++){
    if (user.activeTests[i].id === courseID){
      user.activeTests.splice(i, 1);
      break;
    }
  }
  logStatus(`User '${user.username}' finished test on course '${course.name}'`);
  // Finally, save the user's profile
  return (await user.save());
};

/**
 * Export results of a course to a .xlsx excel file for download.
 * @param {string} courseID - The ID of target course.
 * @return {string} The exported results filename.
 */
export const exportResults = async (courseID) => {

  if (!ObjectId.isValid(courseID))
    throw new Error("Invalid course ID!");
  const results = await Result.find({courseID});
  if (results.length === 0)
    throw new Error("No results available!");
  let course = await Course.findById(new ObjectId(courseID));
  let outfile = `exports/${course.name}-results.xlsx`;
  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet(`${course.name} Results`);
  const colsStyle = workbook.createStyle({
    font: {
      color: 'green'
    }
  })
  const cellsStyle = workbook.createStyle({
    font: {
      color: 'black'
    }
  });
  let colNames = ["S/N", "USERNAME", "NAME", "CORRECT ANSWERS", "WRONG ANSWERS", "SCORE (%)", "REMARK", "DURATION (minutes)", "DATE"];
  worksheet.column(2).setWidth(20);
  worksheet.column(3).setWidth(30);
  worksheet.column(4).setWidth(20);
  worksheet.column(5).setWidth(20);
  worksheet.column(6).setWidth(20);
  worksheet.column(7).setWidth(20);
  worksheet.column(8).setWidth(20);
  worksheet.column(9).setWidth(30);  
  for (let i = 0; i < colNames.length; i++)
    worksheet.cell(1, i + 1).string(colNames[i]).style(colsStyle);
  for (let i = 0; i < results.length; i++){
    const result = results[i];
    const rowIndex = i + 2;
    worksheet.cell(rowIndex, 1).number(i + 1).style(cellsStyle);
    worksheet.cell(rowIndex, 2).string(result.username).style(cellsStyle);
    worksheet.cell(rowIndex, 3).string(result.name).style(cellsStyle);
    worksheet.cell(rowIndex, 4).number(result.passedQuestions.length).style(cellsStyle);
    worksheet.cell(rowIndex, 5).number(result.failedQuestions.length).style(cellsStyle);
    worksheet.cell(rowIndex, 6).number(result.score).style(cellsStyle);
    worksheet.cell(rowIndex, 7).string(result.passed === true ? 'Pass' : 'Fail').style(cellsStyle);
    worksheet.cell(rowIndex, 8).number(parseFloat((result.duration / 60000).toFixed(2))).style(cellsStyle);
    worksheet.cell(rowIndex, 9).string(new Date(result.date).toLocaleString()).style(cellsStyle);
  }
  workbook.write(outfile);
  return outfile;
};

/**
 * Export the questions of a course into a .json file for download.
 * @param {string} courseID - The target course ID.
 * @return {string} The exported questions filename.
 */
export const exportQuestions = async (courseID) => {

  if (!ObjectId.isValid(courseID))
    throw new Error("Invalid course ID");
  const course = await Course.findById(new ObjectId(courseID));
  if (!course)
    throw new Error("Invalid course!");
  let outfile = `exports/${course.name}-questions.json`;
  fs.writeFileSync(outfile, JSON.stringify(course.questions));
  return outfile;
};
