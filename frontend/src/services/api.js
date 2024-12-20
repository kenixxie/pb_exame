import axios from 'axios';

const API_URL = `${window.location.protocol}//${window.location.hostname}:3001/api`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const auth = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: (username, password) => api.post('/auth/register', { username, password })
};

export const questions = {
    getAll: (type) => api.get('/questions', { params: { type } }),
    import: (file, type) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        return api.post('/questions/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    deleteAll: (type) => api.delete('/questions', { params: { type } })
};

export const exam = {
    generate: () => api.get('/exam/generate'),
    submit: (scores) => api.post('/exam/submit', scores)
};

export const users = {
    getAll: () => api.get('/users'),
    create: (username, password, role) => 
        api.post('/users', { username, password, role }),
    updateStatus: (userId, status) => 
        api.patch(`/users/${userId}/status`, { status }),
    delete: (userId) => api.delete(`/users/${userId}`)
};

export const wrongQuestions = {
    add: (questionId, wrongAnswer, source) => 
        api.post('/wrong-questions', { questionId, wrongAnswer, source }),
    getAll: () => api.get('/wrong-questions'),
    remove: (questionId) => api.delete(`/wrong-questions/${questionId}`)
};

export default api; 