import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Alert,
    Tabs,
    Tab,
    Checkbox,
    FormGroup
} from '@mui/material';
import { questions, wrongQuestions } from '../services/api';
import Navbar from '../components/Navbar';

const Study = () => {
    const [tab, setTab] = useState(0);
    const [questionList, setQuestionList] = useState([]);
    const [currentAnswers, setCurrentAnswers] = useState({});
    const [showAnswers, setShowAnswers] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        fetchQuestions(tab === 0 ? 'single' : tab === 1 ? 'multiple' : 'boolean');
    }, [tab]);

    const fetchQuestions = async (type) => {
        try {
            const response = await questions.getAll(type);
            setQuestionList(response.data);
            setCurrentAnswers({});
            setShowAnswers({});
        } catch (error) {
            setError('获取题目失败');
        }
    };

    const handleAnswerChange = (questionId, answer, type) => {
        if (type === 'multiple') {
            const currentAnswer = currentAnswers[questionId] || '';
            let newAnswer;
            if (currentAnswer.includes(answer)) {
                newAnswer = currentAnswer.split(',')
                    .filter(a => a && a.trim() && a !== answer)
                    .join(',');
            } else {
                const currentAnswers = currentAnswer ? currentAnswer.split(',').filter(a => a && a.trim()) : [];
                newAnswer = [...currentAnswers, answer].join(',');
            }
            setCurrentAnswers(prev => ({
                ...prev,
                [questionId]: newAnswer
            }));
        } else {
            setCurrentAnswers(prev => ({
                ...prev,
                [questionId]: answer
            }));
        }
    };

    const normalizeAnswer = (answer) => {
        if (!answer) return '';
        return answer.split(',')
            .map(a => a.trim())
            .filter(a => a)
            .sort()
            .join(',');
    };

    const handleCheckAnswer = async (questionId) => {
        const question = questionList.find(q => q._id === questionId);
        let isCorrect;
        
        if (tab === 1) { // 多选题
            const userAnswer = normalizeAnswer(currentAnswers[questionId]);
            const correctAnswer = normalizeAnswer(question.correctAnswer);
            isCorrect = userAnswer === correctAnswer;
            console.log('User answer:', userAnswer, 'Correct answer:', correctAnswer); // 调试用
        } else { // 单选题和判断题
            isCorrect = currentAnswers[questionId] === question.correctAnswer;
        }
        
        if (!isCorrect) {
            try {
                await wrongQuestions.add(questionId, currentAnswers[questionId], 'study');
            } catch (error) {
                console.error('记录错题失败:', error);
            }
        }

        setShowAnswers(prev => ({
            ...prev,
            [questionId]: true
        }));
    };

    const renderQuestion = (question) => {
        let isCorrect;
        if (tab === 1) { // 多选题
            const userAnswer = normalizeAnswer(currentAnswers[question._id]);
            const correctAnswer = normalizeAnswer(question.correctAnswer);
            isCorrect = userAnswer === correctAnswer;
        } else { // 单选题和判断题
            isCorrect = currentAnswers[question._id] === question.correctAnswer;
        }
        const showAnswer = showAnswers[question._id];

        return (
            <Box key={question._id} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    {question.question}
                </Typography>

                {tab === 0 && (
                    <FormControl component="fieldset">
                        <RadioGroup
                            value={currentAnswers[question._id] || ''}
                            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                        >
                            {question.options.map((option, index) => (
                                <FormControlLabel
                                    key={index}
                                    value={String.fromCharCode(65 + index)}
                                    control={<Radio />}
                                    label={`${String.fromCharCode(65 + index)}. ${option}`}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                )}

                {tab === 1 && (
                    <FormGroup>
                        {question.options.map((option, index) => {
                            if (65 + index > 72) return null;
                            const letter = String.fromCharCode(65 + index);
                            const normalizedAnswer = normalizeAnswer(currentAnswers[question._id]);
                            return (
                                <FormControlLabel
                                    key={index}
                                    control={
                                        <Checkbox
                                            checked={normalizedAnswer.split(',').includes(letter)}
                                            onChange={(e) => {
                                                handleAnswerChange(
                                                    question._id,
                                                    letter,
                                                    'multiple'
                                                );
                                            }}
                                        />
                                    }
                                    label={`${letter}. ${option}`}
                                />
                            );
                        })}
                    </FormGroup>
                )}

                {tab === 2 && (
                    <FormControl component="fieldset">
                        <RadioGroup
                            value={currentAnswers[question._id] || ''}
                            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                        >
                            {question.options.map((option, index) => (
                                <FormControlLabel
                                    key={index}
                                    value={String.fromCharCode(65 + index)}
                                    control={<Radio />}
                                    label={`${String.fromCharCode(65 + index)}. ${option}`}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                )}

                <Box sx={{ mt: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => handleCheckAnswer(question._id)}
                        disabled={!currentAnswers[question._id]}
                    >
                        查看答案
                    </Button>

                    {showAnswer && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity={isCorrect ? "success" : "error"}>
                                正确答案: {question.correctAnswer.split(',').map(a => a.trim()).join(', ')}
                            </Alert>
                        </Box>
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <Paper sx={{ width: '100%', mb: 2 }}>
                    <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
                        <Tab label="单选题" />
                        <Tab label="多选题" />
                        <Tab label="判断题" />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                        {questionList.map(renderQuestion)}
                    </Box>
                </Paper>
            </Container>
        </>
    );
};

export default Study; 