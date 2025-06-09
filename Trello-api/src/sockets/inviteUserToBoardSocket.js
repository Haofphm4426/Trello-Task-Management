export const inviteUserToBoardSocket = (socket) => {
  socket.on('FE_INVITE_USER_TO_BOARD', (invitation) => {
    socket.broadcast.emit('BE_INVITE_USER_TO_BOARD', invitation);
  });
};