import config from '$config';
import { VerificationType } from '$enums/common';
import log from '$helpers/log';
import format from 'string-format';
const client = require('twilio')(config.twilio.sid, config.twilio.token);
const logger = log('SEND SMS');

const verifyCode = '認証コードは{code}です。';
// const forgetPasswordTemplate = '新しいパスワードは{password}です。';
// const forgetPasswordTemplate = '新しいパスワードは下記になります';

const handlePhoneNumber = (phoneNumber: string): string => {
  if (phoneNumber.startsWith('84') || phoneNumber.startsWith('81')) phoneNumber = '+' + phoneNumber;
  if (phoneNumber.startsWith('0')) phoneNumber = '+81' + phoneNumber.substr(1);
  return phoneNumber;
};

export async function sendMessageSMS(type: VerificationType, phoneNumber, body) {
  phoneNumber = handlePhoneNumber(phoneNumber);
  const from = config.twilio.phoneNumber;
  if (type === VerificationType.REGISTER) body = format(verifyCode, { code: body });

  // Khách muốn sửa lại thành bắn 2 tin => oke
  if (type === VerificationType.FORGOT_PASSWORD) {
    body = format(verifyCode, { code: body });
  }

  try {
    await client.messages.create({
      body,
      from,
      to: phoneNumber,
    });
  } catch (error) {
    log('BODY SMS').error({
      body,
      from,
      to: phoneNumber,
    });
    logger.error(error);
  }
}
