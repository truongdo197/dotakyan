import socketIoJwt from 'socketio-jwt';
import config from '$config';
import log from '$helpers/log';
import { Server } from 'http';
import SocketIO, { Socket } from 'socket.io';
import { MemberType, IsReadMessage, MessageType } from '$enums/common';
// import { isMemberOfConversation } from '$model/chat/ConversationModel';
import { pick } from 'lodash';
const logger = log('Socket utils');

type RoleType = 'admin' | 'salon' | 'app';
interface DecodedToken {
  id?: number; // id of salon or app
  permissions?: number[];
}

interface MembersParams {
  memberId: number;
  isRead?: number;
  memberType: MemberType;
  [key: string]: any;
}

interface InterfaceSocket extends Socket {
  decoded_token: DecodedToken;
  role: MemberType;
}

interface OnlineParams {
  id: number;
  role: MemberType;
  sockets: string[];
  conversations: {
    socketId: string;
    room: string;
  }[];
}

interface IConversationObj {
  id: number;
  lastMessage: string;
  lastTimeSent: string;
  lastReadTime: number;
  lastSentMemberId: number;
  lastSentName: string;
  isRead?: IsReadMessage;
}

interface IMessageObj {
  body: string;
  image: string;
  metadata: string;
  memberId: number;
  messageType: MessageType;
  conversationId: number;
  createdAt: number;
}

let io: SocketIO.Server;

const online: OnlineParams[] = [];

export default async function initSocket(http: Server) {
  try {
    if (!io) {
      io = SocketIO(http, { pingInterval: 2000, pingTimeout: 1000 });
      logger.info('Socket server is running...');
    }

    io.on('connection', socketAuthorize).on('authenticated', async (client: InterfaceSocket) => {
      client.removeAllListeners();
      console.log('Client connected!');

      const dataDecode = client.decoded_token;
      const role: MemberType = client.role;
      let id: number = dataDecode.id;

      switch (role) {
        case MemberType.APP:
          handleAppSocket(client);
          break;
        case MemberType.ADMIN:
          handleCMSSocket(client);
          break;
        default:
          break;
      }

      handleOnline(id, role, client.id);

      joinRoomConversation(client, id);
      leaveSocketRoom(client, id);
      client.on('disconnect', () => {
        handleOffline(client, id, role);
        console.log(`Client id: ${client.id} disconnected`);
      });
    });
  } catch (error) {
    logger.error(error);
  }
}

// Xử lí authentication của socket theo từng role
const socketAuthorize = (socket: InterfaceSocket) => {
  const timeout: number = 86400000; // 1 day to send the authentication message
  let secret: string;
  const role: RoleType = socket.handshake.query.role;

  // socket connect http://localhost:3000?role=admin
  if (role === 'admin') {
    socket.role = MemberType.ADMIN;
    secret = config.auth.CMSAccessTokenSecret;
  }
  // socket connect http://localhost:3000?role=app
  if (role === 'app') {
    socket.role = MemberType.APP;
    secret = config.auth.AccessTokenSecret;
  }

  const middle = socketIoJwt.authorize({ secret, timeout }) as any;
  return middle(socket);
};

async function handleCMSSocket(client: InterfaceSocket) {
  console.log(`[CMS] client connected. Soket id: ${client.id}`);
}

async function handleAppSocket(client: InterfaceSocket) {
  console.log(`[App] client connected. Soket id: ${client.id}`);
}

/**
 * Xử lí online của member kết nối đến socket.
 * Tồn tại trong mảng này rồi thì thêm id vào mảng sokets
 * Chưa tồn tại thì thêm vào mảng.
 * @param id Id của client Cms, Salon hoặc app
 * @param role Vai trò là admin, app, hay cms
 * @param socketId id soket của client
 */
function handleOnline(id: number, role: MemberType, socketId: string) {
  const client: OnlineParams = online.find((item) => item.id === id && item.role === role);

  if (client) {
    const isExist = client.sockets.includes(socketId);
    if (!isExist) client.sockets.push(socketId);
  } else online.push({ id, role, sockets: [socketId], conversations: [] });
}

/**
 * Xử lí offline của member kết nối đến socket.
 * Mảng sockets dài hơn 1 thì bỏ bớt đi, bằng một thì bỏ luôn clien này khỏi mảng
 * @param id Id của client Cms, Salon hoặc app
 * @param role Vai trò là admin, app, hay cms
 * @param socketId id soket của client
 */
function handleOffline(client: InterfaceSocket, id: number, role: MemberType) {
  let position: number;

  const member: OnlineParams = online.find((item, index) => {
    if (item.id === id && item.role === role) position = index;
    return item.id === id && item.role === role;
  });

  if (member && member.sockets.length <= 1) online.splice(position, 1);
  if (member && member.sockets.length > 1) {
    member.sockets = member.sockets.filter((item) => item !== client.id);
    // loại socket này ra khỏi list conversation(nếu có)
    member.conversations = member.conversations.filter((item) => item.socketId !== client.id);
  }
}

/**
 * Kiểm tra trạng thái online của một client.
 * @param id salon_id, member_id hoặc user_id
 * @param role vai trò của client socket.
 */
export function isOnline(id: number, role: MemberType): boolean {
  return online.some((item) => item.id === id && item.role === role);
}

