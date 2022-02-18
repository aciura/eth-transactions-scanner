import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Transaction as EthTransaction } from 'web3-core';
import { TransactionsService } from 'src/transactions/transactions.service';
import {
  Client,
  ClientKafka,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import Web3 from 'web3';
import { Transaction } from 'src/transactions/transaction.entity';

const MIN_CONFIRMATION_NUMBER = 2;

const microserviceConfig: MicroserviceOptions = {
  transport: Transport.KAFKA,

  options: {
    client: {
      brokers: ['kafka:19092'],
    },
    consumer: {
      groupId: '2',
    },
  },
};

@Injectable()
export class ConfirmService implements OnModuleInit {
  private readonly logger = new Logger(ConfirmService.name);
  @Client(microserviceConfig)
  client: ClientKafka;

  constructor(private readonly transactionsService: TransactionsService) {}

  async onModuleInit() {
    this.logger.debug('ConfirmService onModuleInit');

    await this.client.subscribeToResponseOf('accounting');
  }

  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: 'checkTransactionConfirmations',
  })
  async checkTransactionConfirmations() {
    const web3 = new Web3(process.env.INFURA_HTTPS);

    const currentBlock: number = await web3.eth.getBlockNumber();
    this.logger.debug(`current block: ${currentBlock}`);

    const transactions: Transaction[] =
      await this.transactionsService.getAllWithStatus('new');
    transactions
      .map((tx) => tx.hash)
      .forEach(async (trxHash) => {
        const trx: EthTransaction = await web3.eth.getTransaction(trxHash);

        // For unconfirmed transaction block number is null
        const confirmations =
          trx?.blockNumber == null ? 0 : currentBlock - trx.blockNumber;

        if (confirmations >= MIN_CONFIRMATION_NUMBER) {
          this.logger.debug(`${confirmations} Confirmations for ${trxHash}`);
          await this.transactionsService
            .update({
              hash: trx.hash,
              block: trx.blockNumber,
              value: trx.value,
              to: trx.to,
              status: 'confirmed',
            })
            .catch((err) => this.logger.error(err));
        }
      });
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'sendInfo',
  })
  async sendInfo() {
    const web3 = new Web3(process.env.INFURA_HTTPS);
    const currentBlock: number = await web3.eth.getBlockNumber();

    const transactions: Transaction[] =
      await this.transactionsService.getAllConfirmed();

    transactions.forEach(async (tx) => {
      if (currentBlock - tx.block > MIN_CONFIRMATION_NUMBER) {
        this.logger.debug(`Transactions to send: ${tx.hash} block:${tx.block}`);
        const result = await this.client.send<string>('accounting', {
          op: 'mint',
          uuid: tx.to,
          amount: tx.value,
          hash: tx.hash,
        });
        this.logger.log('Send result: ', JSON.stringify(result));
        await this.transactionsService
          .update({
            hash: tx.hash,
            block: tx.block,
            value: tx.value,
            to: tx.to,
            status: 'send',
          })
          .catch((err) => this.logger.error(err));
      }
    });
  }
}
