import { Injectable, Logger } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import Web3 from 'web3';
import { Transaction as EthTransaction, provider } from 'web3-core';
import { TransactionsService } from 'src/transactions/transactions.service';

const listOfAddressToScan = [
  '0x20BB51F8ce53f7a3dD397645aE86D8E9720f5DBD',
  '0xC25417d4defD5c2C91Ad97F548e7C337B8F7e01d',
];

@Injectable()
export class ScanPendingService {
  private readonly logger = new Logger(ScanPendingService.name);
  private provider: provider = null;
  private wssWeb3 = null;

  constructor(private readonly transactionsService: TransactionsService) {
    this.logger.log(ScanPendingService.name + ' constructor. ');

    this.connectWeb3();
    this.watchEtherTransfers();
  }

  connectWeb3() {
    this.provider = new Web3.providers.WebsocketProvider(
      process.env.INFURA_WSS,
    );
    this.wssWeb3 = new Web3(this.provider);
    this.provider.on('error', () => {
      this.logger.error(`Web3 WS encountered an error`);
      this.connectWeb3();
    });
    this.provider.on('end', () => {
      this.logger.error('Web3 WS disconnected. Reconnecting...');
      this.connectWeb3();
    });
  }

  watchEtherTransfers() {
    const subscription = this.wssWeb3.eth.subscribe('pendingTransactions');

    const httpsWeb3 = new Web3(process.env.INFURA_HTTPS);

    subscription
      .subscribe((error, result) => {
        if (error) console.log(error);
      })
      .on('data', async (txHash) => {
        try {
          const trx: EthTransaction = await httpsWeb3.eth.getTransaction(
            txHash,
          );
          if (
            trx?.hash !== null &&
            new BigNumber(trx?.value).isGreaterThan(0) &&
            listOfAddressToScan.includes(trx?.to)
          ) {
            const t = {
              hash: trx.hash,
              block: trx.blockNumber,
              value: trx.value,
              to: trx.to,
              status: 'new',
            };
            this.logger.debug(t);
            try {
              await this.transactionsService.create(t);
            } catch (err) {
              this.logger.error('DB Create Transaction Error', err);
            }
          }
        } catch (error) {
          this.logger.error(error);
        }
      })
      .on('error', async (err) => {
        this.logger.error(err);
      });
  }
}
