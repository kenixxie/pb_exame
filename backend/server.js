require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const xlsx = require('xlsx');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS.split(','),
    credentials: true
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        await initializeDatabase();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Models
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        minlength: 1,
        maxlength: 50
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['admin', 'user'], 
        default: 'user' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    lastLogin: { 
        type: Date 
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active'
    }
}, { 
    timestamps: true,
    collection: 'users'
});

const questionSchema = new mongoose.Schema({
    type: { type: String, enum: ['single', 'multiple', 'boolean'], required: true },
    question: { type: String, required: true },
    options: [String],
    correctAnswer: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

const examResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    singleChoiceScore: Number,
    multipleChoiceScore: Number,
    booleanScore: Number,
    date: { type: Date, default: Date.now }
});

const wrongQuestionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    questionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Question', 
        required: true 
    },
    wrongAnswer: String,
    source: { 
        type: String, 
        enum: ['study', 'exam'], 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    lastReviewedAt: Date,
    reviewCount: { 
        type: Number, 
        default: 0 
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
const Question = mongoose.model('Question', questionSchema);
const ExamResult = mongoose.model('ExamResult', examResultSchema);
const WrongQuestion = mongoose.model('WrongQuestion', wrongQuestionSchema);

// 创建复合索引确保同一用户同一题目只记录一次
wrongQuestionSchema.index({ userId: 1, questionId: 1 }, { unique: true });

// 删除所有索引并重新创建必要的索引
const initializeDatabase = async () => {
    try {
        // 创建新的索引
        await User.collection.createIndex({ username: 1 }, { unique: true });
        
        // 初始化管理员账号
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            await User.create({
                username: 'admin',
                password: hashedPassword,
                role: 'admin',
                status: 'active'
            });
            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Database initialization error:', error);
    }
};

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.xlsx')
    }
});

const upload = multer({ storage: storage });

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Authentication required' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Routes
// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 输入验证
        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' });
        }

        if (username.length < 1 || username.length > 50) {
            return res.status(400).json({ message: '用户名长度必须在1-50个字符之间' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: '密码长度不能少于6个字符' });
        }

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: '用户名已存在' });
        }

        // 创建新用户
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            password: hashedPassword,
            role: 'user',
            status: 'active'
        });

        res.status(201).json({ message: '用户注册成功' });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ message: '注册失败', error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        if (user.status === 'disabled') {
            return res.status(403).json({ message: '账号已被禁用' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        // 更新最后登录时间
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, role: user.role });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ message: '登录失败', error: error.message });
    }
});

// Question management routes
app.post('/api/questions/import', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const { type } = req.body;
        const questions = [];

        for (const row of data) {
            let question = {
                type,
                question: row['题目'],
                options: [],
                correctAnswer: row['正确答案'] || ''
            };

            if (type === 'single') {
                question.options = [row['选项A'], row['选项B'], row['选项C'], row['选项D']].filter(Boolean);
            } else if (type === 'multiple') {
                question.options = [
                    row['选项A'], row['选项B'], row['选项C'], row['选项D'],
                    row['选项E'], row['选项F'], row['选项G'], row['选项H']
                ].filter(Boolean);
                // 确保多选题答案按字母顺序排序
                if (question.correctAnswer) {
                    question.correctAnswer = question.correctAnswer.split('').sort().join('');
                }
            } else if (type === 'boolean') {
                question.options = [row['选项A'], row['选项B']].filter(Boolean);
            }

            // 验证题目数据
            if (!question.question || !question.correctAnswer || question.options.length === 0) {
                continue; // 跳过无效的题目
            }

            questions.push(question);
        }

        if (questions.length === 0) {
            return res.status(400).json({ message: '没有有效的题目可导入' });
        }

        await Question.insertMany(questions);
        res.json({ 
            message: 'Questions imported successfully',
            count: questions.length
        });
    } catch (error) {
        console.error('导入题目错误:', error);
        res.status(500).json({ message: 'Error importing questions', error: error.message });
    }
});

