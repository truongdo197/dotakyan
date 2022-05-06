import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('favorite')
export default class Favorite {
  @PrimaryColumn({ name: 'member_id', type: 'bigint', unsigned: true })
  memberId: number;

  @PrimaryColumn({ name: 'target_id', type: 'bigint', unsigned: true, comment: 'Target like' })
  targetId: number;

  @PrimaryColumn({ name: 'type', type: 'int', default: 1, comment: '1: Favorite member' })
  type: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: string | Date;
}
