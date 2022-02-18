import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryColumn({ type: 'uuid' })
  hash: string;

  @Column({ type: 'numeric', nullable: true })
  block: number;

  @Column({ type: 'numeric' })
  value: string;

  @Column({ type: 'uuid' })
  to: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;
}
