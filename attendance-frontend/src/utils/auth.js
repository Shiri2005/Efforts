export const isAuthenticated = () => {
  const token = localStorage.getItem("access_token");
  return !!token;
};

export const isTeacher = () => {
  return localStorage.getItem("is_staff") === "true";
};
