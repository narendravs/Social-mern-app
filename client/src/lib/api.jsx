import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/register") &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        const baseURL = import.meta.env.VITE_API_URL || "/api";
        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        window.location.replace("/login");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

function getEscapeMap() {
  return {
    "&": "\u0026amp;",
    "<": "\u0026lt;",
    ">": "\u0026gt;",
    '"': "\u0026quot;",
    "'": "\u0026#x27;",
    "/": "\u0026#x2F;",
  };
}

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  const map = getEscapeMap();
  return input.replace(/[&<>"'`=/]/g, (char) => map[char] || char);
};

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  refreshToken: () => api.post("/auth/refresh"),
};

export const userAPI = {
  getUser: (userId) => api.get(`/users/${userId}`),
  getAllUsers: (page = 1, limit = 4) =>
    api.get(`/users/?page=${page}&limit=${limit}`),
  getFriends: (userId) => api.get(`/users/friends/${userId}`),
  addFriendsToList: (friendDetails) =>
    api.put(`/users/add-friends`, { friendDetails }),
  removeFriend: (friendId) => api.put(`/users/remove-friends`, { friendId }),
  getUserByUsername: (username) => api.get(`/users/username/${username}`),
  updateUser: (userId, data) => api.put(`/users/${userId}`, data),
  followUser: (userId) => api.put(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.put(`/users/${userId}/unfollow`),
  searchUsers: (query, page = 1, limit = 10) =>
    api.get(`/users/search/${query}?page=${page}&limit=${limit}`),
  getFollowers: (userId, page = 1, limit = 10) =>
    api.get(`/users/${userId}/followers?page=${page}&limit=${limit}`),
  getFollowings: (userId, page = 1, limit = 10) =>
    api.get(`/users/${userId}/followings?page=${page}&limit=${limit}`),
  updateUserImages: (formData, field) =>
    api.post(`/users/update-images?field=${field}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

export const postAPI = {
  // createPost: (data) => api.post("/posts", data),
  createPost: (formData) =>
    api.post("/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  updatePost: (postId, data) => api.put(`/posts/${postId}`, data),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  likePost: (postId) => api.put(`/posts/${postId}/like`),
  addComment: (postId, commentData) =>
    api.post(`/posts/${postId}/comment`, commentData),
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
  getTimeline: (userId, page = 1, limit = 10) =>
    api.get(`/posts/timeline/${userId}?page=${page}&limit=${limit}`),
  getRandomPosts: (page = 1, limit = 10) =>
    api.get(`/posts/random?page=${page}&limit=${limit}`),
  getProfilePosts: (username, page = 1, limit = 10) =>
    api.get(`/posts/profile/${username}?page=${page}&limit=${limit}`),
  getPost: (postId) => api.get(`/posts/${postId}`),
};

export const uploadFile = async (file, type = "post") => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/upload?type=${type}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export default api;
