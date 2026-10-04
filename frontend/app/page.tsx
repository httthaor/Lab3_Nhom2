'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Comment {
  id: number;
  author: string;
  content: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt?: string;
  comments?: Comment[];
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [author, setAuthor] = useState<string>('');

  // State chỉnh sửa (Nâng cao 1)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');

  // State bình luận (Nâng cao 4)
  const [commentInputs, setCommentInputs] = useState<{ [postId: number]: { author: string; content: string } }>({});

  const fetchPosts = async () => {
    try {
      const res = await api.get<Post[]>('/api/posts');
      setPosts(res.data);
    } catch {
      toast.error('Không thể kết nối server!');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 1. Thêm bài viết mới
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !content || !author) {
      toast.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      await api.post('/api/posts', { title, content, author });
      setTitle('');
      setContent('');
      setAuthor('');
      toast.success('Đăng bài thành công!');
      fetchPosts();
    } catch {
      toast.error('Đăng bài thất bại!');
    }
  };

  // 2. Chỉnh sửa bài viết (PUT)
  const startEdit = (p: Post) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditContent(p.content);
  };

  const handleUpdate = async (id: number) => {
    if (!editTitle || !editContent) {
      toast.error('Không được để trống tiêu đề và nội dung!');
      return;
    }
    try {
      await api.put(`/api/posts/${id}`, { title: editTitle, content: editContent });
      toast.success('Cập nhật bài viết thành công!');
      setEditingId(null);
      fetchPosts();
    } catch {
      toast.error('Cập nhật thất bại!');
    }
  };

  // 3. Xoá bài viết (Optimistic Update)
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn chắc chắn muốn xoá bài viết này?')) return;

    try {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      await api.delete(`/api/posts/${id}`);
      toast.success('Đã xoá bài viết');
    } catch {
      toast.error('Xoá thất bại, thử lại!');
      fetchPosts();
    }
  };

  // 4. Thêm bình luận (Comments)
  const handleAddComment = async (postId: number) => {
    const input = commentInputs[postId];
    if (!input || !input.author || !input.content) {
      toast.error('Vui lòng nhập người gửi và nội dung bình luận!');
      return;
    }

    try {
      await api.post(`/api/posts/${postId}/comments`, input);
      toast.success('Đã gửi bình luận');
      setCommentInputs((prev) => ({ ...prev, [postId]: { author: '', content: '' } }));
      fetchPosts();
    } catch {
      toast.error('Gửi bình luận thất bại!');
    }
  };

  // 5. Xoá bình luận
  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.delete(`/api/comments/${commentId}`);
      toast.success('Đã xóa bình luận');
      fetchPosts();
    } catch {
      toast.error('Không thể xóa bình luận');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Quản Lý Bài Viết (Lab 3 - Nhóm 2)</h1>

      {/* Form tạo bài viết */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 border rounded-lg flex flex-col gap-3">
        <h2 className="font-semibold text-gray-700">Tạo bài viết mới</h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề bài viết..."
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nội dung bài viết..."
          rows={3}
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Tên tác giả..."
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition">
          Đăng bài
        </button>
      </form>

      {/* Danh sách bài viết */}
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Danh sách bài viết:</h2>
      <div className="space-y-4">
        {posts.map((p) => (
          <div key={p.id} className="p-4 border rounded shadow-sm bg-white flex flex-col gap-3">
            {editingId === p.id ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="border px-3 py-1.5 rounded"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="border px-3 py-1.5 rounded"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(p.id)} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded">
                    Lưu
                  </button>
                  <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white text-xs px-3 py-1.5 rounded">
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{p.title}</h3>
                    <p className="text-xs text-gray-500 mb-2">Tác giả: <b>{p.author}</b></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)} className="text-blue-600 border border-blue-200 text-xs px-2.5 py-1 rounded">
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 border border-red-200 text-xs px-2.5 py-1 rounded">
                      Xoá
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{p.content}</p>
              </div>
            )}

            {/* Mục Bình Luận (Comments) */}
            <div className="mt-3 pt-3 border-t bg-gray-50 p-3 rounded">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Bình luận ({p.comments ? p.comments.length : 0}):
              </h4>

              <div className="space-y-2 mb-3">
                {p.comments && p.comments.map((c) => (
                  <div key={c.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border">
                    <span><b>{c.author}:</b> {c.content}</span>
                    <button onClick={() => handleDeleteComment(c.id)} className="text-red-500 hover:underline">
                      Xóa
                    </button>
                  </div>
                ))}
                {(!p.comments || p.comments.length === 0) && (
                  <p className="text-xs text-gray-400 italic">Chưa có bình luận nào.</p>
                )}
              </div>

              {/* Form gửi bình luận */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tên bạn..."
                  value={commentInputs[p.id]?.author || ''}
                  onChange={(e) => setCommentInputs({
                    ...commentInputs,
                    [p.id]: { ...(commentInputs[p.id] || { content: '' }), author: e.target.value }
                  })}
                  className="w-1/3 border px-2 py-1 text-xs rounded"
                />
                <input
                  type="text"
                  placeholder="Viết bình luận..."
                  value={commentInputs[p.id]?.content || ''}
                  onChange={(e) => setCommentInputs({
                    ...commentInputs,
                    [p.id]: { ...(commentInputs[p.id] || { author: '' }), content: e.target.value }
                  })}
                  className="w-2/3 border px-2 py-1 text-xs rounded"
                />
                <button
                  type="button"
                  onClick={() => handleAddComment(p.id)}
                  className="bg-gray-800 hover:bg-black text-white text-xs px-3 py-1 rounded"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}