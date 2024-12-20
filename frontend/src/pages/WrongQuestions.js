import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Alert,
    Tooltip
} from '@mui/material';
import {
    Delete as DeleteIcon
} from '@mui/icons-material';
import { wrongQuestions } from '../services/api';
import Navbar from '../components/Navbar';

const WrongQuestions = () => {
    const [questions, setQuestions] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchWrongQuestions();
    }, []);

    const fetchWrongQuestions = async () => {
        try {
            const response = await wrongQuestions.getAll();
            setQuestions(response.data);
        } catch (error) {
            setError('获取错题列表失败');
        }
    };

    const handleRemove = async (questionId) => {
        try {
            await wrongQuestions.remove(questionId);
            setSuccess('题目已从错题库中移除');
            fetchWrongQuestions();
        } catch (error) {
            setError('移除题目失败');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    const getQuestionTypeText = (type) => {
        switch (type) {
            case 'single':
                return '单选题';
            case 'multiple':
                return '多选题';
            case 'boolean':
                return '判断题';
            default:
                return type;
        }
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Paper sx={{ width: '100%', mb: 2 }}>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            错题本
                        </Typography>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>题目类型</TableCell>
                                        <TableCell>题目</TableCell>
                                        <TableCell>正确答案</TableCell>
                                        <TableCell>你的答案</TableCell>
                                        <TableCell>来源</TableCell>
                                        <TableCell>记录时间</TableCell>
                                        <TableCell>复习次数</TableCell>
                                        <TableCell>操作</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {questions.map((item) => (
                                        <TableRow key={item._id}>
                                            <TableCell>
                                                {getQuestionTypeText(item.questionId.type)}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {item.questionId.question}
                                                </Typography>
                                                <Box sx={{ mt: 1 }}>
                                                    {item.questionId.options.map((option, index) => (
                                                        <Typography 
                                                            key={index} 
                                                            variant="body2" 
                                                            color="text.secondary"
                                                        >
                                                            {String.fromCharCode(65 + index)}. {option}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{item.questionId.correctAnswer}</TableCell>
                                            <TableCell>{item.wrongAnswer}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={item.source === 'study' ? '学习' : '考试'} 
                                                    color={item.source === 'study' ? 'primary' : 'secondary'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{formatDate(item.createdAt)}</TableCell>
                                            <TableCell>{item.reviewCount}</TableCell>
                                            <TableCell>
                                                <Tooltip title="从错题本中移除">
                                                    <IconButton
                                                        onClick={() => handleRemove(item.questionId._id)}
                                                        size="small"
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {questions.length === 0 && (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    暂无错题记录
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Container>
        </>
    );
};

export default WrongQuestions; 