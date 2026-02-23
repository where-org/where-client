import axios from 'axios';

import { common, cq, define } from '@where-org/where-common';
import * as where from './pack.js';

import { FormData, userAgent } from './formdata.js';

const client = async (config) => {

  // url validation
  if (!config.url || !config.url.match(/^http[s]?:\/\//)) {

    throw new where.UrlException(
      (config.url) ? `"${config.url}" invalid URL` : '"url" undefined'
    );

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

    if (!response) {
      throw new where.ConnectionException(err.message);
    }

    if (xWhereServerException.toLowerCase() in response.headers) {

      const debug = decodeURIComponent(response.headers[xWhereServerException.toLowerCase()]) || null,
            { status: number } = response;

      throw new where.ServerException(number, debug);

    }

    // ServerError
    const debug = (xWhereServerError.toLowerCase() in response.headers)
      ? decodeURIComponent(response.headers[xWhereServerError.toLowerCase()]) || null
      : null;

    throw new where.ServerError(response.data.error, debug);

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

  // accessToken
  if (!['', null, undefined].includes(config.accessToken)) {
    headers['Authorization'] = `Bearer ${config.accessToken}`;
  }

  return {

    login: async (user, password, passcode) => {

      try {
        const { data: res } = await axios.post(config.url, { user, password, passcode }, { headers });

        headers['Authorization'] = `Bearer ${res.accessToken}`;
        return res;

      } catch(err) {
        return throwException(err);
      }

    },

    refresh: async (accessToken, refreshToken) => {
       
      try {
        const { data: res } = await axios.put(config.url, { accessToken, refreshToken }, { headers });

        headers['Authorization'] = `Bearer ${res.accessToken}`;
        return res;

      } catch(err) {
        return throwException(err);
      }

    },

    get: async (scope, condition) => {

      const cs = (condition && typeof condition !== 'string') ? cq.string(condition) : condition;

      try {
        const { data: res } = await axios.get(url(scope, cs), { headers, data: {} });
        return res;

      } catch(err) {
        return throwException(err);
      }

    },

    post: async (scope, data, files) => {

      if (!data) {
        throw new Error('no data');
      }

      // file ga nai baai ha application/json
      if (!files || !files.length) {

        const { data: res } = await axios.post(url(scope), data, { headers }).catch(err => {
          return throwException(err);
        });

        return res;
      }

      // file ga aru baai ha multipart/form-data
      const formData = new FormData();
      formData.append(define.multipartFormDataKey, JSON.stringify((Array.isArray(data)) ? data : [data]));

      try {

        if (files && files.length) {
          // browser no FileList wo Array ni shite imasu.
          [...files].map(v => formData.append(define.filesKey, v));
        }

        const { data: res } = await axios.post(url(scope), formData, { headers });
        return res;

      } catch(err) {
        return throwException(err);
      }

    },

    put: async (scope, data, condition, files) => {

      if (!data) {
        throw new Error('no data');
      }

      const cs = (condition && typeof condition !== 'string') ? cq.string(condition) : condition;

      // file ga nai baai ha application/json
      if (!files || !files.length) {

        const { data: res } = await axios.put(url(scope, cs), data, { headers }).catch(err => {
          return throwException(err);
        });

        return res;
      }

      // file ga aru baai ha multipart/form-data
      const formData = new FormData();
      formData.append(define.multipartFormDataKey, JSON.stringify((Array.isArray(data)) ? data : [data]));

      try {
        if (files && files.length) {
          // browser no FileList wo Array ni shite imasu.
          [...files].map(v => formData.append(define.filesKey, v));
        }

        const { data: res } = await axios.put(url(scope, cs), formData, { headers });
        return res;

      } catch(err) {
        return throwException(err);
      }

    },

    delete: async (scope, condition) => {

      const cs = (condition && typeof condition !== 'string') ? cq.string(condition) : condition;

      try {
        const { data: res } = await axios.delete(url(scope, cs), { headers });
        return res;

      } catch(err) {
        return throwException(err);
      }

    }

  };

};

export { client };
