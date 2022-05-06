import mongoose from 'mongoose';
const Schema = mongoose.Schema;

export default mongoose.model(
  'Message',
  new Schema({
    conversationId: { type: Number, required: true },
    memberId: { type: Number, required: true },
    body: { type: String, required: false },
    metadata: { type: String, required: false, default: '' },
    image: { type: String, required: false, default: '' },
    status: { type: Number, required: true, default: 1 },
    messageType: { type: Number, default: 1 },
    createdAt: { type: Number, required: true },
  })
);
