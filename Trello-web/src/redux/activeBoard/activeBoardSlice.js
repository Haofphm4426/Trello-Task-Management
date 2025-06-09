import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import authorizedAxiosInstance from '~/utils/authorizeAxios';
import { API_ROOT } from '~/utils/constants';
import { mapOrder } from '~/utils/sorts';
import { isEmpty } from 'lodash';
import { generatePlacehoderCard } from '~/utils/formatters';

const initialState = {
  currentActiveBoard: null
};

export const fetchBoardDetailsAPI = createAsyncThunk(
  'activeBoard/fetchBoardDetailsAPI',
  async (boardId) => {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/boards/${boardId}`);
    // Lưu ý: axios sẽ trả kết quả về qua property của nó là data
    return response.data;
  }
);

export const activeBoardSlice = createSlice({
  name: 'activeBoard',
  initialState,
  reducers: {
    updateCurrentActiveBoard: (state, action) => {
      const board = action.payload;

      state.currentActiveBoard = board;
    },
    updateCardInBoard: (state, action) => {
      const incomingCard = action.payload;
      const column = state.currentActiveBoard.columns.find(i => i._id === incomingCard.columnId);
      if (column) {
        const card = column.cards.find(i => i._id === incomingCard._id);
        if (card) {
          /**
           * Object.keys để lấy toàn bộ các properties (keys) của incomingCard về một Array rồi forEach nó ra.
           * Sau đó tùy vào trường hợp cần thì kiểm tra thêm còn không thì cập nhật ngược lại giá trị vào card luôn như bên dưới.
          */
          Object.keys(incomingCard).forEach(key => {
            card[key] = incomingCard[key];
          });
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchBoardDetailsAPI.fulfilled, (state, action) => {
      console.log('action: ', action);
      let board = action.payload;

      //Gộp 2 thành viên owner với member vào 1 mảng
      board.allUsers = board.owners.concat(board.members);

      //Sắp xếp thứ tự các col trc khi đưa dữ liệu xuống bên dưới
      board.columns = mapOrder(board?.columns, board?.columnOrderIds, '_id');

      // Khi f5 trang web thì cần xử lý vấn đề kéo thả vào một col rỗng
      board.columns.forEach(column => {
        if (isEmpty(column.cards)) {
          column.cards = [generatePlacehoderCard(column)];
          column.cardOrderIds = [generatePlacehoderCard(column)._id];
        } else {
          column.cards = mapOrder(column.cards, column.cardOrderIds, '_id');
        }
      });

      state.currentActiveBoard = board;
    });
  }

});

export const { updateCurrentActiveBoard, updateCardInBoard } = activeBoardSlice.actions;

//Selector
export const selectCurrentActiveBoard = (state) => {
  return state.activeBoard.currentActiveBoard;
};

export const activeBoardReducer = activeBoardSlice.reducer;