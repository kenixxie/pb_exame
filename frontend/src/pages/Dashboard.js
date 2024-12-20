import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    Box
} from '@mui/material';
import {
    School as SchoolIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import Navbar from '../components/Navbar';

const Dashboard = () => {
    const navigate = useNavigate();

    return (
        <>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper
                            sx={{
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                                }
                            }}
                            onClick={() => navigate('/study')}
                        >
                            <SchoolIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h5" gutterBottom>
                                学习模式
                            </Typography>
                            <Typography variant="body1" color="text.secondary" align="center">
                                浏览所有题目并进行练习，每道题目都会即时显示正确答案
                            </Typography>
                            <Button
                                variant="contained"
                                sx={{ mt: 2 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/study');
                                }}
                            >
                                开始学习
                            </Button>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper
                            sx={{
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                                }
                            }}
                            onClick={() => navigate('/exam')}
                        >
                            <AssignmentIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                            <Typography variant="h5" gutterBottom>
                                考试模式
                            </Typography>
                            <Typography variant="body1" color="text.secondary" align="center">
                                随机抽取题目进行考试，完成后显示成绩
                            </Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                sx={{ mt: 2 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/exam');
                                }}
                            >
                                开始考试
                            </Button>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                考试说明
                            </Typography>
                            <Box component="ul" sx={{ pl: 2 }}>
                                <Typography component="li" paragraph>
                                    学习模式：可以查看所有题目，并进行练习。每答完一题后可以立即查看正确答案。
                                </Typography>
                                <Typography component="li" paragraph>
                                    考试模式：系统会随机抽取30个单选题（每题1分）、20个多选题（每题2分）和30个判断题（每题1分），总分100分。
                                </Typography>
                                <Typography component="li" paragraph>
                                    考试提交后会立即显示成绩，并可以查看每道题的正确答案。
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
};

export default Dashboard; 