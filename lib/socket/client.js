import { WebSocket } from './websocket.js';

import { common, cq, da } from '@where-org/where-common';
import * as where from './pack.js';

// client
const client = (config) => {

  const { subProtocol = 'echo-protocol', origin = undefined, reconnect = false, ...c } = config,
        { url, ...attribute } = common.util.url.socket.either(c);

  // url validation
  if (!url.match(/^ws[s]?:\/\//) || ['app', 'group', 'user'].some(k => !attribute[k])) {
    throw new where.UrlException(`"${url}" invalid URL`);
  }

  const on = {},
        sec = 5;

  // wrapper
  const wrapper = {

    message: async (event, cb) => {
      const { data } = event;
      cb(await new Promise(resolve => resolve(JSON.parse(data))).catch(err => data));
    }

  };

  // connect
  const connect = () => {

    return new Promise((resolve, reject) => {

      const connection = new WebSocket(url, subProtocol, origin);

      connection.onerror = (event) => {

        const err = 'Connection refused';

        if (!reconnect) {
          return reject(new where.ConnectionException(err));
        }

        ;;; where.log({ error: err, mesasge: 'Reconnect after 5 seconds.' });

        setTimeout(() => {
          resolve(connect());
        }, sec * 1000);

      }

      connection.onopen = (event) => {
        resolve(connection);
      }

    });

  };

  return new Promise(async (resolve, reject) => {

    const client = {

      attribute,

      connection: await connect().catch(err => reject(err)),

      state: () => client.connection.readyState,

      on: (name, cb) => {

        on[name] = cb;

        if (client.connection) {
          client.connection[`on${name}`] = (event) => {
            (wrapper[name]) ? wrapper[name](event, on[name]) : on[name](event);
          }
        }

      },

      send: async (data, condition) => {

        const wda = da.parse(data),
              wco = (condition && typeof condition === 'string') ? cq.parse(condition) : condition;

        client.connection.send(JSON.stringify({ data: wda, condition: wco || {} }));

      },

      close: () => {
        client.connection.close();
      }

    };

    client.on('message', () => {});

    client.on('close', async (event) => {

      if (!reconnect) {
        return;
      }

      ;;; where.log('The connection to the server is disconnected and will reconnect in 5 seconds.');

      setTimeout(async () => {

        client.connection = await connect(url, subProtocol, origin);

        Object.entries(on).map(([k, v]) => {
          client.on(k, v);
        });

      }, sec * 1000);

    });

    resolve(client);

  });

};

export { client };
