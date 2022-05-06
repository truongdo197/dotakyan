import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("permission_group", { schema: "furima" })
export default class PermissionGroup {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", unique: true, length: 150 })
  name: string;
}
