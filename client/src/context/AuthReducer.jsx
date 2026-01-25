const AuthReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        user: null,
        accessToken: null,
        isFetching: true,
        error: false,
        errorMessage: null,
      };
    case "LOGIN_SUCCESS":
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isFetching: false,
        error: false,
        errorMessage: null,
      };
    case "LOGIN_FAILURE":
      return {
        user: null,
        accessToken: null,
        isFetching: false,
        error: true,
        errorMessage: action.payload,
      };
    case "REGISTER_START":
      return {
        ...state,
        isFetching: true,
        error: false,
        errorMessage: null,
      };
    case "REGISTER_FAILURE":
      return {
        user: null,
        accessToken: null,
        isFetching: false,
        error: true,
        errorMessage: action.payload,
      };
    case "LOGOUT":
      return {
        user: null,
        accessToken: null,
        isFetching: false,
        error: false,
        errorMessage: null,
      };
    case "FOLLOW":
      return {
        ...state,
        user: {
          ...state.user,
          followings: [...state.user.followings, action.payload],
          followingsCount: (state.user.followingsCount || 0) + 1,
        },
      };
    case "UNFOLLOW":
      return {
        ...state,
        user: {
          ...state.user,
          followings: state.user.followings.filter(
            (following) => following !== action.payload
          ),
          followingsCount: Math.max(0, (state.user.followingsCount || 1) - 1),
        },
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };
    case "RESET_ERROR":
      return {
        ...state,
        error: false,
        errorMessage: null,
        isFetching: false,
      };
    default:
      return state;
  }
};

export default AuthReducer;
