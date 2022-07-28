import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
import bcrypt from 'bcrypt';

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

courseSchema.methods.setPassword = async function(password){
  this.password = await bcrypt.hash(password, 10);
};

courseSchema.methods.isProtected = function(){
  return (this.password !== "null");
};

const Course = mongoose.model('courses', courseSchema);
export default Course;

export const createCourse = async (data) => {

  let {
    name, title, releaseDate, questions, questionsCount, passingScore, duration, password
  } = data;
  name = name.toString().trim();
  title = title.toString().trim();
  releaseDate = parseInt(releaseDate);
  passingScore = parseInt(passingScore);
  if (name.length < 3 || name.length > 30)
    throw new Error("Invalid course name");
  if (await Course.findOne({name}))
    throw new Error("Course with the given name already exists!");
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
  if (password)
    await course.setPassword(password);
  await course.save();
  return true;
};

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

export const deleteCourse = async (id) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid ID!");
  const result = await Course.deleteOne({_id: new ObjectId(id)});
  if (result.deletedCount === 0)
    throw new Error("Invalid course!");
  return result;
};
