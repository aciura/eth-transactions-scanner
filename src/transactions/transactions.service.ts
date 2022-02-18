import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult, Not, IsNull } from 'typeorm';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async create(transaction: Transaction): Promise<Transaction> {
    return await this.transactionRepository.save(transaction);
  }

  async getAll(): Promise<Transaction[]> {
    return await this.transactionRepository.find();
  }

  async getAllConfirmed(): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      block: Not(IsNull()),
      status: 'confirmed',
    });
  }

  async getAllWithStatus(status: string): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      status,
    });
  }

  async update(transaction: Transaction): Promise<UpdateResult> {
    return await this.transactionRepository.update(
      transaction.hash,
      transaction,
    );
  }

  async delete(transactionId: string): Promise<DeleteResult> {
    return await this.transactionRepository.delete(transactionId);
  }
}
