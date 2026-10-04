import Router from '@koa/router';
import { Filter } from '../../adapter/assignment-3';
import { getDatabase } from '../db';
import { Filter as MongoFilter, ObjectId } from 'mongodb';

const listRouter = new Router();

interface BookDocument {
  _id: ObjectId;
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

interface BookWithId {
  id: string;
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

listRouter.get('/books', async (ctx) => {
  const filters = ctx.query.filters as Filter[] | undefined;

  try {
    let bookList: BookWithId[];

    if (filters && Array.isArray(filters) && filters.length > 0) {
      if (!validateFilters(filters)) {
        ctx.status = 400;
        ctx.body = { error: 'Invalid filters. Check that price range values are valid numbers and from <= to.' };
        return;
      }

      bookList = await getBooksFromDatabaseWithFilters(filters);
    } else {
      bookList = await getBooksFromDatabase();
    }

    ctx.body = bookList;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: `Failed to fetch books due to: ${error}` };
  }
});

function validateFilters(filters: Filter[]): boolean {
  if (!filters || !Array.isArray(filters)) {
    return false;
  }

  return filters.every(filter => {
    const from = filter.from;
    const to = filter.to;

    // If from is provided, it must be a valid number
    if (from !== undefined && (typeof from !== 'number' || isNaN(from))) {
      return false;
    }

    // If to is provided, it must be a valid number
    if (to !== undefined && (typeof to !== 'number' || isNaN(to))) {
      return false;
    }

    // If both are provided, from must be <= to
    if (from !== undefined && to !== undefined && from > to) {
      return false;
    }

    return true;
  });
}

async function getBooksFromDatabase(): Promise<BookWithId[]> {
  const db = getDatabase();
  const books = await db.collection<BookDocument>('books').find({}).toArray();
  return books.map(doc => ({
    id: doc._id.toString(),
    name: doc.name,
    author: doc.author,
    description: doc.description,
    price: doc.price,
    image: doc.image
  }));
}

async function getBooksFromDatabaseWithFilters(filters: Filter[]): Promise<BookWithId[]> {
  const db = getDatabase();

  // Build MongoDB query from filters
  // Multiple filters = OR (any match)
  // Within single filter = AND (all conditions)
  const filterConditions: MongoFilter<BookDocument>[] = filters.map(filter => {
    const conditions: MongoFilter<BookDocument>[] = [];

    // Price range filtering
    if (filter.from !== undefined) {
      conditions.push({ price: { $gte: filter.from } });
    }
    if (filter.to !== undefined) {
      conditions.push({ price: { $lte: filter.to } });
    }

    // Name filtering (case-insensitive substring match)
    if (filter.name !== undefined && filter.name.trim() !== '') {
      conditions.push({ name: { $regex: filter.name, $options: 'i' } });
    }

    // Author filtering (case-insensitive substring match)
    if (filter.author !== undefined && filter.author.trim() !== '') {
      conditions.push({ author: { $regex: filter.author, $options: 'i' } });
    }

    // If no conditions, return empty object (matches all)
    if (conditions.length === 0) {
      return {};
    }

    // Within a single filter, all conditions must match (AND)
    return { $and: conditions };
  });

  // If multiple filters, any one matching is enough (OR)
  const query: MongoFilter<BookDocument> = filterConditions.length > 1
    ? { $or: filterConditions }
    : filterConditions[0] || {};

  const books = await db.collection<BookDocument>('books').find(query).toArray();

  return books.map(doc => ({
    id: doc._id.toString(),
    name: doc.name,
    author: doc.author,
    description: doc.description,
    price: doc.price,
    image: doc.image
  }));
}

export default listRouter;
