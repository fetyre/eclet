import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsProductService } from '../reviews.service';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ValidateService } from 'src/validate/validate.service';
import { LoggerService } from 'src/settings/logger/logger.service';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { EncryptionService } from 'src/encryption/security.service';
import * as dotenv from 'dotenv';
import { validate } from 'class-validator';
import { CreateReviewsProductInput, UpdateReviewsProductInput } from '../dto';
import { PrismaTestingService } from 'src/settings/prisma.database/test-bd/prisma-testing.service';
import { HttpException, HttpStatus } from '@nestjs/common';
// import { get } from 'ts-jest/utils';
jest.mock('src/settings/logger/logger.service');
jest.mock('src/encryption/encryption.service');
jest.mock('src/validate/validate.service.ts');
dotenv.config();

describe('ReviewsProductService', () => {
	let service: ReviewsProductService;
	let prismaService: PrismaService;
	let configLoaderService: ConfigLoaderService;
	let encryptionServiceMock: jest.Mocked<EncryptionService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ReviewsProductService,
				{
					provide: PrismaService,
					useClass: PrismaTestingService
				},
				LoggerService,
				ConfigService,
				ValidateService,
				ConfigLoaderService,
				EncryptionService
			]
		}).compile();
		prismaService = module.get<PrismaService>(PrismaService);
		service = module.get<ReviewsProductService>(ReviewsProductService);
		configLoaderService = module.get<ConfigLoaderService>(ConfigLoaderService);
	});
	afterEach(async () => {
		await prismaService.$disconnect();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should create a review', async () => {
			// jest.mock('src/validate/validate.service.ts');
			const mockDto = {
				text: 'my otzoiv',
				rating: 5,
				image: ['https://example.com/image1.jpg'],
				productId: 'cln6fy9op0007uqn46m0x9tzc'
			};
			const encryptMock = jest.spyOn(service['encryptionService'], 'encrypt');
			encryptMock.mockResolvedValue('77');
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			await expect(service.create(mockDto, mockUser)).resolves.not.toThrow();
			const review = await prismaService.review.findFirst({
				where: {
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					userId: mockUser.id
				}
			});
			expect(review).toBeDefined();
			expect(review.rating).toBe(5);
			expect(review.userId).toBe(mockUser.id);
			expect(review.productId).toBe(mockDto.productId);
		});

		it('should throw an exception if product already exists', async () => {
			const mockProduct = undefined;
			expect(() => service['checkProduct'](mockProduct)).toThrowError(
				'Продукт не найден'
			);
		});

		it('should throw an exception if a review already exists for the same product and user', async () => {
			const mockReview = await prismaService.review.findFirst({
				where: {
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					userId: 'cln6bidhh0001uq2sxabfw3hu'
				}
			});
			await expect(async () => {
				await service['checkReview'](mockReview);
			}).rejects.toThrow('Вы уже оставили отзыв для этого продукта');
			await prismaService.review.delete({
				where: {
					id: mockReview.id
				}
			});
		});

		it('should validate the input', async () => {
			const mockDto = {
				text: 'Valid text',
				rating: 0,
				image: ['https://example.com/image1.jpg'],
				productId: 'cln6fy9op0007uqn46m0x9tzc'
			};
			const validationErrors = await validate(
				Object.assign(new CreateReviewsProductInput(), mockDto)
			);

			expect(validationErrors.length).toBeGreaterThan(0);
		});

		it('should throw an exception if product ID is not provided', async () => {
			const mockDto = {
				text: 'Valid text',
				rating: 5,
				image: ['https://example.com/image1.jpg'],
				productId: 'cln6fy9op0007uqn46m0x9tzp'
			};
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			await expect(service.create(mockDto, mockUser)).rejects.toThrowError(
				'Продукт не найден'
			);
		});

		it('should create a review without text', async () => {
			const mockDto = {
				rating: 5,
				image: ['https://example.com/image1.jpg'],
				productId: 'cln6fy9op0007uqn46m0x9tzc'
			};
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			await expect(service.create(mockDto, mockUser)).resolves.not.toThrow();
			const review = await prismaService.review.findFirst({
				where: {
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					userId: mockUser.id
				}
			});
			expect(review).toBeDefined();
			expect(review.rating).toBe(5);
			expect(review.userId).toBe(mockUser.id);
			expect(review.productId).toBe(mockDto.productId);
			expect(review.text).toBeNull();
			await prismaService.review.delete({
				where: {
					id: review.id
				}
			});
		});

		it('should create a review with different image formats', async () => {
			const mockDto = {
				text: 'my otzoiv',
				rating: 5,
				image: [
					'https://example.com/image1.jpg',
					'https://example.com/image2.png'
				],
				productId: 'cln6fy9op0007uqn46m0x9tzc'
			};
			const encryptMock = jest.spyOn(service['encryptionService'], 'encrypt');
			encryptMock.mockResolvedValue('mocked_encrypted_text');
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			await expect(service.create(mockDto, mockUser)).resolves.not.toThrow();
			const review = await prismaService.review.findFirst({
				where: {
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					userId: mockUser.id
				}
			});
			expect(review).toBeDefined();
			expect(review.rating).toBe(5);
			expect(review.userId).toBe(mockUser.id);
			expect(review.productId).toBe(mockDto.productId);
			expect(review.text).toBeDefined();
			expect(review.image).toEqual(mockDto.image);
			encryptMock.mockRestore();
			await prismaService.review.delete({
				where: {
					id: review.id
				}
			});
		});

		it('should handle Prisma error during review creation', async () => {
			const mockDto = {
				text: 'my otzoiv',
				rating: 5,
				image: ['https://example.com/image1.jpg'],
				productId: 'cln6fy9op0007uqn46m0x9tzc'
			};
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const createReviewMock = jest.fn(() => {
				throw new Error('ошибка');
			});
			service['createReview'] = createReviewMock;
			await expect(service.create(mockDto, mockUser)).rejects.toThrowError(
				'увы'
			);
		});

		it('should handle Prisma transaction errors gracefully', async () => {
			const transactionMock = jest.spyOn(service['prisma'], '$transaction');
			transactionMock.mockRejectedValue(new Error('ошибка'));
			const mockDto = {
				text: 'my otzoiv',
				rating: 5,
				image: ['https://example.com/image1.jpg'],
				productId: 'cln6fy9op0007uqn46m0x9tzc'
			};
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			await expect(service.create(mockDto, mockUser)).rejects.toThrowError(
				'увы'
			);
			const review = await prismaService.review.findFirst({
				where: {
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					userId: 'cln6bidhh0001uq2sxabfw3hu'
				}
			});
			expect(review).toBeNull();
			transactionMock.mockRestore();
		});

		it('should handle encryption errors gracefully', async () => {
			const encryptMock = jest.spyOn(service['encryptionService'], 'encrypt');
			encryptMock.mockRejectedValue(new Error('ошибка'));
			const mockDto = {
				text: 'my otzoiv',
				rating: 5,
				image: ['https://example.com/image1.jpg'],
				productId: 'cln6fy9op0007uqn46m0x9tzc'
			};
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			await expect(service.create(mockDto, mockUser)).rejects.toThrowError(
				'увы'
			);
			const review = await prismaService.review.findFirst({
				where: {
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					userId: 'cln6bidhh0001uq2sxabfw3hu'
				}
			});
			expect(review).toBeNull();
		});

		it('should handle DTO validation errors gracefully', async () => {
			const validMock = jest.spyOn(service['validateService'], 'validateDto');
			validMock.mockRejectedValue(new Error('ошибка'));
			const mockDto = {
				text: 'my otzoiv',
				rating: 5,
				image: ['https://example.com/image1.jpg'],
				productId: 'cln6fy9op0007uqn46m0x9tzc'
			};
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			await expect(service.create(mockDto, mockUser)).rejects.toThrowError(
				'увы'
			);
			const review = await prismaService.review.findFirst({
				where: {
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					userId: 'cln6bidhh0001uq2sxabfw3hu'
				}
			});
			expect(review).toBeNull();
		});

		it('should handle DTO validation errors gracefully when productId is null', async () => {
			const mockDto = {
				text: 'my otzoiv',
				rating: 5,
				image: ['https://example.com/image1.jpg'],
				productId: null
			};
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			await expect(service.create(mockDto, mockUser)).rejects.toThrowError(
				'увы'
			);
			const review = await prismaService.review.findFirst({
				where: {
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					userId: 'cln6bidhh0001uq2sxabfw3hu'
				}
			});
			expect(review).toBeNull();
		});

		it('should handle DTO validation errors gracefully when user is null', async () => {
			const mockDto = {
				text: 'my otzoiv',
				rating: 5,
				image: ['https://example.com/image1.jpg'],
				productId: 'cln6fy9op0007uqn46m0x9tzc'
			};
			const mockUser = null;
			await expect(service.create(mockDto, mockUser)).rejects.toThrowError(
				'увы'
			);
			const review = await prismaService.review.findFirst({
				where: {
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					userId: 'cln6bidhh0001uq2sxabfw3hu'
				}
			});
			expect(review).toBeNull();
		});
	});

	describe('remove', () => {
		it('should remove a review when user has access', async () => {
			const [mockReview, mockUser] = await Promise.all([
				await prismaService.review.create({
					data: {
						userId: 'cln6bidhh0001uq2sxabfw3hu',
						productId: 'cln6fy9op0007uqn46m0x9tzc',
						rating: 5
					}
				}),
				await prismaService.user.findUnique({
					where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
				})
			]);
			await expect(
				service.remove(mockUser, mockReview.id)
			).resolves.not.toThrow();
			const review = await prismaService.review.findFirst({
				where: {
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					userId: mockUser.id
				}
			});
			expect(review).toBeNull();
		});

		it('should throw an error when attempting to remove a review with invalid ID', async () => {
			const encryptMock = jest.spyOn(service['validateService'], 'checkId');
			encryptMock.mockRejectedValue(new Error('qwe'));
			await expect(
				service.remove(null, 'qweqweqweqweqweqweqwe')
			).rejects.toThrowError('увы');
		});

		it('should throw an error when ensuring a review exists with undefined input', async () => {
			await expect(async () => {
				await service['ensureReviewExists'](undefined);
			}).rejects.toThrow('Отзыв не найден для указанного продукта');
		});

		it('should throw an error when removing a review with undefined user', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			await expect(
				service.remove(mockUser, 'cln6bidhh0001uq2sxabfw3hu')
			).rejects.toThrow('Отзыв не найден для указанного продукта');
		});

		it('should throw an error when removing a review with an invalid user role', async () => {
			const [mockReview, mockUser] = await Promise.all([
				await prismaService.review.create({
					data: {
						userId: 'cln6bidhh0001uq2sxabfw3hu',
						productId: 'cln6fy9op0007uqn46m0x9tzc',
						rating: 5
					}
				}),
				await prismaService.user.findUnique({
					where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
				})
			]);
			mockUser.role = 'anonim';
			await expect(service.remove(mockUser, mockReview.id)).rejects.toThrow(
				'Недопустимая роль пользователя'
			);
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when removing a review with invalid user access', async () => {
			const [mockReview, mockUser] = await Promise.all([
				await prismaService.review.create({
					data: {
						userId: 'cln6bidhh0001uq2sxabfw3hu',
						productId: 'cln6fy9op0007uqn46m0x9tzc',
						rating: 5
					}
				}),
				await prismaService.user.create({ data: { role: 'user' } })
			]);
			await expect(service.remove(mockUser, mockReview.id)).rejects.toThrow(
				'Ошибка доступа'
			);
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when removing a review with a transaction error', async () => {
			const [mockReview, mockUser] = await Promise.all([
				await prismaService.review.create({
					data: {
						userId: 'cln6bidhh0001uq2sxabfw3hu',
						productId: 'cln6fy9op0007uqn46m0x9tzc',
						rating: 5
					}
				}),
				await prismaService.user.findUnique({
					where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
				})
			]);
			const transactionMock = jest.spyOn(service['prisma'], '$transaction');
			transactionMock.mockRejectedValue(new Error('ошибка'));
			await expect(service.remove(mockUser, mockReview.id)).rejects.toThrow(
				'увы'
			);
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.toEqual(expect.anything());
		});

		it('should throw an error when removing a review with decryption error', async () => {
			const [mockReview, mockUser] = await Promise.all([
				await prismaService.review.create({
					data: {
						text: 'qweqweqwe',
						userId: 'cln6bidhh0001uq2sxabfw3hu',
						productId: 'cln6fy9op0007uqn46m0x9tzc',
						rating: 5
					}
				}),
				await prismaService.user.findUnique({
					where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
				})
			]);
			const transactionMock = jest.spyOn(
				service['encryptionService'],
				'decrypt'
			);
			transactionMock.mockRejectedValue(new Error('ошибка'));
			await expect(service.remove(mockUser, mockReview.id)).rejects.toThrow(
				'увы'
			);
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.toEqual(expect.anything());
		});

		it('should not throw an error when removing a review with decryption error for an admin user', async () => {
			const [mockReview, mockUser] = await Promise.all([
				await prismaService.review.create({
					data: {
						text: 'qweqweqwe',
						userId: 'cln6bidhh0001uq2sxabfw3hu',
						productId: 'cln6fy9op0007uqn46m0x9tzc',
						rating: 5
					}
				}),
				await prismaService.user.findUnique({
					where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
				})
			]);
			mockUser.role = 'admin';
			await expect(
				service.remove(mockUser, mockReview.id)
			).resolves.not.toThrow();
		});

		it('should not throw an error when removing a review with decryption error for a super admin user', async () => {
			const [mockReview, mockUser] = await Promise.all([
				await prismaService.review.create({
					data: {
						text: 'qweqweqwe',
						userId: 'cln6bidhh0001uq2sxabfw3hu',
						productId: 'cln6fy9op0007uqn46m0x9tzc',
						rating: 5
					}
				}),
				await prismaService.user.findUnique({
					where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
				})
			]);
			mockUser.role = 'superAdmin';
			await expect(
				service.remove(mockUser, mockReview.id)
			).resolves.not.toThrow();
		});

		it('should throw an error when removing a review with a transaction error for a super admin user', async () => {
			const [mockReview, mockUser] = await Promise.all([
				await prismaService.review.create({
					data: {
						userId: 'cln6bidhh0001uq2sxabfw3hu',
						productId: 'cln6fy9op0007uqn46m0x9tzc',
						rating: 5
					}
				}),
				await prismaService.user.findUnique({
					where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
				})
			]);
			const transactionMock = jest.spyOn(service['prisma'], '$transaction');
			transactionMock.mockRejectedValue(new Error('ошибка'));
			mockUser.role = 'superAdmin';
			await expect(service.remove(mockUser, mockReview.id)).rejects.toThrow(
				'увы'
			);
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.toEqual(expect.anything());
		});

		it('should throw an error when removing a review with a transaction error for an admin user', async () => {
			const [mockReview, mockUser] = await Promise.all([
				await prismaService.review.create({
					data: {
						userId: 'cln6bidhh0001uq2sxabfw3hu',
						productId: 'cln6fy9op0007uqn46m0x9tzc',
						rating: 5
					}
				}),
				await prismaService.user.findUnique({
					where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
				})
			]);
			const transactionMock = jest.spyOn(service['prisma'], '$transaction');
			transactionMock.mockRejectedValue(new Error('ошибка'));
			mockUser.role = 'admin';
			await expect(service.remove(mockUser, mockReview.id)).rejects.toThrow(
				'увы'
			);
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.toEqual(expect.anything());
		});
	});

	describe('findOne', () => {
		it('should retrieve and delete a review', async () => {
			const mockReview = await prismaService.review.create({
				data: {
					userId: 'cln6bidhh0001uq2sxabfw3hu',
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					rating: 5
				},
				include: {
					product: true,
					user: true
				}
			});
			expect(mockReview).toBeDefined();
			await expect(service.findOne(mockReview.id)).resolves.toEqual({
				...mockReview
			});
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});

		it('should handle error when retrieving a review with invalid ID using checkId', async () => {
			const transactionMock = jest.spyOn(service['validateService'], 'checkId');
			transactionMock.mockRejectedValue(new Error('ошибка'));
			await expect(service.findOne('qweqweqwe')).rejects.toThrow('увы');
		});

		it('should handle error when retrieving a review with invalid ID using findReviewByIdWithDetails', async () => {
			const createReviewMock = jest.fn(() => {
				throw new Error('ошибка');
			});
			service['findReviewByIdWithDetails'] = createReviewMock;
			await expect(service.findOne('qweqweqwe')).rejects.toThrow('увы');
		});

		it('should handle error when attempting to retrieve a review with an invalid ID', async () => {
			await expect(service.findOne('qweqweqwe')).rejects.toThrow(
				'Отзыв не найден для указанного продукта'
			);
		});

		it('should handle error when retrieving a review with decryption error', async () => {
			const mockReview = await prismaService.review.create({
				data: {
					userId: 'cln6bidhh0001uq2sxabfw3hu',
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					rating: 5,
					text: 'qwe'
				}
			});
			expect(mockReview).toBeDefined();
			const transactionMock = jest.spyOn(
				service['encryptionService'],
				'decrypt'
			);
			transactionMock.mockRejectedValue(new Error('ошибка'));
			await expect(service.findOne(mockReview.id)).rejects.toThrow('увы');
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});
	});

	describe('update', () => {
		it('should update user review with new text', async () => {
			const mockReview = await prismaService.review.create({
				data: {
					userId: 'cln6bidhh0001uq2sxabfw3hu',
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					rating: 5
				}
			});
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const mockDto: UpdateReviewsProductInput = {
				text: 'qweqweqweqwe',
				reviewId: mockReview.id
			};

			expect(mockReview).toBeDefined();
			expect(mockUser).toBeDefined();
			const transactionMock = jest.spyOn(
				service['encryptionService'],
				'encrypt'
			);
			transactionMock.mockResolvedValue('прпрп');
			const updatedUser = await service.update(mockUser, mockDto);

			expect(updatedUser.text).toBe('прпрп');
			expect(updatedUser.userId).toBe(mockReview.userId);
			expect(updatedUser.productId).toBe(mockReview.productId);
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when updating with an invalid reviewId', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const mockDto: UpdateReviewsProductInput = {
				text: 'qweqweqweqwe',
				reviewId: 'cln6bidhh0001uq2sxabfw3hq'
			};

			expect(mockUser).toBeDefined();

			await expect(service.update(mockUser, mockDto)).rejects.toThrow(
				'Отзыв не найден для указанного продукта'
			);
		});

		it('should throw an error when encryption fails during review update', async () => {
			const mockReview = await prismaService.review.create({
				data: {
					userId: 'cln6bidhh0001uq2sxabfw3hu',
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					rating: 5
				}
			});
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const mockDto: UpdateReviewsProductInput = {
				text: 'qweqweqweqwe',
				reviewId: mockReview.id
			};

			expect(mockReview).toBeDefined();
			expect(mockUser).toBeDefined();
			const transactionMock = jest.spyOn(
				service['encryptionService'],
				'encrypt'
			);
			transactionMock.mockRejectedValue(new Error('ошибка'));

			await expect(service.update(mockUser, mockDto)).rejects.toThrow('увы');
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when a non-admin user attempts to update a review', async () => {
			const mockReview = await prismaService.review.create({
				data: {
					userId: 'cln6bidhh0001uq2sxabfw3hu',
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					rating: 5
				}
			});
			const mockUser = await prismaService.user.create({
				data: { role: 'user' }
			});
			const mockDto: UpdateReviewsProductInput = {
				text: 'qweqweqweqwe',
				reviewId: mockReview.id
			};

			expect(mockReview).toBeDefined();
			expect(mockUser).toBeDefined();

			await expect(service.update(mockUser, mockDto)).rejects.toThrow(
				'Ошибка доступа'
			);
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
			await expect(
				prismaService.user.delete({ where: { id: mockUser.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when DTO validation fails during review update', async () => {
			const mockReview = await prismaService.review.create({
				data: {
					userId: 'cln6bidhh0001uq2sxabfw3hu',
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					rating: 5
				}
			});
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const mockDto: UpdateReviewsProductInput = {
				text: 'qweqweqweqwe',
				reviewId: mockReview.id
			};

			expect(mockReview).toBeDefined();
			expect(mockUser).toBeDefined();

			const transactionMock = jest.spyOn(
				service['validateService'],
				'validateDto'
			);
			transactionMock.mockRejectedValue(new Error('ошибка'));

			await expect(service.update(mockUser, mockDto)).rejects.toThrow('увы');
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});

		it('should reject update with the same text as the existing review', async () => {
			const mockReview = await prismaService.review.create({
				data: {
					userId: 'cln6bidhh0001uq2sxabfw3hu',
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					rating: 5,
					text: 'qweqweqweqwe'
				}
			});
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const mockDto: UpdateReviewsProductInput = {
				text: 'qweqweqweqwe',
				reviewId: mockReview.id
			};

			expect(mockReview).toBeDefined();
			expect(mockUser).toBeDefined();
			const transactionMock = jest.spyOn(
				service['encryptionService'],
				'encrypt'
			);
			transactionMock.mockResolvedValue('qweqweqweqwe');
			await expect(service.update(mockUser, mockDto)).rejects.toThrow(
				'Некорректный запрос. Обновление отзыва с тем же текстом не допускается.'
			);
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when DTO validation fails during review update with transaction mock', async () => {
			const mockReview = await prismaService.review.create({
				data: {
					userId: 'cln6bidhh0001uq2sxabfw3hu',
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					rating: 5
				}
			});
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const mockDto: UpdateReviewsProductInput = {
				text: 'qweqweqweqwe',
				reviewId: mockReview.id
			};

			expect(mockReview).toBeDefined();
			expect(mockUser).toBeDefined();

			const transactionMock = jest.spyOn(service['prisma'], '$transaction');
			transactionMock.mockRejectedValue(new Error('ошибка'));

			await expect(service.update(mockUser, mockDto)).rejects.toThrow('увы');
			const review = await prismaService.review.findUnique({
				where: { id: mockReview.id }
			});
			expect(review.text).toBeNull();
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when creating review with invalid data', async () => {
			const mockReview = await prismaService.review.create({
				data: {
					userId: 'cln6bidhh0001uq2sxabfw3hu',
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					rating: 5
				}
			});
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const mockDto: UpdateReviewsProductInput = {
				text: 'qweqweqweqwe',
				reviewId: mockReview.id
			};

			expect(mockReview).toBeDefined();
			expect(mockUser).toBeDefined();

			const createReviewMock = jest.fn(() => {
				throw new Error('ошибка');
			});
			service['updateReviewWithText'] = createReviewMock;

			await expect(service.update(mockUser, mockDto)).rejects.toThrow('увы');
			const review = await prismaService.review.findUnique({
				where: { id: mockReview.id }
			});
			expect(review.text).toBeNull();
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when updating review with invalid data', async () => {
			const mockReview = await prismaService.review.create({
				data: {
					userId: 'cln6bidhh0001uq2sxabfw3hu',
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					rating: 5
				}
			});
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const mockDto: UpdateReviewsProductInput = {
				text: 'qweqweqweqwe',
				reviewId: mockReview.id
			};

			expect(mockReview).toBeDefined();
			expect(mockUser).toBeDefined();

			const createReviewMock = jest.fn(() => {
				throw new Error('ошибка');
			});
			service['updateReview'] = createReviewMock;

			await expect(service.update(mockUser, mockDto)).rejects.toThrow('увы');
			const review = await prismaService.review.findUnique({
				where: { id: mockReview.id }
			});
			expect(review.text).toBeNull();
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});
	});

	describe('findAll', () => {
		it('should throw an error when non-admin user attempts to access reviews', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const mockReview = await prismaService.review.create({
				data: {
					userId: 'cln6bidhh0001uq2sxabfw3hu',
					productId: 'cln6fy9op0007uqn46m0x9tzc',
					rating: 5
				}
			});
			expect(mockReview).toBeDefined();
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				userId: mockUser.id
			};
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow(
				'Доступ запрещен. Только администраторы могут выполнять эту операцию.'
			);
			await expect(
				prismaService.review.delete({ where: { id: mockReview.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when processing invalid filter input', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				userId: mockUser.id
			};
			const createReviewMock = jest.fn(() => {
				throw new HttpException(
					'Некорректные параметры запроса',
					HttpStatus.BAD_REQUEST
				);
			});
			service['processReviewsFilterInput'] = createReviewMock;
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow();
		});

		it('should throw an error when user is not found', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				userId: 'cln6bidhh0001uq2sxabfw3hq'
			};
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow(
				'Пользователь не найден'
			);
		});

		it('should throw an error when product is not found', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				productId: 'cln6bidhh0001uq2sxabfw3hq'
			};
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow(
				'Продукт не найден'
			);
		});

		it('should throw an error when product retrieval fails', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			// expect(mockReview).toBeDefined();
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				productId: 'cln6bidhh0001uq2sxabfw3hq'
			};
			const createReviewMock = jest.fn(() => {
				throw new Error('ошибка');
			});
			service['findProductById'] = createReviewMock;
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow('увы');
		});

		it('should throw an error when user retrieval fails', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				userId: 'cln6bidhh0001uq2sxabfw3hq'
			};
			const createReviewMock = jest.fn(() => {
				throw new Error('ошибка');
			});
			service['findUserById'] = createReviewMock;
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow('увы');
		});

		it('should throw an error when both user and product are not found', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				userId: 'cln6bidhh0001uq2sxabfw3hq',
				productId: 'cln6bidhh0001uq2sxabfw3hq'
			};
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow();
		});

		it('should throw an error when requesting user data for a different user', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const moctSecondUser = await prismaService.user.create({
				data: { role: 'user' }
			});
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				userId: moctSecondUser.id
			};
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow(
				'Доступ запрещен. Только администраторы могут выполнять эту операцию.'
			);
			await expect(
				prismaService.user.delete({ where: { id: moctSecondUser.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when counting reviews for a user fails', async () => {
			const mockUser = await prismaService.user.create({
				data: { role: 'admin' }
			});
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				userId: mockUser.id
			};
			const createReviewMock = jest.fn(() => {
				throw new Error('ошибка');
			});
			service['countReviewsForUser'] = createReviewMock;
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow('увы');
			await expect(
				prismaService.user.delete({ where: { id: mockUser.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when user reviews count retrieval fails', async () => {
			const mockUser = await prismaService.user.create({
				data: { role: 'admin' }
			});
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				userId: mockUser.id
			};
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow(
				'Ошибка запроса, проверьте количество'
			);
			await expect(
				prismaService.user.delete({ where: { id: mockUser.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when counting reviews for a product fails', async () => {
			const mockUser = await prismaService.user.create({
				data: { role: 'admin' }
			});
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				productId: 'cln6gem960001uqswjsuf4ses'
			};
			const createReviewMock = jest.fn(() => {
				throw new Error('ошибка');
			});
			service['countReviewsForProduct'] = createReviewMock;
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow('увы');
			await expect(
				prismaService.user.delete({ where: { id: mockUser.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when counting reviews for a product fails during findAll', async () => {
			const mockUser = await prismaService.user.create({
				data: { role: 'admin' }
			});
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				productId: 'cln6gem960001uqswjsuf4ses'
			};
			const createReviewMock = jest.fn(async () => {});
			service['processReviewsAndCheckCount'] = createReviewMock;
			const createSecondReviewMock = jest.fn(() => {
				throw new Error('ошибка');
			});
			service['findAllReviews'] = createSecondReviewMock;
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow('увы');
			await expect(
				prismaService.user.delete({ where: { id: mockUser.id } })
			).resolves.not.toThrow();
		});

		it('should throw an error when counting reviews for a product fails and decrypting reviews fails', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const review = await prismaService.review.create({
				data: {
					userId: mockUser.id,
					text: 'qwqweqwe',
					productId: 'cln6gem960001uqswjsuf4ses',
					rating: 5
				}
			});
			expect(mockUser).toBeDefined();
			expect(review).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				productId: 'cln6gem960001uqswjsuf4ses'
			};
			const createReviewMock = jest.fn(async () => {});
			service['processReviewsAndCheckCount'] = createReviewMock;
			const createSecondReviewMock = jest.fn(() => {
				throw new Error('ошибка');
			});
			service['decryptAndReturnReviews'] = createSecondReviewMock;
			await expect(service.findAll(mockDto, mockUser)).rejects.toThrow('увы');
			await expect(
				prismaService.review.delete({ where: { id: review.id } })
			).resolves.not.toThrow();
		});

		it('should retrieve reviews for a product successfully', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const review = await prismaService.review.create({
				data: {
					userId: mockUser.id,
					text: 'qwqw4545454545454545eqwe',
					productId: 'cln6gem960001uqswjsuf4ses',
					rating: 5
				}
			});
			expect(review).toBeDefined();
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				productId: 'cln6gem960001uqswjsuf4ses',
				text: 'true'
			};
			const createReviewMock = jest.fn(async () => {});
			service['processReviewsAndCheckCount'] = createReviewMock;
			const reviews = await service.findAll(mockDto, mockUser);
			expect(Array.isArray(reviews)).toBe(true);
			expect(reviews.length).toBe(1);
			expect(reviews[0]).toEqual(expect.any(Object));
			// await expect(service.findAll(mockDto, mockUser)).resolves.not.toThrow();
			await expect(
				prismaService.review.delete({ where: { id: review.id } })
			).resolves.not.toThrow();
		});

		it('should retrieve no reviews for a product when "text" is set to "false"', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const review = await prismaService.review.create({
				data: {
					userId: mockUser.id,
					text: 'qwqw4545454545454545eqwe',
					productId: 'cln6gem960001uqswjsuf4ses',
					rating: 5
				}
			});
			expect(review).toBeDefined();
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				productId: 'cln6gem960001uqswjsuf4ses',
				text: 'false'
			};
			const createReviewMock = jest.fn(async () => {});
			service['processReviewsAndCheckCount'] = createReviewMock;
			const reviews = await service.findAll(mockDto, mockUser);
			expect(Array.isArray(reviews)).toBe(true);
			expect(reviews.length).toBe(0);
			// await expect(service.findAll(mockDto, mockUser)).resolves.not.toThrow();
			await expect(
				prismaService.review.delete({ where: { id: review.id } })
			).resolves.not.toThrow();
		});

		it('should retrieve no reviews with images for a product when "image" is set to "true"', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const review = await prismaService.review.create({
				data: {
					userId: mockUser.id,
					text: 'qwqw4545454545454545eqwe',
					productId: 'cln6gem960001uqswjsuf4ses',
					rating: 5
				}
			});
			expect(review).toBeDefined();
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				productId: 'cln6gem960001uqswjsuf4ses',
				image: 'true'
			};
			const createReviewMock = jest.fn(async () => {});
			service['processReviewsAndCheckCount'] = createReviewMock;
			const reviews = await service.findAll(mockDto, mockUser);
			expect(Array.isArray(reviews)).toBe(true);
			expect(reviews.length).toBe(0);
			await expect(
				prismaService.review.delete({ where: { id: review.id } })
			).resolves.not.toThrow();
		});

		it('should retrieve reviews with images for a product', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const review = await prismaService.review.create({
				data: {
					userId: mockUser.id,
					text: 'qwqw4545454545454545eqwe',
					productId: 'cln6gem960001uqswjsuf4ses',
					rating: 5,
					image: ['qweqwe', 'qweqweqwe']
				}
			});
			expect(review).toBeDefined();
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				productId: 'cln6gem960001uqswjsuf4ses'
			};
			const createReviewMock = jest.fn(async () => {});
			service['processReviewsAndCheckCount'] = createReviewMock;
			const reviews = await service.findAll(mockDto, mockUser);
			expect(Array.isArray(reviews)).toBe(true);
			expect(reviews.length).toBe(1);
			expect(reviews[0]).toEqual(expect.any(Object));
			await expect(
				prismaService.review.delete({ where: { id: review.id } })
			).resolves.not.toThrow();
		});

		it('should retrieve reviews with images for a product when "text" and "image" are set to "true"', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const review = await prismaService.review.create({
				data: {
					userId: mockUser.id,
					text: 'qwqw4545454545454545eqwe',
					productId: 'cln6gem960001uqswjsuf4ses',
					rating: 5,
					image: ['qweqwe', 'qweqweqwe']
				}
			});
			expect(review).toBeDefined();
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				productId: 'cln6gem960001uqswjsuf4ses',
				text: 'true',
				image: 'true'
			};
			const createReviewMock = jest.fn(async () => {});
			service['processReviewsAndCheckCount'] = createReviewMock;
			const reviews = await service.findAll(mockDto, mockUser);
			expect(Array.isArray(reviews)).toBe(true);
			expect(reviews.length).toBe(1);
			expect(reviews[0]).toEqual(expect.any(Object));
			await expect(
				prismaService.review.delete({ where: { id: review.id } })
			).resolves.not.toThrow();
		});

		it('should retrieve no reviews for a product when "text" and "image" are set to "false"', async () => {
			const mockUser = await prismaService.user.findUnique({
				where: { id: 'cln6bidhh0001uq2sxabfw3hu' }
			});
			const review = await prismaService.review.create({
				data: {
					userId: mockUser.id,
					text: 'qwqw4545454545454545eqwe',
					productId: 'cln6gem960001uqswjsuf4ses',
					rating: 5,
					image: ['qweqwe', 'qweqweqwe']
				}
			});
			expect(review).toBeDefined();
			expect(mockUser).toBeDefined();
			const mockDto = {
				page: 1,
				pageSize: 1,
				productId: 'cln6gem960001uqswjsuf4ses',
				text: 'false',
				image: 'false'
			};
			const createReviewMock = jest.fn(async () => {});
			service['processReviewsAndCheckCount'] = createReviewMock;
			const reviews = await service.findAll(mockDto, mockUser);
			expect(Array.isArray(reviews)).toBe(true);
			expect(reviews.length).toBe(0);
			await expect(
				prismaService.review.delete({ where: { id: review.id } })
			).resolves.not.toThrow();
		});
	});
});
