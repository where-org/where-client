import * as where from '@where-org/where-common';
const { ConnectionException, UrlException, ServerException, ServerError } = where;

import { client as serverClient } from './server/client.js';
import { client as socketClient } from './socket/client.js';
import { emitter as socketEmitter } from './socket/emitter.js';

const server = { client: serverClient },
      socket = { client: socketClient, emitter: socketEmitter };

const { parse, string } = where.cq,
      cq = { parse, string };

const client = async (config) => {

  return await server.client(config).catch(async (err) => {

    if (err instanceof where.UrlException) {
      return await socket.client(config);
    }

    throw err;

  });

};

export {
  client, server, socket, cq, ConnectionException, UrlException, ServerException,  ServerError, 
};
