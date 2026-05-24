import axios from 'axios';

import * as where from './pack.js';
const { common, cq, define } = where;

import { userAgent } from './user-agent.js';

const authHeaderConfigs = {
  bearer: { key: 'Authorization', prefix: 'Bearer ', },
  apiKey: { key: 'X-API-Key', prefix: '', },
};

/* client */

const client = async (config) => {

  // url validation
  if (!config.url || !config.url.match(/^http[s]?:\/\//)) {
    throw new where.UrlException(`Invalid URL "${config.url}": expected a URL starting with http:// or https://`);
  }

  const headers = { ...userAgent };

  // url
  const url = (scope, path) => {

    const url = config.url.replace(/\/$/, '');

    path = (!path) ? '' : path.replace(
      /^\/(.*)\/$/, '$1').split(/\\\//).map((v) => (encodeURI(v))).join('%2F');

    return [url, scope, path].join('/');

  };

  // exception
  const throwException = (err) => {

    const { header: xWhereServerException } = where.ServerException,
          { header: xWhereServerError } = where.ServerError;

    const { response } = err;

    // ConnectionException
    if (!response) {
      const { url, method } = err.config ?? {};
      throw new where.ConnectionException(`Could not reach where-server at ${url} (${method?.toUpperCase()})`);
    }

    // ServerException
    if (xWhereServerException.toLowerCase() in response.headers) {

      const debug = decodeURIComponent(response.headers[xWhereServerException.toLowerCase()]) || null,
            { status: number } = response;

      throw new where.ServerException(number, debug);

    }

    // ServerError
    const debug = (xWhereServerError.toLowerCase() in response.headers)
      ? decodeURIComponent(response.headers[xWhereServerError.toLowerCase()])
      : null;

    const { status: number } = response;

    throw new where.ServerError(number, debug);

  };

  // date
  const reviver = (k, v) => (common.util.date.isString(v)) ? new Date(v) : v;

  axios.defaults.transformResponse = [(v) => {

    try {
      return JSON.parse(v, reviver);

    } catch(err) {
      return v;
    }

  }];

  const client = {

    ...config,

    set: (k, v) => {
      client[k] = v;
    },

    setHeader: (k, v) => {

      if (!(k in authHeaderConfigs)) {
        return;
      }

      const { [k]: c } = authHeaderConfigs;
      headers[c.key] = `${c.prefix}${v}`;

    },

    login: async (user, password, passcode) => {

      try {
        const { data: res } = await axios.post(config.url, { user, password, passcode }, { headers });

        client.set('accessToken', res.accessToken);
        client.set('refreshToken', res.refreshToken);

        client.setHeader('bearer', res.accessToken);
        return res;

      } catch(err) {
        return throwException(err);
      }

    },

    refresh: async () => {

      const { refreshToken } = client;

      try {
        const { data: res } = await axios.put(config.url, { refreshToken }, { headers });

        client.set('accessToken', res.accessToken);
        client.set('refreshToken', res.refreshToken);

        client.setHeader('bearer', res.accessToken);
        return res;

      } catch(err) {
        return throwException(err);
      }

    },

    get: async (scope, condition) => {

      const cs = condition && typeof condition !== 'string' ? cq.string(condition) : condition;

      try {
        const { data: res } = await axios.get(url(scope, cs), { headers, data: {} });
        return res;

      } catch(err) {

        if (err.status === 401 && client.autoRefresh && client.refreshToken) {

          await client.refresh();
          // ;;; where.log('The access token has been refreshed successfully.');

          const { data: res } = await axios.get(url(scope, cs), { headers, data: {} });
          return res;
        }

        return throwException(err);

      }

    },

    post: async (scope, data, files) => {

      if (!data) {
        throw new Error(`No data provided for "${scope}": expected \`WhereDataArray\` or \`WhereDataObject\``);
      }

      // file ga nai baai ha application/json
      if (!files || !files.length) {

        const { data: res } = await axios.post(url(scope), data, { headers }).catch(async err => {

          if (err.status === 401 && client.autoRefresh && client.refreshToken) {

            await client.refresh();
            ;;; where.log('The access token has been refreshed successfully.');

            return await axios.post(url(scope), data, { headers });

          }

          return throwException(err);

        });

        return res;
      }

      // file ga aru baai ha multipart/form-data
      const formData = new FormData();
      formData.append(define.multipartFormDataKey, JSON.stringify((Array.isArray(data)) ? data : [data]));

      if (files && files.length) {
        // browser no FileList wo Array ni shite imasu.
        [...files].map(v => formData.append(define.filesKey, v));
      }

      try {

        const { data: res } = await axios.post(url(scope), formData, { headers });
        return res;

      } catch(err) {

        if (err.status === 401 && client.autoRefresh && client.refreshToken) {

          await client.refresh();
          // ;;; where.log('The access token has been refreshed successfully.');

          const { data: res } = await axios.post(url(scope), formData, { headers });
          return res;

        }

        return throwException(err);

      }

    },

    put: async (scope, data, condition, files) => {

      if (!data) {
        throw new Error(`No data provided for "${scope}": expected \`WhereDataArray\` or \`WhereDataObject\``);
      }

      const cs = (condition && typeof condition !== 'string') ? cq.string(condition) : condition;

      // file ga nai baai ha application/json
      if (!files || !files.length) {

        const { data: res } = await axios.put(url(scope, cs), data, { headers }).catch(async err => {

          if (err.status === 401 && client.autoRefresh && client.refreshToken) {

            await client.refresh();
            // ;;; where.log('The access token has been refreshed successfully.');

            return await axios.put(url(scope, cs), data, { headers });
          }

          return throwException(err);

        });

        return res;
      }

      // file ga aru baai ha multipart/form-data
      const formData = new FormData();
      formData.append(define.multipartFormDataKey, JSON.stringify((Array.isArray(data)) ? data : [data]));

      if (files && files.length) {
        // browser no FileList wo Array ni shite imasu.
        [...files].map(v => formData.append(define.filesKey, v));
      }

      try {
        const { data: res } = await axios.put(url(scope, cs), formData, { headers });
        return res;

      } catch(err) {

        if (err.status === 401 && client.autoRefresh && client.refreshToken) {

          await client.refresh();
          // ;;; where.log('The access token has been refreshed successfully.');

          const { data: res } = await axios.put(url(scope, cs), formData, { headers }); 
          return res;

        }

        return throwException(err);

      }

    },

    delete: async (scope, condition) => {

      const cs = (condition && typeof condition !== 'string') ? cq.string(condition) : condition;

      try {
        const { data: res } = await axios.delete(url(scope, cs), { headers });
        return res;

      } catch(err) {

        if (err.status === 401 && client.autoRefresh && client.refreshToken) {

          await client.refresh();
          // ;;; where.log('The access token has been refreshed successfully.');

          const { data: res } = await axios.delete(url(scope, cs), { headers });
          return res;

        }

        return throwException(err);

      }

    }

  };

  // accessToken
  if (!['', null, undefined].includes(config.accessToken)) {
    client.setHeader('bearer', config.accessToken);
  }

  // apiKey
  if (!['', null, undefined].includes(config.apiKey)) {
    client.setHeader('apiKey', config.apiKey);
  }

  return client;

};

export { client };
