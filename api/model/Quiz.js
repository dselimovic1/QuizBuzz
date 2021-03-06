const mongoose = require("mongoose");
const { Schema } = mongoose;

const quizSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  students: [{
    id: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    points: [{
      amount: {
        type: Number,
        required: true
      },
      questionId: {
        type: String,
        required: true
      },
      selectedAnswers: []
    }]
  }],
  questions: [
    {
      type: Schema.Types.ObjectId,
      ref: "Question",
    },
  ],
  date: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
});

quizSchema.statics.getQuizByIdPopulated = async (id) => {
  const quiz = await Quiz.findById(id).populate("questions");
  if (!quiz) {
    throw new Error();
  }

  return quiz;
};

quizSchema.methods.classroom = async function () {
  const Classroom = this.model("Classroom");
  return await Classroom.findOne({
    quizzes: { $elemMatch: { $eq: { _id: this._id } } },
  }).exec();
};

quizSchema.methods.studentsList = async function () {
  const Student = this.model('Student');
  const students = this.students.map(s => s.id);
  return await Student.find({ _id: { $in: students } });
}

quizSchema.methods.getStudentById = async function (id) {
  const Student = this.model('Student');
  const student = await Student.findById(id);
  const studentEntry = this.students.find(s => s.id === id);
  return { email: student.email, code: studentEntry.code };
};

quizSchema.methods.checkIfEnrolled = async function (id, value) {
  if (this.students.map(s => s.id).includes(id) === value) {
    return;
  }
  throw new Error();
};

quizSchema.methods.generateCode = async function (id, code) {
  const studentEntry = this.students.find(s => s.id === id);
  studentEntry.code = code;
  await this.save();
};

quizSchema.pre("remove", async function (next) {
  const classroom = await this.classroom();
  classroom.quizzes.remove(this);
  await classroom.save();

  const Question = this.model("Question");
  await Question.deleteMany({ _id: { $in: this.questions } });
  next();
});

quizSchema.statics.updateQuizById = async (id, newQuiz) => {
  const quiz = await Quiz.getQuizByIdPopulated(id);
  // if (Object.keys(newQuiz).includes("date")) {
  //   newQuiz = getBodyWithOffsetDate(newQuiz, 0);
  // }
  Object.keys(newQuiz).forEach((key) => (quiz[key] = newQuiz[key]));
  await quiz.save();
  return quiz;
};

quizSchema.statics.getByCodePopulated = async (myCode) => {
  const quiz = await Quiz.findOne({ "students.code": myCode }).populate("questions");
  if (!quiz) {
    throw new Error();
  }
  return quiz;
};

quizSchema.methods.getProgressStatus = function () {
  const currentDate = new Date();//offsetDate(new Date().getTime(), 2);
  const quizEndDate = new Date((this.date).getTime() + this.duration * 60000);
  if (currentDate < this.date) return -1;
  if (currentDate > quizEndDate) return 2;
  return 0;
};

quizSchema.methods.checkSubmitDate = function (date) {
  const submitDate = date;//offsetDate(date, 2);
  const quizEndDate = new Date((this.date).getTime() + this.duration * 60000);
  if (submitDate > quizEndDate || submitDate < this.date) {
    throw Error("You can't submit this quiz");
  }
};

quizSchema.methods.checkCode = function (code) {
  const valid = this.students.find(s => s.code === code);
  if (!valid) {
    throw Error("This student can't submit this quiz");
  }
};

quizSchema.methods.checkClassroomId = async function (classroomId) {
  const classroom = await this.classroom();
  if (classroom._id.toString() !== classroomId) {
    throw Error("Invalid classroom id");
  }
}

quizSchema.methods.submitAnswers = async function (code, submitForm) {
  const index = this.students.findIndex(s => s.code === code);
  const Question = this.model("Question");
  for (const q of submitForm) {
    const score = await Question.scoreQuestion(q, this);
    this.students[index].points.push(score);
  }
  //console.log(this.students[index]);
  //await this.save();
  return index;
};

quizSchema.methods.isSubmitted = function (code) {
  return this.students.some(s => s.code === code.toString() && s.points.length !== 0);
}

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
