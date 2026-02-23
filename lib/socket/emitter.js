import { client } from './client.js';

const emitter = async (config) => {

  const eventEmitter = [],
        socket = await client(config);

  socket.on('message', ([message]) => {

    const { event, args } = message;

    if (!event) {
      return;
    }

    eventEmitter.map(v => {

      if (v.event === event) {
        v.cb(...args);
      }

    });

    splice({ event, once: true });

  });

  const splice = (filter) => {

    const splice = () => {

      const some = eventEmitter.some((v1, i) => {

        if (Object.entries(filter).every(([k, v2]) => v1[k] === v2)) {
          eventEmitter.splice(i, 1);
          return true;
        }

        return false;

      });

      if (some) {
        splice();
      }

    }

    splice();

  }

  const emitter = {

    state: () => socket.state(),

    on: (event, cb) => {
      eventEmitter.push({ event, cb, once: false });
    },

    once: async (event, cb) => {
      eventEmitter.push({ event, cb, once: true });
    },

    off: async (event, cb) => {
      splice({ event, cb });
    },

    emit: async (event, ...args) => {
      const data = { event, args },
            condition = { where: { group: socket.attribute.group } };

      socket.send(data, condition);
    },

    close: () => {
      socket.close();
    }

  };

  return emitter;

}

export  { emitter };
