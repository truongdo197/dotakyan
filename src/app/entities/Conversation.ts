import { Entity, CreateDateColumn, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('conversation')
export default class Conversation {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'conversation_name', type: 'varchar', length: 500, nullable: true })
  conversationName: string;

  @Column({ name: 'conversation_avatar', type: 'varchar', length: 500, nullable: true })
  conversationAvatar: string;

  @Column({
    name: 'conversation_type',
    type: 'tinyint',
    nullable: true,
    default: 1,
    comment: '1: common, 2: chat with admin',
  })
  conversationType: number;

  @Column({ name: 'last_message', type: 'text', nullable: true })
  lastMessage: string;

  @Column({ name: 'last_sent_member_id', type: 'bigint', unsigned: true, nullable: true })
  lastSentMemberId: number;

  @Column({ name: 'last_time_sent', type: 'datetime', nullable: true })
  lastTimeSent: string | Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', nullable: true })
  createdAt: Date | string;
}
