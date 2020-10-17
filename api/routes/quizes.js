const express = require("express");
const router = express.Router();
const shortid = require('shortid');
const { auth } = require("../common/auth");
const { validateBody, partiallyValidateBody } = require("../common/http");
const { checkQuizOwnership } = require("../common/validations");

const Question = require("../model/Question");
const Quiz = require("../model/Quiz");
const Student = require('../model/Student');

router.get("/:id", auth, checkQuizOwnership, async (req, res) => {
  try {
    const quiz = await Quiz.getQuizByIdPopulated(req.params.id);
    res.status(200).json(quiz);
  } catch (e) {
    console.log(e.message);
    res.status(400).json({ message: "Could not load item" });
  }
});

router.delete("/:id", auth, checkQuizOwnership, async (req, res) => {
  try {
    const quiz = await Quiz.getQuizByIdPopulated(req.params.id);

    await quiz.remove();
    res.status(200).json({ message: "Item successfully deleted" });
  } catch (e) {
    console.log(e.message);
    res.status(400).json({ message: "Could not load item" });
  }
});

router.post(
  "/:id/question", auth, checkQuizOwnership, validateBody(["text", "points", "scoringSystem"]), async (req, res) => {
    try {
      const quiz = await Quiz.getQuizByIdPopulated(req.params.id);

      const question = new Question(req.body);
      await question.save();
      quiz.questions.push(question);
      await quiz.save();
      res.status(201).json(quiz);
    } catch (e) {
      console.log(e.message);
      res.status(400).json({ message: "Could not load item" });
    }
  }
);

router.patch("/:id", auth, checkQuizOwnership,
  partiallyValidateBody(["name", "date", "duration"]), async (req, res) => {
    try {
      const quiz = await Quiz.updateQuizById(req.params.id, req.body);
      res.status(200).json(quiz);
    } catch (e) {
      console.log(e.message);
      res.status(400).json({ message: "Could not load item" });
    }
  });

//ova nije jos gotova
router.get("", async (req, res) => {
  try {
    const code = req.query.code;
    const quiz = await Quiz.getByCodePopulated(code);
    if (!quiz.isInProgress()) {
      res.status(404).json({
        message: "This quiz isn't in progress. Check the starting date and duration",
        date: quiz.date, duration: quiz.duration
      });
    } else {
      res.status(200).json({ _id: quiz._id, name: quiz.name, date: quiz.date, duration: quiz.duration, questions: quiz.questions });
    }
  } catch (e) {
    console.log(e.message);
    res.status(400).json({ message: "Could not load item" });
  }
});

router.post("/:id/student", auth, checkQuizOwnership, validateBody(['id']), async (req, res) => {
  try {
    await req.classroom.checkIfEnrolled(req.body.id);
    const quiz = await Quiz.findById(req.params.id);
    await quiz.checkIfEnrolled(req.body.id, false);
    quiz.students.push({ id: req.body.id, code: shortid.generate(), points: [] });
    await quiz.save();
    res.status(200).json(quiz);
  } catch (e) {
    res.status(400).json({ message: 'Could not add student' });
  }
});

router.delete('/:id/student', auth, checkQuizOwnership, validateBody(['id']), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    await quiz.checkIfEnrolled(req.body.id, true);
    await quiz.update({ $pull: { students: { id: req.body.id } } });
    res.status(200).json({ message: 'Student removed from quiz' });
  } catch (e) {
    res.status(400).json({ message: 'Could not remove student' });
  }
});

router.get('/:id/students', auth, checkQuizOwnership, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    const studentIds = quiz.students.map(s => s.id);
    const students = await Student.find({ _id: { $in: studentIds } });
    res.status(200).json(students);
  } catch (e) {
    res.status(400).json({ message: 'Unable to load items' });
  }
});

module.exports = router;
