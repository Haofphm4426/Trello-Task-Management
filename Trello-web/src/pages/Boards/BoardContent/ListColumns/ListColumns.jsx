import { toast } from 'react-toastify';
import Box from '@mui/material/Box';
import Column from './Column/Column';
import Button from '@mui/material/Button';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import TextField from '@mui/material/TextField';
import CloseIcon from '@mui/icons-material/Close';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { createNewColumnAPI } from '~/apis';
import { generatePlacehoderCard } from '~/utils/formatters';
import { cloneDeep } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentActiveBoard, updateCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice';

function ListColumns({ columns }) {
  const dispatch = useDispatch();
  const board = useSelector(selectCurrentActiveBoard);

  const [openNewColForm, setOpenNewColForm] = useState(false);
  const toggleOpenNewColForm = () => setOpenNewColForm(!openNewColForm);

  const [newColTitle, setNewColTitle] = useState('');

  const addNewColumn = async () => {
    if (!newColTitle) {
      toast.error('Please enter column title');
    }

    const newColumnData = {
      title: newColTitle
    };

    const createdColumn = await createNewColumnAPI({
      ...newColumnData,
      boardId: board._id
    });

    createdColumn.cards = [generatePlacehoderCard(createdColumn)];
    createdColumn.cardOrderIds = [generatePlacehoderCard(createdColumn)._id];

    // const newBoard = { ...board };
    const newBoard = cloneDeep(board);
    newBoard.columns.push(createdColumn);
    newBoard.columnOrderIds.push(createdColumn._id);
    // setBoard(newBoard);
    dispatch(updateCurrentActiveBoard(newBoard));

    //Đóng trạng thái thêm COlumn mới và clear Input
    toggleOpenNewColForm();
    setNewColTitle('');

  };
  return (
    <SortableContext items={columns?.map(c => c._id)} strategy={horizontalListSortingStrategy}>
      <Box sx={{
        bgColor: 'inherit',
        width: '100%',
        height: '100%',
        display: 'flex',
        overflowX: 'auto',
        overflowY: 'hidden',
        '&::-webkit-scrollbar-track': { m: 0.5 }
      }}>
        {columns?.map(col =>
          <Column key={col._id} column={col} />)}

        {!openNewColForm
          ? <Box onClick={toggleOpenNewColForm} sx={{
            minWidth: '250px',
            maxWidth: '250px',
            mx: 2,
            borderRadius: '6px',
            height: 'fit-content',
            bgcolor: '#ffffff3d'
          }}>
            <Button
              startIcon={<NoteAddIcon />}
              sx={{
                width: '100%',
                justifyContent: 'flex-start',
                alignItems: 'center',
                pl: 2.5,
                py: 1,
                color: 'white'
              }}
            >
              Add new column
            </Button>
          </Box>
          : <Box sx={{
            minWidth: '250px',
            maxWidth: '250px',
            mx: 2,
            p: 1,
            borderRadius: '6px',
            height: 'fit-content',
            bgcolor: '#ffffff3d',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            <TextField
              label="Enter column title..."
              type="text"
              size='small'
              variant="outlined"
              autoFocus
              value={newColTitle}
              onChange={(e) => setNewColTitle(e.target.value)}
              sx={{
                '& label': { color: 'white' },
                '& input': { color: 'white' },
                '& label.Mui-focused': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'white' },
                  '&:hover fieldset': { borderColor: 'white' },
                  '&.Mui-focused fieldset': { borderColor: 'white' }
                }
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                className='interceptor-loading'
                onClick={addNewColumn}
                variant='contained' color="success" size="small"
                sx={{
                  boxShadow: 'none',
                  border: '0.5px solid',
                  borderColor: (theme) => theme.palette.success.main,
                  '&:hover': { bgcolor: (theme) => theme.palette.success.main }
                }}
              >
                Add Column
              </Button>
              <CloseIcon
                sx={{
                  color: 'white',
                  cursor: 'pointer',
                  '&:hover': { color: (theme) => theme.palette.warning.light }
                }}
                onClick={toggleOpenNewColForm}
              />
            </Box>
          </Box>
        }
      </Box>
    </SortableContext>
  );
}

export default ListColumns;