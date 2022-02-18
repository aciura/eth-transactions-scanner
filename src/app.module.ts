import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfirmService } from './confirm/confirm.service';
import { ScanPendingService } from './scan-pending/scan-pending.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions/transactions.service';
import { Transaction } from './transactions/transaction.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: '/data/transactions.db.sqlite',
      entities: [Transaction],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Transaction]),
  ],
  providers: [ConfirmService, ScanPendingService, TransactionsService],
})
export class AppModule {}
