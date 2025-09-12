import axios from "axios";

const API_URL = "http://localhost:8000/api"; // ✅ Ensure it matches backend port

// ✅ Signup Function
// ✅ FIXED version — do NOT wrap in try/catch here
export const signup = (name, email, password) => {
  return axios.post(
    `${API_URL}/signup`,
    { name, email, password },
    { withCredentials: true }
  );
};

// ✅ Login Function
export const login = async (email, password) => {
  try {
    const res = await axios.post(
      `${API_URL}/login`,
      { email, password },
      { withCredentials: true }
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { message: "Login failed" };
  }
};

// ✅ Save Answer (Protected Route)
export const saveAnswer = async (
  token,
  question,
  userAnswer,
  aiFeedback,
  score
) => {
  try {
    const res = await axios.post(
      `${API_URL}/saveAnswer`,
      { question, userAnswer, aiFeedback, score },
      { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { message: "Error saving answer" };
  }
};

// ✅ Fetch Answers (Protected Route)
export const fetchAnswers = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/answers`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || { message: "Error fetching answers" };
  }
};
export const fetchUserData = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/user-data`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error("❌ Failed to fetch user data", error);
    return error.response?.data || { message: "Error fetching user data" };
  }
};
