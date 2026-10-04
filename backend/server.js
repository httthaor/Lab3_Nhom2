const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_PATH = path.join(__dirname, 'data.json');

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Hàm đọc file data.json
async function readData() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

// Hàm ghi file data.json
async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

// 1. GET /api/posts: Lấy danh sách bài viết
app.get('/api/posts', async (req, res) => {
  const posts = await readData();
  res.json(posts);
});

// 2. POST /api/posts: Tạo bài viết mới
app.post('/api/posts', async (req, res) => {
  const { title, content, author } = req.body;
  if (!title || !content || !author) {
    return res.status(400).json({ error: 'Thiếu dữ liệu' });
  }

  const posts = await readData();
  const newPost = {
    id: Date.now(),
    title,
    content,
    author,
    createdAt: new Date().toISOString(),
    comments: []
  };

  posts.push(newPost);
  await writeData(posts);
  res.status(201).json(newPost);
});

// 3. PUT /api/posts/:id: Chỉnh sửa bài viết (Nâng cao 1)
app.put('/api/posts/:id', async (req, res) => {
  const id = Number(req.params.id);
  const posts = await readData();
  const index = posts.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy' });
  }

  posts[index] = { ...posts[index], ...req.body };
  await writeData(posts);
  res.json(posts[index]);
});

// 4. DELETE /api/posts/:id: Xóa bài viết
app.delete('/api/posts/:id', async (req, res) => {
  const id = Number(req.params.id);
  const posts = await readData();
  const index = posts.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  }

  posts.splice(index, 1);
  await writeData(posts);
  res.json({ message: 'Đã xoá thành công' });
});

// --- MODULE COMMENTS (NÂNG CAO 4) ---

// 5. POST /api/posts/:id/comments: Thêm bình luận vào bài viết
app.post('/api/posts/:id/comments', async (req, res) => {
  const id = Number(req.params.id);
  const { author, content } = req.body;

  if (!author || !content) {
    return res.status(400).json({ error: 'Thiếu người gửi hoặc nội dung' });
  }

  const posts = await readData();
  const post = posts.find(p => p.id === id);

  if (!post) {
    return res.status(404).json({ error: 'Bài viết không tồn tại' });
  }

  if (!post.comments) post.comments = [];
  const newComment = { id: Date.now(), author, content };
  post.comments.push(newComment);

  await writeData(posts);
  res.status(201).json(newComment);
});

// 6. DELETE /api/comments/:commentId: Xoá bình luận
app.delete('/api/comments/:commentId', async (req, res) => {
  const commentId = Number(req.params.commentId);
  const posts = await readData();
  let found = false;

  for (let p of posts) {
    if (p.comments) {
      const idx = p.comments.findIndex(c => c.id === commentId);
      if (idx !== -1) {
        p.comments.splice(idx, 1);
        found = true;
        break;
      }
    }
  }

  if (!found) return res.status(404).json({ error: 'Bình luận không tồn tại' });

  await writeData(posts);
  res.json({ message: 'Đã xoá bình luận' });
});

app.listen(PORT, () => {
  console.log(`Backend chạy tại port :${PORT}`);
});