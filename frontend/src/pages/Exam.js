import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    FormControl,
    FormControlLabel,
    RadioGroup,
    Radio,
    Checkbox,
    Button,
    Alert,
    FormGroup,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { exam, wrongQuestions } from '../services/api';
import Navbar from '../components/Navbar';

const Exam = () => {
    const [examQuestions, setExamQuestions] = useState(null);
    const [currentAnswers, setCurrentAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [scores, setScores] = useState(null);
    const [error, setError] = useState('');
    const [confirmDialog, setConfirmDialog] = useState(false);

    useEffect(() => {
        startExam();
    }, []);

    const startExam = async () => {
        try {
            const response = await exam.generate();
            setExamQuestions(response.data);
            setCurrentAnswers({});
            setShowResults(false);
            setScores(null);
        } catch (error) {
            setError('获���考试题目失败');
        }
    };

    const handleAnswerChange = (questionId, answer, type) => {
        if (type === 'multiple') {
            setCurrentAnswers(prev => ({
                ...prev,
                [questionId]: answer.split('').sort().join('')
            }));
        } else {
            setCurrentAnswers(prev => ({
                ...prev,
                [questionId]: answer
            }));
        }
    };

    const calculateScores = () => {
        let singleChoiceScore = 0;
        let multipleChoiceScore = 0;
        let booleanScore = 0;

        examQuestions.singleChoice.forEach(q => {
            if (currentAnswers[q._id] === q.correctAnswer) {
                singleChoiceScore += 1;
            }
        });

        examQuestions.multipleChoice.forEach(q => {
            const userAnswer = currentAnswers[q._id] || '';
            const correctAnswer = q.correctAnswer || '';
            if (userAnswer === correctAnswer.split('').sort().join('')) {
                multipleChoiceScore += 2;
            }
        });

        examQuestions.boolean.forEach(q => {
            if (currentAnswers[q._id] === q.correctAnswer) {
                booleanScore += 1;
            }
        });

        return {
            singleChoiceScore,
            multipleChoiceScore,
            booleanScore,
            totalScore: singleChoiceScore + multipleChoiceScore + booleanScore
        };
    };

    const handleSubmit = async () => {
        const scores = calculateScores();
        try {
            await exam.submit(scores);
            setScores(scores);
            setShowResults(true);

            const recordWrongAnswers = async () => {
                for (const q of examQuestions.singleChoice) {
                    if (currentAnswers[q._id] !== q.correctAnswer) {
                        await wrongQuestions.add(q._id, currentAnswers[q._id], 'exam');
                    }
                }

                for (const q of examQuestions.multipleChoice) {
                    const userAnswer = currentAnswers[q._id];
                    const correctAnswer = q.correctAnswer.split('').sort().join('');
                    if (userAnswer !== correctAnswer) {
                        await wrongQuestions.add(q._id, userAnswer, 'exam');
                    }
                }

                for (const q of examQuestions.boolean) {
                    if (currentAnswers[q._id] !== q.correctAnswer) {
                        await wrongQuestions.add(q._id, currentAnswers[q._id], 'exam');
                    }
                }
            };

            await recordWrongAnswers();
        } catch (error) {
            setError('提交考试失败');
        }
    };

    const renderQuestion = (question, type, index) => {
        const showAnswer = showResults;
        const isCorrect = type === 'multiple' 
            ? currentAnswers[question._id] === (question.correctAnswer || '').split('').sort().join('')
            : currentAnswers[question._id] === question.correctAnswer;

        return (
            <Box key={question._id} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    {index + 1}. {question.question}
                </Typography>

                {type !== 'multiple' ? (
                    <FormControl component="fieldset">
                        <RadioGroup
                            value={currentAnswers[question._id] || ''}
                            onChange={(e) => handleAnswerChange(question._id, e.target.value, type)}
                        >
                            {question.options.map((option, index) => (
                                <FormControlLabel
                                    key={index}
                                    value={String.fromCharCode(65 + index)}
                                    control={<Radio />}
                                    label={option}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                ) : (
                    <FormGroup>
                        {question.options.map((option, index) => (
                            <FormControlLabel
                                key={index}
                                control={
                                    <Checkbox
                                        checked={currentAnswers[question._id]?.includes(String.fromCharCode(65 + index)) || false}
                                        onChange={(e) => {
                                            const letter = String.fromCharCode(65 + index);
                                            const currentAnswer = currentAnswers[question._id] || '';
                                            let newAnswer;
                                            if (e.target.checked) {
                                                newAnswer = (currentAnswer + letter).split('').sort().join('');
                                            } else {
                                                newAnswer = currentAnswer.replace(letter, '');
                                            }
                                            handleAnswerChange(question._id, newAnswer, 'multiple');
                                        }}
                                    />
                                }
                                label={option}
                            />
                        ))}
                    </FormGroup>
                )}

                {showAnswer && (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity={isCorrect ? "success" : "error"}>
                            正确答案: {question.correctAnswer || ''}
                        </Alert>
                    </Box>
                )}
            </Box>
        );
    };

    if (!examQuestions) {
        return (
            <>
                <Navbar />
                <Container>
                    <Box sx={{ mt: 4 }}>
                        <Typography>加载中...</Typography>
                    </Box>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                {showResults ? (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            考试结果
                        </Typography>
                        <Typography variant="body1">
                            单选题得分: {scores.singleChoiceScore} / 30
                        </Typography>
                        <Typography variant="body1">
                            多选题得分: {scores.multipleChoiceScore} / 40
                        </Typography>
                        <Typography variant="body1">
                            判断题得分: {scores.booleanScore} / 30
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            总分: {scores.totalScore} / 100
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={startExam}
                            sx={{ mt: 2 }}
                        >
                            重新开始
                        </Button>
                    </Paper>
                ) : (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            在线考试
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            本次考试包含30道单题（每题1分）、20道多选题（每题2分）和30道判断题（每题1分），总分100分。
                        </Typography>

                        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                            一、单选题（共30题，每题1分）
                        </Typography>
                        {examQuestions.singleChoice.map((q, index) => renderQuestion(q, 'single', index))}

                        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                            二、多选题（共20题，每题2分）
                        </Typography>
                        {examQuestions.multipleChoice.map((q, index) => renderQuestion(q, 'multiple', index))}

                        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                            三、判断题（共30题，每题1分）
                        </Typography>
                        {examQuestions.boolean.map((q, index) => renderQuestion(q, 'boolean', index))}

                        <Box sx={{ mt: 4 }}>
                            <Button
                                variant="contained"
                                onClick={() => setConfirmDialog(true)}
                                size="large"
                            >
                                提交考试
                            </Button>
                        </Box>
                    </Paper>
                )}

                <Dialog
                    open={confirmDialog}
                    onClose={() => setConfirmDialog(false)}
                >
                    <DialogTitle>确认提交</DialogTitle>
                    <DialogContent>
                        确定要提交考试吗？提交后将无法修改答案。
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConfirmDialog(false)}>
                            取消
                        </Button>
                        <Button
                            onClick={() => {
                                setConfirmDialog(false);
                                handleSubmit();
                            }}
                            variant="contained"
                        >
                            确认提交
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </>
    );
};

export default Exam; 