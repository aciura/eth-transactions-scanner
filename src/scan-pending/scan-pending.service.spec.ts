import { Test, TestingModule } from '@nestjs/testing';
import { ScanPendingService } from './scan-pending.service';

describe('ScanPendingService', () => {
  let service: ScanPendingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScanPendingService],
    }).compile();

    service = module.get<ScanPendingService>(ScanPendingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
