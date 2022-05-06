import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('permission', { schema: 'furima' })
export default class Permission {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'group_id', type: 'int', nullable: false })
  groupId: number;
}