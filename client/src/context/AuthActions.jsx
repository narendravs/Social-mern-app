export const LoginStart = () => ({
  type: "LOGIN_START",
});

export const LoginSuccess = (user, accessToken) => ({
  type: "LOGIN_SUCCESS",
  payload: { user, accessToken },
});

export const Logout = () => ({
  type: "LOGOUT",
});

export const LoginFailure = (error) => ({
  type: "LOGIN_FAILURE",
  payload: error,
});

export const RegisterStart = () => ({
  type: "REGISTER_START",
});

export const RegisterFailure = (error) => ({
  type: "REGISTER_FAILURE",
  payload: error,
});
export const RegisterSuccess = () => ({
  type: "REGISTER_SUCCESS",
});
export const Follow = (userId) => ({
  type: "FOLLOW",
  payload: userId,
});

export const UnFollow = (userId) => ({
  type: "UNFOLLOW",
  payload: userId,
});

export const UpdateUser = (userData) => ({
  type: "UPDATE_USER",
  payload: userData,
});

export const ResetError = () => ({
  type: "RESET_ERROR",
});

export const UpdateError = (error) => ({
  type: "UPDATE_FAILURE",
  payload: error,
});
