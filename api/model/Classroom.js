const mongoose = require("mongoose");
const shortid = require("shortid");
const { Schema } = mongoose;

const classroomSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  quizzes: [
    {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
    },
  ],
  students: [
    {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
});

classroomSchema.pre("remove", async function (next) {
  const Quiz = this.model("Quiz");
  const quizzes = await Quiz.find({ _id: { $in: this.quizzes } });
  for (const q of quizzes) {
    await q.remove();
  }
  next();
});

classroomSchema.methods.addStudent = async function (student) {
  this.students.push(student);
  await this.save();
};

classroomSchema.methods.addQuiz = async function (quiz) {
  this.quizzes.push(quiz);
  await this.save();
};

classroomSchema.methods.checkForDuplicate = async function (email) {
  if (this.students.map(s => s.email).includes(email)) {
    throw new Error();
  }
};

classroomSchema.methods.checkIfEnrolled = async function (id) {
  if (this.students.map(s => s._id.toString()).includes(id)) {
    return;
  }
  throw new Error();
};

classroomSchema.statics.getClassroomByIdAndPopulate = async (
  id,
  collection
) => {
  const classroom = await Classroom.findById(id).populate(collection);
  if (!classroom) {
    throw new Error();
  }

  return classroom;
};

classroomSchema.statics.generateRandomId = () => {
  return shortid.generate();
};

const Classroom = mongoose.model("Classroom", classroomSchema);

module.exports = Classroom;
