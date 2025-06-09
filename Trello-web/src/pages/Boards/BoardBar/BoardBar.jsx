import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import AddToDriveIcon from '@mui/icons-material/AddToDrive';
import BoltIcon from '@mui/icons-material/Bolt';
import FilterListIcon from '@mui/icons-material/FilterList';
import Tooltip from '@mui/material/Tooltip';
import { capitalizeFirstLetter } from '~/utils/formatters';
import BoardUserGroup from './BoardUserGroup';
import InviteBoardUser from './InviteBoardUser';

const MENU_STYLES = {
  color: 'white',
  bgcolor: 'transparent',
  border: 'none',
  px: '5px',
  borderRadius: '4px',
  '.MuiSvgIcon-root': {
    color: 'white'
  },
  '&:hover': {
    bgcolor: 'primary.50'
  }
};

function BoardBar({ board }) {
  return (
    <Box sx={{
      width: '100%',
      height: (theme) => theme.trello.boardBarHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: 2,
      gap: 2,
      bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
      overflowX: 'auto',
      '&::-webkit-scrollbar-track': { m: 0.5 }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }} >
        <Tooltip title={board?.description}>
          <Chip
            sx={MENU_STYLES}
            icon={<DashboardIcon />}
            label={board?.title}
            clickable
          />
        </Tooltip>
        <Chip
          sx={MENU_STYLES}
          icon={<VpnLockIcon />}
          label={capitalizeFirstLetter(board?.type)}
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<AddToDriveIcon />}
          label="Add to Google Drive"
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<BoltIcon />}
          label="Automation"
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<FilterListIcon />}
          label="Filters"
          clickable
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }} >
        <InviteBoardUser boardId={board._id}/>
        {/* <AvatarGroup
          max={7}
          sx={{
            '& .MuiAvatar-root': {
              width: 34,
              height: 34,
              border: 'none',
              color: 'white',
              fontSize: 16,
              cursor: 'pointer'
            }
          }}
        >
          <Tooltip title='Avatar'>
            <Avatar
              alt="Remy Sharp"
              src='https://images.theconversation.com/files/521751/original/file-20230419-18-hg9dc3.jpg?ixlib=rb-1.1.0&rect=53%2C17%2C1898%2C949&q=45&auto=format&w=1356&h=668&fit=crop'
            />
          </Tooltip>
          <Tooltip title='Avatar'>
            <Avatar 
              alt="Remy Sharp"
              src='https://images.theconversation.com/files/521751/original/file-20230419-18-hg9dc3.jpg?ixlib=rb-1.1.0&rect=53%2C17%2C1898%2C949&q=45&auto=format&w=1356&h=668&fit=crop'
            />
          </Tooltip>
          <Tooltip title='Avatar'>
            <Avatar 
              alt="Remy Sharp"
              src='https://images.theconversation.com/files/521751/original/file-20230419-18-hg9dc3.jpg?ixlib=rb-1.1.0&rect=53%2C17%2C1898%2C949&q=45&auto=format&w=1356&h=668&fit=crop'
            />
          </Tooltip>
          <Tooltip title='Avatar'>
            <Avatar 
              alt="Remy Sharp"
              src='https://images.theconversation.com/files/521751/original/file-20230419-18-hg9dc3.jpg?ixlib=rb-1.1.0&rect=53%2C17%2C1898%2C949&q=45&auto=format&w=1356&h=668&fit=crop'
            />
          </Tooltip>
        </AvatarGroup> */}
        <BoardUserGroup boardUsers={board?.allUsers} />
      </Box>
    </Box>
  );
}

export default BoardBar;
