import api from "./api";

export const getUserProfile = async () => {
  const response = await api.get("/user-profile");
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.put("/user-profile", profileData);
  return response.data;
};

export const getInterviewContext = async () => {
  const response = await api.get("/user-profile/interview-context");
  return response.data;
};

export const saveInterviewHistory = async (interviewData) => {
  const response = await api.post(
    "/user-profile/interview-history",
    interviewData
  );
  return response.data;
};