/**
 * Lấy một client đang online từ danh sách online
 * @param id salon_id, member_id hoặc user_id
 * @param role vai trò của client socket.
 */
function getSpecificClientOnline(id: number, role: MemberType): OnlineParams {
  return online.find((item) => item.id === id && item.role === role);
}

/**
 * Bắn socket đến một id & role cụ thể nào đó.
 * @param event sự kiện client lắng nghe.
 * @param data dữ liệu muốn gửi đi.
 */
export async function emitToSpecificClient(id: number, role: MemberType, event: string, data: any): Promise<void> {
  const client = getSpecificClientOnline(id, role);

  if (!client) return;
  if (client.sockets.length === 0) return;

  for (let item of client.sockets) {
    io.to(item).emit(event, data);
  }
}

/**
 * Xử lí cho một client join vào room conversation.
 * @param client client
 */
export async function joinRoomConversation(client: InterfaceSocket, memberId: number) {
  client.on('joinConversation', async ({ conversationId }) => {
    conversationId = Number(conversationId);
    if (!conversationId) return;

    // const isJoinedConversation = await isMemberOfConversation(conversationId, memberId, client.role);
    // if (!isJoinedConversation) return false;

    leaveAllConversations(client);

    client.join(`conversation_${conversationId}`);

    // Thêm conversation và id tương ứng vào.
    const member = online.find((member) => member.id === memberId && member.role === client.role);
    if (member) {
      member.conversations = member.conversations.filter((item) => item.socketId !== client.id);
      member.conversations.push({
        socketId: client.id,
        room: `conversation_${conversationId}`,
      });
    }

    console.log(`${MemberType[client.role]} ${memberId} joined conversation ${conversationId}`);
  });

  client.on('joinAdminConversation', () => {
    client.join(`conversation_admin_${memberId}`);

    const member = online.find((member) => member.id === memberId && member.role === client.role);
    if (member) {
      member.conversations = member.conversations.filter((item) => item.socketId !== client.id);
      member.conversations.push({
        socketId: client.id,
        room: `conversation_admin_${memberId}`,
      });
      console.log(`${MemberType[client.role]} ${memberId} joined conversation admin ${memberId}`);
      console.log(member);
    }
  });
}

/**
 * Xử lí rời ra khỏi conversation.
 * @param client socket client
 * @param memberId id của member tùy vào role: admin, salon hoặc app
 */
export async function leaveSocketRoom(client: InterfaceSocket, memberId: number) {
  client.on('leaveConversation', async ({ conversationId }) => {
    conversationId = Number(conversationId);
    if (!conversationId) return;

    client.leave(`conversation_${conversationId}`);

    // Remove room
    const member = online.find((member) => member.id === memberId && member.role === client.role);
    if (member) member.conversations = member.conversations.filter((item) => item.socketId !== client.id);

    console.log(`member ${memberId} leaved conversation ${conversationId}`);
  });

  client.on('leaveConversationAdmin', async () => {
    client.leave(`conversation_admin_${memberId}`);

    // Remove room
    const member = online.find((member) => member.id === memberId && member.role === client.role);
    if (member) member.conversations = member.conversations.filter((item) => item.socketId !== client.id);

    console.log(`member ${memberId} leaved conversation admin ${memberId}`);
  });
}

/**
 * Gửi dữ liệu về cho client khi có tin nhắn.
 */
export async function pushSocketMessage(
  members: MembersParams[],
  conversationObj: IConversationObj,
  messageObj: IMessageObj
) {
  for (let member of members) {
    const role = member.memberType;
    conversationObj.isRead = member.isRead;
    emitToSpecificClient(member.memberId, role, 'conversations', conversationObj);
  }

  io.in(`conversation_${messageObj.conversationId}`).emit('messages', messageObj);
}

/**
 * Hàm này dùng để kiểm tra xem đối phương có đang nằm trong conversation này không.
 * => Mục đích để xử lí logic đọc tin nhắn.
 * @param memberId Id của member
 * @param memberType Member thuộc loại nào
 * @param conversationId cuộc trò chuyện muốn kiểm tra
 */
export function memberOnlineInConversation(conversationId: number, memberId: number, memberType: MemberType): boolean {
  const member = online.find((member) => member.id === memberId && member.role === memberType);
  if (!member) return;

  const isIn = member.conversations.some((item) => item.room === `conversation_${conversationId}`);
  return isIn;
}

/**
 * Lấy ra những member đang online trong cuộc trò chuyện(đang join trong room)
 * Đẩy vào mảng, hàm này dùng nhằm mục đích update trạng thái đã đọc hay chưa đọc của conversation.
 * @param conversationId
 */
export function getMembersOnlineInConversation(conversationId: number) {
  return online.reduce((acc, cur) => {
    const isInCVS = cur.conversations.some((item) => item.room === `conversation_${conversationId}`);
    if (isInCVS) acc.push({ memberId: cur.id, memberType: cur.role, conversationId });
    return acc;
  }, []);
}

export function leaveAllConversations(client: InterfaceSocket) {
  let rooms = Object.keys(client.adapter.rooms);
  for (let item of rooms) {
    if (item.startsWith('conversation_')) {
      client.leave(item);
    }
  }
}

export function readAllMessage(memberId: number, memberType: MemberType, conversationId: number) {
  io.in(`conversation_${conversationId}`).emit('readAllMessage', { isRead: 1, memberId, memberType, conversationId });
}
