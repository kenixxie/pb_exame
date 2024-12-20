import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box
} from '@mui/material';
import { useAuth } from '../utils/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    在线考试系统
                </Typography>
                {user && (
                    <Box>
                        {user.role === 'admin' ? (
                            <>
                                <Button color="inherit" component={Link} to="/admin">
                                    管理界面
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button color="inherit" component={Link} to="/dashboard">
                                    主页
                                </Button>
                                <Button color="inherit" component={Link} to="/study">
                                    学习
                                </Button>
                                <Button color="inherit" component={Link} to="/exam">
                                    考试
                                </Button>
                                <Button color="inherit" component={Link} to="/wrong-questions">
                                    错题本
                                </Button>
                            </>
                        )}
                        <Button color="inherit" onClick={handleLogout}>
                            退出
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 