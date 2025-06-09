import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import authorizedAxiosInstance from '~/utils/authorizeAxios';
import { API_ROOT } from '~/utils/constants';

const initialState = {
  currentUser: null
};

export const loginUserAPI = createAsyncThunk(
  'user/loginUserAPI',
  async (data) => {
    const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/login`, data);
    // Lưu ý: axios sẽ trả kết quả về qua property của nó là data
    return response.data;
  }
);

export const logoutUserAPI = createAsyncThunk(
  'user/logoutUserAPI',
  async (showSuccessMessage = true) => {
    const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout`);
    if (showSuccessMessage) {
      toast.success('Logged out successfully!');
    }
    return response.data;
  }
);

export const updateUserAPI = createAsyncThunk(
  'user/updateUserAPI',
  async (data) => {
    const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/update`, data);
    return response.data;
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loginUserAPI.fulfilled, (state, action) => {
      const user = action.payload;

      state.currentUser = user;
    });

    builder.addCase(logoutUserAPI.fulfilled, (state) => {
      state.currentUser = null;
    });

    builder.addCase(updateUserAPI.fulfilled, (state, action) => {
      const user = action.payload;
      state.currentUser = user;
    });
  }

});

// export const {} = userSlice.actions;

//Selector
export const selectCurrentUser = (state) => {
  return state.user.currentUser;
};

export const userReducer = userSlice.reducer;