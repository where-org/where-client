import type { ReadStream } from 'fs';
import type { w3cwebsocket as Websocket } from 'websocket';

import type * as Where from '@where-org/where-common';

// common

// Config
type Config = {
  url: string,
};

// lib/server/client.js

// Token
export type ServerClientToken = {
  accessToken : string,
  refreshToken: string,
  expiresIn   : number,
};

// ServerClientConfig
export type ServerClientConfig = Config & {
  accessToken?: string,
};

// ServerClientScope
export type ServerClientScope = string;

// ServerClientFile
export type ServerClientFile = ReadStream | File;

// ServerClientFiles
export type ServerClientFiles = ServerClientFile[] | FileList;

// ServerClient
export interface ServerClient {

  login
    (user: string, password: string, passcode?: string): Promise<ServerClientToken>;

  refresh
    (accessToken: string, refreshToken: string): Promise<ServerClientToken>;

  get <T = Where.DataObject>
    (scope: ServerClientScope, condition?: Where.ConditionQuery): Promise<Where.DataArray<T>>;

  post <T = Where.DataObject, U = Where.DataObject>
    (scope: ServerClientScope, data: Where.DataArray<T> | Where.DataObject | T, files?: ServerClientFiles): Promise<Where.DataArray<U>>;

  put <T = Where.DataObject, U = Where.DataObject>
    (scope: ServerClientScope, data: Where.DataArray<T> | Where.DataObject | T, condition: Where.ConditionQuery, files?: ServerClientFiles): Promise<Where.DataArray<U>>;

  delete <T = Where.DataObject>
    (scope: ServerClientScope, condition: Where.ConditionQuery): Promise<Where.DataArray<T>>;

}

// ServerClientInit
export type ServerClientInit = (config: ServerClientConfig) => Promise<ServerClient>;

// Server
export type Server = {
  client: ServerClientInit,
};

// lib/socket/client.js

// SocketClientConfig
export type SocketClientConfig = Config & {

  subProtocol?: string,
  origin?     : string,
  reconnect?  : boolean,

  [option: string]: string | boolean | undefined,

};

// SocketClientAttribute
export type SocketClientAttribute = {
  app: string, group: string, user: string, [option: string]: string,
};

// SocketClientState
export type SocketClientState = number;

// SocketClient
export interface SocketClient {

  readonly attribute: SocketClientAttribute;
  readonly connection: Websocket;

  state
    (): SocketClientState;

  on
    <T>(name: string, cb: T): void;

  send <T = Where.DataObject>
    (data: Where.DataArray<T> | Where.DataObject | T, condition?: Where.ConditionQuery): Promise<void>;

  close
    (): void;

}

// SocketClientInit
export type SocketClientInit = (config: SocketClientConfig) => Promise<SocketClient>;

// SocketEmitter
export interface SocketEmitter {

  on
    <T>(event: string, cb: T): void;

  once
    <T>(event: string, cb: T): void;

  off
    <T>(event: string, cb: T): void;

  emit
    (event: string, ...args: any[]): boolean;

  close
    (): void;

}

// SocketEmitterInit
export type SocketEmitterInit = (config: SocketClientConfig) => Promise<SocketEmitter>;

// Socket
export type Socket = {
  client: SocketClientInit, emitter: SocketEmitterInit,
};

// lib/exception.js

export declare class ConnectionException extends Error {
  constructor(message: string);
}

export declare class ServerException extends Error {
  code: number;
  constructor(message: string, code: number);
}

export declare class UrlException extends Error {
  constructor(message: string);
}

// lib/client.js

// Client
export type Client = <T = ServerClient | SocketClient>
  (config: ServerClientConfig | SocketClientConfig) => Promise<T>;

// Cq - where.cq
export type Cq = {

  parse : Where.CqParse,
  string: Where.CqString,

}

// Da - where.da
export type Da = {
  filter: Where.DaFilter,
};

// const
export declare const server: Server;
export declare const socket: Socket;
export declare const client: Client;

export declare const cq: Cq
export declare const da: Da;
