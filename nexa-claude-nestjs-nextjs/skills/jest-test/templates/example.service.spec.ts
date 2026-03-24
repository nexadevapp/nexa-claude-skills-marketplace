import { Test, TestingModule } from '@nestjs/testing';
import { ExampleService } from './example.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExampleService', () => {
  let service: ExampleService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExampleService, PrismaService],
    }).compile();

    service = module.get<ExampleService>(ExampleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Clean up test-created data only
  });

  describe('findAll', () => {
    it('should return all records', async () => {
      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return a single record by id', async () => {
      const all = await service.findAll();
      const result = await service.findOne(all[0].id);

      expect(result).toBeDefined();
      expect(result.id).toBe(all[0].id);
    });

    it('should throw when record not found', async () => {
      await expect(service.findOne('nonexistent-id')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const dto = { name: 'Test Record', description: 'Test description' };
      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Record');

      // Cleanup
      await prisma.example.delete({ where: { id: result.id } });
    });
  });

  describe('update', () => {
    it('should update an existing record', async () => {
      const created = await service.create({ name: 'Original', description: 'Desc' });
      const result = await service.update(created.id, { name: 'Updated' });

      expect(result.name).toBe('Updated');

      // Cleanup
      await prisma.example.delete({ where: { id: created.id } });
    });
  });

  describe('remove', () => {
    it('should delete a record', async () => {
      const created = await service.create({ name: 'To Delete', description: 'Desc' });
      await service.remove(created.id);

      await expect(service.findOne(created.id)).rejects.toThrow();
    });
  });
});
