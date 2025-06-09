export const updateCommentInCardSocket = (socket) => {
  socket.on('FE_UPDATE_CMT_TO_CARD', (updatedCard) => {
    socket.broadcast.emit('BE_UPDATE_CMT_TO_CARD', updatedCard);
  });
};