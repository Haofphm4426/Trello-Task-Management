import express from 'express';
import cors from 'cors';
import { corsOptions } from '~/config/cors';
import exitHook from 'async-exit-hook';
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb';
import { env } from './config/environment';
import { APIs_V1 } from '~/routes/v1';
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware';
import cookieParser from 'cookie-parser';
import http from 'http';
import socketIo from 'socket.io';
import { inviteUserToBoardSocket } from './sockets/inviteUserToBoardSocket';
import { updateCommentInCardSocket } from './sockets/updateCommentInCardSocket';

const START_SERVER = () => {
  const app = express();

  // Fix cái vụ Cache from disk của ExpressJS
  // https://stackoverflow.com/a/53240717/8324172
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.use(cookieParser());

  app.use(cors(corsOptions));

  app.use(express.json());

  app.use('/v1', APIs_V1);

  //Middleware xử lý lỗi
  app.use(errorHandlingMiddleware);

  //Tạo server bọc app express để làm real-time với socket.io
  const server = http.createServer(app);
  const io = socketIo(server, { cors: corsOptions });
  io.on('connection', (socket) => {
    inviteUserToBoardSocket(socket);
    updateCommentInCardSocket(socket);
  });

  if (env.BUILD_MODE === 'production') {
    server.listen(process.env.PORT, () => {
      console.log(`Production: Hello ${env.AUTHOR}, I am running at ${process.env.PORT}`);
    });
  } else {
    server.listen(env.APP_PORT, env.APP_HOST, () => {
      console.log(`Local: Hello ${env.AUTHOR}, I am running at ${ env.APP_HOST }:${ env.APP_PORT }/`);
    });
  }


  exitHook(() => {
    CLOSE_DB();
  });
};

CONNECT_DB()
  .then(() => console.log('Connected to MongoDB Cloud Atlas'))
  .then(() => START_SERVER())
  .catch(error => {
    console.error(error);
    process.exit(0);
  });
