import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export default class UserPermission {
  @PrimaryColumn({
    name: 'user_id',
    type: 'int',
    nullable: false,
  })
  userId: number;

  @PrimaryColumn({
    name: 'permission_id',
    type: 'int',
    nullable: false,
  })
  permissionId: number;
}