app.get('/api/questions', authenticateToken, async (req, res) => {
    try {
        const { type } = req.query;
        const query = type ? { type } : {};
        const questions = await Question.find(query);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
});

app.delete('/api/questions', authenticateToken, async (req, res) => {
    try {
        const { type } = req.query;
        const query = type ? { type } : {};
        await Question.deleteMany(query);
        res.json({ message: 'Questions deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting questions', error: error.message });
    }
});

// Exam routes
app.get('/api/exam/generate', authenticateToken, async (req, res) => {
    try {
        const singleChoiceQuestions = await Question.aggregate([
            { $match: { type: 'single' } },
            { $sample: { size: 30 } }
        ]);

        const multipleChoiceQuestions = await Question.aggregate([
            { $match: { type: 'multiple' } },
            { $sample: { size: 20 } }
        ]);

        const booleanQuestions = await Question.aggregate([
            { $match: { type: 'boolean' } },
            { $sample: { size: 30 } }
        ]);

        res.json({
            singleChoice: singleChoiceQuestions,
            multipleChoice: multipleChoiceQuestions,
            boolean: booleanQuestions
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating exam', error: error.message });
    }
});

app.post('/api/exam/submit', authenticateToken, async (req, res) => {
    try {
        const { singleChoiceScore, multipleChoiceScore, booleanScore } = req.body;
        const totalScore = singleChoiceScore + multipleChoiceScore + booleanScore;

        const examResult = await ExamResult.create({
            userId: req.user.userId,
            score: totalScore,
            singleChoiceScore,
            multipleChoiceScore,
            booleanScore
        });

        res.json({ message: 'Exam submitted successfully', score: totalScore });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting exam', error: error.message });
    }
});

// User management routes
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: '权限不足' });
        }

        const users = await User.find(
            {}, 
            { password: 0 }
        ).sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({ message: '获取用户列表失败', error: error.message });
    }
});

// 更新用户状态（启用/禁用）
app.patch('/api/users/:userId/status', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: '权限不足' });
        }

        const { userId } = req.params;
        const { status } = req.body;

        if (!['active', 'disabled'].includes(status)) {
            return res.status(400).json({ message: '无效的状态值' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ message: '不能修改管理员状态' });
        }

        user.status = status;
        await user.save();

        res.json({ message: '用户状态更新成功', user });
    } catch (error) {
        console.error('更新用户状态错误:', error);
        res.status(500).json({ message: '更新用户状态失败', error: error.message });
    }
});

// 删除用户
app.delete('/api/users/:userId', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: '权限不足' });
        }

        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ message: '不能删除管理员账号' });
        }

        await User.findByIdAndDelete(userId);
        res.json({ message: '用户删除成功' });
    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({ message: '删除用户失败', error: error.message });
    }
});

// 记录错题
app.post('/api/wrong-questions', authenticateToken, async (req, res) => {
    try {
        const { questionId, wrongAnswer, source } = req.body;
        const userId = req.user.userId;

        await WrongQuestion.findOneAndUpdate(
            { userId, questionId },
            { 
                userId,
                questionId,
                wrongAnswer,
                source,
                $inc: { reviewCount: 1 },
                lastReviewedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ message: '错题记录已保存' });
    } catch (error) {
        console.error('保存错题记录失败:', error);
        res.status(500).json({ message: '保存错题记录失败', error: error.message });
    }
});

// 获取用户的错题列表
app.get('/api/wrong-questions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const wrongQuestions = await WrongQuestion.find({ userId })
            .populate('questionId')
            .sort({ createdAt: -1 });

        res.json(wrongQuestions);
    } catch (error) {
        console.error('获取错题列表失败:', error);
        res.status(500).json({ message: '获取错题列表失败', error: error.message });
    }
});

// 从错题库中删除
app.delete('/api/wrong-questions/:questionId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { questionId } = req.params;

        await WrongQuestion.findOneAndDelete({ userId, questionId });
        res.json({ message: '错题已从错题库中移除' });
    } catch (error) {
        console.error('删除错题记录失败:', error);
        res.status(500).json({ message: '删除错题记录失败', error: error.message });
    }
});

// 添加用户管理相关的API
app.post('/api/users', authenticateToken, async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: '权限不足' });
        }

        const { username, password, role } = req.body;

        // 验证输入
        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' });
        }

        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ message: '无效的用户角色' });
        }

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: '用户名已存在' });
        }

        // 创建新用户
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            password: hashedPassword,
            role,
            status: 'active'
        });

        res.status(201).json({ 
            message: '用��创建成功',
            user: {
                username: user.username,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error('创建用户失败:', error);
        res.status(500).json({ message: '创建用户失败', error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 