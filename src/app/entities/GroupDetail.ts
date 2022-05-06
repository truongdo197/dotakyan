import { Entity, CreateDateColumn, Column, PrimaryColumn } from 'typeorm';
@Entity('group_detail')
export default class GroupDetail {
  @PrimaryColumn({
    name: 'conversation_id',
    type: 'bigint',
    unsigned: true,
  })
  conversationId: number;

  @Column({ name: 'location_name', type: 'varchar', length: 500, nullable: true, comment: 'Name of the location' })
  locationName: string;

  @Column({ name: 'lat', type: 'decimal', precision: 22, scale: 18, comment: 'Latitude' })
  lat: number;

  @Column({ name: 'lng', type: 'decimal', precision: 22, scale: 18, comment: 'Longitude' })
  lng: number;

  @Column({ name: 'time_start', type: 'datetime' })
  timeStart: string;

  @Column({ name: 'time_end', type: 'datetime' })
  timeEnd: string;

  @Column({ name: 'member_max', type: 'int', default: 5 })
  memberMax: number;

  @Column({ name: 'status', type: 'int', comment: '1: Active, 0: Inactive', default: 1 })
  status: number;

  @Column({ name: 'description', type: 'varchar', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', nullable: true })
  createdAt: Date | string;
}
