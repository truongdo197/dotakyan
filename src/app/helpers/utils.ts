import format from 'string-format';
import { isNumber } from 'lodash';
import config from '$config';
import { ErrorCode, MessageType, ResourceKey, ResourceType } from '$enums/common';
import { ErrorHandler } from './response';

export function handleOutputPaging(data: any[], totalItems: number, params) {
  return {
    data,
    totalItems,
    paging: true,
    pageIndex: params.pageIndex,
    totalPages: Math.ceil(totalItems / params.take),
    hasMore: data ? (data.length < params.take ? false : true) : false,
  };
}

export function handleInputPaging(params) {
  params.pageIndex = Number(params.pageIndex) || 1;
  params.take = Number(params.take) || 10;
  params.skip = (params.pageIndex - 1) * params.take;
  return params;
}

/**
 * @param length(option) length of result.
 */
export function randomOTP(length: number = 6): string {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * digits.length);
    result += digits[index];
  }
  return result;
}

export function randomPassword(length = 6) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  const regexNumber = /\d/gm;
  const regexString = /[A-z]/g;
  const isContainNumber = regexNumber.test(result);
  const isContainString = regexString.test(result);
  if (!isContainNumber || !isContainString) result = randomPassword(length);
  return result;
}

export function getEnumValues(data: Object) {
  const results = Object.values(data);
  return results.filter((item) => isNumber(item));
}

/** handle assign domain url */
export function createImageUrl(img: string, w?: number, h?: number) {
  if (img && !w && !h) return `${config.AWSUpload.domain}/${img}`;
  if (img && img != '' && !img.startsWith('http') && !img.startsWith('https'))
    return format('{0}/{1}x{2}/{3}', config.AWSUpload.domain, String(w), String(h), img);
  return img;
}

function assignImageURL(data, key) {
  const thumbs = config.AWSUpload.thumbs;
  thumbs.forEach((el) => {
    const [w, h] = el.split('x');
    if (w && h) data[key + el] = createImageUrl(data[key], Number(w), Number(h));
  });
  data[key] = createImageUrl(data[key]);
}

export function assignThumbURL(data: any, key: string) {
  if (!data) return data;
  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (item && item[key] && !item[key].startsWith('http')) assignImageURL(item, key);
    });
  } else {
    if (data[key] && data[key]) assignImageURL(data, key);
  }

  return data;
}

export function cutString(body: string, length: number) {
  if (body.length <= length) return body;
  return body.substring(0, length);
}

export function lastMessage(body: string, messageType: MessageType) {
  switch (messageType) {
    case MessageType.TEXT:
      return cutString(body, 100);

    case MessageType.IMAGE:
      return 'Đã gửi một ảnh';
    default:
      return cutString(body, 100);
  }
}

export function getKeyCacheResource(type: ResourceType) {
  let keyCache: string;

  switch (type) {
    case ResourceType.JOB:
      keyCache = ResourceKey.JOB;
      break;

    default:
      throw new ErrorHandler(ErrorCode.Unknown_Error, 400, 'Missing resource key in Enum.');
  }
  return keyCache;
}

export function convertToObject(data: Array<Object>, key: string): { [key: string]: Array<any> } {
  const result = {};
  for (let i = 0; i < data.length; i++) {
    const element = data[i];
    const keyEl = element[key];
    if (!result[keyEl]) {
      result[keyEl] = [];
    }
    delete element[key];
    result[keyEl].push(element);
  }
  return result;
}

export function getKeyCacheMember(memberId: number) {
  return `dota:member:${config.environment}:${memberId}`;
}
