import { Column, Entity, Index, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity('role', { schema: 'furima' })
export default class Role {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'role_name', length: 255 })
  roleName: string;

  @Column('tinyint', { name: 'is_system', default: 0, comment: '1: is a system, 0: not system' })
  isSystem: number;

  @Column('tinyint', { name: 'is_visible', default: 1 })
  isVisible: number;
}
