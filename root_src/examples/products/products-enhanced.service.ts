import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DatabaseService } from '../../src/database/database.service';
import {
  PaginationHelper,
  PaginatedResponse,
} from '../../src/common/dto/pagination.dto';
import {
  ProductDto,
  PaginationQueryDto,
} from '../../src/domains/products/dto/product.dto';

@Injectable()
export class ProductsServiceEnhanced {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Enhanced findAll with full-text search capabilities
   * This is an alternative implementation showcasing MySQL FULLTEXT search
   */
  async findAllWithFullTextSearch(
    paginationQuery: PaginationQueryDto,
    lang?: string,
  ): Promise<PaginatedResponse<ProductDto>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'DESC',
      search,
      category,
    } = paginationQuery;

    // Validate sortBy field to prevent SQL injection
    const allowedSortFields = [
      'id',
      'name',
      'description',
      'price',
      'stock_quantity',
      'category',
      'created_at',
      'updated_at',
    ];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    const offset = PaginationHelper.calculateOffset(page, limit);

    // Build base query
    let query = this.databaseService.getKnex()('products');
    let countQuery = this.databaseService.getKnex()('products');

    // Apply search filter with full-text search when available
    if (search) {
      // Check if we should use FULLTEXT search (MySQL specific)
      const useFullTextSearch = this.shouldUseFullTextSearch(search);

      if (useFullTextSearch) {
        // Use MySQL FULLTEXT search for better performance and relevance
        const searchFilter = (builder: any) => {
          builder.whereRaw(
            'MATCH(name, description) AGAINST(? IN BOOLEAN MODE)',
            [`*${search}*`],
          );
        };
        query = query.where(searchFilter);
        countQuery = countQuery.where(searchFilter);
      } else {
        // Fallback to LIKE search
        const searchFilter = (builder: any) => {
          builder
            .where('name', 'LIKE', `%${search}%`)
            .orWhere('description', 'LIKE', `%${search}%`);
        };
        query = query.where(searchFilter);
        countQuery = countQuery.where(searchFilter);
      }
    }

    if (category) {
      query = query.where('category', 'LIKE', `%${category}%`);
      countQuery = countQuery.where('category', 'LIKE', `%${category}%`);
    }

    // Get total count
    const [{ count }] = await countQuery.count('* as count');
    const totalItems = parseInt(count as string, 10);

    // Apply sorting and pagination
    let finalQuery = query.select('*').limit(limit).offset(offset);

    // Add relevance scoring for full-text search
    if (search && this.shouldUseFullTextSearch(search)) {
      finalQuery = finalQuery
        .select('*')
        .select(
          this.databaseService
            .getKnex()
            .raw(
              'MATCH(name, description) AGAINST(? IN BOOLEAN MODE) as relevance_score',
              [`*${search}*`],
            ),
        )
        .orderBy('relevance_score', 'desc')
        .orderBy(safeSortBy, sortOrder.toLowerCase() as 'asc' | 'desc');
    } else {
      finalQuery = finalQuery.orderBy(
        safeSortBy,
        sortOrder.toLowerCase() as 'asc' | 'desc',
      );
    }

    const products = await finalQuery;

    // Calculate pagination metadata using helper
    const pagination = PaginationHelper.calculatePagination(
      page,
      limit,
      totalItems,
    );

    return {
      data: products,
      pagination,
      message: this.i18n.t('products.listed', { lang }),
    };
  }

  /**
   * Determines if full-text search should be used based on search term characteristics
   */
  private shouldUseFullTextSearch(search: string): boolean {
    // Use full-text search for longer search terms or multiple words
    // This is more effective for natural language queries
    return search.length >= 3 && (search.includes(' ') || search.length >= 5);
  }

  /**
   * Advanced search with multiple search modes
   */
  async advancedSearch(
    searchTerm: string,
    searchMode: 'exact' | 'fuzzy' | 'fulltext' = 'fulltext',
    paginationQuery: PaginationQueryDto,
    lang?: string,
  ): Promise<PaginatedResponse<ProductDto>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'DESC',
      category,
    } = paginationQuery;

    const allowedSortFields = [
      'id',
      'name',
      'description',
      'price',
      'stock_quantity',
      'category',
      'created_at',
      'updated_at',
    ];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    const offset = PaginationHelper.calculateOffset(page, limit);

    let query = this.databaseService.getKnex()('products');
    let countQuery = this.databaseService.getKnex()('products');

    // Apply search based on mode
    switch (searchMode) {
      case 'exact': {
        const exactFilter = (builder: any) => {
          builder
            .where('name', '=', searchTerm)
            .orWhere('description', '=', searchTerm);
        };
        query = query.where(exactFilter);
        countQuery = countQuery.where(exactFilter);
        break;
      }

      case 'fuzzy': {
        // Implement fuzzy search using SOUNDEX or similar functions
        const fuzzyFilter = (builder: any) => {
          builder
            .where('name', 'LIKE', `%${searchTerm}%`)
            .orWhere('description', 'LIKE', `%${searchTerm}%`)
            .orWhereRaw('SOUNDEX(name) = SOUNDEX(?)', [searchTerm])
            .orWhereRaw('SOUNDEX(description) = SOUNDEX(?)', [searchTerm]);
        };
        query = query.where(fuzzyFilter);
        countQuery = countQuery.where(fuzzyFilter);
        break;
      }

      case 'fulltext':
      default:
        if (this.shouldUseFullTextSearch(searchTerm)) {
          const fullTextFilter = (builder: any) => {
            builder.whereRaw(
              'MATCH(name, description) AGAINST(? IN BOOLEAN MODE)',
              [`*${searchTerm}*`],
            );
          };
          query = query.where(fullTextFilter);
          countQuery = countQuery.where(fullTextFilter);
        } else {
          const likeFilter = (builder: any) => {
            builder
              .where('name', 'LIKE', `%${searchTerm}%`)
              .orWhere('description', 'LIKE', `%${searchTerm}%`);
          };
          query = query.where(likeFilter);
          countQuery = countQuery.where(likeFilter);
        }
        break;
    }

    if (category) {
      query = query.where('category', 'LIKE', `%${category}%`);
      countQuery = countQuery.where('category', 'LIKE', `%${category}%`);
    }

    const [{ count }] = await countQuery.count('* as count');
    const totalItems = parseInt(count as string, 10);

    const products = await query
      .select('*')
      .orderBy(safeSortBy, sortOrder.toLowerCase() as 'asc' | 'desc')
      .limit(limit)
      .offset(offset);

    const pagination = PaginationHelper.calculatePagination(
      page,
      limit,
      totalItems,
    );

    return {
      data: products,
      pagination,
      message: this.i18n.t('products.listed', { lang }),
    };
  }

  /**
   * Get search suggestions based on existing product data
   */
  async getSearchSuggestions(
    partial: string,
    limit: number = 5,
  ): Promise<string[]> {
    if (!partial || partial.length < 2) {
      return [];
    }

    const suggestions = await this.databaseService
      .getKnex()('products')
      .distinct('name')
      .where('name', 'LIKE', `%${partial}%`)
      .limit(limit)
      .pluck('name');

    return suggestions;
  }

  /**
   * Get popular search terms (could be implemented with analytics tracking)
   */
  async getPopularSearchTerms(limit: number = 10): Promise<string[]> {
    // This would require a search_analytics table to track search terms
    // For now, return some mock popular terms
    return [
      'electronics',
      'books',
      'clothing',
      'home',
      'sports',
      'toys',
      'beauty',
      'automotive',
      'garden',
      'health',
    ].slice(0, limit);
  }
}
