import { UserScope } from '@mintit/types';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ nullable: true, select: false })
  totpSecret?: string;

  @Column('text', { array: true, default: () => "'{}'", select: false })
  backupCodes!: string[];

  @Column({ nullable: true, select: false })
  lastUsedTotp?: string;

  @Column('text', { array: true, default: () => `'{${UserScope.ADMIN}}'` })
  scope!: UserScope[];

  @Column({ default: false })
  isValid!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
