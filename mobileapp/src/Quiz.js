import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '@env';

import QuizQuestions from "./QuizQuestions";
import Timer from "./Timer";

export default function (props) {
    const { status, code, classroomId, quiz } = props.route.params;
    const { date, duration } = props.route.params.quiz;


    const [quizState, setQuizState] = useState(status);
    const [loadedQuiz, setLoadedQuiz] = useState(quiz);
    const [results, setResults] = useState(null);


    useEffect(() => {
        async function hookFetch() {
            await fetchQuizResults(code);
        }
        if (status === 2) hookFetch();
    }, []);

    const getStartTimer = () => {
        const startDate = new Date(date);
        return Math.round(Math.abs(startDate.valueOf() - Date.now()) / 1000);
    }

    const getEndTimer = () => {
        const end = new Date(date);
        const endDate = new Date(end.valueOf() + duration * 60 * 1000);
        return Math.round(Math.abs(endDate.valueOf() - Date.now()) / 1000);
    }

    const getQuizTimer = () => {
        return Math.round(duration * 60);
    }

    const setSelected = (quiz, code) => {
        const student = quiz.students.find(s => s.code === code);
        quiz.questions.forEach(q => {
            q.selectedAnswers = [];
            student.points.forEach(p => {
                if (p.questionId === q._id) q.selectedAnswers = p.selectedAnswers;
            });
        });
        setLoadedQuiz(Object.assign({}, quiz));
    }

    const fetch = async code => {
        if (loadedQuiz.questions) {
            setSelected(loadedQuiz, code);
            return;
        }
        const response = await axios.get(`${BASE_URL}/quizzes?code=${code}&classroomId=${classroomId}`);
        const { quiz } = Object(response.data);
        setSelected(quiz, code);
    };

    const fetchQuiz = async code => {
        await fetch(code);
        setQuizState(0);
    };

    const submitQuiz = async (code, submit) => {
        submit.classroomId = classroomId;
        await axios.post(`${BASE_URL}/quizzes/${loadedQuiz._id}/submit?code=${code}`, submit);
        setQuizState(1);
    }

    const fetchQuizResults = async code => {
        await fetch(code);
        //const response = await axios.get(`${BASE_URL}/quizzes/${code}/results`);
        //setResults(response.data);
        setQuizState(2);
    }

    const renderBeforeQuizTimer = () => {
        if (quizState !== -1) return null;
        return (
            <Timer duration={getStartTimer()} timeCallback={() => fetchQuiz(code)} />
        );
    }

    const renderQuiz = () => {
        if (quizState !== 0) return null;
        return (
            <QuizQuestions questions={loadedQuiz.questions} duration={getQuizTimer()} onSubmit={(submit) => submitQuiz(code, submit)} readonly={false} />
        );
    }

    const renderAfterQuizTimer = () => {
        if (quizState !== 1) return null;
        return (
            <Timer duration={getEndTimer()} timeCallback={() => fetchQuizResults(code)} />
        );
    }

    const renderResults = () => {
        if (quizState !== 2) return null;
        return (
            <QuizQuestions questions={loadedQuiz.questions} duration={getQuizTimer()} onSubmit={(submit) => submitQuiz(code, submit)} readonly={true} results={results}/>
        );
    }

    return (
        <View>
            {renderBeforeQuizTimer()}
            {renderQuiz()}
            {renderAfterQuizTimer()}
            {renderResults()}
        </View>
    );
}

