import { useEffect } from 'react';
import Container from '@mui/material/Container';
import AppBar from '~/components/AppBar/AppBar';

import BoardBar from './BoardBar/BoardBar';
import BoardContent from './BoardContent/BoardContent';

import {
  updateBoardDetailAPI,
  updateColumnDetailAPI,
  moveCardToDifferentColumnAPI
} from '~/apis';

import { cloneDeep } from 'lodash';
import {
  fetchBoardDetailsAPI,
  updateCurrentActiveBoard,
  selectCurrentActiveBoard
} from '~/redux/activeBoard/activeBoardSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import PageLoadingSpinner from '~/components/Loading/PageLoadingSpinner';
import ActiveCard from '~/components/Modal/ActiveCard/ActiveCard';

function Board() {
  const dispatch = useDispatch();
  // const [board, setBoard] = useState(null);
  const board = useSelector(selectCurrentActiveBoard);
  //boardId trùng tên với boarId khai báo Route path /:boardId
  const { boardId } = useParams();

  useEffect(() => {
    // const boardId = '6723a1beb859515ab4ca381c';
    dispatch(fetchBoardDetailsAPI(boardId));
  }, [dispatch, boardId]);

  const moveColumns = (dndOrderedColumns) => {
    const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id);

    const newBoard = { ...board };
    newBoard.columns = dndOrderedColumns;
    newBoard.columnOrderIds = dndOrderedColumnsIds;
    // setBoard(newBoard);
    dispatch(updateCurrentActiveBoard(newBoard));

    //
    updateBoardDetailAPI(newBoard._id, { columnOrderIds: dndOrderedColumnsIds });

  };

  const moveCardInTheSameColumn = (dndOrderedCards, dndOrderedCardsIds, columnId) => {
    // const newBoard = { ...board };
    const newBoard = cloneDeep(board);
    const columnToUpdate = newBoard.columns.find(column => column._id === columnId);
    if (columnToUpdate) {
      columnToUpdate.cards = dndOrderedCards;
      columnToUpdate.cardOrderIds = dndOrderedCardsIds;
    }
    // setBoard(newBoard);
    dispatch(updateCurrentActiveBoard(newBoard));

    updateColumnDetailAPI(columnId, { cardOrderIds: dndOrderedCardsIds });
  };

  const moveCardToDifferentColumn = (currentCardId, prevColumnId, nextColumnId, dndOrderedColumns) => {
    const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id);

    const newBoard = { ...board };
    newBoard.columns = dndOrderedColumns;
    newBoard.columnOrderIds = dndOrderedColumnsIds;
    // setBoard(newBoard);
    dispatch(updateCurrentActiveBoard(newBoard));

    //API
    let prevCardOrderIds = dndOrderedColumns.find(c => c._id === prevColumnId)?.cardOrderIds;
    if (prevCardOrderIds[0].includes('placeholder-card')) prevCardOrderIds = [];

    moveCardToDifferentColumnAPI({
      currentCardId,
      prevColumnId,
      prevCardOrderIds,
      nextColumnId,
      nextCardOrderIds: dndOrderedColumns.find(c => c._id === nextColumnId)?.cardOrderIds
    });
  };

  if (!board) {
    return <PageLoadingSpinner caption='Loading Board...' />;
  }

  return (
    <Container disableGutters maxWidth={false} sx={{ height: '100vh' }}>
      <ActiveCard />
      <AppBar />
      <BoardBar board={board} />
      <BoardContent
        board={board}

        moveColumns={moveColumns}
        moveCardInTheSameColumn={moveCardInTheSameColumn}
        moveCardToDifferentColumn={moveCardToDifferentColumn}
      />
    </Container>
  );
}

export default Board;