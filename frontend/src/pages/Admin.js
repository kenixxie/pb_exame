import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Tabs,
    Tab,
    Chip,
    Tooltip
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { questions, users } from '../services/api';
import Navbar from '../components/Navbar';

const Admin = () => {
    const [tab, setTab] = useState(0);
    const [userList, setUserList] = useState([]);
    const [questionStats, setQuestionStats] = useState({
        single: 0,
        multiple: 0,
        boolean: 0
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null });
    const [statusDialog, setStatusDialog] = useState({ open: false, userId: null, status: null });
    const [createUserDialog, setCreateUserDialog] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        role: 'user'
    });

    useEffect(() => {
        fetchUsers();
        fetchQuestionStats();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await users.getAll();
            setUserList(response.data);
        } catch (error) {
            setError('获取用户列表失败');
        }
    };

    const fetchQuestionStats = async () => {
        try {
            const singleResponse = await questions.getAll('single');
            const multipleResponse = await questions.getAll('multiple');
            const booleanResponse = await questions.getAll('boolean');

            setQuestionStats({
                single: singleResponse.data.length,
                multiple: multipleResponse.data.length,
                boolean: booleanResponse.data.length
            });
        } catch (error) {
            setError('获取题目统计失败');
        }
    };

    const handleFileUpload = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await questions.import(file, type);
            setSuccess('题目导入成功');
            fetchQuestionStats();
        } catch (error) {
            setError('题目导入失败');
        }
    };

    const handleClearQuestions = async (type) => {
        try {
            await questions.deleteAll(type);
            setSuccess(`${type === 'single' ? '单选题' : type === 'multiple' ? '多选题' : '判断题'}清空成功`);
            fetchQuestionStats();
        } catch (error) {
            setError('清空题目失败');
        }
    };

    const handleDeleteUser = async () => {
        try {
            await users.delete(deleteDialog.userId);
            setSuccess('用户删除成功');
            fetchUsers();
            setDeleteDialog({ open: false, userId: null });
        } catch (error) {
            setError(error.response?.data?.message || '删除用户失败');
        }
    };

    const handleUpdateStatus = async () => {
        try {
            await users.updateStatus(statusDialog.userId, statusDialog.status);
            setSuccess('用户状态更新成功');
            fetchUsers();
            setStatusDialog({ open: false, userId: null, status: null });
        } catch (error) {
            setError(error.response?.data?.message || '更新用户状态失败');
        }
    };

    const handleCreateUser = async () => {
        try {
            await users.create(newUser.username, newUser.password, newUser.role);
            setSuccess('用户创建成功');
            setCreateUserDialog(false);
            setNewUser({ username: '', password: '', role: 'user' });
            fetchUsers();
        } catch (error) {
            setError(error.response?.data?.message || '创建用户失败');
        }
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                
                <Paper sx={{ width: '100%', mb: 2 }}>
                    <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
                        <Tab label="用户管理" />
                        <Tab label="题库管理" />
                    </Tabs>

                    {tab === 0 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                用户管理
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => setCreateUserDialog(true)}
                                >
                                    创建新用户
                                </Button>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>用户名</TableCell>
                                            <TableCell>角色</TableCell>
                                            <TableCell>状态</TableCell>
                                            <TableCell>注册时间</TableCell>
                                            <TableCell>最后登录</TableCell>
                                            <TableCell>操作</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {userList.map((user) => (
                                            <TableRow key={user._id}>
                                                <TableCell>{user.username}</TableCell>
                                                <TableCell>
                                                    {user.role === 'admin' ? '管理员' : '普通用户'}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={user.status === 'active' ? '正常' : '已禁用'}
                                                        color={user.status === 'active' ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(user.createdAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '从未登录'}
                                                </TableCell>
                                                <TableCell>
                                                    {user.role !== 'admin' && (
                                                        <>
                                                            <Tooltip title={user.status === 'active' ? '禁用用户' : '启用用户'}>
                                                                <IconButton
                                                                    onClick={() => setStatusDialog({
                                                                        open: true,
                                                                        userId: user._id,
                                                                        status: user.status === 'active' ? 'disabled' : 'active'
                                                                    })}
                                                                    color={user.status === 'active' ? 'error' : 'success'}
                                                                    size="small"
                                                                >
                                                                    {user.status === 'active' ? <BlockIcon /> : <CheckCircleIcon />}
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="删除用户">
                                                                <IconButton
                                                                    onClick={() => setDeleteDialog({
                                                                        open: true,
                                                                        userId: user._id
                                                                    })}
                                                                    color="error"
                                                                    size="small"
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Dialog
                                open={deleteDialog.open}
                                onClose={() => setDeleteDialog({ open: false, userId: null })}
                            >
                                <DialogTitle>确认删除</DialogTitle>
                                <DialogContent>
                                    确定要删除这个用户吗？操作不可恢复。
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setDeleteDialog({ open: false, userId: null })}>
                                        取消
                                    </Button>
                                    <Button onClick={handleDeleteUser} color="error" variant="contained">
                                        删除
                                    </Button>
                                </DialogActions>
                            </Dialog>

                            <Dialog
                                open={statusDialog.open}
                                onClose={() => setStatusDialog({ open: false, userId: null, status: null })}
                            >
                                <DialogTitle>
                                    确认{statusDialog.status === 'disabled' ? '禁用' : '启用'}用户
                                </DialogTitle>
                                <DialogContent>
                                    确定要{statusDialog.status === 'disabled' ? '禁用' : '启用'}这个用户吗？
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setStatusDialog({ open: false, userId: null, status: null })}>
                                        取消
                                    </Button>
                                    <Button 
                                        onClick={handleUpdateStatus}
                                        color={statusDialog.status === 'disabled' ? 'error' : 'success'}
                                        variant="contained"
                                    >
                                        确认
                                    </Button>
                                </DialogActions>
                            </Dialog>

                            <Dialog
                                open={createUserDialog}
                                onClose={() => setCreateUserDialog(false)}
                            >
                                <DialogTitle>创建新用户</DialogTitle>
                                <DialogContent>
                                    <Box sx={{ pt: 2 }}>
                                        <TextField
                                            fullWidth
                                            label="用户名"
                                            value={newUser.username}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="密码"
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />
                                        <FormControl fullWidth>
                                            <InputLabel>角色</InputLabel>
                                            <Select
                                                value={newUser.role}
                                                label="角色"
                                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            >
                                                <MenuItem value="user">普通用户</MenuItem>
                                                <MenuItem value="admin">管理员</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setCreateUserDialog(false)}>
                                        取消
                                    </Button>
                                    <Button 
                                        onClick={handleCreateUser}
                                        variant="contained"
                                        disabled={!newUser.username || !newUser.password}
                                    >
                                        创建
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </Box>
                    )}

                    {tab === 1 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                题库管理
                            </Typography>
                            
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    单选题 (当前数量: {questionStats.single})
                                </Typography>
                                <Button
                                    variant="contained"
                                    component="label"
                                    sx={{ mr: 2 }}
                                >
                                    导入Excel
                                    <input
                                        type="file"
                                        hidden
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e, 'single')}
                                    />
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleClearQuestions('single')}
                                >
                                    清空题目
                                </Button>
                            </Box>

                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    多选题 (当前数量: {questionStats.multiple})
                                </Typography>
                                <Button
                                    variant="contained"
                                    component="label"
                                    sx={{ mr: 2 }}
                                >
                                    导入Excel
                                    <input
                                        type="file"
                                        hidden
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e, 'multiple')}
                                    />
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleClearQuestions('multiple')}
                                >
                                    清空题目
                                </Button>
                            </Box>

                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    判断题 (当前数量: {questionStats.boolean})
                                </Typography>
                                <Button
                                    variant="contained"
                                    component="label"
                                    sx={{ mr: 2 }}
                                >
                                    导入Excel
                                    <input
                                        type="file"
                                        hidden
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e, 'boolean')}
                                    />
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleClearQuestions('boolean')}
                                >
                                    清空题目
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Paper>
            </Container>
        </>
    );
};

export default Admin; 